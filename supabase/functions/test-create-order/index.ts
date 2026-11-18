import {
  calculateQuote,
  normalizeQuoteOptions,
} from "../_shared/pricing.ts";
import {
  createSignedUploadToken,
  getTestShop,
  handleRequest,
  hashText,
  isRecord,
  jsonResponse,
  ratesFromShop,
  restJson,
  requireMethod,
  requiredString,
  RequestError,
} from "../_shared/test_checkout.ts";

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isRecord(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new RequestError(400, "Order data contains an invalid value.");
  return serialized;
}

handleRequest(async (request) => {
  requireMethod(request, "POST");
  const body = await request.json().catch(() => null);
  if (!isRecord(body)) throw new RequestError(400, "Request body must be valid JSON.");

  const shopSlug = requiredString(body.shop_slug, "Shop link", 100).toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(shopSlug)) {
    throw new RequestError(400, "Shop link is invalid.");
  }
  const idempotencyKey = requiredString(body.idempotency_key, "Request idempotency key", 100);
  const customerToken = requiredString(body.customer_token, "Order access token", 200);
  if (customerToken.length < 32) throw new RequestError(400, "Order access token is invalid.");
  if (!Number.isInteger(body.page_count) || Number(body.page_count) < 1 || Number(body.page_count) > 5000) {
    throw new RequestError(400, "Document page count is invalid.");
  }
  const fileName = requiredString(body.file_name, "File name", 180).replace(/[\\/\u0000-\u001f]/g, "_");
  const mimeType = requiredString(body.file_mime_type, "Document type", 80);
  if (!["application/pdf", "image/jpeg", "image/png"].includes(mimeType)) {
    throw new RequestError(400, "Only PDF, JPG, and PNG test documents are supported.");
  }
  if (!Number.isSafeInteger(body.file_size_bytes) || Number(body.file_size_bytes) < 1 || Number(body.file_size_bytes) > 2_621_440) {
    throw new RequestError(400, "Test documents must be no larger than 2.5 MB.");
  }

  const shop = await getTestShop(shopSlug);
  const options = normalizeQuoteOptions(body.options);
  const quote = calculateQuote(Number(body.page_count), options, ratesFromShop(shop));
  if (!Number.isSafeInteger(quote.total_paise) || quote.total_paise > 2_147_483_647) {
    throw new RequestError(400, "The test checkout amount exceeds the supported payment range.");
  }
  if (quote.total_paise < 100) {
    throw new RequestError(400, "The test checkout amount must be at least ₹1.");
  }
  const quoteHash = await hashText(stableJson({
    shop_slug: shopSlug,
    page_count: body.page_count,
    options,
    pricing_rates_paise: ratesFromShop(shop),
    total_paise: quote.total_paise,
  }));
  const orderId = crypto.randomUUID();
  const objectPath = `${shop.id}/${orderId}/${crypto.randomUUID()}`;
  const [idempotencyHash, tokenHash] = await Promise.all([
    hashText(idempotencyKey),
    hashText(customerToken),
  ]);
  const saved = await restJson<Record<string, unknown> | Record<string, unknown>[]>(
    "/rest/v1/rpc/create_test_order",
    {
      method: "POST",
      body: JSON.stringify({
        p_order_id: orderId,
        p_shop_slug: shopSlug,
        p_idempotency_key_hash: idempotencyHash,
        p_customer_token_hash: tokenHash,
        p_file_name: fileName,
        p_file_mime_type: mimeType,
        p_file_size_bytes: body.file_size_bytes,
        p_document_path: objectPath,
        p_page_count: body.page_count,
        p_options: options,
        p_quote_hash: quoteHash,
        p_amount_paise: quote.total_paise,
      }),
    },
  );
  const order = Array.isArray(saved) ? saved[0] : saved;
  if (!order || typeof order.id !== "string" || typeof order.document_path !== "string") {
    throw new RequestError(502, "The test order was not saved.");
  }
  if (order.status !== "AWAITING_UPLOAD") {
    throw new RequestError(409, "This test order has already advanced and cannot restart its upload.");
  }
  const uploadToken = await createSignedUploadToken(order.document_path);

  return jsonResponse({
    order_id: order.id,
    customer_token: customerToken,
    document_path: order.document_path,
    upload_token: uploadToken,
    amount_paise: order.amount_paise,
    currency: order.currency,
    quote: {
      ...quote,
      quote_hash: order.quote_hash,
      expires_at: order.expires_at,
    },
    test_mode: true,
  });
});
