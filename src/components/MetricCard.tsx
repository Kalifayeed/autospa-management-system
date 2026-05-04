import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number | null; label?: string };
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  index?: number;
}

const variantStyles = {
  default: "text-muted-foreground bg-muted/50",
  primary: "text-primary bg-primary/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  destructive: "text-destructive bg-destructive/10",
};

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, variant = "default", index = 0 }: MetricCardProps) {
  return (
    <div
      className="glass-card-premium rounded-xl p-5 transition-all duration-200 hover:scale-[1.02] opacity-0 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", variantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", trend.value >= 0 ? "text-success bg-success/10" : "text-destructive bg-destructive/10")}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold font-display text-card-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>}
    </div>
  );
}
