

# CrystalCruize Autospa - Improvements Plan

## 1. Update Mock Data (mock-data.ts)

**Services** - Replace all current services with:
- Regular Wash Sedan (KES 250), Full Wash Sedan (KES 300), Half Wash Sedan (KES 150)
- Regular Wash SUV (KES 400), Full Wash SUV (KES 500), Half Wash SUV (KES 200)
- Bike Wash Full (KES 100), Bike Wash Half (KES 50)

**Add-Ons** - Replace with:
- Engine Wash (KES 200), Under Wash (KES 200), Steam Wash 5 Seater (KES 1500), Steam Wash 7 Seater (KES 2000), Waxing (KES 700), Tire Shine (KES 100), Dashboard Polish (KES 100)

**Attendants** - Replace with: Eugene, Ezra, Sammy, Simo (all active, no shifts needed initially)

**Commission** - Change from 15% to 30%, remove base wage concept

**Customers** - Change to track by plate number instead of name. Update loyalty threshold to 15 washes for free wash eligibility.

**Dashboard stats** - Add weekly/monthly vehicle counts. Replace pending payments metric with total commission (30% of sales).

**Expenses** - Add weekly and monthly mock expense data alongside daily.

---

## 2. Dashboard Page (DashboardPage.tsx)

- Show vehicles washed: **Today**, **This Week**, and **This Month** as three values in the metric card area
- Replace "Pending Payments" card with "Total Commission (30%)" showing 30% of today's revenue
- Update all references to use the new service/attendant data

---

## 3. New Transaction Page (NewTransactionPage.tsx)

- **Plate number validation**: Require minimum 7 characters before allowing submission
- Update service selection to use new services list
- Update add-ons to use new add-ons list
- **Add "Carpet Wash" section**: A separate collapsible/toggle section with fields for:
  - Size (Small / Medium / Large dropdown)
  - Color of carpet (text input)
  - Amount paid (number input)
  - Owner name (text input)
  - Phone number (text input)
  - Attendant who washed it (dropdown from attendants list)
- Carpet wash amount gets added to the transaction total

---

## 4. Services & Pricing Page (ServicesPage.tsx)

- Display the new services grouped by category (Sedan, SUV, Bike)
- Display new add-ons list
- Add a "Carpet Wash" card explaining the custom pricing service
- Show plate number validation note (min 7 characters)

---

## 5. Attendants Page (AttendantsPage.tsx)

- Use the four attendants: Eugene, Ezra, Sammy, Simo
- **Add "Add Attendant" button** with a dialog/modal containing fields: Name, Phone, Shift
- **Add "Edit" button** on each attendant card opening a pre-filled edit dialog
- Commission shown as 30% (no base wage)
- Store attendants in React state so adds/edits persist during session

---

## 6. Payroll Page (PayrollPage.tsx)

- Remove base wage column entirely
- Change commission from 15% to 30%
- Total payout = commission only (30% of sales)

---

## 7. Expenses Page (ExpensesPage.tsx)

- Add **tab/toggle** for viewing expenses by: Today, This Week, This Month
- **Expense input form**: Dropdown to select expense category (Water, Electricity, Detergents, Fuel, Maintenance, Rent, Security) + amount input field + "Add Expense" button
- Store expenses in React state for session persistence
- Show totals for each time period

---

## 8. Customers Page (CustomersPage.tsx)

- Display **plate number** as the primary identifier instead of customer name
- Change loyalty threshold from 10 to **15 washes** for free wash eligibility
- Update VIP message to reflect the 15-wash threshold

---

## Technical Details

### Files to modify:
1. `src/lib/mock-data.ts` - Update all mock data (services, add-ons, attendants, customers, dashboard stats)
2. `src/pages/DashboardPage.tsx` - Vehicle counts (daily/weekly/monthly), commission metric
3. `src/pages/NewTransactionPage.tsx` - Plate validation, new services/add-ons, carpet wash section
4. `src/pages/ServicesPage.tsx` - New service catalog display
5. `src/pages/AttendantsPage.tsx` - New attendants, add/edit dialogs
6. `src/pages/PayrollPage.tsx` - Remove base wage, 30% commission
7. `src/pages/ExpensesPage.tsx` - Time period tabs, expense input form
8. `src/pages/CustomersPage.tsx` - Plate number display, 15-wash threshold

### New interfaces needed:
- `CarpetWash` type with size, color, amount, ownerName, phone, attendantId fields
- Updated `Customer` interface to emphasize plateNumber over name

All changes use React `useState` for session-level persistence since there is no backend connected yet.

