import { useAppState } from "@/lib/app-state";
import { COMMISSION_RATE } from "@/lib/mock-data";
import MetricCard from "@/components/MetricCard";
import { Wallet, Users } from "lucide-react";

export default function PayrollPage() {
  const { attendants, stats } = useAppState();
  const attStats = stats.attendantStats;
  const totalCommissions = attStats.reduce((sum, a) => sum + a.commission, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Payroll & Commissions</h1>
        <p className="text-muted-foreground text-sm">Commission rate: {COMMISSION_RATE * 100}% of sales · No base wage</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard title="Total Commissions Today" value={`KES ${totalCommissions.toLocaleString()}`} icon={Wallet} variant="primary" />
        <MetricCard title="Active Attendants" value={attendants.filter((a) => a.status === "active").length} icon={Users} variant="success" />
      </div>

      <div className="glass-card rounded-xl p-5">
        <h2 className="font-display font-semibold text-card-foreground mb-4">Daily Payout Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">Attendant</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Vehicles</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Sales</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Commission (30%)</th>
              </tr>
            </thead>
            <tbody>
              {attStats.map((att) => (
                <tr key={att.id} className="border-b border-border/50">
                  <td className="py-2.5 font-medium text-card-foreground">{att.name}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{att.vehiclesHandled}</td>
                  <td className="py-2.5 text-right text-muted-foreground">KES {att.totalSales.toLocaleString()}</td>
                  <td className="py-2.5 text-right font-bold text-success">KES {att.commission.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td className="py-2.5 font-semibold text-card-foreground">Total</td>
                <td className="py-2.5 text-right text-muted-foreground">{attStats.reduce((s, a) => s + a.vehiclesHandled, 0)}</td>
                <td className="py-2.5 text-right text-muted-foreground">KES {attStats.reduce((s, a) => s + a.totalSales, 0).toLocaleString()}</td>
                <td className="py-2.5 text-right font-bold text-success">KES {totalCommissions.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
