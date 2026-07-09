import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, Lock, ChevronRight, ChevronLeft } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";
import type { CityResult } from "@/lib/location";
import { computeAge, maxDob, minDob } from "@/lib/age";
import { reportError } from "@/lib/reportError";

type Gender = "female" | "male" | "non_binary" | "prefer_not_to_say";
const GENDERS: { value: Gender; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const STEPS = ["Full name", "Date of birth", "Gender", "Location", "Review"] as const;

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(true);

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [location, setLocation] = useState<CityResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [acknowledgeName, setAcknowledgeName] = useState(false);
  const [acknowledgeGender, setAcknowledgeGender] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    supabase
      .from("profiles")
      .select("full_name, identity_locked")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancel) return;
        if (data?.identity_locked) {
          navigate("/", { replace: true });
        } else {
          setFullName(data?.full_name || "");
          setChecking(false);
        }
      });
    return () => { cancel = true; };
  }, [user, navigate]);

  if (authLoading || checking) {
    return <div className="grid min-h-dvh place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const age = computeAge(dob);
  const nameValid = fullName.trim().length >= 2 && /^[\p{L}\s'.-]+$/u.test(fullName.trim());
  const dobValid = !!dob && age !== null && age >= 13 && age <= 100;
  const canProceed = [
    nameValid && acknowledgeName,
    dobValid,
    !!gender && acknowledgeGender,
    !!location,
    true,
  ][step];

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!user || !location || !gender || !dob || !nameValid) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        date_of_birth: dob,
        gender,
        location_city: location.city,
        location_country: location.country,
        location: null, // clear legacy free-text field
        identity_locked: true,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      reportError("src/pages/Onboarding.tsx", error);
      toast({ title: "Couldn't finish onboarding", description: "Please try again in a moment.", variant: "destructive" });
      return;
    }
    toast({ title: "Welcome aboard ✨", description: "Your profile is set up." });
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-xl px-5 py-8 sm:py-12">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-primary sm:text-3xl">{STEPS[step]}</h1>
          <div className="mt-4 flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </header>

        <div className="space-y-6">
          {step === 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                Enter your <strong className="text-foreground">real, full legal name</strong> as you'd like it on your profile.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="ob-name">Full name</Label>
                <Input
                  id="ob-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Lucy Blue"
                  autoFocus
                  maxLength={80}
                />
              </div>
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 text-destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Your full name cannot be changed later.</AlertTitle>
                <AlertDescription>Please make sure it's spelled correctly. To change it after onboarding you'll need to contact support.</AlertDescription>
              </Alert>
              <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={acknowledgeName} onChange={(e) => setAcknowledgeName(e.target.checked)} />
                <span>I confirm this is my real name and I understand it can't be changed later.</span>
              </label>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-muted-foreground">We use your date of birth to calculate your age automatically — it updates itself every year.</p>
              <div className="space-y-1.5">
                <Label htmlFor="ob-dob">Date of birth</Label>
                <Input id="ob-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} min={minDob} max={maxDob} />
                {dob && age !== null && (
                  <p className="text-xs text-muted-foreground">You are <strong className="text-foreground">{age} years old</strong>.</p>
                )}
                {dob && !dobValid && (
                  <p className="text-xs text-destructive">You must be at least 13 years old to use HELOLA.</p>
                )}
              </div>
              <Alert className="border-primary/20 bg-primary/5">
                <Lock className="h-4 w-4 text-primary" />
                <AlertTitle>Date of birth is locked once saved.</AlertTitle>
                <AlertDescription>Your age will update automatically every year — no need to edit it.</AlertDescription>
              </Alert>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Gender</Label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDERS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setGender(value)}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        gender === value
                          ? "border-primary bg-primary text-primary-foreground shadow-soft"
                          : "border-border bg-background hover:border-primary/50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 text-destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>This selection cannot be changed later.</AlertTitle>
                <AlertDescription>It helps us maintain profile authenticity for everyone in the community.</AlertDescription>
              </Alert>
              <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={acknowledgeGender} onChange={(e) => setAcknowledgeGender(e.target.checked)} />
                <span>I understand my gender selection can't be changed later.</span>
              </label>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm text-muted-foreground">
                Set your home city. We only store the <strong className="text-foreground">city and country</strong> — never your exact address.
                You can update it later when you travel.
              </p>
              <LocationPicker value={location} onChange={setLocation} />
            </>
          )}

          {step === 4 && (
            <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display text-lg font-semibold">Looking good?</h2>
              <ReviewRow label="Full name" value={fullName} />
              <ReviewRow label="Date of birth" value={`${dob}  ·  ${age} years`} />
              <ReviewRow label="Gender" value={GENDERS.find((g) => g.value === gender)?.label || "—"} />
              <ReviewRow label="Location" value={location ? `${location.city}, ${location.country}` : "—"} />
              <p className="pt-2 text-xs text-muted-foreground">
                Once you confirm, full name, date of birth and gender will be permanently locked.
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={back} disabled={step === 0} className="rounded-full">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next} disabled={!canProceed} className="rounded-full px-6">
              Continue <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={saving || !nameValid || !dobValid || !gender || !location} className="rounded-full px-6">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm & finish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
