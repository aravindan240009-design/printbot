// Shared calculation contract for the existing quote function and isolated test checkout.
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

export interface CalculatedQuote {
  total_paise: number;
  total_rupees: number;
  total_logical_pages: number;
  total_rendered_sides: number;
  total_physical_sheets: number;
}

const PAPER_SIZE_MULTIPLIERS: Record<QuoteOptions["paper_size"], number> = {
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

export function normalizeQuoteOptions(value: unknown): QuoteOptions {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RangeError("Print options are required.");
  }

  const input = value as Record<string, unknown>;
  const readInteger = (key: string, fallback: number, min: number, max: number): number => {
    const raw = input[key];
    if (raw === undefined || raw === null || raw === "") return fallback;
    const number = Number(raw);
    if (!Number.isInteger(number) || number < min || number > max) {
      throw new RangeError(`Invalid ${key}.`);
    }
    return number;
  };
  const readChoice = <T extends string>(
    key: string,
    choices: readonly T[],
    fallback: T,
  ): T => {
    const raw = input[key];
    if (raw === undefined || raw === null || raw === "") return fallback;
    if (typeof raw !== "string" || !choices.includes(raw as T)) {
      throw new RangeError(`Invalid ${key}.`);
    }
    return raw as T;
  };
  const pageRange = input.page_range;
  if (pageRange !== undefined && pageRange !== null && typeof pageRange !== "string") {
    throw new RangeError("Invalid page_range.");
  }

  return {
    copies: readInteger("copies", 1, 1, 500),
    color_mode: readChoice("color_mode", ["bw", "color", "grayscale"], "bw"),
    paper_size: readChoice("paper_size", ["A4", "A5", "Legal", "Letter"], "A4"),
    duplex_mode: readChoice(
      "duplex_mode",
      ["simplex", "duplex_long", "duplex_short"],
      "simplex",
    ),
    paper_gsm: readInteger("paper_gsm", 75, 1, 500),
    binding: readChoice("binding", ["none", "staple", "spiral", "hard_bind"], "none"),
    page_range: (pageRange as string | null | undefined) || "all",
    pages_per_sheet: readInteger("pages_per_sheet", 1, 1, 500),
  };
}

function selectedPageCount(pageRange: string, pageCount: number): number {
  const range = pageRange.trim();
  if (!range || range === "*" || range === "all") return pageCount;

  try {
    if (range.length > 512) throw new Error("Page range is too long.");
    const pages = new Set<number>();
    for (const item of range.split(",")) {
      if (!/^[1-9][0-9]*(?:-(?:[1-9][0-9]*)?)?$/.test(item)) {
        throw new Error("Invalid page range.");
      }

      const [startText, endText] = item.split("-");
      const start = Number(startText);
      const end = endText === undefined ? start : endText === "" ? pageCount : Number(endText);
      if (start < 1 || start > end || end > pageCount) {
        throw new Error("Page range is outside the document.");
      }
      for (let page = start; page <= end; page += 1) pages.add(page);
    }
    if (pages.size === 0) throw new Error("Page range is empty.");
    return pages.size;
  } catch {
    return pageCount;
  }
}

function roundLikePython(value: number): number {
  const lower = Math.floor(value);
  const fraction = value - lower;
  if (fraction === 0.5) return lower % 2 === 0 ? lower : lower + 1;
  return Math.round(value);
}

export function calculateQuote(
  pageCount: number,
  options: QuoteOptions,
  rates: PricingRatesPaise,
): CalculatedQuote {
  if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > 5000) {
    throw new RangeError("Page count must be between 1 and 5000.");
  }

  const logicalPages = selectedPageCount(options.page_range, pageCount);
  const renderedSides = Math.ceil(logicalPages / Math.max(1, options.pages_per_sheet));
  const isDuplex = options.duplex_mode !== "simplex";
  const sheetsPerCopy = isDuplex ? Math.ceil(renderedSides / 2) : renderedSides;
  const baseRate = options.color_mode === "color"
    ? rates.color_per_side_paise
    : options.color_mode === "grayscale"
      ? rates.bw_per_side_paise * 1.33
      : rates.bw_per_side_paise;

  let printCostPerCopy: number;
  if (isDuplex) {
    const backSideRate = baseRate * (100 - rates.duplex_discount_percent) / 100;
    const backSidesPerCopy = renderedSides - sheetsPerCopy;
    printCostPerCopy = sheetsPerCopy * baseRate + backSidesPerCopy * backSideRate;
  } else {
    printCostPerCopy = renderedSides * baseRate;
  }

  const paperMultiplier = PAPER_SIZE_MULTIPLIERS[options.paper_size] ?? 1;
  const gsmAddon = PAPER_GSM_ADDONS_PAISE[options.paper_gsm] ?? 0;
  const bindingRate = options.binding === "staple"
    ? rates.staple_paise
    : options.binding === "spiral"
      ? rates.spiral_paise
      : options.binding === "hard_bind"
        ? rates.hard_bind_paise
        : 0;
  const totalPaise = roundLikePython(
    (printCostPerCopy * paperMultiplier + sheetsPerCopy * gsmAddon) * options.copies +
      bindingRate * options.copies,
  );

  return {
    total_paise: totalPaise,
    total_rupees: totalPaise / 100,
    total_logical_pages: logicalPages * options.copies,
    total_rendered_sides: renderedSides * options.copies,
    total_physical_sheets: sheetsPerCopy * options.copies,
  };
}
