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
    let root = spool_root
        .canonicalize()
        .map_err(|_| "spool root is unavailable".to_string())?;
    let document = document_path
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
        EnumPrintersW, PRINTER_ENUM_CONNECTIONS, PRINTER_ENUM_LOCAL, PRINTER_INFO_2W,
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
            printers.push(PrinterInfo {
                name,
                shop_id: bound_shop_id.to_owned(),
                is_default: false,
                is_online: info.Status == 0,
                supports_color: true,
                supports_duplex: true,
                supported_paper_sizes: vec!["A4".into(), "A3".into(), "Letter".into()],
                queue_count: info.cJobs,
                status: if info.Status == 0 {
                    "Ready".into()
                } else {
                    format!("Windows status {}", info.Status)
                },
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
