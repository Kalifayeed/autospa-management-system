import { useAppState } from "@/lib/app-state";
import { Clock, Tag, Scissors } from "lucide-react";

export default function ServicesPage() {
  const { services, addOns } = useAppState();
  const categories = [...new Set(services.map((s) => s.category))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Services & Pricing</h1>
        <p className="text-muted-foreground text-sm">Manage your service catalog</p>
      </div>

      {categories.map((cat) => (
        <div key={cat}>
          <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> {cat}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.filter((s) => s.category === cat).map((service) => (
              <div key={service.id} className="glass-card rounded-xl p-4 animate-fade-in">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-card-foreground">{service.name}</h3>
                  <span className="text-lg font-bold font-display text-primary">KES {service.price}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {service.duration} min
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div>
        <h2 className="font-display font-semibold text-foreground mb-3">Add-Ons</h2>
        <div className="flex flex-wrap gap-2">
          {addOns.map((addon) => (
            <div key={addon.id} className="glass-card rounded-lg px-4 py-2.5 text-sm">
              <span className="text-card-foreground font-medium">{addon.name}</span>
              <span className="text-primary font-semibold ml-2">+KES {addon.price}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <Scissors className="h-4 w-4 text-primary" /> Carpet Wash
        </h2>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-2">Custom pricing service — price entered per job.</p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded bg-secondary">Sizes: Small / Medium / Large</span>
            <span className="px-2 py-1 rounded bg-secondary">Captures: Color, Owner, Phone</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">* Vehicle plate numbers require a minimum of 7 characters.</p>
    </div>
  );
}
