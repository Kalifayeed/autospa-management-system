import { useState } from "react";
import { useAppState } from "@/lib/app-state";
import { useAuth } from "@/lib/auth-context";
import { Clock, Tag, Scissors, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Service, ServiceAddOn } from "@/lib/mock-data";

export default function ServicesPage() {
  const { services, addOns, addService, updateService, deleteService, addAddOn, updateAddOn, deleteAddOn } = useAppState();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const categories = [...new Set(services.map(s => s.category))];

  // Service dialog
  const [svcOpen, setSvcOpen] = useState(false);
  const [editingSvc, setEditingSvc] = useState<Service | null>(null);
  const [svcName, setSvcName] = useState("");
  const [svcCategory, setSvcCategory] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcDuration, setSvcDuration] = useState("");
  const [svcDesc, setSvcDesc] = useState("");

  // Add-on dialog
  const [addonOpen, setAddonOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<ServiceAddOn | null>(null);
  const [addonName, setAddonName] = useState("");
  const [addonPrice, setAddonPrice] = useState("");

  const openAddService = () => {
    setEditingSvc(null);
    setSvcName(""); setSvcCategory(""); setSvcPrice(""); setSvcDuration(""); setSvcDesc("");
    setSvcOpen(true);
  };

  const openEditService = (svc: Service) => {
    setEditingSvc(svc);
    setSvcName(svc.name); setSvcCategory(svc.category); setSvcPrice(String(svc.price)); setSvcDuration(String(svc.duration)); setSvcDesc(svc.description);
    setSvcOpen(true);
  };

  const handleSaveService = async () => {
    if (!svcName || !svcCategory || !svcPrice) { toast.error("Name, category and price are required"); return; }
    if (editingSvc) {
      await updateService(editingSvc.id, { name: svcName, category: svcCategory, price: Number(svcPrice), duration: Number(svcDuration) || 0, description: svcDesc });
      toast.success("Service updated");
    } else {
      await addService({ name: svcName, category: svcCategory, price: Number(svcPrice), duration: Number(svcDuration) || 0, description: svcDesc });
      toast.success("Service added");
    }
    setSvcOpen(false);
  };

  const handleDeleteService = async (id: string) => {
    await deleteService(id);
    toast.success("Service deleted");
  };

  const openAddAddon = () => {
    setEditingAddon(null);
    setAddonName(""); setAddonPrice("");
    setAddonOpen(true);
  };

  const openEditAddon = (addon: ServiceAddOn) => {
    setEditingAddon(addon);
    setAddonName(addon.name); setAddonPrice(String(addon.price));
    setAddonOpen(true);
  };

  const handleSaveAddon = async () => {
    if (!addonName || !addonPrice) { toast.error("Name and price are required"); return; }
    if (editingAddon) {
      await updateAddOn(editingAddon.id, { name: addonName, price: Number(addonPrice) });
      toast.success("Add-on updated");
    } else {
      await addAddOn({ name: addonName, price: Number(addonPrice) });
      toast.success("Add-on added");
    }
    setAddonOpen(false);
  };

  const handleDeleteAddon = async (id: string) => {
    await deleteAddOn(id);
    toast.success("Add-on deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Services & Pricing</h1>
          <p className="text-muted-foreground text-sm">Manage your service catalog</p>
        </div>
        {isAdmin && (
          <Button onClick={openAddService} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add Service
          </Button>
        )}
      </div>

      {categories.map(cat => (
        <div key={cat}>
          <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> {cat}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.filter(s => s.category === cat).map(service => (
              <div key={service.id} className="glass-card rounded-xl p-4 animate-fade-in">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-card-foreground">{service.name}</h3>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold font-display text-primary">KES {service.price}</span>
                    {isAdmin && (
                      <>
                        <button onClick={() => openEditService(service)} className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-secondary">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => handleDeleteService(service.id)} className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </>
                    )}
                  </div>
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

      {/* Add-Ons */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-foreground">Add-Ons</h2>
          {isAdmin && (
            <Button onClick={openAddAddon} size="sm" variant="outline" className="gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {addOns.map(addon => (
            <div key={addon.id} className="glass-card rounded-lg px-4 py-2.5 text-sm flex items-center gap-2">
              <span className="text-card-foreground font-medium">{addon.name}</span>
              <span className="text-primary font-semibold">+KES {addon.price}</span>
              {isAdmin && (
                <>
                  <button onClick={() => openEditAddon(addon)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-secondary">
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDeleteAddon(addon.id)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10">
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Carpet Wash */}
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

      {/* Service Dialog */}
      <Dialog open={svcOpen} onOpenChange={setSvcOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSvc ? "Edit Service" : "Add Service"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={svcName} onChange={e => setSvcName(e.target.value)} placeholder="e.g. Full Wash Sedan" /></div>
            <div className="space-y-2"><Label>Category *</Label><Input value={svcCategory} onChange={e => setSvcCategory(e.target.value)} placeholder="e.g. Sedan, SUV, Bike" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Price (KES) *</Label><Input type="number" value={svcPrice} onChange={e => setSvcPrice(e.target.value)} placeholder="0" /></div>
              <div className="space-y-2"><Label>Duration (min)</Label><Input type="number" value={svcDuration} onChange={e => setSvcDuration(e.target.value)} placeholder="0" /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Input value={svcDesc} onChange={e => setSvcDesc(e.target.value)} placeholder="Short description" /></div>
            <Button onClick={handleSaveService} className="w-full">{editingSvc ? "Save Changes" : "Add Service"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add-on Dialog */}
      <Dialog open={addonOpen} onOpenChange={setAddonOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAddon ? "Edit Add-On" : "Add Add-On"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={addonName} onChange={e => setAddonName(e.target.value)} placeholder="e.g. Engine Wash" /></div>
            <div className="space-y-2"><Label>Price (KES) *</Label><Input type="number" value={addonPrice} onChange={e => setAddonPrice(e.target.value)} placeholder="0" /></div>
            <Button onClick={handleSaveAddon} className="w-full">{editingAddon ? "Save Changes" : "Add Add-On"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
