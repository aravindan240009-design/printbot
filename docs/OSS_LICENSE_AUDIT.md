# Phase 0 OSS license audit — preliminary, release BLOCKED

Research date 2026-10-22. This is an evidence/verification register, not legal advice
or completed release clearance. Phase 0 now has an SPDX 2.3 source/environment
inventory in `docs/SBOM.spdx.json`, official registry metadata and exact PDFium local
experiment hashes/notices. Scope is explicitly bounded; legacy pnpm dependencies,
installer payloads, complete DLL build transitives and production container images
remain unresolved. This is not shipment authorization.

## Verified upstream sources and implications

| Component | Source evidence | Decision / remaining work |
| --- | --- | --- |
| PDFium | https://pdfium.googlesource.com/pdfium/+/refs/heads/main/LICENSE (observed license blob 161ca160d6fa51df6e3e594aeb2b1097b55e3866) | Source includes BSD-style and Apache terms. Retain applicable licenses/notices. Exact DLL source revision, transitive components, flags, hash, ABI and provenance UNVERIFIED; no DLL approved |
| LibreOffice | https://www.libreoffice.org/licenses/ | MPL 2.0 with version-dependent other components; inspect actual installation LICENSE. Distribution/source availability and modifications obligations require build-specific review; not a blanket permissive binary |
| Gotenberg | https://gotenberg.dev/docs/getting-started/introduction | Wrapper includes Chromium/LibreOffice/fonts and other helpers; wrapper license alone cannot clear image. Pin digest, enumerate OS and converter binaries, audit routes/helpers; image NOT APPROVED |
| PyMuPDF / Ghostscript | https://artifex.com/licensing and https://www.ghostscript.com/licensing/ | AGPL/commercial licensing requires separate review and permission under shared contract. Exclude from default path, retain feature via audited pypdf/PDFium/LibreOffice alternatives |
| Docker Desktop | https://docs.docker.com/subscription-billing/desktop-license/ | Subscription terms and eligibility apply; do not require. Prefer audited Podman/Linux engine setup |
| Redis | https://redis.io/legal/licenses/ | License varies by version; floating `redis:7-alpine` cannot be cleared. Resolve exact artifact or replace with audited Valkey |
| Valkey | https://github.com/valkey-io/valkey/blob/8.0.0/COPYING | Versioned source candidate; retain BSD obligations and audit bundled dependencies; this candidate is not a current-security recommendation |

Do not infer that invoking a copyleft binary as a subprocess or running it in a
container eliminates its license obligations. A vanilla converter image may ship
GPL/AGPL tools even when the wrapper is permissive. A custom image may preserve
office/PDF features with selected audited helpers, but must be tested and inventoried.
No features are silently removed by this audit; affected implementation paths remain blocked.

## Existing source declarations: unresolved exact artifacts

Root TypeScript ^5.4.5. Desktop: React/DOM ^18.3.1, lucide-react ^0.378.0;
dev CLI @tauri-apps/cli ^2.0.0-rc, @types/react ^18.3.3, @types/react-dom ^18.3.0,
@vitejs/plugin-react ^4.2.1, autoprefixer ^10.4.19, postcss ^8.4.38,
tailwindcss ^3.4.3, TypeScript ^5.4.5, Vite ^5.2.11.
Web adds Next ^14.2.3 and @types/node ^20.12.7. Internal workspace packages reuse
React, TypeScript and lucide; internal source license itself is not declared.
Rust desktop: tauri-build/tauri 2.0.0-rc constraints, serde 1.0, serde_json 1.0,
tokio 1 and windows 0.52. No Cargo.lock inspected. PostgreSQL image 16-alpine
and Redis 7-alpine are floating. Python has imports but no locked project manifest.
Every exact direct/transitive artifact in these declarations remains UNVERIFIED.

## Proposed dependency audit queue (not added or approved)

Rust: windows, serde/serde_json, SHA-256 implementation, PDFium bindings or narrow
FFI loader, journal support. Python: JSON Schema validation, pypdf, pypdfium2,
Pillow; TypeScript: schema validator and fixtures. Future stack: FastAPI/Pydantic,
React/Vite, Tauri 2, PostgreSQL, Valkey, Celery, SeaweedFS, Caddy, PDF.js, Konva,
pikepdf/qpdf. Dev: uv/pnpm/Cargo, pytest/Vitest/Playwright, OpenAPI generator,
Gitleaks/Semgrep/ZAP, local mail sandbox, Podman and underlying VM/OS packages.
For EACH choose exact version, official tagged license, all bundled components,
notice/source obligations, security status and commercial redistribution conditions
before install. Names alone are insufficient to assign approved SPDX expressions.
ClamAV and other scanner binaries require their own license/daemon/distribution
decision. Anti-malware policy is currently unimplemented, not a passed scan.

## Required SPDX and release procedure

Resolve pnpm/uv/Cargo locks and container digests; inventory every runtime/dev/build
artifact with SPDXID, version, supplier, download/source URL, SHA-256, concluded
and declared SPDX license expressions (NOASSERTION when unresolved), copyright,
external purl and DEPENDS_ON/CONTAINS relationships. Validate SPDX 2.3 JSON with
a schema validator, include document namespace/creation metadata and package
verification fields. Include DLLs, OS packages, fonts, codecs, certificates and
installer payload, not just language manifests. Generate notice bundle/source
offers or source access instructions where required and review with the exact build.
Unknown/nonpermissive artifacts block shipment pending explicit review/permission.

Patent/export: Apache patent grants/termination differ from BSD/MIT; licenses do
not establish freedom from all patents. Audit codec/font rights and cryptographic
export classification for actual distributed artifact and destination. No blanket
patent/export/legal compliance conclusion is asserted.

Self-hostable software still incurs compute, storage, bandwidth, backups, patching,
support, domain and operations costs. Windows, live settlement/provider fees and
production signing may have external costs. Paid R2/AWS/Supabase managed/Sentry/
Twilio or proprietary AI services are not local development requirements.

## Executable evidence and exact local experiment

`scripts/phase0/generate_sbom.py` inventories every available non-tool Cargo.lock,
matches each registry SHA256 to crates.io official metadata, emits direct/transitive
DEPENDS_ON relationships, and inventories actual installed Python package versions
including active dependencies. Python source-archive hashes identify the official
source archives, **not** installed site-packages files. Optional pypdf/Pillow are
present in this existing environment; corpus generation itself needs only stdlib.
Registry JSON evidence lives in `docs/licenses/registry` and is reused offline;
`--refresh` explicitly refetches. Do not treat declared licenses as legal conclusions.
All `licenseConcluded` fields remain NOASSERTION.

`scripts/phase0/collect_cargo_notices.py` verifies actual source-archive hashes for
all 23 registry packages in Cargo.lock, including target-inactive libc, and preserves
their full bundled license/notice files under `docs/licenses/cargo-notices` with a
hash manifest. Target-inactive missing cache archives are fetched from pinned
static.crates.io source URLs solely for in-memory notice extraction, never code
execution. The inventory presently contains 41 total packages, including two local
proof crates. Source declarations are separately recorded for legacy Rust manifests.
MIT/Apache dual licenses predominate; unicode-ident additionally preserves Unicode
data terms and every package's actual notices must ship with relevant distribution.

`docs/licenses/unresolved-source-declarations.json` records every legacy TS manifest
dependency/devDependency and unresolved constraint separately. No version range is
presented as a resolved package version. Legacy desktop Cargo dependencies and
floating container images still require real locks/digests. The SBOM explicitly
does not claim a complete legacy application, toolchain, OS or release payload.

The official SPDX 2.3 schema was fetched from
https://raw.githubusercontent.com/spdx/spdx-spec/v2.3/schemas/spdx-schema.json and
preserved in `docs/licenses/spdx-2.3.schema.json`. Reproduce generation/validation:

```powershell
python scripts/phase0/generate_sbom.py
python scripts/phase0/verify_evidence.py
```

The existing Python environment versions include jsonschema 4.26.0, pypdf 6.19.0
and Pillow 11.1.0, from official versioned PyPI metadata. jsonschema declares MIT;
pypdf BSD-3-Clause; Pillow historically HPND with bundled codec libraries requiring
their own audit for binary redistribution. Pillow's source license alone does not
clear a Windows wheel. jsonschema transitive versions are inventoried by installed
metadata, with source archive hashes and license declarations from official PyPI.

The final Python test requirements inventory additionally includes pytest 9.1.1
and all environment-active dependencies. Official exact-version PyPI metadata,
verified SHA256 source archives and full source notices for all fourteen packages
are preserved under `docs/licenses/registry` and `docs/licenses/python-notices`.
Thirty preserved Python notice files passed hash verification. Source archives were
only read in memory for notice extraction; no package installation or code execution
was performed by this audit. Installed files and wheel payloads remain unverified.

| Python source package | Exact environment version | Source-declared license |
| --- | --- | --- |
| jsonschema | 4.26.0 | MIT |
| pytest | 9.1.1 | MIT |
| pypdf | 6.19.0 | BSD-3-Clause |
| packaging | 26.2 | Apache-2.0 OR BSD-2-Clause |
| attrs | 26.1.0 | MIT |
| jsonschema-specifications | 2025.9.1 | MIT |
| referencing | 0.37.0 | MIT |
| rpds-py | 2026.5.1 | MIT |
| colorama | 0.4.6 | BSD-3-Clause (actual source LICENSE.txt inspected) |
| iniconfig | 2.3.0 | MIT |
| pluggy | 1.6.0 | MIT (actual source LICENSE inspected) |
| Pygments | 2.20.0 | BSD-2-Clause |
| typing-extensions | 4.15.0 | PSF-2.0 |
| Pillow (optional existing environment) | 11.1.0 | HPND; bundled codec audit remains separate |

Preserve full copyright/license/disclaimer texts and avoid endorsement claims;
Apache notice/change and PSF attribution/change requirements must be checked for
actual modifications/distribution. These permissive source declarations support
the local pinned test tool use; `licenseConcluded` stays NOASSERTION pending exact
release payload review. Optional Pillow is not a requirement of this proof corpus.

### PDFium binary review for bounded synthetic local experiment

Artifact: official PyPI `pypdfium2-5.14.0-py3-none-win_amd64.whl`, 3,947,280 bytes,
SHA256 `149fd5c6397b8df8bf7911a93506eff0be874f877afe7ac936cf5d37d21a6a06`.
Source: https://pypi.org/project/pypdfium2/5.14.0/#files . Extracted PDFium DLL:
7,381,504 bytes, SHA256
`69f1e860f6742fbaafcc4db80e785eec9a4ee0da36ea6d1dc0867ea0f18baea6`.
Vendor `version.json`: PDFium 156.0.8076.0, origin pdfium-binaries, flags empty,
source commit hash null. Build reproducibility/source commit completeness remains
UNVERIFIED. No installer redistribution authorized by this experiment.

The complete wheel notice bundle is preserved in `docs/licenses/pdfium-5.14.0`,
with evidence hashes. Included BUILD_LICENSES identify: PDFium BSD-style;
pdfium-binaries MIT; abseil Apache-2.0; agg23 permission/copyright notice; fast_float
MIT; FreeType FTL (acknowledgment/documentation requirements); ICU Unicode License
v3; lcms MIT; libjpeg-turbo IJG/BSD-style and SIMD zlib terms; OpenJPEG BSD-2-Clause
with patent caveat; libpng license v2; llvm-libc Apache-2.0 WITH LLVM-exception;
simdutf MIT; zlib. No GPL/AGPL notice appears in this particular bundled notice set.
That observation does not prove absence from every source/build dependency.
The wrapper metadata lists BSD-3-Clause, Apache-2.0 and dependency licenses;
documentation includes CC-BY-4.0. Preserve attribution and identify any changes
when redistributing copied documentation. Preserve full component notices and
copyright/disclaimer text, comply with FreeType/IJG acknowledgments, retain
Apache notices and modified-file notices, and avoid endorsement claims.

This review supports a bounded local synthetic rendering experiment with pinned
DLL hash and notices retained. Production clearance still needs upstream source
revision/build provenance, exact bundled versions, vulnerabilities, installer notice
placement, font/codec rights, update handling and review of the exact payload.

### Future components: separate from distributed inventory

`docs/licenses/future-candidates/register.json` and adjacent license texts record
official tagged-source evidence for FastAPI 0.115.0, Pydantic 2.9.2, React 18.3.1,
Vite 5.2.11, Tauri 2.0.0, Valkey 8.0.0, Celery 5.4.0, SeaweedFS 3.77, Caddy 2.8.4,
PDF.js 4.4.168, Konva 9.3.14, pikepdf 9.2.1, qpdf 11.9.1, Gotenberg 8.13.0 and
Podman 5.2.2. Versions are research candidates, not latest/security recommendations,
installed choices or distribution approvals. Every source URL and SHA256 is pinned
in that register. Runtime/build/bundled dependency audits remain required.

MIT/BSD require preservation of notices/disclaimers; Apache adds patent terms,
change notices and NOTICE handling. MPL pikepdf requires file-level source and
notice review if distributed/modified. LibreOffice's actual chosen build must be
audited separately for MPL/LGPL/other components. No blanket LGPL/GPL permission.
Gotenberg's MIT wrapper does **not** clear its image: official docs describe QPDF,
pdfcpu, PDFtk and ExifTool helper routes; helpers, fonts, Chromium, LibreOffice and
OS packages may introduce GPL/AGPL or other obligations. Until a digest-specific
complete image audit and required permission, do not deploy/distribute that image.
Official helper evidence: https://gotenberg.dev/docs/convert-with-libreoffice/convert-to-pdf .

Toolchain licensing remains separate from runtime: parent preflight in
`docs/licenses/PHASE0_DEPENDENCY_PREFLIGHT.md` pins portable Rust and experiment
download provenance. Toolchain/MinGW transitive licensing must be included if those
tools are redistributed; they are not installer payloads in Phase 0.

### Actual GNU toolchain caveat and evaluated LLVM alternative

The pinned Rust 1.99.1 GNU archive contains third-party runtimes and tools beyond
Rust's MIT/Apache source. Actual `share/doc/README.txt` states GNU binaries are
GPLv3 or GPLv3 with GCC Runtime Library Exception; `COPYING3` and
`COPYING.RUNTIME` (exception 3.1) are bundled. Self-contained CRT includes
`crt2.o`, `libmingw32.a`, `libmingwex.a` and `libgcc*.a`; detailed source licensing
requires actual linked-subset review. Do **not** call the entire Rust GNU payload
MIT/Apache. Local synthetic experiments do not authorize blanket GPL/runtime or
toolchain redistribution. Runtime exception eligibility, source availability and
full binary notice obligations require review before shipping the generated EXE.

Actual notices, provenance and object/library hashes are in
`docs/licenses/rust-1.99.1-gnu`. Full Rust-distributed `COPYRIGHT.html` and
`COPYRIGHT-library.html` are preserved as deterministic gzip files (decompress for
the detailed toolchain/standard-library component register); uncompressed hashes
are recorded. Rust's own copyright explicitly distinguishes these third parties.
This metadata is evidence, not an assertion that every component is linked.

A separately evaluated build-tool artifact is
`llvm-mingw-20261020-msvcrt-x86_64.zip`, 172,961,237 bytes, SHA256
`52a3e3f584a74c3cde8ceb0c6960549683178e03b36818cb02b7ed109a68ff67`.
Official pinned release API evidence: `docs/licenses/llvm-mingw-release.json`;
source https://github.com/mstorsjo/llvm-mingw/releases/tag/20261020 .
The UCRT asset listed by that API was research only; the actual downloaded
candidate is MSVCRT. Only its LLVM `dlltool.exe` and required DLL dependencies are
used by the selected local build to generate import libraries for windows-sys
raw-dylib linkage. Rust's bundled rust-lld and CRT remain the linker/runtime path;
LLVM Clang, make and gendef are not used. The full archive remains an ignored local
download and is not distributed. Actual archive notices and x64 CRT object/library hashes are
preserved in `docs/licenses/llvm-mingw-20261020-msvcrt`.

Read-only PE import inspection of the actual LLVM dlltool finds a four-file local
subset: dlltool.exe -> libLLVM-23.dll/libc++.dll -> libunwind.dll, plus Windows system
DLLs (including MSVCRT). Hashes, sizes and recursive import lists are recorded in
`dlltool-dependency-hashes.json` in that evidence directory. llvm-dlltool.exe and
dlltool.exe are the same LLVM multicall binary by SHA256. Static import inspection
does not prove absence of delayed/dynamic loading. This tool subset is development
only, does not replace Rust CRT, and is not included in a product installer.

LLVM's actual license includes Apache-2.0 WITH LLVM-exception and legacy NCSA.
The wrapper scripts are ISC, which does not clear the complete archive. It also
contains GPLv3 make/gendef utilities: they were not executed and must not enter the
bootstrap execution path or installer. The actual MinGW runtime aggregate notice
contains ZPL-2.1/ISC/BSD/Sun/MIT-style texts, Wine LGPL-2.1 header/IDL references,
and a historical Cephes math permission FIXME. Therefore no blanket permissive
claim or redistribution approval is made. Pinned upstream crtexe.c has a Public
Domain notice, but that alone cannot clear all linked libraries. A linked-symbol
map and exact per-object source/license audit is required to separate unused
components and resolve unknown/nonpermissive cases before release.

No GPL make/gendef/GCC executable was invoked for this licensing investigation.
The selected local build path uses LLVM dlltool plus the Rust-distributed linker/runtime as recorded
by the parent execution record; exact actual test results belong there.

BLOCKED/UNVERIFIED release gates: no complete pnpm lock/SBOM; no exact container
OS/fonts/converter SBOM; no full PDFium source-build transitive inventory; source
project licensing; all required notice placement/source offers; production signing,
provider merchant/settlement approval, patent/export and India privacy counsel review.
