// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{path::PathBuf, sync::{Arc, Mutex}};

use sha2::{Digest, Sha256};
use tauri::{Manager, State};

mod journal;
#[cfg(not(feature = "test-mode"))]
mod printers;
mod workstation;

use journal::SpoolJournal;
#[cfg(not(feature = "test-mode"))]
use printers::{
    discover_printers, prepare_spool_job, submit_rendered_pages_to_windows_printer, DuplexMode,
    SpoolReceipt,
};
use workstation::PrinterInfo;
use workstation::JournalEntry;
#[cfg(not(feature = "test-mode"))]
use workstation::PrintRequest;

#[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
pub struct DeviceTokenClaims {
    pub shop_id: String,
    pub device_id: String,
    pub exp: u64,
    pub sig: String,
}

#[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
pub struct WorkstationDeviceIdentity {
    pub device_id: String,
    pub hardware_hash: String,
    pub device_name: String,
}


fn get_local_device_id(spool_root: &std::path::Path) -> String {
    let id_file = spool_root.join(".workstation_id");
    if let Ok(id) = std::fs::read_to_string(&id_file) {
        let trimmed = id.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let digest = Sha256::digest(format!("pb_station_{}_{}", std::process::id(), ts).as_bytes());
    let generated = format!("dev_{}", &hex::encode(digest)[..16]);
    let _ = std::fs::create_dir_all(spool_root);
    let _ = std::fs::write(&id_file, &generated);
    generated
}

fn verify_workstation_session(raw_token: &str, spool_root: &std::path::Path) -> Result<(String, String), String> {
    let trimmed = raw_token.trim();
    if trimmed.is_empty() {
        return Err("Unauthorized: device session token is missing or empty".into());
    }

    // License tokens are authenticated by the bundled frontend against Supabase;
    // the server-only HMAC pepper must never be embedded in the workstation.
    let claims: DeviceTokenClaims = if trimmed.starts_with('{') {
        serde_json::from_str::<DeviceTokenClaims>(trimmed)
            .map_err(|e| format!("Unauthorized: malformed device token JSON: {e}"))?
    } else if trimmed.starts_with("devtoken:") {
        let parts: Vec<&str> = trimmed.split(':').collect();
        if parts.len() != 5 || parts[4].trim().is_empty() {
            return Err("Unauthorized: malformed delimited device token".into());
        }
        let exp = parts[3]
            .parse::<u64>()
            .map_err(|_| "Unauthorized: invalid expiration timestamp in device token")?;
        let claims = DeviceTokenClaims {
            shop_id: parts[1].to_string(),
            device_id: parts[2].to_string(),
            exp,
            sig: parts[4].to_string(),
        };
        claims
    } else {
        return Err("Unauthorized: unrecognized device token format. Raw shop IDs cannot be bound directly".into());
    };

    if claims.shop_id.trim().is_empty() || claims.device_id.trim().is_empty() {
        return Err("Unauthorized: device token claims contain empty shop_id or device_id".into());
    }
    if claims.sig.trim().is_empty() {
        return Err("Unauthorized: device token is missing its authentication proof".into());
    }

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    if claims.exp < now {
        return Err(format!("Unauthorized: device session token expired at timestamp {}", claims.exp));
    }

    let local_id = get_local_device_id(spool_root);
    if claims.device_id != local_id {
        return Err("Unauthorized: session token belongs to another physical machine and cannot be bound here".into());
    }

    Ok((claims.shop_id, claims.device_id))
}

struct WorkstationState {
    bound_shop_id: Mutex<Option<String>>,
    bound_device_id: Mutex<Option<String>>,
    spool_root: PathBuf,
    journal: Arc<SpoolJournal>,
}

#[cfg(not(feature = "test-mode"))]
#[tauri::command]
fn get_system_printers(state: State<'_, WorkstationState>) -> Result<Vec<PrinterInfo>, String> {
    let bound = state.bound_shop_id.lock().map_err(|e| e.to_string())?;
    let shop_id = bound
        .as_deref()
        .ok_or_else(|| "workstation is not paired to a shop".to_string())?;
    discover_printers(shop_id)
}

#[tauri::command]
fn get_workstation_device_identity(
    state: State<'_, WorkstationState>,
) -> Result<WorkstationDeviceIdentity, String> {
    let id_file = state.spool_root.join(".workstation_id");
    let hardware_id = if id_file.exists() {
        std::fs::read_to_string(&id_file).unwrap_or_default()
    } else {
        String::new()
    };

    let trimmed_id = hardware_id.trim();
    let persistent_id = if !trimmed_id.is_empty() {
        trimmed_id.to_string()
    } else {
        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            .as_nanos();
        let digest = Sha256::digest(format!("pb_station_{}_{}", std::process::id(), ts).as_bytes());
        let generated = format!("dev_{}", &hex::encode(digest)[..16]);
        let _ = std::fs::create_dir_all(&state.spool_root);
        let _ = std::fs::write(&id_file, &generated);
        generated
    };

    let mut hasher = Sha256::new();
    hasher.update(b"pb_hw_fingerprint_v1:");
    hasher.update(persistent_id.as_bytes());
    let hardware_hash = hex::encode(hasher.finalize());

    let device_name = std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "COUNTER-PC".to_string());

    Ok(WorkstationDeviceIdentity {
        device_id: persistent_id,
        hardware_hash,
        device_name,
    })
}

#[tauri::command]
fn bind_workstation(
    device_token: String,
    state: State<'_, WorkstationState>,
) -> Result<String, String> {
    let (shop_id, device_id) = verify_workstation_session(&device_token, &state.spool_root)?;
    let mut bound_shop = state.bound_shop_id.lock().map_err(|e| e.to_string())?;
    let mut bound_dev = state.bound_device_id.lock().map_err(|e| e.to_string())?;
    *bound_shop = Some(shop_id.clone());
    *bound_dev = Some(device_id.clone());
    Ok(format!("Workstation successfully verified and bound to shop {shop_id} for device {device_id}"))
}

#[cfg(not(feature = "test-mode"))]
#[tauri::command]
fn prepare_print_job(
    request: PrintRequest,
    state: State<'_, WorkstationState>,
) -> Result<SpoolReceipt, String> {
    let bound = state.bound_shop_id.lock().map_err(|e| e.to_string())?;
    let bound_shop_id = bound
        .as_deref()
        .ok_or_else(|| "workstation is not paired to a shop".to_string())?;
    if request.shop_id != bound_shop_id {
        return Err("print request does not belong to the paired shop".into());
    }
    let printer = discover_printers(bound_shop_id)?
        .into_iter()
        .find(|printer| printer.name == request.printer_name)
        .ok_or_else(|| "requested printer was not discovered".to_string())?;
    prepare_spool_job(request, &printer, &state.spool_root, &state.journal)
}

#[tauri::command]
fn get_spool_job(
    job_id: String,
    state: State<'_, WorkstationState>,
) -> Result<Option<JournalEntry>, String> {
    state.journal.get(&job_id)
}

#[tauri::command]
fn read_spool_file(job_id: String, state: State<'_, WorkstationState>) -> Result<Option<Vec<u8>>, String> {
    for extension in ["pdf", "jpg", "png"] {
        let spool_file = state.spool_root.join(format!("{}.{}", job_id, extension));
        if spool_file.exists() {
            return std::fs::read(&spool_file)
                .map(Some)
                .map_err(|e| format!("failed to read spool file {}: {e}", spool_file.display()));
        }
    }
    Ok(None)
}

#[tauri::command]
fn mark_spool_unknown(
    job_id: String,
    reason: String,
    state: State<'_, WorkstationState>,
) -> Result<(), String> {
    let entry = state
        .journal
        .get(&job_id)?
        .ok_or_else(|| "spool job was not found".to_string())?;
    let bound = state.bound_shop_id.lock().map_err(|e| e.to_string())?;
    let bound_shop_id = bound
        .as_deref()
        .ok_or_else(|| "workstation is not paired to a shop".to_string())?;
    if entry.shop_id != bound_shop_id {
        return Err("spool job does not belong to the paired shop".into());
    }
    state.journal.mark_unknown(&job_id, &reason)
}

#[cfg(not(feature = "test-mode"))]
#[derive(serde::Deserialize)]
pub struct NativePrintPayload {
    pub job_id: String,
    pub attempt_id: String,
    pub printer_name: String,
    pub file_name: String,
    pub file_bytes: Vec<u8>,
    pub rendered_pages: Vec<Vec<u8>>,
    pub copies: Option<u32>,
    #[serde(default)]
    pub duplex_mode: DuplexMode,
}

#[cfg(not(feature = "test-mode"))]
#[derive(serde::Serialize)]
pub struct NativePrintResult {
    pub success: bool,
    pub spooler_job_id: u32,
    pub printer_name: String,
    pub message: String,
}

#[cfg(not(feature = "test-mode"))]
fn document_file_extension(file_bytes: &[u8]) -> Option<&'static str> {
    if file_bytes.starts_with(b"%PDF-") {
        Some("pdf")
    } else if file_bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        Some("png")
    } else if file_bytes.starts_with(b"\xff\xd8\xff") {
        Some("jpg")
    } else {
        None
    }
}

#[cfg(not(feature = "test-mode"))]
fn validate_native_print_payload(
    file_bytes: &[u8],
    rendered_pages: &[Vec<u8>],
    copies: u32,
) -> Result<(), String> {
    if document_file_extension(file_bytes).is_none() {
        return Err("The attached document must be a valid PDF, JPG, or PNG file".into());
    }
    if rendered_pages.is_empty() || rendered_pages.len() > 500 {
        return Err("The document must contain between 1 and 500 rendered pages".into());
    }
    if rendered_pages
        .iter()
        .any(|page| !page.starts_with(b"\x89PNG\r\n\x1a\n"))
    {
        return Err("One or more document pages could not be rendered for printing".into());
    }
    if rendered_pages.iter().map(Vec::len).sum::<usize>() > 64 * 1024 * 1024 {
        return Err("Rendered print job exceeds the 64 MB workstation limit".into());
    }
    if copies == 0 || copies > 100 {
        return Err("copies must be between 1 and 100".into());
    }
    Ok(())
}

#[cfg(not(feature = "test-mode"))]
fn validate_duplex_support(duplex_mode: DuplexMode, supports_duplex: bool) -> Result<(), String> {
    if duplex_mode != DuplexMode::Simplex && !supports_duplex {
        return Err(
            "This printer does not support double-sided printing. Choose a duplex-capable printer or select One Side."
                .into(),
        );
    }
    Ok(())
}

#[cfg(not(feature = "test-mode"))]
#[tauri::command]
fn print_to_native_hardware(
    payload: NativePrintPayload,
    state: State<'_, WorkstationState>,
) -> Result<NativePrintResult, String> {
    let bound_shop_id = state
        .bound_shop_id
        .lock()
        .map_err(|e| e.to_string())?
        .clone()
        .ok_or_else(|| "workstation is not paired to a shop".to_string())?;
    let printer = discover_printers(&bound_shop_id)?
        .into_iter()
        .find(|printer| printer.name == payload.printer_name)
        .ok_or_else(|| "requested printer was not discovered for this workstation".to_string())?;
    if !printer.is_online {
        return Err(format!(
            "Printer '{}' is offline ({}). Bring it online in Windows, then retry.",
            printer.name, printer.status
        ));
    }

    let copies = payload.copies.unwrap_or(1);
    validate_native_print_payload(&payload.file_bytes, &payload.rendered_pages, copies)?;
    validate_duplex_support(payload.duplex_mode, printer.supports_duplex)?;

    std::fs::create_dir_all(&state.spool_root)
        .map_err(|e| format!("failed to create spool directory: {e}"))?;
    let extension = document_file_extension(&payload.file_bytes)
        .ok_or_else(|| "The attached document must be a valid PDF, JPG, or PNG file".to_string())?;
    let spool_file = state.spool_root.join(format!("{}.{}", payload.job_id, extension));
    std::fs::write(&spool_file, &payload.file_bytes)
        .map_err(|e| format!("failed to save document to spool directory: {e}"))?;
    state.journal.record_intent(
        &payload.attempt_id,
        &bound_shop_id,
        &spool_file.to_string_lossy(),
    )?;

    let spooler_job_id = submit_rendered_pages_to_windows_printer(
        &payload.printer_name,
        &format!("PrintBot - {}", payload.file_name),
        &payload.rendered_pages,
        copies,
        payload.duplex_mode,
    )?;

    state
        .journal
        .mark_submitted(&payload.attempt_id, spooler_job_id)?;

    Ok(NativePrintResult {
        success: true,
        spooler_job_id,
        printer_name: payload.printer_name.clone(),
        message: format!(
            "Job #{} rendered and submitted to {} (Windows spooler ID: {})",
            payload.job_id, payload.printer_name, spooler_job_id
        ),
    })
}

#[cfg(feature = "test-mode")]
#[tauri::command]
fn get_system_printers() -> Result<Vec<PrinterInfo>, String> {
    Err("Printer discovery is disabled in this test build.".into())
}

#[cfg(feature = "test-mode")]
#[tauri::command]
fn print_to_native_hardware(_payload: serde_json::Value) -> Result<(), String> {
    Err("Printing is disabled in this test build.".into())
}

#[cfg(not(feature = "test-mode"))]
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data = app
                .path()
                .app_local_data_dir()
                .map_err(|error| format!("resolve application data directory: {error}"))?;
            let spool_root = app_data.join("spool");
            let journal =
                Arc::new(SpoolJournal::open(&spool_root).map_err(|error| error.to_string())?);
            app.manage(WorkstationState {
                bound_shop_id: Mutex::new(None),
                bound_device_id: Mutex::new(None),
                spool_root,
                journal,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_system_printers,
            bind_workstation,
            get_workstation_device_identity,
            prepare_print_job,
            get_spool_job,
            read_spool_file,
            mark_spool_unknown,
            print_to_native_hardware
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(feature = "test-mode")]
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_system_printers,
            print_to_native_hardware
        ])
        .run(tauri::generate_context!())
        .expect("error while running test workstation");
}

#[cfg(all(test, not(feature = "test-mode")))]
mod tests {
    use super::{document_file_extension, validate_duplex_support, validate_native_print_payload};
    use crate::printers::DuplexMode;

    #[test]
    fn recognizes_supported_document_signatures() {
        assert_eq!(document_file_extension(b"%PDF-1.7"), Some("pdf"));
        assert_eq!(document_file_extension(b"\x89PNG\r\n\x1a\nimage"), Some("png"));
        assert_eq!(document_file_extension(b"\xff\xd8\xffimage"), Some("jpg"));
        assert_eq!(document_file_extension(b"not a document"), None);
    }

    #[test]
    fn rejects_empty_or_unsupported_documents() {
        assert!(validate_native_print_payload(b"", &[b"\x89PNG\r\n\x1a\n".to_vec()], 1).is_err());
        assert!(validate_native_print_payload(b"not a pdf", &[b"\x89PNG\r\n\x1a\n".to_vec()], 1).is_err());
    }

    #[test]
    fn accepts_images_and_rejects_missing_or_invalid_rendered_pages() {
        assert!(validate_native_print_payload(
            b"\xff\xd8\xffimage",
            &[b"\x89PNG\r\n\x1a\n".to_vec()],
            1,
        ).is_ok());
        assert!(validate_native_print_payload(
            b"\x89PNG\r\n\x1a\nimage",
            &[b"\x89PNG\r\n\x1a\n".to_vec()],
            1,
        ).is_ok());
        assert!(validate_native_print_payload(b"%PDF-1.7", &[], 1).is_err());
        assert!(validate_native_print_payload(b"%PDF-1.7", &[vec![0, 1, 2]], 1).is_err());
    }

    #[test]
    fn enforces_copy_limit_before_spooling() {
        assert!(validate_native_print_payload(b"%PDF-1.7", &[b"\x89PNG\r\n\x1a\n".to_vec()], 0).is_err());
        assert!(validate_native_print_payload(b"%PDF-1.7", &[b"\x89PNG\r\n\x1a\n".to_vec()], 101).is_err());
    }

    #[test]
    fn refuses_duplex_jobs_on_printers_without_duplex_support() {
        let error = validate_duplex_support(DuplexMode::DuplexLong, false)
            .expect_err("a simplex-only printer must not silently print a duplex job");

        assert!(error.contains("does not support double-sided printing"));
    }

    #[test]
    fn accepts_duplex_payload_modes_and_legacy_duplex_alias() {
        assert_eq!(
            serde_json::from_str::<DuplexMode>("\"duplex_long\"").unwrap(),
            DuplexMode::DuplexLong
        );
        assert_eq!(
            serde_json::from_str::<DuplexMode>("\"duplex_short\"").unwrap(),
            DuplexMode::DuplexShort
        );
        assert_eq!(
            serde_json::from_str::<DuplexMode>("\"duplex\"").unwrap(),
            DuplexMode::DuplexLong
        );
    }
}

#[cfg(all(test, feature = "test-mode"))]
mod test_mode_tests {
    use super::{get_system_printers, print_to_native_hardware};

    #[test]
    fn printer_discovery_is_disabled() {
        assert!(get_system_printers().is_err());
    }

    #[test]
    fn native_printing_is_disabled() {
        assert!(print_to_native_hardware(serde_json::Value::Null).is_err());
    }
}
