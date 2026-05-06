import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { AppStateProvider } from "@/lib/app-state";
import { Loader2 } from "lucide-react";

// Lazy load all pages
const AppLayout = lazy(() => import("@/components/AppLayout"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const TransactionsPage = lazy(() => import("@/pages/TransactionsPage"));
const NewTransactionPage = lazy(() => import("@/pages/NewTransactionPage"));
const ServicesPage = lazy(() => import("@/pages/ServicesPage"));
const AttendantsPage = lazy(() => import("@/pages/AttendantsPage"));
const ExpensesPage = lazy(() => import("@/pages/ExpensesPage"));
const PayrollPage = lazy(() => import("@/pages/PayrollPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const CustomersPage = lazy(() => import("@/pages/CustomersPage"));
const UserManagementPage = lazy(() => import("@/pages/UserManagementPage"));
const CashReconciliationPage = lazy(() => import("@/pages/CashReconciliationPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="h-8 w-64 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-48 rounded-md bg-muted animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-muted animate-pulse mt-4" />
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppStateProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/transactions" element={<TransactionsPage />} />
                  <Route path="/transactions/new" element={<NewTransactionPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/attendants" element={<AttendantsPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/payroll" element={<PayrollPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/users" element={<UserManagementPage />} />
                  <Route path="/cash-reconciliation" element={<CashReconciliationPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AppStateProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
