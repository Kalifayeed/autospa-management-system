import { Car, DollarSign, TrendingUp, Clock, Wallet, ArrowDown } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { dashboardStats, mockTransactions, mockAttendants } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CHART_COLORS = [
  "hsl(190, 90%, 40%)",
  "hsl(152, 60%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 55%)",
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">Here's your business overview for today</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard title="Vehicles Washed" value={dashboardStats.totalVehiclesToday} icon={Car} variant="primary" trend={{ value: 12, label: "vs yesterday" }} />
        <MetricCard title="Total Revenue" value={`KES ${dashboardStats.totalRevenue.toLocaleString()}`} icon={DollarSign} variant="success" trend={{ value: 8, label: "vs yesterday" }} />
        <MetricCard title="Today's Profit" value={`KES ${dashboardStats.todayProfit.toLocaleString()}`} icon={TrendingUp} variant="primary" />
        <MetricCard title="Pending Payments" value={`KES ${dashboardStats.pendingPayments.toLocaleString()}`} icon={Wallet} variant="warning" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Service */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-display font-semibold text-card-foreground mb-4">Revenue by Service</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dashboardStats.revenueByService}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-display font-semibold text-card-foreground mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={dashboardStats.revenueByPayment}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {dashboardStats.revenueByPayment.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Peak Hours + Top Attendants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Peak Hours */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-display font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Peak Hours
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dashboardStats.peakHours}>
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="vehicles" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Attendants */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-display font-semibold text-card-foreground mb-4">Top Attendants Today</h3>
          <div className="space-y-3">
            {[...mockAttendants]
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
                  <p className="text-sm font-semibold text-card-foreground">KES {att.totalSales.toLocaleString()}</p>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-card-foreground mb-4">Recent Transactions</h3>
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
              {mockTransactions.slice(0, 5).map((tx) => (
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
      </div>
    </div>
  );
}
