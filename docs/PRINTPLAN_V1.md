# PrintPlan v1 — executable contract and limitations

Status: schema and Python/TypeScript/Rust reference adapters implemented in
`packages/printplan`, checked against 85 common positive/negative cases. Existing
legacy `PrintOptions` is not this contract and was not migrated in Phase 0.
See `packages/printplan/README.md` for exact implemented fields/limits, recipe hash
format and accounting order; `PHASE0_RUNBOOK.md` for executable proof commands.
The sections below retain intended production trust requirements; a local CLI
shop-id argument is a test seam and does not implement server authentication.

Implemented hash is a versioned restricted canonical recipe hash, not general RFC8785:
UTF8 compact JSON with recursively sorted keys, normalized integer spelling and
ordered arrays for `{files,settings,sides}`. It binds source digests and transforms;
output raster manifest gets a separate digest. Production signatures must separately
bind shop/job/device/pricing/policy. No output-pixel hash is mislabeled as recipe hash.
Structural schema can describe booklet/photo/bin values; executable reference
adapters reject these unimplemented operations. Native adapter also rejects multi-file,
n-up, auto orientation and non-plain media. Requirements remain tracked, not dropped.

## Trust and representation

Server produces immutable `schema_version: 1`, plan/job identifiers, server-derived
`shop_id`, authorized `device_id`, ordered file identities and SHA-256 digests,
pricing version, accepted policy version/mode, printer capability snapshot/version,
render hash and plan hash. IDs are not secrets. Customer input schema must omit
server-owned fields; agent validates plan shop against authenticated device binding.
Do not treat JSON Schema validation as authentication or hash verification.

File configuration includes validated page_count, range string, odd/even/all filter,
resolved selected pages, copies, collate, color/bw/grayscale, simplex/long_edge/
short_edge, portrait/landscape/auto, A3/A4/A5/Letter/Legal or explicit supported
dimensions, media/bin identifier, quality, finishing, fit/actual/custom scaling,
integer margins and optional photo layout/crop/rotation. Use integer micrometres,
integer scaling basis points and crop coordinates in documented integer units.
No NaN/floats for money, dimensions or canonical hashing. Currency INR and integer
paise; price is authoritative only in a locked server checkout record.

Specify `pages_per_sheet` in 1,2,4,6,9,16; booklet and photo/passport/ID layouts are
explicit operation variants with measured output dimensions and source transforms.
Unsupported operations fail validation in the initial proof rather than disappearing.
Printer snapshot includes color modes, duplex modes, sizes/dimensions, printable
area, media/bin combinations and feature provenance; combinations need verification.

Final renderer output manifest lists ordered sides, source page transforms, inserted
blanks, media, copy boundaries and per-artifact digests. Quote, route and spool use
the same versioned plan. Define canonical serialization before hashing (proposed:
RFC 8785 JSON canonicalization, restricted to integers/strings/booleans) and version
the normalization algorithm. Hash output artifacts separately from the plan to avoid
a circular digest. Production signature and durable authorization are separate.

## Canonical ranges

Grammar: `selection := item (',' item)*`; `item := positive | positive '-' positive |
positive '-'`. Positive is ASCII `[1-9][0-9]*`, one-based. Reject whitespace, leading
zero, signs, empty elements, descending ranges and any bound above document count.
An open end resolves to validated document count. Default UI selection is explicit
`1-`; reject empty output. Apply odd/even to original logical page numbers after
range union. Deduplicate and sort ascending; file reorder controls document order.
Bound range text length, page count and expansion count before allocating.

Examples for ten pages: `1-3,5,8-` -> [1,2,3,5,8,9,10]; even -> [2,8,10].
Reject `0`, `3-1`, `11`, `1,,3`, `-3`, `01`, `1-11`, `1-2-3` and unknown filters.
Explicit thumbnail selection normalizes to the same set and resolved sequence.

## Accounting and imposition

Selected logical pages, rendered sides and physical sheets are separate quantities.
For ordinary n-up, content_sides=ceil(selected_pages/n). Simplex sheets=content_sides;
duplex sheets=ceil(content_sides/2), with an explicit blank back when required to
keep each copy/file boundary on a fresh sheet. Rendered side manifest includes
padding blanks, but pricing must distinguish marked sides and padding. For example,
three pages, one-up duplex, two copies -> six logical page impressions, six marked
sides, two blank backs, four sheets. Copies must never share the back of another copy.

Booklet imposes signatures in multiples of four logical positions; record padding,
binding edge and page ordering explicitly. Never reuse ordinary n-up accounting as
booklet implementation. Duplex edge behavior must be tested with orientation arrows.
Initially split mixed paper/media/orientation combinations into explicitly associated
compatible subjobs with separate capability checks and boundary padding, or reject.
Do not imply one DEVMODE can implement arbitrary mixed media. Preserve locked plan
accounting and avoid charging inserted blanks as printed content by accident.
