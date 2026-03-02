import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import {
  type Transaction,
  type Expense,
  type Attendant,
  type Customer,
  mockServices,
  mockAddOns,
  COMMISSION_RATE,
  EXPENSE_CATEGORIES,
} from "@/lib/mock-data";

interface AppState {
  transactions: Transaction[];
  expenses: Expense[];
  attendants: Attendant[];
  customers: Customer[];
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  addExpense: (exp: Omit<Expense, "id">) => void;
  addAttendant: (att: Omit<Attendant, "id">) => void;
  updateAttendant: (id: string, data: Partial<Attendant>) => void;
  // Computed stats
  stats: {
    totalVehiclesToday: number;
    totalVehiclesWeek: number;
    totalVehiclesMonth: number;
    totalRevenue: number;
    totalCommission: number;
    revenueByService: { name: string; revenue: number }[];
    revenueByPayment: { name: string; value: number }[];
    peakHours: { hour: string; vehicles: number }[];
    attendantStats: { id: string; name: string; vehiclesHandled: number; totalSales: number; commission: number }[];
  };
  expensesByPeriod: (period: "today" | "week" | "month") => Expense[];
  totalExpensesByPeriod: (period: "today" | "week" | "month") => number;
}

const AppStateContext = createContext<AppState | null>(null);

function getToday() {
  return new Date();
}

function isSameDay(d1: Date, d2: Date) {
  return d1.toDateString() === d2.toDateString();
}

function isWithinWeek(d: Date, ref: Date) {
  const weekAgo = new Date(ref);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return d >= weekAgo && d <= ref;
}

function isSameMonth(d: Date, ref: Date) {
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

const PAYMENT_LABELS: Record<string, string> = {
  mpesa: "M-Pesa",
  cash: "Cash",
  bank: "Bank Transfer",
  corporate: "Corporate",
};

const HOUR_LABELS = [
  "7AM", "8AM", "9AM", "10AM", "11AM", "12PM",
  "1PM", "2PM", "3PM", "4PM", "5PM", "6PM",
];

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [attendants, setAttendants] = useState<Attendant[]>([
    { id: "1", name: "Eugene", phone: "0712345678", shift: "morning", vehiclesHandled: 0, totalSales: 0, commission: 0, status: "active" },
    { id: "2", name: "Ezra", phone: "0723456789", shift: "morning", vehiclesHandled: 0, totalSales: 0, commission: 0, status: "active" },
    { id: "3", name: "Sammy", phone: "0734567890", shift: "afternoon", vehiclesHandled: 0, totalSales: 0, commission: 0, status: "active" },
    { id: "4", name: "Simo", phone: "0745678901", shift: "afternoon", vehiclesHandled: 0, totalSales: 0, commission: 0, status: "active" },
  ]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    const newTx: Transaction = { ...tx, id: `T${Date.now()}` };
    setTransactions((prev) => [newTx, ...prev]);

    // Update or create customer
    setCustomers((prev) => {
      const existing = prev.find((c) => c.plateNumber === tx.plateNumber);
      if (existing) {
        return prev.map((c) =>
          c.plateNumber === tx.plateNumber
            ? { ...c, visits: c.visits + 1, loyaltyPoints: c.visits + 1, lastVisit: tx.timestamp.split("T")[0] }
            : c
        );
      }
      return [
        ...prev,
        {
          id: `C${Date.now()}`,
          plateNumber: tx.plateNumber,
          name: "",
          phone: "",
          visits: 1,
          loyaltyPoints: 1,
          lastVisit: tx.timestamp.split("T")[0],
        },
      ];
    });
  }, []);

  const addExpense = useCallback((exp: Omit<Expense, "id">) => {
    setExpenses((prev) => [{ ...exp, id: `E${Date.now()}` }, ...prev]);
  }, []);

  const addAttendant = useCallback((att: Omit<Attendant, "id">) => {
    setAttendants((prev) => [...prev, { ...att, id: String(Date.now()) }]);
  }, []);

  const updateAttendant = useCallback((id: string, data: Partial<Attendant>) => {
    setAttendants((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  }, []);

  const expensesByPeriod = useCallback(
    (period: "today" | "week" | "month") => {
      const now = getToday();
      return expenses.filter((e) => {
        const d = new Date(e.date);
        if (period === "today") return isSameDay(d, now);
        if (period === "week") return isWithinWeek(d, now);
        return isSameMonth(d, now);
      });
    },
    [expenses]
  );

  const totalExpensesByPeriod = useCallback(
    (period: "today" | "week" | "month") => {
      return expensesByPeriod(period).reduce((sum, e) => sum + e.amount, 0);
    },
    [expensesByPeriod]
  );

  const stats = useMemo(() => {
    const now = getToday();
    const todayTxs = transactions.filter((tx) => isSameDay(new Date(tx.timestamp), now));
    const weekTxs = transactions.filter((tx) => isWithinWeek(new Date(tx.timestamp), now));
    const monthTxs = transactions.filter((tx) => isSameMonth(new Date(tx.timestamp), now));

    const totalRevenue = todayTxs.reduce((s, tx) => s + tx.total, 0);
    const totalCommission = Math.round(totalRevenue * COMMISSION_RATE);

    // Revenue by service
    const serviceMap: Record<string, number> = {};
    todayTxs.forEach((tx) => {
      tx.services.forEach((svc) => {
        const service = mockServices.find((s) => s.name === svc);
        if (service) serviceMap[svc] = (serviceMap[svc] || 0) + service.price;
      });
    });
    const revenueByService = Object.entries(serviceMap).map(([name, revenue]) => ({ name, revenue }));

    // Revenue by payment
    const payMap: Record<string, number> = {};
    todayTxs.forEach((tx) => {
      const label = PAYMENT_LABELS[tx.paymentMethod] || tx.paymentMethod;
      payMap[label] = (payMap[label] || 0) + tx.total;
    });
    const revenueByPayment = Object.entries(payMap).map(([name, value]) => ({ name, value }));

    // Peak hours
    const hourMap: Record<string, number> = {};
    HOUR_LABELS.forEach((h) => (hourMap[h] = 0));
    todayTxs.forEach((tx) => {
      const h = new Date(tx.timestamp).getHours();
      const label = h >= 12 ? `${h === 12 ? 12 : h - 12}PM` : `${h}AM`;
      if (hourMap[label] !== undefined) hourMap[label]++;
    });
    const peakHours = HOUR_LABELS.map((hour) => ({ hour, vehicles: hourMap[hour] || 0 }));

    // Attendant stats from today's transactions
    const attMap: Record<string, { vehicles: number; sales: number }> = {};
    todayTxs.forEach((tx) => {
      if (!attMap[tx.attendantId]) attMap[tx.attendantId] = { vehicles: 0, sales: 0 };
      attMap[tx.attendantId].vehicles++;
      attMap[tx.attendantId].sales += tx.total;
    });

    const attendantStats = attendants.map((a) => ({
      id: a.id,
      name: a.name,
      vehiclesHandled: attMap[a.id]?.vehicles || 0,
      totalSales: attMap[a.id]?.sales || 0,
      commission: Math.round((attMap[a.id]?.sales || 0) * COMMISSION_RATE),
    }));

    return {
      totalVehiclesToday: todayTxs.length,
      totalVehiclesWeek: weekTxs.length,
      totalVehiclesMonth: monthTxs.length,
      totalRevenue,
      totalCommission,
      revenueByService,
      revenueByPayment,
      peakHours,
      attendantStats,
    };
  }, [transactions, attendants]);

  return (
    <AppStateContext.Provider
      value={{
        transactions,
        expenses,
        attendants,
        customers,
        addTransaction,
        addExpense,
        addAttendant,
        updateAttendant,
        stats,
        expensesByPeriod,
        totalExpensesByPeriod,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
