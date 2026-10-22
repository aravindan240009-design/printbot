"""Create supervised five-model bench records; printing requires explicit --execute."""
import argparse
import datetime
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODELS = ['Brother HL-L2321D', 'Epson EcoTank L3250', 'HP LaserJet Pro M404dn',
          'Canon imageRUNNER 2425', 'HP Color LaserJet Pro MFP M479fdw']
CASES = ['discovery', 'trays-paper', 'copies-collation', 'bw-grayscale-color',
         'duplex-long-portrait', 'duplex-short-portrait', 'duplex-long-landscape',
         'duplex-short-landscape', 'orientation', 'zero-print-invalid', 'no-paper',
         'offline', 'jam-supervised', 'spooler-restart-supervised', 'driver-cancellation-supervised']


def create_record():
    manifest = ROOT/'fixtures/printable/manifest.json'
    return {'schema_version': 1, 'created_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'physical_gate': 'BLOCKED', 'physical_models_tested': 0,
            'corpus_manifest_sha256': hashlib.sha256(manifest.read_bytes()).hexdigest(),
            'safety': 'Record template only. Operator must authorize each own bench job. No automatic jam, restart, cancel or reprint.',
            'targets': [{'model': model, 'driver_variant': driver, 'queue_id': None,
                         'firmware': None, 'driver_version': None, 'connection': None,
                         'windows_build': None, 'capability_snapshot_sha256': None,
                         'cases': [{'case': case, 'status': 'UNVERIFIED', 'command': None,
                                    'plan_sha256': None, 'build_sha256': None, 'job_id': None,
                                    'started_utc': None, 'finished_utc': None,
                                    'logical_pages': None, 'rendered_sides': None, 'physical_sheets': None,
                                    'operator': None, 'evidence': [], 'notes': None} for case in CASES]}
                        for model in MODELS for driver in (['vendor', 'inbox-ipp-if-supported'] if model == MODELS[-1] else ['vendor'])]}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--execute', action='store_true', help='Explicit opt-in: submit exactly one synthetic bench job via trusted-local CLI.')
    parser.add_argument('--cli', type=Path)
    parser.add_argument('--printer')
    parser.add_argument('--pdf', type=Path)
    parser.add_argument('--plan', type=Path)
    parser.add_argument('--shop-id')
    parser.add_argument('--pdfium', type=Path)
    parser.add_argument('--pdfium-sha256')
    parser.add_argument('--journal', type=Path)
    parser.add_argument('--operator')
    args = parser.parse_args()
    if args.output.exists():
        parser.error('Refusing to overwrite an evidence record. Choose a new path.')
    record = create_record()
    if args.execute:
        required = ['cli', 'printer', 'pdf', 'plan', 'shop_id', 'pdfium', 'pdfium_sha256', 'journal', 'operator']
        if any(not getattr(args, name) for name in required):
            parser.error('--execute requires --cli --printer --pdf --plan --shop-id --pdfium --pdfium-sha256 --journal --operator')
        if args.pdf.resolve().parent != (ROOT/'fixtures/printable').resolve():
            parser.error('Only repository synthetic printable fixtures are permitted')
        manifest = json.loads((ROOT/'fixtures/printable/manifest.json').read_text())
        fixture = next((f for f in manifest['files'] if f['file'] == args.pdf.name and f['expected_valid']), None)
        if not fixture or hashlib.sha256(args.pdf.read_bytes()).hexdigest() != fixture['sha256']:
            parser.error('Fixture is not valid or has changed from manifest')
        command = [str(args.cli.resolve()), 'print', '--printer', args.printer, '--pdf', str(args.pdf.resolve()),
                   '--plan', str(args.plan.resolve()), '--shop-id', args.shop_id, '--pdfium', str(args.pdfium.resolve()),
                   '--pdfium-sha256', args.pdfium_sha256, '--journal', str(args.journal.resolve()), '--trusted-local']
        # Native CLI owns capability validation and journal. Never infer physical completion.
        # Save pre-submission evidence first: a timeout/crash must not invite blind retries.
        record['attempt'] = {'status': 'SUBMISSION_ATTEMPTED_COMPLETION_UNKNOWN', 'operator': args.operator,
                             'command': command, 'plan_sha256': hashlib.sha256(args.plan.read_bytes()).hexdigest(),
                             'build_sha256': hashlib.sha256(args.cli.read_bytes()).hexdigest()}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(record, indent=2)+'\n', encoding='utf-8')
    if args.execute:
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=180, check=False)
            record['attempt'].update({'exit_code': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr})
        except (subprocess.TimeoutExpired, OSError) as error:
            record['attempt']['error'] = type(error).__name__
        args.output.write_text(json.dumps(record, indent=2)+'\n', encoding='utf-8')
    print(f'Created {args.output}; every physical hardware case remains UNVERIFIED.')
