from packages.contracts.models import (
    PrintOptions,
    ColorMode,
    PaperSize,
    DuplexMode,
    BindingType
)
from services.api.services.pricing import pricing_engine


def test_pricing_simplex_bw():
    # 10 pages simplex B&W @ $0.05 = $0.50 (50 cents)
    options = PrintOptions(
        copies=1,
        color_mode=ColorMode.BW,
        paper_size=PaperSize.A4,
        duplex_mode=DuplexMode.SIMPLEX,
        binding=BindingType.NONE,
        paper_gsm=75
    )
    quote = pricing_engine.calculate(10, options)
    assert quote["total_cents"] == 50
    assert quote["sheets_per_copy"] == 10


def test_pricing_duplex_discount():
    # 10 pages duplex B&W:
    # 5 physical sheets.
    # Page 1, 3, 5, 7, 9 = 5 pages @ 5c = 25c
    # Page 2, 4, 6, 8, 10 = 5 pages @ 5c * 0.85 (15% discount) = 21.25c
    # Total print: 46.25c -> rounded 46c
    options = PrintOptions(
        copies=1,
        color_mode=ColorMode.BW,
        paper_size=PaperSize.A4,
        duplex_mode=DuplexMode.DUPLEX_LONG,
        binding=BindingType.NONE,
        paper_gsm=75
    )
    quote = pricing_engine.calculate(10, options)
    assert quote["total_cents"] == 46
    assert quote["sheets_per_copy"] == 5


def test_pricing_a3_color_spiral():
    # 4 pages color A3 (2x size multiplier) + spiral binding ($2.50 = 250c)
    # Color base rate = 25c. 4 pages simplex = 100c * 2.0 (A3) = 200c
    # Binding = 250c
    # Total = 450c ($4.50)
    options = PrintOptions(
        copies=1,
        color_mode=ColorMode.COLOR,
        paper_size=PaperSize.A3,
        duplex_mode=DuplexMode.SIMPLEX,
        binding=BindingType.SPIRAL,
        paper_gsm=75
    )
    quote = pricing_engine.calculate(4, options)
    assert quote["total_cents"] == 450
    assert quote["breakdown"]["binding_cents"] == 250
    assert quote["breakdown"]["base_print_cents"] == 200
