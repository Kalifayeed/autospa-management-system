import { useState } from "react";
import { useAppState } from "@/lib/app-state";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ListSkeleton } from "@/components/skeletons";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { transactions, loading } = useAppState();

  if (loading) return <ListSkeleton rows={6} />;

  const filtered = transactions.filter(
    (tx) =>
      tx.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
      tx.attendantName.toLowerCase().includes(search.toLowerCase()) ||
      tx.services.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground text-sm">View and manage all transactions</p>
        </div>
        <Button onClick={() => navigate("/transactions/new")} className="gradient-brand text-primary-foreground border-0 touch-target">
          <Plus className="h-4 w-4 mr-2" /> New Transaction
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by plate, attendant, or service..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 touch-target" />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-muted-foreground">No transactions yet. Click "New Transaction" to get started.</p>
          </div>
        )}
        {filtered.map((tx) => (
          <div key={tx.id} className="glass-card rounded-xl p-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-card-foreground font-display">{tx.plateNumber}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{tx.vehicleType}</span>
                </div>
                <p className="text-sm text-muted-foreground">{tx.services.join(" • ")}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {tx.attendantName} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold font-display text-card-foreground">KES {tx.total.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1 justify-end">
                  <span className="text-xs text-muted-foreground">{tx.paymentMethod}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.paymentStatus === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                    {tx.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
