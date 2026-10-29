# Desktop build verification — 29 October 2026

## Existing state

The desktop app is React/Vite inside Tauri 2.12.4. The native crate is excluded from the root Cargo workspace and has its own Cargo.lock. Existing source includes Win32 discovery and a SQLite spool-intent journal; the production authenticated device pairing and physical renderer/spool path are not established by this UI task. Existing uncommitted frontend changes were preserved.

The Tauri configuration packages the same Print Bot 1.0.0 workstation as NSIS `.exe` and MSI. No signing certificate is configured. Old Xerox PrintFlow installers dated 24 October were present before this run and are not evidence of the updated UI.

## TESTED

Commands from the repository root (PowerShell):

```powershell
. ./scripts/phase0/env.ps1
rustc -V
cargo -V
pnpm --filter @xerox/desktop exec tauri info
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml --locked
```

- Bundled rustc 1.99.1 and cargo 1.99.1 detected after loading the environment helper. The default shell PATH alone did not expose Cargo.
- Node 24.15.0, pnpm 9.12.0, WebView2 156.0.4314.50 detected.
- Tauri info reports no MSVC/SDK installation; this repository uses its bundled GNU/LLVM toolchain instead. No new system toolchain was installed.
- Native tests passed: **8 passed, 0 failed**. Build finished in 2m58s; tests in 0.08s. Covered foreign-shop identity rejection, offline printer rejection, unsafe paths, durable intent, duplicate intents, reopening persistence, and monotonic unknown state.

## Installer build

IMPLEMENTED: both unsigned Windows installer formats built successfully from the final shared/frontend sources using:

```powershell
./scripts/build-desktop.ps1
```

Three builds completed successfully; the last rebuild includes the public/licenses notices in the embedded frontend. The final build ran after the UI freeze: Vite transformed 1938 modules in 3.47s; optimized Rust compile completed in 31.41s; NSIS makensis and WiX candle/light generated both packages. The script loads the same bundled toolchain then runs `pnpm --filter @xerox/desktop tauri:build`. Current bundle targets are NSIS and MSI. Artifact output is under `apps/desktop/src-tauri/target/release/bundle/`.

## BLOCKED/UNVERIFIED

- Authenticode signing, trusted distribution, update signing, clean-machine installation and uninstall remain unverified.
- Real physical printer compatibility and paper delivery remain unverified. Native journal tests do not demonstrate physical printing.
- Workstation state starts with `bound_shop_id: None`; this run does not establish server-authorized pairing or subscription entitlement enforcement.
- Printer capabilities in current discovery source include fixed fields; these are not certified hardware capabilities.
- Existing CSP allows any HTTPS connection origin. Production origin restrictions require a separate security review.
- Existing OSS license audit/SBOM release gates remain applicable; compilation does not clear legal review.

## Security/privacy checklist

No real documents, credentials, certificates or production customer data were used. No auto-reprint was triggered. No tenant policy or native IPC was changed. Installer files are local unsigned test artifacts, not production-approved releases.

## Changed files and decisions

This build report and local artifact copies are authored by the desktop verification subtask. No dependency, native source, Tauri configuration or package changes were introduced. Existing packaging architecture is retained; no new ADR is needed for verification alone.

## Handoff

Native tests passed 8/8 with the repository GNU/LLVM toolchain. Final frontend packaging passed; both installers and matching original bundle outputs are recorded below. Validate installation on a clean Windows machine. Keep production signing, authenticated pairing, hardware printing and license audit gates explicitly open.


## Final installer artifacts

Product/version: **Print Bot 1.0.0, Windows x64**. Files were copied into `artifacts/` for handoff; original bundle outputs remain intact. SHA-256 hashes of the copied files match their corresponding original bundle outputs. PowerShell `Get-AuthenticodeSignature` reports **NotSigned** for both.

| Artifact | Bytes | Local build timestamp (Asia/Kolkata) | SHA-256 |
| --- | ---: | --- | --- |
| `artifacts/PrintBot-Atelier-1.0.0-x64-setup.exe` | 5,402,912 | 2026-10-29 18:28:33 | `AF36C3A3FDAC94F6577379B0554ECFAD73D40CCDA66D3B25FC87620169002A70` |
| `artifacts/PrintBot-Atelier-1.0.0-x64.msi` | 7,835,648 | 2026-10-29 18:28:37 | `54567BFAF0C78CE00E9F9A2E66C8071D28FDEAFEFA759791EB64E4E69D4111A1` |

Original outputs:

- `apps/desktop/src-tauri/target/release/bundle/nsis/Print Bot_1.0.0_x64-setup.exe`
- `apps/desktop/src-tauri/target/release/bundle/msi/Print Bot_1.0.0_x64_en-US.msi`

Verification commands:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath artifacts/PrintBot-Atelier-1.0.0-x64-setup.exe
Get-FileHash -Algorithm SHA256 -LiteralPath artifacts/PrintBot-Atelier-1.0.0-x64.msi
Get-AuthenticodeSignature -LiteralPath artifacts/PrintBot-Atelier-1.0.0-x64-setup.exe
Get-AuthenticodeSignature -LiteralPath artifacts/PrintBot-Atelier-1.0.0-x64.msi
```

No installer was executed during this verification. Browser visual QA is recorded by the main UI task; native WebView launch, clean-machine setup/uninstall and real hardware printing remain unverified.


The final `apps/desktop/dist/licenses` contains Lucide-ISC.txt, Manrope-OFL.txt, Motion-MIT.txt, Playfair-OFL.txt, React-MIT.txt and Three-MIT.txt. These assets were present before the final Tauri native compile embedded `frontendDist`. The existing GSAP custom-license review remains an explicit commercial-release gate.
