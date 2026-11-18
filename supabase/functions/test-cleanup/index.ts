import {
  deletePrivateDocuments,
  handleRequest,
  jsonResponse,
  requireMembership,
  requireMethod,
  restJson,
  restRequest,
  RequestError,
} from "../_shared/test_checkout.ts";

handleRequest(async (request) => {
  requireMethod(request, "POST");
  const membership = await requireMembership(request, "admin");
  const cutoff = new Date().toISOString();
  const query = new URLSearchParams({
    select: "id,document_path",
    shop_id: `eq.${membership.shopId}`,
    retention_expires_at: `lt.${cutoff}`,
    limit: "100",
  });
  const expired = await restJson<Array<{ id: string; document_path: string }>>(
    `/rest/v1/test_orders?${query.toString()}`,
  );
  if (!Array.isArray(expired)) throw new RequestError(502, "The test cleanup query was invalid.");
  if (expired.length === 0) return jsonResponse({ deleted_orders: 0, deleted_documents: 0, test_mode: true });

  const paths = expired.map((order) => order.document_path);
  await deletePrivateDocuments(paths);
  const ids = expired.map((order) => order.id);
  const deleteResponse = await restRequest(
    `/rest/v1/test_orders?id=in.(${ids.map(encodeURIComponent).join(",")})&shop_id=eq.${encodeURIComponent(membership.shopId)}&retention_expires_at=lt.${encodeURIComponent(cutoff)}`,
    { method: "DELETE", headers: { Prefer: "return=representation" } },
  );
  if (!deleteResponse.ok) throw new RequestError(502, "Expired test order records could not be cleaned up.");
  const deletedRows = await deleteResponse.json() as Array<{ id: string }>;
  return jsonResponse({
    deleted_orders: deletedRows.length,
    deleted_documents: paths.length,
    test_mode: true,
  });
});
