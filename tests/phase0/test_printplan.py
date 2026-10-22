"""Shared executable contract corpus: no hardware or authorization is simulated."""
import importlib.util
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("printplan", ROOT / "packages/printplan/python/printplan.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
CASES = json.loads((ROOT / "fixtures/printplan/cases.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("case", CASES, ids=lambda case: case["name"])
def test_common_contract(case):
    if "expected" in case:
        assert MODULE.validate(case["plan"], case["expected_shop"]) == case["expected"]
    else:
        with pytest.raises(ValueError):
            MODULE.validate(case["plan"], case["expected_shop"])


@pytest.mark.parametrize("text", ["0", "3-1", "11", "1,,3", "-3", "01", "1-11", "1-2-3", " 1", "1,", "١"])
def test_bad_ranges(text):
    with pytest.raises(ValueError):
        MODULE.resolve_ranges(text, 10, "all")


def test_ranges_and_original_parity():
    assert MODULE.resolve_ranges("1-3,5,8-", 10, "even") == [2, 8, 10]
    assert MODULE.resolve_ranges("3,1-3,2", 3, "all") == [1, 2, 3]


def test_unpaired_surrogate_rejected_before_hash_encoding():
    import copy
    plan = copy.deepcopy(CASES[0]["plan"])
    plan["settings"]["media"] = "\ud800"
    plan["capabilities"]["media"] = ["\ud800"]
    with pytest.raises(ValueError):
        MODULE.validate(plan, plan["shop_id"])


def test_builder_requires_final_hash_validation():
    import copy
    plan = copy.deepcopy(CASES[0]["plan"])
    plan["render_hash"] = "0" * 64
    with pytest.raises(ValueError, match="recipe hash"):
        MODULE.validate(plan, plan["shop_id"])
    normalized = MODULE._normalize(plan, plan["shop_id"])
    plan["render_hash"] = MODULE.render_hash(plan, normalized)
    assert MODULE.validate(plan, plan["shop_id"]) == normalized
