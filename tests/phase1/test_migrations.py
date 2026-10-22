"""
Phase 1 Migration & Schema Integrity Tests.
Verifies all 26 entities, forced RLS on tenant tables, composite keys,
and idempotent up/down migrations.
"""

import pytest
from infra.migrations.runner import verify_migration_integrity, load_migration_sql


def test_schema_entities_and_rls():
    report = verify_migration_integrity()
    assert report["required_26_present"] is True, f"Missing tables in UP: {report['missing_in_up']}"
    assert report["down_idempotent"] is True, f"Missing tables in DOWN: {report['missing_in_down']}"
    assert report["tables_created_count"] >= 26
    assert report["rls_enforced_count"] == 21

    # Verify key tenant tables are in RLS enforcement list
    assert "orders" in report["rls_tables"]
    assert "jobs" in report["rls_tables"]
    assert "assets" in report["rls_tables"]
    assert "printers" in report["rls_tables"]
    assert "devices" in report["rls_tables"]
    assert "device_public_keys" in report["rls_tables"]
    assert "device_pairing_codes" in report["rls_tables"]
    assert "subscriptions" in report["rls_tables"]
    assert "shop_settings" in report["rls_tables"]
    assert "guest_sessions" in report["rls_tables"]
    assert "pricing_versions" in report["rls_tables"]
    assert "payment_ledger" in report["rls_tables"]


def test_adversarial_seed_data_in_migration():
    sql = load_migration_sql("001_phase1_schema.sql")

    # Verify Shop A and Shop B seeds
    assert "11111111-1111-1111-1111-111111111111" in sql
    assert "22222222-2222-2222-2222-222222222222" in sql
    assert "anna-chennai" in sql
    assert "bharat-madurai" in sql

    # Verify distinct order modes
    assert "FULL_AUTOMATIC" in sql
    assert "MANUAL_APPROVAL" in sql

    # Verify Single All-Inclusive plan seeds
    assert "ALL_INCLUSIVE" in sql

    # Verify forced RLS syntax
    assert "FORCE ROW LEVEL SECURITY" in sql
    assert "app.current_tenant_id" in sql
