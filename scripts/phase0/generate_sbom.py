"""SPDX 2.3 source/dependency inventory; unresolved declarations remain NOASSERTION.

Uses official registry metadata, preserving responses as evidence. Not a release SBOM.
"""
import argparse
import datetime
import hashlib
import importlib.metadata
import json
import io
import re
import tarfile
import tomllib
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT/'docs/licenses/registry'


def fetch(url, name, refresh=False):
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE/name
    if refresh or not path.exists():
        request = urllib.request.Request(url, headers={'User-Agent': 'PrintBot-phase0-license-audit/1.0'})
        with urllib.request.urlopen(request, timeout=60) as response:
            data = response.read()
        # Parse before accepting cache. No executable registry content is run.
        json.loads(data)
        path.write_bytes(data)
    return json.loads(path.read_bytes())


def identifier(value):
    return 'SPDXRef-'+re.sub('[^A-Za-z0-9.-]', '-', value)


def python_notices(name, version, artifact):
    """Capture declared source notices from a pinned sdist without installing it."""
    destination = ROOT/'docs/licenses/python-notices'/f'{name}-{version}'
    manifest = destination/'evidence-hashes.json'
    if manifest.exists():
        return
    request = urllib.request.Request(artifact['url'], headers={'User-Agent': 'PrintBot-phase0-license-audit/1.0'})
    with urllib.request.urlopen(request, timeout=60) as response:
        data = response.read()
    digest = hashlib.sha256(data).hexdigest()
    if digest != artifact['digests']['sha256']:
        raise ValueError(f'Python source archive checksum mismatch: {name}')
    destination.mkdir(parents=True, exist_ok=True)
    notices = []
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:*') as archive:
        for member in archive.getmembers():
            path = Path(member.name)
            if not member.isfile() or not path.name.upper().startswith(('LICENSE', 'COPYING', 'NOTICE', 'AUTHORS')):
                continue
            if path.is_absolute() or '..' in path.parts or member.size > 2_000_000:
                raise ValueError('Unsafe source notice member')
            contents = archive.extractfile(member).read()
            target = destination/path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(contents)
            notices.append({'file': path.as_posix(), 'sha256': hashlib.sha256(contents).hexdigest()})
    manifest.write_text(json.dumps({'name': name, 'version': version, 'source': artifact['url'],
                                   'source_archive_sha256': digest, 'notices': notices,
                                   'scope': 'Official source archive; installed files/wheel bundled components not verified.'}, indent=2)+'\n', encoding='utf-8')


def package(name, version, ecosystem, license='NOASSERTION', download='NOASSERTION', digest=None, comment=''):
    result = {'SPDXID': identifier(ecosystem+'-'+name+'-'+version), 'name': name,
              'versionInfo': version, 'downloadLocation': download, 'filesAnalyzed': False,
              'licenseConcluded': 'NOASSERTION', 'licenseDeclared': license,
              'copyrightText': 'NOASSERTION', 'comment': comment,
              'externalRefs': [{'referenceCategory': 'PACKAGE-MANAGER', 'referenceType': 'purl',
                                'referenceLocator': f'pkg:{ecosystem}/{name}@{version}'}]}
    if digest:
        result['checksums'] = [{'algorithm': 'SHA256', 'checksumValue': digest}]
    return result


def generate(refresh=False):
    packages = []
    relationships = []
    def add(item):
        if item['SPDXID'] not in {p['SPDXID'] for p in packages}:
            packages.append(item)
            relationships.append({'spdxElementId': 'SPDXRef-DOCUMENT', 'relationshipType': 'DESCRIBES', 'relatedSpdxElement': item['SPDXID']})
    for lock in sorted(ROOT.rglob('Cargo.lock')):
        if '.tools' in lock.parts or 'node_modules' in lock.parts:
            continue
        entries = tomllib.loads(lock.read_text(encoding='utf-8'))['package']
        ids = {p['name']: identifier('cargo-'+p['name']+'-'+p['version']) for p in entries}
        for entry in entries:
            if not entry.get('source', '').startswith('registry+'):
                add(package(entry['name'], entry['version'], 'cargo', comment='Local proof source. Project source licensing unresolved.'))
                for dependency in entry.get('dependencies', []):
                    dep = dependency.split()[0]
                    if dep in ids:
                        relationships.append({'spdxElementId': ids[entry['name']], 'relationshipType': 'DEPENDS_ON', 'relatedSpdxElement': ids[dep]})
                continue
            name, version = entry['name'], entry['version']
            metadata = fetch(f'https://crates.io/api/v1/crates/{name}/{version}', f'cargo-{name}-{version}.json', refresh)['version']
            if metadata['checksum'] != entry['checksum']:
                raise ValueError(f'Lock/registry checksum mismatch: {name}')
            add(package(name, version, 'cargo', metadata['license'] or 'NOASSERTION',
                        f'https://static.crates.io/crates/{name}/{name}-{version}.crate', entry['checksum'],
                        'Registry license declaration; concluded clearance requires bundled notice review. Cargo.lock SHA256 matches official registry.'))
            for dependency in entry.get('dependencies', []):
                dep = dependency.split()[0]
                if dep in ids:
                    relationships.append({'spdxElementId': ids[name], 'relationshipType': 'DEPENDS_ON', 'relatedSpdxElement': ids[dep]})
    # Environment inventory only. Fixture generator itself uses Python stdlib.
    pending = ['jsonschema', 'pytest', 'pypdf', 'Pillow', 'packaging']
    visited = set()
    while pending:
        name = pending.pop(0)
        if name.lower() in visited:
            continue
        visited.add(name.lower())
        distribution = importlib.metadata.distribution(name)
        version = distribution.version
        metadata = fetch(f'https://pypi.org/pypi/{name}/{version}/json', f'pypi-{name}-{version}.json', refresh)
        artifact = next((a for a in metadata['urls'] if a['packagetype'] == 'sdist'), metadata['urls'][0])
        if artifact['packagetype'] == 'sdist':
            python_notices(name.lower(), version, artifact)
        license = metadata['info'].get('license_expression') or 'NOASSERTION'
        # Exact source notices were inspected; older metadata lacks SPDX fields.
        reviewed_source_licenses = {('colorama', '0.4.6'): 'BSD-3-Clause',
                                    ('pluggy', '1.6.0'): 'MIT'}
        license = reviewed_source_licenses.get((name.lower(), version), license)
        if name.lower() == 'pillow':
            license = 'HPND'
        add(package(name.lower(), version, 'pypi', license, artifact['url'], artifact['digests']['sha256'],
                    'Installed environment version; checksum identifies official source archive, NOT installed files or runtime bundle. Optional pypdf/Pillow are not required by corpus tooling.'))
        for requirement in distribution.requires or []:
            # Exclude optional extras and platform-inactive dependencies; packaging is already installed with pytest.
            from packaging.requirements import Requirement
            req = Requirement(requirement)
            if req.marker and not req.marker.evaluate({'extra': ''}):
                continue
            try:
                importlib.metadata.version(req.name)
            except importlib.metadata.PackageNotFoundError:
                continue
            pending.append(req.name)
            relationships.append({'spdxElementId': identifier('pypi-'+name.lower()+'-'+version), 'relationshipType': 'DEPENDS_ON',
                                  'relatedSpdxElement': identifier('pypi-'+req.name.lower()+'-'+importlib.metadata.version(req.name))})
    unresolved = []
    for manifest in sorted(ROOT.rglob('package.json')):
        if any(part in manifest.parts for part in ['node_modules', '.tools', '.git']):
            continue
        obj = json.loads(manifest.read_text(encoding='utf-8'))
        for kind in ['dependencies', 'devDependencies']:
            for name, version in sorted(obj.get(kind, {}).items()):
                unresolved.append({'manifest': manifest.relative_to(ROOT).as_posix(), 'kind': kind, 'name': name, 'constraint': version, 'license': 'NOASSERTION', 'status': 'UNRESOLVED_DECLARATION'})
    (ROOT/'docs/licenses/unresolved-source-declarations.json').write_text(json.dumps(unresolved, indent=2)+'\n', encoding='utf-8')
    rust_declarations = []
    for manifest in sorted(ROOT.rglob('Cargo.toml')):
        if any(part in manifest.parts for part in ['node_modules', '.tools', '.git', 'target']):
            continue
        obj = tomllib.loads(manifest.read_text(encoding='utf-8'))
        sections = [(kind, obj.get(kind, {})) for kind in ['dependencies', 'dev-dependencies', 'build-dependencies']]
        for target, values in obj.get('target', {}).items():
            sections.extend((target+'/'+kind, values.get(kind, {})) for kind in ['dependencies', 'dev-dependencies', 'build-dependencies'])
        for kind, dependencies in sections:
            for name, declaration in dependencies.items():
                rust_declarations.append({'manifest': manifest.relative_to(ROOT).as_posix(), 'kind': kind, 'name': name,
                                          'declaration': declaration, 'license': 'NOASSERTION',
                                          'status': 'SOURCE_DECLARATION_ONLY_SEE_LOCKED_SBOM_FOR_RESOLVED_PACKAGES'})
    (ROOT/'docs/licenses/rust-source-declarations.json').write_text(json.dumps(rust_declarations, indent=2)+'\n', encoding='utf-8')
    wheel = ROOT/'.tools/pypdfium2-5.14.0-win_amd64.whl'
    dll = ROOT/'.tools/pdfium/pypdfium2_raw/pdfium.dll'
    if wheel.exists() and dll.exists():
        wheel_package = package('pypdfium2', '5.14.0', 'pypi', 'NOASSERTION',
                                'https://files.pythonhosted.org/packages/00/dc/ca7874924c9cfd701ad53f89529968523790e70473e0b71e834668316148/pypdfium2-5.14.0-py3-none-win_amd64.whl',
                                hashlib.sha256(wheel.read_bytes()).hexdigest(), 'Exact local experiment wheel, not installed/distributed; multi-license notice bundle preserved in docs/licenses/pdfium-5.14.0.')
        add(wheel_package)
        dll_package = package('pdfium', '156.0.8076.0', 'generic', 'NOASSERTION', 'NOASSERTION',
                              hashlib.sha256(dll.read_bytes()).hexdigest(), 'Actual DLL from wheel; dependency notices captured. Source commit hash absent in vendor version metadata. Release provenance/complete transitive build SBOM BLOCKED.')
        add(dll_package)
        relationships.append({'spdxElementId': wheel_package['SPDXID'], 'relationshipType': 'CONTAINS', 'relatedSpdxElement': dll_package['SPDXID']})
    seed = json.dumps(packages, sort_keys=True).encode()
    return {'spdxVersion': 'SPDX-2.3', 'dataLicense': 'CC0-1.0', 'SPDXID': 'SPDXRef-DOCUMENT',
            'name': 'Print-Bot-Phase0-source-and-environment-inventory-NOT-release',
            'documentNamespace': 'https://printbot.invalid/spdx/'+str(uuid.uuid5(uuid.NAMESPACE_URL, hashlib.sha256(seed).hexdigest())),
            'creationInfo': {'creators': ['Tool: PrintBot-phase0-generate_sbom.py'], 'created': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')},
            'comment': 'Scope: available proof Cargo.lock registry archives, actual Python environment versions, and local PDFium experiment wheel/DLL when available. Legacy pnpm declarations unresolved separately; future candidates excluded. Not an installer/container/complete repository release SBOM. DLL bundled component exact versions unresolved: notices preserved separately. No licenseConcluded clearance implied.',
            'packages': packages, 'relationships': relationships}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true')
    parser.add_argument('--output', type=Path, default=ROOT/'docs/SBOM.spdx.json')
    args = parser.parse_args()
    document = generate(args.refresh)
    args.output.write_text(json.dumps(document, indent=2)+'\n', encoding='utf-8')
    print(f'Wrote {args.output}: {len(document["packages"])} packages; release clearance UNVERIFIED.')
