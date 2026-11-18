import {
  fetchPrivateDocument,
  handleRequest,
  hashText,
  jsonResponse,
  matchesFileSignature,
  restRequest,
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
  const token = requiredString(input.customer_token, "Order access token", 200);
  const order = await verifyCustomerToken(orderId, token);
  if (order.status !== "AWAITING_UPLOAD") throw new RequestError(409, "The order is not waiting for a document.");
  if (new Date(String(order.expires_at)).getTime() <= Date.now()) {
    throw new RequestError(409, "This test order has expired.");
  }

  const file = await fetchPrivateDocument(String(order.document_path));
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (
    bytes.length !== Number(order.file_size_bytes) ||
    bytes.length > 2_621_440 ||
    !matchesFileSignature(bytes, String(order.file_mime_type))
  ) {
    throw new RequestError(400, "Uploaded document size or file signature does not match the test order.");
  }

  const tokenHash = await hashText(token);
  const confirmationTime = new Date().toISOString();
  const updated = await restRequest(
    `/rest/v1/test_orders?id=eq.${encodeURIComponent(orderId)}&customer_token_hash=eq.${tokenHash}&status=eq.AWAITING_UPLOAD&expires_at=gt.${encodeURIComponent(confirmationTime)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        status: "AWAITING_PAYMENT",
        file_size_bytes: bytes.length,
        updated_at: confirmationTime,
      }),
    },
  );
  if (!updated.ok) throw new RequestError(502, "The uploaded test document could not be confirmed.");
  const rows = await updated.json() as Array<Record<string, unknown>>;
  if (!rows.length) throw new RequestError(409, "The test order changed while confirming its document.");
  return jsonResponse({ order_id: orderId, status: "AWAITING_PAYMENT", test_mode: true });
});
