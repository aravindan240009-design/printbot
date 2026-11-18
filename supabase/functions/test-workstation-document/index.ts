import {
  fetchPrivateDocument,
  getSingleRow,
  handleRequest,
  requireMembership,
  requireMethod,
  RequestError,
  responseHeaders,
} from "../_shared/test_checkout.ts";

handleRequest(async (request) => {
  requireMethod(request, "GET");
  const membership = await requireMembership(request);
  const orderId = new URL(request.url).searchParams.get("order_id");
  if (!orderId) throw new RequestError(400, "A test order ID is required.");
  const order = await getSingleRow<Record<string, unknown>>("test_orders", {
    id: `eq.${orderId}`,
    shop_id: `eq.${membership.shopId}`,
    status: "eq.PAID",
  }, "document_path,file_name,file_mime_type");
  if (!order || typeof order.document_path !== "string") {
    throw new RequestError(404, "The paid test document was not found.");
  }

  const document = await fetchPrivateDocument(order.document_path);
  const headers = new Headers(responseHeaders());
  headers.set("Content-Type", String(order.file_mime_type));
  headers.set("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(String(order.file_name))}`);
  headers.set("Cache-Control", "no-store, private");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  return new Response(document.body, { status: 200, headers });
});
