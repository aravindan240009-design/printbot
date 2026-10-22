//! An existing intent is evidence of possible submission, never permission to retry.
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

pub struct Journal {
    file: File,
    pub path: PathBuf,
}

impl Journal {
    pub fn reserve(
        directory: &Path,
        shop: &str,
        job: &str,
        plan_hash: &str,
    ) -> Result<Self, String> {
        fs::create_dir_all(directory).map_err(|e| format!("journal directory: {e}"))?;
        let name = format!(
            "{:x}.jsonl",
            Sha256::digest(format!("{shop}\0{job}").as_bytes())
        );
        let path = directory.join(name);
        let mut options = OpenOptions::new();
        options.write(true).create_new(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o600);
        }
        let file = options.open(&path).map_err(|e| {
            if e.kind() == std::io::ErrorKind::AlreadyExists {
                "COMPLETION_UNKNOWN: existing job intent; supervised reconciliation required; automatic retry refused".into()
            } else {
                format!("journal reservation failed: {e}")
            }
        })?;
        let mut journal = Self { file, path };
        journal.event(json!({"event":"SUBMISSION_INTENT","shop_id":shop,"job_id":job,"plan_sha256":plan_hash}))?;
        // Flush directory metadata as well where the platform permits it.
        #[cfg(unix)]
        File::open(directory)
            .and_then(|f| f.sync_all())
            .map_err(|e| format!("journal directory sync: {e}"))?;
        Ok(journal)
    }

    pub fn event(&mut self, event: Value) -> Result<(), String> {
        serde_json::to_writer(&mut self.file, &event)
            .map_err(|e| format!("journal serialization: {e}"))?;
        self.file
            .write_all(b"\n")
            .map_err(|e| format!("journal write: {e}"))?;
        self.file
            .sync_all()
            .map_err(|e| format!("journal flush: {e}"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Arc, Barrier};
    use std::time::{SystemTime, UNIX_EPOCH};

    fn directory() -> PathBuf {
        std::env::temp_dir().join(format!(
            "printbot-journal-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ))
    }

    #[test]
    fn existing_intent_refuses_even_a_different_plan() {
        let dir = directory();
        let first = Journal::reserve(&dir, "shop-a", "job-a", "hash-a").unwrap();
        let path = first.path.clone();
        drop(first);
        assert!(fs::read_to_string(path)
            .unwrap()
            .contains("SUBMISSION_INTENT"));
        assert!(Journal::reserve(&dir, "shop-a", "job-a", "hash-b").is_err());
        assert!(Journal::reserve(&dir, "shop-b", "job-a", "hash-a").is_ok());
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn concurrent_reservation_has_exactly_one_winner() {
        let dir = directory();
        let barrier = Arc::new(Barrier::new(8));
        let handles: Vec<_> = (0..8)
            .map(|_| {
                let dir = dir.clone();
                let barrier = barrier.clone();
                std::thread::spawn(move || {
                    barrier.wait();
                    Journal::reserve(&dir, "shop-a", "job-a", "hash-a").is_ok()
                })
            })
            .collect();
        assert_eq!(
            handles
                .into_iter()
                .map(|h| usize::from(h.join().unwrap()))
                .sum::<usize>(),
            1
        );
        fs::remove_dir_all(dir).unwrap();
    }
}
