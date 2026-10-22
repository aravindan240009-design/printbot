"""Deterministic, synthetic PDF bench corpus. No third-party dependency or user data."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def pdf(sizes):
    objects = [b'<< /Type /Catalog /Pages 2 0 R >>', b'', b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']
    kids = []
    for number, (width, height) in enumerate(sizes, 1):
        page_id = len(objects) + 1
        kids.append(f'{page_id} 0 R')
        stream = (f'0 0 0 RG 2 w 18 18 {width-36} {height-36} re S\n'
                  f'BT /F1 20 Tf 36 {height-48} Td (PRINT BOT SYNTHETIC PAGE {number}) Tj ET\n'
                  f'BT /F1 12 Tf 36 {height-72} Td ({width} x {height} pt - TOP / FRONT) Tj ET\n'
                  f'{width/2} {height-130} m {width/2} {height-90} l S\n'
                  f'{width/2-10} {height-100} m {width/2} {height-90} l {width/2+10} {height-100} l S\n')
        for index, color in enumerate(['1 0 0', '0 1 0', '0 0 1']):
            stream += f'{color} rg {36+index*80} 100 70 60 re f\n'
        for index in range(11):
            stream += f'{index/10:.1f} g {36+index*24} 60 24 25 re f\n'
        data = stream.encode('ascii')
        objects.append(f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {width} {height}] /Resources << /Font << /F1 3 0 R >> >> /Contents {page_id+1} 0 R >>'.encode())
        objects.append(f'<< /Length {len(data)} >>\nstream\n'.encode()+data+b'endstream')
    objects[1] = f'<< /Type /Pages /Count {len(sizes)} /Kids [{" ".join(kids)}] >>'.encode()
    out = bytearray(b'%PDF-1.4\n%PrintBot synthetic fixture\n')
    offsets = [0]
    for number, obj in enumerate(objects, 1):
        offsets.append(len(out))
        out.extend(f'{number} 0 obj\n'.encode()+obj+b'\nendobj\n')
    xref = len(out)
    out.extend(f'xref\n0 {len(offsets)}\n0000000000 65535 f \n'.encode())
    for offset in offsets[1:]:
        out.extend(f'{offset:010d} 00000 n \n'.encode())
    out.extend(f'trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n'.encode())
    return bytes(out)


def generate(destination):
    destination.mkdir(parents=True, exist_ok=True)
    sizes = {'portrait-3.pdf': [(595, 842)]*3, 'landscape-3.pdf': [(842, 595)]*3,
             'mixed-sizes-5.pdf': [(595, 842), (842, 595), (842, 1191), (420, 595), (612, 792)],
             'odd-duplex-5.pdf': [(595, 842)]*5, 'legal-1.pdf': [(612, 1008)]}
    files = {name: pdf(pages) for name, pages in sizes.items()}
    files.update({'malformed-truncated.pdf': b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog',
                  'malformed-not-pdf.pdf': b'This is synthetic text, not a PDF.\n',
                  'malformed-empty.pdf': b''})
    manifest = {'schema_version': 1, 'synthetic_only': True, 'generator': 'scripts/phase0/generate_corpus.py', 'files': []}
    for name, data in sorted(files.items()):
        (destination/name).write_bytes(data)
        manifest['files'].append({'file': name, 'sha256': hashlib.sha256(data).hexdigest(),
                                  'bytes': len(data), 'expected_valid': name in sizes,
                                  'logical_pages': len(sizes[name]) if name in sizes else None,
                                  'media_boxes_pt': sizes.get(name, [])})
    (destination/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT/'fixtures/printable')
    args = parser.parse_args()
    print(json.dumps(generate(args.output), indent=2))
