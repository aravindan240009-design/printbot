-- ==============================================================================
-- PRINTEXPRESS ADMIN DATABASE SCHEMA
-- Target Database: "admin" Supabase Project
-- Purpose: Super Admin Control Plane, Shop Registrations, Licenses, Subscriptions
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. SHOPS TABLE (Registered Print & Xerox Shops)
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,             -- URL slug (e.g. 'vanakkam-xerox')
    name VARCHAR(255) NOT NULL,                    -- Shop display name
    owner_name VARCHAR(255) NOT NULL DEFAULT '',
    owner_email VARCHAR(255) NOT NULL DEFAULT '',
    owner_phone VARCHAR(50) NOT NULL DEFAULT '',
    city VARCHAR(100) NOT NULL DEFAULT '',
    state VARCHAR(100) NOT NULL DEFAULT 'Tamil Nadu',
    address TEXT NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'   -- 'ACTIVE', 'SUSPENDED', 'PENDING'
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
    
    -- Connection or cluster routing info for future scaling
    shop_db_cluster VARCHAR(100) NOT NULL DEFAULT 'default_shop_db',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for instant lookup by shop slug (e.g. printexpress.in/vanakkam-xerox)
CREATE INDEX IF NOT EXISTS idx_shops_slug ON public.shops(slug);
CREATE INDEX IF NOT EXISTS idx_shops_status ON public.shops(status);

-- 2. SUBSCRIPTIONS TABLE (SaaS Plans & Expiry Tracking)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    plan_code VARCHAR(50) NOT NULL DEFAULT 'STANDARD'
        CHECK (plan_code IN ('TRIAL', 'STANDARD', 'PRO', 'ENTERPRISE')),
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY'
        CHECK (billing_cycle IN ('MONTHLY', 'ANNUAL', 'LIFETIME')),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiry_date TIMESTAMPTZ NOT NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_shop_id ON public.subscriptions(shop_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_expiry ON public.subscriptions(status, expiry_date);

-- 3. LICENSES TABLE (Tauri / Workstation PC Activation & Device Locks)
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    license_key VARCHAR(100) UNIQUE NOT NULL,      -- e.g. 'PEXP-VX78-9921-2026'
    device_id VARCHAR(255),                        -- Machine fingerprint (hardware UUID)
    device_name VARCHAR(100) DEFAULT 'Workstation 1',
    max_devices INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')),
    activated_at TIMESTAMPTZ,
    last_heartbeat_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licenses_shop_id ON public.licenses(shop_id);
CREATE INDEX IF NOT EXISTS idx_licenses_key ON public.licenses(license_key);

-- 4. SUBSCRIPTION PAYMENTS TABLE (Platform Revenue / Billing History)
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    gateway VARCHAR(50) NOT NULL DEFAULT 'RAZORPAY' CHECK (gateway IN ('RAZORPAY', 'STRIPE', 'UPI_MANUAL')),
    gateway_order_id VARCHAR(100),
    gateway_payment_id VARCHAR(100),
    amount_paise BIGINT NOT NULL,                  -- 99900 = ₹999.00
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS'
        CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_payments_shop_id ON public.subscription_payments(shop_id);

-- 5. ADMIN AUDIT LOGS (Super Admin Action Traceability)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,                  -- 'ACTIVATE_SHOP', 'SUSPEND_SHOP', 'ISSUE_LICENSE'
    target_shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Admin DB is purely for Super Admin backend operations (Protected by Service Role Key)
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Notice: No public access policies created by default. Only service_role can access Admin DB.

