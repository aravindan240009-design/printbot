import math
from typing import Dict, Any, List
from packages.contracts.models import PrintOptions, PricingRule, ColorMode, DuplexMode, PaperSize, BindingType
from packages.printplan.python.printplan import resolve_ranges


class PricingEngine:
    def __init__(self, rule: PricingRule = PricingRule()):
        self.rule = rule

    def calculate(self, page_count: int, options: PrintOptions) -> Dict[str, Any]:
        """
        Calculates exact price in cents and Indian paise with line-item breakdown.
        Accurately distinguishes logical pages, rendered sides, and physical sheets.
        """
        # 1. Resolve selected logical page numbers from page_range if specified
        selected_pages: List[int] = list(range(1, page_count + 1))
        if options.page_range and options.page_range.strip() not in ("all", "*", ""):
            try:
                selected_pages = resolve_ranges(options.page_range.strip(), page_count)
            except Exception:
                # Fallback to all pages if custom range string is being typed or malformed
                selected_pages = list(range(1, page_count + 1))

        logical_pages = len(selected_pages)

        # 2. Account for N-up (pages per sheet)
        nup = max(1, getattr(options, "pages_per_sheet", 1))
        effective_impressions = math.ceil(logical_pages / nup)

        # 3. Determine sheets per copy
        is_duplex = options.duplex_mode in (DuplexMode.DUPLEX_LONG, DuplexMode.DUPLEX_SHORT)
        if is_duplex:
            sheets_per_copy = math.ceil(effective_impressions / 2)
            base_rate = self.rule.base_page_color if options.color_mode == ColorMode.COLOR else self.rule.base_page_bw
            discount_factor = (100 - self.rule.duplex_discount_percent) / 100.0

            # Full rate for first side of each sheet, discounted rate for second side
            full_pages = sheets_per_copy
            discounted_pages = effective_impressions - full_pages
            print_cost_per_copy = (full_pages * base_rate) + (discounted_pages * base_rate * discount_factor)
        else:
            sheets_per_copy = effective_impressions
            base_rate = self.rule.base_page_color if options.color_mode == ColorMode.COLOR else self.rule.base_page_bw
            print_cost_per_copy = effective_impressions * base_rate

        # 4. Paper size multiplier
        size_multiplier = self.rule.paper_size_multiplier.get(options.paper_size, 1.0)
        adjusted_print_cost_per_copy = print_cost_per_copy * size_multiplier

        # 5. Paper GSM add-on per sheet
        gsm_addon_per_sheet = self.rule.gsm_addon_cents.get(options.paper_gsm, 0)
        total_gsm_cost_per_copy = sheets_per_copy * gsm_addon_per_sheet

        # 6. Total print & paper cost per copy
        subtotal_per_copy = adjusted_print_cost_per_copy + total_gsm_cost_per_copy
        total_print_cost = subtotal_per_copy * options.copies

        # 7. Binding cost (per copy)
        binding_cost_per_copy = self.rule.binding_cost_cents.get(options.binding, 0)
        total_binding_cost = binding_cost_per_copy * options.copies

        # 8. Final grand totals
        total_cents = int(round(total_print_cost + total_binding_cost))
        # 1 cent = ~83 paise (exchange parity approx), or direct paise rate
        total_paise = total_cents * 83

        return {
            "total_cents": total_cents,
            "total_paise": total_paise,
            "currency": "USD",
            "logical_pages": logical_pages,
            "page_count": page_count,
            "copies": options.copies,
            "sheets_per_copy": sheets_per_copy,
            "total_sheets": sheets_per_copy * options.copies,
            "rendered_sides": effective_impressions * options.copies,
            "breakdown": {
                "base_print_cents": int(round(adjusted_print_cost_per_copy * options.copies)),
                "paper_upgrade_cents": int(round(total_gsm_cost_per_copy * options.copies)),
                "binding_cents": total_binding_cost,
                "unit_price_cents": int(round(total_cents / max(1, options.copies))),
            }
        }


pricing_engine = PricingEngine()
