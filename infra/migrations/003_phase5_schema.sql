-- ==============================================================================
-- Migration 003: Phase 5 Timed Xerox, Physical Bookings & Scheduling Schema
-- ==============================================================================

-- 1. Service Catalogues (Per-shop service availability, hours, and policies)
CREATE TABLE IF NOT EXISTS service_catalogues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    time_zone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    services_enabled JSONB NOT NULL DEFAULT '{"SCHEDULE_PRINT": true, "READY_BY_SLOT": true, "PHYSICAL_XEROX_BOOKING": true, "TIMED_SELF_SERVICE_COPIER": false}'::jsonb,
    slot_duration_minutes INT NOT NULL DEFAULT 15,
    capacity_per_slot INT NOT NULL DEFAULT 4,
    lead_time_minutes INT NOT NULL DEFAULT 30,
    last_booking_cutoff_minutes INT NOT NULL DEFAULT 60,
    operating_hours JSONB NOT NULL DEFAULT '{"monday_to_saturday": {"open": "08:30", "close": "21:30"}, "sunday": {"open": "10:00", "close": "18:00"}}'::jsonb,
    closed_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
    rush_surcharge_paise INT NOT NULL DEFAULT 2000,
    minimum_bill_paise INT NOT NULL DEFAULT 1000,
    cancellation_cutoff_minutes INT NOT NULL DEFAULT 60,
    counter_checkin_method VARCHAR(50) NOT NULL DEFAULT 'QR_AND_PIN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_service_catalogues_shop UNIQUE (shop_id)
);

CREATE INDEX IF NOT EXISTS idx_service_catalogues_shop ON service_catalogues (shop_id);

-- 2. Bookings (Durable time reservations for digital and physical Xerox)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('SCHEDULE_PRINT', 'READY_BY_SLOT', 'PHYSICAL_XEROX_BOOKING', 'TIMED_SELF_SERVICE_COPIER')),
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'MISSED_SLOT')),
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    slot_start TIMESTAMPTZ NOT NULL,
    slot_end TIMESTAMPTZ NOT NULL,
    pickup_code VARCHAR(10) NOT NULL,
    estimated_pages INT NOT NULL DEFAULT 1,
    revised_pages INT,
    quoted_paise INT NOT NULL,
    revised_paise INT,
    is_physical_originals_required BOOLEAN NOT NULL DEFAULT FALSE,
    human_instruction TEXT NOT NULL,
    staff_assigned_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    notes TEXT,
    checked_in_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_shop_slot ON bookings (shop_id, slot_start);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_code ON bookings (shop_id, pickup_code);

-- 3. Booking Events (Immutable audit lineage for status changes & revisions)
CREATE TABLE IF NOT EXISTS booking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_events_booking ON booking_events (booking_id);

-- 4. Enable and Force Row Level Security (RLS)
ALTER TABLE service_catalogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalogues FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_service_catalogues ON service_catalogues;
CREATE POLICY tenant_isolation_service_catalogues ON service_catalogues
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_bookings ON bookings;
CREATE POLICY tenant_isolation_bookings ON bookings
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_booking_events ON booking_events;
CREATE POLICY tenant_isolation_booking_events ON booking_events
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );
