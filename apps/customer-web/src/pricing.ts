// ==============================================================================
// CLIENT-SIDE PRICING ENGINE & FALLBACK FOR TOUCHLESS PRINT COUNTER
// ==============================================================================

export interface QuoteOptions {
  copies: number;
  color_mode: "bw" | "color" | "grayscale";
  paper_size: "A4" | "A5" | "Legal" | "Letter";
  duplex_mode: "simplex" | "duplex_long" | "duplex_short";
  paper_gsm: number;
  binding: "none" | "staple" | "spiral" | "hard_bind";
  page_range: string;
  pages_per_sheet: number;
}

export interface PricingRatesPaise {
  bw_per_side_paise: number;
  color_per_side_paise: number;
  duplex_discount_percent: number;
  staple_paise: number;
  spiral_paise: number;
  hard_bind_paise: number;
}

export interface ServerQuote {
  total_paise: number;
  total_rupees: number;
  total_logical_pages: number;
  total_rendered_sides: number;
  total_physical_sheets: number;
  expires_at: string;
  quote_hash: string;
}

const DEFAULT_RATES: PricingRatesPaise = {
  bw_per_side_paise: 150,
  color_per_side_paise: 1000,
  duplex_discount_percent: 15,
  staple_paise: 500,
  spiral_paise: 4000,
  hard_bind_paise: 15000,
};

const PAPER_SIZE_MULTIPLIERS: Record<string, number> = {
  A4: 1,
  A5: 0.8,
  Legal: 1.25,
  Letter: 1,
};

const PAPER_GSM_ADDONS_PAISE: Record<number, number> = {
  75: 0,
  80: 25,
  100: 100,
  120: 150,
  200: 300,
  220: 400,
};

export function normalizeOptions(raw: any): QuoteOptions {
  if (!raw || typeof raw !== "object") {
    return {
      copies: 1,
      color_mode: "bw",
      paper_size: "A4",
      duplex_mode: "simplex",
      paper_gsm: 75,
      binding: "none",
      page_range: "all",
      pages_per_sheet: 1,
    };
  }
  return {
    copies: Math.max(1, Math.min(500, Number(raw.copies) || 1)),
    color_mode: ["bw", "color", "grayscale"].includes(raw.color_mode) ? raw.color_mode : "bw",
    paper_size: ["A4", "A5", "Legal", "Letter"].includes(raw.paper_size) ? raw.paper_size : "A4",
    duplex_mode: ["simplex", "duplex_long", "duplex_short"].includes(raw.duplex_mode) ? raw.duplex_mode : "simplex",
    paper_gsm: Number(raw.paper_gsm) || 75,
    binding: ["none", "staple", "spiral", "hard_bind"].includes(raw.binding) ? raw.binding : "none",
    page_range: String(raw.page_range || "all"),
    pages_per_sheet: Math.max(1, Number(raw.pages_per_sheet) || 1),
  };
}

export function calculateLocalQuote(
  pageCount: number,
  rawOptions: any,
  rates: Partial<PricingRatesPaise> = {}
): ServerQuote {
  const options = normalizeOptions(rawOptions);
  const activeRates: PricingRatesPaise = { ...DEFAULT_RATES, ...rates };
  const safePageCount = Math.max(1, pageCount);

  // Logical page calculation
  const logicalPages = safePageCount;
  const renderedSides = Math.ceil(logicalPages / Math.max(1, options.pages_per_sheet));
  const isDuplex = options.duplex_mode !== "simplex";
  const sheetsPerCopy = isDuplex ? Math.ceil(renderedSides / 2) : renderedSides;

  const baseRate =
    options.color_mode === "color"
      ? activeRates.color_per_side_paise
      : options.color_mode === "grayscale"
      ? activeRates.bw_per_side_paise * 1.33
      : activeRates.bw_per_side_paise;

  let printCostPerCopy: number;
  if (isDuplex) {
    const backSideRate = (baseRate * (100 - activeRates.duplex_discount_percent)) / 100;
    const backSidesPerCopy = Math.max(0, renderedSides - sheetsPerCopy);
    printCostPerCopy = sheetsPerCopy * baseRate + backSidesPerCopy * backSideRate;
  } else {
    printCostPerCopy = renderedSides * baseRate;
  }

  const paperMultiplier = PAPER_SIZE_MULTIPLIERS[options.paper_size] ?? 1;
  const gsmAddon = PAPER_GSM_ADDONS_PAISE[options.paper_gsm] ?? 0;
  const bindingRate =
    options.binding === "staple"
      ? activeRates.staple_paise
      : options.binding === "spiral"
      ? activeRates.spiral_paise
      : options.binding === "hard_bind"
      ? activeRates.hard_bind_paise
      : 0;

  const totalPaise = Math.round(
    (printCostPerCopy * paperMultiplier + sheetsPerCopy * gsmAddon) * options.copies +
      bindingRate * options.copies
  );

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const quoteHash = `quote_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  return {
    total_paise: totalPaise,
    total_rupees: totalPaise / 100,
    total_logical_pages: logicalPages * options.copies,
    total_rendered_sides: renderedSides * options.copies,
    total_physical_sheets: sheetsPerCopy * options.copies,
    expires_at: expiresAt,
    quote_hash: quoteHash,
  };
}

