# Phase 0 executable proof runbook

Run in the repository on Windows x64. This is a trusted synthetic-file experiment,
not the production authenticated agent. Do not deploy the legacy application.
`--shop-id` is an independently supplied local isolation test seam, not login.

## Prerequisites and verification

Use Python 3.11+, Node 24.15+ (native TS stripping), and audited Rust Windows
toolchain. Optional local bootstrap uses fixed hashes and writes only ignored
`.tools`; it does not change machine PATH or install a system application:

```powershell
python scripts/phase0/bootstrap.py --toolchain --pdfium
python -m venv .venv-phase0
. ./.venv-phase0/Scripts/Activate.ps1
python -m pip install -r requirements-phase0.txt
. ./scripts/phase0/env.ps1
./scripts/phase0/verify.ps1 -Renderer
```

Read `OSS_LICENSE_AUDIT.md` first. Bootstrap artifacts are development/local
experiment only; Rust GNU runtime distribution/exception obligations and complete
PDFium build provenance remain release gates. Retain the captured notices. The
Python requirements pin versions; they are not an artifact-hash locked wheelhouse.

```powershell
cargo run --locked -p printer-proof -- list --backend windows
cargo run --locked -p printer-proof -- capabilities --printer 'Microsoft Print to PDF'
python scripts/phase0/make_demo_plan.py --output .phase0-local/sample-plan.json
cargo run --locked -p printer-proof -- validate --plan .phase0-local/sample-plan.json --shop-id 11111111-1111-4111-8111-111111111111 --pdf fixtures/printable/portrait-3.pdf
cargo run --locked -p printer-proof -- simulate --plan .phase0-local/sample-plan.json --shop-id 11111111-1111-4111-8111-111111111111 --scenario restart
./scripts/phase0/run-demo.ps1
```

The last command explicitly selects Microsoft Print to PDF and a fresh output file.
It submits to a real Windows virtual queue, not paper. A successful submission
still returns `physical_complete:null`. Missing queue or changed driver settings
fails closed. No fallback chooses a physical default queue.

## Supported proof subset and limitations

Schema/reference accounting supports 32 ordered files, arbitrary validated ranges,
parity, copies/collation, ordinary n-up and explicit duplex boundary blanks. Native
GDI proof deliberately accepts **one trusted PDF, one-up, plain media, explicit
portrait/landscape, named supported size, fit/actual, B&W/grayscale/color and supported
duplex**. Booklet/photo/bin operations reject; they remain product requirements.
PDF bytes max32MiB, plan max2MiB, native manifest max20,000 sides; per-page raster
max32million pixels at300DPI. PDF envelope validation alone is not parsing; PDFium
rechecks digest/page count/dimensions before native submission. No untrusted upload
sandbox, malware scan, network isolation or production signing is claimed.

Copies are software-owned, driver copies=1. Driver private bytes are preserved and
requested DEVMODE fields checked. Physical drivers use strict coercion rejection.
The exact Microsoft Print To PDF driver with explicit output has a separate virtual
profile: fixed color/collate/n-up fields are not treated as physical capabilities;
software controls grayscale/B&W and copy order, while effective paper/orientation/
copies and DC dimensions are verified. This profile is never applied to physical
drivers. Private skip-blank/finishing defaults still require physical certification.

Journal creates an exclusive shop/job intent and flushes before native submission.
Repeated/concurrent same identity is refused, even if the plan changes. Do not
delete intents to retry: resolve paper/job evidence with an operator. Journal is
local, with inherited Windows directory ACL; put it in a private operator directory.
Protect/back up the journal. Local disk loss, privileged tampering and directory
entry persistence after power loss are not a production exactly-once guarantee.
CLI supervises native worker timeout; ambiguous failures remain COMPLETION_UNKNOWN.

## Real hardware bench and evidence

```powershell
powershell -NoProfile -File scripts/phase0/inventory.ps1
python scripts/phase0/bench.py --output .phase0-local/my-bench.json
python scripts/phase0/bench.py --help
python scripts/phase0/generate_sbom.py
python scripts/phase0/collect_cargo_notices.py
python scripts/phase0/verify_evidence.py
```

Bench defaults every model/case UNVERIFIED. Only explicit `--execute` submits one
manifest-matching synthetic fixture through an operator-selected queue. It never
automatically jams, restarts Spooler, cancels other jobs or retries. Record actual
model/driver/firmware/accessories, plan/build hashes, emitted sheets and operator
observations for each case. Keep identifying bench evidence private. Two virtual
queues do not satisfy two real-model certification. Phase 1 remains blocked.
