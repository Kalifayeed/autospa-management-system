import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockServices, mockAddOns, mockAttendants } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, ArrowLeft, Car, CreditCard, Smartphone, Building2, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const vehicleTypes = ["Sedan", "SUV", "Pickup", "Van", "Motorcycle", "Bus"];
const paymentMethods = [
  { id: "mpesa", label: "M-Pesa", icon: Smartphone },
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "bank", label: "Bank Transfer", icon: Building2 },
  { id: "corporate", label: "Corporate", icon: CreditCard },
];

export default function NewTransactionPage() {
  const navigate = useNavigate();
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [attendantId, setAttendantId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [notes, setNotes] = useState("");

  const total =
    mockServices.filter((s) => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.price, 0) +
    mockAddOns.filter((a) => selectedAddOns.includes(a.id)).reduce((sum, a) => sum + a.price, 0);

  const toggleService = (id: string) => {
    setSelectedServices((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const handleSubmit = () => {
    if (!plateNumber || !vehicleType || selectedServices.length === 0 || !attendantId || !paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Transaction completed successfully!");
    navigate("/transactions");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center touch-target">
          <ArrowLeft className="h-5 w-5 text-secondary-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">New Transaction</h1>
          <p className="text-muted-foreground text-sm">Process a new vehicle wash</p>
        </div>
      </div>

      {/* Vehicle Info */}
      <section className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="font-display font-semibold text-card-foreground flex items-center gap-2">
          <Car className="h-4 w-4 text-primary" /> Vehicle Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Plate Number *</Label>
            <Input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value.toUpperCase())} placeholder="e.g. KCA 123A" className="touch-target font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Vehicle Type *</Label>
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger className="touch-target"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="font-display font-semibold text-card-foreground">Select Services *</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {mockServices.map((service) => {
            const selected = selectedServices.includes(service.id);
            return (
              <button
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all touch-target text-left",
                  selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30"
                )}
              >
                <div>
                  <p className="text-sm font-medium text-card-foreground">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.duration} min</p>
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

      {/* Add-ons */}
      <section className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="font-display font-semibold text-card-foreground">Add-Ons</h2>
        <div className="flex flex-wrap gap-2">
          {mockAddOns.map((addon) => {
            const selected = selectedAddOns.includes(addon.id);
            return (
              <button
                key={addon.id}
                onClick={() => toggleAddOn(addon.id)}
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm transition-all touch-target",
                  selected ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-card-foreground hover:border-primary/30"
                )}
              >
                {addon.name} +KES {addon.price}
              </button>
            );
          })}
        </div>
      </section>

      {/* Attendant */}
      <section className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="font-display font-semibold text-card-foreground">Assign Attendant *</h2>
        <Select value={attendantId} onValueChange={setAttendantId}>
          <SelectTrigger className="touch-target"><SelectValue placeholder="Select attendant" /></SelectTrigger>
          <SelectContent>
            {mockAttendants.filter((a) => a.status === "active").map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name} — {a.shift} shift</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Payment */}
      <section className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="font-display font-semibold text-card-foreground">Payment *</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {paymentMethods.map((pm) => {
            const selected = paymentMethod === pm.id;
            return (
              <button
                key={pm.id}
                onClick={() => setPaymentMethod(pm.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all touch-target",
                  selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30"
                )}
              >
                <pm.icon className={cn("h-5 w-5", selected ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-xs font-medium", selected ? "text-primary" : "text-muted-foreground")}>{pm.label}</span>
              </button>
            );
          })}
        </div>
        {paymentMethod === "mpesa" && (
          <div className="space-y-2">
            <Label>M-Pesa Phone Number</Label>
            <Input value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="e.g. 0712345678" className="touch-target" />
          </div>
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
        <Button onClick={handleSubmit} size="lg" className="gradient-brand text-primary-foreground border-0 touch-target px-8 text-base font-semibold">
          Process Payment
        </Button>
      </div>
    </div>
  );
}
