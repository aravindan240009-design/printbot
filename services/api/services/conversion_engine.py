"""
Production Document Ingestion & Conversion Engine for Xerox SaaS Platform.
Safely detects file formats via magic bytes, MIME types, and file extensions.
Protects against decompression bombs, malicious executables, macro-enabled office files,
and handles in-memory password decryption for protected PDFs.
"""

import io
import re
import zipfile
import xml.etree.ElementTree as ET
from typing import Tuple, Optional, List
from PIL import Image

import pypdf
from packages.contracts.models import SupportedFormat, FileScanResult

# Safety Limits
MAX_IMAGE_PIXELS = 100_000_000  # 100 Megapixels threshold against decompression bombs
MAX_PDF_PAGES = 5_000           # Maximum allowed pages in a single submission
MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB max upload

# Magic byte signatures
MAGIC_SIGNATURES = {
    b"%PDF-": SupportedFormat.PDF,
    b"\x89PNG\r\n\x1a\n": SupportedFormat.PNG,
    b"\xff\xd8\xff": SupportedFormat.JPEG,
    b"II*\x00": SupportedFormat.TIFF,
    b"MM\x00*": SupportedFormat.TIFF,
    b"BM": SupportedFormat.BMP,
}

# Dangerous executable magic signatures
DANGEROUS_SIGNATURES = [
    b"MZ",       # Windows DOS/PE executable / DLL
    b"\x7fELF",  # Linux ELF executable
    b"\xca\xfe\xba\xbe", # Java / Mach-O binary
    b"#!",       # Unix shell script
]


class ConversionEngine:
    """
    Zero-trust document analysis and safe ingestion pipeline.
    """

    def scan_file(self, content: bytes, file_name: str, declared_mime: Optional[str] = None) -> FileScanResult:
        file_size = len(content)
        if file_size == 0:
            return FileScanResult(
                is_valid=False,
                format=SupportedFormat.UNSUPPORTED,
                mime_type="application/octet-stream",
                file_size_bytes=0,
                page_count=0,
                error_message="Empty file rejected: 0 bytes received."
            )

        if file_size > MAX_FILE_SIZE_BYTES:
            return FileScanResult(
                is_valid=False,
                format=SupportedFormat.UNSUPPORTED,
                mime_type="application/octet-stream",
                file_size_bytes=file_size,
                page_count=0,
                error_message=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
            )

        # 1. Check for dangerous executables
        for dangerous_magic in DANGEROUS_SIGNATURES:
            if content.startswith(dangerous_magic):
                return FileScanResult(
                    is_valid=False,
                    format=SupportedFormat.UNSUPPORTED,
                    mime_type="application/x-dosexec",
                    file_size_bytes=file_size,
                    page_count=0,
                    error_message="Executable binaries and shell scripts are strictly prohibited for printing."
                )

        # 2. Detect format from magic bytes & content
        detected_format = self._detect_format(content, file_name)

        if detected_format == SupportedFormat.PDF:
            return self._scan_pdf(content, file_size)

        elif detected_format in (
            SupportedFormat.PNG,
            SupportedFormat.JPEG,
            SupportedFormat.WEBP,
            SupportedFormat.TIFF,
            SupportedFormat.BMP
        ):
            return self._scan_raster_image(content, detected_format, file_size)

        elif detected_format == SupportedFormat.SVG:
            return self._scan_svg(content, file_size)

        elif detected_format in (
            SupportedFormat.DOCX,
            SupportedFormat.XLSX,
            SupportedFormat.PPTX,
            SupportedFormat.ODT,
            SupportedFormat.ODS,
            SupportedFormat.ODP
        ):
            return self._scan_office_container(content, detected_format, file_size)

        elif detected_format == SupportedFormat.TXT:
            return self._scan_text(content, file_size)

        elif detected_format == SupportedFormat.CSV:
            return self._scan_text(content, file_size, is_csv=True)

        return FileScanResult(
            is_valid=False,
            format=SupportedFormat.UNSUPPORTED,
            mime_type=declared_mime or "application/octet-stream",
            file_size_bytes=file_size,
            page_count=0,
            error_message=f"Unsupported document format '{file_name}'. Accepted formats include PDF, PNG, JPG, WebP, TIFF, DOCX, XLSX, PPTX, and TXT."
        )

    def _detect_format(self, content: bytes, file_name: str) -> SupportedFormat:
        lower_name = file_name.lower()

        # Check PDF
        if content.startswith(b"%PDF-"):
            return SupportedFormat.PDF

        # Check PNG
        if content.startswith(b"\x89PNG\r\n\x1a\n"):
            return SupportedFormat.PNG

        # Check JPEG
        if content.startswith(b"\xff\xd8\xff"):
            return SupportedFormat.JPEG

        # Check WebP (RIFF....WEBP)
        if content.startswith(b"RIFF") and len(content) >= 12 and content[8:12] == b"WEBP":
            return SupportedFormat.WEBP

        # Check TIFF
        if content.startswith(b"II*\x00") or content.startswith(b"MM\x00*"):
            return SupportedFormat.TIFF

        # Check BMP
        if content.startswith(b"BM"):
            return SupportedFormat.BMP

        # Check SVG
        stripped = content.lstrip()
        if stripped.startswith(b"<svg") or (stripped.startswith(b"<?xml") and b"<svg" in stripped[:1024]):
            return SupportedFormat.SVG

        # Check Zip containers (DOCX, XLSX, PPTX, ODT)
        if content.startswith(b"PK\x03\x04"):
            if lower_name.endswith(".docx"):
                return SupportedFormat.DOCX
            if lower_name.endswith(".xlsx"):
                return SupportedFormat.XLSX
            if lower_name.endswith(".pptx"):
                return SupportedFormat.PPTX
            if lower_name.endswith(".odt"):
                return SupportedFormat.ODT
            if lower_name.endswith(".ods"):
                return SupportedFormat.ODS
            if lower_name.endswith(".odp"):
                return SupportedFormat.ODP
            # Inspect internal Zip structure if extension was ambiguous
            try:
                with zipfile.ZipFile(io.BytesIO(content)) as z:
                    namelist = set(z.namelist())
                    if "word/document.xml" in namelist:
                        return SupportedFormat.DOCX
                    if "xl/workbook.xml" in namelist:
                        return SupportedFormat.XLSX
                    if "ppt/presentation.xml" in namelist:
                        return SupportedFormat.PPTX
            except Exception:
                pass

        # Text files
        if lower_name.endswith(".csv"):
            return SupportedFormat.CSV
        if lower_name.endswith(".txt"):
            return SupportedFormat.TXT

        return SupportedFormat.UNSUPPORTED

    def _scan_pdf(self, content: bytes, file_size: int) -> FileScanResult:
        try:
            reader = pypdf.PdfReader(io.BytesIO(content))
            if reader.is_encrypted:
                return FileScanResult(
                    is_valid=True,
                    format=SupportedFormat.PDF,
                    mime_type="application/pdf",
                    file_size_bytes=file_size,
                    page_count=0,
                    is_encrypted=True,
                    needs_password=True,
                    error_message="Document is password protected. Please enter the password to unlock for printing."
                )

            page_count = len(reader.pages)
            if page_count == 0:
                return FileScanResult(
                    is_valid=False,
                    format=SupportedFormat.PDF,
                    mime_type="application/pdf",
                    file_size_bytes=file_size,
                    page_count=0,
                    error_message="PDF contains zero printable pages."
                )

            if page_count > MAX_PDF_PAGES:
                return FileScanResult(
                    is_valid=False,
                    format=SupportedFormat.PDF,
                    mime_type="application/pdf",
                    file_size_bytes=file_size,
                    page_count=page_count,
                    error_message=f"PDF page count ({page_count}) exceeds platform maximum of {MAX_PDF_PAGES} pages."
                )

            # Extract page 1 dimensions
            first_page = reader.pages[0]
            width_pts = float(first_page.mediabox.width)
            height_pts = float(first_page.mediabox.height)

            return FileScanResult(
                is_valid=True,
                format=SupportedFormat.PDF,
                mime_type="application/pdf",
                file_size_bytes=file_size,
                page_count=page_count,
                is_encrypted=False,
                needs_password=False,
                width_pts=width_pts,
                height_pts=height_pts,
                detected_pages=list(range(1, page_count + 1))
            )
        except Exception as e:
            return FileScanResult(
                is_valid=False,
                format=SupportedFormat.PDF,
                mime_type="application/pdf",
                file_size_bytes=file_size,
                page_count=0,
                error_message=f"Malformed PDF file: {str(e)}"
            )

    def unlock_pdf(self, content: bytes, password: str) -> Tuple[bool, int, Optional[bytes], Optional[str]]:
        """
        Unlocks password-protected PDF in-memory.
        Never logs or stores the plaintext password.
        Returns: (success, page_count, unlocked_pdf_bytes, error_message)
        """
        try:
            reader = pypdf.PdfReader(io.BytesIO(content))
            if not reader.is_encrypted:
                return True, len(reader.pages), content, None

            decrypt_status = reader.decrypt(password)
            if int(decrypt_status) == 0:
                return False, 0, None, "Incorrect password. Please verify the document password."

            writer = pypdf.PdfWriter()
            for page in reader.pages:
                writer.add_page(page)

            out_stream = io.BytesIO()
            writer.write(out_stream)
            out_bytes = out_stream.getvalue()
            return True, len(reader.pages), out_bytes, None
        except Exception as e:
            return False, 0, None, f"Failed to decrypt PDF: {str(e)}"

    def _scan_raster_image(self, content: bytes, fmt: SupportedFormat, file_size: int) -> FileScanResult:
        try:
            with Image.open(io.BytesIO(content)) as img:
                width, height = img.size
                total_pixels = width * height

                # Decompression Bomb Protection
                if total_pixels > MAX_IMAGE_PIXELS:
                    return FileScanResult(
                        is_valid=False,
                        format=fmt,
                        mime_type=f"image/{fmt.value}",
                        file_size_bytes=file_size,
                        page_count=0,
                        error_message=f"Image dimensions ({width}x{height} = {total_pixels} pixels) exceed safety limit of {MAX_IMAGE_PIXELS} pixels (decompression bomb protection)."
                    )

                # Convert pixel dimensions to points at 72 DPI nominal
                dpi = img.info.get("dpi", (72, 72))
                dpi_x = dpi[0] if isinstance(dpi, tuple) and dpi[0] > 0 else 72.0
                dpi_y = dpi[1] if isinstance(dpi, tuple) and dpi[1] > 0 else 72.0

                width_pts = (width / dpi_x) * 72.0
                height_pts = (height / dpi_y) * 72.0

                return FileScanResult(
                    is_valid=True,
                    format=fmt,
                    mime_type=f"image/{fmt.value}",
                    file_size_bytes=file_size,
                    page_count=1,
                    width_pts=round(width_pts, 2),
                    height_pts=round(height_pts, 2),
                    detected_pages=[1]
                )
        except Image.DecompressionBombError:
            return FileScanResult(
                is_valid=False,
                format=fmt,
                mime_type=f"image/{fmt.value}",
                file_size_bytes=file_size,
                page_count=0,
                error_message="Decompression bomb detected. Image exceeds allowed memory dimensions."
            )
        except Exception as e:
            return FileScanResult(
                is_valid=False,
                format=fmt,
                mime_type=f"image/{fmt.value}",
                file_size_bytes=file_size,
                page_count=0,
                error_message=f"Corrupted or invalid image data: {str(e)}"
            )

    def _scan_svg(self, content: bytes, file_size: int) -> FileScanResult:
        try:
            # XXE Protection: ensure no external entities or DOCTYPE definitions
            decoded = content.decode("utf-8", errors="replace")
            if "<!ENTITY" in decoded or "<!DOCTYPE" in decoded:
                return FileScanResult(
                    is_valid=False,
                    format=SupportedFormat.SVG,
                    mime_type="image/svg+xml",
                    file_size_bytes=file_size,
                    page_count=0,
                    error_message="SVG contains forbidden entity declarations (XXE protection)."
                )

            root = ET.fromstring(content)
            if not root.tag.endswith("svg"):
                return FileScanResult(
                    is_valid=False,
                    format=SupportedFormat.SVG,
                    mime_type="image/svg+xml",
                    file_size_bytes=file_size,
                    page_count=0,
                    error_message="Invalid SVG: Root element is not <svg>."
                )

            return FileScanResult(
                is_valid=True,
                format=SupportedFormat.SVG,
                mime_type="image/svg+xml",
                file_size_bytes=file_size,
                page_count=1,
                width_pts=595.0,  # Default A4 nominal pts
                height_pts=842.0,
                detected_pages=[1]
            )
        except Exception as e:
            return FileScanResult(
                is_valid=False,
                format=SupportedFormat.SVG,
                mime_type="image/svg+xml",
                file_size_bytes=file_size,
                page_count=0,
                error_message=f"Malformed SVG document: {str(e)}"
            )

    def _scan_office_container(self, content: bytes, fmt: SupportedFormat, file_size: int) -> FileScanResult:
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as z:
                namelist = z.namelist()

                # Check for macro components (VBA Project binaries)
                has_macros = any("vbaProject.bin" in name.lower() or name.lower().endswith(".bin") for name in namelist)
                if has_macros:
                    return FileScanResult(
                        is_valid=False,
                        format=fmt,
                        mime_type=f"application/vnd.openxmlformats-officedocument",
                        file_size_bytes=file_size,
                        page_count=0,
                        has_macros=True,
                        error_message="Macro-enabled documents (.docm, .xlsm, .pptm, vbaProject.bin) are forbidden for security."
                    )

                # Estimate pages from word/document.xml or xl/worksheets
                estimated_pages = 1
                if fmt == SupportedFormat.DOCX and "word/document.xml" in namelist:
                    doc_xml = z.read("word/document.xml").decode("utf-8", errors="replace")
                    # Count paragraph tags as rough heuristic: ~10 paragraphs per page
                    p_count = doc_xml.count("</w:p>")
                    estimated_pages = max(1, (p_count // 10) + 1)
                elif fmt == SupportedFormat.XLSX:
                    sheets = [n for n in namelist if n.startswith("xl/worksheets/sheet")]
                    estimated_pages = max(1, len(sheets))
                elif fmt == SupportedFormat.PPTX:
                    slides = [n for n in namelist if n.startswith("ppt/slides/slide")]
                    estimated_pages = max(1, len(slides))

                return FileScanResult(
                    is_valid=True,
                    format=fmt,
                    mime_type="application/vnd.openxmlformats-officedocument",
                    file_size_bytes=file_size,
                    page_count=estimated_pages,
                    has_macros=False,
                    detected_pages=list(range(1, estimated_pages + 1))
                )
        except zipfile.BadZipFile:
            return FileScanResult(
                is_valid=False,
                format=fmt,
                mime_type="application/octet-stream",
                file_size_bytes=file_size,
                page_count=0,
                error_message=f"Corrupted or damaged {fmt.value.upper()} document."
            )

    def _scan_text(self, content: bytes, file_size: int, is_csv: bool = False) -> FileScanResult:
        try:
            text = content.decode("utf-8", errors="replace")
            line_count = len(text.splitlines())
            # ~50 lines per printable page nominal
            estimated_pages = max(1, (line_count // 50) + (1 if line_count % 50 != 0 else 0))
            return FileScanResult(
                is_valid=True,
                format=SupportedFormat.CSV if is_csv else SupportedFormat.TXT,
                mime_type="text/csv" if is_csv else "text/plain",
                file_size_bytes=file_size,
                page_count=estimated_pages,
                detected_pages=list(range(1, estimated_pages + 1))
            )
        except Exception as e:
            return FileScanResult(
                is_valid=False,
                format=SupportedFormat.TXT,
                mime_type="text/plain",
                file_size_bytes=file_size,
                page_count=0,
                error_message=f"Malformed text file: {str(e)}"
            )


conversion_engine = ConversionEngine()
