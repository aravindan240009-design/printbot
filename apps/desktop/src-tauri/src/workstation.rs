use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PrintRequest {
    pub job_id: String,
    pub shop_id: String,
    pub printer_name: String,
    pub document_path: String,
    pub copies: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PrinterInfo {
    pub name: String,
    pub shop_id: String,
    pub is_default: bool,
    pub is_online: bool,
    pub supports_color: bool,
    pub supports_duplex: bool,
    pub supported_paper_sizes: Vec<String>,
    pub queue_count: u32,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum SpoolState {
    Intent,
    Submitted { spooler_job_id: u32 },
    CompletionUnknown { reason: String },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct JournalEntry {
    pub job_id: String,
    pub shop_id: String,
    pub document_path: String,
    pub state: SpoolState,
}
