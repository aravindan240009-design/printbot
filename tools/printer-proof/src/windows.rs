//! Supervised Windows proof adapter. Spooler observations never certify physical output.
use crate::pdfium::Pdfium;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{
    mem::{size_of, zeroed},
    path::Path,
    ptr,
};
use windows_sys::Win32::{
    Foundation::GetLastError,
    Graphics::{Gdi::*, Printing::*},
    Storage::Xps::*,
};

fn wide(s: &str) -> Result<Vec<u16>, String> {
    if s.contains('\0') {
        return Err("NUL in Windows name/path".into());
    }
    Ok(s.encode_utf16().chain(Some(0)).collect())
}
fn error(op: &str) -> String {
    format!("{op}: {}", std::io::Error::last_os_error())
}
// Driver buffers require native alignment; a byte Vec does not guarantee it.
struct Buffer {
    words: Vec<usize>,
    len: u32,
}
impl Buffer {
    fn new(len: u32) -> Result<Self, String> {
        if len == 0 || len > 16 * 1024 * 1024 {
            return Err("invalid/oversized driver buffer".into());
        }
        Ok(Self {
            words: vec![0; (len as usize).div_ceil(size_of::<usize>())],
            len,
        })
    }
    fn ptr(&mut self) -> *mut u8 {
        self.words.as_mut_ptr() as *mut u8
    }
}
unsafe fn string(p: *const u16) -> String {
    if p.is_null() {
        return String::new();
    }
    let mut len = 0;
    while len < 32768 && *p.add(len) != 0 {
        len += 1
    }
    String::from_utf16_lossy(std::slice::from_raw_parts(p, len))
}
struct Printer(PRINTER_HANDLE);
impl Printer {
    fn open(name: &str) -> Result<Self, String> {
        if name.trim().is_empty() {
            return Err("an exact explicit printer name is required".into());
        }
        let name = wide(name)?;
        let mut p = PRINTER_HANDLE::default();
        if unsafe { OpenPrinterW(name.as_ptr(), &mut p, ptr::null()) } == 0 {
            return Err(error("OpenPrinterW"));
        }
        Ok(Self(p))
    }
}
impl Drop for Printer {
    fn drop(&mut self) {
        unsafe {
            ClosePrinter(self.0);
        }
    }
}
struct Dc(HDC);
impl Drop for Dc {
    fn drop(&mut self) {
        unsafe {
            DeleteDC(self.0);
        }
    }
}
struct Submission<'a> {
    dc: &'a Dc,
    ended: bool,
}
impl Drop for Submission<'_> {
    fn drop(&mut self) {
        if !self.ended {
            unsafe {
                AbortDoc(self.dc.0);
            }
        }
    }
}

pub fn list() -> Result<Value, String> {
    unsafe {
        let (mut needed, mut count) = (0, 0);
        let flags = PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS;
        let ok = EnumPrintersW(
            flags,
            ptr::null(),
            4,
            ptr::null_mut(),
            0,
            &mut needed,
            &mut count,
        );
        if ok != 0 && needed == 0 {
            return Ok(json!({"backend":"windows","printers":[]}));
        }
        if needed == 0 {
            return Err(error("EnumPrintersW sizing"));
        }
        let mut b = Buffer::new(needed)?;
        if EnumPrintersW(
            flags,
            ptr::null(),
            4,
            b.ptr(),
            b.len,
            &mut needed,
            &mut count,
        ) == 0
        {
            return Err(error("EnumPrintersW"));
        }
        if count as usize > b.len as usize / size_of::<PRINTER_INFO_4W>() {
            return Err("invalid printer count".into());
        }
        let entries = std::slice::from_raw_parts(b.ptr() as *const PRINTER_INFO_4W, count as usize);
        let printers:Vec<Value>=entries.iter().map(|p|json!({"name":string(p.pPrinterName),"server":string(p.pServerName),"attributes":p.Attributes})).collect();
        Ok(json!({"backend":"windows","printers":printers}))
    }
}
fn info(printer: &Printer) -> Result<Buffer, String> {
    unsafe {
        let mut needed = 0;
        GetPrinterW(printer.0, 2, ptr::null_mut(), 0, &mut needed);
        let mut b = Buffer::new(needed)?;
        if GetPrinterW(printer.0, 2, b.ptr(), b.len, &mut needed) == 0 {
            return Err(error("GetPrinterW"));
        }
        if b.len < size_of::<PRINTER_INFO_2W>() as u32 {
            return Err("short printer info".into());
        }
        Ok(b)
    }
}
fn capability(
    name: &[u16],
    port: *const u16,
    kind: u16,
    out: *mut u16,
    dm: *const DEVMODEW,
) -> i32 {
    unsafe { DeviceCapabilitiesW(name.as_ptr(), port, kind, out, dm) }
}
fn default_mode(p: &Printer, name: &[u16]) -> Result<Buffer, String> {
    unsafe {
        let size = DocumentPropertiesW(
            ptr::null_mut(),
            p.0,
            name.as_ptr(),
            ptr::null_mut(),
            ptr::null(),
            0,
        );
        if size < size_of::<DEVMODEW>() as i32 {
            return Err(error("DocumentPropertiesW size"));
        }
        let mut b = Buffer::new(size as u32)?;
        if DocumentPropertiesW(
            ptr::null_mut(),
            p.0,
            name.as_ptr(),
            b.ptr() as *mut DEVMODEW,
            ptr::null(),
            DM_OUT_BUFFER,
        ) != 1
        {
            return Err(error("DocumentPropertiesW defaults"));
        }
        let dm = &*(b.ptr() as *const DEVMODEW);
        if dm.dmSize < size_of::<DEVMODEW>() as u16
            || u32::from(dm.dmSize) + u32::from(dm.dmDriverExtra) > b.len
        {
            return Err("invalid driver DEVMODE extent".into());
        }
        Ok(b)
    }
}
pub fn capabilities(name: &str) -> Result<Value, String> {
    let p = Printer::open(name)?;
    let n = wide(name)?;
    let mut b = info(&p)?;
    let mut mode = default_mode(&p, &n)?;
    unsafe {
        let i = &*(b.ptr() as *const PRINTER_INFO_2W);
        let dm = mode.ptr() as *const DEVMODEW;
        let paper_count = capability(&n, i.pPortName, DC_PAPERS, ptr::null_mut(), dm);
        let mut papers = Vec::new();
        if paper_count > 0 && paper_count <= 2048 {
            let mut ids = vec![0u16; paper_count as usize];
            let mut sizes = vec![0i32; paper_count as usize * 2];
            let mut names = vec![0u16; paper_count as usize * 64];
            if capability(&n, i.pPortName, DC_PAPERS, ids.as_mut_ptr(), dm) != paper_count
                || capability(
                    &n,
                    i.pPortName,
                    DC_PAPERSIZE,
                    sizes.as_mut_ptr() as *mut u16,
                    dm,
                ) != paper_count
                || capability(&n, i.pPortName, DC_PAPERNAMES, names.as_mut_ptr(), dm) != paper_count
            {
                return Err("paper capability set changed/incomplete".into());
            }
            for index in 0..paper_count as usize {
                let text = &names[index * 64..(index + 1) * 64];
                let end = text.iter().position(|x| *x == 0).unwrap_or(64);
                papers.push(json!({"id":ids[index],"name":String::from_utf16_lossy(&text[..end]),"width_um":sizes[index*2]*100,"height_um":sizes[index*2+1]*100}));
            }
        }
        let bin_count = capability(&n, i.pPortName, DC_BINS, ptr::null_mut(), dm);
        let mut bins = Vec::new();
        if bin_count > 0 && bin_count <= 2048 {
            let mut ids = vec![0u16; bin_count as usize];
            let mut names = vec![0u16; bin_count as usize * 24];
            if capability(&n, i.pPortName, DC_BINS, ids.as_mut_ptr(), dm) != bin_count
                || capability(&n, i.pPortName, DC_BINNAMES, names.as_mut_ptr(), dm) != bin_count
            {
                return Err("bin capability set changed/incomplete".into());
            }
            for j in 0..bin_count as usize {
                let t = &names[j * 24..(j + 1) * 24];
                let end = t.iter().position(|x| *x == 0).unwrap_or(24);
                bins.push(json!({"id":ids[j],"name":String::from_utf16_lossy(&t[..end])}));
            }
        }
        let driver = wide("WINSPOOL")?;
        let dc = Dc(CreateDCW(driver.as_ptr(), n.as_ptr(), ptr::null(), dm));
        let default_printable_area = if dc.0.is_null() {
            Value::Null
        } else {
            json!({"units":"device_pixels","dpi_x":GetDeviceCaps(dc.0,LOGPIXELSX as i32),"dpi_y":GetDeviceCaps(dc.0,LOGPIXELSY as i32),"physical_width":GetDeviceCaps(dc.0,PHYSICALWIDTH as i32),"physical_height":GetDeviceCaps(dc.0,PHYSICALHEIGHT as i32),"printable_width":GetDeviceCaps(dc.0,HORZRES as i32),"printable_height":GetDeviceCaps(dc.0,VERTRES as i32),"offset_x":GetDeviceCaps(dc.0,PHYSICALOFFSETX as i32),"offset_y":GetDeviceCaps(dc.0,PHYSICALOFFSETY as i32),"scope":"driver-default DEVMODE only; each job is validated separately"})
        };
        Ok(
            json!({"backend":"windows","printer":name,"driver":string(i.pDriverName),"port":string(i.pPortName),"status_bits":i.Status,"papers":papers,"bins":bins,"default_printable_area":default_printable_area,"duplex_raw":capability(&n,i.pPortName,DC_DUPLEX,ptr::null_mut(),dm),"color_raw":capability(&n,i.pPortName,DC_COLORDEVICE,ptr::null_mut(),dm),"max_driver_copies_raw":capability(&n,i.pPortName,DC_COPIES,ptr::null_mut(),dm),"combinations_verified":false,"physical_complete":null}),
        )
    }
}

pub fn observe(name: &str, id: u32) -> Result<Value, String> {
    let p = Printer::open(name)?;
    unsafe {
        let mut needed = 0;
        GetJobW(p.0, id, 1, ptr::null_mut(), 0, &mut needed);
        let code = GetLastError();
        if needed == 0 {
            if code == 87 || code == 2 {
                return Ok(
                    json!({"backend":"windows","job_id":id,"present":false,"state":"COMPLETION_UNKNOWN","physical_complete":null,"automatic_reprint":false}),
                );
            }
            return Err(error("GetJobW sizing"));
        }
        let mut b = Buffer::new(needed)?;
        if GetJobW(p.0, id, 1, b.ptr(), b.len, &mut needed) == 0 {
            return Err(error("GetJobW"));
        }
        if b.len < size_of::<JOB_INFO_1W>() as u32 {
            return Err("short job info".into());
        }
        let j = &*(b.ptr() as *const JOB_INFO_1W);
        Ok(
            json!({"backend":"windows","job_id":id,"present":true,"status_bits":j.Status,"status_text":string(j.pStatus),"spooler_pages_printed":j.PagesPrinted,"spooler_total_pages":j.TotalPages,"physical_complete":null,"automatic_reprint":false}),
        )
    }
}

fn text<'a>(s: &'a Value, key: &str) -> Result<&'a str, String> {
    s[key]
        .as_str()
        .ok_or_else(|| format!("missing settings.{key}"))
}
fn number(s: &Value, key: &str) -> Result<i64, String> {
    s[key]
        .as_i64()
        .or_else(|| {
            s[key]
                .as_f64()
                .filter(|v| v.is_finite() && v.fract() == 0.0 && *v >= 0.0 && *v <= 1_000_000_000.0)
                .map(|v| v as i64)
        })
        .ok_or_else(|| format!("missing integer {key}"))
}

fn mode_summary(dm: &DEVMODEW) -> Value {
    unsafe {
        let a = dm.Anonymous1.Anonymous1;
        json!({"fields":dm.dmFields,"orientation":a.dmOrientation,"paper_size":a.dmPaperSize,"copies":a.dmCopies,"scale":a.dmScale,"collate":dm.dmCollate,"duplex":dm.dmDuplex,"color":dm.dmColor,"media_type":dm.dmMediaType,"nup":dm.Anonymous2.dmNup})
    }
}

#[derive(Clone, Copy, Debug)]
struct Placement {
    x: i32,
    y: i32,
    w: i32,
    h: i32,
}

fn placement(
    points: (f64, f64),
    dpi: (i32, i32),
    area: (i32, i32, i32, i32),
    offset: (i32, i32),
    scaling: &str,
) -> Result<Placement, String> {
    let (left, top, right, bottom) = area;
    let native_w = points.0 * f64::from(dpi.0) / 72.0;
    let native_h = points.1 * f64::from(dpi.1) / 72.0;
    if !native_w.is_finite()
        || !native_h.is_finite()
        || native_w <= 0.0
        || native_h <= 0.0
        || right <= left
        || bottom <= top
    {
        return Err("invalid preflight geometry".into());
    }
    let factor = if scaling == "fit" {
        ((right - left) as f64 / native_w).min((bottom - top) as f64 / native_h)
    } else if scaling == "actual" {
        1.0
    } else {
        return Err("unsupported scaling".into());
    };
    let w = (native_w * factor).round() as i32;
    let h = (native_h * factor).round() as i32;
    if w <= 0 || h <= 0 || w > right - left || h > bottom - top {
        return Err(
            "actual-size page exceeds selected printable area; clipping refused before StartDoc"
                .into(),
        );
    }
    Ok(Placement {
        x: left - offset.0 + (right - left - w) / 2,
        y: top - offset.1 + (bottom - top - h) / 2,
        w,
        h,
    })
}

#[allow(clippy::too_many_arguments)]
pub fn print(
    printer: &str,
    pdf: &Path,
    dll: &Path,
    dll_sha256: &str,
    plan: &Value,
    normalized: &Value,
    output: Option<&Path>,
    on_started: &mut dyn FnMut(u32) -> Result<(), String>,
) -> Result<Value, String> {
    let files = plan["files"].as_array().ok_or("missing files")?;
    if files.len() != 1 {
        return Err("native proof supports exactly one file".into());
    }
    let s = &plan["settings"];
    if s["pages_per_sheet"] != 1 || s["booklet"] != false || !s["photo"].is_null() {
        return Err("native proof supports one-up document only; no booklet/photo".into());
    }
    if text(s, "media")? != "plain" || !s["bin_id"].is_null() {
        return Err("native media/bin selection not certified".into());
    }
    let orientation = match text(s, "orientation")? {
        "portrait" => 1,
        "landscape" => 2,
        _ => return Err("native proof requires explicit portrait/landscape".into()),
    };
    let duplex = match text(s, "duplex")? {
        "simplex" => 1,
        "long_edge" => 2,
        "short_edge" => 3,
        _ => return Err("unsupported duplex".into()),
    };
    let color = text(s, "color")?;
    if !["bw", "grayscale", "color"].contains(&color) {
        return Err("unsupported color mode".into());
    }
    let scaling = text(s, "scaling")?;
    if scaling != "fit" && scaling != "actual" {
        return Err("native proof supports fit/actual scaling".into());
    }
    let paper_id = match text(s, "paper_size")? {
        "A4" => 9,
        "A3" => 8,
        "A5" => 11,
        "Letter" => 1,
        "Legal" => 5,
        _ => return Err("unsupported paper identifier".into()),
    };
    let pdfium = Pdfium::open(
        dll,
        dll_sha256,
        pdf,
        files[0]["sha256"].as_str().ok_or("missing PDF hash")?,
    )?;
    if i64::from(pdfium.count()) != number(&files[0], "page_count")? {
        return Err("PDFium page count differs from immutable plan".into());
    }
    let sides = normalized["sides"]
        .as_array()
        .ok_or("missing normalized sides")?;
    if sides.is_empty() || sides.len() > 20000 {
        return Err("invalid side count".into());
    }
    // Validate every selected page and bound raster allocation before StartDoc.
    for side in sides {
        if side["file_index"] != 0 {
            return Err("native proof requires homogeneous single-file sides".into());
        }
        let pages = side["page_numbers"]
            .as_array()
            .ok_or("missing side page_numbers")?;
        if side["blank"] == true {
            if !pages.is_empty() {
                return Err("blank side has pages".into());
            }
        } else {
            if pages.len() != 1 {
                return Err("native proof requires one source page per side".into());
            }
            let page = pages[0].as_i64().ok_or("invalid page")?;
            if page < 1 || page > i64::from(pdfium.count()) {
                return Err("side page out of range".into());
            }
            let (w, h) = pdfium.dimensions((page - 1) as i32)?;
            if (w * 300.0 / 72.0).ceil() * (h * 300.0 / 72.0).ceil() > 32_000_000.0 {
                return Err("page exceeds raster limit".into());
            }
        }
    }
    if output.is_some_and(|p| !p.is_absolute()) {
        return Err("output must be an explicit absolute path".into());
    }
    let p = Printer::open(printer)?;
    let name = wide(printer)?;
    let mut info = info(&p)?;
    let mut mode = default_mode(&p, &name)?;
    unsafe {
        let i = &*(info.ptr() as *const PRINTER_INFO_2W);
        let dm = mode.ptr() as *mut DEVMODEW;
        if duplex != 1 && capability(&name, i.pPortName, DC_DUPLEX, ptr::null_mut(), dm) != 1 {
            return Err("driver does not advertise duplex".into());
        }
        if color == "color"
            && capability(&name, i.pPortName, DC_COLORDEVICE, ptr::null_mut(), dm) != 1
        {
            return Err("driver does not advertise color".into());
        }
        let count = capability(&name, i.pPortName, DC_PAPERS, ptr::null_mut(), dm);
        if count <= 0 || count > 2048 {
            return Err("driver paper capabilities unknown".into());
        }
        let mut ids = vec![0u16; count as usize];
        let mut sizes = vec![0i32; count as usize * 2];
        if capability(&name, i.pPortName, DC_PAPERS, ids.as_mut_ptr(), dm) != count
            || capability(
                &name,
                i.pPortName,
                DC_PAPERSIZE,
                sizes.as_mut_ptr() as *mut u16,
                dm,
            ) != count
        {
            return Err("paper capabilities changed".into());
        }
        let index = ids
            .iter()
            .position(|id| *id == paper_id as u16)
            .ok_or("selected paper not supported")?;
        if i64::from(sizes[index * 2]) * 100 != number(s, "width_um")?
            || i64::from(sizes[index * 2 + 1]) * 100 != number(s, "height_um")?
        {
            return Err("driver paper dimensions differ from plan".into());
        }
        let fields = DM_ORIENTATION
            | DM_PAPERSIZE
            | DM_COPIES
            | DM_COLLATE
            | DM_DUPLEX
            | DM_COLOR
            | DM_SCALE
            | DM_NUP
            | DM_MEDIATYPE;
        (*dm).dmFields |= fields;
        (*dm).dmFields &= !(DM_PAPERLENGTH | DM_PAPERWIDTH | DM_FORMNAME);
        (*dm).Anonymous1.Anonymous1.dmOrientation = orientation;
        (*dm).Anonymous1.Anonymous1.dmPaperSize = paper_id;
        (*dm).Anonymous1.Anonymous1.dmCopies = 1;
        (*dm).Anonymous1.Anonymous1.dmScale = 100;
        (*dm).dmCollate = 0;
        (*dm).dmDuplex = duplex;
        (*dm).dmColor = if color == "color" { 2 } else { 1 };
        (*dm).dmMediaType = DMMEDIA_STANDARD;
        (*dm).Anonymous2.dmNup = DMNUP_ONEUP;
        let mut effective = Buffer::new(mode.len)?;
        if DocumentPropertiesW(
            ptr::null_mut(),
            p.0,
            name.as_ptr(),
            effective.ptr() as *mut DEVMODEW,
            dm,
            DM_IN_BUFFER | DM_OUT_BUFFER,
        ) != 1
        {
            return Err(error("DocumentPropertiesW validation"));
        }
        let e = &*(effective.ptr() as *const DEVMODEW);
        if e.dmSize < size_of::<DEVMODEW>() as u16
            || u32::from(e.dmSize) + u32::from(e.dmDriverExtra) > effective.len
        {
            return Err("invalid validated DEVMODE extent".into());
        }
        let a = e.Anonymous1.Anonymous1;
        // This exact virtual driver is a raster output sink. It advertises fixed
        // color/collation values and drops unsupported hardware fields. Pixel
        // conversion and copy ordering are owned by this adapter, not its driver.
        // Never extend this profile to physical drivers without certification.
        let virtual_pdf = string(i.pDriverName) == "Microsoft Print To PDF" && output.is_some();
        let core_fields = DM_ORIENTATION | DM_PAPERSIZE | DM_COPIES;
        let core_ok = e.dmFields & core_fields == core_fields
            && a.dmOrientation == orientation
            && a.dmPaperSize == paper_id
            && a.dmCopies == 1;
        let exact_ok = e.dmFields & fields == fields
            && a.dmScale == 100
            && e.dmCollate == 0
            && e.dmDuplex == duplex
            && e.dmColor == (*dm).dmColor
            && e.dmMediaType == DMMEDIA_STANDARD
            && e.Anonymous2.dmNup == DMNUP_ONEUP;
        if !core_ok || (!virtual_pdf && !exact_ok) || (virtual_pdf && duplex != 1) {
            return Err(format!(
                "driver coerced requested DEVMODE; refusing submission; requested={} effective={}",
                mode_summary(&*dm),
                mode_summary(e)
            ));
        }
        let driver = wide("WINSPOOL")?;
        let dc = Dc(CreateDCW(
            driver.as_ptr(),
            name.as_ptr(),
            ptr::null(),
            effective.ptr() as *const DEVMODEW,
        ));
        if dc.0.is_null() {
            return Err(error("CreateDCW"));
        }
        let dpi_x = GetDeviceCaps(dc.0, LOGPIXELSX as i32);
        let dpi_y = GetDeviceCaps(dc.0, LOGPIXELSY as i32);
        let printable_w = GetDeviceCaps(dc.0, HORZRES as i32);
        let printable_h = GetDeviceCaps(dc.0, VERTRES as i32);
        let physical_w = GetDeviceCaps(dc.0, PHYSICALWIDTH as i32);
        let physical_h = GetDeviceCaps(dc.0, PHYSICALHEIGHT as i32);
        let offset_x = GetDeviceCaps(dc.0, PHYSICALOFFSETX as i32);
        let offset_y = GetDeviceCaps(dc.0, PHYSICALOFFSETY as i32);
        if dpi_x <= 0
            || dpi_y <= 0
            || printable_w <= 0
            || printable_h <= 0
            || physical_w <= 0
            || physical_h <= 0
        {
            return Err("invalid printer DC dimensions".into());
        }
        let (expected_width, expected_height) = if orientation == 2 {
            (number(s, "height_um")?, number(s, "width_um")?)
        } else {
            (number(s, "width_um")?, number(s, "height_um")?)
        };
        let actual_width = i64::from(physical_w) * 25400 / i64::from(dpi_x);
        let actual_height = i64::from(physical_h) * 25400 / i64::from(dpi_y);
        if (actual_width - expected_width).abs() > 1000
            || (actual_height - expected_height).abs() > 1000
        {
            return Err("printer DC media/orientation differs from requested dimensions".into());
        }
        let margin = &s["margins_um"];
        let px = |key: &str, dpi: i32| -> Result<i32, String> {
            let um = number(margin, key)?;
            if !(0..=100000).contains(&um) {
                return Err("invalid margin".into());
            }
            Ok((um * dpi as i64 / 25400) as i32)
        };
        let left = px("left", dpi_x)?.max(offset_x);
        let top = px("top", dpi_y)?.max(offset_y);
        let right = (physical_w - px("right", dpi_x)?).min(offset_x + printable_w);
        let bottom = (physical_h - px("bottom", dpi_y)?).min(offset_y + printable_h);
        if right <= left || bottom <= top {
            return Err("margins leave no printable area".into());
        }
        let mut placements = Vec::with_capacity(sides.len());
        for side in sides {
            if side["blank"] == true {
                placements.push(None);
            } else {
                let page = side["page_numbers"][0]
                    .as_i64()
                    .ok_or("invalid normalized page")? as i32
                    - 1;
                placements.push(Some(placement(
                    pdfium.dimensions(page)?,
                    (dpi_x, dpi_y),
                    (left, top, right, bottom),
                    (offset_x, offset_y),
                    scaling,
                )?));
            }
        }
        let title = wide("Print Bot supervised Phase 0 proof")?;
        let output_w = output
            .map(|v| {
                v.to_str()
                    .ok_or_else(|| "output path not UTF-8".to_owned())
                    .and_then(wide)
            })
            .transpose()?;
        let document = DOCINFOW {
            cbSize: size_of::<DOCINFOW>() as i32,
            lpszDocName: title.as_ptr(),
            lpszOutput: output_w.as_ref().map_or(ptr::null(), |v| v.as_ptr()),
            lpszDatatype: ptr::null(),
            fwType: 0,
        };
        let id = StartDocW(dc.0, &document);
        if id <= 0 {
            return Err(format!(
                "COMPLETION_UNKNOWN: StartDocW returned no job id; {}; no automatic retry",
                error("StartDocW")
            ));
        }
        let mut submission = Submission {
            dc: &dc,
            ended: false,
        };
        let work = (|| -> Result<Value, String> {
            on_started(id as u32)?;
            let mut rasters = Vec::new();
            let mut raster_manifest = Sha256::new();
            let mut raster_count = 0usize;
            for (side_index, side) in sides.iter().enumerate() {
                let side_bytes = serde_json::to_vec(side).map_err(|e| e.to_string())?;
                raster_manifest.update((side_bytes.len() as u64).to_be_bytes());
                raster_manifest.update(&side_bytes);
                if StartPage(dc.0) <= 0 {
                    return Err(error("StartPage"));
                }
                if side["blank"] != true {
                    let page = side["page_numbers"][0]
                        .as_i64()
                        .ok_or("invalid normalized page")? as i32
                        - 1;
                    let r = pdfium.raster(page, 300, color)?;
                    let Placement { x, y, w, h } =
                        placements[side_index].ok_or("missing preflight placement")?;
                    let mut bitmap: BITMAPINFO = zeroed();
                    bitmap.bmiHeader.biSize = size_of::<BITMAPINFOHEADER>() as u32;
                    bitmap.bmiHeader.biWidth = r.width;
                    bitmap.bmiHeader.biHeight = -r.height;
                    bitmap.bmiHeader.biPlanes = 1;
                    bitmap.bmiHeader.biBitCount = 32;
                    bitmap.bmiHeader.biCompression = BI_RGB;
                    if SetStretchBltMode(dc.0, COLORONCOLOR) == 0 {
                        return Err(error("SetStretchBltMode"));
                    }
                    let lines = StretchDIBits(
                        dc.0,
                        x,
                        y,
                        w,
                        h,
                        0,
                        0,
                        r.width,
                        r.height,
                        r.pixels.as_ptr() as *const _,
                        &bitmap,
                        DIB_RGB_COLORS,
                        SRCCOPY,
                    );
                    if lines == 0 || lines == GDI_ERROR {
                        return Err(error("StretchDIBits"));
                    }
                    let pixel_hash = Sha256::digest(&r.pixels);
                    raster_manifest.update(r.width.to_be_bytes());
                    raster_manifest.update(r.height.to_be_bytes());
                    raster_manifest.update(pixel_hash);
                    raster_count += 1;
                    if rasters.len() < 8 {
                        rasters.push(json!({"page":page+1,"copy_index":side["copy_index"],"width":r.width,"height":r.height,"sha256":format!("{pixel_hash:x}")}));
                    }
                } else {
                    raster_manifest.update(0i32.to_be_bytes());
                    raster_manifest.update(0i32.to_be_bytes());
                    raster_manifest.update([0u8; 32]);
                }
                if EndPage(dc.0) <= 0 {
                    return Err(error("EndPage"));
                }
            }
            if EndDoc(dc.0) <= 0 {
                return Err(error("EndDoc"));
            }
            submission.ended = true;
            Ok(
                json!({"backend":"windows","virtual_output_profile":virtual_pdf,"job_id":id,"submitted_to_spooler":true,"physical_complete":null,"automatic_reprint":false,"rendered_sides":sides.len(),"driver_copies":1,"copy_owner":"software","raster_manifest_sha256":format!("{:x}",raster_manifest.finalize()),"raster_manifest_format":"ordered-sides-v1: u64be JSON length, canonical side JSON, i32be width/height, raw SHA256; blanks use zero dimensions/digest","raster_count":raster_count,"raster_sha256_sample":rasters,"state":"SUBMITTED_TO_SPOOLER"}),
            )
        })();
        work.map_err(|e| {
            format!("COMPLETION_UNKNOWN job_id={id}: {e}; AbortDoc best effort; no automatic retry")
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn preflight_rejects_later_oversize_page_before_submission() {
        let pages = [(100.0, 100.0), (10000.0, 10000.0)];
        let placements: Result<Vec<_>, _> = pages
            .into_iter()
            .map(|p| placement(p, (300, 300), (0, 0, 2000, 3000), (0, 0), "actual"))
            .collect();
        assert!(placements.is_err());
        assert!(placement(
            (595.0, 842.0),
            (300, 300),
            (0, 0, 2000, 3000),
            (0, 0),
            "fit"
        )
        .is_ok());
        assert_eq!(number(&json!({"v":3.0}), "v").unwrap(), 3);
    }
    #[test]
    fn nul_name_is_rejected_before_windows_calls() {
        assert!(wide("printer\0other").is_err());
    }

    #[test]
    fn buffers_are_bounded_and_natively_aligned() {
        assert!(Buffer::new(0).is_err());
        assert!(Buffer::new(16 * 1024 * 1024 + 1).is_err());
        let mut b = Buffer::new(257).unwrap();
        assert_eq!((b.ptr() as usize) % std::mem::align_of::<DEVMODEW>(), 0);
        assert!(b.words.len() * size_of::<usize>() >= b.len as usize);
    }

    #[test]
    fn unsupported_imposition_never_reaches_spooler() {
        for settings in [
            json!({"pages_per_sheet":2,"booklet":false,"photo":null}),
            json!({"pages_per_sheet":1,"booklet":true,"photo":null}),
            json!({"pages_per_sheet":1,"booklet":false,"photo":{}}),
        ] {
            let plan = json!({"files":[{}], "settings":settings});
            let mut started = false;
            let result = print(
                "",
                Path::new("missing.pdf"),
                Path::new("missing.dll"),
                "",
                &plan,
                &json!({}),
                None,
                &mut |_| {
                    started = true;
                    Ok(())
                },
            );
            assert!(result.unwrap_err().contains("one-up"));
            assert!(!started);
        }
    }
}
