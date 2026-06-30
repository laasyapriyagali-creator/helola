import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface PendingDeletion {
  scheduledAt: string;
  daysLeft: number;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  pendingDeletion: PendingDeletion | null;
  signOut: () => Promise<void>;
  restoreAccount: () => Promise<{ error: string | null }>;
  dismissPendingDeletion: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  pendingDeletion: null,
  signOut: async () => {},
  restoreAccount: async () => ({ error: null }),
  dismissPendingDeletion: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);

  const checkPendingDeletion = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("pending_deletion_at")
      .eq("id", uid)
      .maybeSingle();
    if (data?.pending_deletion_at) {
      const scheduled = new Date(data.pending_deletion_at);
      const purgeAt = new Date(scheduled.getTime() + 30 * 24 * 60 * 60 * 1000);
      const daysLeft = Math.max(0, Math.ceil((purgeAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
      setPendingDeletion({ scheduledAt: data.pending_deletion_at, daysLeft });
    } else {
      setPendingDeletion(null);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
      if (event === "SIGNED_IN" && newSession?.user) {
        setTimeout(() => { checkPendingDeletion(newSession.user.id); }, 0);
      }
      if (event === "SIGNED_OUT") setPendingDeletion(null);
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      setLoading(false);
      if (existing?.user) checkPendingDeletion(existing.user.id);
    });

    return () => subscription.unsubscribe();
  }, [checkPendingDeletion]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setPendingDeletion(null);
  };

  const restoreAccount = async () => {
    const { error } = await supabase.rpc("cancel_account_deletion");
    if (error) return { error: error.message };
    setPendingDeletion(null);
    return { error: null };
  };

  const dismissPendingDeletion = () => setPendingDeletion(null);

  return (
    <AuthContext.Provider value={{ user, session, loading, pendingDeletion, signOut, restoreAccount, dismissPendingDeletion }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
