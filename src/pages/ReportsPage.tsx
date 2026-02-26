import { BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dashboardStats } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const weeklyData = [
  { day: "Mon", revenue: 28000, expenses: 12000 },
  { day: "Tue", revenue: 32000, expenses: 11000 },
  { day: "Wed", revenue: 25000, expenses: 14000 },
  { day: "Thu", revenue: 35000, expenses: 10000 },
  { day: "Fri", revenue: 42000, expenses: 13000 },
  { day: "Sat", revenue: 48000, expenses: 15000 },
  { day: "Sun", revenue: 22000, expenses: 8000 },
];

export default function ReportsPage() {
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

      {/* Weekly Revenue vs Expenses */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-card-foreground mb-4">Weekly Revenue vs Expenses</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Profit Trend */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-card-foreground mb-4">Profit Trend (Weekly)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={weeklyData.map((d) => ({ ...d, profit: d.revenue - d.expenses }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Line type="monotone" dataKey="profit" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: "hsl(var(--success))" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Smart Insights */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Smart Insights
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Busiest Day", value: "Saturday", detail: "48,000 KES revenue" },
            { label: "Peak Hour", value: "9:00 AM", detail: "9 vehicles/hour" },
            { label: "Top Service", value: "Small Car Wash", detail: "35% of all transactions" },
            { label: "Slowest Period", value: "Sun afternoon", detail: "Consider promotions" },
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
