import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export type UserRole = "admin" | "attendant";

interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchUserProfile(supabaseUser: SupabaseUser): Promise<User | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("user_id", supabaseUser.id)
    .single();

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", supabaseUser.id)
    .single();

  return {
    id: supabaseUser.id,
    name: profile?.display_name || profile?.username || supabaseUser.email?.split("@")[0] || "User",
    role: (roleData?.role as UserRole) || "attendant",
    email: supabaseUser.email,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout - never stay loading forever
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("Auth loading timeout - forcing complete");
        setLoading(false);
      }
    }, 5000);

    // Don't await inside onAuthStateChange to avoid deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Use setTimeout to avoid blocking the callback
        setTimeout(async () => {
          if (!isMounted) return;
          const profile = await fetchUserProfile(session.user);
          if (isMounted) {
            setUser(profile);
            setLoading(false);
          }
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        const profile = await fetchUserProfile(session.user);
        if (isMounted) setUser(profile);
      }
      if (isMounted) setLoading(false);
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
