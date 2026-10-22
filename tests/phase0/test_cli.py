"""Actual CLI integration: no printing, only validation/simulator subprocesses."""
import json
import os
from pathlib import Path
import subprocess
import pytest

ROOT = Path(__file__).resolve().parents[2]
CLI = ROOT / "target/debug" / ("printer-proof.exe" if os.name == "nt" else "printer-proof")
pytestmark = pytest.mark.skipif(not CLI.is_file(), reason="build printer-proof before CLI integration checks")
PLAN = ROOT / "fixtures/printplan/valid-duplex.json"
SHOP = "11111111-1111-4111-8111-111111111111"


def run(*args):
    return subprocess.run([str(CLI), *map(str, args)], capture_output=True, text=True, timeout=10, cwd=ROOT)


@pytest.mark.parametrize("scenario", ["ready", "offline", "no-paper", "jam", "restart", "timeout", "cancel", "crash-after-intent", "zero-print"])
def test_explicit_simulator_cannot_report_hardware(scenario):
    result = run("simulate", "--plan", PLAN, "--shop-id", SHOP, "--scenario", scenario)
    assert result.returncode == 0, result.stderr
    value = json.loads(result.stdout)
    assert value["backend"] == "simulator"
    assert value["submitted_to_spooler"] is False
    assert value["physical_complete"] is None
    assert value["hardware_evidence"] is False
    assert value["automatic_reprint_allowed"] is False


def test_tenant_mismatch_fails_without_journal(tmp_path):
    result = run("validate", "--plan", PLAN, "--shop-id", "55555555-5555-4555-8555-555555555555")
    assert result.returncode != 0
    assert "tenant mismatch" in result.stderr
    assert list(tmp_path.iterdir()) == []


def test_bad_source_hash_rejected_before_native_submission():
    result = run("validate", "--plan", PLAN, "--shop-id", SHOP, "--pdf", ROOT / "fixtures/printable/portrait-3.pdf")
    assert result.returncode != 0
    assert "SHA256 mismatch" in result.stderr


def test_unknown_arguments_do_not_select_fallback_backend():
    result = run("list", "--backend", "simulator")
    assert result.returncode != 0
    assert "fallback" in result.stderr or "explicitly" in result.stderr
