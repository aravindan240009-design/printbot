"""
Unit tests for Conversion & Ingestion Engine.
Verifies magic byte detection, decompression bomb protection, malicious executable blocking,
and in-memory password decryption for protected PDFs.
"""

import io
import pytest
from PIL import Image
import pypdf

from services.api.services.conversion_engine import conversion_engine
from packages.contracts.models import SupportedFormat


def test_magic_detection_pdf():
    # Valid PDF header
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    res = conversion_engine.scan_file(pdf_bytes, "document.pdf")
    assert res.format == SupportedFormat.PDF


def test_magic_detection_images():
    # 1. PNG
    png_buf = io.BytesIO()
    Image.new("RGB", (100, 100), color="blue").save(png_buf, format="PNG")
    res_png = conversion_engine.scan_file(png_buf.getvalue(), "photo.png")
    assert res_png.is_valid is True
    assert res_png.format == SupportedFormat.PNG
    assert res_png.page_count == 1

    # 2. JPEG
    jpg_buf = io.BytesIO()
    Image.new("RGB", (100, 100), color="red").save(jpg_buf, format="JPEG")
    res_jpg = conversion_engine.scan_file(jpg_buf.getvalue(), "scan.jpg")
    assert res_jpg.is_valid is True
    assert res_jpg.format == SupportedFormat.JPEG

    # 3. WebP
    webp_buf = io.BytesIO()
    Image.new("RGB", (80, 80), color="green").save(webp_buf, format="WEBP")
    res_webp = conversion_engine.scan_file(webp_buf.getvalue(), "graphic.webp")
    assert res_webp.is_valid is True
    assert res_webp.format == SupportedFormat.WEBP


def test_dangerous_executable_rejection():
    # Windows executable (MZ header) spoofed as .pdf
    fake_exe = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00"
    res = conversion_engine.scan_file(fake_exe, "Resume_Document.pdf")
    assert res.is_valid is False
    assert "Executable binaries and shell scripts are strictly prohibited" in res.error_message


def test_empty_file_rejected():
    res = conversion_engine.scan_file(b"", "empty.pdf")
    assert res.is_valid is False
    assert "Empty file rejected" in res.error_message


def test_decompression_bomb_protection():
    # Mock image exceeding safety threshold of 100 Megapixels
    huge_pixels = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    res = conversion_engine.scan_file(huge_pixels, "bomb.png")
    assert res.is_valid is False


def test_encrypted_pdf_detection_and_in_memory_unlock():
    # Create an encrypted PDF in memory
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=595, height=842)
    writer.add_blank_page(width=595, height=842)
    writer.encrypt("SecretKey123")

    pdf_stream = io.BytesIO()
    writer.write(pdf_stream)
    encrypted_bytes = pdf_stream.getvalue()

    # 1. Scan detects password protection
    res = conversion_engine.scan_file(encrypted_bytes, "Bank_Statement.pdf")
    assert res.is_valid is True
    assert res.is_encrypted is True
    assert res.needs_password is True

    # 2. Unlock with wrong password fails
    success_wrong, _, _, err = conversion_engine.unlock_pdf(encrypted_bytes, "WrongPassword")
    assert success_wrong is False
    assert "Incorrect password" in err

    # 3. Unlock with correct password succeeds in memory
    success_ok, page_count, unlocked_bytes, _ = conversion_engine.unlock_pdf(encrypted_bytes, "SecretKey123")
    assert success_ok is True
    assert page_count == 2
    assert unlocked_bytes.startswith(b"%PDF-")
