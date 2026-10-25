// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{path::PathBuf, sync::Arc};

use tauri::{Manager, State};

mod journal;
mod printers;
mod workstation;

use journal::SpoolJournal;
use printers::{discover_printers, prepare_spool_job, SpoolReceipt};
use workstation::{JournalEntry, PrintRequest, PrinterInfo};

struct WorkstationState {
    bound_shop_id: Option<String>,
    spool_root: PathBuf,
    journal: Arc<SpoolJournal>,
}

#[tauri::command]
fn get_system_printers(state: State<'_, WorkstationState>) -> Result<Vec<PrinterInfo>, String> {
    let shop_id = state
        .bound_shop_id
        .as_deref()
        .ok_or_else(|| "workstation is not paired to a shop".to_string())?;
    discover_printers(shop_id)
}

#[tauri::command]
fn prepare_print_job(
    request: PrintRequest,
    state: State<'_, WorkstationState>,
) -> Result<SpoolReceipt, String> {
    let bound_shop_id = state
        .bound_shop_id
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
    let bound_shop_id = state
        .bound_shop_id
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
                bound_shop_id: None,
                spool_root,
                journal,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_system_printers,
            prepare_print_job,
            get_spool_job,
            mark_spool_unknown
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
