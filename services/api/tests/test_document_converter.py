"""
Unit and Integration Tests for Multi-Format Document Converter Engine.
Validates zero-trust conversion across PDF, Images, Text, CSV, and Office formats,
ensuring strict security, page accuracy, geometry, duplex padding, and preview fidelity.
"""

import io
import zipfile
import pytest
from PIL import Image

import pypdf
from packages.contracts.models import (
    SupportedFormat,
    PaperSize,
    Orientation,
    ColorMode,
    DocumentConversionOptions,
)
from services.api.services.document_converter import (
    document_converter,
    parse_page_range,
    resolve_paper_geometry,
)
from services.api.services.conversion_engine import conversion_engine
from services.api.services.preview_service import preview_service


# ==============================================================================
# 1. Geometry & Page Range Utilities
# ==============================================================================

def test_resolve_paper_geometry():
    # A4 Portrait: 595.28 x 841.89 pts
    w, h = resolve_paper_geometry(PaperSize.A4, Orientation.PORTRAIT)
    assert round(w, 1) == 595.3
    assert round(h, 1) == 841.9
    assert w < h

    # A4 Landscape: 841.89 x 595.28 pts
    w_land, h_land = resolve_paper_geometry(PaperSize.A4, Orientation.LANDSCAPE)
    assert round(w_land, 1) == 841.9
    assert round(h_land, 1) == 595.3
    assert w_land > h_land

    # Letter Portrait: 612.0 x 792.0 pts
    lw, lh = resolve_paper_geometry(PaperSize.LETTER, Orientation.PORTRAIT)
    assert round(lw, 1) == 612.0
    assert round(lh, 1) == 792.0


def test_parse_page_range():
    # "all" or None returns all pages
    assert parse_page_range("all", 5) == [0, 1, 2, 3, 4]
    assert parse_page_range(None, 3) == [0, 1, 2]

    # Explicit ranges and single pages
    assert parse_page_range("1-3, 5", 10) == [0, 1, 2, 4]
    assert parse_page_range("2, 4", 5) == [1, 3]

    # Open-ended range "4-"
    assert parse_page_range("4-", 6) == [3, 4, 5]

    # Out-of-bounds clamped safely
    assert parse_page_range("1, 99", 3) == [0]


# ==============================================================================
# 2. Text & CSV Converter Tests
# ==============================================================================

def test_convert_plain_text_single_page():
    content = b"Print Bot Document Converter\n\nFast, reliable, multi-tenant Xerox SaaS platform."
    opt = DocumentConversionOptions(paper_size=PaperSize.A4, orientation=Orientation.PORTRAIT)
    res, pdf_bytes = document_converter.convert_to_pdf(content, "sample.txt", opt)

    assert res.is_success is True
    assert res.format == SupportedFormat.TXT
    assert res.page_count == 1
    assert pdf_bytes is not None
    assert pdf_bytes.startswith(b"%PDF-")

    # Verify readable by pypdf
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    assert len(reader.pages) == 1


def test_convert_plain_text_multi_page_with_duplex_padding():
    # Generate 150 lines of text (fits onto multiple pages)
    lines = [f"Section {i}: The quick brown fox jumps over the lazy dog repeatedly." for i in range(1, 150)]
    content = "\n".join(lines).encode("utf-8")

    # Request duplex padding
    opt = DocumentConversionOptions(
        paper_size=PaperSize.A4,
        duplex_padding=True
    )
    res, pdf_bytes = document_converter.convert_to_pdf(content, "multipage.txt", opt)

    assert res.is_success is True
    assert pdf_bytes is not None
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    # Page count must be even due to duplex padding
    assert len(reader.pages) % 2 == 0
    assert res.page_count == len(reader.pages)


def test_convert_csv_table_to_pdf():
    csv_data = (
        "Item,Category,Quantity,Price (INR)\n"
        "Notebook,Stationery,5,250\n"
        "Pen,Stationery,20,200\n"
        "Bond Paper,Paper,2,500\n"
        "Stapler,Tools,1,150\n"
    ).encode("utf-8")

    opt = DocumentConversionOptions(paper_size=PaperSize.A4, orientation=Orientation.LANDSCAPE)
    res, pdf_bytes = document_converter.convert_to_pdf(csv_data, "inventory.csv", opt)

    assert res.is_success is True
    assert res.format == SupportedFormat.CSV
    assert res.page_count >= 1
    assert pdf_bytes is not None

    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    assert len(reader.pages) >= 1
    first_page = reader.pages[0]
    # Landscape orientation: width > height
    assert float(first_page.mediabox.width) > float(first_page.mediabox.height)


# ==============================================================================
# 3. Image Converter Tests (PNG, JPEG, Multi-Page TIFF)
# ==============================================================================

def test_convert_png_to_pdf():
    # Create 400x300 RGB test image
    img = Image.new("RGB", (400, 300), color=(37, 99, 235))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    content = buf.getvalue()

    opt = DocumentConversionOptions(
        paper_size=PaperSize.A4,
        orientation=Orientation.PORTRAIT,
        color_mode=ColorMode.COLOR
    )
    res, pdf_bytes = document_converter.convert_to_pdf(content, "test.png", opt)

    assert res.is_success is True
    assert res.format == SupportedFormat.PNG
    assert res.page_count == 1
    assert pdf_bytes is not None
    assert pdf_bytes.startswith(b"%PDF-")


def test_convert_transparent_rgba_png_to_pdf():
    # Create RGBA image with transparency
    img = Image.new("RGBA", (200, 200), color=(255, 0, 0, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    content = buf.getvalue()

    res, pdf_bytes = document_converter.convert_to_pdf(content, "logo.png")
    assert res.is_success is True
    assert res.page_count == 1
    assert pdf_bytes is not None


def test_convert_multi_page_tiff_to_pdf():
    # Create 3-frame TIFF
    frames = [
        Image.new("RGB", (300, 300), color=(255, 0, 0)),
        Image.new("RGB", (300, 300), color=(0, 255, 0)),
        Image.new("RGB", (300, 300), color=(0, 0, 255)),
    ]
    buf = io.BytesIO()
    frames[0].save(buf, format="TIFF", save_all=True, append_images=frames[1:])
    content = buf.getvalue()

    # Convert all 3 frames
    res, pdf_bytes = document_converter.convert_to_pdf(content, "multipage.tiff")
    assert res.is_success is True
    assert res.format == SupportedFormat.TIFF
    assert res.page_count == 3

    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    assert len(reader.pages) == 3

    # Slice range: only page 1 and 3
    opt = DocumentConversionOptions(page_range="1, 3")
    res_sliced, pdf_sliced = document_converter.convert_to_pdf(content, "multipage.tiff", opt)
    assert res_sliced.page_count == 2
    reader_sliced = pypdf.PdfReader(io.BytesIO(pdf_sliced))
    assert len(reader_sliced.pages) == 2


# ==============================================================================
# 4. PDF Pipeline Tests (Range Slicing & Password Decryption)
# ==============================================================================

def test_convert_pdf_page_range_and_duplex():
    # Build 3-page source PDF
    writer = pypdf.PdfWriter()
    for _ in range(3):
        writer.add_blank_page(width=595.28, height=841.89)
    buf = io.BytesIO()
    writer.write(buf)
    content = buf.getvalue()

    # Slicing: pages 1 and 2 (leaves 2 pages, even -> no duplex pad)
    opt = DocumentConversionOptions(page_range="1-2", duplex_padding=True)
    res, pdf_bytes = document_converter.convert_to_pdf(content, "doc.pdf", opt)
    assert res.is_success is True
    assert res.page_count == 2

    # Slicing: only page 1, with duplex padding -> adds 1 blank page -> total 2
    opt2 = DocumentConversionOptions(page_range="1", duplex_padding=True)
    res2, pdf_bytes2 = document_converter.convert_to_pdf(content, "doc.pdf", opt2)
    assert res2.is_success is True
    assert res2.page_count == 2
    assert any("Duplex padding" in w for w in res2.warnings)


def test_convert_encrypted_pdf_with_password():
    # Build password-encrypted PDF
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=400, height=400)
    writer.encrypt("secret123")
    buf = io.BytesIO()
    writer.write(buf)
    encrypted_bytes = buf.getvalue()

    # Converting without password must fail
    res_fail, _ = document_converter.convert_to_pdf(encrypted_bytes, "locked.pdf")
    assert res_fail.is_success is False
    assert "Password required" in res_fail.error_message

    # Converting with correct password succeeds
    res_ok, dec_pdf = document_converter.convert_to_pdf(encrypted_bytes, "locked.pdf", password="secret123")
    assert res_ok.is_success is True
    assert res_ok.page_count == 1
    assert dec_pdf is not None

    reader = pypdf.PdfReader(io.BytesIO(dec_pdf))
    assert not reader.is_encrypted
    assert len(reader.pages) == 1


# ==============================================================================
# 5. Office Document Structured Fallback Tests
# ==============================================================================

def test_convert_docx_fallback():
    # Construct minimal valid DOCX zip container
    doc_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n'
        '  <w:body>\n'
        '    <w:p><w:r><w:t>Print Bot Invoice &amp; Report</w:t></w:r></w:p>\n'
        '    <w:p><w:r><w:t>Thank you for using our multi-format conversion system.</w:t></w:r></w:p>\n'
        '  </w:body>\n'
        '</w:document>'
    )
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("word/document.xml", doc_xml)
        z.writestr("[Content_Types].xml", '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>')
    docx_bytes = buf.getvalue()

    res, pdf_bytes = document_converter.convert_to_pdf(docx_bytes, "report.docx")
    assert res.is_success is True
    assert res.format == SupportedFormat.DOCX
    assert res.page_count >= 1
    assert pdf_bytes is not None

    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    assert len(reader.pages) >= 1


def test_reject_macro_enabled_office_file():
    # Zip containing dangerous vbaProject.bin
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("word/document.xml", "<w:document/>")
        z.writestr("word/vbaProject.bin", b"\x00\x01\x02\x03")
    macro_bytes = buf.getvalue()

    res, pdf_bytes = document_converter.convert_to_pdf(macro_bytes, "invoice.docm")
    assert res.is_success is False
    assert "Macro-enabled documents" in res.error_message
    assert pdf_bytes is None


# ==============================================================================
# 6. Security & Guardrail Rejections
# ==============================================================================

def test_reject_empty_and_dangerous_files():
    # Empty file
    res, _ = document_converter.convert_to_pdf(b"", "empty.txt")
    assert res.is_success is False
    assert "Empty file" in res.error_message

    # Executable binary
    res_exe, _ = document_converter.convert_to_pdf(b"MZ\x90\x00\x03\x00\x00\x00", "malware.exe")
    assert res_exe.is_success is False
    assert "Executable binaries" in res_exe.error_message

    # Shell script
    res_sh, _ = document_converter.convert_to_pdf(b"#!/bin/bash\nrm -rf /", "script.sh")
    assert res_sh.is_success is False


def test_reject_svg_with_xxe():
    xxe_svg = b'<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&xxe;</svg>'
    res, _ = document_converter.convert_to_pdf(xxe_svg, "graphic.svg")
    assert res.is_success is False
    assert "XXE" in res.error_message or "entity declarations" in res.error_message


# ==============================================================================
# 7. Real PDFium Preview Rendering Tests
# ==============================================================================

def test_preview_service_renders_real_pdf_page():
    # Create sample PDF with text
    content = b"PDFium High Fidelity Preview Verification Page"
    _, pdf_bytes = document_converter.convert_to_pdf(content, "preview_test.txt")
    assert pdf_bytes is not None

    # Render page 1 preview
    jpeg_bytes = preview_service.generate_page_preview(
        page_num=1,
        total_pages=1,
        doc_name="preview_test.txt",
        color_mode="bw",
        duplex_mode="simplex",
        pdf_bytes=pdf_bytes
    )

    assert jpeg_bytes is not None
    assert len(jpeg_bytes) > 500
    # Verify JPEG header
    assert jpeg_bytes.startswith(b"\xff\xd8")

    # Open with PIL to verify valid rendered image dimensions
    with Image.open(io.BytesIO(jpeg_bytes)) as img:
        assert img.format == "JPEG"
        assert img.width > 200
        assert img.height > 200


# ==============================================================================
# 8. ConversionEngine scan_and_convert Integration Test
# ==============================================================================

def test_conversion_engine_scan_and_convert():
    txt_content = b"Integration test for ConversionEngine scan_and_convert method."
    scan_res, pdf_bytes = conversion_engine.scan_and_convert(txt_content, "test.txt")

    assert scan_res.is_valid is True
    assert scan_res.is_converted is True
    assert scan_res.page_count == 1
    assert scan_res.format == SupportedFormat.TXT
    assert pdf_bytes is not None
    assert pdf_bytes.startswith(b"%PDF-")

