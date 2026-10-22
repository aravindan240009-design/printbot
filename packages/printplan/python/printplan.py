"""PrintPlan v1 reference semantics; JSON Schema is the structural source of truth.

This validates a trusted immutable plan against an independently supplied tenant.
It does not authenticate that context, verify file bytes, or authorize payment.
"""
import json
from pathlib import Path
import re
import hashlib

from jsonschema import Draft202012Validator

SCHEMA = json.loads((Path(__file__).resolve().parents[1] / "schema.v1.json").read_text())
VALIDATOR = Draft202012Validator(SCHEMA)
PAPERS = {"A3": (297000, 420000), "A4": (210000, 297000), "A5": (148000, 210000), "Letter": (215900, 279400), "Legal": (215900, 355600)}
MAX_IMPRESSIONS = 100000


def render_hash(plan, normalized):
    recipe = {"files": plan["files"], "settings": plan["settings"], "sides": normalized["sides"]}
    # JSON Schema integer includes 1.0; canonical JSON uses the integer spelling.
    def canonical_numbers(value):
        if isinstance(value, dict):
            return {k: canonical_numbers(v) for k, v in value.items()}
        if isinstance(value, list):
            return [canonical_numbers(v) for v in value]
        if isinstance(value, float) and value.is_integer():
            return int(value)
        return value
    recipe = canonical_numbers(recipe)
    return hashlib.sha256(json.dumps(recipe, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


def resolve_ranges(text, page_count, parity="all"):
    if type(page_count) is not int or not 1 <= page_count <= 10000:
        raise ValueError("invalid page count")
    if not isinstance(text, str) or not 1 <= len(text) <= 512 or parity not in ("all", "odd", "even"):
        raise ValueError("invalid selection")
    pages = set()
    for item in text.split(","):
        if not re.fullmatch(r"[1-9][0-9]*(?:-(?:[1-9][0-9]*)?)?", item, flags=re.ASCII):
            raise ValueError("invalid range grammar")
        bounds = item.split("-")
        start = int(bounds[0])
        end = (int(bounds[1]) if bounds[1] else page_count) if len(bounds) == 2 else start
        if not 1 <= start <= end <= page_count:
            raise ValueError("range outside document")
        pages.update(range(start, end + 1))
    selected = sorted(p for p in pages if parity == "all" or p % 2 == (1 if parity == "odd" else 0))
    if not selected:
        raise ValueError("empty selection")
    return selected


def _normalize(plan, expected_shop):
    """Builder-only recipe accounting; does NOT check the supplied recipe hash.

    Never use this private helper to accept a plan for printing. A builder may
    supply a syntactically valid placeholder hash, compute the returned recipe
    digest and then must call validate on the final immutable plan.
    """
    errors = list(VALIDATOR.iter_errors(plan))
    if errors:
        raise ValueError("schema: " + errors[0].message)
    # Match JavaScript's JSON number model without leaking floats into accounting.
    def integers(value):
        if isinstance(value, dict):
            return {k: integers(v) for k, v in value.items()}
        if isinstance(value, list):
            return [integers(v) for v in value]
        if isinstance(value, float) and value.is_integer():
            return int(value)
        return value
    plan = integers(plan)
    if plan["shop_id"] != expected_shop:
        raise ValueError("tenant mismatch")
    s, c = plan["settings"], plan["capabilities"]
    if s["booklet"] or s["photo"] is not None or s["bin_id"] is not None:
        raise ValueError("operation unsupported by executable v1 subset")
    if (s["width_um"], s["height_um"]) != PAPERS[s["paper_size"]]:
        raise ValueError("named paper dimensions mismatch")
    m = s["margins_um"]
    width, height = s["width_um"], s["height_um"]
    if s["orientation"] == "landscape":
        width, height = height, width
    if m["left"] + m["right"] >= width or m["top"] + m["bottom"] >= height:
        raise ValueError("margins leave no printable area")
    for requested, supported in (("color", "color_modes"), ("duplex", "duplex_modes"), ("paper_size", "paper_sizes"), ("media", "media")):
        if s[requested] not in c[supported]:
            raise ValueError("capability mismatch: " + requested)
    if s["copies"] > c["max_copies"]:
        raise ValueError("copy capability exceeded")
    if len({f["file_id"] for f in plan["files"]}) != len(plan["files"]):
        raise ValueError("duplicate file identity")
    selected = [resolve_ranges(f["range"], f["page_count"], f["parity"]) for f in plan["files"]]
    logical = sum(map(len, selected)) * s["copies"]
    if logical > MAX_IMPRESSIONS:
        raise ValueError("logical impression limit")
    duplex = s["duplex"] != "simplex"
    templates = []
    for index, pages in enumerate(selected):
        units = [pages[i:i+s["pages_per_sheet"]] for i in range(0, len(pages), s["pages_per_sheet"])]
        if duplex and len(units) % 2:
            units.append([])
        templates.append((index, units))
    sides = []
    def append_side(file_index, numbers, copy):
        if len(sides) >= MAX_IMPRESSIONS:
            raise ValueError("rendered side limit")
        sides.append({"file_index": file_index, "page_numbers": numbers, "copy_index": copy, "blank": not numbers})
    if s["collate"]:
        for copy in range(s["copies"]):
            for index, units in templates:
                for numbers in units:
                    append_side(index, numbers, copy)
    else:
        for index, units in templates:
            step = 2 if duplex else 1
            for i in range(0, len(units), step):
                for copy in range(s["copies"]):
                    for numbers in units[i:i+step]:
                        append_side(index, numbers, copy)
    padding = sum(side["blank"] for side in sides)
    normalized = {"selected_pages": selected, "sides": sides, "logical_pages": logical, "marked_sides": len(sides) - padding, "padding_sides": padding, "physical_sheets": len(sides) // (2 if duplex else 1)}
    return normalized


def validate(plan, expected_shop):
    normalized = _normalize(plan, expected_shop)
    if render_hash(plan, normalized) != plan["render_hash"]:
        raise ValueError("render recipe hash mismatch")
    return normalized


if __name__ == "__main__":
    import sys
    request = json.load(sys.stdin)
    try:
        print(json.dumps({"ok": True, "normalized": validate(request["plan"], request["expected_shop"])}))
    except ValueError as error:
        print(json.dumps({"ok": False, "error": str(error)}))
