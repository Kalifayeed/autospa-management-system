# AutoSpa Management System — Database Evolution Plan

## Goal

Preserve all existing Crystal Cruize AutoSpa tables and workflows while introducing business (tenant) isolation. The database must evolve from a single-business schema to a multi-tenant SaaS schema without breaking any existing functionality.

---

## 1. Current Database State

The existing Crystal Cruize AutoSpa database contains the following tables, all operating under a single implicit business (no `business_id` scoping):

| Table | Purpose |
|-------|---------|
| `customers` | Customer information |
| `transactions` | Payment and billing records |
| `services` | Service catalog with pricing |
| `addons` | Additional service options |
| `attendants` | Staff profiles and roles |
| `expenses` | Business expense tracking |
| `payroll` | Staff payroll records |
| `reports` | Saved report configurations |

These tables have no tenant awareness — all records belong to the single Crystal Cruize AutoSpa business.

---

## 2. Target Database State

The evolved database introduces tenant isolation while preserving all existing tables and workflows. Three new tables are added (`businesses`, `subscriptions`, `business_users`), and all existing tables receive a `business_id` foreign key.

```
┌─────────────────────────────────────────────────────┐
│                  Target Schema                        │
│                                                       │
│  ┌──────────────┐                                    │
│  │  businesses   │◄────────────────────────────┐     │
│  └──────┬───────┘                              │     │
│         │                                      │     │
│         │  ┌──────────────────┐                │     │
│         ├──│  business_users   │                │     │
│         │  └──────────────────┘                │     │
│         │                                      │     │
│         │  ┌──────────────────┐                │     │
│         ├──│  subscriptions    │                │     │
│         │  └──────────────────┘                │     │
│         │                                      │     │
│         ├─── customers (add business_id)        │     │
│         ├─── transactions (add business_id)     │     │
│         ├─── services (add business_id)         │     │
│         ├─── addons (add business_id)           │     │
│         ├─── attendants (add business_id)       │     │
│         ├─── expenses (add business_id)         │     │
│         ├─── payroll (add business_id)          │     │
│         └─── reports (add business_id)          │     │
└─────────────────────────────────────────────────────┘
```

---

## 3. New Tables

### 3.1 businesses

This is the core tenant table. Every record in the system belongs to exactly one business.

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
  subscription_status TEXT NOT NULL DEFAULT 'trial',
    -- Values: 'trial', 'active', 'expired', 'cancelled', 'past_due'
  subscription_expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for lookup by subscription status (for admin reporting)
CREATE INDEX idx_businesses_subscription_status ON businesses(subscription_status);

-- Index for trial expiry checks (for automated reminders)
CREATE INDEX idx_businesses_trial_end_date ON businesses(trial_end_date)
  WHERE subscription_status = 'trial';
```

**Field Descriptions:**
| Field | Purpose |
|-------|---------|
| `id` | Unique identifier for the business (UUID) |
| `business_name` | Display name used throughout the application |
| `logo_url` | URL to the business logo in Supabase Storage |
| `phone` | Business phone number for customer contact |
| `email` | Business email for receipts and communications |
| `address` | Physical address for invoicing |
| `trial_start_date` | When the 30-day trial began |
| `trial_end_date` | When the trial expires (trial_start_date + 30 days) |
| `subscription_status` | Current subscription state |
| `subscription_expiry_date` | When the paid subscription expires |
| `created_at` | Record creation timestamp |
| `updated_at` | Record last-updated timestamp |

### 3.2 subscriptions

Tracks payment history for each business's subscription.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  payment_provider TEXT NOT NULL,
    -- Values: 'paystack', 'mpesa', 'bank_transfer'
  amount DECIMAL(10,2) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
    -- Values: 'active', 'expired', 'refunded', 'cancelled'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for business subscription lookup
CREATE INDEX idx_subscriptions_business_id ON subscriptions(business_id);

-- Index for finding expiring subscriptions
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date)
  WHERE status = 'active';
```

**Field Descriptions:**
| Field | Purpose |
|-------|---------|
| `id` | Unique identifier (UUID) |
| `business_id` | References the business that owns this subscription |
| `payment_provider` | Which payment method was used |
| `amount` | Amount paid for the subscription |
| `start_date` | When the subscription period starts |
| `end_date` | When the subscription period ends |
| `status` | Current status of this subscription payment |
| `created_at` | Record creation timestamp |

### 3.3 business_users

Links Supabase Auth users to businesses, defining roles within each business.

```sql
CREATE TABLE business_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff',
    -- Values: 'admin', 'staff'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Index for finding all users in a business
CREATE INDEX idx_business_users_business_id ON business_users(business_id);

-- Index for finding which business a user belongs to
CREATE INDEX idx_business_users_user_id ON business_users(user_id);
```

**Field Descriptions:**
| Field | Purpose |
|-------|---------|
| `id` | Unique identifier (UUID) |
| `business_id` | References the business this user belongs to |
| `user_id` | References `auth.users.id` (Supabase Auth) |
| `role` | Access level within the business |
| `created_at` | Record creation timestamp |

**Constraint Notes:**
- `UNIQUE(user_id)` ensures a user can only belong to one business. If multi-business user access is needed later, this constraint can be relaxed.
- `ON DELETE CASCADE` ensures that when a business is removed, its user associations are cleaned up.

---

## 4. Modifications to Existing Tables

Each existing table receives a `business_id` column. Existing records will be assigned to a default business (see Migration Strategy).

### 4.1 customers

```sql
ALTER TABLE customers ADD COLUMN business_id UUID REFERENCES businesses(id);
CREATE INDEX idx_customers_business_id ON customers(business_id);
```

**Impact on existing workflows:** None. The `business_id` column is nullable initially and populated during migration Phase 2.

### 4.2 transactions

```sql
ALTER TABLE transactions ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE transactions ADD COLUMN sync_status TEXT DEFAULT 'synced';
  -- Values: 'synced', 'pending', 'conflicted'
ALTER TABLE transactions ADD COLUMN local_id TEXT;
CREATE INDEX idx_transactions_business_id ON transactions(business_id);
CREATE INDEX idx_transactions_sync ON transactions(sync_status);

-- For duplicate vehicle check
CREATE INDEX idx_transactions_vehicle_time ON transactions(vehicle_id, created_at);
```

**Impact on existing workflows:** The `sync_status` and `local_id` columns are added in preparation for offline support but do not affect current functionality.

### 4.3 services

```sql
ALTER TABLE services ADD COLUMN business_id UUID REFERENCES businesses(id);
CREATE INDEX idx_services_business_id ON services(business_id);
```

### 4.4 addons

```sql
ALTER TABLE addons ADD COLUMN business_id UUID REFERENCES businesses(id);
CREATE INDEX idx_addons_business_id ON addons(business_id);
```

### 4.5 attendants

```sql
ALTER TABLE attendants ADD COLUMN business_id UUID REFERENCES businesses(id);
CREATE INDEX idx_attendants_business_id ON attendants(business_id);
```

### 4.6 expenses

```sql
ALTER TABLE expenses ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE expenses ADD COLUMN sync_status TEXT DEFAULT 'synced';
CREATE INDEX idx_expenses_business_id ON expenses(business_id);
CREATE INDEX idx_expenses_sync ON expenses(sync_status);
```

### 4.7 payroll

```sql
ALTER TABLE payroll ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE payroll ADD COLUMN sync_status TEXT DEFAULT 'synced';
CREATE INDEX idx_payroll_business_id ON payroll(business_id);
CREATE INDEX idx_payroll_sync ON payroll(sync_status);
```

### 4.8 reports

```sql
ALTER TABLE reports ADD COLUMN business_id UUID REFERENCES businesses(id);
CREATE INDEX idx_reports_business_id ON reports(business_id);
```

---

## 5. Migration Strategy (Phased)

The migration is executed in three phases to ensure zero disruption to existing Crystal Cruize AutoSpa functionality.

### Phase 1 — Schema Preparation (Non-Disruptive)

**Objective:** Create new tables and add columns to existing tables without modifying any application code or workflows.

**Steps:**

1. Create the `businesses` table.
2. Create the `subscriptions` table.
3. Create the `business_users` table.
4. Add `business_id` columns to all existing tables (customers, transactions, services, addons, attendants, expenses, payroll, reports).
5. Add `sync_status` and `local_id` columns to tables that require offline support (transactions, expenses, payroll).
6. Create all indexes.

**Application behavior during Phase 1:**
- Existing application code continues to work unchanged.
- New columns are nullable, so existing queries that do not reference them are unaffected.
- No application code changes are deployed yet.

**SQL Execution Order:**

```sql
-- 1. New tables (no dependencies)
CREATE TABLE businesses (...);
CREATE TABLE subscriptions (...);
CREATE TABLE business_users (...);

-- 2. ALTER existing tables (add nullable business_id)
ALTER TABLE customers ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE transactions ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE services ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE addons ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE attendants ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE expenses ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE payroll ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE reports ADD COLUMN business_id UUID REFERENCES businesses(id);

-- 3. Offline support columns (nullable)
ALTER TABLE transactions ADD COLUMN sync_status TEXT DEFAULT 'synced';
ALTER TABLE transactions ADD COLUMN local_id TEXT;
ALTER TABLE expenses ADD COLUMN sync_status TEXT DEFAULT 'synced';
ALTER TABLE payroll ADD COLUMN sync_status TEXT DEFAULT 'synced';

-- 4. Indexes
CREATE INDEX ...;
```

### Phase 2 — Data Migration (Single-Business Continuity)

**Objective:** Create a default business record for Crystal Cruize AutoSpa and assign all existing data to it. Application code is updated to respect `business_id`.

**Steps:**

1. Create a default business record:

```sql
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
```

2. Create a business user record for the existing admin:

```sql
INSERT INTO business_users (business_id, user_id, role)
SELECT
  '00000000-0000-0000-0000-000000000001',
  id,
  'admin'
FROM auth.users
WHERE email = 'admin@crystalcruize.com';  -- or appropriate query
```

3. Update all existing records to reference the default business:

```sql
UPDATE customers SET business_id = '00000000-0000-0000-0000-000000000001'
  WHERE business_id IS NULL;
UPDATE transactions SET business_id = '00000000-0000-0000-0000-000000000001'
  WHERE business_id IS NULL;
UPDATE services SET business_id = '00000000-0000-0000-0000-000000000001'
  WHERE business_id IS NULL;
UPDATE addons SET business_id = '00000000-0000-0000-0000-000000000001'
  WHERE business_id IS NULL;
UPDATE attendants SET business_id = '00000000-0000-0000-0000-000000000001'
  WHERE business_id IS NULL;
UPDATE expenses SET business_id = '00000000-0000-0000-0000-000000000001'
  WHERE business_id IS NULL;
UPDATE payroll SET business_id = '00000000-0000-0000-0000-000000000001'
  WHERE business_id IS NULL;
UPDATE reports SET business_id = '00000000-0000-0000-0000-000000000001'
  WHERE business_id IS NULL;
```

4. Make `business_id` NOT NULL after data is populated:

```sql
ALTER TABLE customers ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE services ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE addons ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE attendants ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE expenses ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE payroll ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE reports ALTER COLUMN business_id SET NOT NULL;
```

5. Enable Row-Level Security on all tenant tables and create RLS policies.

**Application changes deployed in Phase 2:**

- All queries are updated to include `WHERE business_id = current_business_id`.
- All INSERT statements include `business_id`.
- The application reads the current user's `business_id` from `business_users` on login.
- Existing Crystal Cruize AutoSpa users see exactly the same data as before — no visible change.

**Verification:** Run existing test suite. All tests should pass because:
- The same data is visible (business_id filter matches all records).
- All existing workflows behave identically.

### Phase 3 — Multi-Business Registration (SaaS Enablement)

**Objective:** Allow new businesses to register and begin using the platform.

**Steps:**

1. Deploy the business onboarding flow:
   - Registration form collecting business name, logo, phone, email, address.
   - Creates a new `businesses` record with `subscription_status = 'trial'`.
   - Creates a new `business_users` record linking the registering user.

2. Deploy subscription management:
   - Trial expiry checks (cron job or Supabase Edge Function).
   - Subscription payment flow (Paystack / M-Pesa integration).
   - Automatic restriction of write operations when trial/subscription expires.

3. Deploy RLS policies (created in Phase 2, enforced now for all businesses):
   - Each business can only read/write its own records.
   - Cross-business data access is impossible.

**New business registration flow:**

```
User fills registration form
       │
       ▼
Create business record
(subscription_status = 'trial',
 trial_start_date = now(),
 trial_end_date = now() + 30 days)
       │
       ▼
Create business_users record
(user_id = registering user,
 role = 'admin')
       │
       ▼
Redirect to login
       │
       ▼
User logs in → app reads business_id
           → all queries filtered by business_id
```

---

## 6. Security Implementation

### Row-Level Security (RLS)

RLS is enabled on all tenant-scoped tables after data migration in Phase 2.

```sql
-- Enable RLS on all tenant tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Generic RLS policy template for all tenant tables
CREATE POLICY "business_isolation"
ON customers
FOR ALL
USING (
  business_id = (SELECT business_id FROM business_users WHERE user_id = auth.uid())
)
WITH CHECK (
  business_id = (SELECT business_id FROM business_users WHERE user_id = auth.uid())
);
```

This policy ensures:
- **SELECT:** Users can only see rows where `business_id` matches their own.
- **INSERT:** Users can only create rows with their own `business_id`.
- **UPDATE:** Users can only modify rows belonging to their own business.
- **DELETE:** Users can only delete rows belonging to their own business.

### Application-Level Security

In addition to RLS, application code enforces:

1. **Business context injection:** Every query includes the current `business_id` from the authenticated session.
2. **API route guards:** Server-side checks ensure the requested `business_id` matches the authenticated user's business.
3. **No cross-business endpoints:** There are no API routes that accept or return data from multiple businesses.

### Default Business Protection

The default Crystal Cruize AutoSpa business record is protected:
- Only the original admin user can modify it.
- It cannot be deleted.
- Its `business_id` is well-known (`00000000-0000-0000-0000-000000000001`) but inaccessible to other tenants via RLS.

---

## 7. Offline Support Considerations

### Local Storage of business_id

For offline support, `business_id` is stored locally alongside each record. This ensures:

1. **Offline record creation:** New records created offline include the `business_id` so the sync engine knows which business they belong to.
2. **Sync filtering:** When syncing, only records matching the device's `business_id` are uploaded and downloaded.
3. **Data integrity:** A device cannot accidentally sync data from one business into another business's scope.

### Local Database Schema

The local database (IndexedDB for web, SQLite for Android/Desktop) mirrors the cloud schema including `business_id`:

```typescript
interface LocalRecord {
  id: string;           // Client-generated UUID
  business_id: string;  // Business tenant identifier
  // ... data fields ...
  sync_status: 'pending' | 'synced' | 'conflicted';
  local_id: string;     // Temporary local-only identifier
  updated_at: string;   // ISO timestamp for conflict resolution
}
```

### Sync Engine Business Scoping

The sync engine stores the device's `business_id` and uses it to scope all sync operations:

```typescript
class SyncEngine {
  private businessId: string;

  async pushPendingRecords(): Promise<void> {
    const pending = await this.localDb.find({
      business_id: this.businessId,
      sync_status: 'pending'
    });
    // ... upload to Supabase with business_id
  }

  async pullRemoteChanges(): Promise<void> {
    const changes = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', this.businessId)
      .gt('updated_at', this.lastSyncTime);
    // ... store locally
  }
}
```

---

## 8. Preservation of Existing Functionality

### What stays the same

| Aspect | Status |
|--------|--------|
| All existing tables | ✅ Preserved |
| All existing columns | ✅ Preserved (new columns are additive) |
| All existing workflows | ✅ Unchanged |
| All existing queries | ✅ Updated only to add `business_id` filter |
| UI and user experience | ✅ No visible change for Crystal Cruize users |
| Reports and analytics | ✅ Same data, same format |

### What changes

| Aspect | Change |
|--------|--------|
| Database schema | New columns added (all nullable initially) |
| Queries | `WHERE business_id = ?` added to all data access |
| INSERT statements | `business_id` included in all record creation |
| Authentication | Login checks `business_users` to determine business scope |
| RLS | Enabled to enforce tenant isolation at database level |

### Rollback Strategy

If any issue is discovered during migration:

1. **Phase 1 is fully reversible:** Drop new tables, remove added columns, drop indexes. `ALTER TABLE ... DROP COLUMN business_id;` restores the original schema.
2. **Phase 2 is reversible before RLS enforcement:** Delete the default business, set `business_id` back to NULL. Application code reverts to unscoped queries.
3. **Phase 3 has no rollback for registered businesses:** Once new businesses have created data, the schema cannot be reverted without data loss. A backup is taken before Phase 3 begins.

---

## 9. Migration Timeline

| Phase | Activities | Duration | Risk |
|-------|-----------|----------|------|
| **Phase 1** | Create new tables, add columns, create indexes | 1 day | Low — additive changes only |
| **Phase 2** | Data migration, application updates, RLS enablement | 3–5 days | Medium — requires thorough testing |
| **Phase 3** | Business registration flow, subscription management | 5–7 days | Medium — new feature development |

---

## 10. Testing Strategy

### Phase 1 Testing
- Verify new tables exist with correct schema.
- Verify new columns exist on existing tables with NULL values.
- Verify existing application functionality is completely unaffected.

### Phase 2 Testing
- Verify default business record is created correctly.
- Verify all existing records are assigned to the default business.
- Verify Crystal Cruize user sees exactly the same data as before.
- Verify RLS policies allow the default business user full access.
- Verify RLS policies block access from any other user.
- Run full regression test suite.

### Phase 3 Testing
- Verify new business registration creates correct records.
- Verify new business user sees only their own empty data.
- Verify Crystal Cruize user still sees only their own data (no cross-contamination).
- Verify trial expiry correctly restricts write operations.
- Verify subscription payment restores full access.

---

## 11. Summary

```
Phase 1                    Phase 2                     Phase 3
─────────                  ─────────                   ─────────
Create new tables          Insert default business      Deploy registration
Add business_id columns    Assign all existing data     Enable multi-business
Create indexes             Enable RLS                   Subscription flow
                           Update application queries   Trial enforcement
                           ───────────                 ───────────
No behavior change         Same data visible           New businesses onboard
                           Same workflows work          Isolated from each other
                           No visible change            Crystal Cruize unaffected
                           to Crystal Cruize users
```

This evolution plan ensures that Crystal Cruize AutoSpa continues operating exactly as it does today, while laying the foundation for the multi-tenant SaaS platform described in the business plan and architecture documents.