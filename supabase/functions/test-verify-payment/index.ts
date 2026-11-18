import {
  constantTimeEqual,
  getRazorpayPayment,
  getRazorpayTestCredentials,
  handleRequest,
  hashText,
  hmacSha256Hex,
  jsonResponse,
  normalizeHex,
  restJson,
  requireMethod,
  requiredString,
  RequestError,
  verifyCustomerToken,
} from "../_shared/test_checkout.ts";

handleRequest(async (request) => {
  requireMethod(request, "POST");
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new RequestError(400, "Request body must be valid JSON.");
  }
  const input = body as Record<string, unknown>;
  const orderId = requiredString(input.order_id, "Test order ID", 64);
  const customerToken = requiredString(input.customer_token, "Order access token", 200);
  const paymentId = requiredString(input.razorpay_payment_id, "Razorpay payment ID", 100);
  const gatewayOrderId = requiredString(input.razorpay_order_id, "Razorpay order ID", 100);
  const signature = requiredString(input.razorpay_signature, "Razorpay checkout signature", 128);
  const order = await verifyCustomerToken(orderId, customerToken);
  if (order.status !== "AWAITING_PAYMENT") {
    if (order.status === "PAID") return jsonResponse({ order_id: orderId, status: "PAID", test_mode: true });
    throw new RequestError(409, "The test order is not awaiting payment.");
  }
  if (order.razorpay_order_id !== gatewayOrderId) {
    throw new RequestError(400, "Razorpay order does not match the test order.");
  }

  const credentials = getRazorpayTestCredentials();
  const expectedSignature = await hmacSha256Hex(
    credentials.keySecret,
    `${gatewayOrderId}|${paymentId}`,
  );
  if (!constantTimeEqual(expectedSignature, normalizeHex(signature))) {
    throw new RequestError(400, "Razorpay payment signature is invalid.");
  }

  const payment = await getRazorpayPayment(paymentId);
  if (
    payment.id !== paymentId ||
    payment.order_id !== gatewayOrderId ||
    Number(payment.amount) !== Number(order.amount_paise) ||
    payment.currency !== order.currency
  ) {
    throw new RequestError(400, "Razorpay payment does not match the test order.");
  }
  const captured = payment.status === "captured" && payment.captured === true;
  if (!captured && new Date(String(order.expires_at)).getTime() > Date.now()) {
    throw new RequestError(409, "Razorpay has not captured this test payment.");
  }

  const eventBodyHash = await hashText(JSON.stringify({
    order_id: orderId,
    gateway_order_id: gatewayOrderId,
    payment_id: paymentId,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
  }));
  const result = await restJson<Array<{ order_status: string; event_duplicate: boolean }>>(
    "/rest/v1/rpc/finalize_test_payment",
    {
      method: "POST",
      body: JSON.stringify({
        p_order_id: orderId,
        p_gateway_event_id: `checkout:${paymentId}`,
        p_event_type: captured ? "checkout.verified" : "checkout.expired",
        p_body_sha256: eventBodyHash,
        p_razorpay_order_id: gatewayOrderId,
        p_razorpay_payment_id: paymentId,
        p_amount_paise: Number(payment.amount),
        p_currency: String(payment.currency),
        p_captured: captured,
      }),
    },
  );
  const status = result[0]?.order_status;
  if (status === "PAID") return jsonResponse({ order_id: orderId, status, test_mode: true });
  if (status === "RECONCILIATION_REQUIRED") {
    return jsonResponse({
      order_id: orderId,
      status,
      detail: "Payment was received after the test order expired and requires reconciliation.",
      test_mode: true,
    }, 409);
  }
  throw new RequestError(409, "The test payment was not captured before the order expired.");
});
