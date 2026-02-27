import { useState } from "react";
import { mockAttendants, type Attendant, COMMISSION_RATE } from "@/lib/mock-data";
import { Trophy, Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function AttendantsPage() {
  const [attendants, setAttendants] = useState<Attendant[]>(mockAttendants);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formShift, setFormShift] = useState<Attendant["shift"]>("morning");

  const sorted = [...attendants].sort((a, b) => b.totalSales - a.totalSales);

  const openAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormPhone("");
    setFormShift("morning");
    setDialogOpen(true);
  };

  const openEdit = (att: Attendant) => {
    setEditingId(att.id);
    setFormName(att.name);
    setFormPhone(att.phone);
    setFormShift(att.shift);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }
    if (editingId) {
      setAttendants((prev) =>
        prev.map((a) => a.id === editingId ? { ...a, name: formName, phone: formPhone, shift: formShift } : a)
      );
      toast.success("Attendant updated");
    } else {
      const newAtt: Attendant = {
        id: String(Date.now()),
        name: formName,
        phone: formPhone,
        shift: formShift,
        vehiclesHandled: 0,
        totalSales: 0,
        commission: 0,
        status: "active",
      };
      setAttendants((prev) => [...prev, newAtt]);
      toast.success("Attendant added");
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Attendants</h1>
          <p className="text-muted-foreground text-sm">Manage staff and track performance · Commission: {COMMISSION_RATE * 100}%</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Attendant" : "Add Attendant"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Attendant name" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="0712345678" />
              </div>
              <div className="space-y-2">
                <Label>Shift</Label>
                <Select value={formShift} onValueChange={(v) => setFormShift(v as Attendant["shift"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full">{editingId ? "Save Changes" : "Add Attendant"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Performance Rankings */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="font-display font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" /> Daily Rankings
        </h2>
        <div className="space-y-3">
          {sorted.map((att, i) => (
            <div key={att.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm",
                i === 0 ? "bg-warning/20 text-warning" : i === 1 ? "bg-muted text-muted-foreground" : i === 2 ? "bg-warning/10 text-warning/70" : "bg-secondary text-secondary-foreground"
              )}>
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-card-foreground">{att.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>{att.vehiclesHandled} vehicles</span>
                  <span className={cn("px-1.5 py-0.5 rounded", att.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                    {att.status}
                  </span>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="font-bold font-display text-card-foreground">KES {att.totalSales.toLocaleString()}</p>
                  <p className="text-xs text-success">Com: KES {att.commission.toLocaleString()}</p>
                </div>
                <button onClick={() => openEdit(att)} className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
