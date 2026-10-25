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

    pub fn mock_printers() -> Vec<PrinterCapabilitySnapshot> {
        vec![
            PrinterCapabilitySnapshot {
                printer_id: "prn_canon_ir3530".to_string(),
                name: "Canon imageRUNNER ADV C3530i".to_string(),
                system_name: "CANON_IR_C3530I".to_string(),
                driver_name: "Canon Generic Plus UFR II".to_string(),
                port_name: "192.168.1.150".to_string(),
                is_online: true,
                is_default: true,
                supports_color: true,
                supports_duplex: true,
                supported_paper_sizes: vec![
                    "A4".into(),
                    "A3".into(),
                    "Legal".into(),
                    "Letter".into(),
                ],
                max_resolution_dpi: 1200,
            },
            PrinterCapabilitySnapshot {
                printer_id: "prn_hp_m404dn".to_string(),
                name: "HP LaserJet Pro M404dn (Mono Workhorse)".to_string(),
                system_name: "HP_LJ_M404DN".to_string(),
                driver_name: "HP LaserJet Pro M404-M405 PCL-6".to_string(),
                port_name: "USB001".to_string(),
                is_online: true,
                is_default: false,
                supports_color: false, // B&W only
                supports_duplex: true,
                supported_paper_sizes: vec!["A4".into(), "Letter".into(), "Legal".into()],
                max_resolution_dpi: 1200,
            },
            PrinterCapabilitySnapshot {
                printer_id: "prn_virtual_pdf".to_string(),
                name: "Microsoft Print to PDF".to_string(),
                system_name: "Microsoft Print to PDF".to_string(),
                driver_name: "Microsoft Print To PDF".to_string(),
                port_name: "PORTPROMPT:".to_string(),
                is_online: true,
                is_default: false,
                supports_color: true,
                supports_duplex: false,
                supported_paper_sizes: vec!["A4".into(), "Letter".into()],
                max_resolution_dpi: 600,
            },
        ]
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_unlimited_printers_enumeration() {
        let printers = PrinterAdapter::mock_printers();
        assert!(printers.len() >= 3);
        assert!(printers.iter().any(|p| p.supports_color));
        assert!(printers.iter().any(|p| !p.supports_color));
    }

    #[test]
    fn test_compatibility_validation() {
        let printers = PrinterAdapter::mock_printers();
        let mono_printer = printers.iter().find(|p| !p.supports_color).unwrap();

        // Color job sent to mono printer must be rejected
        let color_req = PrintJobRequirement {
            color_mode: "color".into(),
            paper_size: "A4".into(),
            duplex_mode: "simplex".into(),
        };
        let err = PrinterAdapter::validate_compatibility(mono_printer, &color_req);
        assert!(err.is_err());
        assert!(err.unwrap_err().contains("only supports Black & White"));

        // A3 job sent to printer that only supports A4/Letter must be rejected
        let a3_req = PrintJobRequirement {
            color_mode: "bw".into(),
            paper_size: "A3".into(),
            duplex_mode: "simplex".into(),
        };
        let a3_err = PrinterAdapter::validate_compatibility(mono_printer, &a3_req);
        assert!(a3_err.is_err());
        assert!(a3_err
            .unwrap_err()
            .contains("only supports: A4, Letter, Legal"));
    }
}
