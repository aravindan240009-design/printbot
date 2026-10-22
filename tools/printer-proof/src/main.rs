//! Phase 0 trusted-local experiment, not an authenticated production printing service.
#[cfg(any(windows, test))]
mod journal;
#[cfg(windows)]
mod pdfium;
mod simulator;
#[cfg(windows)]
mod windows;

use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

const MAX_PDF_BYTES: u64 = 32 * 1024 * 1024;
const MAX_PLAN_BYTES: u64 = 2 * 1024 * 1024;

#[derive(Debug)]
struct Args {
    command: String,
    values: BTreeMap<String, String>,
    switches: BTreeSet<String>,
}

impl Args {
    fn parse(raw: Vec<String>) -> Result<Self, String> {
        let mut iter = raw.into_iter();
        let command = iter.next().unwrap_or_else(|| "help".into());
        let allowed = [
            "--backend",
            "--printer",
            "--job-id",
            "--pdf",
            "--plan",
            "--shop-id",
            "--pdfium",
            "--pdfium-sha256",
            "--journal",
            "--output",
            "--scenario",
            "--timeout-ms",
        ];
        let mut result = Self {
            command,
            values: BTreeMap::new(),
            switches: BTreeSet::new(),
        };
        while let Some(key) = iter.next() {
            if key == "--trusted-local" {
                if !result.switches.insert(key) {
                    return Err("duplicate switch".into());
                }
            } else {
                if !allowed.contains(&key.as_str()) {
                    return Err(format!("unknown argument: {key}"));
                }
                let value = iter
                    .next()
                    .ok_or_else(|| format!("missing value for {key}"))?;
                if value.starts_with("--") || result.values.insert(key, value).is_some() {
                    return Err("missing value or duplicate argument".into());
                }
            }
        }
        Ok(result)
    }
    fn get(&self, key: &str) -> Result<&str, String> {
        self.values
            .get(key)
            .map(String::as_str)
            .ok_or_else(|| format!("required argument: {key}"))
    }
    fn path(&self, key: &str) -> Result<PathBuf, String> {
        Ok(PathBuf::from(self.get(key)?))
    }
    fn check(&self) -> Result<(), String> {
        let allowed: &[&str] = match self.command.as_str() {
            "list" => &["--backend"],
            "capabilities" => &["--printer"],
            "observe" => &["--printer", "--job-id"],
            "validate" => &["--plan", "--shop-id", "--pdf"],
            "simulate" => &["--plan", "--shop-id", "--pdf", "--scenario"],
            "print" | "__print-child" => &[
                "--plan",
                "--shop-id",
                "--pdf",
                "--printer",
                "--pdfium",
                "--pdfium-sha256",
                "--journal",
                "--output",
                "--timeout-ms",
            ],
            _ => &[],
        };
        if self
            .values
            .keys()
            .any(|key| !allowed.contains(&key.as_str()))
        {
            return Err("argument not valid for this command".into());
        }
        if !["print", "__print-child"].contains(&self.command.as_str()) && !self.switches.is_empty()
        {
            return Err("switch not valid for this command".into());
        }
        Ok(())
    }
}

fn bounded_read(path: &Path, limit: u64) -> Result<Vec<u8>, String> {
    let file = std::fs::File::open(path).map_err(|e| format!("input unavailable: {e}"))?;
    let metadata = file.metadata().map_err(|e| e.to_string())?;
    if !metadata.is_file() || metadata.len() > limit {
        return Err("input exceeds proof limit or is not a regular file".into());
    }
    let mut bytes = Vec::new();
    file.take(limit + 1)
        .read_to_end(&mut bytes)
        .map_err(|e| e.to_string())?;
    if bytes.len() as u64 > limit {
        return Err("input grew beyond proof limit".into());
    }
    Ok(bytes)
}

fn pdf_envelope(path: &Path, expected: &str) -> Result<(), String> {
    let bytes = bounded_read(path, MAX_PDF_BYTES)?;
    if !bytes.starts_with(b"%PDF-")
        || !bytes[bytes.len().saturating_sub(1024)..]
            .windows(5)
            .any(|w| w == b"%%EOF")
    {
        return Err("malformed PDF envelope; no job submitted".into());
    }
    if format!("{:x}", Sha256::digest(&bytes)) != expected {
        return Err("source PDF SHA256 mismatch; no job submitted".into());
    }
    Ok(())
}

fn validated(args: &Args) -> Result<(Value, Value, String), String> {
    let bytes = bounded_read(&args.path("--plan")?, MAX_PLAN_BYTES)?;
    let plan: Value =
        serde_json::from_slice(&bytes).map_err(|e| format!("invalid plan JSON: {e}"))?;
    let normalized = printplan::validate(&plan, args.get("--shop-id")?)?;
    if let Some(pdf) = args.values.get("--pdf") {
        if plan["files"].as_array().map(Vec::len) != Some(1) {
            return Err(
                "CLI --pdf supports exactly one file; full contract can describe multiple files"
                    .into(),
            );
        }
        pdf_envelope(
            Path::new(pdf),
            plan["files"][0]["sha256"]
                .as_str()
                .ok_or("missing source hash")?,
        )?;
    }
    let plan_hash = format!(
        "{:x}",
        Sha256::digest(serde_json::to_vec(&plan).map_err(|e| e.to_string())?)
    );
    Ok((plan, normalized, plan_hash))
}

fn supervised(args: &Args) -> Result<Value, String> {
    let timeout = args
        .values
        .get("--timeout-ms")
        .map(|s| s.parse::<u64>())
        .transpose()
        .map_err(|_| "invalid timeout")?
        .unwrap_or(120_000);
    if !(1000..=900_000).contains(&timeout) {
        return Err("timeout must be 1000..900000 milliseconds".into());
    }
    // Verify before launching; child repeats all validation and owns exclusive journal intent.
    let _ = validated(args)?;
    if !args.switches.contains("--trusted-local") {
        return Err("printing requires --trusted-local: synthetic/trusted samples only".into());
    }
    let executable = std::env::current_exe().map_err(|e| e.to_string())?;
    let mut command = Command::new(executable);
    command.arg("__print-child");
    for (key, value) in &args.values {
        if key != "--timeout-ms" {
            command.arg(key).arg(value);
        }
    }
    command
        .arg("--trusted-local")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    let mut child = command
        .spawn()
        .map_err(|e| format!("could not start print worker: {e}"))?;
    // Drain both pipes while polling. Even a successful driver job must not hang
    // merely because a verbose result fills a pipe before process exit.
    fn capture<R: std::io::Read + Send + 'static>(
        reader: R,
    ) -> std::thread::JoinHandle<std::io::Result<Vec<u8>>> {
        std::thread::spawn(move || {
            let mut bytes = Vec::new();
            reader.take(1_048_577).read_to_end(&mut bytes)?;
            Ok(bytes)
        })
    }
    let stdout = capture(child.stdout.take().ok_or("worker stdout missing")?);
    let stderr = capture(child.stderr.take().ok_or("worker stderr missing")?);
    let start = Instant::now();
    loop {
        if child.try_wait().map_err(|e| e.to_string())?.is_some() {
            let status = child.wait().map_err(|e| e.to_string())?;
            let output = stdout
                .join()
                .map_err(|_| "COMPLETION_UNKNOWN: worker stdout reader panicked")?
                .map_err(|e| format!("COMPLETION_UNKNOWN: worker stdout: {e}"))?;
            let errors = stderr
                .join()
                .map_err(|_| "COMPLETION_UNKNOWN: worker stderr reader panicked")?
                .map_err(|e| format!("COMPLETION_UNKNOWN: worker stderr: {e}"))?;
            if output.len() > 1_048_576 || errors.len() > 1_048_576 {
                return Err("COMPLETION_UNKNOWN: worker output exceeded bound".into());
            }
            if !status.success() {
                return Err(format!(
                    "print worker: {}",
                    String::from_utf8_lossy(&errors)
                ));
            }
            return serde_json::from_slice(&output)
                .map_err(|e| format!("COMPLETION_UNKNOWN: malformed worker result: {e}"));
        }
        if start.elapsed() > Duration::from_millis(timeout) {
            let _ = child.kill();
            let _ = child.wait();
            let _ = stdout.join();
            let _ = stderr.join();
            return Err("COMPLETION_UNKNOWN: worker timed out; job may have reached spooler; reconcile, never automatic reprint".into());
        }
        std::thread::sleep(Duration::from_millis(50));
    }
}

#[cfg(windows)]
fn print_child(args: &Args) -> Result<Value, String> {
    if !args.switches.contains("--trusted-local") {
        return Err("trusted-local confirmation required".into());
    }
    let (plan, normalized, hash) = validated(args)?;
    let pdf = args
        .path("--pdf")?
        .canonicalize()
        .map_err(|e| e.to_string())?;
    let dll = args.path("--pdfium")?;
    if !dll.is_absolute() {
        return Err("PDFium DLL path must be absolute".into());
    }
    let output = args.values.get("--output").map(PathBuf::from);
    if let Some(path) = &output {
        if !path.is_absolute() || path.exists() {
            return Err("output must be an absolute, new path".into());
        }
    }
    let mut journal = journal::Journal::reserve(
        &args.path("--journal")?,
        args.get("--shop-id")?,
        plan["job_id"].as_str().ok_or("missing job ID")?,
        &hash,
    )?;
    let result = windows::print(
        args.get("--printer")?,
        &pdf,
        &dll,
        args.get("--pdfium-sha256")?,
        &plan,
        &normalized,
        output.as_deref(),
        &mut |id| {
            journal.event(
                json!({"event":"STARTDOC_ACCEPTED","spooler_job_id":id,"physical_complete":null}),
            )
        },
    );
    match result {
        Ok(mut result) => {
            journal.event(json!({"event":"SUBMITTED_TO_SPOOLER","physical_complete":null,"automatic_reprint_allowed":false}))?;
            result["journal_path"] = json!(journal.path);
            result["plan_sha256"] = json!(hash);
            result["render_hash"] = plan["render_hash"].clone();
            Ok(result)
        }
        Err(error) => {
            let _ = journal
                .event(json!({"event":"COMPLETION_UNKNOWN","automatic_reprint_allowed":false}));
            Err(format!(
                "COMPLETION_UNKNOWN: {error}; intent retained; supervised reconciliation required"
            ))
        }
    }
}

fn run(args: &Args) -> Result<Value, String> {
    args.check()?;
    match args.command.as_str() {
        "help" | "--help" => Ok(json!({"usage":[
            "list --backend windows", "capabilities --printer NAME", "observe --printer NAME --job-id NUMBER",
            "validate --plan FILE --shop-id UUID [--pdf FILE]",
            "simulate --plan FILE --shop-id UUID --scenario ready|offline|no-paper|jam|restart|timeout|cancel|crash-after-intent|zero-print",
            "print --plan FILE --pdf FILE --shop-id UUID --printer NAME --pdfium ABSOLUTE_DLL --pdfium-sha256 HASH --journal PRIVATE_DIR --trusted-local [--output NEW_ABSOLUTE_PDF] [--timeout-ms 120000]"
        ],"scope":"trusted synthetic Phase 0 only; --shop-id is a local authorization test seam, not production authentication"})),
        "validate" => {
            let (_, normalized, hash) = validated(args)?;
            Ok(
                json!({"valid":true,"plan_sha256":hash,"accounting":normalized,"source_hash_verified":args.values.contains_key("--pdf"),"pdf_structure_verified":false}),
            )
        }
        "simulate" => {
            let (_, normalized, _) = validated(args)?;
            simulator::simulate(args.get("--scenario")?, &normalized)
        }
        "print" => supervised(args),
        #[cfg(windows)]
        "__print-child" => print_child(args),
        #[cfg(windows)]
        "list" => {
            if args
                .values
                .get("--backend")
                .map(String::as_str)
                .unwrap_or("windows")
                != "windows"
            {
                return Err("use simulate explicitly; no backend fallback".into());
            }
            windows::list()
        }
        #[cfg(windows)]
        "capabilities" => windows::capabilities(args.get("--printer")?),
        #[cfg(windows)]
        "observe" => windows::observe(
            args.get("--printer")?,
            args.get("--job-id")?
                .parse()
                .map_err(|_| "job ID must be an unsigned integer")?,
        ),
        _ => Err(
            "unknown command or Windows backend unavailable; simulator must be selected explicitly"
                .into(),
        ),
    }
}

fn main() {
    match Args::parse(std::env::args().skip(1).collect()).and_then(|args| run(&args)) {
        Ok(value) => println!("{}", serde_json::to_string(&value).expect("JSON output")),
        Err(error) => {
            let _ = writeln!(
                std::io::stderr(),
                "{}",
                json!({"error":error,"automatic_reprint_allowed":false,"physical_complete":null})
            );
            std::process::exit(2);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn ambiguous_cli_input_is_rejected() {
        for args in [
            vec!["validate", "--wat", "x"],
            vec!["validate", "--plan"],
            vec!["validate", "--plan", "a", "--plan", "b"],
        ] {
            assert!(Args::parse(args.into_iter().map(str::to_string).collect()).is_err());
        }
    }
    #[test]
    fn missing_or_malformed_pdf_cannot_submit() {
        assert!(pdf_envelope(Path::new("missing-phase0-file.pdf"), "hash").is_err());
    }
}
