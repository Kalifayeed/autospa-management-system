# AutoSpa Management System — Business Plan

## 1. Executive Summary

AutoSpa Management System is a commercial SaaS platform for car wash and auto spa businesses. The platform preserves all existing Crystal Cruize AutoSpa functionality while allowing multiple independent businesses to use the same system. Each business sees only its own data — customers, transactions, services, expenses, payroll, reports, and users.

The product is available as a web application, Android application, and Windows desktop application, all sharing the same account and cloud database. An offline-first architecture ensures users can continue normal operations without internet connectivity, with automatic synchronization when connectivity is restored.

**Vision:** To power every auto spa in Africa with simple, reliable management software.

**Mission:** Provide auto spa owners with an affordable, easy-to-use platform that eliminates manual paperwork, reduces errors, and gives them real-time visibility into their business performance.

---

## 2. Product Vision

AutoSpa Management System is a commercial SaaS platform designed specifically for car wash and auto spa businesses. It evolved from a single-business application (Crystal Cruize AutoSpa) into a multi-tenant platform that serves many businesses from a single codebase.

### Core Principles

1. **Preserve proven workflows** — All existing Crystal Cruize AutoSpa functionality is retained and continues to work exactly as it does today.
2. **Multi-tenant by design** — Every business operates independently within the platform with complete data isolation.
3. **Platform availability** — Web, Android, and Windows desktop applications all use the same account and database.
4. **Offline-first** — Users can operate without internet; data synchronizes automatically when connectivity returns.
5. **Simple pricing** — No transaction, customer, attendant, branch, or feature limits.

---

## 3. Current Features (Preserved from Crystal Cruize AutoSpa)

All of the following features work exactly as they currently do within each business's isolated environment:

- **Customers** — Customer management with vehicle tracking
- **Transactions** — Payment and billing records
- **Services** — Service catalog with pricing
- **Add-ons** — Additional service options
- **Attendants** — Staff profiles and roles
- **Expenses** — Business expense tracking
- **Payroll** — Staff payroll processing
- **Reports** — Sales reports, trends, analytics
- **User Management** — Role-based access control (admin, staff)
- **Car Wash Workflow** — Check-in, wash process, completion
- **Carpet Cleaning Workflow** — Check-in, cleaning process, completion

---

## 4. Subscription Model

### Free Trial
- Every new business receives a **30-day free trial**.
- No feature limitations during the trial period — full access to all functionality.
- No credit card required to start the trial.

### Trial Expiry
After the 30-day trial expires, the following restrictions apply:

| Action | Allowed? |
|--------|----------|
| View existing records (customers, transactions, reports) | ✅ Yes |
| Create new transactions | ❌ No |
| Create new customers | ❌ No |
| Create new attendants | ❌ No |
| Create new services | ❌ No |
| Record new expenses | ❌ No |
| Process payroll | ❌ No |

All existing data remains visible and accessible. The business simply cannot create new records until a subscription is active.

### Subscription Terms
- **Annual subscription only** — no monthly billing option.
- Once a subscription is purchased, full access is restored immediately.
- Subscriptions auto-renew annually.

---

## 5. Pricing Philosophy

### Simple. No Limits. One Plan.

AutoSpa Management System uses a single-tier pricing model with no limitations:

| Feature | Policy |
|---------|--------|
| Transaction limits | ❌ None |
| Customer limits | ❌ None |
| Attendant limits | ❌ None |
| Branch limits | ❌ None |
| Feature restrictions | ❌ None |
| Pricing model | Annual subscription only |
| Trial period | 30 days, full features |

**Why this approach?**
- Auto spa owners should never have to worry about outgrowing their software.
- No confusing tier comparisons or upgrade decisions.
- Predictable annual cost makes budgeting simple.
- Encourages adoption: one price, everything included.

### Pricing (Target)
- **Annual subscription:** KES 10,000–15,000 per business per year (approximately USD 80–120)
- Pricing will be validated and adjusted based on market feedback during Phase 1 rollout.

---

## 6. Business Setup & Branding

### Onboarding Requirements
During sign-up, each business owner must provide:

| Field | Purpose |
|-------|---------|
| **Business Name** | Displayed throughout the application |
| **Logo** | Branding on screens, invoices, reports |
| **Phone Number** | Customer contact, SMS notifications |
| **Email Address** | Business communications, receipts |
| **Physical Address** | Business location, invoicing |

### Application Branding
These settings become the visual identity of the application for that business:
- The business name appears in the header, title bar, and branding areas.
- The logo is displayed on login screens, invoices, and reports.
- Phone, email, and address appear on receipts, invoices, and business communications.

Each business has an independent branding configuration — no two businesses see each other's branding.

---

## 7. Multi-Tenant Architecture

### Data Isolation
Every business operates in a completely isolated data environment. A business can only see its own:

- Customers
- Vehicles
- Transactions
- Services
- Add-ons
- Attendants
- Expenses
- Payroll records
- Reports and analytics
- Users and staff accounts

### Authentication
- Users authenticate with email/password.
- Each user is associated with exactly one business.
- Upon login, the application loads only data belonging to that business.

### No Data Sharing
- Businesses cannot search, view, or access each other's data.
- No cross-business reporting or analytics.
- No shared customer databases.

---

## 8. Platform Availability

All platforms use the **same account** and **same cloud database** — data is synchronized across devices in real time.

### Web Application
- Built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui
- Hosted on Vercel or Netlify
- Backend powered by Supabase (PostgreSQL + Auth + Storage)
- Accessible from any modern browser

### Android Application
- Native Android app
- Same login credentials as web application
- Access to all features available on web
- Optimized for mobile touch interfaces

### Windows Desktop Application
- Built with Electron
- Same login credentials as web and Android
- Native window management and OS integration
- Suitable for fixed workstations at the auto spa counter

### Shared Infrastructure
- **Database:** Supabase (PostgreSQL) — single database, row-level security for multi-tenant isolation
- **Authentication:** Supabase Auth — unified across all platforms
- **Storage:** Supabase Storage — for business logos and branding assets
- **Real-time sync:** Supabase Realtime — for pushing updates across connected devices

---

## 9. Offline-First Architecture

### Offline Capabilities
Users can continue normal operations without an internet connection:

| Operation | Supported Offline |
|-----------|-------------------|
| Create customers | ✅ Yes |
| Create transactions | ✅ Yes |
| Record expenses | ✅ Yes |
| Process payroll | ✅ Yes |
| View existing records | ✅ Yes |
| Generate reports | ✅ Yes (cached data) |

### Automatic Synchronization
When internet connectivity is restored:

1. All locally created records synchronize to the cloud database automatically.
2. Data from other devices (e.g., records created on another device while offline) sync down to the local device.
3. Synchronization happens in the background — no manual intervention required.

### Conflict Resolution Strategy
When sync conflicts occur (e.g., the same record was modified on two devices while both were offline), the following strategy is applied:

- **Last-write-wins** — The most recent modification timestamp takes precedence.
- **Timestamp-based tracking** — Every record tracks its last modified timestamp.
- Future enhancements may include manual merge for complex conflicts.

### Local Data Storage
- Data is stored locally on the device using IndexedDB or SQLite (platform-dependent).
- Local cache serves as the primary data source when offline.
- Cloud database serves as the source of truth for synchronization.

---

## 10. Future Integrations

### Phase 1 — Payments & Messaging
| Integration | Purpose |
|-------------|---------|
| **Paystack** | Accept card payments online |
| **M-Pesa** | Accept mobile money payments (primary Kenyan payment method) |
| **Automated Thank-You Messages** | Auto-sent SMS/email after successful payment |

### Phase 2 — Subscription & Billing
| Integration | Purpose |
|-------------|---------|
| **Subscription Renewals** | Automated annual subscription billing |
| **Payment Reminders** | Notify businesses before trial expiry and subscription renewal |

### Architecture for Integrations
- All payment integrations are optional — businesses can continue using cash-only operations.
- Integrations are configured per-business in the branding/settings area.
- API keys and credentials are stored securely per business.

---

## 11. Market Analysis

### Target Market
- **Primary:** Auto spa businesses (car wash, detailing, carpet cleaning) in Kenya
- **Secondary:** Auto spa businesses across East Africa (Uganda, Tanzania, Rwanda)
- **Tertiary:** Auto spa businesses in other African markets (Nigeria, Ghana, South Africa)

### Problem Statement
Auto spa owners face:
- Lost revenue from forgotten or incorrectly recorded transactions
- Difficulty tracking employee hours and calculating payroll
- No visibility into daily, weekly, or monthly performance
- Manual record-keeping that is error-prone and time-consuming
- Lack of customer history leading to poor service personalization
- Generic POS systems that don't fit their specific workflows

### Competitive Advantage
- **Purpose-built** for auto spa workflows (car wash + carpet cleaning)
- **Offline-first** — critical for markets with unreliable internet
- **Multi-platform** — web, Android, and Windows from a single account
- **Affordable** — simple annual pricing with no per-transaction fees
- **Localized** — built for African businesses with local payment integrations

---

## 12. Technology Strategy

### Current Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **State Management:** TanStack React Query
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Testing:** Vitest + React Testing Library

### Future Stack (Per Phase)
| Phase | Additions |
|-------|-----------|
| Phase 1 | Paystack API, SMS/email service |
| Phase 2 | Subscription billing system, business onboarding flow |
| Phase 3 | Android (Kotlin/Jetpack Compose or React Native), Electron desktop app |
| Phase 4 | Offline storage (IndexedDB/SQLite), sync engine, conflict resolution |
| Phase 5 | Play Store deployment, Electron installer (Windows/macOS/Linux) |

### Database
- **Supabase PostgreSQL** with Row-Level Security (RLS) for multi-tenant isolation
- Each table includes a `business_id` column for tenant scoping
- RLS policies ensure businesses can only access their own rows

---

## 13. Development Roadmap

| Phase | Timeline | Features |
|-------|----------|----------|
| **Now** | Complete | Core web app with all existing Crystal Cruize AutoSpa functionality |
| **Phase 1** | Month 1–2 | Duplicate vehicle prevention, Paystack integration, M-Pesa integration, automated thank-you messaging |
| **Phase 2** | Month 3–4 | Multi-business support, business onboarding & branding, 30-day free trial, annual subscription system |
| **Phase 3** | Month 5–6 | Android application, Electron desktop application, shared login & cloud database |
| **Phase 4** | Month 7–8 | Offline-first architecture, local data storage, automatic synchronization, conflict resolution |
| **Phase 5** | Month 9–10 | Google Play Store deployment, desktop installer deployment, public SaaS launch |

---

## 14. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Low adoption | High | Medium | Direct sales, referrals, free trial with full features |
| Payment integration issues | Medium | Low | Thorough sandbox testing; M-Pesa as primary backup |
| Internet reliability | Medium | High | Offline-first architecture (Phase 4) addresses this |
| Churn after trial | High | Medium | Strong onboarding, demonstrate value early |
| Data sync conflicts | Medium | Medium | Last-write-wins with timestamp tracking |
| Subscription renewal failure | Medium | Medium | Automated reminders; ability to retry payment |

---

## 15. Milestones & Timeline

| Timeline | Milestone |
|----------|-----------|
| **Now** | Core web app functional with single-business mode |
| **End of Month 2** | Phase 1 live: payments and messaging |
| **End of Month 4** | Phase 2 live: multi-tenant, subscriptions, onboarding |
| **End of Month 6** | Phase 3 live: Android + Electron apps |
| **End of Month 8** | Phase 4 live: offline-first with sync |
| **End of Month 10** | Phase 5 live: public SaaS launch on all platforms |

---

## 16. Conclusion

AutoSpa Management System is a commercial SaaS platform built from proven, real-world auto spa workflows. With a clear multi-tenant architecture, simple annual pricing, offline-first capability, and availability on web, Android, and Windows — the platform is positioned to become the leading operational software for auto spa businesses across Africa.

The focus on stability, simplicity, and preserving existing proven workflows ensures that businesses can adopt the platform with confidence, knowing their daily operations will not be disrupted.