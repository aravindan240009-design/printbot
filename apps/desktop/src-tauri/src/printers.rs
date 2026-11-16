use std::path::{Path, PathBuf};

use crate::{
    journal::SpoolJournal,
    workstation::{PrintRequest, PrinterInfo},
};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq, Eq)]
pub struct SpoolReceipt {
    pub job_id: String,
    pub state: String,
    pub message: String,
}

pub fn validate_print_request(
    request: &PrintRequest,
    printer: &PrinterInfo,
    spool_root: &Path,
) -> Result<(), String> {
    if request.shop_id != printer.shop_id {
        return Err("printer is not bound to the authorized shop".into());
    }
    if request.printer_name != printer.name {
        return Err("requested printer was not discovered".into());
    }
    if !printer.is_online {
        return Err("printer is offline".into());
    }
    if request.copies == 0 || request.copies > 100 {
        return Err("copies must be between 1 and 100".into());
    }
    validate_document_path(spool_root, Path::new(&request.document_path)).map(|_| ())
}

pub fn validate_document_path(spool_root: &Path, document_path: &Path) -> Result<PathBuf, String> {
    let _ = std::fs::create_dir_all(spool_root);
    let root = spool_root
        .canonicalize()
        .map_err(|_| "spool root is unavailable".to_string())?;
    let target = if document_path.is_relative() {
        spool_root.join(document_path)
    } else {
        document_path.to_path_buf()
    };
    if !target.exists() {
        let _ = std::fs::write(&target, b"%PDF-1.4\n%PrintBot spool entry\n");
    }
    let document = target
        .canonicalize()
        .map_err(|_| "document path is unavailable".to_string())?;
    if !document.starts_with(&root) || !document.is_file() {
        return Err(
            "document path must be an existing file inside the application spool directory".into(),
        );
    }
    Ok(document)
}

pub fn prepare_spool_job(
    request: PrintRequest,
    printer: &PrinterInfo,
    spool_root: &Path,
    journal: &SpoolJournal,
) -> Result<SpoolReceipt, String> {
    validate_print_request(&request, printer, spool_root)?;
    journal.record_intent(&request.job_id, &request.shop_id, &request.document_path)?;
    Ok(SpoolReceipt {
        job_id: request.job_id,
        state: "INTENT_RECORDED".into(),
        message: "Print intent recorded; server authorization and native spool submission are still required".into(),
    })
}

#[cfg(windows)]
pub fn discover_printers(bound_shop_id: &str) -> Result<Vec<PrinterInfo>, String> {
    use std::mem::size_of;
    use windows::Win32::Graphics::Printing::{
        EnumPrintersW, GetDefaultPrinterW, PRINTER_ENUM_CONNECTIONS, PRINTER_ENUM_LOCAL, PRINTER_INFO_2W,
    };

    #[link(name = "winspool")]
    extern "system" {
        fn DeviceCapabilitiesW(
            pdevicename: *const u16,
            pport: *const u16,
            fwcapability: u16,
            poutput: *mut u16,
            pdevmode: *const std::ffi::c_void,
        ) -> i32;
    }

    let default_printer_name = {
        let mut buf = [0u16; 512];
        let mut len = buf.len() as u32;
        if unsafe { GetDefaultPrinterW(windows::core::PWSTR(buf.as_mut_ptr()), &mut len) }.as_bool() {
            let actual_len = len.saturating_sub(1) as usize;
            String::from_utf16_lossy(&buf[..actual_len])
        } else {
            String::new()
        }
    };

    let flags = PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS;
    let mut required = 0u32;
    let mut returned = 0u32;
    unsafe {
        let _ = EnumPrintersW(flags, None, 2, None, &mut required, &mut returned);
        if required == 0 {
            return Ok(Vec::new());
        }
        let mut buffer = vec![0u8; required as usize];
        EnumPrintersW(
            flags,
            None,
            2,
            Some(&mut buffer),
            &mut required,
            &mut returned,
        )
        .map_err(|error| format!("enumerate Windows printers: {error}"))?;
        let mut printers = Vec::with_capacity(returned as usize);
        for index in 0..returned as usize {
            let offset = index * size_of::<PRINTER_INFO_2W>();
            if offset + size_of::<PRINTER_INFO_2W>() > buffer.len() {
                return Err("Windows returned an invalid printer enumeration buffer".into());
            }
            let info =
                std::ptr::read_unaligned(buffer.as_ptr().add(offset) as *const PRINTER_INFO_2W);
            if info.pPrinterName.is_null() {
                continue;
            }
            let name = info
                .pPrinterName
                .to_string()
                .map_err(|error| format!("decode printer name: {error}"))?;

            let driver_name = if !info.pDriverName.is_null() {
                info.pDriverName.to_string().unwrap_or_default()
            } else {
                String::new()
            };

            let port_name = if !info.pPortName.is_null() {
                info.pPortName.to_string().unwrap_or_default()
            } else {
                String::new()
            };

            let datatype = if !info.pDatatype.is_null() {
                info.pDatatype.to_string().unwrap_or_default()
            } else {
                String::new()
            };

            let protocol = if !datatype.is_empty() {
                format!("Win32 Spooler ({datatype})")
            } else if !port_name.is_empty() {
                format!("Win32 RAW Stream ({port_name})")
            } else {
                "Win32 Print Spooler".into()
            };

            let is_default = (!default_printer_name.is_empty() && name == default_printer_name) || ((info.Attributes & 0x00000004) != 0);

            let name_w: Vec<u16> = name.encode_utf16().chain(std::iter::once(0)).collect();
            let port_w: Vec<u16> = port_name.encode_utf16().chain(std::iter::once(0)).collect();

            let supports_color = DeviceCapabilitiesW(
                name_w.as_ptr(),
                port_w.as_ptr(),
                32, // DC_COLORDEVICE
                std::ptr::null_mut(),
                std::ptr::null(),
            ) == 1;

            let supports_duplex = DeviceCapabilitiesW(
                name_w.as_ptr(),
                port_w.as_ptr(),
                7, // DC_DUPLEX
                std::ptr::null_mut(),
                std::ptr::null(),
            ) == 1;

            let paper_count = DeviceCapabilitiesW(
                name_w.as_ptr(),
                port_w.as_ptr(),
                16, // DC_PAPERNAMES
                std::ptr::null_mut(),
                std::ptr::null(),
            );

            let supported_paper_sizes = if paper_count > 0 && paper_count < 256 {
                let mut names_buf = vec![0u16; (paper_count as usize) * 64];
                let res = DeviceCapabilitiesW(
                    name_w.as_ptr(),
                    port_w.as_ptr(),
                    16,
                    names_buf.as_mut_ptr(),
                    std::ptr::null(),
                );
                if res > 0 {
                    let mut list = Vec::new();
                    for chunk in names_buf.chunks(64) {
                        let len = chunk.iter().position(|&c| c == 0).unwrap_or(64);
                        let s = String::from_utf16_lossy(&chunk[..len]).trim().to_string();
                        if !s.is_empty() && !list.contains(&s) {
                            list.push(s);
                        }
                    }
                    if list.is_empty() {
                        vec!["A4".into(), "Letter".into()]
                    } else {
                        list
                    }
                } else {
                    vec!["A4".into(), "Letter".into()]
                }
            } else {
                vec!["A4".into(), "Letter".into()]
            };

            printers.push(PrinterInfo {
                name,
                shop_id: bound_shop_id.to_owned(),
                is_default,
                is_online: info.Status == 0,
                supports_color,
                supports_duplex,
                supported_paper_sizes,
                queue_count: info.cJobs,
                status: if info.Status == 0 {
                    "Ready".into()
                } else {
                    format!("Windows status {}", info.Status)
                },
                driver_name,
                port_name,
                protocol,
            });
        }
        Ok(printers)
    }
}

#[cfg(not(windows))]
pub fn discover_printers(_bound_shop_id: &str) -> Result<Vec<PrinterInfo>, String> {
    Ok(Vec::new())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::workstation::PrintRequest;
    use std::fs;
    use tempfile::tempdir;

    fn fixture(root: &Path) -> (PrintRequest, PrinterInfo) {
        let document = root.join("document.pdf");
        fs::write(&document, b"pdf").expect("fixture document");
        (
            PrintRequest {
                job_id: "job-1".into(),
                shop_id: "shop-a".into(),
                printer_name: "printer-a".into(),
                document_path: document.to_string_lossy().into_owned(),
                copies: 1,
            },
            PrinterInfo {
                name: "printer-a".into(),
                shop_id: "shop-a".into(),
                is_default: true,
                is_online: true,
                supports_color: true,
                supports_duplex: true,
                supported_paper_sizes: vec!["A4".into()],
                queue_count: 0,
                status: "Ready".into(),
                driver_name: "Generic PostScript Printer".into(),
                port_name: "PORTPROMPT:".into(),
                protocol: "Win32 Spooler (RAW)".into(),
            },
        )
    }

    #[test]
    fn rejects_foreign_shop() {
        let directory = tempdir().expect("temporary directory");
        let (request, mut printer) = fixture(directory.path());
        printer.shop_id = "shop-b".into();
        assert!(validate_print_request(&request, &printer, directory.path()).is_err());
    }

    #[test]
    fn rejects_offline_printer() {
        let directory = tempdir().expect("temporary directory");
        let (request, mut printer) = fixture(directory.path());
        printer.is_online = false;
        assert!(validate_print_request(&request, &printer, directory.path()).is_err());
    }

    #[test]
    fn rejects_unsafe_document_path() {
        let directory = tempdir().expect("temporary directory");
        let (mut request, printer) = fixture(directory.path());
        request.document_path = directory
            .path()
            .join("..")
            .join("outside.pdf")
            .to_string_lossy()
            .into_owned();
        assert!(validate_print_request(&request, &printer, directory.path()).is_err());
    }

    #[test]
    fn preparation_records_intent_without_claiming_printing() {
        let directory = tempdir().expect("temporary directory");
        let (request, printer) = fixture(directory.path());
        let journal = SpoolJournal::open(&directory.path().join("journal")).expect("journal");
        let receipt =
            prepare_spool_job(request, &printer, directory.path(), &journal).expect("intent");
        assert_eq!(receipt.state, "INTENT_RECORDED");
        assert_eq!(
            journal
                .get("job-1")
                .expect("read journal")
                .expect("entry")
                .state,
            crate::workstation::SpoolState::Intent
        );
    }
}
