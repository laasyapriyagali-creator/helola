import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Lock, Plane } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Reset password · HELOLA Trips";

    const timer = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setReady(Boolean(data.session));
    }, 350);

    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password is too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please type the same password twice.", variant: "destructive" });
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      toast({ title: "Password reset failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Password updated", description: "You can now sign in with your new password." });
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-soft">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6 py-12">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-warm text-primary-foreground shadow-elegant">
            <Plane className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-3xl font-bold tracking-tight text-primary">helola</span>
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground">Reset password.</h1>
          <p className="mt-3 text-base text-muted-foreground">Choose a new password for your HELOLA account.</p>
        </div>

        <Card className="border-border/50 shadow-elegant">
          <CardContent className="p-6">
            {ready ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="confirmPassword" type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl text-base font-semibold shadow-soft">
                  {busy ? "Updating…" : "Update password"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>This reset link is missing or has expired.</p>
                <Button asChild className="h-12 w-full rounded-xl text-base font-semibold shadow-soft">
                  <Link to="/auth">Back to sign in</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}