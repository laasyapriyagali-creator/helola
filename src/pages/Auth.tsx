import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, Plane } from "lucide-react";

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-1.9 13.2-5.1l-6.1-5.2c-2 1.5-4.5 2.4-7.1 2.4-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39 16.2 43.5 24 43.5z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.2l6.1 5.2C40.6 35.3 43.5 30.1 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
  </svg>
);

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup" | "phone">("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate("/", { replace: true }); }, [user, navigate]);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (res.error) toast({ title: "Google sign-in failed", description: res.error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const friendlyAuthError = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes("pwned") || m.includes("weak") || m.includes("known to be weak"))
      return "That password has appeared in known data breaches. Please choose a stronger, unique password (mix of letters, numbers, and symbols).";
    if (m.includes("invalid login")) return "Email or password is incorrect. Please try again.";
    if (m.includes("already registered") || m.includes("user already")) return "An account with this email already exists. Try signing in instead.";
    if (m.includes("email not confirmed")) return "Please confirm your email from the link we sent before signing in.";
    if (m.includes("rate limit")) return "Too many attempts. Please wait a minute and try again.";
    if (m.includes("password should be at least")) return msg;
    return msg;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setLoading(false);
    if (error) toast({ title: "Sign-in failed", description: friendlyAuthError(error.message), variant: "destructive" });
    else navigate("/", { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: fullName.trim() } },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign-up failed", description: friendlyAuthError(error.message), variant: "destructive" });
      return;
    }
    if (data.session) {
      toast({ title: "Welcome to Helola!", description: "Account created — you're signed in." });
      navigate("/", { replace: true });
    } else {
      toast({ title: "Check your inbox", description: "We sent a confirmation link to your email." });
      setTab("signin");
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
    setLoading(false);
    if (error) toast({ title: "Could not send OTP", description: error.message, variant: "destructive" });
    else { setOtpSent(true); toast({ title: "OTP sent", description: `Code sent to ${phone}` }); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone: phone.trim(), token: otp.trim(), type: "sms" });
    setLoading(false);
    if (error) toast({ title: "Invalid code", description: error.message, variant: "destructive" });
    else navigate("/", { replace: true });
  };

  const handleForgot = async () => {
    if (!email.trim()) { toast({ title: "Enter your email first" }); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast({ title: "Could not send reset", description: error.message, variant: "destructive" });
    else toast({ title: "Reset email sent", description: "Check your inbox." });
  };

  return (
    <div className="min-h-dvh bg-texture-paper flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elegant">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-warm text-primary-foreground shadow-soft">
            <Plane className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-3xl font-bold text-primary">helola</span>
        </Link>
        <h1 className="mb-1 text-center font-display text-2xl font-semibold">Welcome</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">Real trips. Real friends.</p>

        <Button onClick={handleGoogle} disabled={loading} variant="outline" className="mb-4 h-12 w-full gap-3 rounded-xl">
          <GoogleIcon /> Continue with Google
        </Button>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="signin"><Mail className="mr-1 h-3.5 w-3.5" />Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
            <TabsTrigger value="phone"><Phone className="mr-1 h-3.5 w-3.5" />Phone</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-4">
            <form onSubmit={handleSignIn} className="space-y-3">
              <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
              </Button>
              <button type="button" onClick={handleForgot} className="block w-full text-center text-xs text-muted-foreground hover:text-primary">
                Forgot password?
              </button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleSignUp} className="space-y-3">
              <div><Label>Full name</Label><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div>
                <Label>Password</Label>
                <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">At least 8 characters. Avoid common passwords like "password" or "12345678".</p>
              </div>
              <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="phone" className="mt-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <Label>Phone number</Label>
                  <Input type="tel" required placeholder="+91 98xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <p className="mt-1 text-xs text-muted-foreground">Include country code (e.g. +91, +1)</p>
                </div>
                <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div>
                  <Label>Enter 6-digit code</Label>
                  <Input required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & sign in"}
                </Button>
                <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="block w-full text-center text-xs text-muted-foreground hover:text-primary">
                  Use a different number
                </button>
              </form>
            )}
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our <Link to="/legal/terms" className="underline">Terms</Link> & <Link to="/legal/privacy" className="underline">Privacy</Link>.
        </p>
      </div>
    </div>
  );
}
