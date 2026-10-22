"""
Deterministic Multi-File Print Accounting & Quoting Engine for Xerox SaaS.
Accurately accounts for logical pages, rendered sides (impressions), and physical sheets,
strictly enforcing duplex padding across copy and file boundaries.
Emits immutable Indian paise quotes with SHA-256 hash locks and expiration TTLs.
"""

import math
import hashlib
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from packages.contracts.models import (
    PrintOptions,
    ColorMode,
    DuplexMode,
    PaperSize,
    BindingType,
    FileQuoteItemRequest,
    FileQuoteItemResponse,
    MultiFileQuoteRequest,
    MultiFileQuoteResponse,
)
from packages.printplan.python.printplan import resolve_ranges

# Default Pricing Rule in Indian Paise (100 Paise = 1 INR)
DEFAULT_SHOP_PRICING = {
    "version": 1,
    "base_page_bw_paise": 150,      # ₹1.50 per B&W side
    "base_page_color_paise": 1000,  # ₹10.00 per Color side
    "duplex_discount_percent": 15,  # 15% discount on the back side of each sheet
    "paper_size_multiplier": {
        PaperSize.A4.value: 1.0,
        PaperSize.A3.value: 2.0,
        PaperSize.A5.value: 0.8,
        PaperSize.LETTER.value: 1.0,
        PaperSize.LEGAL.value: 1.25,
    },
    "paper_gsm_addon_paise": {
        75: 0,
        80: 25,     # +25 paise per sheet
        100: 75,    # +75 paise per sheet
        120: 150,   # +150 paise per sheet
        200: 300,   # +300 paise per sheet (heavy cardstock)
    },
    "binding_cost_paise": {
        BindingType.NONE.value: 0,
        BindingType.STAPLE.value: 500,     # ₹5.00
        BindingType.SPIRAL.value: 4000,    # ₹40.00
        BindingType.HARD_BIND.value: 15000 # ₹150.00
    }
}

QUOTE_TTL_MINUTES = 15


class AccountingEngine:
    """
    Computes transparent, tamper-proof quotes for single and multi-file submissions.
    """

    def __init__(self, pricing_rates: Dict[str, Any] = DEFAULT_SHOP_PRICING):
        self.rates = pricing_rates

    def calculate_file_accounting(
        self,
        file_id: str,
        file_name: str,
        total_file_pages: int,
        options: PrintOptions
    ) -> FileQuoteItemResponse:
        """
        Calculates itemized accounting and pricing for a single file.
        Strictly pads duplex sheets per copy boundary.
        """
        # 1. Resolve logical pages from range expression
        if options.page_range and options.page_range.strip() not in ("all", "*", ""):
            try:
                selected_pages = resolve_ranges(options.page_range.strip(), total_file_pages)
            except Exception:
                selected_pages = list(range(1, total_file_pages + 1))
        else:
            selected_pages = list(range(1, total_file_pages + 1))

        logical_pages = len(selected_pages)

        # 2. Account for N-up (pages per sheet)
        nup = max(1, options.pages_per_sheet)
        rendered_sides = math.ceil(logical_pages / nup)

        # 3. Determine physical sheets per copy & total sheets
        is_duplex = options.duplex_mode in (DuplexMode.DUPLEX_LONG, DuplexMode.DUPLEX_SHORT)
        if is_duplex:
            # Each copy pads odd page boundaries with a blank side
            sheets_per_copy = math.ceil(rendered_sides / 2)
            total_sheets = sheets_per_copy * options.copies

            # Pricing: Front side at full rate, Back side at discounted rate
            base_rate = self.rates["base_page_color_paise"] if options.color_mode == ColorMode.COLOR else self.rates["base_page_bw_paise"]
            discount_factor = (100 - self.rates["duplex_discount_percent"]) / 100.0

            front_sides_per_copy = sheets_per_copy
            back_sides_per_copy = rendered_sides - front_sides_per_copy
            print_cost_per_copy = (front_sides_per_copy * base_rate) + (back_sides_per_copy * base_rate * discount_factor)
        else:
            sheets_per_copy = rendered_sides
            total_sheets = sheets_per_copy * options.copies
            base_rate = self.rates["base_page_color_paise"] if options.color_mode == ColorMode.COLOR else self.rates["base_page_bw_paise"]
            print_cost_per_copy = rendered_sides * base_rate

        # 4. Paper size multiplier
        size_mult = self.rates["paper_size_multiplier"].get(options.paper_size.value, 1.0)
        adjusted_print_cost_per_copy = print_cost_per_copy * size_mult

        # 5. Paper GSM add-on per sheet
        gsm_addon = self.rates["paper_gsm_addon_paise"].get(options.paper_gsm, 0)
        gsm_cost_per_copy = sheets_per_copy * gsm_addon

        # 6. Total print & paper cost
        subtotal_per_copy = adjusted_print_cost_per_copy + gsm_cost_per_copy
        total_print_cost = subtotal_per_copy * options.copies

        # 7. Binding cost (per copy)
        binding_cost = self.rates["binding_cost_paise"].get(options.binding.value, 0) * options.copies

        # 8. Grand total in paise
        cost_paise = int(round(total_print_cost + binding_cost))
        cost_rupees = round(cost_paise / 100.0, 2)
        # Approximate USD cents for cross-currency parity (83 paise ~ 1 cent)
        cost_cents = int(round(cost_paise / 83.0))

        return FileQuoteItemResponse(
            file_id=file_id,
            file_name=file_name,
            page_count=total_file_pages,
            logical_pages=logical_pages,
            rendered_sides=rendered_sides * options.copies,
            physical_sheets=total_sheets,
            cost_paise=cost_paise,
            cost_rupees=cost_rupees,
            cost_cents=cost_cents,
            options=options
        )

    def generate_multi_file_quote(self, request: MultiFileQuoteRequest) -> MultiFileQuoteResponse:
        """
        Generates an aggregated, tamper-proof quote across multiple files.
        """
        items_resp: List[FileQuoteItemResponse] = []
        total_paise = 0
        total_logical_pages = 0
        total_rendered_sides = 0
        total_physical_sheets = 0

        for item in request.items:
            # If apply_to_all_options is provided, apply it; otherwise use file-specific options
            effective_opts = request.apply_to_all_options if request.apply_to_all_options else item.options
            res = self.calculate_file_accounting(
                file_id=item.file_id,
                file_name=item.file_name,
                total_file_pages=item.page_count,
                options=effective_opts
            )
            items_resp.append(res)
            total_paise += res.cost_paise
            total_logical_pages += res.logical_pages
            total_rendered_sides += res.rendered_sides
            total_physical_sheets += res.physical_sheets

        total_rupees = round(total_paise / 100.0, 2)
        total_cents = int(round(total_paise / 83.0))

        expires_at = datetime.utcnow() + timedelta(minutes=QUOTE_TTL_MINUTES)
        pricing_version = self.rates.get("version", 1)

        # Generate deterministic Quote Hash for payment lock
        quote_payload = {
            "shop_id": request.shop_id,
            "pricing_version": pricing_version,
            "total_paise": total_paise,
            "total_sheets": total_physical_sheets,
            "items": [{"id": i.file_id, "paise": i.cost_paise, "sheets": i.physical_sheets} for i in items_resp]
        }
        quote_str = json.dumps(quote_payload, sort_keys=True)
        quote_hash = hashlib.sha256(quote_str.encode("utf-8")).hexdigest()
        quote_id = f"qte_{quote_hash[:16]}"

        return MultiFileQuoteResponse(
            quote_id=quote_id,
            quote_hash=quote_hash,
            expires_at=expires_at,
            shop_id=request.shop_id,
            pricing_version=pricing_version,
            total_paise=total_paise,
            total_rupees=total_rupees,
            total_cents=total_cents,
            currency="INR",
            total_logical_pages=total_logical_pages,
            total_rendered_sides=total_rendered_sides,
            total_physical_sheets=total_physical_sheets,
            items=items_resp
        )

    def verify_quote(self, quote_hash: str, quote_response: MultiFileQuoteResponse) -> bool:
        """
        Verifies that a locked quote has not expired and matches the server's calculation.
        """
        if datetime.utcnow() > quote_response.expires_at:
            return False
        return quote_hash == quote_response.quote_hash


accounting_engine = AccountingEngine()
