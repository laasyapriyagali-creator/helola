import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plane, Mail, Lock, User as UserIcon, Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const cleanEmail = email.trim().toLowerCase();

  const finishPasswordReset = async () => {
    if (!cleanEmail) {
      toast({ title: "Enter your email first", description: "Add your email above and we'll send a secure reset link." });
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);

    if (error) {
      toast({ title: "Reset link failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Reset link sent", description: "Check your email, then set a new password and sign in again." });
  };

  const continueWithGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: { prompt: "select_account" },
      });

      if (result.error) {
        toast({ title: "Google sign-in failed", description: result.error.message, variant: "destructive" });
        setBusy(false);
        return;
      }

      if (result.redirected) return;
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please try Google sign-in again.";
      toast({ title: "Google sign-in failed", description: message, variant: "destructive" });
      setBusy(false);
    }
  };

  useEffect(() => {
    document.title = mode === "signin" ? "Sign in · HELOLA Trips" : "Join HELOLA · Create account";
  }, [mode]);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const ageNum = Number(age);
        if (!name.trim()) throw new Error("Please enter your full name");
        if (!ageNum || ageNum < 13 || ageNum > 120) throw new Error("Please enter a valid age (13+)");
        if (!gender) throw new Error("Please select your gender");

        const baseUsername = name.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

        const { data: signUpData, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { full_name: name.trim(), username: baseUsername },
          },
        });
        if (error) throw error;

        // Lock identity & set age/gender on the freshly-created profile
        const newUserId = signUpData.user?.id;
        if (newUserId) {
          // Try a few times in case the profile trigger hasn't run yet
          for (let i = 0; i < 5; i++) {
            const { error: pErr } = await supabase
              .from("profiles")
              .update({
                full_name: name.trim(),
                age: ageNum,
                gender,
                identity_locked: true,
              })
              .eq("id", newUserId);
            if (!pErr) break;
            await new Promise((r) => setTimeout(r, 250));
          }
        }
        if (signUpData.session) {
          toast({ title: "Welcome to HELOLA!", description: "Account created. You're in." });
          navigate("/", { replace: true });
        } else {
          toast({ title: "Check your email", description: "Confirm your email to finish creating your HELOLA account." });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) {
          const invalidCredentials = /invalid login credentials/i.test(error.message);
          throw new Error(
            invalidCredentials
              ? "That email and password don't match. If this account was made with Google, use Continue with Google, or reset your password."
              : error.message,
          );
        }
        navigate("/", { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Auth error", description: message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-soft">
      {/* Decorative bg */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 py-12">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-warm text-primary-foreground shadow-elegant">
            <Plane className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-3xl font-bold tracking-tight text-primary">helola</span>
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground">
            {mode === "signin" ? "Welcome back." : "Real trips,\nreal friends."}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {mode === "signin"
              ? "Pick up where you left off."
              : "Join small group trips and meet people who travel the way you do."}
          </p>
        </div>

        <Card className="border-border/50 shadow-elegant">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name <span className="text-xs text-muted-foreground">(can't be changed later)</span></Label>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Lily Portlyn" className="pl-10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age <span className="text-xs text-muted-foreground">(locked)</span></Label>
                      <div className="relative">
                        <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="age" type="number" min={13} max={120} required value={age} onChange={(e) => setAge(e.target.value)} placeholder="18" className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Gender <span className="text-xs text-muted-foreground">(locked)</span></Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="non-binary">Non-binary</SelectItem>
                          <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button type="button" onClick={finishPasswordReset} disabled={busy} className="text-xs font-semibold text-primary hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="pl-10" />
                </div>
              </div>

              <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl text-base font-semibold shadow-soft">
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={continueWithGoogle}
              className="h-12 w-full rounded-xl text-base font-semibold"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continue with Google
            </Button>

            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {mode === "signin" ? (
                <>New to HELOLA? <span className="font-semibold text-primary">Create an account</span></>
              ) : (
                <>Already have an account? <span className="font-semibold text-primary">Sign in</span></>
              )}
            </button>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our <Link to="/legal/terms" className="underline">Terms</Link> and <Link to="/legal/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
