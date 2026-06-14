# AutoSpa Management System — Technical Architecture

## Core Principle

**One account. One database. Multiple devices.**

Users can access the platform from:
- **Web browser** — React application hosted on Vercel/Netlify
- **Android application** — Capacitor-wrapped web app or native Android
- **Windows desktop application** — Electron-wrapped web app

All platforms display the same synchronized business data, backed by a single Supabase PostgreSQL database.

```
┌─────────────────────────────────────────────────────────┐
│                   AutoSpa Platform                       │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐       │
│  │   Web    │  │ Android  │  │   Desktop        │       │
│  │ Browser  │  │  (Capacitor) │   (Electron)    │       │
│  └────┬─────┘  └────┬─────┘  └──────┬───────────┘       │
│       │              │               │                    │
│       └──────────────┼───────────────┘                    │
│                      │                                    │
│              ┌───────┴────────┐                           │
│              │  Supabase SDK  │                           │
│              │  (Auth + DB +  │                           │
│              │   Realtime +   │                           │
│              │   Storage)     │                           │
│              └───────┬────────┘                           │
│                      │                                    │
│              ┌───────┴────────┐                           │
│              │   Supabase     │                           │
│              │  (PostgreSQL + │                           │
│              │   Auth + RLS + │                           │
│              │   Realtime)    │                           │
│              └────────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Platform Architecture

### Frontend Layer

All platforms share a common React + TypeScript + Vite codebase.

| Platform | Technology | Build Target |
|----------|------------|--------------|
| **Web** | React + TypeScript + Vite | Browser bundle |
| **Android** | Capacitor (wraps web build) | APK / AAB |
| **Desktop** | Electron (wraps web build) | Windows installer (.exe/.msi) |

**Code Sharing Strategy:**
- 100% of application code (components, hooks, services, pages) is shared across all platforms.
- Platform-specific code is isolated behind abstraction layers:
  - **Storage adapter** — IndexedDB (web) vs SQLite (Android/Desktop)
  - **File system adapter** — Browser APIs vs Node.js vs Capacitor plugins
  - **Network detection** — `navigator.onLine` vs native connectivity APIs

### Backend Layer

| Service | Purpose |
|---------|---------|
| **Supabase PostgreSQL** | Primary database with Row-Level Security |
| **Supabase Auth** | Authentication (email/password) |
| **Supabase Realtime** | Live sync across devices (via PostgreSQL replication) |
| **Supabase Storage** | File storage (business logos, branding assets) |

### Payment Layer

| Integration | Status | Purpose |
|-------------|--------|---------|
| **Paystack** | Future (Phase 1) | Online card payments |
| **M-Pesa** | Future (Phase 1) | Mobile money payments |

Payments are optional — businesses can operate cash-only without any integration configured.

---

## 2. Multi-Tenant Architecture

### Data Isolation Model

Every record in the database belongs to exactly one business. No business can access another business's data.

```
Database
│
├── Business A
│   ├── Customers
│   ├── Transactions
│   ├── Services
│   ├── Expenses
│   ├── Payroll
│   ├── Users
│   └── Reports
│
├── Business B
│   ├── Customers
│   ├── Transactions
│   ├── Services
│   ├── Expenses
│   ├── Payroll
│   ├── Users
│   └── Reports
│
└── Business C
    └── ...
```

### Database Schema Pattern

Every tenant-scoped table includes a `business_id` column:

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  -- ...other fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_business_id ON customers(business_id);
```

### Row-Level Security (RLS)

Supabase RLS policies enforce tenant isolation at the database level:

```sql
-- Every authenticated user sees only their business's data
CREATE POLICY "Users can only access their own business data"
ON customers
FOR ALL
USING (
  business_id = (SELECT business_id FROM user_profiles WHERE user_id = auth.uid())
);
```

### Authentication Flow

1. User signs up with email/password via Supabase Auth.
2. A `user_profiles` record is created linking `auth.users.id` to a `businesses.id`.
3. Upon login, the application reads `user_profiles` to determine the current business.
4. All subsequent queries include the business scope via RLS.

---

## 3. Offline-First Strategy

### Local Storage Architecture

| Platform | Storage Engine | Technology |
|----------|---------------|------------|
| **Web Browser** | IndexedDB | via Dexie.js or idb |
| **Android** | SQLite | via Capacitor SQLite plugin |
| **Desktop (Electron)** | SQLite | via better-sqlite3 |

All platforms implement the same logical data model locally as exists in the cloud database.

### Offline Operations

The following operations are fully supported offline:

| Operation | Offline Support |
|-----------|----------------|
| Create customer | ✅ Yes |
| Create transaction | ✅ Yes |
| Record expense | ✅ Yes |
| Process payroll | ✅ Yes |
| View all records | ✅ Yes (cached) |
| Generate reports | ✅ Yes (cached data) |

### Offline Data Flow

```
User Action (Offline)
       │
       ▼
┌──────────────────┐
│  Local Database   │
│  (IndexedDB /     │
│   SQLite)         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Sync Queue       │
│  (pending records │
│   with timestamps)│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Sync Engine      │──► Internet returns
│  (background)     │──► Connects to Supabase
└────────┬─────────┘──► Uploads pending records
         │            └──► Downloads remote changes
         ▼
┌──────────────────┐
│  Cloud Database   │
│  (Supabase        │
│   PostgreSQL)     │
└──────────────────┘
```

### Sync Status Tracking

Each record tracks its sync status:

```
┌─────────────────────────────┐
│         Record              │
├─────────────────────────────┤
│ id           │ UUID         │
│ business_id  │ UUID         │
│ ...data...   │              │
│ synced_at    │ TIMESTAMPTZ  │
│ updated_at   │ TIMESTAMPTZ  │
│ local_id     │ UUID (temp)  │
│ sync_status  │ ENUM:        │
│              │  - pending   │
│              │  - synced    │
│              │  - conflicted│
└─────────────────────────────┘
```

- **pending** — Created or modified locally; not yet sent to cloud
- **synced** — Successfully synchronized with cloud
- **conflicted** — Conflict detected during sync; needs resolution

---

## 4. Synchronization Strategy

### Sync Process

When internet connectivity is restored:

1. **Detection** — Network status listener fires `online` event.
2. **Lock** — Sync engine acquires a sync lock (prevents concurrent syncs).
3. **Upload** — All locally created/updated records with `sync_status = pending` are sent to Supabase.
4. **Conflict Check** — Each record is checked against the cloud version using `updated_at` timestamps.
5. **Download** — Any records modified on other devices since last sync are fetched and stored locally.
6. **Status Update** — Synced records are marked `synced` in local storage.
7. **Unlock** — Sync lock is released.

### Duplicate Prevention

To prevent duplicate records during sync:

1. **Client-side UUIDs** — Records are created with a UUID on the client before sync.
2. **UPSERT Operations** — Sync uses `INSERT ... ON CONFLICT (id) DO UPDATE` to ensure idempotency.
3. **Dedup by Content Hash** — For records without a pre-assigned ID, a hash of the content is used to detect duplicates.

```
Sample UPSERT approach:
INSERT INTO customers (id, business_id, name, phone, ...)
VALUES ($1, $2, $3, $4, ...)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    updated_at = now()
WHERE customers.updated_at < EXCLUDED.updated_at;
```

### Conflict Resolution

**Strategy: Last-Write-Wins**

| Scenario | Resolution |
|----------|------------|
| Same record modified on two offline devices | Last `updated_at` wins |
| Record deleted on one device, edited on another | Delete takes precedence if deleted after last edit |
| New record with same natural key | First-created UUID wins; duplicate is flagged |

**Conflict Tracking:**
- Conflicted records are marked `sync_status = conflicted` in local storage.
- The application displays a conflict indicator for manual review if needed.
- Future enhancement: automated merge for simple field-level conflicts.

---

## 5. Duplicate Vehicle Rule

### Rule Definition

**Vehicle transactions:** If the same license plate number is entered within a 12-hour window, the system must block the duplicate entry.

**Exemption:** Carpet cleaning transactions are not subject to this rule.

### Online Check (Supabase)

```sql
-- Check if a vehicle with the same plate was serviced within the last 12 hours
SELECT EXISTS (
  SELECT 1
  FROM transactions t
  JOIN vehicles v ON v.id = t.vehicle_id
  WHERE v.plate = $plate
    AND t.business_id = $business_id
    AND t.created_at > now() - INTERVAL '12 hours'
    AND t.service_type != 'carpet_cleaning'
);
```

### Offline Check (Local Database)

The same logic runs against the local database:

```sql
SELECT EXISTS (
  SELECT 1
  FROM transactions t
  JOIN vehicles v ON v.id = t.vehicle_id
  WHERE v.plate = $plate
    AND t.business_id = $business_id
    AND t.created_at > datetime('now', '-12 hours')
    AND t.service_type != 'carpet_cleaning'
);
```

### Implementation

- The check runs **before** record creation — both online and offline.
- If the check returns true, the user sees a warning:
  > "This vehicle was serviced within the last 12 hours. Duplicate entry blocked."
- The check runs against local data when offline, and against the cloud database when online.
- Offline-created duplicates that violate this rule are rejected during sync.

---

## 6. Future Integrations

### Payment Integrations

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Application  │────►│  Paystack     │────►│  Bank/Card    │
│  (Web/Mobile/ │     │  API         │     │  Payment      │
│   Desktop)    │     └──────────────┘     └──────────────┘
│              │     ┌──────────────┐     ┌──────────────┐
│              │────►│  M-Pesa API   │────►│  Mobile Money │
│              │     └──────────────┘     └──────────────┘
└──────────────┘
```

**Integration points:**
- Payment button in transaction flow triggers Paystack/M-Pesa checkout.
- Webhook handlers receive payment confirmation and update transaction status.
- All payment credentials are stored per-business in the `businesses` table.

### Automated Thank-You Messages

- After a successful payment, an automated message is sent.
- Channel: SMS (via Twilio or Africa's Talking) and/or email.
- Message content is configurable per business.
- Messages are queued locally and sent when internet is available.

### Subscription Renewals

- Annual subscription billing is automated via the payment integration.
- Reminder emails/SMS are sent 7 days and 1 day before expiry.
- On successful renewal, the business's subscription end date is extended.
- On failed renewal, retry logic with 3 attempts (3 days apart).

### Integration Architecture

```
┌──────────────────────────────────────────────┐
│              Application Layer                │
├──────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Paystack │  │ M-Pesa   │  │ Messaging  │  │
│  │ Module   │  │ Module   │  │ Module     │  │
│  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │              │              │          │
│  ┌────┴──────────────┴──────────────┴──────┐  │
│  │        Integration Service Layer         │  │
│  │  (Webhook handlers, API clients,        │  │
│  │   queue management)                     │  │
│  └────────────────┬───────────────────────┘  │
└───────────────────┼──────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│         External Services                     │
│  Paystack  │  M-Pesa  │  Twilio/A.Talking     │
└──────────────────────────────────────────────┘
```

---

## 7. Deployment Strategy

### Web Application

| Aspect | Detail |
|--------|--------|
| **Hosting** | Vercel or Netlify |
| **Build** | `npm run build` → `dist/` folder |
| **Domain** | Custom domain (e.g., autospa.app) |
| **CDN** | Automatic via Vercel/Netlify edge network |
| **Env Vars** | Supabase URL, anon key, API keys (injected at build time) |

### Android Application

| Aspect | Detail |
|--------|--------|
| **Distribution** | Google Play Store |
| **Technology** | Capacitor (wraps web app) |
| **Build** | `npx cap sync android && npx cap open android` → Android Studio → APK/AAB |
| **Signing** | Android App Bundle signed with Play Store key |
| **Updates** | In-app update via Play Store; web content is server-rendered |

### Desktop Application (Electron)

| Aspect | Detail |
|--------|--------|
| **Distribution** | Installer download (website) + auto-update |
| **Technology** | Electron |
| **Build** | `electron-builder` → `.exe` (Windows), `.dmg` (macOS), `.AppImage` (Linux) |
| **Auto-Update** | `electron-updater` with GitHub Releases or S3 |
| **Installers** | NSIS (Windows), DMG (macOS), AppImage (Linux) |

### CI/CD Pipeline (Future)

```
Git Push (main branch)
       │
       ▼
┌──────────────────┐
│  GitHub Actions   │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│  Test   │ │  Lint   │
└────────┘ └────────┘
    │
    ▼
┌──────────────────┐
│  Build Web App    │
│  Build Android    │
│  Build Desktop    │
└──────────────────┘
    │
    ▼
┌──────────────────┐
│  Deploy Web       │──► Vercel / Netlify
│  Upload APK       │──► Google Play Store
│  Upload Installer │──► GitHub Releases
└──────────────────┘
```

---

## 8. Data Flow Diagrams

### Authentication Flow

```
User                    Application                 Supabase Auth
 │                         │                            │
 │  Enter email/password   │                            │
 │────────────────────────►│                            │
 │                         │  signInWithPassword()      │
 │                         │───────────────────────────►│
 │                         │                            │
 │                         │  ◄─── Session + User ──────│
 │                         │                            │
 │                         │  Fetch user_profiles        │
 │                         │  to get business_id         │
 │                         │                            │
 │  ◄── App Loaded ────────│                            │
 │                         │                            │
```

### Transaction Creation Flow (Online)

```
User                    Application                 Supabase          Customer
 │                         │                            │                 │
 │  Select customer        │                            │                 │
 │────────────────────────►│                            │                 │
 │  Select service         │                            │                 │
 │────────────────────────►│                            │                 │
 │  Enter amount           │                            │                 │
 │────────────────────────►│                            │                 │
 │                         │  Validate duplicate        │                 │
 │                         │  vehicle rule (online)     │                 │
 │                         │───────────────────────────►│                 │
 │                         │  ◄──── OK / Blocked ───────│                 │
 │                         │                            │                 │
 │                         │  Insert transaction        │                 │
 │                         │───────────────────────────►│                 │
 │                         │  ◄──── Success ────────────│                 │
 │  ◄── Receipt ───────────│                            │                 │
 │                         │                            │                 │
```

### Transaction Creation Flow (Offline)

```
User                    Application (Local DB)         Sync Engine        Supabase
 │                         │                            │                   │
 │  Select customer        │                            │                   │
 │────────────────────────►│                            │                   │
 │  Select service         │                            │                   │
 │────────────────────────►│                            │                   │
 │  Enter amount           │                            │                   │
 │────────────────────────►│                            │                   │
 │                         │  Validate duplicate        │                   │
 │                         │  vehicle rule (local DB)   │                   │
 │                         │                            │                   │
 │                         │  Insert transaction        │                   │
 │                         │  (status: pending)         │                   │
 │                         │                            │                   │
 │  ◄── Receipt ───────────│                            │                   │
 │                         │                            │                   │
 │                         │  (internet returns)        │                   │
 │                         │───────────────────────────►│                   │
 │                         │                            │  Sync pending     │
 │                         │                            │──────────────────►│
 │                         │                            │  ◄── Synced ─────│
 │                         │  ◄── Mark synced ──────────│                   │
```

---

## 9. Technology Choices & Rationale

| Technology | Why Chosen |
|------------|------------|
| **React + TypeScript** | Large ecosystem, strong typing, shared code across all platforms |
| **Vite** | Fast build times, modern tooling, excellent DX |
| **Supabase** | Managed PostgreSQL with built-in Auth, Realtime, Storage, and RLS — reduces backend complexity |
| **Capacitor** | Wraps web app as native Android app with minimal native code; access to native APIs via plugins |
| **Electron** | Mature desktop framework; same codebase as web; Node.js access for SQLite and file system |
| **TanStack React Query** | Server state management with offline persistence support |
| **IndexedDB / SQLite** | Proven local storage engines with good cross-platform support |
| **Paystack** | Leading African payment gateway with strong API and documentation |
| **Row-Level Security** | Database-level tenant isolation — no application-level permission logic needed |

---

## 10. Database Schema Overview

### Core Tables

```sql
-- Businesses (tenants)
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  subscription_status TEXT DEFAULT 'trial', -- trial, active, expired, cancelled
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User profiles (links auth.users to businesses)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  business_id UUID REFERENCES businesses(id) NOT NULL,
  role TEXT DEFAULT 'staff', -- admin, staff
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  plate TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER, -- minutes
  type TEXT DEFAULT 'car_wash', -- car_wash, carpet_cleaning
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add-ons
CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  service_id UUID REFERENCES services(id),
  addon_ids UUID[],
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT, -- cash, card, mpesa, paystack
  payment_status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
  type TEXT DEFAULT 'car_wash', -- car_wash, carpet_cleaning
  sync_status TEXT DEFAULT 'synced', -- pending, synced, conflicted
  local_id TEXT, -- temporary ID for offline-created records
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payroll
CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  attendant_id UUID REFERENCES attendants(id),
  amount DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Indexes

```sql
-- Tenant isolation indexes
CREATE INDEX idx_customers_business_id ON customers(business_id);
CREATE INDEX idx_vehicles_business_id ON vehicles(business_id);
CREATE INDEX idx_services_business_id ON services(business_id);
CREATE INDEX idx_transactions_business_id ON transactions(business_id);
CREATE INDEX idx_expenses_business_id ON expenses(business_id);
CREATE INDEX idx_payroll_business_id ON payroll(business_id);

-- Duplicate vehicle check index
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_transactions_vehicle_time ON transactions(vehicle_id, created_at);

-- Sync status index
CREATE INDEX idx_transactions_sync ON transactions(sync_status);
```

---

## 11. Security Architecture

### Authentication
- Supabase Auth handles password hashing, session management, and token refresh.
- JWT tokens are used for all API requests.
- Session is shared across platforms (same Supabase project).

### Authorization
- Row-Level Security (RLS) enforces tenant isolation at the database level.
- Application-level role checks (admin vs staff) control feature access.
- All API requests are authenticated via Supabase JWT.

### Data Protection
- All data in transit is encrypted via HTTPS/TLS.
- Supabase encrypts data at rest.
- Passwords are never stored in plain text (handled by Supabase Auth).
- API keys and payment credentials are stored encrypted in the database.

### Offline Security
- Local databases are stored in application-private directories (Android/Desktop) or browser-private storage (IndexedDB).
- No unauthenticated access to local data.
- Supabase credentials are stored securely using platform keychains where available.

---

## 12. Performance & Scalability

### Database
- Supabase PostgreSQL auto-scales with demand.
- Indexes are optimized for the most common query patterns (business-scoped lookups, duplicate vehicle checks, sync queries).
- Connection pooling via Supabase Pooler for serverless/edge function access.

### Local Storage
- SQLite/IndexedDB are lightweight and perform well with typical auto spa data volumes (hundreds to low thousands of records per business).
- Data is paginated and lazily loaded in the UI regardless of source (local or remote).

### Sync
- Sync operates in batches (100 records per batch) to avoid overwhelming the network or database.
- Incremental sync: only records changed since last sync are transferred.
- Sync is non-blocking — the UI remains responsive during sync operations.

### Caching
- TanStack React Query caches server data with configurable stale times.
- Offline-first means the local database serves as the primary data source, reducing cloud database load.
- Static assets (logos, branding) are cached via service workers (web) and local filesystem (Android/Desktop).

---

## 13. Maintainability & Development Standards

### Code Organization

```
src/
├── components/       # Shared UI components
├── pages/            # Route-level page components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── integrations/     # Supabase client, API modules
├── stores/           # Local state management
├── services/         # Business logic layer
├── sync/             # Offline sync engine
├── platform/         # Platform adapters (web, android, desktop)
├── types/            # TypeScript type definitions
└── test/             # Test files
```

### Key Principles

1. **Shared code first** — Write once, run everywhere. Platform-specific code is the exception, not the rule.
2. **Abstraction layers** — Storage, networking, and file system access are abstracted behind interfaces.
3. **Type safety** — TypeScript strict mode; shared types between frontend and database.
4. **Testing** — Unit tests for business logic; integration tests for sync engine; E2E tests for critical flows.
5. **Documentation** — Architecture decisions recorded in ADR (Architecture Decision Record) format.
6. **Error handling** — Consistent error boundaries, logging, and user-facing error messages.

---

## 14. Architecture Decision Records (ADRs)

### ADR-001: Single Supabase Database with RLS for Multi-Tenancy

**Decision:** Use a single PostgreSQL database with Row-Level Security for tenant isolation.

**Rationale:**
- Simpler than database-per-tenant (no connection management, no schema migration orchestration).
- Supabase RLS provides robust, database-enforced isolation.
- Cost-effective for the expected scale (hundreds to low thousands of businesses).
- Easier to maintain and deploy than multi-database architecture.

### ADR-002: Client-Generated UUIDs for Offline Support

**Decision:** Generate UUIDs on the client for all records, rather than relying on database auto-increment.

**Rationale:**
- Enables offline record creation without requiring a database round-trip.
- Eliminates ID conflicts during sync (UUIDs are globally unique).
- UPSERT operations become simple and safe.

### ADR-003: Last-Write-Wins for Conflict Resolution

**Decision:** Use timestamp-based last-write-wins as the primary conflict resolution strategy.

**Rationale:**
- Simple to implement and reason about.
- Matches the expected usage pattern (mostly single-user-per-device).
- Avoids complex merge UI and logic that would slow development.
- Can be enhanced with manual merge in a future iteration.

### ADR-004: Capacitor over React Native for Android

**Decision:** Use Capacitor to wrap the web app for Android, rather than building a separate React Native app.

**Rationale:**
- Maximum code sharing between web, Android, and Desktop (nearly 100%).
- Faster development — no need to maintain a separate UI framework.
- Capacitor provides access to native APIs (SQLite, file system, camera) via plugins.
- Acceptable trade-off: slightly less native feel vs significantly faster development.

---

## 15. Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                    AutoSpa Management System                      │
│                       Technical Architecture                      │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │                    Presentation Layer                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐   │    │
│  │  │   Web    │  │ Android  │  │      Desktop            │   │    │
│  │  │ (React)  │  │(Capacitor)│  │     (Electron)          │   │    │
│  │  └──────────┘  └──────────┘  └────────────────────────┘   │    │
│  └───────────────────────────────────────────────────────────┘    │
│                              │                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │                    Application Layer                        │    │
│  │  ┌────────┐ ┌──────────┐ ┌─────────┐ ┌────────────────┐   │    │
│  │  │ Auth   │ │ Customer │ │ Transact│ │  Sync Engine   │   │    │
│  │  │ Module │ │ Module   │ │ Module  │ │  (Offline)     │   │    │
│  │  └────────┘ └──────────┘ └─────────┘ └────────────────┘   │    │
│  └───────────────────────────────────────────────────────────┘    │
│                              │                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │                    Data Layer                               │    │
│  │  ┌──────────────────────────────────────────────────────┐  │    │
│  │  │          Supabase (PostgreSQL + Auth + RLS)           │  │    │
│  │  └──────────────────────────────────────────────────────┘  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │    │
│  │  │  IndexedDB  │  │  SQLite     │  │  SQLite           │   │    │
│  │  │  (Web)      │  │  (Android)  │  │  (Desktop)        │   │    │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘   │    │
│  └───────────────────────────────────────────────────────────┘    │
│                              │                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │                    Integration Layer                        │    │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐   │    │
│  │  │ Paystack │  │ M-Pesa   │  │ Messaging (SMS/Email)   │   │    │
│  │  └──────────┘  └──────────┘  └────────────────────────┘   │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Core Architecture Principles:                                    │
│  • One account, one database, multiple devices                    │
│  • Offline-first with automatic sync                              │
│  • Multi-tenant with Row-Level Security                           │
│  • Shared codebase across all platforms                           │
│  • Simple pricing with no feature limits                          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘