import { mockExpenses, dashboardStats } from "@/lib/mock-data";
import MetricCard from "@/components/MetricCard";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

const categoryColors: Record<string, string> = {
  Water: "bg-chart-1/10 text-chart-1",
  Detergents: "bg-chart-2/10 text-chart-2",
  Electricity: "bg-chart-3/10 text-chart-3",
  Fuel: "bg-chart-4/10 text-chart-4",
  Maintenance: "bg-chart-5/10 text-chart-5",
  Rent: "bg-primary/10 text-primary",
  Security: "bg-muted text-muted-foreground",
};

export default function ExpensesPage() {
  const totalExpenses = mockExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Expenses</h1>
        <p className="text-muted-foreground text-sm">Track and manage business expenses</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard title="Total Expenses" value={`KES ${totalExpenses.toLocaleString()}`} icon={TrendingDown} variant="destructive" />
        <MetricCard title="Today's Revenue" value={`KES ${dashboardStats.totalRevenue.toLocaleString()}`} icon={DollarSign} variant="success" />
        <MetricCard title="Net Profit" value={`KES ${(dashboardStats.totalRevenue - totalExpenses).toLocaleString()}`} icon={TrendingUp} variant="primary" />
      </div>

      <div className="glass-card rounded-xl p-5">
        <h2 className="font-display font-semibold text-card-foreground mb-4">Expense Log</h2>
        <div className="space-y-3">
          {mockExpenses.map((exp) => (
            <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 animate-fade-in">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-md font-medium ${categoryColors[exp.category] || "bg-muted text-muted-foreground"}`}>
                  {exp.category}
                </span>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{exp.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(exp.date).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="font-bold font-display text-destructive">-KES {exp.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
