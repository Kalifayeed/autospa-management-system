import { BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/app-state";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useMemo } from "react";

type Period = "today" | "week" | "month";

function isSameDay(d1: Date, d2: Date) { return d1.toDateString() === d2.toDateString(); }
function isWithinWeek(d: Date, ref: Date) { const w = new Date(ref); w.setDate(w.getDate() - 7); return d >= w && d <= ref; }
function isSameMonth(d: Date, ref: Date) { return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear(); }

const HOUR_LABELS = ["7AM", "8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM"];
const PAYMENT_LABELS: Record<string, string> = { mpesa: "M-Pesa", cash: "Cash", bank: "Bank Transfer", corporate: "Corporate" };

export default function ReportsPage() {
  const { transactions, services, attendants } = useAppState();
  const [period, setPeriod] = useState<Period>("today");

  const periodLabel = period === "today" ? "Today" : period === "week" ? "This Week" : "This Month";

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      const d = new Date(tx.timestamp);
      if (period === "today") return isSameDay(d, now);
      if (period === "week") return isWithinWeek(d, now);
      return isSameMonth(d, now);
    });
  }, [transactions, period]);

  const stats = useMemo(() => {
    const totalRevenue = filtered.reduce((s, tx) => s + tx.total, 0);
    const totalCommission = Math.round(totalRevenue * 0.3);

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

    return { totalRevenue, totalCommission, revenueByService, topService, peakHour, vehicleCount: filtered.length };
  }, [filtered, services]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm">Business performance insights</p>
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
            { label: "Vehicles", value: String(stats.vehicleCount), detail: `${periodLabel}` },
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
