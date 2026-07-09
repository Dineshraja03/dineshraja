import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, ready };
}

export function useIsAdmin() {
  const { session } = useSession();
  return useQuery({
    queryKey: ["is-admin", session?.user.id ?? null],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", session!.user.id).eq("role", "admin").maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}