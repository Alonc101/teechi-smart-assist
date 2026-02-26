import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(async () => {
            try {
              const { data } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", currentUser.id);
              setIsAdmin(data?.some((r) => r.role === "admin") ?? false);
            } catch {
              setIsAdmin(false);
            }
            setLoading(false);
          }, 0);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, isAdmin };
};
