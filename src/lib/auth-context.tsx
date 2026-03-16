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
    let profileFetched = false;

    // Safety timeout - never stay loading forever
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("Auth loading timeout - forcing complete");
        setLoading(false);
      }
    }, 3000);

    const fetchOnce = async (supabaseUser: SupabaseUser) => {
      if (profileFetched || !isMounted) return;
      profileFetched = true;
      const profile = await fetchUserProfile(supabaseUser);
      if (isMounted) {
        setUser(profile);
        setLoading(false);
      }
    };

    // Initial session check first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        fetchOnce(session.user);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    // Listen for future changes (sign in/out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        // Reset flag for new auth events (login/token refresh with user change)
        if (_event === 'SIGNED_IN') {
          profileFetched = false;
        }
        setTimeout(() => fetchOnce(session.user), 0);
      } else {
        profileFetched = false;
        setUser(null);
        setLoading(false);
      }
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
