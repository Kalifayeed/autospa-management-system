import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { COMMISSION_RATE, EXPENSE_CATEGORIES } from "@/lib/mock-data";
import type { Transaction, Expense, Attendant, Customer, Service, ServiceAddOn } from "@/lib/mock-data";

interface AppState {
  transactions: Transaction[];
  expenses: Expense[];
  attendants: Attendant[];
  customers: Customer[];
  services: Service[];
  addOns: ServiceAddOn[];
  loading: boolean;
  addTransaction: (tx: Omit<Transaction, "id">) => Promise<void>;
  addExpense: (exp: Omit<Expense, "id">) => Promise<void>;
  addAttendant: (att: Omit<Attendant, "id">) => Promise<void>;
  updateAttendant: (id: string, data: Partial<Attendant>) => Promise<void>;
  redeemCustomerWash: (customerId: string) => Promise<void>;
  stats: {
    totalVehiclesToday: number;
    totalVehiclesWeek: number;
    totalVehiclesMonth: number;
    totalRevenue: number;
    totalCommission: number;
    // Comparison vs previous period (percent change, can be null when no baseline)
    vehiclesTodayChange: number | null;
    vehiclesWeekChange: number | null;
    vehiclesMonthChange: number | null;
    revenueChange: number | null;
    commissionChange: number | null;
    // Forecast for current month based on daily pace so far
    monthForecastRevenue: number;
    monthForecastVehicles: number;
    monthRevenueSoFar: number;
    monthVehiclesSoFar: number;
    revenueByService: { name: string; revenue: number }[];
    revenueByPayment: { name: string; value: number }[];
    peakHours: { hour: string; vehicles: number }[];
    attendantStats: { id: string; name: string; vehiclesHandled: number; totalSales: number; commission: number }[];
  };
  expensesByPeriod: (period: "today" | "week" | "month") => Expense[];
  totalExpensesByPeriod: (period: "today" | "week" | "month") => number;
}

const AppStateContext = createContext<AppState | null>(null);

function getToday() { return new Date(); }
function isSameDay(d1: Date, d2: Date) { return d1.toDateString() === d2.toDateString(); }
function isWithinWeek(d: Date, ref: Date) { const w = new Date(ref); w.setDate(w.getDate() - 7); return d >= w && d <= ref; }
function isSameMonth(d: Date, ref: Date) { return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear(); }

const PAYMENT_LABELS: Record<string, string> = { mpesa: "M-Pesa", cash: "Cash", bank: "Bank Transfer", corporate: "Corporate" };
const HOUR_LABELS = ["7AM", "8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM"];

// Map DB row to app Transaction
function mapDbTransaction(row: any): Transaction {
  return {
    id: row.id,
    plateNumber: row.plate_number,
    vehicleType: row.vehicle_type,
    services: row.services || [],
    addOns: row.add_ons || [],
    attendantId: row.attendant_id,
    attendantName: row.attendant_name,
    total: Number(row.total),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status as Transaction["paymentStatus"],
    timestamp: row.created_at,
    notes: row.notes || undefined,
    carpetWash: row.carpet_owner ? {
      size: row.carpet_size || "Small",
      color: row.carpet_color || "",
      amount: Number(row.carpet_amount) || 0,
      ownerName: row.carpet_owner,
      phone: row.carpet_phone || "",
      attendantId: row.carpet_attendant || "",
    } : undefined,
  };
}

function mapDbAttendant(row: any): Attendant {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || "",
    shift: row.shift as Attendant["shift"],
    vehiclesHandled: 0,
    totalSales: 0,
    commission: 0,
    status: row.status as Attendant["status"],
  };
}

function mapDbExpense(row: any): Expense {
  return { id: row.id, category: row.category, description: row.description, amount: Number(row.amount), date: row.date };
}

function mapDbCustomer(row: any): Customer {
  return {
    id: row.id, plateNumber: row.plate_number, name: row.name || "", phone: row.phone || "",
    visits: row.visits, loyaltyPoints: row.loyalty_points, lastVisit: row.last_visit || "",
  };
}

function mapDbService(row: any): Service {
  return { id: row.id, name: row.name, category: row.category, price: Number(row.price), duration: row.duration, description: row.description };
}

function mapDbAddOn(row: any): ServiceAddOn {
  return { id: row.id, name: row.name, price: Number(row.price) };
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<ServiceAddOn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchAll() {
      try {
        const [txRes, expRes, attRes, custRes, svcRes, aoRes] = await Promise.all([
          supabase.from("transactions").select("*").order("created_at", { ascending: false }),
          supabase.from("expenses").select("*").order("date", { ascending: false }),
          supabase.from("attendants").select("*").order("name"),
          supabase.from("customers").select("*").order("created_at", { ascending: false }),
          supabase.from("services").select("*").order("category, name"),
          supabase.from("add_ons").select("*").order("name"),
        ]);
        if (!isMounted) return;
        if (txRes.data) setTransactions(txRes.data.map(mapDbTransaction));
        if (expRes.data) setExpenses(expRes.data.map(mapDbExpense));
        if (attRes.data) setAttendants(attRes.data.map(mapDbAttendant));
        if (custRes.data) setCustomers(custRes.data.map(mapDbCustomer));
        if (svcRes.data) setServices(svcRes.data.map(mapDbService));
        if (aoRes.data) setAddOns(aoRes.data.map(mapDbAddOn));
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAll();
    return () => { isMounted = false; };
  }, []);

  const addTransaction = useCallback(async (tx: Omit<Transaction, "id">) => {
    const { data, error } = await supabase.from("transactions").insert({
      plate_number: tx.plateNumber,
      vehicle_type: tx.vehicleType,
      services: tx.services,
      add_ons: tx.addOns,
      attendant_id: tx.attendantId,
      attendant_name: tx.attendantName,
      total: tx.total,
      payment_method: tx.paymentMethod,
      payment_status: tx.paymentStatus,
      notes: tx.notes || null,
      carpet_size: tx.carpetWash?.size || null,
      carpet_color: tx.carpetWash?.color || null,
      carpet_amount: tx.carpetWash?.amount || null,
      carpet_owner: tx.carpetWash?.ownerName || null,
      carpet_phone: tx.carpetWash?.phone || null,
      carpet_attendant: tx.carpetWash?.attendantId || null,
    }).select().single();

    if (error) { console.error("Insert transaction error:", error); return; }
    if (data) setTransactions((prev) => [mapDbTransaction(data), ...prev]);

    // Upsert customer if plate number exists
    const cleanPlate = tx.plateNumber.replace(/\s/g, "").toUpperCase();
    if (cleanPlate && cleanPlate !== "CARPET") {
      const { data: existing } = await supabase.from("customers").select("*").eq("plate_number", cleanPlate).maybeSingle();
      if (existing) {
        await supabase.from("customers").update({
          visits: existing.visits + 1,
          loyalty_points: existing.visits + 1,
          last_visit: new Date().toISOString().split("T")[0],
        }).eq("id", existing.id);
        setCustomers((prev) => prev.map((c) => c.id === existing.id
          ? { ...c, visits: existing.visits + 1, loyaltyPoints: existing.visits + 1, lastVisit: new Date().toISOString().split("T")[0] }
          : c));
      } else {
        const { data: newCust } = await supabase.from("customers").insert({
          plate_number: cleanPlate,
          name: "",
          phone: "",
          visits: 1,
          loyalty_points: 1,
          last_visit: new Date().toISOString().split("T")[0],
        }).select().single();
        if (newCust) setCustomers((prev) => [mapDbCustomer(newCust), ...prev]);
      }
    }
  }, []);

  const addExpense = useCallback(async (exp: Omit<Expense, "id">) => {
    const { data, error } = await supabase.from("expenses").insert({
      category: exp.category,
      description: exp.description,
      amount: exp.amount,
      date: exp.date,
    }).select().single();
    if (error) { console.error("Insert expense error:", error); return; }
    if (data) setExpenses((prev) => [mapDbExpense(data), ...prev]);
  }, []);

  const addAttendant = useCallback(async (att: Omit<Attendant, "id">) => {
    const { data, error } = await supabase.from("attendants").insert({
      name: att.name,
      phone: att.phone,
      shift: att.shift,
      status: att.status,
    }).select().single();
    if (error) { console.error("Insert attendant error:", error); return; }
    if (data) setAttendants((prev) => [...prev, mapDbAttendant(data)]);
  }, []);

  const updateAttendant = useCallback(async (id: string, data: Partial<Attendant>) => {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.shift !== undefined) updateData.shift = data.shift;
    if (data.status !== undefined) updateData.status = data.status;

    const { error } = await supabase.from("attendants").update(updateData).eq("id", id);
    if (error) { console.error("Update attendant error:", error); return; }
    setAttendants((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  }, []);

  const redeemCustomerWash = useCallback(async (customerId: string) => {
    const { error } = await supabase.from("customers").update({
      visits: 0,
      loyalty_points: 0,
    }).eq("id", customerId);
    if (error) { console.error("Redeem wash error:", error); throw error; }
    setCustomers((prev) => prev.map((c) => c.id === customerId ? { ...c, visits: 0, loyaltyPoints: 0 } : c));
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
    (period: "today" | "week" | "month") => expensesByPeriod(period).reduce((sum, e) => sum + e.amount, 0),
    [expensesByPeriod]
  );

  const stats = useMemo(() => {
    const now = getToday();
    const todayTxs = transactions.filter((tx) => isSameDay(new Date(tx.timestamp), now));
    const weekTxs = transactions.filter((tx) => isWithinWeek(new Date(tx.timestamp), now));
    const monthTxs = transactions.filter((tx) => isSameMonth(new Date(tx.timestamp), now));

    const totalRevenue = todayTxs.reduce((s, tx) => s + tx.total, 0);
    const totalCommission = totalRevenue * COMMISSION_RATE;

    const serviceMap: Record<string, number> = {};
    todayTxs.forEach((tx) => {
      tx.services.forEach((svc) => {
        const service = services.find((s) => s.name === svc);
        if (service) serviceMap[svc] = (serviceMap[svc] || 0) + service.price;
      });
    });
    const revenueByService = Object.entries(serviceMap).map(([name, revenue]) => ({ name, revenue }));

    const payMap: Record<string, number> = {};
    todayTxs.forEach((tx) => {
      const label = PAYMENT_LABELS[tx.paymentMethod] || tx.paymentMethod;
      payMap[label] = (payMap[label] || 0) + tx.total;
    });
    const revenueByPayment = Object.entries(payMap).map(([name, value]) => ({ name, value }));

    const hourMap: Record<string, number> = {};
    HOUR_LABELS.forEach((h) => (hourMap[h] = 0));
    todayTxs.forEach((tx) => {
      const h = new Date(tx.timestamp).getHours();
      const label = h >= 12 ? `${h === 12 ? 12 : h - 12}PM` : `${h}AM`;
      if (hourMap[label] !== undefined) hourMap[label]++;
    });
    const peakHours = HOUR_LABELS.map((hour) => ({ hour, vehicles: hourMap[hour] || 0 }));

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
      commission: (attMap[a.id]?.sales || 0) * COMMISSION_RATE,
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
  }, [transactions, attendants, services]);

  return (
    <AppStateContext.Provider
      value={{
        transactions, expenses, attendants, customers, services, addOns, loading,
        addTransaction, addExpense, addAttendant, updateAttendant, redeemCustomerWash,
        stats, expensesByPeriod, totalExpensesByPeriod,
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
