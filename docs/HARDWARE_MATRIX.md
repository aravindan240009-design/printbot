# Phase 0 hardware evidence and proposed certification matrix

Observed 2026-10-22, local Windows PowerShell, read-only inspection.
Windows 11 Home 10.0.26200, x64; Spooler running, automatic startup.

| Installed queue | Driver | Port | Finding |
| --- | --- | --- | --- |
| Microsoft Print to PDF | Microsoft Print To PDF | PORTPROMPT: | Virtual, no print submitted |
| OneNote (Desktop) | Send to Microsoft OneNote 16 Driver | nul: | Virtual, no print submitted |

Get-CimInstance Win32_Printer showed Local=true, Network=false for both queues.
Get-PnpDevice -PresentOnly filtered to Printer/PrintQueue/Image showed only root
queue and the two virtual queues. No physical device found in this inventory.
No configured USB/TCP/IP printer port was reported. Unconfigured LAN hardware
remains unknown; no network discovery scan or physical inspection occurred.

Installed driver inventory: Universal Print Class Driver; Send to Microsoft OneNote
16 Driver; Microsoft Virtual Print Class Driver; Microsoft Print To PDF; Microsoft
IPP Class Driver (all MajorVersion 4); Microsoft enhanced Point and Print
compatibility driver (MajorVersion 3, two entries). Driver presence is not hardware.

## Five distinct proposed models, plus driver variation

| Target model | Bench purpose | Proposed connection/driver | Actual result |
| --- | --- | --- | --- |
| Brother HL-L2321D | Mono laser | USB, vendor driver | ALL CASES UNVERIFIED |
| Epson EcoTank L3250 | Color inkjet and scan/copy boundary | USB/Wi-Fi, vendor driver | ALL CASES UNVERIFIED |
| HP LaserJet Pro M404dn | Duplex edge semantics | USB/Ethernet, vendor driver | ALL CASES UNVERIFIED |
| Canon imageRUNNER 2425 | Multifunction copier, trays/media | Ethernet, vendor driver | ALL CASES UNVERIFIED |
| HP Color LaserJet Pro MFP M479fdw | Fifth model, color/driver variation | Vendor versus inbox IPP if supported | ALL CASES UNVERIFIED |

Targets are candidates, not purchase advice or certified support. Fifth model driver
compatibility and all installed accessories/firmware must be verified before testing.
Record exact model, serial (private evidence), firmware, driver version/architecture,
connection, Windows build and capability snapshot for each run.

Manufacturer references for initial candidates:
https://www.brother.in/en/support/hl-l2321d
https://www.epson.co.in/For-Home/Printers/EcoTank-Printers/Epson-EcoTank-L3250-A4-Wi-Fi-All-in-One-Ink-Tank-Printer/p/C11CJ67508
https://support.hp.com/ie-en/document/c06372935
https://in.canon/en/business/imagerunner-2425/main/product

## Cases required separately for EVERY row and driver variant

All statuses below are UNVERIFIED for every target. Executable record generation and
an explicit opt-in, one-submission CLI adapter now exist in `scripts/phase0/bench.py`.
The adapter never marks a physical case passed from process exit or spooler events.

| Case | Procedure and evidence required |
| --- | --- |
| Discovery | Compare OS inventory to CLI EnumPrinters; exact queue/driver/port |
| Trays and paper | Enumerate names, IDs, dimensions; print alignment target per supported combination |
| Copies/collation | Three numbered pages, two copies, collated and uncollated; count/order sheets |
| B&W/grayscale/color | Print RGB/ramp fixture; unsupported color rejected, no silent substitution |
| Duplex long/short | Three arrowed pages, both orientations, each edge; check backs and padding |
| Orientation | Portrait/landscape/auto, printable margins and rotation |
| Zero print | Invalid plan/empty selection must create no spool job or sheets |
| No paper | Safe empty tray, submit once, observe unknown/waiting; no automatic duplicate |
| Offline | Disconnect safe idle device; document timeout and reconciliation |
| Jam | Manufacturer-approved supervised fault only; never intentionally damage mechanism |
| Spooler restart | Dedicated idle bench PC only; interrupt at controlled submission stage, recover unknown safely |
| Driver cancellation | Cancel pending/in-progress job, record emitted sheets and best-effort outcome |

For each case log command, plan/fixture/build hashes, capability/DEVMODE results,
actual Windows job ID, timestamps, queue observations, photographed synthetic sheets,
operator result and reason for N/A. Capability rejection may pass a negative case;
it does not prove the positive physical feature. Never create a jam automatically.
Do not restart Spooler or cancel other users' jobs from a general inventory script.

## Read-only reproduction commands (available now)

```powershell
Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber,OSArchitecture
Get-Printer | Format-List Name,DriverName,PortName,PrinterStatus,Type
Get-PrinterDriver | Format-List Name,Manufacturer,MajorVersion
Get-PrinterPort | Format-List Name,Description,PrinterHostAddress
Get-CimInstance Win32_Printer | Select-Object Name,DriverName,PortName,Local,Network,WorkOffline
Get-PnpDevice -PresentOnly | Where-Object { $_.Class -in @('Printer','PrintQueue','Image') } | Select-Object Class,FriendlyName,Status
Get-Service Spooler
```

Physical gate: BLOCKED, zero actual printer models tested. Virtual queues do not count.

Actual Windows virtual adapter evidence: Microsoft Print To PDF job2 generated a
three-page B&W rasterized output; job3 generated six color pages for two collated
copies. Independent output parsing and copy pixel ordering passed. Both reported
physical_complete=null. Duplicate same identity was refused by intent journal.
This does not change any real model/case from UNVERIFIED. See
PHASE0_IMPLEMENTATION_RESULTS.md and PHASE0_RUNBOOK.md.

## Fresh executable evidence (2026-10-22)

`docs/licenses/windows-inventory.json` records read-only inventory at 14:01:22 UTC:
Windows 11 Home 26200 x64, two virtual queues, seven driver entries, eighteen local
monitor ports without host addresses, three PrintQueue PnP entries, Spooler running,
no collection errors. No physical printer found; no network discovery performed.
Queue/port names, host/user names, IP addresses, serials, PnP instance IDs and job
content are deliberately absent. Queue IDs are local to each snapshot.

`fixtures/printable/manifest.json`: portrait/landscape three-page arrow targets,
mixed A4/landscape/A3/A5/Letter five pages, odd duplex five pages, Legal single
page, RGB patches and grayscale ramp on every valid page, plus three malformed
negative files. Page sizes use integer point approximations recorded in manifest.
No customer content or font binaries. Regeneration is byte-for-byte deterministic.

```powershell
python scripts/phase0/generate_corpus.py
powershell -NoProfile -File scripts/phase0/inventory.ps1
python scripts/phase0/bench.py --output .local-evidence/bench-new.json
python scripts/phase0/verify_evidence.py
```

The checked-in `docs/licenses/bench-unverified.json` has five distinct models and
six model/driver rows (vendor versus IPP variant for M479fdw), each with fifteen
UNVERIFIED cases. It is a template, not test evidence. Operator records exact model,
firmware, driver version, connection, Windows build, capability snapshot, command,
plan/build/corpus hashes, job ID, times, sides/sheets and synthetic sheet photographs.

Physical submission requires explicit `--execute` plus every parameter in
`python scripts/phase0/bench.py --help`. Example only; **not run here**:

```powershell
python scripts/phase0/bench.py --output .local-evidence/one-attempt.json --execute --cli target/debug/printer-proof.exe --printer 'OWN DEDICATED BENCH QUEUE' --pdf fixtures/printable/portrait-3.pdf --plan .local-evidence/validated-plan.json --shop-id SHOP_UUID --pdfium .tools/pdfium/pypdfium2_raw/pdfium.dll --pdfium-sha256 69f1e860f6742fbaafcc4db80e785eec9a4ee0da36ea6d1dc0867ea0f18baea6 --journal .local-evidence/journal --operator 'bench-operator-id'
```

Replace CLI/plan/shop identifiers with actual validated proof paths. No batch
printing, restart, jam, driver cancellation or automatic retry occurs in harness.
Fault cases require supervised manufacturer-safe handling on a dedicated bench.
The pre-submission record persists before launch; failures/timeouts remain unknown
and require journal/spooler/paper reconciliation before any reprint decision.
