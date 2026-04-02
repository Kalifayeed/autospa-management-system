import { Car, Receipt, DollarSign, Users, UserCircle, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateType = "transactions" | "expenses" | "attendants" | "customers" | "payroll" | "general";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  className?: string;
}

const icons: Record<EmptyStateType, typeof Car> = {
  transactions: Car,
  expenses: DollarSign,
  attendants: Users,
  customers: UserCircle,
  payroll: Wallet,
  general: Receipt,
};

const defaults: Record<EmptyStateType, { title: string; description: string }> = {
  transactions: { title: "No transactions yet", description: "Create your first transaction to see it here" },
  expenses: { title: "No expenses logged", description: "Add an expense to start tracking your costs" },
  attendants: { title: "No attendants yet", description: "Add attendants to manage your team" },
  customers: { title: "No customers yet", description: "They'll appear here after transactions are processed" },
  payroll: { title: "No payroll data", description: "Process transactions to generate payroll records" },
  general: { title: "Nothing here yet", description: "Data will appear once you start using the system" },
};

export default function EmptyState({ type = "general", title, description, className }: EmptyStateProps) {
  const Icon = icons[type];
  const d = defaults[type];

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 animate-fade-in", className)}>
      <div className="relative mb-5">
        {/* Decorative rings */}
        <div className="absolute inset-0 -m-4 rounded-full border-2 border-dashed border-primary/10 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-0 -m-8 rounded-full border border-dashed border-primary/5 animate-[spin_30s_linear_infinite_reverse]" />
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-8 w-8 text-primary/60" />
        </div>
      </div>
      <h3 className="font-display font-semibold text-card-foreground text-base mb-1">{title || d.title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-xs">{description || d.description}</p>
    </div>
  );
}
