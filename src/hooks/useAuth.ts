import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [motoboyId, setMotoboyId] = useState<string | null>(null);
  const [motoboyData, setMotoboyData] = useState<any>(null);

  const fetchUserData = useCallback(async (u: User) => {
    const { data: roles } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", u.id);

    const roleList = roles as any[];
    if (roleList && roleList.length > 0) {
      // Prefer admin role
      const adminRole = roleList.find((r: any) => r.role === "admin");
      setRole(adminRole ? "admin" : roleList[0].role);
    } else {
      setRole(null);
    }

    const { data: motoboy } = await supabase
      .from("motoboys")
      .select("*")
      .eq("user_id", u.id)
      .maybeSingle();

    if (motoboy) {
      setMotoboyId(motoboy.id);
      setMotoboyData(motoboy);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          await fetchUserData(u);
        } else {
          setRole(null);
          setMotoboyId(null);
          setMotoboyData(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession();

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    setRole(null);
    setMotoboyId(null);
    setMotoboyData(null);
    return supabase.auth.signOut();
  };

  return { user, loading, role, motoboyId, motoboyData, signIn, signOut, refetch: () => user && fetchUserData(user) };
};
