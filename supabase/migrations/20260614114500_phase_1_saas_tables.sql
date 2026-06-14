-- ============================================================================
-- Phase 1: SaaS Foundation Tables
-- Creates businesses, subscriptions, and business_users tables for multi-tenant
-- support. Does not modify any existing tables or workflows.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. businesses — Core tenant table
-- Each row represents an independent auto spa business using the platform.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'expired', 'suspended')),
  subscription_expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index: find businesses with expiring trials (for automated reminders)
CREATE INDEX IF NOT EXISTS idx_businesses_trial_end_date
  ON businesses(trial_end_date)
  WHERE subscription_status = 'trial';

-- Index: filter businesses by subscription state (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_status
  ON businesses(subscription_status);

-- Trigger: auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_businesses_updated_at ON businesses;
CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_businesses_updated_at();

-- Comment: table-level documentation
COMMENT ON TABLE businesses IS 'Tenant businesses using the AutoSpa Management System platform. Each business operates in an isolated data environment.';
COMMENT ON COLUMN businesses.id IS 'Unique identifier for the business (UUID v4)';
COMMENT ON COLUMN businesses.business_name IS 'Display name shown throughout the application';
COMMENT ON COLUMN businesses.logo_url IS 'URL to the business logo stored in Supabase Storage';
COMMENT ON COLUMN businesses.phone IS 'Business phone number for customer contact';
COMMENT ON COLUMN businesses.email IS 'Business email for receipts and communications';
COMMENT ON COLUMN businesses.address IS 'Physical address for invoicing and records';
COMMENT ON COLUMN businesses.trial_start_date IS 'When the 30-day free trial period began';
COMMENT ON COLUMN businesses.trial_end_date IS 'When the 30-day free trial period expires';
COMMENT ON COLUMN businesses.subscription_status IS 'Current subscription state: trial, active, expired, or suspended';
COMMENT ON COLUMN businesses.subscription_expiry_date IS 'When the current paid subscription expires';
COMMENT ON COLUMN businesses.created_at IS 'Timestamp when the business record was created';
COMMENT ON COLUMN businesses.updated_at IS 'Timestamp when the business record was last updated';


-- ----------------------------------------------------------------------------
-- 2. subscriptions — Payment history for business subscriptions
-- Tracks each subscription payment transaction per business.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  payment_provider TEXT,
  amount DECIMAL(10,2),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index: look up all subscriptions for a business
CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id
  ON subscriptions(business_id);

-- Index: find active subscriptions nearing expiry
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date
  ON subscriptions(end_date)
  WHERE status = 'active';

-- Index: sort subscriptions by most recent first
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at
  ON subscriptions(business_id, created_at DESC);

-- Comments
COMMENT ON TABLE subscriptions IS 'Subscription payment records for each business tenant.';
COMMENT ON COLUMN subscriptions.id IS 'Unique identifier for the subscription record';
COMMENT ON COLUMN subscriptions.business_id IS 'References the business that owns this subscription';
COMMENT ON COLUMN subscriptions.payment_provider IS 'Payment method used: paystack, mpesa, bank_transfer, etc.';
COMMENT ON COLUMN subscriptions.amount IS 'Amount paid for the subscription period';
COMMENT ON COLUMN subscriptions.start_date IS 'When the subscription period begins';
COMMENT ON COLUMN subscriptions.end_date IS 'When the subscription period ends';
COMMENT ON COLUMN subscriptions.status IS 'Current status: active, expired, or suspended';
COMMENT ON COLUMN subscriptions.created_at IS 'Timestamp when the subscription record was created';


-- ----------------------------------------------------------------------------
-- 3. business_users — Links Supabase Auth users to businesses
-- Each user can belong to exactly one business with a specific role.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'attendant'
    CHECK (role IN ('owner', 'manager', 'attendant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- A user can only belong to one business (enforced at application level)
  UNIQUE(user_id)
);

-- Index: find all users belonging to a business
CREATE INDEX IF NOT EXISTS idx_business_users_business_id
  ON business_users(business_id);

-- Index: find which business a user belongs to (authentication flow)
CREATE INDEX IF NOT EXISTS idx_business_users_user_id
  ON business_users(user_id);

-- Index: filter users by role within a business
CREATE INDEX IF NOT EXISTS idx_business_users_role
  ON business_users(business_id, role);

-- Comments
COMMENT ON TABLE business_users IS 'Maps Supabase Auth users to their business tenant and defines their role.';
COMMENT ON COLUMN business_users.id IS 'Unique identifier for the user-business mapping';
COMMENT ON COLUMN business_users.business_id IS 'References the business this user belongs to';
COMMENT ON COLUMN business_users.user_id IS 'References the Supabase Auth user (auth.users.id)';
COMMENT ON COLUMN business_users.role IS 'Access level: owner (full access), manager (operational), attendant (limited)';
COMMENT ON COLUMN business_users.created_at IS 'Timestamp when the user was linked to the business';
COMMENT ON COLUMN business_users.user_id IS 'Unique constraint ensures a user belongs to exactly one business';


-- ----------------------------------------------------------------------------
-- 4. Row-Level Security
-- Enable RLS on all new tables for tenant data isolation.
-- ----------------------------------------------------------------------------
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- businesses: users can read their own business record
CREATE POLICY "businesses_select_own"
  ON businesses
  FOR SELECT
  USING (
    id = (SELECT business_id FROM business_users WHERE user_id = auth.uid() LIMIT 1)
  );

-- businesses: owners can update their own business
CREATE POLICY "businesses_update_own"
  ON businesses
  FOR UPDATE
  USING (
    id = (SELECT business_id FROM business_users WHERE user_id = auth.uid() AND role = 'owner' LIMIT 1)
  )
  WITH CHECK (
    id = (SELECT business_id FROM business_users WHERE user_id = auth.uid() AND role = 'owner' LIMIT 1)
  );

-- subscriptions: users can view subscriptions for their own business
CREATE POLICY "subscriptions_select_own"
  ON subscriptions
  FOR SELECT
  USING (
    business_id = (SELECT business_id FROM business_users WHERE user_id = auth.uid() LIMIT 1)
  );

-- subscriptions: owners can insert subscriptions for their business
CREATE POLICY "subscriptions_insert_own"
  ON subscriptions
  FOR INSERT
  WITH CHECK (
    business_id = (SELECT business_id FROM business_users WHERE user_id = auth.uid() AND role = 'owner' LIMIT 1)
  );

-- business_users: users can read their own record
CREATE POLICY "business_users_select_self"
  ON business_users
  FOR SELECT
  USING (user_id = auth.uid());

-- business_users: owners can read and manage all users in their business
CREATE POLICY "business_users_select_business"
  ON business_users
  FOR SELECT
  USING (
    business_id = (SELECT business_id FROM business_users WHERE user_id = auth.uid() AND role = 'owner' LIMIT 1)
  );

CREATE POLICY "business_users_insert_business"
  ON business_users
  FOR INSERT
  WITH CHECK (
    business_id = (SELECT business_id FROM business_users WHERE user_id = auth.uid() AND role = 'owner' LIMIT 1)
  );

CREATE POLICY "business_users_update_business"
  ON business_users
  FOR UPDATE
  USING (
    business_id = (SELECT business_id FROM business_users WHERE user_id = auth.uid() AND role = 'owner' LIMIT 1)
  )
  WITH CHECK (
    business_id = (SELECT business_id FROM business_users WHERE user_id = auth.uid() AND role = 'owner' LIMIT 1)
  );

CREATE POLICY "business_users_delete_business"
  ON business_users
  FOR DELETE
  USING (
    business_id = (SELECT business_id FROM business_users WHERE user_id = auth.uid() AND role = 'owner' LIMIT 1)
  );


-- ============================================================================
-- Migration complete. Existing tables, pages, and workflows are untouched.
-- ============================================================================