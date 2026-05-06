import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/lib/app-state";
import { useAuth } from "@/lib/auth-context";
import MetricCard from "@/components/MetricCard";
import { Wallet, Banknote, AlertTriangle, CheckCircle2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Reconciliation {
  id: string;
  date: string;
  expected_cash: number;
  counted_cash: number;
  variance: number;
  notes: string;
  recorded_by_name: string;
  created_at: string;
}

function isSameDay(d1: Date, d2: Date) { return d1.toDateString() === d2.toDateString(); }

export default function CashReconciliationPage() {
  const { transactions } = useAppState();
  const { user } = useAuth();
  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const expectedCash = useMemo(() => {
    return transactions
      .filter((tx) => isSameDay(new Date(tx.timestamp), today) && tx.paymentMethod === "cash" && tx.paymentStatus === "paid")
      .reduce((s, tx) => s + tx.total, 0);
  }, [transactions]);

  const cashTxCount = useMemo(() => transactions.filter(
    (tx) => isSameDay(new Date(tx.timestamp), today) && tx.paymentMethod === "cash" && tx.paymentStatus === "paid"
  ).length, [transactions]);

  const variance = counted === "" ? 0 : Number(counted) - expectedCash;

  const loadHistory = async () => {
    setLoading(true);
    const { data } = await supabase.from("cash_reconciliations").select("*").order("date", { ascending: false }).limit(30);
    if (data) setHistory(data as Reconciliation[]);
    setLoading(false);
  };

  useEffect(() => { loadHistory(); }, []);

  const todayRec = history.find((r) => r.date === todayStr);

  useEffect(() => {
    if (todayRec) {
      setCounted(String(todayRec.counted_cash));
      setNotes(todayRec.notes || "");
    }
  }, [todayRec]);

  const handleSave = async () => {
    if (counted === "" || isNaN(Number(counted))) {
      toast.error("Enter the counted cash amount");
      return;
    }
    setSaving(true);
    const payload = {
      date: todayStr,
      expected_cash: expectedCash,
      counted_cash: Number(counted),
      variance: Number(counted) - expectedCash,
      notes,
      recorded_by_name: user?.name || "",
    };
    const { error } = todayRec
      ? await supabase.from("cash_reconciliations").update(payload).eq("id", todayRec.id)
      : await supabase.from("cash_reconciliations").insert(payload);
    setSaving(false);
    if (error) {
      toast.error("Failed to save reconciliation");
      return;
    }
    toast.success(todayRec ? "Reconciliation updated" : "Reconciliation logged");
    loadHistory();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Daily Cash Reconciliation</h1>
        <p className="text-muted-foreground text-sm">Count physical cash against system records — flag variances early.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard title="Expected Cash (Today)" value={`KES ${expectedCash.toLocaleString()}`} icon={Banknote} variant="primary" subtitle={`${cashTxCount} cash transactions`} />
        <MetricCard title="Counted Cash" value={`KES ${counted ? Number(counted).toLocaleString() : "—"}`} icon={Wallet} variant="default" />
        <MetricCard
          title="Variance"
          value={counted === "" ? "—" : `${variance >= 0 ? "+" : ""}KES ${variance.toLocaleString()}`}
          icon={variance === 0 ? CheckCircle2 : AlertTriangle}
          variant={counted === "" ? "default" : variance === 0 ? "success" : variance > 0 ? "warning" : "destructive"}
        />
      </div>

      <div className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="font-display font-semibold text-card-foreground">
          End-of-Day Closing — {today.toLocaleDateString()}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Physical Cash Count (KES)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              placeholder="0"
              className="text-lg font-display"
            />
          </div>
          <div className="space-y-2">
            <Label>System Expected (auto)</Label>
            <Input value={`KES ${expectedCash.toLocaleString()}`} readOnly className="text-lg font-display bg-secondary/50" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Notes / Variance Explanation</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. KES 200 short — change given for tip; KES 500 extra found in drawer..."
            rows={3}
          />
        </div>
        {counted !== "" && variance !== 0 && (
          <div className={cn("rounded-lg p-3 text-sm border flex items-start gap-2",
            variance > 0 ? "bg-warning/10 border-warning/30 text-warning" : "bg-destructive/10 border-destructive/30 text-destructive")}>
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              {variance > 0
                ? `Surplus of KES ${variance.toLocaleString()} — extra cash in drawer.`
                : `Shortage of KES ${Math.abs(variance).toLocaleString()} — investigate before closing.`}
            </span>
          </div>
        )}
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto gradient-brand text-primary-foreground border-0">
          {saving ? "Saving..." : todayRec ? "Update Reconciliation" : "Log Reconciliation"}
        </Button>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h2 className="font-display font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-primary" /> Recent Reconciliations
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reconciliations recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Date</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Expected</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Counted</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Variance</th>
                  <th className="text-left py-2 text-muted-foreground font-medium hidden sm:table-cell">By</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-2.5 font-medium text-card-foreground">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="py-2.5 text-right text-muted-foreground">KES {Number(r.expected_cash).toLocaleString()}</td>
                    <td className="py-2.5 text-right text-muted-foreground">KES {Number(r.counted_cash).toLocaleString()}</td>
                    <td className={cn("py-2.5 text-right font-semibold",
                      r.variance === 0 ? "text-success" : r.variance > 0 ? "text-warning" : "text-destructive")}>
                      {r.variance > 0 ? "+" : ""}KES {Number(r.variance).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-muted-foreground hidden sm:table-cell">{r.recorded_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
