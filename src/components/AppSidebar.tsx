import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Receipt,
  Car,
  Users,
  Settings,
  DollarSign,
  BarChart3,
  Wallet,
  UserCircle,
  LogOut,
  Droplets,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", roles: ["admin", "attendant"] },
  { label: "New Transaction", icon: Receipt, path: "/transactions/new", roles: ["admin", "attendant"] },
  { label: "Transactions", icon: Car, path: "/transactions", roles: ["admin", "attendant"] },
  { label: "Services", icon: Settings, path: "/services", roles: ["admin"] },
  { label: "Attendants", icon: Users, path: "/attendants", roles: ["admin"] },
  { label: "Expenses", icon: DollarSign, path: "/expenses", roles: ["admin"] },
  { label: "Payroll", icon: Wallet, path: "/payroll", roles: ["admin"] },
  { label: "Reports", icon: BarChart3, path: "/reports", roles: ["admin"] },
  { label: "Customers", icon: UserCircle, path: "/customers", roles: ["admin"] },
  { label: "User Management", icon: Users, path: "/users", roles: ["admin"] },
];

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(user?.role || "attendant")
  );

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-sidebar px-4 py-3 md:hidden border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Droplets className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-sidebar-foreground text-lg">CrystalCruize</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-sidebar-foreground touch-target">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-sidebar flex flex-col transition-transform duration-300 border-r border-sidebar-border",
          "md:translate-x-0",
          mobileOpen ? "translate-x-0 pt-16" : "-translate-x-full"
        )}
      >
        {/* Logo - desktop only */}
        <div className="hidden md:flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-lg gradient-brand flex items-center justify-center">
            <Droplets className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-sidebar-foreground text-base leading-tight">CrystalCruize</h1>
            <p className="text-[11px] text-sidebar-foreground/50">Autospa Management</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all touch-target",
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">{user?.name?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-destructive transition-colors touch-target"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
