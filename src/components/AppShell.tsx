import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNav } from "@/components/DesktopNav";
import { PendingDeletionGate } from "@/components/PendingDeletionGate";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Redirects signed-in users with an incomplete profile to /onboarding.
 * Public/unauth visitors and viewers of `/u/:id` are not redirected.
 */
function OnboardingGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading || !user) { setChecked(true); return; }
    if (pathname.startsWith("/u/") || pathname.startsWith("/onboarding")) { setChecked(true); return; }
    let cancel = false;
    supabase
      .from("profiles")
      .select("identity_locked")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancel) return;
        if (data && data.identity_locked === false) {
          navigate("/onboarding", { replace: true });
        }
        setChecked(true);
      });
    return () => { cancel = true; };
  }, [user, loading, pathname, navigate]);

  if (!checked) return null;
  return <>{children}</>;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background">
      <DesktopNav />
      <main className="mx-auto w-full max-w-7xl overflow-x-hidden pb-24 md:pb-12">
        <OnboardingGate>{children}</OnboardingGate>
      </main>
      <BottomNav />
    </div>
  );
}
