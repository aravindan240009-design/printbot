import {
  getRazorpayTestCredentials,
  handleRequest,
  jsonResponse,
  restRequest,
  requireMethod,
  requiredString,
  RequestError,
  verifyCustomerToken,
} from "../_shared/test_checkout.ts";

async function setReconciliationRequired(orderId: string): Promise<void> {
  const response = await restRequest(
    `/rest/v1/test_orders?id=eq.${encodeURIComponent(orderId)}&status=eq.CREATING_PAYMENT`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "RECONCILIATION_REQUIRED",
        updated_at: new Date().toISOString(),
      }),
    },
  );
  if (!response.ok) {
    console.error("Could not mark uncertain test payment-order creation for reconciliation.", response.status);
  }
}

async function releasePaymentOrderClaim(orderId: string): Promise<void> {
  const response = await restRequest(
    `/rest/v1/test_orders?id=eq.${encodeURIComponent(orderId)}&status=eq.CREATING_PAYMENT`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "AWAITING_PAYMENT",
        updated_at: new Date().toISOString(),
      }),
    },
  );
  if (!response.ok) {
    console.error("Could not release a rejected test payment-order claim.", response.status);
    await setReconciliationRequired(orderId);
  }
}

handleRequest(async (request) => {
  requireMethod(request, "POST");
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new RequestError(400, "Request body must be valid JSON.");
  }
  const input = body as Record<string, unknown>;
  const orderId = requiredString(input.order_id, "Test order ID", 64);
  const customerToken = requiredString(input.customer_token, "Order access token", 200);
  const order = await verifyCustomerToken(orderId, customerToken);
  if (order.status !== "AWAITING_PAYMENT") {
    throw new RequestError(409, "The test order is not ready for payment.");
  }
  if (new Date(String(order.expires_at)).getTime() <= Date.now()) {
    throw new RequestError(409, "This test payment order has expired.");
  }

  const credentials = getRazorpayTestCredentials();
  const storedGatewayOrderId = order.razorpay_order_id;
  if (typeof storedGatewayOrderId === "string" && storedGatewayOrderId) {
    return jsonResponse({
      key_id: credentials.keyId,
      razorpay_order_id: storedGatewayOrderId,
      amount_paise: order.amount_paise,
      currency: order.currency,
      test_mode: true,
    });
  }

  const claim = await restRequest(
    `/rest/v1/test_orders?id=eq.${encodeURIComponent(orderId)}&status=eq.AWAITING_PAYMENT&razorpay_order_id=is.null`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: "CREATING_PAYMENT",
        updated_at: new Date().toISOString(),
      }),
    },
  );
  if (!claim.ok) throw new RequestError(502, "The test payment order could not be started.");
  let claimed: Array<Record<string, unknown>>;
  try {
    claimed = await claim.json() as Array<Record<string, unknown>>;
  } catch {
    await setReconciliationRequired(orderId);
    throw new RequestError(502, "The test payment order could not be claimed safely.");
  }
  if (!Array.isArray(claimed)) {
    await setReconciliationRequired(orderId);
    throw new RequestError(502, "The test payment order claim response was invalid.");
  }
  if (claimed.length !== 1) {
    throw new RequestError(409, "Another request is already preparing this test payment.");
  }

  let gatewayResponse: Response;
  try {
    gatewayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${credentials.keyId}:${credentials.keySecret}`)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        amount: Number(order.amount_paise),
        currency: String(order.currency),
        receipt: orderId,
        notes: { test_order_id: orderId, test_mode: "true" },
      }),
    });
  } catch {
    await setReconciliationRequired(orderId);
    throw new RequestError(502, "Razorpay could not confirm whether the test payment order was created.");
  }
  if (!gatewayResponse.ok) {
    console.error("Razorpay rejected test order creation.", gatewayResponse.status);
    if (gatewayResponse.status < 500) await releasePaymentOrderClaim(orderId);
    else await setReconciliationRequired(orderId);
    throw new RequestError(502, "Razorpay could not create the test payment order.");
  }

  let gatewayOrder: Record<string, unknown>;
  try {
    gatewayOrder = await gatewayResponse.json() as Record<string, unknown>;
  } catch {
    await setReconciliationRequired(orderId);
    throw new RequestError(502, "Razorpay returned an invalid test payment order.");
  }
  if (
    typeof gatewayOrder.id !== "string" ||
    gatewayOrder.status !== "created" ||
    gatewayOrder.amount !== Number(order.amount_paise) ||
    gatewayOrder.currency !== order.currency
  ) {
    await setReconciliationRequired(orderId);
    throw new RequestError(502, "Razorpay returned an invalid test payment order.");
  }

  let saved: Response;
  try {
    saved = await restRequest(
      `/rest/v1/test_orders?id=eq.${encodeURIComponent(orderId)}&status=eq.CREATING_PAYMENT`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          status: "AWAITING_PAYMENT",
          razorpay_order_id: gatewayOrder.id,
          updated_at: new Date().toISOString(),
        }),
      },
    );
  } catch {
    await setReconciliationRequired(orderId);
    throw new RequestError(502, "The test payment order could not be recorded.");
  }
  if (!saved.ok) {
    await setReconciliationRequired(orderId);
    throw new RequestError(502, "The test payment order could not be recorded.");
  }
  const savedRows = await saved.json() as Array<Record<string, unknown>>;
  if (savedRows.length !== 1) {
    await setReconciliationRequired(orderId);
    throw new RequestError(409, "The test payment order changed while it was being recorded.");
  }

  return jsonResponse({
    key_id: credentials.keyId,
    razorpay_order_id: gatewayOrder.id,
    amount_paise: gatewayOrder.amount,
    currency: gatewayOrder.currency,
    test_mode: true,
  });
});
