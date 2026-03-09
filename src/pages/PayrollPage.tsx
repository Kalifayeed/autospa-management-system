import { useState, useMemo } from "react";
import { useAppState } from "@/lib/app-state";
import { COMMISSION_RATE } from "@/lib/mock-data";
import MetricCard from "@/components/MetricCard";
import { Wallet, Users, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function PayrollPage() {
  const { attendants, transactions } = useAppState();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dayStats = useMemo(() => {
    const dayTxs = transactions.filter(
      (tx) => new Date(tx.timestamp).toDateString() === selectedDate.toDateString()
    );

    const attMap: Record<string, { vehicles: number; sales: number }> = {};
    dayTxs.forEach((tx) => {
      if (!attMap[tx.attendantId]) attMap[tx.attendantId] = { vehicles: 0, sales: 0 };
      attMap[tx.attendantId].vehicles++;
      attMap[tx.attendantId].sales += tx.total;
    });

    return attendants.map((a) => ({
      id: a.id,
      name: a.name,
      vehiclesHandled: attMap[a.id]?.vehicles || 0,
      totalSales: attMap[a.id]?.sales || 0,
      commission: Math.round((attMap[a.id]?.sales || 0) * COMMISSION_RATE),
    }));
  }, [transactions, attendants, selectedDate]);

  const totalCommissions = dayStats.reduce((sum, a) => sum + a.commission, 0);
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Payroll & Commissions</h1>
        <p className="text-muted-foreground text-sm">Commission rate: {COMMISSION_RATE * 100}% of sales · No base wage</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard title={`Total Commissions ${isToday ? "Today" : format(selectedDate, "MMM d")}`} value={`KES ${totalCommissions.toLocaleString()}`} icon={Wallet} variant="primary" />
        <MetricCard title="Active Attendants" value={attendants.filter((a) => a.status === "active").length} icon={Users} variant="success" />
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-card-foreground">
            Daily Payout Summary — {isToday ? "Today" : format(selectedDate, "PPP")}
          </h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("gap-2", !isToday && "border-primary text-primary")}>
                <CalendarIcon className="h-4 w-4" />
                {isToday ? "Pick date" : format(selectedDate, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                disabled={(date) => date > new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
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
              {dayStats.map((att) => (
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
                <td className="py-2.5 text-right text-muted-foreground">{dayStats.reduce((s, a) => s + a.vehiclesHandled, 0)}</td>
                <td className="py-2.5 text-right text-muted-foreground">KES {dayStats.reduce((s, a) => s + a.totalSales, 0).toLocaleString()}</td>
                <td className="py-2.5 text-right font-bold text-success">KES {totalCommissions.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
