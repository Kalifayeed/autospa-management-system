import { useState, useMemo } from "react";
import { useAppState } from "@/lib/app-state";
import { COMMISSION_RATE } from "@/lib/mock-data";
import MetricCard from "@/components/MetricCard";
import { Wallet, Users, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function PayrollPage() {
  const { attendants, transactions } = useAppState();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>({
    from: new Date(),
    to: new Date(),
  });

  const rangeStats = useMemo(() => {
    const startDate = dateRange?.from;
    const endDate = dateRange?.to ?? startDate;

    if (!startDate) {
      return {
        attendantStats: [],
        totalCommissions: 0,
        totalVehicles: 0,
        totalSales: 0,
      };
    }

    const rangeTxs = transactions.filter((tx) => {
      const txDate = new Date(tx.timestamp);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return txDate >= start && txDate <= end;
    });

    const attMap: Record<string, { vehicles: number; sales: number }> = {};
    rangeTxs.forEach((tx) => {
      if (!attMap[tx.attendantId]) attMap[tx.attendantId] = { vehicles: 0, sales: 0 };
      attMap[tx.attendantId].vehicles++;
      attMap[tx.attendantId].sales += tx.total;
    });

    const attendantStats = attendants.map((a) => ({
      id: a.id,
      name: a.name,
      vehiclesHandled: attMap[a.id]?.vehicles || 0,
      totalSales: attMap[a.id]?.sales || 0,
      commission: Math.round((attMap[a.id]?.sales || 0) * COMMISSION_RATE),
    }));

    const totalCommissions = attendantStats.reduce((sum, a) => sum + a.commission, 0);
    const totalVehicles = attendantStats.reduce((sum, a) => sum + a.vehiclesHandled, 0);
    const totalSales = attendantStats.reduce((sum, a) => sum + a.totalSales, 0);

    return { attendantStats, totalCommissions, totalVehicles, totalSales };
  }, [transactions, attendants, dateRange]);

  const isToday =
    dateRange?.from?.toDateString() === new Date().toDateString() &&
    dateRange?.to?.toDateString() === new Date().toDateString();

  const isSingleDay =
    dateRange?.from &&
    dateRange?.to &&
    dateRange.from.toDateString() === dateRange.to.toDateString();

  const dateLabel = useMemo(() => {
    if (!dateRange?.from) return "Pick date range";
    if (isSingleDay) {
      return isToday ? "Today" : format(dateRange.from, "MMM d, yyyy");
    }
    return `${format(dateRange.from, "MMM d")} – ${format(dateRange.to ?? dateRange.from, "MMM d, yyyy")}`;
  }, [dateRange, isToday, isSingleDay]);

  const clearDateRange = () => {
    setDateRange({ from: new Date(), to: new Date() });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Payroll & Commissions</h1>
        <p className="text-muted-foreground text-sm">Commission rate: {COMMISSION_RATE * 100}% of sales · No base wage</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          title={`Total Commissions ${isSingleDay ? (isToday ? "Today" : format(dateRange?.from ?? new Date(), "MMM d")) : ""}`}
          value={`KES ${rangeStats.totalCommissions.toLocaleString()}`}
          icon={Wallet}
          variant="primary"
        />
        <MetricCard title="Active Attendants" value={attendants.filter((a) => a.status === "active").length} icon={Users} variant="success" />
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-card-foreground">
            {isSingleDay ? "Daily" : "Period"} Payout Summary — {dateLabel}
          </h2>
          <div className="flex items-center gap-2">
            {!isToday && (
              <Button variant="ghost" size="sm" onClick={clearDateRange} className="gap-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
                Reset
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2", !isToday && "border-primary text-primary")}>
                  <CalendarIcon className="h-4 w-4" />
                  {dateLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{
                    from: dateRange?.from,
                    to: dateRange?.to,
                  }}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({
                        from: range.from,
                        to: range.to ?? range.from,
                      });
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
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
              {rangeStats.attendantStats.map((att) => (
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
                <td className="py-2.5 text-right text-muted-foreground">{rangeStats.totalVehicles}</td>
                <td className="py-2.5 text-right text-muted-foreground">KES {rangeStats.totalSales.toLocaleString()}</td>
                <td className="py-2.5 text-right font-bold text-success">KES {rangeStats.totalCommissions.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
