# AutoSpa Management System — Project Roadmap

## Overview
AutoSpa Management System is a commercial SaaS platform for managing auto spa (car wash and detailing) businesses. Built with React, TypeScript, Vite, and Supabase, it provides tools for customer management, service tracking, transaction processing, payroll, reporting, and workflow management (car wash / carpet cleaning). The product prioritizes stability, simplicity, and preserving proven business workflows.

---

## Tech Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **State Management & Data Fetching:** TanStack React Query
- **Routing:** React Router v6
- **Forms & Validation:** React Hook Form + Zod
- **Backend & Database:** Supabase (PostgreSQL + Auth + Storage)
- **Testing:** Vitest + React Testing Library
- **Linting:** ESLint with TypeScript rules
- **Package Manager:** npm / bun

---

## Milestones & Features

### ✅ Completed — Core Functionality
- [x] Project scaffolding with Vite + React + TypeScript
- [x] Tailwind CSS + shadcn/ui component library integration
- [x] Routing setup with React Router v6
- [x] Supabase project configuration (database, auth, storage)
- [x] Database migrations for core tables
- [x] ESLint and TypeScript configuration
- [x] Vitest testing setup
- [x] **Customers** — CRUD, search, filtering
- [x] **Vehicles** — Vehicle management per customer
- [x] **Services** — Service catalog with pricing
- [x] **Add-ons** — Additional service options
- [x] **Attendants** — Staff profiles and roles
- [x] **Transactions** — Payment and billing records
- [x] **Expenses** — Business expense tracking
- [x] **Payroll** — Staff payroll processing
- [x] **Reports** — Sales reports, trends, analytics
- [x] **User Management** — Role-based access control (admin, staff)
- [x] **Car Wash Workflow** — Check-in, wash process, completion
- [x] **Carpet Cleaning Workflow** — Check-in, cleaning process, completion

---

### Phase 1 — Quality & Payments *(In Progress)*
- [ ] **Duplicate Vehicle Prevention** — Prevent the same license plate from being entered twice within a 12-hour window
- [ ] **Paystack Integration** — Accept online payments via Paystack payment gateway
- [ ] **Automated Thank-You Messaging** — Send automated thank-you message (SMS/email) after successful payment

### Phase 2 — Multi-Tenant & Subscription *(Planned)*
- [ ] **Multi-Business Support** — Allow multiple businesses to operate within the same platform
- [ ] **Business Branding** — Per-business configuration (name, logo, phone, address)
- [ ] **30-Day Free Trial** — New businesses get a 30-day free trial period
- [ ] **Annual Subscription System** — Paid annual subscription per business

### Phase 3 — Cross-Platform Applications *(Planned)*
- [ ] **Android Application** — Native Android app for mobile access
- [ ] **Desktop Application (Electron)** — Cross-platform desktop app using Electron
- [ ] **Shared Login & Cloud Database** — Unified authentication and real-time sync across all platforms

### Phase 4 — Offline-First Architecture *(Planned)*
- [ ] **Offline-First Architecture** — Full functionality without internet connectivity
- [ ] **Local Data Storage** — All data stored locally on device
- [ ] **Automatic Synchronization** — Seamless sync when internet connection is restored
- [ ] **Conflict Resolution Strategy** — Handle data conflicts during sync (last-write-wins, manual merge, or timestamp-based)

### Phase 5 — Public Launch *(Planned)*
- [ ] **Google Play Store Deployment** — Android app published to Google Play Store
- [ ] **Desktop Installer Deployment** — Windows/macOS/Linux installers via Electron
- [ ] **SaaS Launch** — Public availability of the SaaS platform for new sign-ups

---

## Database Schema (Core Tables)
- `profiles` — Extended user profile data (linked to auth.users)
- `customers` — Customer information (name, phone, email, address)
- `vehicles` — Vehicle details per customer (make, model, year, plate)
- `services` — Service catalog (name, description, price, duration)
- `addons` — Add-on service options
- `transactions` — Payment and billing records
- `employees` / `attendants` — Staff profiles, roles
- `expenses` — Business expense tracking
- `payroll` — Payroll records

---

## Development Standards
- **Components:** Functional components with TypeScript; shadcn/ui primitives reused
- **Styling:** Tailwind CSS utility classes; consistent design tokens
- **API Calls:** Supabase client via dedicated service modules in `src/integrations/`
- **Data Fetching:** TanStack React Query for server state management
- **Forms:** React Hook Form with Zod schemas for validation
- **Error Handling:** Consistent error boundaries and toast notifications (sonner)
- **Testing:** Unit tests with Vitest; component tests with React Testing Library

---

## How to Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

Environment variables (see `.env`):
- Supabase project URL and anon key
- Any third-party API keys

---

## Deployment
- **Frontend:** Vite build output deployable to Vercel, Netlify, or any static host
- **Backend:** Supabase managed backend (no separate server deployment needed)
- **CI/CD:** GitHub Actions (future)