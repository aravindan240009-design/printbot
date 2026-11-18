import {
  calculateQuote,
  normalizeQuoteOptions,
  type PricingRatesPaise,
} from "../_shared/pricing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};

const defaultRates: PricingRatesPaise = {
  bw_per_side_paise: 150,
  color_per_side_paise: 1000,
  duplex_discount_percent: 15,
  staple_paise: 500,
  spiral_paise: 4000,
  hard_bind_paise: 15000,
};

type JsonRecord = Record<string, unknown>;

class QuoteError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

function jsonResponse(body: JsonRecord, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseNotes(value: unknown): JsonRecord {
  if (isRecord(value)) return value;
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function readNonNegativeRate(value: unknown, fromRupees: boolean, fallback: number): number {
  if (value === undefined || value === null || value === "") return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new QuoteError("The shop has an invalid pricing rate.", 500);
  }
  const paise = fromRupees ? Math.round(numeric * 100) : numeric;
  if (!Number.isSafeInteger(paise)) {
    throw new QuoteError("The shop has an invalid pricing rate.", 500);
  }
  return paise;
}

function ratesFromShopRow(row: JsonRecord): PricingRatesPaise {
  const notes = parseNotes(row.notes);
  const nestedRates = isRecord(notes.pricing_rates_paise)
    ? notes.pricing_rates_paise
    : isRecord(notes.rates)
      ? notes.rates
      : {};
  const profileRates = isRecord(row.rates) ? row.rates : {};
  const sources = [nestedRates, notes, profileRates];
  const firstRate = (paiseKeys: string[], rupeeKeys: string[], fallback: number): number => {
    for (const source of sources) {
      for (const key of paiseKeys) {
        if (source[key] !== undefined && source[key] !== null) {
          return readNonNegativeRate(source[key], false, fallback);
        }
      }
      for (const key of rupeeKeys) {
        if (source[key] !== undefined && source[key] !== null) {
          return readNonNegativeRate(source[key], true, fallback);
        }
      }
    }
    return fallback;
  };

  const discount = firstRate(
    ["duplex_discount_percent", "duplexDiscountPercent"],
    ["duplexDiscountPercent"],
    defaultRates.duplex_discount_percent,
  );
  if (discount > 100) {
    throw new QuoteError("The shop's duplex discount must be between 0 and 100 percent.", 500);
  }

  return {
    bw_per_side_paise: firstRate(
      ["bw_per_side_paise"],
      ["bwRate", "bwPerSideRupees"],
      defaultRates.bw_per_side_paise,
    ),
    color_per_side_paise: firstRate(
      ["color_per_side_paise"],
      ["colorRate", "colorPerSideRupees"],
      defaultRates.color_per_side_paise,
    ),
    duplex_discount_percent: discount,
    staple_paise: firstRate(
      ["staple_paise"],
      ["stapleRate"],
      defaultRates.staple_paise,
    ),
    spiral_paise: firstRate(
      ["spiral_paise"],
      ["spiralRate"],
      defaultRates.spiral_paise,
    ),
    hard_bind_paise: firstRate(
      ["hard_bind_paise"],
      ["hardBoundRate"],
      defaultRates.hard_bind_paise,
    ),
  };
}

async function getRows(
  url: URL,
  serviceRoleKey: string,
): Promise<JsonRecord[]> {
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
    },
  });
  if (response.status === 400 || response.status === 404) return [];
  if (!response.ok) {
    throw new QuoteError("The server could not load the shop's current pricing.", 502);
  }
  const data: unknown = await response.json();
  if (!Array.isArray(data) || data.some((row) => !isRecord(row))) {
    throw new QuoteError("The shop pricing response was invalid.", 502);
  }
  return data as JsonRecord[];
}

async function loadShopPricing(
  supabaseUrl: string,
  serviceRoleKey: string,
  shopSlug: string,
): Promise<PricingRatesPaise> {
  const applicationsUrl = new URL("/rest/v1/pilot_applications", supabaseUrl);
  applicationsUrl.searchParams.set("select", "generated_username,status,notes");
  applicationsUrl.searchParams.set("generated_username", `eq.${shopSlug}`);
  applicationsUrl.searchParams.set("status", "in.(APPROVED,ACTIVE)");
  applicationsUrl.searchParams.set("limit", "1");
  const applications = await getRows(applicationsUrl, serviceRoleKey);
  if (applications.length > 0) return ratesFromShopRow(applications[0]);

  const shopsUrl = new URL("/rest/v1/shops", supabaseUrl);
  shopsUrl.searchParams.set("select", "slug,status,rates");
  shopsUrl.searchParams.set("slug", `eq.${shopSlug}`);
  shopsUrl.searchParams.set("status", "in.(APPROVED,ACTIVE)");
  shopsUrl.searchParams.set("limit", "1");
  const shops = await getRows(shopsUrl, serviceRoleKey);
  if (shops.length > 0) return ratesFromShopRow(shops[0]);

  throw new QuoteError("This shop could not be found or is not active.", 404);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isRecord(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ detail: "Only POST is supported." }, 405);
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new QuoteError("Request body must be valid JSON.", 400);
    }
    if (!isRecord(body)) throw new QuoteError("Request body is invalid.", 400);

    const shopSlug = typeof body.shop_slug === "string" ? body.shop_slug.trim().toLowerCase() : "";
    if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(shopSlug)) {
      throw new QuoteError("A valid shop link is required.", 400);
    }
    const pageCount = body.page_count;
    if (typeof pageCount !== "number" || !Number.isInteger(pageCount)) {
      throw new QuoteError("A valid document page count is required.", 400);
    }
    const options = normalizeQuoteOptions(body.options);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim().replace(/\/+$/, "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    if (!supabaseUrl || !serviceRoleKey) {
      throw new QuoteError("The shop pricing service is not configured.", 503);
    }

    const rates = await loadShopPricing(supabaseUrl, serviceRoleKey, shopSlug);
    const quote = calculateQuote(pageCount, options, rates);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const quoteHash = await sha256Hex(stableJson({
      shop_slug: shopSlug,
      page_count: pageCount,
      options,
      pricing_rates_paise: rates,
      total_paise: quote.total_paise,
    }));

    return jsonResponse({
      ...quote,
      expires_at: expiresAt,
      quote_hash: quoteHash,
    });
  } catch (error) {
    if (error instanceof QuoteError) {
      return jsonResponse({ detail: error.message }, error.statusCode);
    }
    if (error instanceof RangeError) {
      return jsonResponse({ detail: error.message }, 400);
    }
    console.error("Shop quote request failed.");
    return jsonResponse({ detail: "Could not calculate the shop price." }, 500);
  }
});
