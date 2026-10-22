-- ==============================================================================
-- Rollback Migration 005: Phase 7 Tables
-- ==============================================================================

DROP TABLE IF EXISTS scanner_tasks CASCADE;
DROP TABLE IF EXISTS timed_copier_sessions CASCADE;
DROP TABLE IF EXISTS printer_telemetry_consumables CASCADE;
DROP TABLE IF EXISTS resumable_upload_sessions CASCADE;
DROP TABLE IF EXISTS prepaid_transactions CASCADE;
DROP TABLE IF EXISTS prepaid_corporate_accounts CASCADE;
DROP TABLE IF EXISTS shop_presets CASCADE;
