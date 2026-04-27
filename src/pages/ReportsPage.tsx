import { BarChart3, Download, TrendingUp, TrendingDown, DollarSign, Wallet, Receipt, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/app-state";
import { COMMISSION_RATE } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useMemo } from "react";

type Period = "today" | "week" | "month";

function isSameDay(d1: Date, d2: Date) { return d1.toDateString() === d2.toDateString(); }
function isWithinWeek(d: Date, ref: Date) { const w = new Date(ref); w.setDate(w.getDate() - 7); return d >= w && d <= ref; }
function isSameMonth(d: Date, ref: Date) { return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear(); }

const HOUR_LABELS = ["7AM", "8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM"];

export default function ReportsPage() {
  const { transactions, services, expenses, attendants } = useAppState();
  const [period, setPeriod] = useState<Period>("today");

  const periodLabel = period === "today" ? "Today" : period === "week" ? "This Week" : "This Month";

  const filterByPeriod = (dateStr: string) => {
    const now = new Date();
    const d = new Date(dateStr);
    if (period === "today") return isSameDay(d, now);
    if (period === "week") return isWithinWeek(d, now);
    return isSameMonth(d, now);
  };

  const filtered = useMemo(() => transactions.filter((tx) => filterByPeriod(tx.timestamp)), [transactions, period]);
  const filteredExpenses = useMemo(() => expenses.filter((e) => filterByPeriod(e.date)), [expenses, period]);

  const stats = useMemo(() => {
    const totalRevenue = filtered.reduce((s, tx) => s + tx.total, 0);
    const totalCommission = totalRevenue * COMMISSION_RATE;
    const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const totalPayouts = totalCommission; // commission is the payout to attendants
    const totalDeductions = totalExpenses + totalPayouts;
    const netProfit = totalRevenue - totalDeductions;

    // Expense breakdown by category
    const expenseCategoryMap: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      expenseCategoryMap[e.category] = (expenseCategoryMap[e.category] || 0) + e.amount;
    });
    const expensesByCategory = Object.entries(expenseCategoryMap).map(([category, amount]) => ({ category, amount }));

    const serviceMap: Record<string, number> = {};
    filtered.forEach((tx) => {
      tx.services.forEach((svc) => {
        const service = services.find((s) => s.name === svc);
        if (service) serviceMap[svc] = (serviceMap[svc] || 0) + service.price;
      });
    });
    const revenueByService = Object.entries(serviceMap).map(([name, revenue]) => ({ name, revenue }));

    const topService = revenueByService.length > 0
      ? revenueByService.reduce((a, b) => a.revenue > b.revenue ? a : b).name
      : "N/A";

    const hourMap: Record<string, number> = {};
    HOUR_LABELS.forEach((h) => (hourMap[h] = 0));
    filtered.forEach((tx) => {
      const h = new Date(tx.timestamp).getHours();
      const label = h >= 12 ? `${h === 12 ? 12 : h - 12}PM` : `${h}AM`;
      if (hourMap[label] !== undefined) hourMap[label]++;
    });
    const peakHours = HOUR_LABELS.map((hour) => ({ hour, vehicles: hourMap[hour] || 0 }));
    const peakHour = peakHours.length > 0 ? peakHours.reduce((a, b) => a.vehicles > b.vehicles ? a : b) : null;

    return { totalRevenue, totalCommission, totalExpenses, totalPayouts, totalDeductions, netProfit, expensesByCategory, revenueByService, topService, peakHour, vehicleCount: filtered.length };
  }, [filtered, filteredExpenses, services]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm">Business performance & balance sheet</p>
        </div>
        <Button variant="outline" className="touch-target">
          <Download className="h-4 w-4 mr-2" /> Export Report
        </Button>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2">
        {(["today", "week", "month"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </div>

      {/* Balance Sheet Summary */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" /> {periodLabel}'s Balance Sheet
        </h3>

        {/* Income */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm font-semibold text-success">Income</span>
          </div>
          <div className="bg-success/5 rounded-lg p-4 border border-success/20">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Revenue ({stats.vehicleCount} vehicles)</span>
              <span className="font-bold text-card-foreground text-lg">KES {stats.totalRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive">Deductions</span>
          </div>
          <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Attendant Payouts (30% commission)
              </span>
              <span className="font-semibold text-card-foreground">KES {stats.totalPayouts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" /> Operating Expenses
              </span>
              <span className="font-semibold text-card-foreground">KES {stats.totalExpenses.toLocaleString()}</span>
            </div>
            {stats.expensesByCategory.length > 0 && (
              <div className="pl-5 space-y-1 pt-1 border-t border-border/50">
                {stats.expensesByCategory.map((ec) => (
                  <div key={ec.category} className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground capitalize">{ec.category}</span>
                    <span className="text-muted-foreground">KES {ec.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-destructive/20">
              <span className="text-sm font-medium text-muted-foreground">Total Deductions</span>
              <span className="font-bold text-card-foreground">KES {stats.totalDeductions.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className={`rounded-lg p-4 border-2 ${stats.netProfit >= 0 ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <span className="font-semibold text-card-foreground">Net Profit</span>
            </div>
            <span className={`font-bold text-xl ${stats.netProfit >= 0 ? "text-success" : "text-destructive"}`}>
              KES {stats.netProfit.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Revenue by Service */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-card-foreground mb-4">{periodLabel}'s Revenue by Service</h3>
        {stats.revenueByService.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.revenueByService}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">No data yet — process transactions to see reports</div>
        )}
      </div>

      {/* Smart Insights */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> {periodLabel}'s Insights
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Vehicles", value: String(stats.vehicleCount), detail: periodLabel },
            { label: "Peak Hour", value: stats.peakHour && stats.peakHour.vehicles > 0 ? stats.peakHour.hour : "N/A", detail: stats.peakHour && stats.peakHour.vehicles > 0 ? `${stats.peakHour.vehicles} vehicles` : "No data yet" },
            { label: "Top Service", value: stats.topService, detail: "By revenue" },
            { label: "Total Revenue", value: `KES ${stats.totalRevenue.toLocaleString()}`, detail: `Commission: KES ${stats.totalCommission.toLocaleString()}` },
          ].map((insight) => (
            <div key={insight.label} className="p-3 rounded-lg bg-secondary/30">
              <p className="text-xs text-muted-foreground">{insight.label}</p>
              <p className="font-semibold text-card-foreground">{insight.value}</p>
              <p className="text-xs text-primary mt-0.5">{insight.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
