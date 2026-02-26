import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Droplets, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (login(username, password)) {
      navigate("/dashboard", { replace: true });
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sidebar px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 rounded-2xl gradient-brand items-center justify-center mb-4 shadow-lg">
            <Droplets className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-sidebar-foreground">CrystalCruize</h1>
          <p className="text-sidebar-foreground/50 text-sm mt-1">Autospa Management System</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="glass-card-elevated rounded-2xl p-6 space-y-4 bg-card">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-card-foreground">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="touch-target"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-card-foreground">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="touch-target pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <Button type="submit" className="w-full touch-target gradient-brand text-primary-foreground font-semibold border-0">
            Sign In
          </Button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-4 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
          <p className="text-xs font-semibold text-sidebar-foreground/70 mb-2">Demo Credentials</p>
          <div className="space-y-1 text-xs text-sidebar-foreground/50">
            <p><span className="text-sidebar-foreground/70">Admin:</span> admin / admin123</p>
            <p><span className="text-sidebar-foreground/70">Attendant:</span> james / pass123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
