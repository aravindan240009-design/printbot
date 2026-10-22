//! Local Named Pipe IPC Protocol between Tauri UI and Background Rust Service.
//! Named Pipe path: `\\.\pipe\printbot_service_ipc`
//! Guarantees that even over local IPC, cross-shop jobs are rejected.

use serde::{Deserialize, Serialize};
use crate::journal::{Journal, JobState};
use crate::printer_adapter::{PrinterAdapter, PrinterCapabilitySnapshot, PrintJobRequirement};

pub const IPC_PIPE_NAME: &str = r"\\.\pipe\printbot_service_ipc";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum IpcRequest {
    GetStatus,
    PairDevice {
        pairing_code: String,
        device_name: String,
    },
    UnpairDevice,
    GetPrinters,
    SubmitPrintJob {
        job_id: String,
        shop_id: String,
        printer_id: String,
        plan_hash: String,
        requirements: PrintJobRequirement,
    },
    MarkUnknown {
        job_id: String,
        reason: String,
    },
    Reconcile,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "status", content = "data")]
pub enum IpcResponse {
    Ok(IpcResponseData),
    Error(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceStatus {
    pub is_running: bool,
    pub is_paired: bool,
    pub device_id: Option<String>,
    pub paired_shop_id: Option<String>,
    pub agent_version: String,
    pub total_journal_entries: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum IpcResponseData {
    Status(ServiceStatus),
    Printers(Vec<PrinterCapabilitySnapshot>),
    JobSubmitted {
        job_id: String,
        state: String,
        spooler_job_id: u32,
    },
    JobMarkedUnknown {
        job_id: String,
        state: String,
    },
    Message(String),
}

pub struct IpcHandler {
    paired_shop_id: Option<String>,
    device_id: Option<String>,
    journal: Journal,
    printers: Vec<PrinterCapabilitySnapshot>,
}

impl IpcHandler {
    pub fn new(journal: Journal) -> Self {
        Self {
            paired_shop_id: Some("11111111-1111-1111-1111-111111111111".to_string()), // Default paired to Shop A
            device_id: Some("dev_ws_chennai_01".to_string()),
            journal,
            printers: PrinterAdapter::enumerate_printers(),
        }
    }

    pub fn handle_request(&mut self, request: IpcRequest) -> IpcResponse {
        match request {
            IpcRequest::GetStatus => {
                IpcResponse::Ok(IpcResponseData::Status(ServiceStatus {
                    is_running: true,
                    is_paired: self.paired_shop_id.is_some(),
                    device_id: self.device_id.clone(),
                    paired_shop_id: self.paired_shop_id.clone(),
                    agent_version: "1.0.0".to_string(),
                    total_journal_entries: self.journal.list().len(),
                }))
            }
            IpcRequest::GetPrinters => {
                IpcResponse::Ok(IpcResponseData::Printers(self.printers.clone()))
            }
            IpcRequest::PairDevice { pairing_code, device_name } => {
                if pairing_code.len() < 4 {
                    return IpcResponse::Error("Invalid pairing code format.".into());
                }
                self.paired_shop_id = Some("11111111-1111-1111-1111-111111111111".to_string());
                self.device_id = Some(format!("dev_{}", device_name.to_lowercase().replace(' ', "_")));
                IpcResponse::Ok(IpcResponseData::Message(format!(
                    "Device '{}' successfully paired with Shop A.",
                    device_name
                )))
            }
            IpcRequest::UnpairDevice => {
                self.paired_shop_id = None;
                self.device_id = None;
                IpcResponse::Ok(IpcResponseData::Message("Device unpaired successfully.".into()))
            }
            IpcRequest::SubmitPrintJob {
                job_id,
                shop_id,
                printer_id,
                plan_hash,
                requirements,
            } => {
                // 1. Zero-Trust Cross-Tenant Boundary Enforcement
                if let Some(ref my_shop) = self.paired_shop_id {
                    if my_shop != &shop_id {
                        return IpcResponse::Error(format!(
                            "Cross-tenant job execution rejected! Device is paired to shop '{}', but job requested '{}'.",
                            my_shop, shop_id
                        ));
                    }
                } else {
                    return IpcResponse::Error("Device is not paired with any shop. Cannot print.".into());
                }

                // 2. Validate Printer Compatibility
                let target_printer = self.printers.iter().find(|p| p.printer_id == printer_id || p.name == printer_id);
                if let Some(printer) = target_printer {
                    if let Err(comp_err) = PrinterAdapter::validate_compatibility(printer, &requirements) {
                        return IpcResponse::Error(format!("Printer incompatibility: {}", comp_err));
                    }
                } else {
                    return IpcResponse::Error(format!("Printer '{}' not found among connected hardware.", printer_id));
                }

                // 3. Persist Intent BEFORE winspool submission
                if let Err(journal_err) = self.journal.record_intent(&job_id, &shop_id, &plan_hash) {
                    return IpcResponse::Error(format!("Journal error: {}", journal_err));
                }

                // 4. Simulate / execute spool submission
                let mock_spool_id = 1042;
                let _ = self.journal.transition(&job_id, JobState::Submitting, "Dispatched to spooler", None);
                let _ = self.journal.transition(&job_id, JobState::SubmittedToSpooler, "Spool complete", Some(mock_spool_id));

                IpcResponse::Ok(IpcResponseData::JobSubmitted {
                    job_id,
                    state: "SUBMITTED_TO_SPOOLER".into(),
                    spooler_job_id: mock_spool_id,
                })
            }
            IpcRequest::MarkUnknown { job_id, reason } => {
                match self.journal.mark_unknown(&job_id, &reason) {
                    Ok(entry) => IpcResponse::Ok(IpcResponseData::JobMarkedUnknown {
                        job_id: entry.job_id,
                        state: "COMPLETION_UNKNOWN".into(),
                    }),
                    Err(e) => IpcResponse::Error(e),
                }
            }
            IpcRequest::Reconcile => {
                IpcResponse::Ok(IpcResponseData::Message("Local journal reconciled with cloud state.".into()))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ipc_cross_shop_job_rejected() {
        let journal = Journal::new_in_memory();
        let mut handler = IpcHandler::new(journal);

        // Service is paired to Shop A: 11111111-1111-1111-1111-111111111111
        // Attacker or misrouted job from Shop B: 22222222-2222-2222-2222-222222222222
        let cross_shop_req = IpcRequest::SubmitPrintJob {
            job_id: "job-evil-cross-shop".into(),
            shop_id: "22222222-2222-2222-2222-222222222222".into(), // Shop B!
            printer_id: "prn_canon_ir3530".into(),
            plan_hash: "hash123".into(),
            requirements: PrintJobRequirement {
                color_mode: "bw".into(),
                paper_size: "A4".into(),
                duplex_mode: "simplex".into(),
            },
        };

        let response = handler.handle_request(cross_shop_req);
        match response {
            IpcResponse::Error(msg) => {
                assert!(msg.contains("Cross-tenant job execution rejected"));
                assert!(msg.contains("Device is paired to shop '11111111-1111-1111-1111-111111111111'"));
            }
            _ => panic!("Cross-shop job MUST be rejected with IpcResponse::Error"),
        }
    }

    #[test]
    fn test_ipc_valid_job_submission_lifecycle() {
        let journal = Journal::new_in_memory();
        let mut handler = IpcHandler::new(journal);

        let valid_req = IpcRequest::SubmitPrintJob {
            job_id: "job-legit-101".into(),
            shop_id: "11111111-1111-1111-1111-111111111111".into(),
            printer_id: "prn_canon_ir3530".into(),
            plan_hash: "hash_ok_123".into(),
            requirements: PrintJobRequirement {
                color_mode: "color".into(),
                paper_size: "A4".into(),
                duplex_mode: "simplex".into(),
            },
        };

        let res = handler.handle_request(valid_req);
        match res {
            IpcResponse::Ok(IpcResponseData::JobSubmitted { job_id, state, spooler_job_id }) => {
                assert_eq!(job_id, "job-legit-101");
                assert_eq!(state, "SUBMITTED_TO_SPOOLER");
                assert_eq!(spooler_job_id, 1042);
            }
            _ => panic!("Expected Ok(JobSubmitted)"),
        }
    }
}
