// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{path::PathBuf, sync::{Arc, Mutex}};

use sha2::{Digest, Sha256};
use tauri::{Manager, State};

mod journal;
mod printers;
mod workstation;

use journal::SpoolJournal;
use printers::{discover_printers, prepare_spool_job, SpoolReceipt};
use workstation::{JournalEntry, PrintRequest, PrinterInfo};

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

    let claims: DeviceTokenClaims = if trimmed.starts_with('{') {
        serde_json::from_str(trimmed)
            .map_err(|e| format!("Unauthorized: malformed device token JSON: {e}"))?
    } else if trimmed.starts_with("devtoken:") {
        let parts: Vec<&str> = trimmed.split(':').collect();
        if parts.len() != 5 {
            return Err("Unauthorized: malformed delimited device token".into());
        }
        let exp = parts[3]
            .parse::<u64>()
            .map_err(|_| "Unauthorized: invalid expiration timestamp in device token")?;
        DeviceTokenClaims {
            shop_id: parts[1].to_string(),
            device_id: parts[2].to_string(),
            exp,
            sig: parts[4].to_string(),
        }
    } else {
        return Err("Unauthorized: unrecognized device token format. Raw shop IDs cannot be bound directly".into());
    };

    if claims.shop_id.trim().is_empty() || claims.device_id.trim().is_empty() {
        return Err("Unauthorized: device token claims contain empty shop_id or device_id".into());
    }

    // Verify token expiration against system clock
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    if claims.exp < now {
        return Err(format!("Unauthorized: device session token expired at timestamp {}", claims.exp));
    }

    // Workstation Hardware Integrity: Verify that this device token was issued specifically for this local PC
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
            mark_spool_unknown
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
