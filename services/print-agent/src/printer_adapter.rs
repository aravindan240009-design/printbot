//! Native Windows printer adapter & capability discovery.
//! Enumerates printers, checks driver capabilities, and prevents incompatible jobs.
//! Supports UNLIMITED connected printers per shop.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrinterCapabilitySnapshot {
    pub printer_id: String,
    pub name: String,
    pub system_name: String,
    pub driver_name: String,
    pub port_name: String,
    pub is_online: bool,
    pub is_default: bool,
    pub supports_color: bool,
    pub supports_duplex: bool,
    pub supported_paper_sizes: Vec<String>,
    pub max_resolution_dpi: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrintJobRequirement {
    pub color_mode: String,
    pub paper_size: String,
    pub duplex_mode: String,
}

pub struct PrinterAdapter;

impl PrinterAdapter {
    /// Enumerate all connected printers without artificial count restrictions.
    pub fn enumerate_printers() -> Vec<PrinterCapabilitySnapshot> {
        #[cfg(windows)]
        {
            Self::enumerate_windows_native()
        }
        #[cfg(not(windows))]
        {
            Vec::new()
        }
    }

    #[cfg(windows)]
    fn enumerate_windows_native() -> Vec<PrinterCapabilitySnapshot> {
        // Native enumeration is implemented by the Tauri workstation boundary.
        // The standalone service remains unpaired until that boundary is wired to
        // the authenticated device session; it must not invent printer identity.
        Vec::new()
    }

    /// Verifies if a given printer can physically fulfill the job requirements.
    pub fn validate_compatibility(
        printer: &PrinterCapabilitySnapshot,
        req: &PrintJobRequirement,
    ) -> Result<(), String> {
        if !printer.is_online {
            return Err(format!("Printer '{}' is offline.", printer.name));
        }

        // Color check
        if req.color_mode == "color" && !printer.supports_color {
            return Err(format!(
                "Job requires Color printing, but printer '{}' only supports Black & White.",
                printer.name
            ));
        }

        // Duplex check
        if req.duplex_mode != "simplex" && !printer.supports_duplex {
            return Err(format!(
                "Job requires double-sided (duplex) printing, but printer '{}' only supports single-sided.",
                printer.name
            ));
        }

        // Paper size check
        if !printer
            .supported_paper_sizes
            .iter()
            .any(|s| s.eq_ignore_ascii_case(&req.paper_size))
        {
            return Err(format!(
                "Job requires paper size '{}', but printer '{}' only supports: {}.",
                req.paper_size,
                printer.name,
                printer.supported_paper_sizes.join(", ")
            ));
        }

        Ok(())
    }
}
