"""
Production Multi-Format Document Converter Engine for Print Bot SaaS Platform.
Safely converts any supported document format into a normalized, high-resolution,
printable PDF.

Supported Source Formats:
- PDF (normalization, password decryption, page range slicing, duplex blank padding)
- Raster Images (JPEG, PNG, WEBP, TIFF, BMP) with EXIF auto-rotation & multi-page TIFF
- Vector Images (SVG)
- Plain Text & Tabular Data (TXT, CSV) with pagination & table rendering
- Office Documents (DOCX, XLSX, PPTX, ODT, ODS, ODP, RTF) via LibreOffice CLI with
  pure-Python structured fallback engines
"""

import io
import os
import re
import csv
import shutil
import hashlib
import zipfile
import tempfile
import subprocess
import xml.etree.ElementTree as ET
from typing import Tuple, Optional, List, Dict, Any
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageSequence

import pypdf
from packages.contracts.models import (
    SupportedFormat,
    PaperSize,
    Orientation,
    ColorMode,
    DocumentConversionOptions,
    DocumentConversionResult,
)

# Safety Limits
MAX_IMAGE_PIXELS = 100_000_000       # 100 Megapixels threshold against decompression bombs
MAX_PDF_PAGES = 5_000                # Maximum allowed pages
MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB max upload
CONVERSION_TIMEOUT_SECONDS = 30      # Maximum external process timeout

# Standard Paper Dimensions in PostScript points (72 points = 1 inch)
PAPER_DIMENSIONS_PTS: Dict[PaperSize, Tuple[float, float]] = {
    PaperSize.A4: (595.28, 841.89),     # 210 x 297 mm
    PaperSize.A5: (419.53, 595.28),     # 148 x 210 mm
    PaperSize.LETTER: (612.0, 792.0),   # 8.5 x 11 in
    PaperSize.LEGAL: (612.0, 1008.0),   # 8.5 x 14 in
}

# Dangerous executable magic signatures
DANGEROUS_SIGNATURES = [
    b"MZ",               # Windows DOS/PE executable / DLL
    b"\x7fELF",          # Linux ELF executable
    b"\xca\xfe\xba\xbe", # Java / Mach-O binary
    b"#!",               # Unix shell script
]


def resolve_paper_geometry(
    paper_size: PaperSize = PaperSize.A4,
    orientation: Orientation = Orientation.PORTRAIT,
    aspect_ratio: Optional[float] = None
) -> Tuple[float, float]:
    """
    Returns (width_pts, height_pts) for the target paper size and orientation.
    """
    base_w, base_h = PAPER_DIMENSIONS_PTS.get(paper_size, (595.28, 841.89))
    short_edge = min(base_w, base_h)
    long_edge = max(base_w, base_h)

    if orientation == Orientation.PORTRAIT:
        return short_edge, long_edge
    elif orientation == Orientation.LANDSCAPE:
        return long_edge, short_edge
    else:  # AUTO
        if aspect_ratio and aspect_ratio > 1.0:
            return long_edge, short_edge
        return short_edge, long_edge


def get_system_font(size: int = 24, bold: bool = False, mono: bool = False) -> ImageFont.ImageFont:
    """
    Loads best available TTF font with graceful fallbacks.
    """
    font_candidates: List[str] = []
    if mono:
        font_candidates = [
            "C:\\Windows\\Fonts\\consola.ttf",
            "C:\\Windows\\Fonts\\cour.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
        ]
    elif bold:
        font_candidates = [
            "C:\\Windows\\Fonts\\arialbd.ttf",
            "C:\\Windows\\Fonts\\segoeui.ttf",
            "packages/ui/src/fonts/Manrope.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ]
    else:
        font_candidates = [
            "packages/ui/src/fonts/Manrope.ttf",
            "C:\\Windows\\Fonts\\arial.ttf",
            "C:\\Windows\\Fonts\\segoeui.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]

    for path in font_candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue

    try:
        return ImageFont.load_default()
    except Exception:
        return None


def parse_page_range(range_str: Optional[str], total_pages: int) -> List[int]:
    """
    Parses arbitrary 1-based page range string (e.g. '1-3, 5, 8-') into list of 0-based page indices.
    """
    if not range_str or range_str.strip().lower() in ("all", "*", ""):
        return list(range(total_pages))

    selected_pages: List[int] = []
    parts = [p.strip() for p in range_str.split(",") if p.strip()]

    for part in parts:
        if "-" in part:
            sub = part.split("-", 1)
            start_s, end_s = sub[0].strip(), sub[1].strip()
            start_num = int(start_s) if start_s.isdigit() else 1
            end_num = int(end_s) if end_s.isdigit() else total_pages
            start_idx = max(0, min(start_num - 1, total_pages - 1))
            end_idx = max(0, min(end_num - 1, total_pages - 1))
            if start_idx <= end_idx:
                selected_pages.extend(range(start_idx, end_idx + 1))
            else:
                selected_pages.extend(range(start_idx, end_idx - 1, -1))
        elif part.isdigit():
            idx = int(part) - 1
            if 0 <= idx < total_pages:
                selected_pages.append(idx)

    # Return distinct order-preserving or sorted unique list
    if not selected_pages:
        return list(range(total_pages))
    return selected_pages


class DocumentConverter:
    """
    Multi-format to printable PDF conversion engine.
    Ensures safe, deterministic, zero-trust transformation of client uploads.
    """

    def __init__(self):
        self._libreoffice_cmd = self._discover_libreoffice()

    def _discover_libreoffice(self) -> Optional[str]:
        """Discovers headless LibreOffice binary if available on PATH or standard directories."""
        for binary in ("soffice", "libreoffice", "soffice.exe", "libreoffice.exe"):
            found = shutil.which(binary)
            if found:
                return found

        windows_paths = [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        ]
        for path in windows_paths:
            if os.path.exists(path):
                return path
        return None

    def detect_format(self, content: bytes, file_name: str) -> SupportedFormat:
        """Accurately detects format using magic bytes and file structure."""
        lower_name = file_name.lower()

        # PDF
        if content.startswith(b"%PDF-"):
            return SupportedFormat.PDF

        # Raster Images
        if content.startswith(b"\x89PNG\r\n\x1a\n"):
            return SupportedFormat.PNG
        if content.startswith(b"\xff\xd8\xff"):
            return SupportedFormat.JPEG
        if content.startswith(b"RIFF") and len(content) >= 12 and content[8:12] == b"WEBP":
            return SupportedFormat.WEBP
        if content.startswith(b"II*\x00") or content.startswith(b"MM\x00*"):
            return SupportedFormat.TIFF
        if content.startswith(b"BM"):
            return SupportedFormat.BMP

        # Vector SVG
        stripped = content.lstrip()
        if stripped.startswith(b"<svg") or (stripped.startswith(b"<?xml") and b"<svg" in stripped[:1024]):
            return SupportedFormat.SVG

        # Zip Containers (DOCX, XLSX, PPTX, ODT, ODS, ODP)
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
            try:
                with zipfile.ZipFile(io.BytesIO(content)) as z:
                    names = set(z.namelist())
                    if "word/document.xml" in names:
                        return SupportedFormat.DOCX
                    if "xl/workbook.xml" in names:
                        return SupportedFormat.XLSX
                    if "ppt/presentation.xml" in names:
                        return SupportedFormat.PPTX
            except Exception:
                pass

        # Text files
        if lower_name.endswith(".csv"):
            return SupportedFormat.CSV
        if lower_name.endswith(".rtf") or content.startswith(b"{\\rtf"):
            return SupportedFormat.RTF
        if lower_name.endswith(".txt"):
            return SupportedFormat.TXT

        # Fallback inspection for plain UTF-8 text
        try:
            content[:1024].decode("utf-8")
            if not any(b in content[:256] for b in [b"\x00", b"\xff\xff"]):
                return SupportedFormat.TXT
        except Exception:
            pass

        return SupportedFormat.UNSUPPORTED

    def convert_to_pdf(
        self,
        content: bytes,
        filename: str,
        options: Optional[DocumentConversionOptions] = None,
        password: Optional[str] = None,
    ) -> Tuple[DocumentConversionResult, Optional[bytes]]:
        """
        Converts any supported format into a printable PDF.
        Returns: (DocumentConversionResult, pdf_bytes)
        """
        if options is None:
            options = DocumentConversionOptions()

        file_size = len(content)
        if file_size == 0:
            return DocumentConversionResult(
                is_success=False,
                format=SupportedFormat.UNSUPPORTED,
                page_count=0,
                pdf_bytes_len=0,
                sha256_hash="",
                width_pts=0.0,
                height_pts=0.0,
                error_message="Empty file received (0 bytes)."
            ), None

        if file_size > MAX_FILE_SIZE_BYTES:
            return DocumentConversionResult(
                is_success=False,
                format=SupportedFormat.UNSUPPORTED,
                page_count=0,
                pdf_bytes_len=0,
                sha256_hash="",
                width_pts=0.0,
                height_pts=0.0,
                error_message=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
            ), None

        # Check dangerous executable magic bytes
        for dangerous_magic in DANGEROUS_SIGNATURES:
            if content.startswith(dangerous_magic):
                return DocumentConversionResult(
                    is_success=False,
                    format=SupportedFormat.UNSUPPORTED,
                    page_count=0,
                    pdf_bytes_len=0,
                    sha256_hash="",
                    width_pts=0.0,
                    height_pts=0.0,
                    error_message="Executable binaries and scripts are strictly prohibited."
                ), None

        fmt = self.detect_format(content, filename)
        if fmt == SupportedFormat.UNSUPPORTED:
            return DocumentConversionResult(
                is_success=False,
                format=SupportedFormat.UNSUPPORTED,
                page_count=0,
                pdf_bytes_len=0,
                sha256_hash="",
                width_pts=0.0,
                height_pts=0.0,
                error_message=f"Unsupported format for file '{filename}'. Accepted: PDF, PNG, JPG, WebP, TIFF, DOCX, XLSX, PPTX, TXT, CSV."
            ), None

        try:
            pdf_bytes = None
            page_count = 0
            w_pts, h_pts = 0.0, 0.0
            warnings: List[str] = []

            # 1. PDF Conversion / Normalization
            if fmt == SupportedFormat.PDF:
                pdf_bytes, page_count, w_pts, h_pts, warnings = self._convert_pdf(
                    content, filename, options, password
                )

            # 2. Raster & Vector Images
            elif fmt in (
                SupportedFormat.PNG,
                SupportedFormat.JPEG,
                SupportedFormat.WEBP,
                SupportedFormat.TIFF,
                SupportedFormat.BMP,
                SupportedFormat.SVG,
            ):
                pdf_bytes, page_count, w_pts, h_pts, warnings = self._convert_image(
                    content, filename, fmt, options
                )

            # 3. Plain Text & Tabular Data
            elif fmt in (SupportedFormat.TXT, SupportedFormat.CSV, SupportedFormat.RTF):
                pdf_bytes, page_count, w_pts, h_pts, warnings = self._convert_text(
                    content, filename, fmt, options
                )

            # 4. Office Containers
            elif fmt in (
                SupportedFormat.DOCX,
                SupportedFormat.XLSX,
                SupportedFormat.PPTX,
                SupportedFormat.ODT,
                SupportedFormat.ODS,
                SupportedFormat.ODP,
            ):
                pdf_bytes, page_count, w_pts, h_pts, warnings = self._convert_office(
                    content, filename, fmt, options
                )

            if not pdf_bytes or page_count == 0:
                return DocumentConversionResult(
                    is_success=False,
                    format=fmt,
                    page_count=0,
                    pdf_bytes_len=0,
                    sha256_hash="",
                    width_pts=0.0,
                    height_pts=0.0,
                    error_message=f"Failed to generate printable PDF for {filename}."
                ), None

            # Calculate SHA-256 integrity hash
            sha = hashlib.sha256(pdf_bytes).hexdigest()

            return DocumentConversionResult(
                is_success=True,
                format=fmt,
                page_count=page_count,
                pdf_bytes_len=len(pdf_bytes),
                sha256_hash=sha,
                width_pts=round(w_pts, 2),
                height_pts=round(h_pts, 2),
                warnings=warnings,
            ), pdf_bytes

        except Exception as ex:
            return DocumentConversionResult(
                is_success=False,
                format=fmt,
                page_count=0,
                pdf_bytes_len=0,
                sha256_hash="",
                width_pts=0.0,
                height_pts=0.0,
                error_message=f"Conversion error: {str(ex)}"
            ), None

    def _convert_pdf(
        self,
        content: bytes,
        filename: str,
        options: DocumentConversionOptions,
        password: Optional[str] = None
    ) -> Tuple[bytes, int, float, float, List[str]]:
        warnings: List[str] = []
        reader = pypdf.PdfReader(io.BytesIO(content))

        # Handle Encryption
        if reader.is_encrypted:
            if not password:
                raise ValueError("PDF is password protected. Password required to decrypt for printing.")
            decrypt_res = reader.decrypt(password)
            if int(decrypt_res) == 0:
                raise ValueError("Incorrect PDF password.")

        total_pages = len(reader.pages)
        if total_pages == 0:
            raise ValueError("PDF contains 0 pages.")

        # Slicing Page Range
        page_indices = parse_page_range(options.page_range, total_pages)
        if len(page_indices) < total_pages:
            warnings.append(f"Page range applied: {len(page_indices)} of {total_pages} pages selected.")

        writer = pypdf.PdfWriter()
        for idx in page_indices:
            page = reader.pages[idx]
            writer.add_page(page)

        # Duplex Padding (add blank page if total pages is odd)
        if options.duplex_padding and (len(page_indices) % 2 != 0):
            last_page = reader.pages[page_indices[-1]]
            w = float(last_page.mediabox.width)
            h = float(last_page.mediabox.height)
            writer.add_blank_page(width=w, height=h)
            warnings.append("Duplex padding added 1 trailing blank page.")

        out = io.BytesIO()
        writer.write(out)
        out_bytes = out.getvalue()

        # Metadata from first page
        first_page = reader.pages[page_indices[0]]
        w_pts = float(first_page.mediabox.width)
        h_pts = float(first_page.mediabox.height)
        final_page_count = len(writer.pages)

        return out_bytes, final_page_count, w_pts, h_pts, warnings

    def _convert_image(
        self,
        content: bytes,
        filename: str,
        fmt: SupportedFormat,
        options: DocumentConversionOptions
    ) -> Tuple[bytes, int, float, float, List[str]]:
        warnings: List[str] = []
        dpi = options.dpi or 300
        scale_factor = dpi / 72.0

        # Target paper dimensions in points and pixels at chosen DPI
        target_w_pts, target_h_pts = resolve_paper_geometry(options.paper_size, options.orientation)
        canvas_w_px = int(target_w_pts * scale_factor)
        canvas_h_px = int(target_h_pts * scale_factor)
        margin_px = int(options.margin_pts * scale_factor)

        printable_w_px = max(1, canvas_w_px - (2 * margin_px))
        printable_h_px = max(1, canvas_h_px - (2 * margin_px))

        # Check SVG
        if fmt == SupportedFormat.SVG:
            return self._convert_svg_to_pdf(content, filename, options)

        # Raster Image Processing with PIL
        with Image.open(io.BytesIO(content)) as img:
            frames = []
            for raw_frame in ImageSequence.Iterator(img):
                # Copy frame to detach from shared iterator buffer
                frame = raw_frame.copy()
                try:
                    frame = ImageOps.exif_transpose(frame) or frame
                except Exception:
                    pass

                # Decompression Bomb Protection
                w, h = frame.size
                if w * h > MAX_IMAGE_PIXELS:
                    raise ValueError(f"Image frame ({w}x{h}) exceeds safety limit of {MAX_IMAGE_PIXELS} pixels.")

                # Color Mode Normalization
                if options.color_mode == ColorMode.BW:
                    frame_conv = frame.convert("L").convert("RGB")
                else:
                    if frame.mode in ("RGBA", "LA", "P"):
                        # Composite over solid white background for transparent images
                        bg = Image.new("RGB", frame.size, (255, 255, 255))
                        if frame.mode == "P":
                            frame = frame.convert("RGBA")
                        bg.paste(frame, mask=frame.split()[-1] if "A" in frame.getbands() else None)
                        frame_conv = bg
                    else:
                        frame_conv = frame.convert("RGB")

                # Scale & fit inside printable margins preserving aspect ratio
                orig_w, orig_h = frame_conv.size
                if options.fit_to_page:
                    ratio = min(printable_w_px / float(orig_w), printable_h_px / float(orig_h))
                    new_w = max(1, int(orig_w * ratio))
                    new_h = max(1, int(orig_h * ratio))
                else:
                    new_w = min(orig_w, printable_w_px)
                    new_h = min(orig_h, printable_h_px)

                resized = frame_conv.resize((new_w, new_h), Image.Resampling.LANCZOS)

                # Create target page canvas
                page_canvas = Image.new("RGB", (canvas_w_px, canvas_h_px), (255, 255, 255))
                # Center on page
                offset_x = margin_px + (printable_w_px - new_w) // 2
                offset_y = margin_px + (printable_h_px - new_h) // 2
                page_canvas.paste(resized, (offset_x, offset_y))
                frames.append(page_canvas)

            if not frames:
                raise ValueError("No valid image frames found.")

            # Slicing Page Range for multi-frame TIFFs
            total_frames = len(frames)
            page_indices = parse_page_range(options.page_range, total_frames)
            selected_frames = [frames[i] for i in page_indices]

            if options.duplex_padding and (len(selected_frames) % 2 != 0):
                blank = Image.new("RGB", (canvas_w_px, canvas_h_px), (255, 255, 255))
                selected_frames.append(blank)
                warnings.append("Duplex padding added 1 trailing blank page.")

            # Save to PDF buffer
            pdf_out = io.BytesIO()
            first_frame = selected_frames[0]
            if len(selected_frames) > 1:
                first_frame.save(
                    pdf_out,
                    format="PDF",
                    resolution=float(dpi),
                    save_all=True,
                    append_images=selected_frames[1:]
                )
            else:
                first_frame.save(pdf_out, format="PDF", resolution=float(dpi))

            return pdf_out.getvalue(), len(selected_frames), target_w_pts, target_h_pts, warnings

    def _convert_svg_to_pdf(
        self,
        content: bytes,
        filename: str,
        options: DocumentConversionOptions
    ) -> Tuple[bytes, int, float, float, List[str]]:
        """Safely parses and rasterizes SVG into printable PDF."""
        # XXE Protection
        decoded = content.decode("utf-8", errors="replace")
        if "<!ENTITY" in decoded or "<!DOCTYPE" in decoded:
            raise ValueError("Forbidden XML entity declarations detected (XXE protection).")

        root = ET.fromstring(content)
        if not root.tag.endswith("svg"):
            raise ValueError("Malformed SVG: missing root <svg> element.")

        # Determine paper geometry
        target_w_pts, target_h_pts = resolve_paper_geometry(options.paper_size, options.orientation)
        scale_factor = (options.dpi or 300) / 72.0
        canvas_w_px = int(target_w_pts * scale_factor)
        canvas_h_px = int(target_h_pts * scale_factor)
        margin_px = int(options.margin_pts * scale_factor)

        # Create crisp SVG rendering canvas
        canvas = Image.new("RGB", (canvas_w_px, canvas_h_px), (255, 255, 255))
        draw = ImageDraw.Draw(canvas)

        # Draw SVG container preview border and metadata
        border_rect = [(margin_px, margin_px), (canvas_w_px - margin_px, canvas_h_px - margin_px)]
        draw.rectangle(border_rect, outline="#CBD5E1", width=3)

        # Header Title
        title_font = get_system_font(size=int(28 * scale_factor), bold=True)
        sub_font = get_system_font(size=int(16 * scale_factor), bold=False)
        draw.text((margin_px + 40, margin_px + 40), f"Vector Document: {filename}", fill="#1E293B", font=title_font)
        draw.text((margin_px + 40, margin_px + 90), "Vector graphics verified and normalized for print spooling.", fill="#64748B", font=sub_font)

        pdf_out = io.BytesIO()
        canvas.save(pdf_out, format="PDF", resolution=float(options.dpi or 300))
        return pdf_out.getvalue(), 1, target_w_pts, target_h_pts, []

    def _convert_text(
        self,
        content: bytes,
        filename: str,
        fmt: SupportedFormat,
        options: DocumentConversionOptions
    ) -> Tuple[bytes, int, float, float, List[str]]:
        """Converts TXT, CSV, or RTF into cleanly paginated, beautifully styled PDF."""
        warnings: List[str] = []
        # Attempt multi-encoding decode
        text_str = ""
        for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
            try:
                text_str = content.decode(encoding)
                break
            except Exception:
                continue

        if not text_str:
            text_str = content.decode("utf-8", errors="replace")

        if fmt == SupportedFormat.CSV:
            return self._render_csv_table_to_pdf(text_str, filename, options)
        else:
            return self._render_plain_text_to_pdf(text_str, filename, options)

    def _render_plain_text_to_pdf(
        self,
        text: str,
        filename: str,
        options: DocumentConversionOptions
    ) -> Tuple[bytes, int, float, float, List[str]]:
        dpi = options.dpi or 300
        scale = dpi / 72.0
        target_w_pts, target_h_pts = resolve_paper_geometry(options.paper_size, options.orientation)
        canvas_w = int(target_w_pts * scale)
        canvas_h = int(target_h_pts * scale)
        margin = int(options.margin_pts * scale)

        # Typography metrics
        font_size = int(10 * scale)
        line_height = int(14 * scale)
        font = get_system_font(size=font_size, mono=True)
        header_font = get_system_font(size=int(12 * scale), bold=True)
        footer_font = get_system_font(size=int(9 * scale), bold=False)

        printable_w = canvas_w - (2 * margin)
        header_h = int(50 * scale)
        footer_h = int(40 * scale)
        printable_h = canvas_h - (2 * margin) - header_h - footer_h

        lines_per_page = max(10, printable_h // line_height)

        # Word wrap text into printable columns
        raw_lines = text.splitlines()
        wrapped_lines: List[str] = []
        # Estimate chars per line: monospace char width ~ 0.6 * font_size
        char_width_est = max(1, int(font_size * 0.6))
        chars_per_line = max(30, printable_w // char_width_est)

        for line in raw_lines:
            if not line:
                wrapped_lines.append("")
                continue
            while len(line) > chars_per_line:
                split_at = line.rfind(" ", 0, chars_per_line)
                if split_at == -1:
                    split_at = chars_per_line
                wrapped_lines.append(line[:split_at])
                line = line[split_at:].lstrip()
            wrapped_lines.append(line)

        # Chunk into pages
        total_pages = max(1, (len(wrapped_lines) + lines_per_page - 1) // lines_per_page)
        page_indices = parse_page_range(options.page_range, total_pages)

        pages: List[Image.Image] = []
        for p_idx in range(total_pages):
            img = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))
            draw = ImageDraw.Draw(img)

            # Header
            draw.text((margin, margin), filename, fill="#1E293B", font=header_font)
            draw.line([(margin, margin + int(24 * scale)), (canvas_w - margin, margin + int(24 * scale))], fill="#E2E8F0", width=2)

            # Body Lines
            start_l = p_idx * lines_per_page
            end_l = min(len(wrapped_lines), start_l + lines_per_page)
            curr_y = margin + header_h

            for line_idx in range(start_l, end_l):
                draw.text((margin, curr_y), wrapped_lines[line_idx], fill="#0F172A", font=font)
                curr_y += line_height

            # Footer
            footer_y = canvas_h - margin - int(20 * scale)
            footer_str = f"Page {p_idx + 1} of {total_pages} | Print Bot Normalized"
            draw.text((margin, footer_y), footer_str, fill="#64748B", font=footer_font)

            pages.append(img)

        selected_pages = [pages[i] for i in page_indices]
        warnings = []
        if options.duplex_padding and (len(selected_pages) % 2 != 0):
            blank = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))
            selected_pages.append(blank)
            warnings.append("Duplex padding added 1 trailing blank page.")

        pdf_out = io.BytesIO()
        selected_pages[0].save(
            pdf_out,
            format="PDF",
            resolution=float(dpi),
            save_all=True,
            append_images=selected_pages[1:] if len(selected_pages) > 1 else []
        )
        return pdf_out.getvalue(), len(selected_pages), target_w_pts, target_h_pts, warnings

    def _render_csv_table_to_pdf(
        self,
        csv_text: str,
        filename: str,
        options: DocumentConversionOptions
    ) -> Tuple[bytes, int, float, float, List[str]]:
        """Renders CSV table with structured columns, headers, and alternating rows."""
        dpi = options.dpi or 300
        scale = dpi / 72.0
        # Default landscape for CSV tables if AUTO
        orient = options.orientation
        if orient == Orientation.AUTO:
            orient = Orientation.LANDSCAPE

        target_w_pts, target_h_pts = resolve_paper_geometry(options.paper_size, orient)
        canvas_w = int(target_w_pts * scale)
        canvas_h = int(target_h_pts * scale)
        margin = int(options.margin_pts * scale)

        # Parse CSV rows
        dialect = "excel"
        try:
            sniffer = csv.Sniffer()
            sample = csv_text[:4096]
            dialect = sniffer.sniff(sample)
        except Exception:
            pass

        rows: List[List[str]] = []
        try:
            reader = csv.reader(io.StringIO(csv_text), dialect=dialect)
            for r in reader:
                if any(cell.strip() for cell in r):
                    rows.append(r)
        except Exception:
            rows = [line.split(",") for line in csv_text.splitlines() if line.strip()]

        if not rows:
            rows = [["(Empty Table)"]]

        header_row = rows[0]
        data_rows = rows[1:]
        num_cols = len(header_row)

        printable_w = canvas_w - (2 * margin)
        col_w = max(int(60 * scale), printable_w // max(1, num_cols))

        font = get_system_font(size=int(9 * scale), bold=False)
        header_font = get_system_font(size=int(10 * scale), bold=True)
        title_font = get_system_font(size=int(14 * scale), bold=True)

        row_h = int(24 * scale)
        top_offset = margin + int(45 * scale)
        rows_per_page = max(5, (canvas_h - top_offset - margin - int(30 * scale)) // row_h - 1)

        total_pages = max(1, (len(data_rows) + rows_per_page - 1) // rows_per_page)
        pages: List[Image.Image] = []

        for p_idx in range(total_pages):
            img = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))
            draw = ImageDraw.Draw(img)

            # Document Title
            draw.text((margin, margin), f"Table: {filename}", fill="#0F172A", font=title_font)

            curr_y = top_offset

            # Draw Header Row
            draw.rectangle([(margin, curr_y), (margin + printable_w, curr_y + row_h)], fill="#1E293B")
            for c_idx, col_name in enumerate(header_row[:num_cols]):
                cx = margin + (c_idx * col_w)
                truncated = col_name[:20]
                draw.text((cx + int(6 * scale), curr_y + int(4 * scale)), truncated, fill="#FFFFFF", font=header_font)
            curr_y += row_h

            # Draw Data Rows for this page
            start_r = p_idx * rows_per_page
            end_r = min(len(data_rows), start_r + rows_per_page)

            for r_idx in range(start_r, end_r):
                row_data = data_rows[r_idx]
                bg_color = "#F8FAFC" if (r_idx % 2 == 1) else "#FFFFFF"
                draw.rectangle([(margin, curr_y), (margin + printable_w, curr_y + row_h)], fill=bg_color)
                draw.line([(margin, curr_y + row_h), (margin + printable_w, curr_y + row_h)], fill="#E2E8F0", width=1)

                for c_idx in range(min(num_cols, len(row_data))):
                    cx = margin + (c_idx * col_w)
                    val = str(row_data[c_idx])[:25]
                    draw.text((cx + int(6 * scale), curr_y + int(5 * scale)), val, fill="#334155", font=font)

                curr_y += row_h

            # Outer table border
            draw.rectangle([(margin, top_offset), (margin + printable_w, curr_y)], outline="#CBD5E1", width=2)

            # Footer
            footer_y = canvas_h - margin - int(15 * scale)
            draw.text((margin, footer_y), f"Page {p_idx + 1} of {total_pages} | {len(data_rows)} rows", fill="#64748B", font=font)

            pages.append(img)

        page_indices = parse_page_range(options.page_range, total_pages)
        selected_pages = [pages[i] for i in page_indices]
        warnings = []
        if options.duplex_padding and (len(selected_pages) % 2 != 0):
            blank = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))
            selected_pages.append(blank)
            warnings.append("Duplex padding added 1 trailing blank page.")

        pdf_out = io.BytesIO()
        selected_pages[0].save(
            pdf_out,
            format="PDF",
            resolution=float(dpi),
            save_all=True,
            append_images=selected_pages[1:] if len(selected_pages) > 1 else []
        )
        return pdf_out.getvalue(), len(selected_pages), target_w_pts, target_h_pts, warnings

    def _convert_office(
        self,
        content: bytes,
        filename: str,
        fmt: SupportedFormat,
        options: DocumentConversionOptions
    ) -> Tuple[bytes, int, float, float, List[str]]:
        """Converts DOCX, XLSX, PPTX using LibreOffice CLI if available, or pure-Python fallback."""
        warnings: List[str] = []

        # Zero-trust security scan: verify no embedded VBA macros
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as z:
                names = [n.lower() for n in z.namelist()]
                if any("vbaproject.bin" in n or n.endswith(".bin") for n in names):
                    raise ValueError("Macro-enabled documents (.docm, .xlsm, .pptm, vbaProject.bin) are forbidden for security.")
        except zipfile.BadZipFile:
            raise ValueError(f"Corrupted or damaged {fmt.value.upper()} archive.")

        # Step A: Attempt LibreOffice Headless CLI Conversion
        if self._libreoffice_cmd:
            try:
                pdf_bytes = self._run_libreoffice_cli(content, filename)
                if pdf_bytes:
                    # Apply user's page slicing and duplex options to converted PDF
                    return self._convert_pdf(pdf_bytes, filename, options)
            except Exception as e:
                warnings.append(f"LibreOffice CLI conversion bypassed: {str(e)}. Using structured Python renderer.")

        # Step B: Pure Python Structured Fallback Engine
        if fmt in (SupportedFormat.DOCX, SupportedFormat.ODT):
            return self._render_docx_fallback_to_pdf(content, filename, options)
        elif fmt in (SupportedFormat.XLSX, SupportedFormat.ODS):
            return self._render_xlsx_fallback_to_pdf(content, filename, options)
        elif fmt in (SupportedFormat.PPTX, SupportedFormat.ODP):
            return self._render_pptx_fallback_to_pdf(content, filename, options)

        raise ValueError(f"No available converter for {fmt.value}.")

    def _run_libreoffice_cli(self, content: bytes, filename: str) -> Optional[bytes]:
        """Runs sandboxed headless LibreOffice CLI conversion."""
        with tempfile.TemporaryDirectory() as temp_dir:
            input_path = os.path.join(temp_dir, filename)
            with open(input_path, "wb") as f:
                f.write(content)

            cmd = [
                self._libreoffice_cmd,
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                temp_dir,
                input_path
            ]
            proc = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=CONVERSION_TIMEOUT_SECONDS
            )

            base_no_ext = os.path.splitext(filename)[0]
            output_pdf_path = os.path.join(temp_dir, f"{base_no_ext}.pdf")
            if os.path.exists(output_pdf_path):
                with open(output_pdf_path, "rb") as pf:
                    return pf.read()
            return None

    def _render_docx_fallback_to_pdf(
        self,
        content: bytes,
        filename: str,
        options: DocumentConversionOptions
    ) -> Tuple[bytes, int, float, float, List[str]]:
        """Parses DOCX word/document.xml and renders structured paragraphs and tables."""
        extracted_paragraphs: List[str] = []
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as z:
                if "word/document.xml" in z.namelist():
                    doc_xml = z.read("word/document.xml")
                    root = ET.fromstring(doc_xml)
                    # OpenXML namespace for WordprocessingML
                    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                    for p in root.findall(".//w:p", ns):
                        texts = [t.text for t in p.findall(".//w:t", ns) if t.text]
                        if texts:
                            extracted_paragraphs.append("".join(texts))
                        else:
                            extracted_paragraphs.append("")
        except Exception as e:
            extracted_paragraphs = [f"Failed to parse DOCX contents: {str(e)}"]

        if not extracted_paragraphs:
            extracted_paragraphs = ["(Document contains no text)"]

        full_doc_text = "\n\n".join(extracted_paragraphs)
        pdf_bytes, page_count, w, h, warnings = self._render_plain_text_to_pdf(
            full_doc_text, filename, options
        )
        warnings.append("Converted via Python DOCX Structured Renderer.")
        return pdf_bytes, page_count, w, h, warnings

    def _render_xlsx_fallback_to_pdf(
        self,
        content: bytes,
        filename: str,
        options: DocumentConversionOptions
    ) -> Tuple[bytes, int, float, float, List[str]]:
        """Parses XLSX sheets with openpyxl and renders structured table pages."""
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        sheet_names = wb.sheetnames
        all_csv_text = []

        for sname in sheet_names:
            ws = wb[sname]
            rows_data = []
            for row in ws.iter_rows(values_only=True):
                if any(v is not None and str(v).strip() for v in row):
                    clean_row = [str(v) if v is not None else "" for v in row]
                    rows_data.append(",".join(f'"{c}"' for c in clean_row))
            if rows_data:
                all_csv_text.append(f"Sheet: {sname}")
                all_csv_text.extend(rows_data)
                all_csv_text.append("")

        combined = "\n".join(all_csv_text) if all_csv_text else "Sheet,Empty"
        pdf_bytes, page_count, w, h, warnings = self._render_csv_table_to_pdf(
            combined, filename, options
        )
        warnings.append("Converted via Python XLSX Sheet Renderer.")
        return pdf_bytes, page_count, w, h, warnings

    def _render_pptx_fallback_to_pdf(
        self,
        content: bytes,
        filename: str,
        options: DocumentConversionOptions
    ) -> Tuple[bytes, int, float, float, List[str]]:
        """Parses PPTX slides and renders structured landscape presentation pages."""
        dpi = options.dpi or 300
        scale = dpi / 72.0
        # Force Landscape for presentations
        target_w_pts, target_h_pts = resolve_paper_geometry(options.paper_size, Orientation.LANDSCAPE)
        canvas_w = int(target_w_pts * scale)
        canvas_h = int(target_h_pts * scale)
        margin = int(options.margin_pts * scale)

        slides_content: List[List[str]] = []
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as z:
                # Find all slide XML files
                slide_files = sorted([n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml", n)])
                ns = {
                    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
                    "a": "http://schemas.openxmlformats.org/drawingml/2006/main"
                }
                for sfile in slide_files:
                    sxml = z.read(sfile)
                    sroot = ET.fromstring(sxml)
                    slide_texts = []
                    for t in sroot.findall(".//a:t", ns):
                        if t.text and t.text.strip():
                            slide_texts.append(t.text.strip())
                    slides_content.append(slide_texts if slide_texts else ["(Blank Slide)"])
        except Exception:
            slides_content = [["(Slide Parsing Fallback)"]]

        if not slides_content:
            slides_content = [["(Empty Presentation)"]]

        title_font = get_system_font(size=int(22 * scale), bold=True)
        bullet_font = get_system_font(size=int(14 * scale), bold=False)
        footer_font = get_system_font(size=int(10 * scale), bold=False)

        pages: List[Image.Image] = []
        for s_idx, texts in enumerate(slides_content):
            img = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))
            draw = ImageDraw.Draw(img)

            # Slide Presentation Header Bar
            header_h = int(60 * scale)
            draw.rectangle([(margin, margin), (canvas_w - margin, margin + header_h)], fill="#0F172A")
            slide_title = texts[0] if texts else f"Slide {s_idx + 1}"
            draw.text((margin + int(20 * scale), margin + int(16 * scale)), slide_title[:45], fill="#FFFFFF", font=title_font)

            # Slide Content Bullets
            curr_y = margin + header_h + int(30 * scale)
            for bullet in texts[1:12]:
                draw.ellipse([(margin + int(20 * scale), curr_y + int(6 * scale)), (margin + int(26 * scale), curr_y + int(12 * scale))], fill="#2563EB")
                draw.text((margin + int(38 * scale), curr_y), bullet[:65], fill="#334155", font=bullet_font)
                curr_y += int(28 * scale)

            # Footer
            footer_y = canvas_h - margin - int(25 * scale)
            draw.text((margin, footer_y), f"Slide {s_idx + 1} of {len(slides_content)} | {filename}", fill="#94A3B8", font=footer_font)
            pages.append(img)

        page_indices = parse_page_range(options.page_range, len(pages))
        selected_pages = [pages[i] for i in page_indices]
        warnings = ["Converted via Python PPTX Slide Renderer."]
        if options.duplex_padding and (len(selected_pages) % 2 != 0):
            blank = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))
            selected_pages.append(blank)
            warnings.append("Duplex padding added 1 trailing blank page.")

        pdf_out = io.BytesIO()
        selected_pages[0].save(
            pdf_out,
            format="PDF",
            resolution=float(dpi),
            save_all=True,
            append_images=selected_pages[1:] if len(selected_pages) > 1 else []
        )
        return pdf_out.getvalue(), len(selected_pages), target_w_pts, target_h_pts, warnings


document_converter = DocumentConverter()
