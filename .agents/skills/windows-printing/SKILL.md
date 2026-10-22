---
name: windows-printing
description: Architecture and operational runbook for native Windows print spooler integration, winspool.drv communication, job reconciliation, and offline resilience in Tauri 2.
---

# Windows Printing & Desktop Integration Skill

## Printing Subsystem Architecture
- **Tauri Core**: Rust commands interfacing with Windows `winspool.drv` / `System.Drawing.Printing` / Win32 Spooler APIs.
- **Hardware Abstraction**:
  - `EnumPrinters`: Query locally attached USB and network printers.
  - `GetPrinterDriver`: Validate paper sizes, color support, and duplex capabilities.
  - `StartDocPrinter` / `WritePrinter`: Direct raw spooling for PDF/PostScript/PCL streams.
  - `GetJob`: Query physical job status (PRINTING, PAPEROUT, PAUSED, ERROR, DELETED).

## Reconciliation Protocol (Zero Duplicate Guarantee)
1. **Cloud to Workstation Claim**:
   - Workstation issues atomic claim for a `PAID` print job with workstation hardware ID and lease expiration (e.g. 5 minutes).
2. **Local Pre-Spool Ledger**:
   - Write job ID, payload hash, and timestamp to local SQLite `spool_journal` BEFORE submitting to Windows print spooler.
3. **Spool Submission**:
   - Submit job to `winspool.drv`.
   - Record Windows Spooler `JobId` in journal.
4. **Physical Confirmation & Cloud Ack**:
   - Monitor `GetJob` until spooler transitions to spool confirmed / printed.
   - Dispatch cloud update: `JobStatus.PRINTED` with Spooler Job ID and paper consumption record.
5. **Recovery on Disconnect / Reboot**:
   - Upon restart, read local `spool_journal`.
   - Cross-check with Windows spooler jobs using `EnumJobs`.
   - Reconcile status with cloud API: NEVER resend a job that was already spooled.
