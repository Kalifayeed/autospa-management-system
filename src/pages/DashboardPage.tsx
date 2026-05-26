import { useState, useMemo } from "react";
import { Car, DollarSign, Wallet, CalendarDays, CalendarRange, Clock, TrendingUp, CalendarIcon, X } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { useAuth } from "@/lib/auth-context";
import { useAppState } from "@/lib/app-state";
import { COMMISSION_RATE } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DashboardSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "hsl(190, 90%, 40%)",
  "hsl(152, 60%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 55%)",
];

function isSameDay(d1: Date, d2: Date) { return d1.toDateString() === d2.toDateString(); }
function isSameMonth(d: Date, ref: Date) { return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear(); }
function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { stats, transactions, attendants, services, loading } = useAppState();

  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  const isTodaySelected = isSameDay(selectedDay, new Date());
  const isThisMonthSelected = isSameMonth(selectedMonth, new Date());

  // Day-scoped stats (override "Today's" cards)
  const dayStats = useMemo(() => {
    const dayTxs = transactions.filter((tx) => isSameDay(new Date(tx.timestamp), selectedDay));
    const prevDay = new Date(selectedDay); prevDay.setDate(prevDay.getDate() - 1);
    const prevTxs = transactions.filter((tx) => isSameDay(new Date(tx.timestamp), prevDay));

    const revenue = dayTxs.reduce((s, tx) => s + tx.total, 0);
    const commission = revenue * COMMISSION_RATE;
    const prevRevenue = prevTxs.reduce((s, tx) => s + tx.total, 0);
    const prevCommission = prevRevenue * COMMISSION_RATE;

    const serviceMap: Record<string, number> = {};
    dayTxs.forEach((tx) => tx.services.forEach((svc) => {
      const s = services.find((x) => x.name === svc);
      if (s) serviceMap[svc] = (serviceMap[svc] || 0) + s.price;
    }));

    const PAYMENT_LABELS: Record<string, string> = { mpesa: "M-Pesa", cash: "Cash", bank: "Bank Transfer", corporate: "Corporate" };
    const payMap: Record<string, number> = {};
    dayTxs.forEach((tx) => {
      const label = PAYMENT_LABELS[tx.paymentMethod] || tx.paymentMethod;
      payMap[label] = (payMap[label] || 0) + tx.total;
    });

    const HOUR_LABELS = ["7AM", "8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM"];
    const hourMap: Record<string, number> = {};
    HOUR_LABELS.forEach((h) => (hourMap[h] = 0));
    dayTxs.forEach((tx) => {
      const h = new Date(tx.timestamp).getHours();
      const label = h >= 12 ? `${h === 12 ? 12 : h - 12}PM` : `${h}AM`;
      if (hourMap[label] !== undefined) hourMap[label]++;
    });

    const attMap: Record<string, { vehicles: number; sales: number }> = {};
    dayTxs.forEach((tx) => {
      if (!attMap[tx.attendantId]) attMap[tx.attendantId] = { vehicles: 0, sales: 0 };
      attMap[tx.attendantId].vehicles++;
      attMap[tx.attendantId].sales += tx.total;
    });

    return {
      vehicles: dayTxs.length,
      revenue,
      commission,
      vehiclesChange: pctChange(dayTxs.length, prevTxs.length),
      revenueChange: pctChange(revenue, prevRevenue),
      commissionChange: pctChange(commission, prevCommission),
      revenueByService: Object.entries(serviceMap).map(([name, revenue]) => ({ name, revenue })),
      revenueByPayment: Object.entries(payMap).map(([name, value]) => ({ name, value })),
      peakHours: HOUR_LABELS.map((hour) => ({ hour, vehicles: hourMap[hour] || 0 })),
      attendantStats: attendants.map((a) => ({
        id: a.id, name: a.name,
        vehiclesHandled: attMap[a.id]?.vehicles || 0,
        totalSales: attMap[a.id]?.sales || 0,
        commission: (attMap[a.id]?.sales || 0) * COMMISSION_RATE,
      })),
      recent: [...dayTxs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    };
  }, [transactions, services, attendants, selectedDay]);

  // Month-scoped stats (override "This Month" card)
  const monthStats = useMemo(() => {
    const monthTxs = transactions.filter((tx) => isSameMonth(new Date(tx.timestamp), selectedMonth));
    const prevMonthRef = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
    const prevMonthTxs = transactions.filter((tx) => isSameMonth(new Date(tx.timestamp), prevMonthRef));
    return {
      vehicles: monthTxs.length,
      change: pctChange(monthTxs.length, prevMonthTxs.length),
    };
  }, [transactions, selectedMonth]);

  const dayLabel = isTodaySelected ? "Today" : format(selectedDay, "MMM d, yyyy");
  const monthLabel = isThisMonthSelected ? "This Month" : format(selectedMonth, "MMMM yyyy");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">Here's your business overview</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("gap-2 h-8 text-xs", !isTodaySelected && "border-primary text-primary")}>
                <CalendarIcon className="h-3.5 w-3.5" /> Day: {dayLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={selectedDay} onSelect={(d) => d && setSelectedDay(d)}
                disabled={(date) => date > new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          {!isTodaySelected && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setSelectedDay(new Date())}>
              <X className="h-3 w-3 mr-1" /> Today
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("gap-2 h-8 text-xs", !isThisMonthSelected && "border-primary text-primary")}>
                <CalendarRange className="h-3.5 w-3.5" /> Month: {monthLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={selectedMonth}
                onSelect={(d) => d && setSelectedMonth(new Date(d.getFullYear(), d.getMonth(), 1))}
                disabled={(date) => date > new Date()}
                defaultMonth={selectedMonth}
                initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          {!isThisMonthSelected && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setSelectedMonth(new Date())}>
              <X className="h-3 w-3 mr-1" /> This month
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <MetricCard title={`${isTodaySelected ? "Today's" : format(selectedDay, "MMM d")} Vehicles`} value={dayStats.vehicles} icon={Car} variant="primary" index={0}
          trend={{ value: dayStats.vehiclesChange, label: "vs prev day" }} />
        <MetricCard title="This Week" value={stats.totalVehiclesWeek} icon={CalendarDays} variant="primary" index={1}
          trend={{ value: stats.vehiclesWeekChange, label: "vs last week" }} />
        <MetricCard title={isThisMonthSelected ? "This Month" : monthLabel} value={monthStats.vehicles} icon={CalendarRange} variant="primary" index={2}
          trend={{ value: monthStats.change, label: "vs prev month" }} />
        <MetricCard title={`${isTodaySelected ? "Today's" : format(selectedDay, "MMM d")} Revenue`} value={`KES ${dayStats.revenue.toLocaleString()}`} icon={DollarSign} variant="success" index={3}
          trend={{ value: dayStats.revenueChange, label: "vs prev day" }} />
        <MetricCard title={`Commission (${COMMISSION_RATE * 100}%)`} value={`KES ${Math.round(dayStats.commission).toLocaleString()}`} icon={Wallet} variant="warning" index={4}
          trend={{ value: dayStats.commissionChange, label: "vs prev day" }} />
      </div>

      {/* Monthly Forecast (only when current month selected) */}
      {isThisMonthSelected && (
        <div className="glass-card-premium rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "forwards" }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-primary bg-primary/10">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-card-foreground">Monthly Forecast</h3>
                <p className="text-xs text-muted-foreground">Projected based on current daily pace</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Projected Revenue</p>
                <p className="text-xl font-bold font-display text-card-foreground">KES {Math.round(stats.monthForecastRevenue).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">So far: KES {Math.round(stats.monthRevenueSoFar).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Projected Vehicles</p>
                <p className="text-xl font-bold font-display text-card-foreground">{Math.round(stats.monthForecastVehicles).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">So far: {stats.monthVehiclesSoFar}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card-premium rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
          <h3 className="font-display font-semibold text-card-foreground mb-4">Revenue by Service · {dayLabel}</h3>
          {dayStats.revenueByService.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dayStats.revenueByService}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-35} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">No revenue data for {dayLabel.toLowerCase()}</div>
          )}
        </div>

        <div className="glass-card-premium rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
          <h3 className="font-display font-semibold text-card-foreground mb-4">Payment Methods · {dayLabel}</h3>
          {dayStats.revenueByPayment.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={dayStats.revenueByPayment} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {dayStats.revenueByPayment.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">No payment data for {dayLabel.toLowerCase()}</div>
          )}
        </div>
      </div>

      {/* Peak Hours + Top Attendants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card-premium rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
          <h3 className="font-display font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Peak Hours · {dayLabel}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dayStats.peakHours}>
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="vehicles" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card-premium rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "500ms", animationFillMode: "forwards" }}>
          <h3 className="font-display font-semibold text-card-foreground mb-4">Top Attendants · {dayLabel}</h3>
          <div className="space-y-3">
            {dayStats.attendantStats.some((a) => a.totalSales > 0) ? (
              [...dayStats.attendantStats]
                .sort((a, b) => b.totalSales - a.totalSales)
                .slice(0, 4)
                .map((att, i) => (
                  <div key={att.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{att.name}</p>
                      <p className="text-xs text-muted-foreground">{att.vehiclesHandled} vehicles</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-card-foreground">KES {att.totalSales.toLocaleString()}</p>
                      <p className="text-xs text-success">Com: KES {Math.round(att.commission).toLocaleString()}</p>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">No transactions for {dayLabel.toLowerCase()}</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions for selected day */}
      <div className="glass-card-premium rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "600ms", animationFillMode: "forwards" }}>
        <h3 className="font-display font-semibold text-card-foreground mb-4">Transactions · {dayLabel}</h3>
        {dayStats.recent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Plate</th>
                  <th className="text-left py-2 text-muted-foreground font-medium hidden md:table-cell">Services</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Attendant</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Amount</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {dayStats.recent.slice(0, 8).map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50">
                    <td className="py-2.5 font-medium text-card-foreground">{tx.plateNumber}</td>
                    <td className="py-2.5 text-muted-foreground hidden md:table-cell">{tx.services.join(", ")}</td>
                    <td className="py-2.5 text-muted-foreground">{tx.attendantName}</td>
                    <td className="py-2.5 text-right font-medium text-card-foreground">KES {tx.total.toLocaleString()}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.paymentStatus === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {tx.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No transactions for {dayLabel.toLowerCase()}.</p>
        )}
      </div>
    </div>
  );
}
