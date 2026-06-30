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
import { Loader2, Mail, Phone, Plane, MailCheck } from "lucide-react";

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
  const [needsVerification, setNeedsVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => { if (user) navigate("/", { replace: true }); }, [user, navigate]);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (res.error) toast({ title: "Google sign-in failed", description: res.error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  // Generic, enumeration-safe message for any signup/reset response.
  const genericSentMessage = "If that email is valid, we've sent you a message. Please check your inbox (and spam folder).";

  const friendlyAuthError = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes("pwned") || m.includes("weak") || m.includes("known to be weak"))
      return "That password has appeared in known data breaches. Choose a stronger, unique password.";
    if (m.includes("invalid login") || m.includes("invalid credentials"))
      return "Email or password is incorrect.";
    if (m.includes("email not confirmed"))
      return "Please verify your email before continuing. Check your inbox for the verification link.";
    if (m.includes("rate limit") || m.includes("too many"))
      return "Too many attempts. Please wait a minute and try again.";
    if (m.includes("password should be at least")) return msg;
    return "Something went wrong. Please try again.";
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    setLoading(false);
    if (error) {
      const isUnverified = error.message.toLowerCase().includes("email not confirmed");
      if (isUnverified) {
        setPendingEmail(cleanEmail);
        setNeedsVerification(true);
        return;
      }
      toast({ title: "Sign-in failed", description: friendlyAuthError(error.message), variant: "destructive" });
    } else {
      navigate("/", { replace: true });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: fullName.trim() } },
    });
    setLoading(false);

    // Always show the same generic message — never reveal whether the email already exists.
    if (error) {
      const m = error.message.toLowerCase();
      // Surface only password strength issues; everything else stays generic.
      if (m.includes("pwned") || m.includes("weak") || m.includes("password should be at least")) {
        toast({ title: "Password not accepted", description: friendlyAuthError(error.message), variant: "destructive" });
        return;
      }
    }
    setPendingEmail(cleanEmail);
    setNeedsVerification(true);
    toast({ title: "Check your inbox", description: genericSentMessage });
  };

  const handleResendVerification = async () => {
    if (!pendingEmail) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingEmail,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    // Stay generic regardless of outcome (anti-enumeration & anti-abuse).
    toast({ title: "Verification email", description: genericSentMessage });
    if (error && error.message.toLowerCase().includes("rate")) {
      toast({ title: "Please wait", description: "You can request another email in a moment.", variant: "destructive" });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
    setLoading(false);
    if (error) toast({ title: "Could not send code", description: friendlyAuthError(error.message), variant: "destructive" });
    else { setOtpSent(true); toast({ title: "Code sent", description: `Code sent to ${phone}` }); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone: phone.trim(), token: otp.trim(), type: "sms" });
    setLoading(false);
    if (error) toast({ title: "Invalid code", description: "Please re-check the code and try again.", variant: "destructive" });
    else navigate("/", { replace: true });
  };

  const handleForgot = async () => {
    const target = (email || pendingEmail).trim().toLowerCase();
    if (!target) { toast({ title: "Enter your email first" }); return; }
    await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    // Always generic — do not confirm whether the account exists.
    toast({ title: "Password reset", description: genericSentMessage });
  };

  // Verification waiting screen
  if (needsVerification) {
    return (
      <div className="min-h-dvh bg-texture-paper flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elegant text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mb-2 font-display text-2xl font-semibold">Verify your email</h1>
          <p className="mb-1 text-sm text-muted-foreground">
            We've sent a verification link to
          </p>
          <p className="mb-4 break-all font-medium">{pendingEmail}</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Please verify your email before continuing. The link expires after 24 hours.
            Check your spam folder if you don't see it.
          </p>
          <Button onClick={handleResendVerification} disabled={loading} className="h-11 w-full rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend verification email"}
          </Button>
          <button
            type="button"
            onClick={() => { setNeedsVerification(false); setTab("signin"); }}
            className="mt-4 text-sm text-muted-foreground hover:text-primary"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

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
                <p className="mt-1 text-xs text-muted-foreground">At least 8 characters. Avoid common passwords.</p>
              </div>
              <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                You'll receive a verification email. You must verify before signing in.
              </p>
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
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
