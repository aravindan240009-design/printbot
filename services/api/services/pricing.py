import math
from typing import Dict, Any
from packages.contracts.models import PrintOptions, PricingRule, ColorMode, DuplexMode, PaperSize, BindingType


class PricingEngine:
    def __init__(self, rule: PricingRule = PricingRule()):
        self.rule = rule

    def calculate(self, page_count: int, options: PrintOptions) -> Dict[str, Any]:
        """
        Calculates exact price in cents with line-item breakdown.
        """
        # 1. Determine sheets per copy
        if options.duplex_mode in (DuplexMode.DUPLEX_LONG, DuplexMode.DUPLEX_SHORT):
            sheets_per_copy = math.ceil(page_count / 2)
            # Duplex discount applied to second side of sheet
            base_rate = self.rule.base_page_color if options.color_mode == ColorMode.COLOR else self.rule.base_page_bw
            discount_factor = (100 - self.rule.duplex_discount_percent) / 100.0
            
            # Full rate for first page of each sheet, discounted rate for back pages
            full_pages = sheets_per_copy
            discounted_pages = page_count - full_pages
            print_cost_per_copy = (full_pages * base_rate) + (discounted_pages * base_rate * discount_factor)
        else:
            sheets_per_copy = page_count
            base_rate = self.rule.base_page_color if options.color_mode == ColorMode.COLOR else self.rule.base_page_bw
            print_cost_per_copy = page_count * base_rate

        # 2. Paper size multiplier
        size_multiplier = self.rule.paper_size_multiplier.get(options.paper_size, 1.0)
        adjusted_print_cost_per_copy = print_cost_per_copy * size_multiplier

        # 3. Paper GSM add-on per sheet
        gsm_addon_per_sheet = self.rule.gsm_addon_cents.get(options.paper_gsm, 0)
        total_gsm_cost_per_copy = sheets_per_copy * gsm_addon_per_sheet

        # 4. Total print & paper cost per copy
        subtotal_per_copy = adjusted_print_cost_per_copy + total_gsm_cost_per_copy
        total_print_cost = subtotal_per_copy * options.copies

        # 5. Binding cost (per copy)
        binding_cost_per_copy = self.rule.binding_cost_cents.get(options.binding, 0)
        total_binding_cost = binding_cost_per_copy * options.copies

        # 6. Final grand total rounded to nearest cent
        total_cents = int(round(total_print_cost + total_binding_cost))

        return {
            "total_cents": total_cents,
            "currency": "USD",
            "page_count": page_count,
            "copies": options.copies,
            "sheets_per_copy": sheets_per_copy,
            "total_sheets": sheets_per_copy * options.copies,
            "breakdown": {
                "base_print_cents": int(round(adjusted_print_cost_per_copy * options.copies)),
                "paper_upgrade_cents": int(round(total_gsm_cost_per_copy * options.copies)),
                "binding_cents": total_binding_cost,
                "unit_price_cents": int(round(total_cents / max(1, options.copies))),
            }
        }


pricing_engine = PricingEngine()
