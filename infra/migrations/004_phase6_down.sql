-- ==============================================================================
-- Rollback Migration 004: Phase 6 Tables
-- ==============================================================================

DROP TABLE IF EXISTS shop_tax_invoices CASCADE;
DROP TABLE IF EXISTS diagnostic_bundles CASCADE;
DROP TABLE IF EXISTS device_security_alerts CASCADE;
DROP TABLE IF EXISTS agent_fleet_releases CASCADE;
DROP TABLE IF EXISTS admin_step_up_challenges CASCADE;
DROP TABLE IF EXISTS break_glass_sessions CASCADE;
