use rusqlite::{params, Connection, OptionalExtension};
use std::{
    fs,
    path::{Path, PathBuf},
};

use crate::workstation::{JournalEntry, SpoolState};

#[derive(Debug)]
pub struct SpoolJournal {
    database_path: PathBuf,
}

impl SpoolJournal {
    pub fn open(root: &Path) -> Result<Self, String> {
        fs::create_dir_all(root).map_err(|error| format!("create journal directory: {error}"))?;
        let journal = Self {
            database_path: root.join("spool_journal.sqlite3"),
        };
        journal.with_connection(|connection| {
            connection.execute_batch(
                "PRAGMA journal_mode = WAL;
                 CREATE TABLE IF NOT EXISTS spool_journal (
                   job_id TEXT PRIMARY KEY NOT NULL,
                   shop_id TEXT NOT NULL,
                   document_path TEXT NOT NULL,
                   state TEXT NOT NULL,
                   spooler_job_id INTEGER,
                   reason TEXT,
                   created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                   updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                 );",
            )?;
            Ok(())
        })?;
        Ok(journal)
    }

    pub fn record_intent(
        &self,
        job_id: &str,
        shop_id: &str,
        document_path: &str,
    ) -> Result<(), String> {
        self.with_connection(|connection| {
            let existing: Option<(String, String)> = connection
                .query_row(
                    "SELECT shop_id, state FROM spool_journal WHERE job_id = ?1",
                    [job_id],
                    |row| Ok((row.get(0)?, row.get(1)?)),
                )
                .optional()?;
            if let Some((existing_shop, state)) = existing {
                return Err(rusqlite::Error::ToSqlConversionFailure(Box::new(
                    JournalConflict { job_id: job_id.to_owned(), existing_shop, state },
                )));
            }
            connection.execute(
                "INSERT INTO spool_journal (job_id, shop_id, document_path, state) VALUES (?1, ?2, ?3, 'INTENT')",
                params![job_id, shop_id, document_path],
            )?;
            Ok(())
        })
    }

    // Kept intentionally unavailable to the UI until a server-authorized native
    // submission path exists. Physical submission must call this only after the
    // Win32 spooler returns a verified job identifier.
    #[allow(dead_code)]
    pub fn mark_submitted(&self, job_id: &str, spooler_job_id: u32) -> Result<(), String> {
        self.transition(job_id, "SUBMITTED", Some(spooler_job_id), None)
    }

    pub fn mark_unknown(&self, job_id: &str, reason: &str) -> Result<(), String> {
        self.transition(job_id, "UNKNOWN", None, Some(reason))
    }

    pub fn get(&self, job_id: &str) -> Result<Option<JournalEntry>, String> {
        self.with_connection(|connection| {
            connection
                .query_row(
                    "SELECT job_id, shop_id, document_path, state, spooler_job_id, reason FROM spool_journal WHERE job_id = ?1",
                    [job_id],
                    |row| {
                        let state: String = row.get(3)?;
                        let spooler_job_id: Option<u32> = row.get(4)?;
                        let reason: Option<String> = row.get(5)?;
                        let spool_state = match state.as_str() {
                            "INTENT" => SpoolState::Intent,
                            "SUBMITTED" => SpoolState::Submitted {
                                spooler_job_id: spooler_job_id.ok_or_else(|| rusqlite::Error::InvalidQuery)?,
                            },
                            "UNKNOWN" => SpoolState::CompletionUnknown {
                                reason: reason.ok_or_else(|| rusqlite::Error::InvalidQuery)?,
                            },
                            _ => return Err(rusqlite::Error::InvalidQuery),
                        };
                        Ok(JournalEntry {
                            job_id: row.get(0)?,
                            shop_id: row.get(1)?,
                            document_path: row.get(2)?,
                            state: spool_state,
                        })
                    },
                )
                .optional()
        })
    }

    fn transition(
        &self,
        job_id: &str,
        next_state: &str,
        spooler_job_id: Option<u32>,
        reason: Option<&str>,
    ) -> Result<(), String> {
        self.with_connection(|connection| {
            let current: Option<String> = connection
                .query_row("SELECT state FROM spool_journal WHERE job_id = ?1", [job_id], |row| row.get(0))
                .optional()?;
            let Some(current) = current else {
                return Err(rusqlite::Error::QueryReturnedNoRows);
            };
            if current != "INTENT" {
                return Err(rusqlite::Error::ToSqlConversionFailure(Box::new(
                    JournalConflict { job_id: job_id.to_owned(), existing_shop: String::new(), state: current },
                )));
            }
            connection.execute(
                "UPDATE spool_journal SET state = ?2, spooler_job_id = ?3, reason = ?4, updated_at = CURRENT_TIMESTAMP WHERE job_id = ?1 AND state = 'INTENT'",
                params![job_id, next_state, spooler_job_id, reason],
            )?;
            Ok(())
        })
    }

    fn with_connection<T>(
        &self,
        operation: impl FnOnce(&Connection) -> rusqlite::Result<T>,
    ) -> Result<T, String> {
        let connection = Connection::open(&self.database_path)
            .map_err(|error| format!("open spool journal: {error}"))?;
        operation(&connection).map_err(|error| format!("spool journal operation failed: {error}"))
    }
}

#[derive(Debug)]
struct JournalConflict {
    job_id: String,
    existing_shop: String,
    state: String,
}

impl std::fmt::Display for JournalConflict {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            formatter,
            "job {} already exists for shop '{}' in state {}",
            self.job_id, self.existing_shop, self.state
        )
    }
}

impl std::error::Error for JournalConflict {}

#[cfg(test)]
mod tests {
    use super::SpoolJournal;
    use tempfile::tempdir;

    #[test]
    fn duplicate_intent_is_rejected() {
        let directory = tempdir().expect("temporary journal directory");
        let journal = SpoolJournal::open(directory.path()).expect("open journal");

        journal
            .record_intent("job-1", "shop-a", "document.pdf")
            .expect("first intent");

        let duplicate = journal.record_intent("job-1", "shop-a", "document.pdf");
        assert!(duplicate.is_err(), "a job must not be submitted twice");
    }

    #[test]
    fn foreign_shop_identity_is_rejected() {
        let directory = tempdir().expect("temporary journal directory");
        let journal = SpoolJournal::open(directory.path()).expect("open journal");

        journal
            .record_intent("job-1", "shop-a", "document.pdf")
            .expect("first intent");

        let foreign = journal.record_intent("job-1", "shop-b", "document.pdf");
        assert!(foreign.is_err(), "a job cannot change shop identity");
    }

    #[test]
    fn unknown_state_is_monotonic() {
        let directory = tempdir().expect("temporary journal directory");
        let journal = SpoolJournal::open(directory.path()).expect("open journal");

        journal
            .record_intent("job-1", "shop-a", "document.pdf")
            .expect("intent");
        journal
            .mark_unknown("job-1", "spooler response was ambiguous")
            .expect("unknown state");

        let submitted = journal.mark_submitted("job-1", 42);
        assert!(
            submitted.is_err(),
            "unknown jobs must not be auto-reprinted"
        );
    }

    #[test]
    fn intent_survives_reopen() {
        let directory = tempdir().expect("temporary journal directory");
        {
            let journal = SpoolJournal::open(directory.path()).expect("open journal");
            journal
                .record_intent("job-1", "shop-a", "document.pdf")
                .expect("intent");
        }

        let reopened = SpoolJournal::open(directory.path()).expect("reopen journal");
        assert!(
            reopened
                .record_intent("job-1", "shop-a", "document.pdf")
                .is_err(),
            "journal intent must survive process restart"
        );
    }
}
