---
name: windows-desktop-native
description: Directives for Tauri 2 Windows desktop applications, Rust Win32 and winspool.drv integrations, secure IPC, and offline-resilient hardware spooling.
---

# Windows Desktop Native & Tauri 2 Engineering Skill

## Architectural Mandates
1. **Separation of Concerns**:
   - Web frontend (React/TypeScript) is an unprivileged UI view.
   - All hardware, filesystem, and printer access MUST occur via strongly-typed Rust Tauri commands (`#[tauri::command]`).
2. **Win32 & Print Spooler Integration**:
   - Direct interface with Windows `winspool.drv` using `windows` crate or Win32 APIs:
     - `EnumPrinters` (query USB/network hardware status).
     - `StartDocPrinter` / `WritePrinter` (direct stream spooling).
     - `GetJob` / `SetJob` (monitor physical print progress).
3. **Offline Resilience & Two-Phase Spool Ledger**:
   - Maintain a local SQLite `spool_journal` on the workstation.
   - Record job ID and timestamp locally BEFORE submitting to the physical spooler.
   - On reconnection, execute `reconcile_offline_jobs` with cloud API to guarantee zero duplicate physical prints.
4. **Security & Least Privilege**:
   - Disable unused Tauri plugin capabilities.
   - Restrict local file access to designated application temporary directories (`%LOCALAPPDATA%/xerox/spool`).
   - Sign Windows installers (`.msi` and `.exe`) with authenticode certificates in release pipelines.
