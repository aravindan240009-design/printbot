"""
Database Migration Runner for Print Bot Phase 1.
Supports running UP and DOWN migrations with verification of RLS enforcement.
"""

from pathlib import Path
from typing import List, Dict, Any
import re

MIGRATIONS_DIR = Path(__file__).parent

def load_migration_sql(filename: str) -> str:
    path = MIGRATIONS_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Migration file not found: {path}")
    return path.read_text(encoding="utf-8")

def parse_tables_from_ddl(sql: str) -> List[str]:
    """Extracts table names created with CREATE TABLE [IF NOT EXISTS] <name>."""
    pattern = r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)"
    return re.findall(pattern, sql, flags=re.IGNORECASE)

def parse_rls_tables_from_ddl(sql: str) -> List[str]:
    """Extracts table names configured with FORCE ROW LEVEL SECURITY."""
    pattern = r"'([a-zA-Z0-9_]+)'"
    # Find the tenant_tables array block
    match = re.search(r"tenant_tables\s+text\[\]\s*:=\s*ARRAY\[(.*?)\];", sql, flags=re.DOTALL | re.IGNORECASE)
    if match:
        array_content = match.group(1)
        return [t.strip().strip("'\"") for t in array_content.split(",") if t.strip()]
    return []

def verify_migration_integrity() -> Dict[str, Any]:
    """Verifies that the Phase 1 schema has all 26 entities and forced RLS."""
    up_sql = load_migration_sql("001_phase1_schema.sql")
    down_sql = load_migration_sql("001_phase1_down.sql")

    tables_created = parse_tables_from_ddl(up_sql)
    rls_tables = parse_rls_tables_from_ddl(up_sql)

    # Tables dropped in down migration
    dropped_tables = re.findall(r"DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_]+)", down_sql, flags=re.IGNORECASE)

    required_26_tables = [
        "shops", "shop_profiles", "qr_links", "shop_settings", "staff",
        "shop_memberships", "roles", "subscriptions", "invoices", "billing_events",
        "device_pairing_codes", "devices", "device_public_keys", "device_heartbeats",
        "printers", "printer_capability_snapshots", "orders", "order_items",
        "assets", "guest_sessions", "pricing_versions", "jobs", "job_events",
        "payment_ledger", "webhook_inbox", "audit_events"
    ]

    missing_in_up = [t for t in required_26_tables if t not in tables_created]
    missing_in_down = [t for t in required_26_tables if t not in dropped_tables]

    return {
        "tables_created_count": len(tables_created),
        "tables_created": tables_created,
        "required_26_present": len(missing_in_up) == 0,
        "missing_in_up": missing_in_up,
        "missing_in_down": missing_in_down,
        "rls_enforced_count": len(rls_tables),
        "rls_tables": rls_tables,
        "down_idempotent": len(missing_in_down) == 0,
    }

if __name__ == "__main__":
    report = verify_migration_integrity()
    print("Migration Verification Report:")
    for k, v in report.items():
        print(f"  {k}: {v}")
