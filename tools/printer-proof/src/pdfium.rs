use windows_sys::Win32::Foundation::FreeLibrary;
// Narrow PDFium ABI. The operator must supply a separately audited, no-JS/no-XFA build.
use sha2::{Digest, Sha256};
use std::{
    ffi::{c_int, c_void},
    path::Path,
    ptr,
};
use windows_sys::Win32::System::LibraryLoader::{
    GetProcAddress, LoadLibraryExW, LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR, LOAD_LIBRARY_SEARCH_SYSTEM32,
};

type Handle = *mut c_void;
type Init = unsafe extern "system" fn();
type Load = unsafe extern "system" fn(*const c_void, usize, *const i8) -> Handle;
type Close = unsafe extern "system" fn(Handle);
type Count = unsafe extern "system" fn(Handle) -> c_int;
type Page = unsafe extern "system" fn(Handle, c_int) -> Handle;
type Dimension = unsafe extern "system" fn(Handle) -> f64;
type Bitmap = unsafe extern "system" fn(c_int, c_int, c_int) -> Handle;
type Fill = unsafe extern "system" fn(Handle, c_int, c_int, c_int, c_int, u32) -> c_int;
type Render = unsafe extern "system" fn(Handle, Handle, c_int, c_int, c_int, c_int, c_int, c_int);
type Buffer = unsafe extern "system" fn(Handle) -> *mut c_void;
type Stride = unsafe extern "system" fn(Handle) -> c_int;

pub struct Pdfium {
    library: Handle,
    document: Handle,
    _bytes: Vec<u8>,
    _dll_lock: std::fs::File,
    destroy: Init,
    close_document: Close,
    page_count: Count,
    load_page: Page,
    close_page: Close,
    width: Dimension,
    height: Dimension,
    bitmap: Bitmap,
    destroy_bitmap: Close,
    fill: Fill,
    render: Render,
    buffer: Buffer,
    stride: Stride,
}
impl Drop for Pdfium {
    fn drop(&mut self) {
        unsafe {
            (self.close_document)(self.document);
            (self.destroy)();
            FreeLibrary(self.library);
        }
    }
}
pub struct Raster {
    pub width: i32,
    pub height: i32,
    pub pixels: Vec<u8>,
}
impl Pdfium {
    pub fn open(
        dll: &Path,
        expected_hash: &str,
        pdf: &Path,
        pdf_sha256: &str,
    ) -> Result<Self, String> {
        if !dll.is_absolute() || !pdf.is_absolute() {
            return Err("PDF and audited PDFium DLL paths must be absolute".into());
        }
        if dll
            .file_name()
            .and_then(|s| s.to_str())
            .is_some_and(|s| s.eq_ignore_ascii_case("pdfiumlo.dll"))
        {
            return Err("LibreOffice pdfiumlo.dll is not an approved standalone PDFium ABI".into());
        }
        let mut dll_lock = std::fs::OpenOptions::new()
            .read(true)
            .share_mode(1)
            .open(dll)
            .map_err(|e| format!("lock PDFium DLL: {e}"))?;
        let mut bytes = Vec::new();
        (&mut dll_lock)
            .take(256 * 1024 * 1024 + 1)
            .read_to_end(&mut bytes)
            .map_err(|e| format!("read PDFium DLL: {e}"))?;
        if bytes.len() > 256 * 1024 * 1024 {
            return Err("PDFium DLL exceeds bounded loading limit".into());
        }
        let actual = format!("{:x}", Sha256::digest(&bytes));
        if expected_hash.len() != 64 || !actual.eq_ignore_ascii_case(expected_hash) {
            return Err("PDFium DLL SHA-256 mismatch".into());
        }
        let wide: Vec<u16> = dll.as_os_str().encode_wide().chain(Some(0)).collect();
        let mut pdf_bytes = Vec::new();
        std::fs::File::open(pdf)
            .map_err(|e| format!("open trusted PDF: {e}"))?
            .take(32 * 1024 * 1024 + 1)
            .read_to_end(&mut pdf_bytes)
            .map_err(|e| format!("read trusted PDF: {e}"))?;
        if pdf_bytes.len() > 32 * 1024 * 1024 || !pdf_bytes.starts_with(b"%PDF-") {
            return Err("PDF exceeds native envelope or bad magic".into());
        }
        if format!("{:x}", Sha256::digest(&pdf_bytes)) != pdf_sha256 {
            return Err("PDF content hash mismatch".into());
        }
        unsafe {
            let library = LoadLibraryExW(
                wide.as_ptr(),
                ptr::null_mut(),
                LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR | LOAD_LIBRARY_SEARCH_SYSTEM32,
            );
            if library.is_null() {
                return Err(format!(
                    "LoadLibraryExW: {}",
                    std::io::Error::last_os_error()
                ));
            }
            macro_rules! symbol {
                ($name:literal,$ty:ty) => {
                    match GetProcAddress(library, concat!($name, "\0").as_ptr()) {
                        Some(f) => {
                            std::mem::transmute::<unsafe extern "system" fn() -> isize, $ty>(f)
                        }
                        None => {
                            FreeLibrary(library);
                            return Err(concat!("missing PDFium export: ", $name).into());
                        }
                    }
                };
            }
            let init = symbol!("FPDF_InitLibrary", Init);
            let destroy = symbol!("FPDF_DestroyLibrary", Init);
            let load = symbol!("FPDF_LoadMemDocument64", Load);
            let close_document = symbol!("FPDF_CloseDocument", Close);
            // Resolve every symbol before initialization, so a failed lookup cannot leak PDFium state.
            let page_count = symbol!("FPDF_GetPageCount", Count);
            let load_page = symbol!("FPDF_LoadPage", Page);
            let close_page = symbol!("FPDF_ClosePage", Close);
            let width = symbol!("FPDF_GetPageWidth", Dimension);
            let height = symbol!("FPDF_GetPageHeight", Dimension);
            let bitmap = symbol!("FPDFBitmap_Create", Bitmap);
            let destroy_bitmap = symbol!("FPDFBitmap_Destroy", Close);
            let fill = symbol!("FPDFBitmap_FillRect", Fill);
            let render = symbol!("FPDF_RenderPageBitmap", Render);
            let buffer = symbol!("FPDFBitmap_GetBuffer", Buffer);
            let stride = symbol!("FPDFBitmap_GetStride", Stride);
            init();
            let document = load(
                pdf_bytes.as_ptr() as *const c_void,
                pdf_bytes.len(),
                ptr::null(),
            );
            if document.is_null() {
                destroy();
                FreeLibrary(library);
                return Err("PDFium rejected PDF (invalid or encrypted)".into());
            }
            Ok(Self {
                library,
                document,
                _bytes: pdf_bytes,
                _dll_lock: dll_lock,
                destroy,
                close_document,
                page_count,
                load_page,
                close_page,
                width,
                height,
                bitmap,
                destroy_bitmap,
                fill,
                render,
                buffer,
                stride,
            })
        }
    }
    pub fn count(&self) -> i32 {
        unsafe { (self.page_count)(self.document) }
    }
    pub fn dimensions(&self, index: i32) -> Result<(f64, f64), String> {
        unsafe {
            let p = (self.load_page)(self.document, index);
            if p.is_null() {
                return Err("PDFium page load failed".into());
            }
            let w = (self.width)(p);
            let h = (self.height)(p);
            (self.close_page)(p);
            if !w.is_finite()
                || !h.is_finite()
                || w <= 0.0
                || h <= 0.0
                || w > 14400.0
                || h > 14400.0
            {
                return Err("PDF page dimensions outside proof limits".into());
            }
            Ok((w, h))
        }
    }
    pub fn raster(&self, index: i32, dpi: i32, color: &str) -> Result<Raster, String> {
        let (w, h) = self.dimensions(index)?;
        let width = (w * f64::from(dpi) / 72.0).ceil() as i32;
        let height = (h * f64::from(dpi) / 72.0).ceil() as i32;
        if width <= 0 || height <= 0 || i64::from(width) * i64::from(height) > 32_000_000 {
            return Err("render exceeds 32 million pixel / 128 MB limit".into());
        }
        unsafe {
            let page = (self.load_page)(self.document, index);
            if page.is_null() {
                return Err("PDFium page load failed".into());
            }
            let bitmap = (self.bitmap)(width, height, 1);
            if bitmap.is_null() {
                (self.close_page)(page);
                return Err("PDFium bitmap allocation failed".into());
            }
            if (self.fill)(bitmap, 0, 0, width, height, 0xffffffff) == 0 {
                (self.destroy_bitmap)(bitmap);
                (self.close_page)(page);
                return Err("PDFium white background fill failed".into());
            }
            // FPDF_PRINTING | FPDF_ANNOT: include printable annotation appearances.
            (self.render)(bitmap, page, 0, 0, width, height, 0, 0x801);
            let stride = (self.stride)(bitmap);
            let pointer = (self.buffer)(bitmap);
            if stride != width * 4 || pointer.is_null() {
                (self.destroy_bitmap)(bitmap);
                (self.close_page)(page);
                return Err("unexpected PDFium bitmap layout".into());
            }
            let mut pixels = std::slice::from_raw_parts(
                pointer as *const u8,
                (stride as usize) * (height as usize),
            )
            .to_vec();
            (self.destroy_bitmap)(bitmap);
            (self.close_page)(page);
            for p in pixels.as_chunks_mut::<4>().0 {
                if color != "color" {
                    let gray =
                        ((u32::from(p[2]) * 299 + u32::from(p[1]) * 587 + u32::from(p[0]) * 114)
                            / 1000) as u8;
                    let gray = if color == "bw" {
                        if gray >= 128 {
                            255
                        } else {
                            0
                        }
                    } else {
                        gray
                    };
                    p[0] = gray;
                    p[1] = gray;
                    p[2] = gray;
                }
                p[3] = 255;
            }
            Ok(Raster {
                width,
                height,
                pixels,
            })
        }
    }
}
use std::os::windows::ffi::OsStrExt;

use std::io::Read;
use std::os::windows::fs::OpenOptionsExt;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore = "requires an explicitly audited local PDFium artifact; never submits a job"]
    fn audited_pdfium_renders_synthetic_fixture_without_printer_access() {
        let dll = std::path::PathBuf::from(
            std::env::var_os("PRINTBOT_PDFIUM_DLL").expect("PRINTBOT_PDFIUM_DLL required"),
        );
        let dll_sha256 =
            std::env::var("PRINTBOT_PDFIUM_SHA256").expect("PRINTBOT_PDFIUM_SHA256 required");
        let pdf = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../fixtures/printable/portrait-3.pdf")
            .canonicalize()
            .unwrap();
        let digest = format!("{:x}", Sha256::digest(std::fs::read(&pdf).unwrap()));
        assert!(Pdfium::open(&dll, &"0".repeat(64), &pdf, &digest).is_err());
        assert!(Pdfium::open(&dll, &dll_sha256, &pdf, &"0".repeat(64)).is_err());
        let engine = Pdfium::open(&dll, &dll_sha256, &pdf, &digest).unwrap();
        assert_eq!(engine.count(), 3);
        let color = engine.raster(0, 72, "color").unwrap();
        assert!(color.width > 0 && color.height > 0);
        assert!(color
            .pixels
            .as_chunks::<4>()
            .0
            .iter()
            .any(|p| p[0] < 250 || p[1] < 250 || p[2] < 250));
        let gray = engine.raster(0, 72, "grayscale").unwrap();
        assert!(gray
            .pixels
            .as_chunks::<4>()
            .0
            .iter()
            .all(|p| p[0] == p[1] && p[1] == p[2] && p[3] == 255));
        let bw = engine.raster(0, 72, "bw").unwrap();
        assert!(bw
            .pixels
            .as_chunks::<4>()
            .0
            .iter()
            .all(|p| (p[0] == 0 || p[0] == 255) && p[0] == p[1] && p[1] == p[2] && p[3] == 255));
    }
}
