import { BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/app-state";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function ReportsPage() {
  const { stats } = useAppState();

  // Derive top service and peak hour from live data
  const topService = stats.revenueByService.length > 0
    ? stats.revenueByService.reduce((a, b) => a.revenue > b.revenue ? a : b).name
    : "N/A";
  const peakHour = stats.peakHours.length > 0
    ? stats.peakHours.reduce((a, b) => a.vehicles > b.vehicles ? a : b)
    : null;

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

      {/* Revenue by Service */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-card-foreground mb-4">Today's Revenue by Service</h3>
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
          <BarChart3 className="h-4 w-4 text-primary" /> Today's Insights
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Vehicles Today", value: String(stats.totalVehiclesToday), detail: `${stats.totalVehiclesWeek} this week` },
            { label: "Peak Hour", value: peakHour && peakHour.vehicles > 0 ? peakHour.hour : "N/A", detail: peakHour && peakHour.vehicles > 0 ? `${peakHour.vehicles} vehicles` : "No data yet" },
            { label: "Top Service", value: topService, detail: "By revenue" },
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
