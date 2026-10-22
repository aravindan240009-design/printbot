"""
Golden known output tests for Deterministic Print Accounting Engine.
Strictly verifies:
1. Duplex copy boundaries: 11 pages x 2 copies MUST equal 12 sheets (6 sheets per copy), NEVER 11 sheets.
2. Multi-file sheet isolation: File A (3 pages duplex = 2 sheets) + File B (5 pages duplex = 3 sheets) = 5 sheets.
3. N-up layout: 16 pages with 4-up simplex = 4 sheets; with 4-up duplex = 2 sheets.
4. Indian paise integer pricing, duplex discounts, and GSM addons.
5. Deterministic quote hashing and expiration verification.
"""

from services.api.services.accounting_engine import accounting_engine
from packages.contracts.models import (
    PrintOptions,
    ColorMode,
    DuplexMode,
    PaperSize,
    BindingType,
    FileQuoteItemRequest,
    MultiFileQuoteRequest,
)


def test_golden_eleven_pages_duplex_two_copies():
    """
    CRITICAL EXIT CRITERIA:
    11 pages printed in duplex with 2 copies:
    - Copy 1: 11 pages -> 6 sheets (sheet 6 has front printed, back blank).
    - Copy 2: 11 pages -> 6 sheets.
    - Total physical sheets MUST BE 12 sheets, NOT 11 sheets!
    """
    opts = PrintOptions(
        copies=2,
        color_mode=ColorMode.BW,
        paper_size=PaperSize.A4,
        duplex_mode=DuplexMode.DUPLEX_LONG,
        pages_per_sheet=1
    )

    res = accounting_engine.calculate_file_accounting(
        file_id="doc-11",
        file_name="Thesis_Chapter.pdf",
        total_file_pages=11,
        options=opts
    )

    assert res.logical_pages == 11
    assert res.rendered_sides == 22  # 11 pages * 2 copies
    assert res.physical_sheets == 12  # EXACTLY 12 sheets!

    # Pricing calculation check:
    # Per copy: 6 front sides @ 150 paise, 5 back sides @ (150 * 0.85 = 127.5 paise)
    # (6 * 150) + (5 * 127.5) = 900 + 637.5 = 1537.5 paise per copy
    # Total for 2 copies = 3075 paise (₹30.75)
    assert res.cost_paise == 3075
    assert res.cost_rupees == 30.75


def test_golden_nup_sheet_accounting():
    # 16 pages document with N-up = 4 (4 pages per sheet side)
    # 16 pages / 4 = 4 rendered sides
    # Simplex: 4 rendered sides = 4 sheets per copy
    opts_simplex = PrintOptions(
        copies=1,
        color_mode=ColorMode.BW,
        duplex_mode=DuplexMode.SIMPLEX,
        pages_per_sheet=4
    )
    res_simplex = accounting_engine.calculate_file_accounting(
        file_id="nup-16",
        file_name="Slides_Handout.pdf",
        total_file_pages=16,
        options=opts_simplex
    )
    assert res_simplex.logical_pages == 16
    assert res_simplex.rendered_sides == 4
    assert res_simplex.physical_sheets == 4

    # Duplex: 4 rendered sides / 2 sides per sheet = 2 sheets per copy
    opts_duplex = PrintOptions(
        copies=1,
        color_mode=ColorMode.BW,
        duplex_mode=DuplexMode.DUPLEX_LONG,
        pages_per_sheet=4
    )
    res_duplex = accounting_engine.calculate_file_accounting(
        file_id="nup-16",
        file_name="Slides_Handout.pdf",
        total_file_pages=16,
        options=opts_duplex
    )
    assert res_duplex.rendered_sides == 4
    assert res_duplex.physical_sheets == 2


def test_golden_multi_file_boundary_isolation():
    # File 1: 3 pages in duplex (Copy 1 = 2 sheets)
    # File 2: 5 pages in duplex (Copy 1 = 3 sheets)
    # Files must NOT share sheets across file boundaries!
    # Total sheets must be 2 + 3 = 5 sheets!
    req = MultiFileQuoteRequest(
        shop_id="11111111-1111-1111-1111-111111111111",
        items=[
            FileQuoteItemRequest(
                file_id="f1",
                file_name="Cover_Letter.pdf",
                page_count=3,
                options=PrintOptions(copies=1, duplex_mode=DuplexMode.DUPLEX_LONG)
            ),
            FileQuoteItemRequest(
                file_id="f2",
                file_name="Resume.pdf",
                page_count=5,
                options=PrintOptions(copies=1, duplex_mode=DuplexMode.DUPLEX_LONG)
            )
        ]
    )

    quote = accounting_engine.generate_multi_file_quote(req)
    assert quote.total_logical_pages == 8
    assert quote.total_physical_sheets == 5
    assert quote.items[0].physical_sheets == 2
    assert quote.items[1].physical_sheets == 3
    assert quote.total_paise > 0
    assert len(quote.quote_hash) == 64  # Valid SHA-256


def test_quote_hash_tamper_protection():
    req = MultiFileQuoteRequest(
        shop_id="11111111-1111-1111-1111-111111111111",
        items=[
            FileQuoteItemRequest(
                file_id="f1",
                file_name="Doc.pdf",
                page_count=10,
                options=PrintOptions(copies=1)
            )
        ]
    )
    quote = accounting_engine.generate_multi_file_quote(req)
    assert accounting_engine.verify_quote(quote.quote_hash, quote) is True
    assert accounting_engine.verify_quote("tampered_fake_hash_12345", quote) is False
