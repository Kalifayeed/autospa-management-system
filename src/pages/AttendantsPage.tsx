import { mockAttendants } from "@/lib/mock-data";
import { Phone, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AttendantsPage() {
  const sorted = [...mockAttendants].sort((a, b) => b.totalSales - a.totalSales);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Attendants</h1>
        <p className="text-muted-foreground text-sm">Manage staff and track performance</p>
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
                  <span className="capitalize">{att.shift} shift</span>
                  <span className={cn("px-1.5 py-0.5 rounded", att.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                    {att.status}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold font-display text-card-foreground">KES {att.totalSales.toLocaleString()}</p>
                <p className="text-xs text-success">Commission: KES {att.commission.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
