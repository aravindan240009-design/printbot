-- ==============================================================================
-- Rollback Migration 003: Phase 5
-- ==============================================================================

DROP TABLE IF EXISTS booking_events CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS service_catalogues CASCADE;
