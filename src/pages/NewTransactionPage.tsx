import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { type CarpetWash } from "@/lib/mock-data";
import { useAppState } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, ArrowLeft, Car, CreditCard, Smartphone, Building2, Banknote, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const vehicleTypes = ["Sedan", "SUV", "Pickup", "Van", "Motorcycle", "Bus"];
const paymentMethods = [
  { id: "mpesa", label: "M-Pesa", icon: Smartphone },
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "bank", label: "Bank Transfer", icon: Building2 },
  { id: "corporate", label: "Corporate", icon: CreditCard },
];

type TransactionType = "car_wash" | "carpet_wash" | "both";

export default function NewTransactionPage() {
  const navigate = useNavigate();
  const { addTransaction, attendants, services, addOns } = useAppState();

  const [transactionType, setTransactionType] = useState<TransactionType>("car_wash");
  const [submitting, setSubmitting] = useState(false);

  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [attendantId, setAttendantId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [carpetSize, setCarpetSize] = useState<CarpetWash["size"]>("Small");
  const [carpetColor, setCarpetColor] = useState("");
  const [carpetAmount, setCarpetAmount] = useState(0);
  const [carpetOwner, setCarpetOwner] = useState("");
  const [carpetPhone, setCarpetPhone] = useState("");
  const [carpetAttendant, setCarpetAttendant] = useState("");

  const activeAttendants = attendants.filter((a) => a.status === "active");

  const includesCarWash = transactionType === "car_wash" || transactionType === "both";
  const includesCarpet = transactionType === "carpet_wash" || transactionType === "both";

  const serviceTotal = includesCarWash
    ? services.filter((s) => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.price, 0) +
      addOns.filter((a) => selectedAddOns.includes(a.id)).reduce((sum, a) => sum + a.price, 0)
    : 0;

  const total = serviceTotal + (includesCarpet ? carpetAmount : 0);
  const plateValid = plateNumber.replace(/\s/g, "").length >= 7;

  // Only allow one wash service at a time per plate number
  const toggleService = (id: string) => setSelectedServices((prev) => prev.includes(id) ? [] : [id]);
  const toggleAddOn = (id: string) => setSelectedAddOns((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);

  const handleSubmit = async () => {
    if (includesCarWash) {
      if (!plateValid) { toast.error("Plate number must be at least 7 characters"); return; }
      if (!vehicleType || selectedServices.length === 0 || !attendantId) { toast.error("Please fill in all vehicle wash fields"); return; }
    }
    if (includesCarpet) {
      if (!carpetOwner || !carpetPhone || carpetAmount <= 0) { toast.error("Please fill in all carpet wash fields (owner, phone, amount)"); return; }
    }
    if (!paymentMethod) { toast.error("Please select a payment method"); return; }

    const finalAttendantId = includesCarWash ? attendantId : carpetAttendant;
    if (!finalAttendantId) { toast.error("Please assign an attendant"); return; }

    const attendant = attendants.find((a) => a.id === finalAttendantId);
    const serviceNames = includesCarWash ? services.filter((s) => selectedServices.includes(s.id)).map((s) => s.name) : [];
    const addOnNames = includesCarWash ? addOns.filter((a) => selectedAddOns.includes(a.id)).map((a) => a.name) : [];

    setSubmitting(true);
    await addTransaction({
      plateNumber: includesCarWash ? plateNumber.toUpperCase() : (carpetOwner || "CARPET"),
      vehicleType: includesCarWash ? vehicleType : "Carpet Wash",
      services: includesCarpet && !includesCarWash ? ["Carpet Wash"] : serviceNames,
      addOns: addOnNames,
      attendantId: finalAttendantId,
      attendantName: attendant?.name || "",
      total,
      paymentMethod: paymentMethods.find((p) => p.id === paymentMethod)?.label || paymentMethod,
      paymentStatus: "paid",
      timestamp: new Date().toISOString(),
      notes: notes || undefined,
      carpetWash: includesCarpet
        ? { size: carpetSize, color: carpetColor, amount: carpetAmount, ownerName: carpetOwner, phone: carpetPhone, attendantId: carpetAttendant }
        : undefined,
    });
    setSubmitting(false);

    toast.success("Transaction completed successfully!");
    navigate("/transactions");
  };

  // Group services by category
  const categories = [...new Set(services.map((s) => s.category))];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center touch-target">
          <ArrowLeft className="h-5 w-5 text-secondary-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">New Transaction</h1>
          <p className="text-muted-foreground text-sm">Process a new wash service</p>
        </div>
      </div>

      {/* Transaction Type Selector */}
      <section className="glass-card rounded-xl p-5 space-y-3">
        <h2 className="font-display font-semibold text-card-foreground">Transaction Type *</h2>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: "car_wash", label: "Car Wash", icon: Car },
            { id: "carpet_wash", label: "Carpet Wash", icon: Scissors },
            { id: "both", label: "Both", icon: Car },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => setTransactionType(t.id)}
              className={cn("flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all touch-target",
                transactionType === t.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30")}>
              <t.icon className={cn("h-5 w-5", transactionType === t.id ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-xs font-medium", transactionType === t.id ? "text-primary" : "text-muted-foreground")}>{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Vehicle Info */}
      {includesCarWash && (
        <section className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="font-display font-semibold text-card-foreground flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" /> Vehicle Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plate Number * <span className="text-xs text-muted-foreground">(min 7 chars)</span></Label>
              <Input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value.toUpperCase())} placeholder="e.g. KCA 123A"
                className={cn("touch-target font-mono", plateNumber && !plateValid && "border-destructive")} />
              {plateNumber && !plateValid && <p className="text-xs text-destructive">Enter at least 7 characters</p>}
            </div>
            <div className="space-y-2">
              <Label>Vehicle Type *</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="touch-target"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{vehicleTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {includesCarWash && (
        <section className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="font-display font-semibold text-card-foreground">Select Services *</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {services.map((service) => {
              const selected = selectedServices.includes(service.id);
              return (
                <button key={service.id} onClick={() => toggleService(service.id)}
                  className={cn("flex items-center justify-between p-3 rounded-lg border transition-all touch-target text-left",
                    selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30")}>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.category} · {service.duration} min</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-card-foreground">KES {service.price}</span>
                    {selected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Add-ons */}
      {includesCarWash && (
        <section className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="font-display font-semibold text-card-foreground">Add-Ons</h2>
          <div className="flex flex-wrap gap-2">
            {addOns.map((addon) => {
              const selected = selectedAddOns.includes(addon.id);
              return (
                <button key={addon.id} onClick={() => toggleAddOn(addon.id)}
                  className={cn("px-3 py-2 rounded-lg border text-sm transition-all touch-target",
                    selected ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-card-foreground hover:border-primary/30")}>
                  {addon.name} +KES {addon.price}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Carpet Wash */}
      {includesCarpet && (
        <section className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="font-display font-semibold text-card-foreground flex items-center gap-2">
            <Scissors className="h-4 w-4 text-primary" /> Carpet Wash Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={carpetSize} onValueChange={(v) => setCarpetSize(v as CarpetWash["size"])}>
                <SelectTrigger className="touch-target"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small">Small</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Color</Label><Input value={carpetColor} onChange={(e) => setCarpetColor(e.target.value)} placeholder="e.g. Blue" className="touch-target" /></div>
            <div className="space-y-2"><Label>Amount (KES) *</Label><Input type="number" value={carpetAmount || ""} onChange={(e) => setCarpetAmount(Number(e.target.value))} placeholder="0" className="touch-target" /></div>
            <div className="space-y-2"><Label>Owner Name *</Label><Input value={carpetOwner} onChange={(e) => setCarpetOwner(e.target.value)} placeholder="Owner name" className="touch-target" /></div>
            <div className="space-y-2"><Label>Phone Number *</Label><Input value={carpetPhone} onChange={(e) => setCarpetPhone(e.target.value)} placeholder="0712345678" className="touch-target" /></div>
            <div className="space-y-2">
              <Label>Attendant *</Label>
              <Select value={carpetAttendant} onValueChange={setCarpetAttendant}>
                <SelectTrigger className="touch-target"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{activeAttendants.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </section>
      )}

      {/* Attendant */}
      {includesCarWash && (
        <section className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="font-display font-semibold text-card-foreground">Assign Attendant *</h2>
          <Select value={attendantId} onValueChange={setAttendantId}>
            <SelectTrigger className="touch-target"><SelectValue placeholder="Select attendant" /></SelectTrigger>
            <SelectContent>{activeAttendants.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
        </section>
      )}

      {/* Payment */}
      <section className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="font-display font-semibold text-card-foreground">Payment *</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {paymentMethods.map((pm) => {
            const selected = paymentMethod === pm.id;
            return (
              <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                className={cn("flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all touch-target",
                  selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30")}>
                <pm.icon className={cn("h-5 w-5", selected ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-xs font-medium", selected ? "text-primary" : "text-muted-foreground")}>{pm.label}</span>
              </button>
            );
          })}
        </div>
        {paymentMethod === "mpesa" && (
          <div className="space-y-2"><Label>M-Pesa Phone Number</Label><Input value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="e.g. 0712345678" className="touch-target" /></div>
        )}
      </section>

      {/* Notes */}
      <section className="glass-card rounded-xl p-5 space-y-3">
        <Label>Notes (optional)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..." rows={2} />
      </section>

      {/* Total & Submit */}
      <div className="glass-card-elevated rounded-xl p-5 flex items-center justify-between sticky bottom-4">
        <div>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-3xl font-display font-bold text-foreground">KES {total.toLocaleString()}</p>
        </div>
        <Button onClick={handleSubmit} disabled={submitting} size="lg" className="gradient-brand text-primary-foreground border-0 touch-target px-8 text-base font-semibold">
          {submitting ? "Processing..." : "Process Payment"}
        </Button>
      </div>
    </div>
  );
}
