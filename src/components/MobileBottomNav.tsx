import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, Receipt, Car, BarChart3, Menu, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const adminItems = [
  { label: "Home", icon: LayoutDashboard, path: "/dashboard" },
  { label: "New", icon: Receipt, path: "/transactions/new" },
  { label: "Trips", icon: Car, path: "/transactions" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
];
const attendantItems = [
  { label: "Home", icon: LayoutDashboard, path: "/dashboard" },
  { label: "New", icon: Receipt, path: "/transactions/new" },
  { label: "Trips", icon: Car, path: "/transactions" },
  { label: "Customers", icon: UserCircle, path: "/customers" },
];

export default function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const items = user?.role === "admin" ? adminItems : attendantItems;

  const openMenu = () => window.dispatchEvent(new CustomEvent("open-sidebar"));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-sidebar/95 backdrop-blur-lg border-t border-sidebar-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 transition-colors touch-target",
                active ? "text-primary" : "text-sidebar-foreground/60"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={openMenu}
          className="flex flex-col items-center justify-center gap-0.5 py-2 text-sidebar-foreground/60 touch-target"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}
