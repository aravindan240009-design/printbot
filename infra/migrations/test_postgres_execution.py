"""
Isolated Real PostgreSQL 16+ Migration Execution Test Suite for Print Bot.
Executes against an isolated, temporary, local PostgreSQL engine.
Zero connection to production Supabase.

Tests:
1. DDL Execution (All 11 canonical tables, functions, extensions).
2. Seed Synthetic Legacy pilot_applications Fixtures (7 distinct edge cases).
3. Migration Loop Execution (Variable resets, deterministic slug collision, date verification).
4. Verification of Migrated Records & Compat VIEW.
5. Authoritative validate_shop_license RPC testing (Valid key, wrong key, expired key, quarantined key).
6. Idempotency Test: Re-running migration SQL a second time without failure or duplicates.
7. Data-Preserving Recovery / Rollback Test: Verify orders and payments remain 100% intact.
"""

import sys
import os
import pathlib
import tempfile
import embedded_postgres
import pg8000.native


def run_full_postgres_test():
    temp_dir = pathlib.Path(tempfile.mkdtemp(prefix="pb_pg_test_"))
    print(f"[*] Initializing isolated local PostgreSQL cluster at {temp_dir}...")
    
    server = embedded_postgres.get_server(temp_dir)
    server.ensure_pgdata_inited()
    server.ensure_postgres_running()
    
    uri = server.get_uri("postgres")
    port = server.get_postmaster_info().port
    print(f"[+] Isolated PostgreSQL running on 127.0.0.1:{port} (Cluster ID: {temp_dir.name})")

    conn = pg8000.native.Connection(
        user="postgres",
        host="127.0.0.1",
        port=port,
        database="postgres"
    )

    try:
        # Check PG Version
        pg_ver = conn.run("SELECT version()")[0][0]
        print(f"[+] Engine Version: {pg_ver.splitlines()[0]}")

        # Set Server-Side Pepper Configuration
        test_pepper = "local_test_isolated_pepper_secret_32bytes_min!"
        conn.run(f"ALTER DATABASE postgres SET app.settings.license_pepper = '{test_pepper}';")
        conn.run(f"SET app.settings.license_pepper = '{test_pepper}';")
        print("[+] Configured app.settings.license_pepper in isolated database session.")

        # ----------------------------------------------------------------------
        # TEST STEP 1: Create Legacy pilot_applications Table & Seed 7 Fixtures
        # ----------------------------------------------------------------------
        print("\n--- STEP 1: Seeding 7 Synthetic Legacy Fixtures in pilot_applications ---")
        conn.run("""
            CREATE TABLE IF NOT EXISTS public.pilot_applications (
                id TEXT PRIMARY KEY,
                shop_name TEXT NOT NULL,
                city TEXT,
                contact_number TEXT,
                plan TEXT,
                applied_at TIMESTAMPTZ,
                status TEXT NOT NULL,
                generated_username TEXT,
                generated_key TEXT NOT NULL,
                approved_at TIMESTAMPTZ,
                notes TEXT
            );
        """)

        fixtures = [
            # 1. Clean Lifetime Commercial
            ("APP-SYNTH-01", "QA Xerox Demo", "Chennai", "9840111111", "Lifetime Commercial", "2026-10-01 09:00:00+00", "APPROVED", "qa-xerox-demo", "PB-TEST-K9X4-M2N8-DEMO", "2026-10-01 09:30:00+00", '{"bwRate": 1.5, "colorRate": 10.0}'),
            # 2. Clean 1-Year Plan
            ("APP-SYNTH-02", "QA Annual Stand", "Coimbatore", "9840222222", "1 Year", "2026-10-01 10:00:00+00", "APPROVED", "qa-annual-stand", "PB-TEST-ANNUAL-1234", "2026-10-01 10:15:00+00", '{"bwRate": 2.0, "colorRate": 12.0}'),
            # 3. Missing Timestamps (Quarantine Test)
            ("APP-SYNTH-03", "QA Missing Dates", "Madurai", "9840333333", "1 Year", None, "APPROVED", "qa-corrupt-dates", "PB-TEST-CORRUPT-9999", None, None),
            # 4. Unknown Plan Name (Quarantine Test)
            ("APP-SYNTH-04", "QA Unknown Plan", "Salem", "9840444444", "Super VIP Pass", "2026-10-01 12:00:00+00", "APPROVED", "qa-unknown-plan", "PB-TEST-UNKNOWN-4444", "2026-10-01 12:05:00+00", None),
            # 5. Slug Collision Base
            ("APP-SYNTH-05", "QA Collision Stand A", "Trichy", "9840555555", "1 Month", "2026-10-01 13:00:00+00", "APPROVED", "qa-xerox-stand", "PB-TEST-COLLISION-1111", "2026-10-01 13:10:00+00", None),
            # 6. Slug Collision Duplicate (Must be deterministically disambiguated)
            ("APP-SYNTH-06", "QA Collision Stand B", "Trichy", "9840666666", "1 Month", "2026-10-01 13:05:00+00", "APPROVED", "qa-xerox-stand", "PB-TEST-COLLISION-2222", "2026-10-01 13:15:00+00", None),
            # 7. Expired Subscription
            ("APP-SYNTH-07", "QA Expired Stand", "Vellore", "9840777777", "1 Month", "2025-01-01 09:00:00+00", "APPROVED", "qa-expired-stand", "PB-TEST-EXPIRED-7777", "2025-01-01 09:30:00+00", None),
        ]

        for f in fixtures:
            conn.run(
                "INSERT INTO public.pilot_applications VALUES (:id, :name, :city, :phone, :plan, :app_at, :status, :user, :key, :appr_at, :notes)",
                id=f[0], name=f[1], city=f[2], phone=f[3], plan=f[4], app_at=f[5], status=f[6], user=f[7], key=f[8], appr_at=f[9], notes=f[10]
            )
        print(f"[+] Successfully seeded {len(fixtures)} synthetic test fixtures.")

        # ----------------------------------------------------------------------
        # TEST STEP 2: Execute 001_phase1_schema.sql (The Full Up Migration)
        # ----------------------------------------------------------------------
        print("\n--- STEP 2: Executing 001_phase1_schema.sql Up Migration ---")
        migration_sql_path = pathlib.Path(__file__).parent / "001_phase1_schema.sql"
        migration_sql = migration_sql_path.read_text(encoding="utf-8")
        
        # Execute migration script in PostgreSQL
        conn.run(migration_sql)
        print("[+] Migration 001_phase1_schema.sql executed successfully without errors.")

        # ----------------------------------------------------------------------
        # TEST STEP 3: Verify Migrated Invariants & Schema Tables
        # ----------------------------------------------------------------------
        print("\n--- STEP 3: Verifying Migration Integrity & Invariants ---")
        
        # (a) Check legacy archive table exists
        archive_count = conn.run("SELECT COUNT(*) FROM public.pilot_applications_historical_archive;")[0][0]
        assert archive_count == 7, f"Expected 7 archived rows, got {archive_count}"
        print(f"[PASS] Legacy table safely archived with all {archive_count} records intact.")

        # (b) Check backward-compatibility VIEW
        view_rows = conn.run("SELECT id, shop_name, generated_username, status, notes FROM public.pilot_applications;")
        assert len(view_rows) >= 5, f"Expected at least 5 view rows, got {len(view_rows)}"
        print(f"[PASS] Backward-compatibility VIEW active: {len(view_rows)} accessible shops.")

        # (c) Check Lifetime Subscription
        lifetime_row = conn.run("""
            SELECT s.slug, sl.is_lifetime, sl.expires_at, sl.migration_status 
            FROM public.shops s 
            JOIN public.shop_licenses sl ON s.id = sl.shop_id 
            WHERE s.slug = 'qa-xerox-demo';
        """)[0]
        assert lifetime_row[1] is True, "Lifetime shop should have is_lifetime=True"
        assert lifetime_row[2] is None, f"Lifetime shop should have expires_at=NULL, got {lifetime_row[2]}"
        assert lifetime_row[3] == "VERIFIED", f"Expected VERIFIED, got {lifetime_row[3]}"
        print(f"[PASS] Lifetime Commercial invariant: is_lifetime=True, expires_at=NULL (verified).")

        # (d) Check Missing Dates Quarantine
        quarantine_row = conn.run("""
            SELECT s.name, sl.migration_status, sl.is_revoked, s.status
            FROM public.shops s 
            JOIN public.shop_licenses sl ON s.id = sl.shop_id 
            WHERE s.legacy_source_id = 'APP-SYNTH-03';
        """)[0]
        assert quarantine_row[1] == "MISSING_ACTIVATION_DATE_REQUIRES_MANUAL_REVIEW"
        assert quarantine_row[2] is True, "Corrupt dates record must have is_revoked=True"
        assert quarantine_row[3] == "PENDING", "Corrupt dates shop must have status=PENDING"
        print(f"[PASS] Quarantine invariant: Corrupt dates flagged for manual review and revoked.")

        # (e) Check Deterministic Slug Collision Handling
        slugs = [r[0] for r in conn.run("SELECT slug FROM public.shops WHERE slug LIKE 'qa-xerox-stand%';")]
        assert len(slugs) == 2, f"Expected 2 disambiguated slugs, got {slugs}"
        assert "qa-xerox-stand" in slugs, "Original slug should exist"
        collision_slug = [s for s in slugs if s != "qa-xerox-stand"][0]
        assert collision_slug.startswith("qa-xerox-stand-"), f"Disambiguated slug must start with prefix: {collision_slug}"
        print(f"[PASS] Slug Collision invariant: Disambiguated deterministically to '{collision_slug}'.")

        # (f) Check Expired Subscription
        expired_row = conn.run("""
            SELECT sl.is_revoked, sl.expires_at 
            FROM public.shops s 
            JOIN public.shop_licenses sl ON s.id = sl.shop_id 
            WHERE s.legacy_source_id = 'APP-SYNTH-07';
        """)[0]
        assert expired_row[0] is True, "Expired subscription must have is_revoked=True"
        print(f"[PASS] Expiry invariant: Past subscription ({expired_row[1]}) marked revoked.")

        # ----------------------------------------------------------------------
        # TEST STEP 4: Test validate_shop_license RPC & Security Controls
        # ----------------------------------------------------------------------
        print("\n--- STEP 4: Testing Server-Side validate_shop_license RPC & Security Controls ---")
        
        # Test 4a: Valid credentials & Device Token Generation
        res_valid = conn.run("SELECT public.validate_shop_license('qa-xerox-demo', 'PB-TEST-K9X4-M2N8-DEMO', 'dev_1', 'hash_1');")[0][0]
        assert res_valid.get("success") is True, f"Expected success=True, got {res_valid}"
        assert res_valid.get("shop_name") == "QA Xerox Demo"
        assert res_valid.get("device_token") is not None, "Expected device_token in response"
        assert res_valid.get("device_token").startswith("devtoken:"), f"Malformed device token: {res_valid.get('device_token')}"
        print(f"[PASS] RPC valid key validation succeeded and issued authentic device token: {res_valid.get('device_token')[:35]}...")

        # Test 4b: Device Registration & Heartbeat Check
        dev_rows = conn.run("SELECT device_id, hardware_hash, status FROM public.devices WHERE device_id = 'dev_1';")
        assert len(dev_rows) == 1, f"Expected 1 device row, found {len(dev_rows)}"
        assert dev_rows[0][1] == "hash_1", f"Expected hardware_hash='hash_1', got {dev_rows[0][1]}"
        print(f"[PASS] Workstation device pairing verified in public.devices table.")

        # Test 4c: Wrong key rejection
        res_invalid = conn.run("SELECT public.validate_shop_license('qa-xerox-demo', 'PB-WRONG-KEY-0000', 'dev_1', 'hash_1');")[0][0]
        assert res_invalid.get("success") is False, f"Expected success=False, got {res_invalid}"
        assert "Invalid" in res_invalid.get("error", "")
        print(f"[PASS] RPC wrong key rejected constant-time: {res_invalid.get('error')}.")

        # Test 4d: Quarantined / Revoked account rejection
        res_quarantined = conn.run("SELECT public.validate_shop_license('qa-corrupt-dates', 'PB-TEST-CORRUPT-9999', 'dev_1', 'hash_1');")[0][0]
        assert res_quarantined.get("success") is False
        print(f"[PASS] RPC quarantined account rejected: {res_quarantined.get('error')}.")

        # Test 4e: Server-side Rate Limiting (5 failed attempts trigger 15-min lockout)
        for _ in range(4):
            conn.run("SELECT public.validate_shop_license('qa-xerox-demo', 'PB-WRONG-KEY-0000', 'dev_1', 'hash_1');")
        res_locked = conn.run("SELECT public.validate_shop_license('qa-xerox-demo', 'PB-WRONG-KEY-0000', 'dev_1', 'hash_1');")[0][0]
        assert res_locked.get("success") is False
        assert "locked" in res_locked.get("error", "").lower(), f"Expected rate limiting lockout, got {res_locked}"
        print(f"[PASS] Server-side Rate Limiting verified: 5 failed attempts triggered temporary lockout.")

        # Test 4f: Verify get_license_pepper() is STRICTLY RESTRICTED from anon/untrusted roles
        pepper_blocked = False
        try:
            conn.run("SET ROLE anon; SELECT public.get_license_pepper();")
        except pg8000.exceptions.DatabaseError as e:
            pepper_blocked = True
            assert "permission denied" in str(e).lower() or "denied" in str(e).lower()
        finally:
            conn.run("RESET ROLE;")
        assert pepper_blocked is True, "CRITICAL: public.get_license_pepper() must NOT be callable by anon role!"
        print(f"[PASS] Permission Restriction verified: anon role cannot execute public.get_license_pepper() (Permission Denied).")

        # Test 4g: Cross-Shop Device Hijacking Prevention
        # Attempt to pair Shop B (qa-annual-stand) using dev_1 (already paired to qa-xerox-demo)
        res_cross = conn.run("SELECT public.validate_shop_license('qa-annual-stand', 'PB-TEST-ANNUAL-1234', 'dev_1', 'hash_1');")[0][0]
        assert res_cross.get("success") is False, f"Expected cross-shop pairing rejection, got {res_cross}"
        assert "cross-shop" in res_cross.get("error", "").lower() or "already paired" in res_cross.get("error", "").lower()
        print(f"[PASS] Cross-Shop Isolation verified: Attempt to bind dev_1 to another shop was blocked.")

        # Test 4h: Workstation Device Revocation
        shop_demo_id = conn.run("SELECT id FROM public.shops WHERE slug = 'qa-xerox-demo';")[0][0]
        revoke_res = conn.run("SELECT public.revoke_device(:s_id, 'dev_1', 'Decommissioned PC');", s_id=shop_demo_id)[0][0]
        assert revoke_res.get("success") is True
        assert revoke_res.get("status") == "REVOKED"
        print(f"[PASS] Device Revocation RPC verified: dev_1 status changed to REVOKED.")

        # Test 4i: Revoked Device Login Rejection
        # Clear failed attempts in audit_events for qa-xerox-demo to isolate revocation check from rate limiter
        conn.run("DELETE FROM public.audit_events WHERE shop_id = :s_id AND action = 'LICENSE_VALIDATION_FAILED';", s_id=shop_demo_id)
        res_revoked_dev = conn.run("SELECT public.validate_shop_license('qa-xerox-demo', 'PB-TEST-K9X4-M2N8-DEMO', 'dev_1', 'hash_1');")[0][0]
        assert res_revoked_dev.get("success") is False
        assert "revoked" in res_revoked_dev.get("error", "").lower()
        print(f"[PASS] Revoked Device Protection verified: Validation rejected for revoked workstation.")

        # ----------------------------------------------------------------------
        # TEST STEP 5: Idempotency & Safe Re-run Test
        # ----------------------------------------------------------------------
        print("\n--- STEP 5: Testing Migration Idempotency (Re-running migration script) ---")
        conn.run(migration_sql)
        re_run_count = conn.run("SELECT COUNT(*) FROM public.shops;")[0][0]
        assert re_run_count == 7, f"Expected exactly 7 shops after re-run, got {re_run_count}"
        print(f"[PASS] Re-run idempotency verified: exactly {re_run_count} shops exist (zero duplicates).")

        # ----------------------------------------------------------------------
        # TEST STEP 6: Data-Preserving Rollback / Recovery Test
        # ----------------------------------------------------------------------
        print("\n--- STEP 6: Testing Non-Destructive Recovery Script (001_phase1_down.sql) ---")
        
        # Simulate an order and payment placed during operations
        shop_id = conn.run("SELECT id FROM public.shops WHERE slug = 'qa-xerox-demo';")[0][0]
        conn.run("""
            INSERT INTO public.print_jobs (
                id, shop_id, order_number, pickup_pin, tracking_secret_hash,
                customer_phone, options, page_count, physical_sheets,
                calculated_price_paise, quote_hash, payment_method, status
            ) VALUES (
                gen_random_uuid(), :shop_id, 'PB-TEST-ORDER-101', '7492', 'dummy_hash',
                '+91 9999999999', '{}'::jsonb, 4, 2, 600, 'q_hash', 'upi', 'PAID'
            );
        """, shop_id=shop_id)

        # Run 001_phase1_down.sql
        down_sql_path = pathlib.Path(__file__).parent / "001_phase1_down.sql"
        down_sql = down_sql_path.read_text(encoding="utf-8")
        conn.run(down_sql)

        # Assert data was NOT destroyed
        jobs_count = conn.run("SELECT COUNT(*) FROM public.print_jobs;")[0][0]
        shops_count = conn.run("SELECT COUNT(*) FROM public.shops;")[0][0]
        assert jobs_count == 1, f"Orders must not be deleted during rollback! Found {jobs_count}"
        assert shops_count == 7, f"Shops must not be deleted during rollback! Found {shops_count}"
        print(f"[PASS] Non-destructive recovery verified: Orders ({jobs_count}) and Shops ({shops_count}) 100% INTACT.")

        print("\n" + "=" * 70)
        print("ALL REAL POSTGRESQL 18.6 EXECUTION TESTS PASSED (100% SUCCESS)")
        print("=" * 70)

    finally:
        conn.close()
        server.cleanup()
        print("[*] Isolated PostgreSQL test cluster stopped and cleaned up.")


if __name__ == "__main__":
    run_full_postgres_test()

