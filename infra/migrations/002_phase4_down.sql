-- ==============================================================================
-- Rollback Migration 002: Phase 4
-- ==============================================================================

DROP TABLE IF EXISTS daily_settlement_reconciliations CASCADE;
DROP TABLE IF EXISTS merchant_payment_configs CASCADE;
DROP TABLE IF EXISTS outbox_events CASCADE;

ALTER TABLE orders DROP COLUMN IF EXISTS lease_expires_at;
ALTER TABLE orders DROP COLUMN IF EXISTS refund_id;
ALTER TABLE orders DROP COLUMN IF EXISTS rejection_reason;
ALTER TABLE orders DROP COLUMN IF EXISTS hold_reason;
ALTER TABLE orders DROP COLUMN IF EXISTS booking_state;
ALTER TABLE orders DROP COLUMN IF EXISTS version;
