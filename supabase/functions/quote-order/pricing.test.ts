import assert from "node:assert/strict";
import test from "node:test";
import { calculateQuote, normalizeQuoteOptions, type PricingRatesPaise } from "../_shared/pricing.ts";

const defaultRates: PricingRatesPaise = {
  bw_per_side_paise: 150,
  color_per_side_paise: 1000,
  duplex_discount_percent: 15,
  staple_paise: 500,
  spiral_paise: 4000,
  hard_bind_paise: 15000,
};

test("quotes simplex and duplex totals using server rates", () => {
  const simplex = calculateQuote(
    2,
    normalizeQuoteOptions({ color_mode: "bw", duplex_mode: "simplex" }),
    defaultRates,
  );
  const duplex = calculateQuote(
    2,
    normalizeQuoteOptions({ color_mode: "bw", duplex_mode: "duplex_long" }),
    defaultRates,
  );

  assert.equal(simplex.total_paise, 300);
  assert.equal(simplex.total_physical_sheets, 2);
  assert.equal(duplex.total_paise, 278);
  assert.equal(duplex.total_physical_sheets, 1);
});

test("quotes custom color, paper, copies, page range, and binding", () => {
  const quote = calculateQuote(
    5,
    normalizeQuoteOptions({
      copies: 2,
      color_mode: "color",
      paper_size: "A4",
      duplex_mode: "simplex",
      paper_gsm: 100,
      binding: "staple",
      page_range: "2-4",
      pages_per_sheet: 2,
    }),
    defaultRates,
  );

  assert.equal(quote.total_logical_pages, 6);
  assert.equal(quote.total_rendered_sides, 4);
  assert.equal(quote.total_physical_sheets, 4);
  assert.equal(quote.total_paise, 5400);
});

test("invalid page ranges follow the existing quote engine and select the whole document", () => {
  const quote = calculateQuote(
    3,
    normalizeQuoteOptions({ page_range: "0-2" }),
    defaultRates,
  );

  assert.equal(quote.total_logical_pages, 3);
  assert.equal(quote.total_paise, 450);
});
