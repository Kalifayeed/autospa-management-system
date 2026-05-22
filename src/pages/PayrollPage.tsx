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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableSkeleton } from "@/components/skeletons";
import AttendantTransactionsDialog from "@/components/AttendantTransactionsDialog";

type SelectionMode = "single" | "range";

export default function PayrollPage() {
  const { attendants, transactions, loading } = useAppState();
  const [mode, setMode] = useState<SelectionMode>("single");
  const [singleDate, setSingleDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date(),
  });
  const [viewAttendant, setViewAttendant] = useState<{ id: string; name: string } | null>(null);

  if (loading) return <TableSkeleton rows={5} />;

  const effectiveFrom = mode === "single" ? singleDate : dateRange.from;
  const effectiveTo = mode === "single" ? singleDate : dateRange.to;

  const rangeStats = useMemo(() => {
    const startDate = effectiveFrom;
    const endDate = effectiveTo ?? startDate;

    if (!startDate) {
      return { attendantStats: [], totalCommissions: 0, totalVehicles: 0, totalSales: 0 };
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
      commission: (attMap[a.id]?.sales || 0) * COMMISSION_RATE,
    }));

    return {
      attendantStats,
      totalCommissions: attendantStats.reduce((sum, a) => sum + a.commission, 0),
      totalVehicles: attendantStats.reduce((sum, a) => sum + a.vehiclesHandled, 0),
      totalSales: attendantStats.reduce((sum, a) => sum + a.totalSales, 0),
    };
  }, [transactions, attendants, effectiveFrom, effectiveTo]);

  const isToday = effectiveFrom?.toDateString() === new Date().toDateString() &&
    effectiveTo?.toDateString() === new Date().toDateString();

  const isSingleDay = effectiveFrom && effectiveTo &&
    effectiveFrom.toDateString() === effectiveTo.toDateString();

  const dateLabel = useMemo(() => {
    if (!effectiveFrom) return "Pick a date";
    if (isSingleDay) {
      return isToday ? "Today" : format(effectiveFrom, "MMM d, yyyy");
    }
    return `${format(effectiveFrom, "MMM d")} – ${format(effectiveTo ?? effectiveFrom, "MMM d, yyyy")}`;
  }, [effectiveFrom, effectiveTo, isToday, isSingleDay]);

  const resetToToday = () => {
    setSingleDate(new Date());
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
          title={`Total Commissions ${isSingleDay ? (isToday ? "Today" : format(effectiveFrom ?? new Date(), "MMM d")) : ""}`}
          value={`KES ${Math.round(rangeStats.totalCommissions).toLocaleString()}`}
          icon={Wallet}
          variant="primary"
        />
        <MetricCard title="Active Attendants" value={attendants.filter((a) => a.status === "active").length} icon={Users} variant="success" />
      </div>

      <div className="glass-card rounded-xl p-4 sm:p-5">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-display font-semibold text-card-foreground text-sm sm:text-base">
              {isSingleDay ? "Daily" : "Period"} Payout — {dateLabel}
            </h2>
            {!isToday && (
              <Button variant="ghost" size="sm" onClick={resetToToday} className="gap-1 text-muted-foreground hover:text-foreground h-8 px-2">
                <X className="h-3.5 w-3.5" /> Reset
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Tabs value={mode} onValueChange={(v) => setMode(v as SelectionMode)} className="shrink-0">
              <TabsList className="h-8">
                <TabsTrigger value="single" className="text-xs px-3 h-7">Single Day</TabsTrigger>
                <TabsTrigger value="range" className="text-xs px-3 h-7">Date Range</TabsTrigger>
              </TabsList>
            </Tabs>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2 h-8 text-xs sm:text-sm", !isToday && "border-primary text-primary")}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[140px] sm:max-w-none">{dateLabel}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                {mode === "single" ? (
                  <Calendar
                    mode="single"
                    selected={singleDate}
                    onSelect={(day) => {
                      if (day) setSingleDate(day);
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                ) : (
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from) {
                        setDateRange({ from: range.from, to: range.to ?? range.from });
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    numberOfMonths={typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 2}
                    className={cn("p-2 sm:p-3 pointer-events-auto")}
                  />
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-4 sm:px-0 text-muted-foreground font-medium">Attendant</th>
                <th className="text-right py-2 px-2 sm:px-0 text-muted-foreground font-medium">Vehicles</th>
                <th className="text-right py-2 px-2 sm:px-0 text-muted-foreground font-medium">Sales</th>
                <th className="text-right py-2 px-4 sm:px-0 text-muted-foreground font-medium">Commission</th>
              </tr>
            </thead>
            <tbody>
              {rangeStats.attendantStats.map((att) => (
                <tr key={att.id} className="border-b border-border/50">
                  <td className="py-2.5 px-4 sm:px-0 font-medium text-card-foreground">{att.name}</td>
                  <td className="py-2.5 px-2 sm:px-0 text-right text-muted-foreground">{att.vehiclesHandled}</td>
                  <td className="py-2.5 px-2 sm:px-0 text-right text-muted-foreground">KES {att.totalSales.toLocaleString()}</td>
                  <td className="py-2.5 px-4 sm:px-0 text-right font-bold text-success">KES {Math.round(att.commission).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td className="py-2.5 px-4 sm:px-0 font-semibold text-card-foreground">Total</td>
                <td className="py-2.5 px-2 sm:px-0 text-right text-muted-foreground">{rangeStats.totalVehicles}</td>
                <td className="py-2.5 px-2 sm:px-0 text-right text-muted-foreground">KES {rangeStats.totalSales.toLocaleString()}</td>
                <td className="py-2.5 px-4 sm:px-0 text-right font-bold text-success">KES {Math.round(rangeStats.totalCommissions).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
