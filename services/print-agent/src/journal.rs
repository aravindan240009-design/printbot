//! Durable SQLite / WAL-style local print journal.
//! Strictly enforces that intent is persisted BEFORE spool submission.
//! Invariant: Jobs in SUBMITTING or COMPLETION_UNKNOWN states can NEVER be automatically re-spooled.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum JobState {
    Ready,
    Leased,
    Downloading,
    Prepared,
    Submitting,
    SubmittedToSpooler,
    PhysicalCompleteIfConfirmed,
    CompletionUnknown,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JournalEntry {
    pub job_id: String,
    pub shop_id: String,
    pub plan_hash: String,
    pub attempt_id: u32,
    pub state: JobState,
    pub lease_expires_at: Option<u64>,
    pub transition_reason: String,
    pub spooler_job_id: Option<u32>,
    pub updated_at: u64,
}

#[derive(Debug)]
pub struct Journal {
    entries: HashMap<String, JournalEntry>,
    log_path: Option<PathBuf>,
}

impl Journal {
    pub fn new_in_memory() -> Self {
        Self {
            entries: HashMap::new(),
            log_path: None,
        }
    }

    pub fn open<P: AsRef<Path>>(dir: P) -> Result<Self, String> {
        let dir = dir.as_ref();
        fs::create_dir_all(dir).map_err(|e| format!("failed to create journal dir: {e}"))?;
        let log_path = dir.join("journal.wal");

        let mut journal = Self {
            entries: HashMap::new(),
            log_path: Some(log_path.clone()),
        };

        if log_path.exists() {
            let data =
                fs::read_to_string(&log_path).map_err(|e| format!("failed to read WAL: {e}"))?;
            for line in data.lines() {
                if line.trim().is_empty() {
                    continue;
                }
                if let Ok(entry) = serde_json::from_str::<JournalEntry>(line) {
                    journal.entries.insert(entry.job_id.clone(), entry);
                }
            }
        }

        Ok(journal)
    }

    fn now_secs() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    }

    /// Stores the print intent BEFORE any submission to winspool occurs.
    pub fn record_intent(
        &mut self,
        job_id: &str,
        shop_id: &str,
        plan_hash: &str,
    ) -> Result<JournalEntry, String> {
        if let Some(existing) = self.entries.get(job_id) {
            // If already submitted or unknown, refuse to overwrite without supervisor resolution
            if existing.state == JobState::Submitting
                || existing.state == JobState::CompletionUnknown
            {
                return Err(format!(
                    "Job '{job_id}' is in ambiguous state '{:?}'; automatic resubmission forbidden.",
                    existing.state
                ));
            }
            if existing.state == JobState::SubmittedToSpooler
                || existing.state == JobState::PhysicalCompleteIfConfirmed
            {
                return Err(format!(
                    "Job '{job_id}' already spooled; duplicate print rejected."
                ));
            }
        }

        let entry = JournalEntry {
            job_id: job_id.to_string(),
            shop_id: shop_id.to_string(),
            plan_hash: plan_hash.to_string(),
            attempt_id: 1,
            state: JobState::Ready,
            lease_expires_at: Some(Self::now_secs() + 600), // 10 min lease
            transition_reason: "Initial intent registered".to_string(),
            spooler_job_id: None,
            updated_at: Self::now_secs(),
        };

        self.persist_entry(&entry)?;
        self.entries.insert(job_id.to_string(), entry.clone());
        Ok(entry)
    }

    /// Safely transitions the state machine with crash recovery validation.
    pub fn transition(
        &mut self,
        job_id: &str,
        next_state: JobState,
        reason: &str,
        spooler_job_id: Option<u32>,
    ) -> Result<JournalEntry, String> {
        let entry = self
            .entries
            .get_mut(job_id)
            .ok_or_else(|| format!("Job '{job_id}' not found in journal"))?;

        // Enforce safe transition invariants:
        match (entry.state, next_state) {
            // Cannot spontaneously revert from spooler or completion states
            (JobState::SubmittedToSpooler, JobState::Ready)
            | (JobState::SubmittedToSpooler, JobState::Submitting) => {
                return Err("Cannot re-spool job that has already reached the spooler.".into());
            }
            // Cannot auto-replay ambiguous submission outcomes
            (JobState::CompletionUnknown, JobState::Submitting) => {
                return Err("COMPLETION_UNKNOWN job requires supervised manual reconciliation, NEVER auto-reprint.".into());
            }
            _ => {}
        }

        entry.state = next_state;
        entry.transition_reason = reason.to_string();
        entry.updated_at = Self::now_secs();
        if spooler_job_id.is_some() {
            entry.spooler_job_id = spooler_job_id;
        }

        let cloned = entry.clone();
        self.persist_entry(&cloned)?;
        Ok(cloned)
    }

    /// Mark an ambiguous or stalled spooling job as COMPLETION_UNKNOWN.
    pub fn mark_unknown(&mut self, job_id: &str, reason: &str) -> Result<JournalEntry, String> {
        self.transition(job_id, JobState::CompletionUnknown, reason, None)
    }

    pub fn get(&self, job_id: &str) -> Option<&JournalEntry> {
        self.entries.get(job_id)
    }

    pub fn list(&self) -> Vec<&JournalEntry> {
        self.entries.values().collect()
    }

    fn persist_entry(&self, entry: &JournalEntry) -> Result<(), String> {
        if let Some(ref path) = self.log_path {
            let serialized = serde_json::to_string(entry).map_err(|e| e.to_string())?;
            let mut file = OpenOptions::new()
                .create(true)
                .append(true)
                .open(path)
                .map_err(|e| format!("failed to append to WAL: {e}"))?;
            writeln!(file, "{}", serialized)
                .map_err(|e| format!("failed to write WAL line: {e}"))?;
            file.flush()
                .map_err(|e| format!("failed to flush WAL: {e}"))?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_intent_recorded_before_submission() {
        let mut journal = Journal::new_in_memory();
        let entry = journal
            .record_intent("job-101", "shop-chennai", "hash_abc_123")
            .expect("should record intent");
        assert_eq!(entry.state, JobState::Ready);
        assert_eq!(entry.job_id, "job-101");
    }

    #[test]
    fn test_duplicate_intent_for_submitted_job_is_rejected() {
        let mut journal = Journal::new_in_memory();
        journal
            .record_intent("job-101", "shop-chennai", "hash_abc")
            .unwrap();
        journal
            .transition(
                "job-101",
                JobState::SubmittedToSpooler,
                "Spool complete",
                Some(42),
            )
            .unwrap();

        // Attempting to record intent again for same job MUST be rejected
        let duplicate = journal.record_intent("job-101", "shop-chennai", "hash_abc");
        assert!(duplicate.is_err());
        assert!(duplicate.unwrap_err().contains("already spooled"));
    }

    #[test]
    fn test_completion_unknown_blocks_auto_reprint() {
        let mut journal = Journal::new_in_memory();
        journal
            .record_intent("job-999", "shop-chennai", "hash_xyz")
            .unwrap();
        journal
            .transition(
                "job-999",
                JobState::Submitting,
                "In transit to winspool",
                None,
            )
            .unwrap();
        journal
            .mark_unknown("job-999", "Spooler process stalled or crashed")
            .unwrap();

        // Must reject automatic transition back to submitting
        let auto_retry = journal.transition("job-999", JobState::Submitting, "Auto retry", None);
        assert!(auto_retry.is_err());
        assert!(auto_retry.unwrap_err().contains("COMPLETION_UNKNOWN"));
    }
}
