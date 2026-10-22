"""Bind the trusted synthetic corpus to a local proof plan; never authorizes payment."""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import uuid

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "packages/printplan/python"))
from printplan import validate, render_hash  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--color", choices=["bw", "grayscale", "color"], default="bw")
    parser.add_argument("--duplex", choices=["simplex", "long_edge", "short_edge"], default="simplex")
    parser.add_argument("--copies", type=int, default=1)
    args = parser.parse_args()
    plan = json.loads((ROOT / "fixtures/printplan/valid-duplex.json").read_text())
    pdf = ROOT / "fixtures/printable/portrait-3.pdf"
    # A fresh explicit demo job is necessary for each supervised experiment. Reusing
    # an accepted job identity is never a retry mechanism.
    plan["job_id"] = str(uuid.uuid4())
    plan["files"][0]["sha256"] = hashlib.sha256(pdf.read_bytes()).hexdigest()
    plan["settings"].update(color=args.color, duplex=args.duplex, copies=args.copies)
    # Derive the manifest using the shared adapter; temporarily calculate the hash
    # from the same semantics by loading fixture result generation helper.
    from printplan import _normalize  # imported only if the adapter offers it
    normalized = _normalize(plan, plan["shop_id"])
    plan["render_hash"] = render_hash(plan, normalized)
    validate(plan, plan["shop_id"])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("x", encoding="utf-8") as handle:
        json.dump(plan, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    print(json.dumps({"plan": str(args.output.resolve()), "pdf": str(pdf.resolve()),
                      "shop_id": plan["shop_id"], "job_id": plan["job_id"],
                      "scope": "synthetic local experiment, not production authorization"}))


if __name__ == "__main__":
    main()
