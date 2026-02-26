import React, { createContext, useContext, useState, useCallback } from "react";

export type UserRole = "admin" | "attendant";

interface User {
  id: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users for demo
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  admin: { password: "admin123", user: { id: "u1", name: "Admin", role: "admin" } },
  james: { password: "pass123", user: { id: "u2", name: "James Mwangi", role: "attendant" } },
  grace: { password: "pass123", user: { id: "u3", name: "Grace Wanjiku", role: "attendant" } },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("cc_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((username: string, password: string) => {
    const entry = MOCK_USERS[username.toLowerCase()];
    if (entry && entry.password === password) {
      setUser(entry.user);
      localStorage.setItem("cc_user", JSON.stringify(entry.user));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("cc_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
