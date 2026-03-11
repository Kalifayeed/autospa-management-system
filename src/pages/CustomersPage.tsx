import { useAppState } from "@/lib/app-state";
import { Star, Phone, Car, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const FREE_WASH_THRESHOLD = 10;

export default function CustomersPage() {
  const { customers, redeemCustomerWash } = useAppState();
  const [redeeming, setRedeeming] = useState<string | null>(null);

  // Sort by visits descending (ranking)
  const sorted = [...customers].sort((a, b) => b.visits - a.visits);

  const handleRedeem = async (customerId: string) => {
    setRedeeming(customerId);
    try {
      await redeemCustomerWash(customerId);
      toast.success("Free wash redeemed! Visit count reset.");
    } catch {
      toast.error("Failed to redeem wash.");
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground text-sm">Ranked by visits — free wash after {FREE_WASH_THRESHOLD} visits</p>
      </div>

      {sorted.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <p className="text-muted-foreground">No customers yet. They'll appear here after transactions are processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map((customer, index) => {
            const eligible = customer.visits >= FREE_WASH_THRESHOLD;
            return (
              <div key={customer.id} className="glass-card rounded-xl p-4 animate-fade-in">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground font-mono flex items-center gap-1.5">
                        <Car className="h-4 w-4 text-primary" /> {customer.plateNumber}
                      </h3>
                      {customer.name && <p className="text-xs text-muted-foreground mt-0.5">{customer.name}</p>}
                      {customer.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" /> {customer.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-warning">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-bold">{customer.loyaltyPoints}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{customer.visits} visits</span>
                  <span>Last: {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : "N/A"}</span>
                </div>
                {eligible && (
                  <div className="mt-3 p-2 rounded-lg bg-primary/10 flex items-center justify-between">
                    <span className="text-primary text-xs font-medium flex items-center gap-1.5">
                      <Gift className="h-4 w-4" /> 🎉 Eligible for a free wash!
                    </span>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      disabled={redeeming === customer.id}
                      onClick={() => handleRedeem(customer.id)}
                    >
                      {redeeming === customer.id ? "Redeeming..." : "Redeem"}
                    </Button>
                  </div>
                )}
                {!eligible && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress to free wash</span>
                      <span>{customer.visits}/{FREE_WASH_THRESHOLD}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min((customer.visits / FREE_WASH_THRESHOLD) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
