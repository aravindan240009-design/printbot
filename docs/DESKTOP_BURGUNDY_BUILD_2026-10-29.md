# Burgundy desktop build — 29 October 2026

## IMPLEMENTED

Packaged Print Bot **1.0.0, Windows x64** from the final cream, gold and burgundy shared UI with product-relevant print-room images, refreshed brand assets, fonts and license notices. This subtask did not modify application source, authorization logic, dependencies or build configuration. Existing Atelier artifact copies were preserved and their SHA-256 values remain unchanged from the previous build report.

The existing Tauri 2.12.4 desktop uses React/Vite and a separate locked Rust crate. The repository-local GNU/LLVM toolchain is loaded by the build script; no system toolchain was installed. The existing Win32/SQLite journal implementation remains intact.

## TESTED

Commands executed from repository root in PowerShell:

```powershell
. ./scripts/phase0/env.ps1
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml --locked
./scripts/build-desktop.ps1
```

- Native tests: **8 passed, 0 failed**; test compile 53.56s, tests 0.16s. Coverage includes foreign-shop rejection, offline-printer rejection, unsafe paths, durable intents, duplicate rejection, persistence and monotonic unknown state.
- The first Burgundy release build and one final accessibility correction rebuild both exited **0**. The final rebuild embeds the light-theme gold text token correction from #a27a3e to #79551e for clearer contrast on cream.
- Vite 5.4.21 transformed 1938 modules in 7.87s. Output contains `print-room-dark-BVx4qeJL.webp` (56.29kB), `print-room-light-DpOtf2H9.webp` (58.16kB), Manrope/Playfair fonts, `index-Bb14-pIg.css` and `index-DFgssfbB.js`.
- Optimized native release compile completed in **1m28s**. NSIS `makensis` and WiX `candle`/`light` produced both installers successfully.
- Final `dist/licenses` contains Lucide ISC, Manrope OFL, Motion MIT, Playfair OFL, React MIT and Three MIT notices before native embedding.
- PowerShell `Get-AuthenticodeSignature` reports **NotSigned** for both installers, expected for local test artifacts.
- Copied installer SHA-256 hashes match their respective original bundle outputs.

| Handoff artifact | Bytes | Build timestamp (Asia/Kolkata) | SHA-256 |
| --- | ---: | --- | --- |
| `artifacts/PrintBot-Burgundy-1.0.0-x64-setup.exe` | 5,216,504 | 2026-10-29 19:02:16 | `B60A50D2AE20727A735AE1CAE64AC1DBE841ED832340F0593830FABBD1531D47` |
| `artifacts/PrintBot-Burgundy-1.0.0-x64.msi` | 7,655,424 | 2026-10-29 19:02:21 | `150D3AAD5584241153366381A9C01A7E8858EE74E4A1DB3593DB2CDF086EF19E` |

Original bundle outputs remain at:

- `apps/desktop/src-tauri/target/release/bundle/nsis/Print Bot_1.0.0_x64-setup.exe`
- `apps/desktop/src-tauri/target/release/bundle/msi/Print Bot_1.0.0_x64_en-US.msi`

Hash/signature verification:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath artifacts/PrintBot-Burgundy-1.0.0-x64-setup.exe
Get-FileHash -Algorithm SHA256 -LiteralPath artifacts/PrintBot-Burgundy-1.0.0-x64.msi
Get-AuthenticodeSignature -LiteralPath artifacts/PrintBot-Burgundy-1.0.0-x64-setup.exe
Get-AuthenticodeSignature -LiteralPath artifacts/PrintBot-Burgundy-1.0.0-x64.msi
```

## BLOCKED/UNVERIFIED

No installer was executed. Native WebView rendering, clean-machine installation/uninstall, trusted distribution and production signing remain unverified. Main-task browser QA is separate from native runtime testing. Real printer capabilities, physical printing/paper delivery, authenticated device pairing and subscription enforcement are not established by this UI packaging run. The workstation continues to start unpaired. Existing CSP and fixed printer capability fields still require production review.

The existing OSS audit/SBOM release gates remain open, including the existing GSAP custom-license commercial-distribution review. A successful build does not clear license review or establish production readiness.

## Security/privacy

No production secrets, real customer documents or certificates were used or added to Git. No real print job or automatic reprint was initiated. Tenant authorization and native IPC were untouched. Both copied installers are unsigned local testing artifacts.

## Exact changed files and architecture decisions

This subtask created only:

- `docs/DESKTOP_BURGUNDY_BUILD_2026-10-29.md`
- `artifacts/PrintBot-Burgundy-1.0.0-x64-setup.exe`
- `artifacts/PrintBot-Burgundy-1.0.0-x64.msi`

Generated ignored Vite/Cargo build outputs were refreshed. Existing packaging architecture and version were retained; no new architecture decision was needed for this verification-only subtask.

## Handoff

Burgundy Windows x64 NSIS EXE and MSI built successfully, with final product imagery and license assets embedded. Native tests passed 8/8. Artifacts and exact hashes are above; Atelier copies remain unchanged. Before any production distribution, complete signing, license audit, authenticated device pairing, clean-Windows setup and physical-printer validation gates.

