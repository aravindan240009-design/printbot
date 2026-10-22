use serde_json::{json, Value};

pub fn simulate(scenario: &str, normalized: &Value) -> Result<Value, String> {
    let (state, simulated_submission, retry) = match scenario {
        "ready" => ("SIMULATED_SUBMISSION", true, false),
        "offline" | "no-paper" => ("WAITING_FOR_OPERATOR", false, false),
        "jam" | "restart" | "timeout" | "cancel" | "crash-after-intent" => {
            ("COMPLETION_UNKNOWN", true, false)
        }
        "zero-print" => ("REJECTED_BEFORE_SUBMISSION", false, false),
        _ => return Err("unknown simulator scenario".into()),
    };
    Ok(
        json!({"backend":"simulator","scenario":scenario,"state":state,
        "submitted_to_spooler":false,"simulated_submission":simulated_submission,
        "physical_complete":null,"automatic_reprint_allowed":retry,
        "hardware_evidence":false,"accounting":normalized}),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn every_fault_refuses_hardware_claims_and_reprint() {
        for scenario in [
            "ready",
            "offline",
            "no-paper",
            "jam",
            "restart",
            "timeout",
            "cancel",
            "crash-after-intent",
            "zero-print",
        ] {
            let result = simulate(scenario, &json!({})).unwrap();
            assert_eq!(result["submitted_to_spooler"], false);
            assert!(result["physical_complete"].is_null());
            assert_eq!(result["automatic_reprint_allowed"], false);
            assert_eq!(result["hardware_evidence"], false);
        }
        assert!(simulate("invented", &json!({})).is_err());
    }
}
