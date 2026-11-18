import {
  constantTimeEqual,
  getRazorpayTestCredentials,
  getSingleRow,
  handleRequest,
  hashText,
  hmacSha256Hex,
  isRecord,
  jsonResponse,
  normalizeHex,
  restJson,
  RequestError,
} from "../_shared/test_checkout.ts";

handleRequest(async (request) => {
  if (request.method !== "POST") throw new RequestError(405, "Only POST is supported.");
  const credentials = getRazorpayTestCredentials(true);
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) throw new RequestError(400, "Razorpay webhook signature is missing.");

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 1_048_576) throw new RequestError(413, "Razorpay webhook payload is too large.");
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).length > 1_048_576) {
    throw new RequestError(413, "Razorpay webhook payload is too large.");
  }
  const expected = await hmacSha256Hex(String(credentials.webhookSecret), rawBody);
  if (!constantTimeEqual(expected, normalizeHex(signature))) {
    throw new RequestError(400, "Razorpay webhook signature is invalid.");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new RequestError(400, "Razorpay webhook payload is invalid.");
  }
  if (!isRecord(payload) || !isRecord(payload.payload) || !isRecord(payload.payload.payment) ||
      !isRecord(payload.payload.payment.entity)) {
    throw new RequestError(400, "Razorpay webhook payload is incomplete.");
  }
  const eventType = payload.event;
  if (eventType !== "payment.captured" && eventType !== "payment.failed") {
    return jsonResponse({ received: true, ignored: true, test_mode: true });
  }
  const payment = payload.payload.payment.entity;
  const paymentId = payment.id;
  const gatewayOrderId = payment.order_id;
  const amountPaise = payment.amount;
  const currency = payment.currency;
  if (
    typeof paymentId !== "string" ||
    typeof gatewayOrderId !== "string" ||
    !Number.isSafeInteger(amountPaise) ||
    typeof currency !== "string"
  ) {
    throw new RequestError(400, "Razorpay webhook payment details are invalid.");
  }
  const captured = eventType === "payment.captured" &&
    payment.status === "captured" &&
    payment.captured === true;
  if (eventType === "payment.captured" && !captured) {
    throw new RequestError(400, "Razorpay webhook does not contain a captured payment.");
  }

  const order = await getSingleRow<Record<string, unknown>>("test_orders", {
    razorpay_order_id: `eq.${gatewayOrderId}`,
  }, "id,razorpay_order_id,amount_paise,currency");
  if (!order || typeof order.id !== "string") {
    throw new RequestError(404, "Razorpay webhook does not match a test order.");
  }
  const eventId = request.headers.get("x-razorpay-event-id") || `sha256:${await hashText(rawBody)}`;
  if (eventId.length > 200) throw new RequestError(400, "Razorpay webhook event ID is invalid.");
  const result = await restJson<Array<{ order_status: string; event_duplicate: boolean }>>(
    "/rest/v1/rpc/finalize_test_payment",
    {
      method: "POST",
      body: JSON.stringify({
        p_order_id: order.id,
        p_gateway_event_id: eventId,
        p_event_type: eventType,
        p_body_sha256: await hashText(rawBody),
        p_razorpay_order_id: gatewayOrderId,
        p_razorpay_payment_id: paymentId,
        p_amount_paise: amountPaise,
        p_currency: currency,
        p_captured: captured,
      }),
    },
  );
  if (!result[0]) throw new RequestError(502, "Razorpay webhook processing did not return an order state.");
  return jsonResponse({
    received: true,
    status: result[0].order_status,
    duplicate: result[0].event_duplicate,
    test_mode: true,
  });
});
