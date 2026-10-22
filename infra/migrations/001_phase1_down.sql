-- ==============================================================================
-- Print Bot SaaS Phase 1 Production Rollback Migration (DOWN)
-- ==============================================================================

DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS webhook_inbox CASCADE;
DROP TABLE IF EXISTS payment_ledger CASCADE;
DROP TABLE IF EXISTS job_events CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS pricing_versions CASCADE;
DROP TABLE IF EXISTS guest_sessions CASCADE;
DROP TABLE IF EXISTS printer_capability_snapshots CASCADE;
DROP TABLE IF EXISTS printers CASCADE;
DROP TABLE IF EXISTS device_heartbeats CASCADE;
DROP TABLE IF EXISTS device_public_keys CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS device_pairing_codes CASCADE;
DROP TABLE IF EXISTS billing_events CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS shop_memberships CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS shop_settings CASCADE;
DROP TABLE IF EXISTS qr_links CASCADE;
DROP TABLE IF EXISTS shop_profiles CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
