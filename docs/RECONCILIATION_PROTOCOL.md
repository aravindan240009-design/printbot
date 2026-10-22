# Safe Print Spool Reconciliation Protocol

## The Problem
When a desktop workstation prints high-volume customer orders, two catastrophic edge cases frequently occur in legacy print shops:
1. **Network Drop During Spooling**: The local printer physically starts printing, but the network connection drops before the cloud API can be updated. When the workstation comes back online, a naive cloud system resends the job, causing an accidental, costly **duplicate print**.
2. **Workstation Crash / Power Outage**: The counter PC reboots mid-shift. Without a local persistent journal, unprinted or half-printed jobs may be permanently lost.

## The Solution: Two-Phase Local Spool Journaling & Cloud Reconciliation

```mermaid
sequenceDiagram
    participant Cloud as Cloud API (FastAPI)
    participant Station as Desktop App (Tauri/Rust)
    participant Journal as Local SQLite Journal
    participant Spooler as Windows Spooler (winspool.drv)

    Note over Cloud, Station: 1. Job Claim Phase
    Station->>Cloud: POST /printers/claim (job_id, workstation_id)
    Cloud-->>Station: Job Details (Options, PDF download URL)

    Note over Station, Spooler: 2. Local Journal & Spool Phase
    Station->>Journal: Insert Record (job_id, status=PENDING_SPOOL, timestamp)
    Station->>Spooler: StartDocPrinter / WritePrinter (PDF stream)
    Spooler-->>Station: Returns Windows Spooler JobId (e.g. 1042)
    Station->>Journal: Update Record (job_id, spooler_job_id=1042, status=SPOOLED)

    Note over Station, Cloud: 3. Acknowledgement Phase
    alt Network Online
        Station->>Cloud: POST /printers/spool-status (status=PRINTING, spooler_job_id=1042)
        Cloud-->>Station: 200 OK
    else Network Offline
        Note over Station: Network drops! Status cannot reach Cloud immediately.
        Note over Station: Workstation reconnects later...
        Station->>Cloud: POST /reconciliation/sync (spooled_job_ids=[job_id])
        Cloud->>Cloud: Checks state: job is already spooled!
        Cloud-->>Station: Confirmed! Do NOT re-spool.
    end
```
