import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { COMMISSION_RATE, EXPENSE_CATEGORIES } from "@/lib/mock-data";
import type { Transaction, Expense, Attendant, Customer, Service, ServiceAddOn, CarpetWash } from "@/lib/mock-data";

interface AppState {
  transactions: Transaction[];
  expenses: Expense[];
  attendants: Attendant[];
  customers: Customer[];
  services: Service[];
  addOns: ServiceAddOn[];
  addTransaction: (tx: Omit<Transaction, "id">) => Promise<void>;
  addExpense: (exp: Omit<Expense, "id">) => Promise<void>;
  addAttendant: (att: Omit<Attendant, "id">) => Promise<void>;
  updateAttendant: (id: string, data: Partial<Attendant>) => Promise<void>;
  addService: (svc: Omit<Service, "id">) => Promise<void>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addAddOn: (addon: Omit<ServiceAddOn, "id">) => Promise<void>;
  updateAddOn: (id: string, data: Partial<ServiceAddOn>) => Promise<void>;
  deleteAddOn: (id: string) => Promise<void>;
  loading: boolean;
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

function getToday() { return new Date(); }
function isSameDay(d1: Date, d2: Date) { return d1.toDateString() === d2.toDateString(); }
function isWithinWeek(d: Date, ref: Date) { const w = new Date(ref); w.setDate(w.getDate() - 7); return d >= w && d <= ref; }
function isSameMonth(d: Date, ref: Date) { return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear(); }

const PAYMENT_LABELS: Record<string, string> = { mpesa: "M-Pesa", cash: "Cash", bank: "Bank Transfer", corporate: "Corporate" };
const HOUR_LABELS = ["7AM","8AM","9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM","6PM"];

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<ServiceAddOn[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all data from DB on mount
  useEffect(() => {
    async function loadAll() {
      const [svcRes, addOnRes, attRes, txRes, expRes, custRes] = await Promise.all([
        supabase.from("services").select("*").order("category").order("price"),
        supabase.from("add_ons").select("*").order("name"),
        supabase.from("attendants").select("*").order("name"),
        supabase.from("transactions").select("*").order("created_at", { ascending: false }),
        supabase.from("expenses").select("*").order("created_at", { ascending: false }),
        supabase.from("customers").select("*").order("last_visit", { ascending: false }),
      ]);

      if (svcRes.data) setServices(svcRes.data.map(s => ({ id: s.id, name: s.name, category: s.category, price: Number(s.price), duration: s.duration, description: s.description })));
      if (addOnRes.data) setAddOns(addOnRes.data.map(a => ({ id: a.id, name: a.name, price: Number(a.price) })));
      if (attRes.data) setAttendants(attRes.data.map(a => ({ id: a.id, name: a.name, phone: a.phone, shift: a.shift as Attendant["shift"], vehiclesHandled: 0, totalSales: 0, commission: 0, status: a.status as Attendant["status"] })));
      if (txRes.data) setTransactions(txRes.data.map(t => ({
        id: t.id,
        plateNumber: t.plate_number,
        vehicleType: t.vehicle_type,
        services: t.services || [],
        addOns: t.add_ons || [],
        attendantId: t.attendant_id,
        attendantName: t.attendant_name,
        total: Number(t.total),
        paymentMethod: t.payment_method,
        paymentStatus: t.payment_status as Transaction["paymentStatus"],
        timestamp: t.created_at,
        notes: t.notes || undefined,
        carpetWash: t.carpet_owner ? { size: (t.carpet_size || "Small") as CarpetWash["size"], color: t.carpet_color || "", amount: Number(t.carpet_amount || 0), ownerName: t.carpet_owner, phone: t.carpet_phone || "", attendantId: t.carpet_attendant || "" } : undefined,
      })));
      if (expRes.data) setExpenses(expRes.data.map(e => ({ id: e.id, category: e.category, description: e.description, amount: Number(e.amount), date: e.date })));
      if (custRes.data) setCustomers(custRes.data.map(c => ({ id: c.id, plateNumber: c.plate_number, name: c.name, phone: c.phone, visits: c.visits, loyaltyPoints: c.loyalty_points, lastVisit: c.last_visit || "" })));

      setLoading(false);
    }
    loadAll();
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

    if (data) {
      const newTx: Transaction = { ...tx, id: data.id };
      setTransactions(prev => [newTx, ...prev]);

      // Upsert customer
      if (tx.plateNumber && tx.plateNumber !== "CARPET") {
        const existing = customers.find(c => c.plateNumber === tx.plateNumber);
        if (existing) {
          await supabase.from("customers").update({ visits: existing.visits + 1, loyalty_points: existing.visits + 1, last_visit: new Date().toISOString().split("T")[0] }).eq("id", existing.id);
          setCustomers(prev => prev.map(c => c.id === existing.id ? { ...c, visits: c.visits + 1, loyaltyPoints: c.visits + 1, lastVisit: new Date().toISOString().split("T")[0] } : c));
        } else {
          const { data: newCust } = await supabase.from("customers").insert({ plate_number: tx.plateNumber, visits: 1, loyalty_points: 1, last_visit: new Date().toISOString().split("T")[0] }).select().single();
          if (newCust) setCustomers(prev => [...prev, { id: newCust.id, plateNumber: newCust.plate_number, name: "", phone: "", visits: 1, loyaltyPoints: 1, lastVisit: newCust.last_visit || "" }]);
        }
      }
    }
  }, [customers]);

  const addExpense = useCallback(async (exp: Omit<Expense, "id">) => {
    const { data } = await supabase.from("expenses").insert({ category: exp.category, description: exp.description, amount: exp.amount, date: exp.date }).select().single();
    if (data) setExpenses(prev => [{ id: data.id, category: data.category, description: data.description, amount: Number(data.amount), date: data.date }, ...prev]);
  }, []);

  const addAttendant = useCallback(async (att: Omit<Attendant, "id">) => {
    const { data } = await supabase.from("attendants").insert({ name: att.name, phone: att.phone, shift: att.shift, status: att.status }).select().single();
    if (data) setAttendants(prev => [...prev, { id: data.id, name: data.name, phone: data.phone, shift: data.shift as Attendant["shift"], vehiclesHandled: 0, totalSales: 0, commission: 0, status: data.status as Attendant["status"] }]);
  }, []);

  const updateAttendant = useCallback(async (id: string, data: Partial<Attendant>) => {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.phone !== undefined) update.phone = data.phone;
    if (data.shift !== undefined) update.shift = data.shift;
    if (data.status !== undefined) update.status = data.status;
    await supabase.from("attendants").update(update).eq("id", id);
    setAttendants(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  // Service CRUD
  const addService = useCallback(async (svc: Omit<Service, "id">) => {
    const { data } = await supabase.from("services").insert({ name: svc.name, category: svc.category, price: svc.price, duration: svc.duration, description: svc.description }).select().single();
    if (data) setServices(prev => [...prev, { id: data.id, name: data.name, category: data.category, price: Number(data.price), duration: data.duration, description: data.description }]);
  }, []);

  const updateService = useCallback(async (id: string, data: Partial<Service>) => {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.category !== undefined) update.category = data.category;
    if (data.price !== undefined) update.price = data.price;
    if (data.duration !== undefined) update.duration = data.duration;
    if (data.description !== undefined) update.description = data.description;
    await supabase.from("services").update(update).eq("id", id);
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }, []);

  const deleteService = useCallback(async (id: string) => {
    await supabase.from("services").delete().eq("id", id);
    setServices(prev => prev.filter(s => s.id !== id));
  }, []);

  const addAddOn = useCallback(async (addon: Omit<ServiceAddOn, "id">) => {
    const { data } = await supabase.from("add_ons").insert({ name: addon.name, price: addon.price }).select().single();
    if (data) setAddOns(prev => [...prev, { id: data.id, name: data.name, price: Number(data.price) }]);
  }, []);

  const updateAddOn = useCallback(async (id: string, data: Partial<ServiceAddOn>) => {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.price !== undefined) update.price = data.price;
    await supabase.from("add_ons").update(update).eq("id", id);
    setAddOns(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  const deleteAddOn = useCallback(async (id: string) => {
    await supabase.from("add_ons").delete().eq("id", id);
    setAddOns(prev => prev.filter(a => a.id !== id));
  }, []);

  const expensesByPeriod = useCallback((period: "today" | "week" | "month") => {
    const now = getToday();
    return expenses.filter(e => {
      const d = new Date(e.date);
      if (period === "today") return isSameDay(d, now);
      if (period === "week") return isWithinWeek(d, now);
      return isSameMonth(d, now);
    });
  }, [expenses]);

  const totalExpensesByPeriod = useCallback((period: "today" | "week" | "month") => {
    return expensesByPeriod(period).reduce((sum, e) => sum + e.amount, 0);
  }, [expensesByPeriod]);

  const stats = useMemo(() => {
    const now = getToday();
    const todayTxs = transactions.filter(tx => isSameDay(new Date(tx.timestamp), now));
    const weekTxs = transactions.filter(tx => isWithinWeek(new Date(tx.timestamp), now));
    const monthTxs = transactions.filter(tx => isSameMonth(new Date(tx.timestamp), now));

    const totalRevenue = todayTxs.reduce((s, tx) => s + tx.total, 0);
    const totalCommission = Math.round(totalRevenue * COMMISSION_RATE);

    const serviceMap: Record<string, number> = {};
    todayTxs.forEach(tx => {
      tx.services.forEach(svc => {
        const service = services.find(s => s.name === svc);
        if (service) serviceMap[svc] = (serviceMap[svc] || 0) + service.price;
      });
    });
    const revenueByService = Object.entries(serviceMap).map(([name, revenue]) => ({ name, revenue }));

    const payMap: Record<string, number> = {};
    todayTxs.forEach(tx => {
      const label = PAYMENT_LABELS[tx.paymentMethod] || tx.paymentMethod;
      payMap[label] = (payMap[label] || 0) + tx.total;
    });
    const revenueByPayment = Object.entries(payMap).map(([name, value]) => ({ name, value }));

    const hourMap: Record<string, number> = {};
    HOUR_LABELS.forEach(h => (hourMap[h] = 0));
    todayTxs.forEach(tx => {
      const h = new Date(tx.timestamp).getHours();
      const label = h >= 12 ? `${h === 12 ? 12 : h - 12}PM` : `${h}AM`;
      if (hourMap[label] !== undefined) hourMap[label]++;
    });
    const peakHours = HOUR_LABELS.map(hour => ({ hour, vehicles: hourMap[hour] || 0 }));

    const attMap: Record<string, { vehicles: number; sales: number }> = {};
    todayTxs.forEach(tx => {
      if (!attMap[tx.attendantId]) attMap[tx.attendantId] = { vehicles: 0, sales: 0 };
      attMap[tx.attendantId].vehicles++;
      attMap[tx.attendantId].sales += tx.total;
    });

    const attendantStats = attendants.map(a => ({
      id: a.id,
      name: a.name,
      vehiclesHandled: attMap[a.id]?.vehicles || 0,
      totalSales: attMap[a.id]?.sales || 0,
      commission: Math.round((attMap[a.id]?.sales || 0) * COMMISSION_RATE),
    }));

    return { totalVehiclesToday: todayTxs.length, totalVehiclesWeek: weekTxs.length, totalVehiclesMonth: monthTxs.length, totalRevenue, totalCommission, revenueByService, revenueByPayment, peakHours, attendantStats };
  }, [transactions, attendants, services]);

  return (
    <AppStateContext.Provider value={{ transactions, expenses, attendants, customers, services, addOns, addTransaction, addExpense, addAttendant, updateAttendant, addService, updateService, deleteService, addAddOn, updateAddOn, deleteAddOn, loading, stats, expensesByPeriod, totalExpensesByPeriod }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
