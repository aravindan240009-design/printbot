"""Verify corpus determinism, parser expectations, inventory and official SPDX schema."""
import hashlib
import json
import tempfile
from pathlib import Path
import jsonschema
from generate_corpus import ROOT, generate


def verify():
    manifest = json.loads((ROOT/'fixtures/printable/manifest.json').read_text(encoding='utf-8'))
    with tempfile.TemporaryDirectory() as destination:
        assert json.loads(json.dumps(generate(Path(destination)))) == manifest
    for item in manifest['files']:
        path = ROOT/'fixtures/printable'/item['file']
        assert hashlib.sha256(path.read_bytes()).hexdigest() == item['sha256']
    # Existing environment pypdf provides independent parsing; not needed by generation.
    from pypdf import PdfReader
    for item in manifest['files']:
        try:
            reader = PdfReader(ROOT/'fixtures/printable'/item['file'], strict=True)
            valid = len(reader.pages) == item['logical_pages']
            if valid:
                assert [[int(p.mediabox.width), int(p.mediabox.height)] for p in reader.pages] == item['media_boxes_pt']
        except Exception:
            valid = False
        assert valid == item['expected_valid'], item['file']
    sbom = json.loads((ROOT/'docs/SBOM.spdx.json').read_text(encoding='utf-8'))
    schema = json.loads((ROOT/'docs/licenses/spdx-2.3.schema.json').read_text(encoding='utf-8'))
    errors = sorted(jsonschema.Draft7Validator(schema).iter_errors(sbom), key=lambda e: str(e.path))
    assert not errors, '; '.join(f'{list(e.path)}: {e.message}' for e in errors)
    ids = {p['SPDXID'] for p in sbom['packages']} | {'SPDXRef-DOCUMENT'}
    assert len(ids) == len(sbom['packages'])+1, 'Duplicate SPDX IDs'
    for relation in sbom['relationships']:
        assert relation['spdxElementId'] in ids and relation['relatedSpdxElement'] in ids
    inventory = json.loads((ROOT/'docs/licenses/windows-inventory.json').read_text(encoding='utf-8-sig'))
    assert inventory['read_only'] is True
    assert all('Name' not in queue and 'PortName' not in queue for queue in inventory['queues'])
    notice_manifest = ROOT/'docs/licenses/cargo-notices/manifest.json'
    if notice_manifest.exists():
        for package in json.loads(notice_manifest.read_text(encoding='utf-8')):
            for notice in package['notice_files']:
                assert hashlib.sha256((notice_manifest.parent/notice['file']).read_bytes()).hexdigest() == notice['sha256']
    bench = json.loads((ROOT/'docs/licenses/bench-unverified.json').read_text(encoding='utf-8'))
    assert len({target['model'] for target in bench['targets']}) == 5
    assert len(bench['targets']) == 6
    assert all(case['status'] == 'UNVERIFIED' for target in bench['targets'] for case in target['cases'])
    print(f'PASS: 8 deterministic fixture hashes; valid PDF page counts/media and malformed rejection; SPDX2.3 schema and relationships ({len(sbom["packages"])} packages); notice hashes; privacy-safe inventory; five-model unverified bench.')


if __name__ == '__main__':
    verify()
