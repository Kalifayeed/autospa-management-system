import { useMemo } from "react";
import { useAppState } from "@/lib/app-state";
import { COMMISSION_RATE } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
  attendantId: string | null;
  attendantName?: string;
  from: Date;
  to: Date;
  periodLabel?: string;
}

export default function AttendantTransactionsDialog({ open, onClose, attendantId, attendantName, from, to, periodLabel }: Props) {
  const { transactions } = useAppState();

  const filtered = useMemo(() => {
    if (!attendantId) return [];
    const start = new Date(from); start.setHours(0, 0, 0, 0);
    const end = new Date(to); end.setHours(23, 59, 59, 999);
    return transactions
      .filter((tx) => tx.attendantId === attendantId)
      .filter((tx) => {
        const d = new Date(tx.timestamp);
        return d >= start && d <= end;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, attendantId, from, to]);

  const totalSales = filtered.reduce((s, tx) => s + tx.total, 0);
  const commission = totalSales * COMMISSION_RATE;

  const label = periodLabel ?? (from.toDateString() === to.toDateString()
    ? format(from, "MMM d, yyyy")
    : `${format(from, "MMM d")} – ${format(to, "MMM d, yyyy")}`);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            {attendantName} <span className="text-muted-foreground font-normal text-sm">· {label}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 my-3">
          <div className="bg-secondary/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Vehicles</p>
            <p className="font-display font-bold text-card-foreground">{filtered.length}</p>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Sales</p>
            <p className="font-display font-bold text-card-foreground">KES {totalSales.toLocaleString()}</p>
          </div>
          <div className="bg-success/10 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Commission</p>
            <p className="font-display font-bold text-success">KES {Math.round(commission).toLocaleString()}</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No transactions for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Time</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Plate</th>
                  <th className="text-left py-2 text-muted-foreground font-medium hidden sm:table-cell">Services</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50">
                    <td className="py-2 text-muted-foreground text-xs">{format(new Date(tx.timestamp), "MMM d, HH:mm")}</td>
                    <td className="py-2 font-medium text-card-foreground">{tx.plateNumber}</td>
                    <td className="py-2 text-muted-foreground hidden sm:table-cell">{tx.services.join(", ")}</td>
                    <td className="py-2 text-right font-medium text-card-foreground">KES {tx.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
