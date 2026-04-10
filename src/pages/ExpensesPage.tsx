import { useState } from "react";
import { useAppState } from "@/lib/app-state";
import { EXPENSE_CATEGORIES } from "@/lib/mock-data";
import MetricCard from "@/components/MetricCard";
import { DollarSign, TrendingDown, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const categoryColors: Record<string, string> = {
  Water: "bg-chart-1/10 text-chart-1",
  Detergents: "bg-chart-2/10 text-chart-2",
  Electricity: "bg-chart-3/10 text-chart-3",
  Fuel: "bg-chart-4/10 text-chart-4",
  Maintenance: "bg-chart-5/10 text-chart-5",
  Rent: "bg-primary/10 text-primary",
  Security: "bg-muted text-muted-foreground",
};

type Period = "today" | "week" | "month";

export default function ExpensesPage() {
  const { addExpense, expensesByPeriod, totalExpensesByPeriod, stats } = useAppState();
  const [period, setPeriod] = useState<Period>("today");
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const filtered = expensesByPeriod(period);
  const totalExpenses = totalExpensesByPeriod(period);

  const handleAdd = () => {
    if (!newCategory || !newAmount || Number(newAmount) <= 0) {
      toast.error("Select category and enter amount");
      return;
    }
    addExpense({
      category: newCategory,
      description: newCategory,
      amount: Number(newAmount),
      date: new Date().toISOString().split("T")[0],
    });
    setNewCategory("");
    setNewAmount("");
    toast.success("Expense added");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Expenses</h1>
        <p className="text-muted-foreground text-sm">Track and manage business expenses</p>
      </div>

      <div className="flex gap-2">
        {(["today", "week", "month"] as Period[]).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
              period === p ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
            {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard title="Total Expenses" value={`KES ${totalExpenses.toLocaleString()}`} icon={TrendingDown} variant="destructive" />
        <MetricCard title="Today's Revenue" value={`KES ${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} variant="success" />
        <MetricCard title="Net Profit" value={`KES ${(stats.totalRevenue - totalExpenses).toLocaleString()}`} icon={TrendingUp} variant="primary" />
      </div>

      <div className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="font-display font-semibold text-card-foreground flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" /> Log Expense
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={newCategory} onValueChange={setNewCategory}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="Amount (KES)" className="flex-1" />
          <Button onClick={handleAdd} className="gap-1"><Plus className="h-4 w-4" /> Add</Button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h2 className="font-display font-semibold text-card-foreground mb-4">Expense Log</h2>

        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No expenses for this period.</p>}

        {filtered.length > 0 && (() => {
          const grouped = filtered.reduce<Record<string, { total: number; items: typeof filtered }>>((acc, exp) => {
            if (!acc[exp.category]) acc[exp.category] = { total: 0, items: [] };
            acc[exp.category].total += exp.amount;
            acc[exp.category].items.push(exp);
            return acc;
          }, {});

          return (
            <div className="space-y-4">
              {Object.entries(grouped)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([category, { total, items }]) => (
                  <details key={category} className="group rounded-lg bg-secondary/30 overflow-hidden animate-fade-in">
                    <summary className="flex items-center justify-between p-3 cursor-pointer list-none hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${categoryColors[category] || "bg-muted text-muted-foreground"}`}>{category}</span>
                        <span className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? "entry" : "entries"}</span>
                      </div>
                      <p className="font-bold font-display text-destructive">-KES {total.toLocaleString()}</p>
                    </summary>
                    <div className="border-t border-border/50 divide-y divide-border/30">
                      {items.map((exp) => (
                        <div key={exp.id} className="flex items-center justify-between px-4 py-2">
                          <div>
                            <p className="text-sm font-medium text-card-foreground">{exp.description}</p>
                            <p className="text-xs text-muted-foreground">{new Date(exp.date).toLocaleDateString()}</p>
                          </div>
                          <p className="text-sm font-medium text-destructive">-KES {exp.amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
