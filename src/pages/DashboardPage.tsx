import { Car, DollarSign, Wallet, CalendarDays, CalendarRange, Clock } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { useAuth } from "@/lib/auth-context";
import { useAppState } from "@/lib/app-state";
import { COMMISSION_RATE } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CHART_COLORS = [
  "hsl(190, 90%, 40%)",
  "hsl(152, 60%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 55%)",
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { stats, transactions } = useAppState();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">Here's your business overview for today</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <MetricCard title="Today's Vehicles" value={stats.totalVehiclesToday} icon={Car} variant="primary" />
        <MetricCard title="This Week" value={stats.totalVehiclesWeek} icon={CalendarDays} variant="primary" />
        <MetricCard title="This Month" value={stats.totalVehiclesMonth} icon={CalendarRange} variant="primary" />
        <MetricCard title="Total Revenue" value={`KES ${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} variant="success" />
        <MetricCard title={`Commission (${COMMISSION_RATE * 100}%)`} value={`KES ${stats.totalCommission.toLocaleString()}`} icon={Wallet} variant="warning" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-display font-semibold text-card-foreground mb-4">Revenue by Service</h3>
          {stats.revenueByService.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.revenueByService}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-35} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">No transactions yet today</div>
          )}
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-display font-semibold text-card-foreground mb-4">Payment Methods</h3>
          {stats.revenueByPayment.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={stats.revenueByPayment} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {stats.revenueByPayment.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">No transactions yet today</div>
          )}
        </div>
      </div>

      {/* Peak Hours + Top Attendants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-display font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Peak Hours
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.peakHours}>
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="vehicles" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-display font-semibold text-card-foreground mb-4">Top Attendants Today</h3>
          <div className="space-y-3">
            {stats.attendantStats.length > 0 ? (
              [...stats.attendantStats]
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
                      <p className="text-xs text-success">Com: KES {att.commission.toLocaleString()}</p>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">No transactions yet today</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-card-foreground mb-4">Recent Transactions</h3>
        {transactions.length > 0 ? (
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
                {transactions.slice(0, 5).map((tx) => (
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
          <p className="text-sm text-muted-foreground">No transactions yet. Create one from the Transactions page.</p>
        )}
      </div>
    </div>
  );
}
