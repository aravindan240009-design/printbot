import {
  handleRequest,
  jsonResponse,
  requireMembership,
  requireMethod,
  restJson,
  RequestError,
} from "../_shared/test_checkout.ts";

handleRequest(async (request) => {
  requireMethod(request, "GET");
  const membership = await requireMembership(request);
  const query = new URLSearchParams({
    select: "id,file_name,file_mime_type,file_size_bytes,page_count,options,amount_paise,currency,status,created_at,paid_at",
    shop_id: `eq.${membership.shopId}`,
    status: "eq.PAID",
    order: "paid_at.desc",
    limit: "100",
  });
  const orders = await restJson<Array<Record<string, unknown>>>(`/rest/v1/test_orders?${query.toString()}`);
  if (!Array.isArray(orders)) throw new RequestError(502, "The test workstation queue response was invalid.");
  return jsonResponse({ orders, test_mode: true, printing_enabled: false });
});
