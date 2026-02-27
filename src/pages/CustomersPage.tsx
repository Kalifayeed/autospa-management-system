import { mockCustomers } from "@/lib/mock-data";
import { Star, Phone, Car } from "lucide-react";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground text-sm">Track vehicles and loyalty rewards</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mockCustomers.map((customer) => (
          <div key={customer.id} className="glass-card rounded-xl p-4 animate-fade-in">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-card-foreground font-mono flex items-center gap-1.5">
                  <Car className="h-4 w-4 text-primary" /> {customer.plateNumber}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{customer.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" /> {customer.phone}
                </p>
              </div>
              <div className="flex items-center gap-1 text-warning">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-bold">{customer.loyaltyPoints}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{customer.visits} visits</span>
              <span>Last: {new Date(customer.lastVisit).toLocaleDateString()}</span>
            </div>
            {customer.visits >= 15 && (
              <div className="mt-2 px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium text-center">
                🎉 Eligible for a free wash!
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
