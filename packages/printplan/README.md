# PrintPlan v1 executable contract

`schema.v1.json` is Draft 2020-12, strict at every object level. Python uses
jsonschema 4.26.0; TypeScript and Rust implement exactly its used structural
keywords and are checked against the same corpus. No application API is changed.
All fields are required; optional operations use explicit null/false values.

`validate(plan, expected_shop)` returns the same normalized JSON in all adapters.
The caller supplies independently authenticated tenant context. This function
does not authenticate the context, verify document bytes or establish payment.
Source SHA-256 values must also be verified against actual files by the consumer.

Limits: 32 files, 10,000 pages/file, 512 range characters, 500 copies,
100,000 logical page impressions and 100,000 manifest sides. Integers are bounded
before allocation. Ranges use ASCII positive integers, union/deduplication,
ascending order and original-page odd/even parity; empty selections fail.

Named paper sizes use unrotated dimensions in micrometres: A3 297000×420000,
A4 210000×297000, A5 148000×210000, Letter 215900×279400 and Legal
215900×355600. Orientation is independent. Explicit landscape swaps the page axes
for margins; portrait/auto use canonical axes. The eventual renderer must resolve
auto orientation before driver acceptance. Margins must leave positive area.
Capability values must explicitly include each requested option; this is a
snapshot compatibility check, not certification of driver combinations.

The schema represents booklet/photo/bin requests, but executable v1 rejects
booklet=true, photo!=null and bin_id!=null. The photo object uses a named layout,
crop x/y/width/height in 0..10000 normalized units, rotation in 0/90/180/270
degrees, and integer output width/height micrometres. Future renderers must validate
transforms and measure output; ordinary n-up never substitutes for booklet.

Accounting uses zero-based `file_index` and `copy_index`, one-based page numbers.
Every file/copy starts a new physical sheet; odd duplex side counts receive an
explicit blank back. Collated order is copy → file → side. Uncollated order is
file → imposed physical sheet → copy → front/back. Logical pages includes copy
impressions, marked sides excludes padding, physical sheets includes padding.
No side contains pages from different files.

`render_hash(plan, normalized)` hashes UTF-8 compact JSON with recursively sorted
object keys, arrays preserved and integer number spelling:
`{"files":plan.files,"settings":plan.settings,"sides":normalized.sides}`.
This is a **render recipe hash**, not an output pixel digest or a signature.
Validate rejects mismatches. It intentionally excludes job/shop/policy metadata;
production signatures and plan identity must bind those independently. v1 keys
are ASCII; strings use unescaped Unicode with JSON string escaping. Source
digests, all settings and actual ordered side recipes are bound by the hash.

Python's private `_normalize(plan, expected_shop)` is a fixture-builder seam that
performs all checks except final recipe hash comparison. Builders may supply a
64-hex placeholder, call `_normalize`, set `render_hash` from `render_hash(...)`,
then call `validate` on the final plan. Consumers must always call `validate`;
the builder helper does not accept a plan or establish authorization.

Run from repository root:

```powershell
python -m pytest tests/phase0/test_printplan.py -q
node packages/printplan/typescript/printplan.ts
cargo test -p printplan
```

`fixtures/printplan/cases.json` contains positive expected selections, side order
and accounting, plus malformed/range/capability/tenant/hash/limit rejections.
`valid-duplex.json` is a synthetic plan whose source digest is a placeholder,
so a native byte verifier must reject it with an unrelated PDF. No fixture
represents real customer content or physical printer certification.
