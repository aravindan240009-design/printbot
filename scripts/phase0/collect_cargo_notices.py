"""Verify Cargo.lock source archive hashes and preserve licenses without executing code."""
import hashlib
import io
import json
import tarfile
import tomllib
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def collect():
    destination = ROOT/'docs/licenses/cargo-notices'
    destination.mkdir(parents=True, exist_ok=True)
    result = []
    lock = tomllib.loads((ROOT/'Cargo.lock').read_text(encoding='utf-8'))
    for package in lock['package']:
        if not package.get('source', '').startswith('registry+'):
            continue
        name, version = package['name'], package['version']
        basename = f'{name}-{version}'
        url = f'https://static.crates.io/crates/{name}/{basename}.crate'
        cached = list((ROOT/'.tools/cargo-home/registry/cache').glob(f'*/{basename}.crate'))
        data = cached[0].read_bytes() if cached else urllib.request.urlopen(url, timeout=60).read()
        digest = hashlib.sha256(data).hexdigest()
        if digest != package['checksum']:
            raise ValueError(f'Archive does not match Cargo.lock: {basename}')
        files = []
        with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
            for member in archive.getmembers():
                path = Path(member.name)
                if not member.isfile() or not path.name.upper().startswith(('LICENSE', 'COPYING', 'NOTICE', 'UNLICENSE')):
                    continue
                # Preserve only text notice members, never extract executable/path traversal content.
                if path.is_absolute() or '..' in path.parts or path.parts[0] != basename or member.size > 2_000_000:
                    raise ValueError('Unsafe notice member')
                contents = archive.extractfile(member).read()
                output = destination/path
                output.parent.mkdir(parents=True, exist_ok=True)
                output.write_bytes(contents)
                files.append({'file': path.as_posix(), 'sha256': hashlib.sha256(contents).hexdigest()})
        result.append({'name': name, 'version': version, 'source': url, 'archive_sha256': digest,
                       'cargo_lock_matches': True, 'notice_files': files})
    (destination/'manifest.json').write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    print(f'PASS: {len(result)} Cargo.lock source archive hashes; all bundled notice files copied, no code executed.')


if __name__ == '__main__':
    collect()
