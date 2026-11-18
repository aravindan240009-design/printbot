import type { PricingRatesPaise } from "./pricing.ts";

export const TEST_BUCKET = "printbot-test-documents";

export class RequestError extends Error {
  readonly status: number;

  constructor(
    status: number,
    message: string,
  ) {
    super(message);
    this.status = status;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-requested-with",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export function responseHeaders(): HeadersInit {
  return corsHeaders;
}

export function handleRequest(
  handler: (request: Request) => Promise<Response>,
): void {
  Deno.serve(async (request) => {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof RequestError) {
        return jsonResponse({ detail: error.message }, error.status);
      }
      if (error instanceof RangeError) {
        return jsonResponse({ detail: error.message }, 400);
      }
      console.error("Staging checkout request failed.", error instanceof Error ? error.name : "unknown");
      return jsonResponse({ detail: "The staging checkout request could not be completed." }, 500);
    }
  });
}

export function requireMethod(request: Request, method: string): void {
  if (request.method !== method) {
    throw new RequestError(405, `Only ${method} is supported.`);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function matchesFileSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "application/pdf") {
    return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  }
  if (mimeType === "image/png") {
    return bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  return mimeType === "image/jpeg" &&
    bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export function requiredString(value: unknown, label: string, maxLength = 256): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new RequestError(400, `${label} is invalid.`);
  }
  return value.trim();
}

export function getServerConfig() {
  const url = Deno.env.get("SUPABASE_URL")?.trim().replace(/\/+$/, "");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!url || !serviceKey) {
    throw new RequestError(503, "The staging backend is not configured.");
  }
  return { url, serviceKey };
}

export function getRazorpayTestCredentials(webhook = false) {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID")?.trim();
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")?.trim();
  const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")?.trim();
  if (!keyId || !keySecret || !keyId.startsWith("rzp_test_")) {
    throw new RequestError(503, "Razorpay Test Mode credentials are not configured.");
  }
  if (webhook && !webhookSecret) {
    throw new RequestError(503, "The Razorpay Test Mode webhook secret is not configured.");
  }
  return { keyId, keySecret, webhookSecret };
}

export async function restRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const { url, serviceKey } = getServerConfig();
  const headers = new Headers(init.headers);
  headers.set("apikey", serviceKey);
  headers.set("Authorization", `Bearer ${serviceKey}`);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`${url}${path}`, { ...init, headers });
}

export async function restJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await restRequest(path, init);
  if (!response.ok) {
    console.error("Staging data request failed.", response.status);
    throw new RequestError(502, "The staging data service rejected the request.");
  }
  return await response.json() as T;
}

export async function getSingleRow<T>(
  table: string,
  filters: Record<string, string>,
  columns = "*",
): Promise<T | null> {
  const query = new URLSearchParams({ select: columns, ...filters, limit: "1" });
  const rows = await restJson<T[]>(`/rest/v1/${table}?${query.toString()}`);
  if (!Array.isArray(rows)) throw new RequestError(502, "The staging data response was invalid.");
  return rows[0] ?? null;
}

export interface TestShop {
  id: string;
  slug: string;
  name: string;
  city: string;
  contact_phone: string;
  status: string;
  rates: Record<string, unknown>;
  order_mode: string;
}

export async function getTestShop(shopSlug: string): Promise<TestShop> {
  const shop = await getSingleRow<TestShop>("shops", {
    slug: `eq.${shopSlug}`,
    status: "eq.ACTIVE",
  });
  if (!shop) throw new RequestError(404, "This test shop is not active.");
  return shop;
}

export function ratesFromShop(shop: TestShop): PricingRatesPaise {
  if (!isRecord(shop.rates)) throw new RequestError(500, "The test shop has invalid pricing rates.");
  const bw = Number(shop.rates.bw_per_side_paise ?? Number(shop.rates.bwRate ?? 1.5) * 100);
  const color = Number(shop.rates.color_per_side_paise ?? Number(shop.rates.colorRate ?? 10) * 100);
  const duplex = Number(shop.rates.duplex_discount_percent ?? shop.rates.duplexDiscountPercent ?? 15);
  const staple = Number(shop.rates.staple_paise ?? Number(shop.rates.stapleRate ?? 5) * 100);
  const spiral = Number(shop.rates.spiral_paise ?? Number(shop.rates.spiralRate ?? 40) * 100);
  const hardBind = Number(shop.rates.hard_bind_paise ?? Number(shop.rates.hardBoundRate ?? 150) * 100);
  const rates = {
    bw_per_side_paise: bw,
    color_per_side_paise: color,
    duplex_discount_percent: duplex,
    staple_paise: staple,
    spiral_paise: spiral,
    hard_bind_paise: hardBind,
  };
  if (
    Object.values(rates).some((value) => !Number.isSafeInteger(value) || value < 0) ||
    duplex > 100
  ) {
    throw new RequestError(500, "The test shop has invalid pricing rates.");
  }
  return rates;
}

export async function hashText(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function normalizeHex(value: string): string {
  return value.trim().toLowerCase().replace(/^sha256=/, "");
}

export async function getOrder(orderId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
    throw new RequestError(400, "Test order ID is invalid.");
  }
  const order = await getSingleRow<Record<string, unknown>>("test_orders", {
    id: `eq.${orderId}`,
  });
  if (!order) throw new RequestError(404, "Test order was not found.");
  return order;
}

export async function createSignedUploadToken(objectPath: string): Promise<string> {
  const safePath = objectPath.split("/").map(encodeURIComponent).join("/");
  const response = await restRequest(
    `/storage/v1/object/upload/sign/${TEST_BUCKET}/${safePath}`,
    { method: "POST", body: "{}" },
  );
  if (!response.ok) {
    console.error("Could not create a staging upload token.", response.status);
    throw new RequestError(502, "Could not prepare the private document upload.");
  }
  const body = await response.json() as { token?: unknown };
  if (typeof body.token !== "string" || !body.token) {
    throw new RequestError(502, "The private document upload service returned an invalid token.");
  }
  return body.token;
}

export async function fetchPrivateDocument(objectPath: string): Promise<Response> {
  const safePath = objectPath.split("/").map(encodeURIComponent).join("/");
  const response = await restRequest(`/storage/v1/object/${TEST_BUCKET}/${safePath}`);
  if (!response.ok) {
    console.error("Could not retrieve a staging document.", response.status);
    throw new RequestError(404, "The private test document could not be retrieved.");
  }
  return response;
}

export async function deletePrivateDocuments(objectPaths: string[]): Promise<void> {
  if (!objectPaths.length) return;
  const response = await restRequest(`/storage/v1/object/${TEST_BUCKET}`, {
    method: "DELETE",
    body: JSON.stringify({ prefixes: objectPaths }),
  });
  if (!response.ok) {
    console.error("Could not delete expired staging documents.", response.status);
    throw new RequestError(502, "Expired test documents could not be cleaned up.");
  }
}

export async function verifyCustomerToken(
  orderId: string,
  token: string,
): Promise<Record<string, unknown>> {
  if (token.length < 32 || token.length > 200) throw new RequestError(403, "Test order access is invalid.");
  const order = await getOrder(orderId);
  const providedHash = await hashText(token);
  if (!constantTimeEqual(String(order.customer_token_hash), providedHash)) {
    throw new RequestError(403, "Test order access is invalid.");
  }
  return order;
}

export async function getAuthUser(request: Request): Promise<{ id: string }> {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new RequestError(401, "A workstation sign-in is required.");
  }
  const { url } = getServerConfig();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  if (!anonKey) throw new RequestError(503, "Workstation authentication is not configured.");
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: authorization },
  });
  if (!response.ok) throw new RequestError(401, "Workstation sign-in is invalid or expired.");
  const user = await response.json() as { id?: unknown };
  if (typeof user.id !== "string") throw new RequestError(401, "Workstation sign-in is invalid.");
  return { id: user.id };
}

export async function requireMembership(
  request: Request,
  role?: "operator" | "admin",
): Promise<{ userId: string; shopId: string; shopSlug: string; role: string }> {
  const user = await getAuthUser(request);
  const membership = await getSingleRow<Record<string, unknown>>("test_workstation_memberships", {
    user_id: `eq.${user.id}`,
    is_active: "eq.true",
  });
  if (!membership || typeof membership.shop_id !== "string" || typeof membership.role !== "string") {
    throw new RequestError(403, "This test account is not assigned to a workstation.");
  }
  if (role && membership.role !== role) {
    throw new RequestError(403, "This test account does not have permission for that action.");
  }
  const shop = await getSingleRow<{ slug: string }>("shops", {
    id: `eq.${membership.shop_id}`,
    status: "eq.ACTIVE",
  }, "slug");
  if (!shop) throw new RequestError(403, "The assigned test shop is not active.");
  return {
    userId: user.id,
    shopId: membership.shop_id,
    shopSlug: shop.slug,
    role: membership.role,
  };
}

export async function getRazorpayPayment(paymentId: string) {
  const credentials = getRazorpayTestCredentials();
  const auth = btoa(`${credentials.keyId}:${credentials.keySecret}`);
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
  });
  if (!response.ok) throw new RequestError(502, "Razorpay could not confirm the test payment.");
  return await response.json() as Record<string, unknown>;
}
