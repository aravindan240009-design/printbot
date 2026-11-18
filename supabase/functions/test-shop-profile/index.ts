import {
  getTestShop,
  handleRequest,
  jsonResponse,
  requireMethod,
  requiredString,
} from "../_shared/test_checkout.ts";

handleRequest(async (request) => {
  requireMethod(request, "GET");
  const slug = requiredString(new URL(request.url).searchParams.get("slug"), "Shop link", 100)
    .toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(slug)) {
    return jsonResponse({ detail: "Shop link is invalid." }, 400);
  }
  const shop = await getTestShop(slug);
  return jsonResponse({
    id: shop.id,
    slug: shop.slug,
    name: shop.name,
    city: shop.city,
    contact_phone: shop.contact_phone,
    rates: shop.rates,
    order_mode: shop.order_mode,
    test_mode: true,
  });
});
