# AutoSpa Management System — Implementation Phase 1

## Sprint Overview

Phase 1 establishes the SaaS foundation: multi-tenant business registration, trial management, role-based access, and data isolation — all while preserving every existing Crystal Cruize AutoSpa workflow unchanged.

### Goals

1. **Preserve** all existing Crystal Cruize functionality exactly as it works today.
2. **Create** the SaaS foundation (businesses, subscriptions, business_users tables).
3. **Enable** business registration with 30-day trial and isolated data environment.
4. **Do not modify** existing workflows — the existing single-business experience remains identical.

### Out of Scope

| Feature | Reason |
|---------|--------|
| Android application | Phase 3 |
| Electron desktop application | Phase 3 |
| Offline synchronization | Phase 4 |
| Paystack integration | Phase 1 of roadmap (business plan Phase 1) |
| M-Pesa integration | Future |
| SMS / email messaging | Future |
| Subscription payment collection | Phase 2 (manual subscription assignment for now) |

### Success Criteria

A business can register, receive a 30-day trial, log in, and operate in an isolated environment without affecting existing Crystal Cruize workflows.

---

## 1. Database Migration

### Migration File Location

`supabase/migrations/YYYYMMDDHHMMSS_phase_1_saas_foundation.sql`

### Migration Overview

Three new tables, modifications to existing tables, indexes, RLS policies, and a default business seed.

### 1.1 New Tables

#### businesses

```sql
CREATE TABLE businesses (
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

-- Index for trial expiry checks
CREATE INDEX idx_businesses_trial_end_date
  ON businesses(trial_end_date)
  WHERE subscription_status = 'trial';

-- Index for subscription lookups
CREATE INDEX idx_businesses_subscription_status
  ON businesses(subscription_status);
```

#### subscriptions

```sql
CREATE TABLE subscriptions (
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

CREATE INDEX idx_subscriptions_business_id ON subscriptions(business_id);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date)
  WHERE status = 'active';
```

#### business_users

```sql
CREATE TABLE business_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'attendant'
    CHECK (role IN ('owner', 'manager', 'attendant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_business_users_business_id ON business_users(business_id);
CREATE INDEX idx_business_users_user_id ON business_users(user_id);
```

### 1.2 Existing Table Modifications

Each existing table receives a nullable `business_id` column initially. This allows the existing application to continue running without changes during deployment.

```sql
-- Add business_id to all existing tables (nullable initially)
ALTER TABLE customers ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE transactions ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE services ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE addons ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE attendants ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE expenses ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE payroll ADD COLUMN business_id UUID REFERENCES businesses(id);

-- Indexes for tenant isolation
CREATE INDEX idx_customers_business_id ON customers(business_id);
CREATE INDEX idx_transactions_business_id ON transactions(business_id);
CREATE INDEX idx_services_business_id ON services(business_id);
CREATE INDEX idx_addons_business_id ON addons(business_id);
CREATE INDEX idx_attendants_business_id ON attendants(business_id);
CREATE INDEX idx_expenses_business_id ON expenses(business_id);
CREATE INDEX idx_payroll_business_id ON payroll(business_id);
```

### 1.3 Default Business Seed

```sql
-- Insert default business for existing Crystal Cruize AutoSpa data
INSERT INTO businesses (
  id,
  business_name,
  subscription_status,
  trial_start_date,
  trial_end_date
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Crystal Cruize AutoSpa',
  'active',
  now(),
  now() + INTERVAL '30 days'
);

-- Assign all existing records to the default business
UPDATE customers SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
UPDATE transactions SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
UPDATE services SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
UPDATE addons SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
UPDATE attendants SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
UPDATE expenses SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
UPDATE payroll SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;

-- Make business_id NOT NULL after population
ALTER TABLE customers ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE services ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE addons ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE attendants ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE expenses ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE payroll ALTER COLUMN business_id SET NOT NULL;

-- Link existing admin user to the default business
INSERT INTO business_users (business_id, user_id, role)
SELECT
  '00000000-0000-0000-0000-000000000001',
  id,
  'owner'
FROM auth.users
WHERE email = 'admin@crystalcruize.com'
ON CONFLICT (user_id) DO NOTHING;
```

### 1.4 Row-Level Security

```sql
-- Enable RLS on all tenant tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- RLS: Business isolation for all tenant tables
CREATE POLICY "tenant_isolation_select" ON customers FOR SELECT
  USING (business_id = (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "tenant_isolation_insert" ON customers FOR INSERT
  WITH CHECK (business_id = (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "tenant_isolation_update" ON customers FOR UPDATE
  USING (business_id = (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "tenant_isolation_delete" ON customers FOR DELETE
  USING (business_id = (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

-- Repeat for: transactions, services, addons, attendants, expenses, payroll

-- Business users can read their own business's user records
CREATE POLICY "business_users_self_select" ON business_users FOR SELECT
  USING (user_id = auth.uid());

-- Business owners can manage their business's users
CREATE POLICY "business_users_owner_insert" ON business_users FOR INSERT
  WITH CHECK (
    business_id = (SELECT business_id FROM business_users WHERE user_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "business_users_owner_update" ON business_users FOR UPDATE
  USING (
    business_id = (SELECT business_id FROM business_users WHERE user_id = auth.uid() AND role = 'owner')
  );

-- Businesses table: users can read their own business
CREATE POLICY "businesses_self_select" ON businesses FOR SELECT
  USING (id = (SELECT business_id FROM business_users WHERE user_id = auth.uid()));
```

> **Note:** RLS policies for `transactions`, `services`, `addons`, `attendants`, `expenses`, and `payroll` follow the exact same pattern as `customers` above. Each table gets `_select`, `_insert`, `_update`, and `_delete` policies scoped to `business_id`.

---

## 2. TypeScript Types

### File: `src/types/business.ts`

```typescript
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'suspended';

export type UserRole = 'owner' | 'manager' | 'attendant';

export interface Business {
  id: string;
  business_name: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  subscription_status: SubscriptionStatus;
  subscription_expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  payment_provider: string | null;
  amount: number | null;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'suspended';
  created_at: string;
}

export interface BusinessUser {
  id: string;
  business_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface RegisterBusinessInput {
  business_name: string;
  logo_url?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}
```

### Update Existing Types

File: `src/lib/auth-context.tsx` — Update the `UserRole` type:

```typescript
export type UserRole = "owner" | "manager" | "attendant";
```

The existing `User` interface should be extended to include `business_id`:

```typescript
export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  business_id?: string; // Added for Phase 1
}
```

---

## 3. New Service Module

### File: `src/integrations/supabase/business.ts`

This module encapsulates all business-related Supabase operations.

```typescript
import { supabase } from './client';
import type { Business, BusinessUser, RegisterBusinessInput, SubscriptionStatus, UserRole } from '@/types/business';

/**
 * Register a new business with a 30-day trial.
 * Creates the business record and links the registering user as owner.
 */
export async function registerBusiness(
  input: RegisterBusinessInput,
  userId: string
): Promise<{ business: Business | null; error: string | null }> {
  try {
    const trialStart = new Date().toISOString();
    const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Step 1: Create the business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        business_name: input.business_name,
        logo_url: input.logo_url || null,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
        trial_start_date: trialStart,
        trial_end_date: trialEnd,
        subscription_status: 'trial',
      })
      .select()
      .single();

    if (businessError) {
      return { business: null, error: businessError.message };
    }

    // Step 2: Link the registering user as owner
    const { error: userError } = await supabase
      .from('business_users')
      .insert({
        business_id: business.id,
        user_id: userId,
        role: 'owner',
      });

    if (userError) {
      // Rollback: delete the business if user linking fails
      await supabase.from('businesses').delete().eq('id', business.id);
      return { business: null, error: userError.message };
    }

    return { business, error: null };
  } catch (err) {
    return { business: null, error: 'An unexpected error occurred during registration' };
  }
}

/**
 * Get the current user's business.
 */
export async function getCurrentBusiness(): Promise<{ business: Business | null; error: string | null }> {
  try {
    const { data: businessUser, error: buError } = await supabase
      .from('business_users')
      .select('business_id')
      .eq('user_id', supabase.auth.getUser().then(r => r.data.user?.id))
      .single();

    if (buError || !businessUser) {
      return { business: null, error: 'No business found for current user' };
    }

    const { data: business, error: bError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessUser.business_id)
      .single();

    if (bError) {
      return { business: null, error: bError.message };
    }

    return { business, error: null };
  } catch (err) {
    return { business: null, error: 'Failed to fetch business data' };
  }
}

/**
 * Check if a business's trial has expired.
 */
export function isTrialExpired(business: Business): boolean {
  if (business.subscription_status === 'active') return false;
  if (business.subscription_status === 'suspended') return true;
  if (!business.trial_end_date) return false;
  return new Date(business.trial_end_date) < new Date();
}

/**
 * Get all users in the current business (owner/manager only).
 */
export async function getBusinessUsers(): Promise<{ users: BusinessUser[] | null; error: string | null }> {
  try {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) return { users: null, error: 'Not authenticated' };

    // Get current user's business
    const { data: myBusiness } = await supabase
      .from('business_users')
      .select('business_id')
      .eq('user_id', currentUser.data.user.id)
      .single();

    if (!myBusiness) return { users: null, error: 'No business found' };

    const { data: users, error } = await supabase
      .from('business_users')
      .select('*')
      .eq('business_id', myBusiness.business_id);

    if (error) return { users: null, error: error.message };
    return { users, error: null };
  } catch (err) {
    return { users: null, error: 'Failed to fetch business users' };
  }
}

/**
 * Update subscription status for a business (owner only).
 */
export async function updateSubscriptionStatus(
  businessId: string,
  status: SubscriptionStatus,
  expiryDate?: string
): Promise<{ success: boolean; error: string | null }> {
  const updateData: Record<string, any> = { subscription_status: status };
  if (expiryDate) {
    updateData.subscription_expiry_date = expiryDate;
  }

  const { error } = await supabase
    .from('businesses')
    .update(updateData)
    .eq('id', businessId);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}
```

---

## 4. Auth Context Updates

### File: `src/lib/auth-context.tsx` — Changes

The auth context must be updated to:
1. Fetch `business_id` from `business_users` table instead of (or in addition to) the old `user_roles` table.
2. Map existing "admin" role to "owner" and "attendant" to "attendant".
3. Include `business_id` in the User object.
4. During the transition period (Phase 1), support both old `profiles`/`user_roles` tables AND new `business_users` table so existing users continue to work.

```typescript
// Updated fetchUserProfile for Phase 1 compatibility
async function fetchUserProfile(supabaseUser: SupabaseUser): Promise<User | null> {
  // Phase 1: Try new business_users table first
  const { data: businessUser } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", supabaseUser.id)
    .single();

  if (businessUser) {
    // New flow: user is part of a business
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("user_id", supabaseUser.id)
      .single();

    // Map new roles
    const roleMap: Record<string, UserRole> = {
      owner: "owner",
      manager: "manager",
      attendant: "attendant",
    };

    return {
      id: supabaseUser.id,
      name: profile?.display_name || profile?.username || supabaseUser.email?.split("@")[0] || "User",
      role: roleMap[businessUser.role] || "attendant",
      email: supabaseUser.email,
      business_id: businessUser.business_id,
    };
  }

  // Fallback: old flow (existing Crystal Cruize users before migration)
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("user_id", supabaseUser.id)
    .single();

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", supabaseUser.id)
    .single();

  return {
    id: supabaseUser.id,
    name: profile?.display_name || profile?.username || supabaseUser.email?.split("@")[0] || "User",
    role: (roleData?.role === "admin" ? "owner" : "attendant") as UserRole,
    email: supabaseUser.email,
    // TODO: After Phase 1 migration, this fallback will be removed
    business_id: "00000000-0000-0000-0000-000000000001", // Default Crystal Cruize business
  };
}
```

### Updated User Interface

```typescript
export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  business_id?: string; // New field for Phase 1
}
```

### Updated AuthContextType

```typescript
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  businessId: string | null; // Exposed for use throughout the app
}
```

---

## 5. New Pages

### 5.1 Business Registration Page

**File:** `src/pages/RegisterBusinessPage.tsx`

A standalone registration page for new businesses.

**UI Fields:**
- Business Name (text input, required)
- Logo (file upload → Supabase Storage)
- Phone (text input, optional)
- Email (text input, optional)
- Address (textarea, optional)
- Admin Name (text input, required — creates user profile)
- Admin Email (email input, required — Supabase Auth signup)
- Admin Password (password input, required — Supabase Auth signup)

**Flow:**

```
RegisterBusinessPage
       │
       ▼
1. User fills business details + admin account
       │
       ▼
2. Create Supabase Auth account (signUp)
       │
       ▼
3. Create profile record (profiles table)
       │
       ▼
4. Call registerBusiness() → creates business + business_users
       │
       ▼
5. Auto-login → redirect to Dashboard
```

**Registration Form Component Structure:**

```typescript
function RegisterBusinessPage() {
  // State
  const [step, setStep] = useState(1); // 1: Business Info, 2: Admin Account
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [phone, setPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [address, setAddress] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Upload logo if provided
      let logoUrl = null;
      if (logo) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('business-logos')
          .upload(`${Date.now()}_${logo.name}`, logo);
        if (uploadError) throw uploadError;
        logoUrl = supabase.storage.from('business-logos').getPublicUrl(uploadData.path).data.publicUrl;
      }

      // 2. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create account');

      // 3. Create profile
      await supabase.from('profiles').insert({
        user_id: authData.user.id,
        display_name: adminName,
        username: adminEmail.split('@')[0],
      });

      // 4. Register business
      const { business, error: bizError } = await registerBusiness(
        {
          business_name: businessName,
          logo_url: logoUrl,
          phone,
          email: businessEmail,
          address,
        },
        authData.user.id
      );

      if (bizError) throw new Error(bizError);

      // 5. Auto-login
      await login(adminEmail, adminPassword);

      // Redirect to dashboard
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Render two-step form
  // Step 1: Business details
  // Step 2: Admin account details
  // Submit: handleRegister
}
```

**Routing Update** (`src/App.tsx` or router config):

```typescript
// Add registration route
<Route path="/register" element={<RegisterBusinessPage />} />
```

### 5.2 Trial Expired Page

**File:** `src/pages/TrialExpiredPage.tsx`

Displayed when a logged-in user's business trial has expired.

**Content:**
- Message: "Your 30-day free trial has expired."
- Business name and logo displayed.
- Contact/sales information for subscription purchase.
- Logout button.

```typescript
function TrialExpiredPage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">Trial Expired</h1>
        <p className="text-muted-foreground mb-6">
          Your 30-day free trial for has expired.
          Please contact sales to purchase a subscription.
        </p>
        <Button onClick={logout}>Sign Out</Button>
      </div>
    </div>
  );
}
```

---

## 6. Application Guard

The app must check trial status on every route transition and protect against expired trials.

### File: `src/components/TrialGuard.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getCurrentBusiness, isTrialExpired } from '@/integrations/supabase/business';
import type { Business } from '@/types/business';
import TrialExpiredPage from '@/pages/TrialExpiredPage';
import { LoadingSkeleton } from './skeletons';

interface TrialGuardProps {
  children: React.ReactNode;
}

export function TrialGuard({ children }: TrialGuardProps) {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Admin/staff of the default Crystal Cruize business are exempt
    if (user.business_id === '00000000-0000-0000-0000-000000000001') {
      setLoading(false);
      return;
    }

    getCurrentBusiness().then(({ business: biz }) => {
      setBusiness(biz);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <LoadingSkeleton />;
  if (!user) return <>{children}</>; // Let login page handle unauthenticated

  // Crystal Cruize default business users pass through
  if (user.business_id === '00000000-0000-0000-0000-000000000001') {
    return <>{children}</>;
  }

  // Check trial expiry
  if (business && isTrialExpired(business)) {
    return <TrialExpiredPage />;
  }

  return <>{children}</>;
}
```

### Integration Point

Wrap the authenticated app routes with `TrialGuard`:

```typescript
// Inside App.tsx or router layout
<ProtectedRoute>
  <TrialGuard>
    <AppLayout>
      <Outlet />
    </AppLayout>
  </TrialGuard>
</ProtectedRoute>
```

---

## 7. Business Registration Route

### Add Registration Page to Router

```typescript
// In App.tsx or router configuration
import RegisterBusinessPage from '@/pages/RegisterBusinessPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // Existing routes...
      { path: 'dashboard', element: <DashboardPage /> },
      // ...
    ],
  },
  // Public registration route (no auth required)
  { path: '/register', element: <RegisterBusinessPage /> },
  // Login
  { path: '/login', element: <LoginPage /> },
]);
```

### Add Navigation Link

On the login page, add a "Register a new business" link below the login form:

```typescript
// In LoginPage.tsx
<Link to="/register" className="text-sm text-primary hover:underline">
  Register a new business
</Link>
```

---

## 8. Data Isolation in Existing Pages

No existing pages need modification in Phase 1 because:

1. **Existing users** (Crystal Cruize) continue using the same `profiles` and `user_roles` fallback path.
2. **New business users** have `business_id` set automatically via the registration flow.
3. **RLS policies** enforce tenant isolation at the database level — no application code changes needed for SELECT/INSERT/UPDATE/DELETE operations.
4. **Existing queries** that do not include `WHERE business_id = ?` will naturally work because RLS filters at the database level.

**Future Phase 2 work** (not in Phase 1 scope):
- Refactor all service modules to explicitly include `business_id` in queries.
- Remove fallback to old `profiles`/`user_roles` tables.
- Migrate all existing data references to use `business_id` explicitly in application code.

---

## 9. Seed Data for Existing Users

### Migration SQL

```sql
-- Run this migration to link existing users to the default business
-- This ensures existing Crystal Cruize users continue working after Phase 1 deployment

INSERT INTO business_users (business_id, user_id, role)
SELECT
  '00000000-0000-0000-0000-000000000001',
  p.user_id,
  CASE
    WHEN ur.role = 'admin' THEN 'owner'
    ELSE 'attendant'
  END
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.user_id
ON CONFLICT (user_id) DO NOTHING;
```

---

## 10. Rollback Plan

### Pre-Deployment Checklist

- [ ] Take a full database backup (Supabase project dump).
- [ ] Record current count of records in each table for verification.
- [ ] Run migration in a staging environment first.
- [ ] Verify existing Crystal Cruzie users can log in and see all data.
- [ ] Verify RLS does not block existing queries.

### Rollback Steps (if needed)

1. **Drop new tables:**
   ```sql
   DROP TABLE IF EXISTS business_users CASCADE;
   DROP TABLE IF EXISTS subscriptions CASCADE;
   DROP TABLE IF EXISTS businesses CASCADE;
   ```

2. **Remove added columns:**
   ```sql
   ALTER TABLE customers DROP COLUMN IF EXISTS business_id;
   ALTER TABLE transactions DROP COLUMN IF EXISTS business_id;
   ALTER TABLE services DROP COLUMN IF EXISTS business_id;
   ALTER TABLE addons DROP COLUMN IF EXISTS business_id;
   ALTER TABLE attendants DROP COLUMN IF EXISTS business_id;
   ALTER TABLE expenses DROP COLUMN IF EXISTS business_id;
   ALTER TABLE payroll DROP COLUMN IF EXISTS business_id;
   ```

3. **Restore auth context** to pre-Phase 1 version (revert `fetchUserProfile`).
4. **Remove registration route** and `RegisterBusinessPage`.
5. **Remove `TrialGuard`** from app layout.

---

## 11. Testing Plan

### Test Case Matrix

| # | Test Case | Expected Result | Type |
|---|-----------|----------------|------|
| 1 | Existing Crystal Cruize user logs in | Sees all existing data, all workflows work | Regression |
| 2 | Existing Crystal Cruize user creates a customer | Customer saved to default business | Regression |
| 3 | Existing Crystal Cruize user creates a transaction | Transaction saved to default business | Regression |
| 4 | New business registers via `/register` | Business created, user linked as owner | Integration |
| 5 | New business user logs in | Sees empty dashboard (no data) | Integration |
| 6 | New business user creates a customer | Customer saved to new business only | Integration |
| 7 | New business user creates a transaction | Transaction saved to new business only | Integration |
| 8 | Trial expiry (manually set trial_end_date to past) | User sees Trial Expired page, cannot create records | Integration |
| 9 | Subscription active (set subscription_status to 'active') | User can create records normally | Integration |
| 10 | RLS cross-business check | Business A user cannot access Business B data | Security |
| 11 | User with role 'attendant' logs in | Sees same data but limited UI options | Authorization |
| 12 | Two businesses with same customer name | Each sees only their own customer record | Isolation |

### Regression Test Suite

Run the full existing test suite to verify no functionality is broken:

```bash
npm test
```

All existing tests must pass before Phase 1 is considered complete.

---

## 12. Implementation Timeline

| Task | Duration | Dependencies |
|------|----------|--------------|
| Create migration SQL | 1 day | None |
| Create TypeScript types | 0.5 day | Migration SQL |
| Create business service module | 1 day | Types |
| Update auth context | 1 day | Types, business service |
| Create RegisterBusinessPage | 2 days | Auth context, business service |
| Create TrialExpiredPage | 0.5 day | Business service |
| Create TrialGuard component | 0.5 day | Business service, auth context |
| Add registration route | 0.5 day | RegisterBusinessPage |
| Seed existing users to default business | 0.5 day | Migration SQL |
| RLS policy creation & testing | 1 day | Migration SQL |
| Regression testing | 1 day | All above |
| Deployment | 0.5 day | All above |
| **Total** | **~9.5 days** | |

---

## 13. Files to Create

| File | Purpose |
|------|---------|
| `src/types/business.ts` | TypeScript types for businesses, subscriptions, business_users |
| `src/integrations/supabase/business.ts` | Business service module (register, fetch, check trial) |
| `src/pages/RegisterBusinessPage.tsx` | Business registration form (2-step) |
| `src/pages/TrialExpiredPage.tsx` | Trial expired notice page |
| `src/components/TrialGuard.tsx` | Route guard checking trial status |
| `supabase/migrations/YYYYMMDDHHMMSS_phase_1_saas_foundation.sql` | Database migration |

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/auth-context.tsx` | Update `UserRole`, add `business_id` to `User`, update `fetchUserProfile` with fallback |
| Router configuration (App.tsx or router file) | Add `/register` route, wrap authenticated routes with `TrialGuard` |
| `src/pages/LoginPage.tsx` | Add "Register a new business" link |

---

## 14. Architecture Diagram (Phase 1 Scope)

```
┌─────────────────────────────────────────────────────────────────┐
│                   Phase 1 Architecture                            │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                     Existing Application                    │   │
│  │  (All current pages, components, hooks, workflows)         │   │
│  │  - Dashboard, Customers, Transactions, Services,           │   │
│  │    Add-ons, Attendants, Expenses, Payroll, Reports         │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              │                                     │
│                              ▼                                     │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                     TrialGuard (New)                        │   │
│  │  Checks trial status on every route. Redirects to           │   │
│  │  TrialExpiredPage if expired. Crystal Cruize users are      │   │
│  │  exempt (always pass through).                              │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              │                                     │
│           ┌──────────────────┴──────────────────┐                 │
│           ▼                                     ▼                 │
│  ┌────────────────────┐              ┌────────────────────┐       │
│  │  Auth Context       │              │  Business Service   │       │
│  │  (Updated)          │◄────────────►│  (New)               │       │
│  │  - Reads business_users│           │  - registerBusiness  │       │
│  │  - Includes business_id │           │  - getCurrentBusiness │       │
│  │  - Fallback to old     │           │  - isTrialExpired    │       │
│  │    profiles/user_roles │           │  - getBusinessUsers  │       │
│  └────────────────────┘              └────────────────────┘       │
│                              │                                     │
│                              ▼                                     │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                  Supabase Database (Updated)                │   │
│  │                                                             │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐     │   │
│  │  │ businesses│  │ subscriptions │  │ business_users   │     │   │
│  │  │ (NEW)     │  │ (NEW)        │  │ (NEW)            │     │   │
│  │  └──────────┘  └──────────────┘  └──────────────────┘     │   │
│  │                                                             │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐     │   │
│  │  │ customers│  │ transactions │  │ services         │     │   │
│  │  │ (+biz_id)│  │ (+biz_id)    │  │ (+biz_id)        │     │   │
│  │  └──────────┘  └──────────────┘  └──────────────────┘     │   │
│  │                                                             │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐     │   │
│  │  │ addons   │  │ attendants   │  │ expenses          │     │   │
│  │  │ (+biz_id)│  │ (+biz_id)    │  │ (+biz_id)         │     │   │
│  │  └──────────┘  └──────────────┘  └──────────────────┘     │   │
│  │                                                             │   │
│  │  ┌──────────┐                                               │   │
│  │  │ payroll  │                                               │   │
│  │  │ (+biz_id)│                                               │   │
│  │  └──────────┘                                               │   │
│  │                                                             │   │
│  │  Row-Level Security (RLS) applied to ALL tables             │   │
│  │  Default business seed: Crystal Cruize AutoSpa              │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  New Pages:                                                 │   │
│  │  - /register (RegisterBusinessPage)                         │   │
│  │  - /trial-expired (TrialExpiredPage)                        │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 15. Success Verification

After Phase 1 implementation, verify the following:

- [ ] Existing Crystal Cruize users can log in with existing credentials.
- [ ] All existing Crystal Cruzie data is visible (customers, transactions, etc.).
- [ ] All existing workflows function identically (create customer, transaction, etc.).
- [ ] A new business can register at `/register`.
- [ ] The new business user can log in and sees an empty (but functional) environment.
- [ ] The new business's records are isolated — Crystal Cruize cannot see them and vice versa.
- [ ] A business with an expired trial sees the Trial Expired page and cannot create records.
- [ ] Setting subscription_status to 'active' restores full access.
- [ ] All existing tests pass.
- [ ] RLS policies are active and correctly scoping queries.