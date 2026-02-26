import { mockAttendants } from "@/lib/mock-data";
import MetricCard from "@/components/MetricCard";
import { Wallet, Users } from "lucide-react";

export default function PayrollPage() {
  const totalCommissions = mockAttendants.reduce((sum, a) => sum + a.commission, 0);
  const dailyWage = 500; // mock base daily wage

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Payroll & Commissions</h1>
        <p className="text-muted-foreground text-sm">Manage wages, commissions, and payouts</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard title="Total Commissions Today" value={`KES ${totalCommissions.toLocaleString()}`} icon={Wallet} variant="primary" />
        <MetricCard title="Active Attendants" value={mockAttendants.filter((a) => a.status === "active").length} icon={Users} variant="success" />
      </div>

      <div className="glass-card rounded-xl p-5">
        <h2 className="font-display font-semibold text-card-foreground mb-4">Daily Payout Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">Attendant</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Base Wage</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Sales</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Commission (15%)</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Total Payout</th>
              </tr>
            </thead>
            <tbody>
              {mockAttendants.map((att) => (
                <tr key={att.id} className="border-b border-border/50">
                  <td className="py-2.5 font-medium text-card-foreground">{att.name}</td>
                  <td className="py-2.5 text-right text-muted-foreground">KES {dailyWage}</td>
                  <td className="py-2.5 text-right text-muted-foreground">KES {att.totalSales.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-success font-medium">KES {att.commission.toLocaleString()}</td>
                  <td className="py-2.5 text-right font-bold text-card-foreground">KES {(dailyWage + att.commission).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
