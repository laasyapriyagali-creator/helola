import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserAvatar } from "@/components/UserAvatar";
import { toast } from "@/hooks/use-toast";
import { Loader2, Lock as LockIcon, Trash2, ShieldCheck, Mail, Phone } from "lucide-react";

/* ----------------------------- EDIT PROFILE ----------------------------- */

interface ProfileForm {
  full_name: string | null;
  username: string | null;
  age: number | null;
  gender: string | null;
  location: string | null;
  bio: string | null;
  hobbies: string[] | null;
  identity_locked: boolean;
  username_change_count: number;
}

export function EditProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<ProfileForm>>({});
  const [hobbiesText, setHobbiesText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [identityLocked, setIdentityLocked] = useState(false);
  const [usernameChangeCount, setUsernameChangeCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setForm(data as Partial<ProfileForm>);
        setHobbiesText(((data as ProfileForm).hobbies || []).join(", "));
        setIdentityLocked(!!data.identity_locked);
        setUsernameChangeCount(data.username_change_count || 0);
      }
      setLoading(false);
    });
  }, [user]);

  const usernameLeft = Math.max(0, 2 - usernameChangeCount);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const hobbies = hobbiesText.split(",").map(s => s.trim()).filter(Boolean);
      const newUsername = (form.username || "").trim().toLowerCase().replace(/\s+/g, "_");

      if (newUsername && newUsername !== (form.username || "").toLowerCase()) {
        // normalised
      }

      const updates: {
        bio?: string | null; location?: string | null; hobbies?: string[];
        username?: string; full_name?: string | null; age?: number | null; gender?: string | null;
      } = {
        bio: form.bio ?? null,
        location: form.location ?? null,
        hobbies,
      };

      // Username uniqueness
      if (newUsername) {
        if (!/^[a-z0-9_]{3,20}$/.test(newUsername)) {
          toast({ title: "Invalid username", description: "Use 3–20 lowercase letters, numbers, or underscores.", variant: "destructive" });
          setSaving(false); return;
        }
        const { data: existing } = await supabase
          .from("profiles").select("id").ilike("username", newUsername).neq("id", user.id).maybeSingle();
        if (existing) {
          toast({ title: "This username already exists", description: "Try another one.", variant: "destructive" });
          setSaving(false); return;
        }
        updates.username = newUsername;
      }

      if (!identityLocked) {
        updates.full_name = form.full_name ?? null;
        updates.age = form.age ?? null;
        updates.gender = form.gender ?? null;
      }

      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) {
        toast({ title: "Save failed", description: error.message, variant: "destructive" });
        setSaving(false); return;
      }
      toast({ title: "Profile updated ✨" });
      navigate("/profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SettingsPage title="Edit profile"><p className="text-sm text-muted-foreground">Loading…</p></SettingsPage>;

  return (
    <SettingsPage title="Edit profile">
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1">Full name {identityLocked && <LockIcon className="h-3 w-3 text-muted-foreground" />}</Label>
          <Input value={form.full_name || ""} disabled={identityLocked} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          {identityLocked && <p className="text-xs text-muted-foreground">Name is locked and can't be changed.</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Username {usernameLeft > 0 ? <span className="text-xs text-muted-foreground">({usernameLeft} change{usernameLeft === 1 ? "" : "s"} left)</span> : <span className="text-xs text-destructive">(locked)</span>}</Label>
          <Input value={form.username || ""} disabled={usernameLeft === 0} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username_only" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">Age {identityLocked && <LockIcon className="h-3 w-3 text-muted-foreground" />}</Label>
            <Input type="number" disabled={identityLocked} value={form.age || ""} onChange={(e) => setForm({ ...form, age: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">Gender {identityLocked && <LockIcon className="h-3 w-3 text-muted-foreground" />}</Label>
            <Input value={form.gender || ""} disabled={identityLocked} onChange={(e) => setForm({ ...form, gender: e.target.value })} placeholder="Female / Male / Non-binary..." />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Mumbai, India" />
        </div>
        <div className="space-y-1.5">
          <Label>Bio</Label>
          <Textarea rows={4} value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="I like travelling and making friends!" />
        </div>
        <div className="space-y-1.5">
          <Label>Hobbies (comma separated)</Label>
          <Input value={hobbiesText} onChange={(e) => setHobbiesText(e.target.value)} placeholder="Swimming, drawing, reading..." />
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={save} disabled={saving} className="rounded-full">
            {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Save changes
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)} className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            Cancel
          </Button>
        </div>
      </div>
    </SettingsPage>
  );
}

/* ------------------------ ACCOUNT INFORMATION ------------------------ */

export function AccountInfoPage() {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("username, full_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setUsername(data.username || "");
        setDisplayName(data.full_name || "");
      }
    });
    setPhone(user.phone || "");
  }, [user]);

  const sendEmailVerification = async () => {
    if (!user?.email) return;
    setVerifyingEmail(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: user.email });
    setVerifyingEmail(false);
    if (error) return toast({ title: "Couldn't send email", description: error.message, variant: "destructive" });
    toast({ title: "Verification link sent", description: `Check ${user.email} for a confirmation link.` });
  };

  const sendPhoneOtp = async () => {
    if (!phone) return toast({ title: "Enter a phone number first", variant: "destructive" });
    setVerifyingPhone(true);
    const { error } = await supabase.auth.updateUser({ phone });
    setVerifyingPhone(false);
    if (error) return toast({ title: "Couldn't send OTP", description: error.message, variant: "destructive" });
    toast({ title: "OTP sent", description: "We sent a one-time code to your phone." });
  };

  const emailConfirmed = !!user?.email_confirmed_at;
  const phoneConfirmed = !!user?.phone_confirmed_at;

  return (
    <SettingsPage title="Account information">
      <div className="space-y-6">
        <Field label="Username" hint="Your unique handle on HELOLA. Edit in Edit profile.">
          <p className="text-sm font-medium">@{username || "—"}</p>
        </Field>

        <Field label="Display name" hint="The name shown on your profile.">
          <p className="text-sm font-medium">{displayName || "—"}</p>
        </Field>

        <Field label="Email">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user?.email || "—"}</span>
              {emailConfirmed
                ? <span className="inline-flex items-center gap-1 text-xs text-success"><ShieldCheck className="h-3 w-3" />Verified</span>
                : <span className="text-xs text-destructive">Not verified</span>}
            </div>
            {!emailConfirmed && user?.email && (
              <Button size="sm" disabled={verifyingEmail} onClick={sendEmailVerification} className="rounded-full">
                {verifyingEmail && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Send verification link
              </Button>
            )}
          </div>
        </Field>

        <Field label="Phone number">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 90000 00000" className="max-w-xs" />
              {phoneConfirmed && <span className="inline-flex items-center gap-1 text-xs text-success"><ShieldCheck className="h-3 w-3" />Verified</span>}
            </div>
            {!phoneConfirmed && (
              <Button size="sm" disabled={verifyingPhone} onClick={sendPhoneOtp} className="rounded-full">
                {verifyingPhone && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Send OTP
              </Button>
            )}
            <p className="text-xs text-muted-foreground">We'll send a one-time code to verify ownership.</p>
          </div>
        </Field>
      </div>
    </SettingsPage>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-b border-border pb-5 last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ------------------------ PRIVACY & SAFETY ------------------------ */

type Visibility = "public" | "friends" | "private";
type MessagePerm = "everyone" | "friends" | "nobody";

export function VisibilityPage() {
  const { user } = useAuth();
  const [value, setValue] = useState<Visibility>("public");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("profile_visibility").eq("id", user.id).maybeSingle()
      .then(({ data }) => data?.profile_visibility && setValue(data.profile_visibility as Visibility));
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ profile_visibility: value }).eq("id", user.id);
    setBusy(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    toast({ title: "Visibility updated" });
  };

  return (
    <SettingsPage title="Profile visibility">
      <p className="mb-4 text-sm text-muted-foreground">Choose who can see your profile and trips.</p>
      <RadioGroup value={value} onValueChange={(v) => setValue(v as Visibility)} className="space-y-2">
        {[
          { v: "public", l: "Public", d: "Anyone on HELOLA can find you." },
          { v: "friends", l: "Trip mates only", d: "Only people from shared trips." },
          { v: "private", l: "Private", d: "Only you can see your profile." },
        ].map((opt) => (
          <Label key={opt.v} htmlFor={`vis-${opt.v}`} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 hover:bg-muted/40">
            <RadioGroupItem id={`vis-${opt.v}`} value={opt.v} className="mt-0.5" />
            <div><p className="font-medium">{opt.l}</p><p className="text-xs text-muted-foreground">{opt.d}</p></div>
          </Label>
        ))}
      </RadioGroup>
      <Button onClick={save} disabled={busy} className="mt-6 rounded-full">
        {busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Save
      </Button>
    </SettingsPage>
  );
}

export function MessagePermissionPage() {
  const { user } = useAuth();
  const [value, setValue] = useState<MessagePerm>("everyone");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("message_permission").eq("id", user.id).maybeSingle()
      .then(({ data }) => data?.message_permission && setValue(data.message_permission as MessagePerm));
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ message_permission: value }).eq("id", user.id);
    setBusy(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    toast({ title: "Updated" });
  };

  return (
    <SettingsPage title="Who can message you">
      <p className="mb-4 text-sm text-muted-foreground">Control who is allowed to start a chat with you.</p>
      <RadioGroup value={value} onValueChange={(v) => setValue(v as MessagePerm)} className="space-y-2">
        {[
          { v: "everyone", l: "Everyone" },
          { v: "friends", l: "Trip mates only" },
          { v: "nobody", l: "Nobody" },
        ].map((opt) => (
          <Label key={opt.v} htmlFor={`mp-${opt.v}`} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/40">
            <RadioGroupItem id={`mp-${opt.v}`} value={opt.v} />
            <span className="font-medium">{opt.l}</span>
          </Label>
        ))}
      </RadioGroup>
      <Button onClick={save} disabled={busy} className="mt-6 rounded-full">
        {busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Save
      </Button>
    </SettingsPage>
  );
}

interface BlockedRow { id: string; blocked_id: string; profile?: { full_name: string | null; username: string | null; avatar_url: string | null } | null; }

export function BlockedUsersPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<BlockedRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("blocked_users").select("id, blocked_id").eq("blocker_id", user.id);
    const ids = (data ?? []).map(r => r.blocked_id);
    let profiles: Record<string, BlockedRow["profile"]> = {};
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", ids);
      profiles = Object.fromEntries((ps ?? []).map(p => [p.id, p]));
    }
    setRows((data ?? []).map(r => ({ ...r, profile: profiles[r.blocked_id] })));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const unblock = async (id: string) => {
    const { error } = await supabase.from("blocked_users").delete().eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Unblocked" });
    load();
  };

  return (
    <SettingsPage title="Blocked users">
      <p className="mb-4 text-sm text-muted-foreground">People you've blocked can't see your profile or message you.</p>
      <div className="space-y-2">
        {loading ? <p className="text-center text-sm text-muted-foreground">Loading…</p>
        : rows.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">You haven't blocked anyone.</p>
        : rows.map(r => (
          <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-2.5">
            <div className="flex items-center gap-2.5">
              <UserAvatar url={r.profile?.avatar_url} name={r.profile?.full_name} size={36} />
              <div><p className="text-sm font-medium">{r.profile?.full_name || "Unknown"}</p><p className="text-xs text-muted-foreground">@{r.profile?.username || "user"}</p></div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => unblock(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
      </div>
    </SettingsPage>
  );
}

export function ReportIssuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reason, setReason] = useState("Bug or technical issue");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!details.trim()) return toast({ title: "Please add some details", variant: "destructive" });
    setBusy(true);
    const { error } = await supabase.from("user_reports").insert({
      reporter_id: user.id, reported_id: user.id, reason, details, status: "pending",
    });
    setBusy(false);
    if (error) return toast({ title: "Couldn't submit", description: error.message, variant: "destructive" });
    toast({ title: "Report submitted ❤️", description: "Our team will look into it." });
    setDetails("");
    navigate(-1);
  };

  return (
    <SettingsPage title="Report an issue">
      <p className="mb-4 text-sm text-muted-foreground">Tell us what went wrong. Our team reads every report.</p>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option>Bug or technical issue</option><option>Inappropriate content</option><option>Safety concern</option>
            <option>Payment or refund</option><option>Other</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Details</Label>
          <Textarea rows={5} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Describe what happened…" />
        </div>
        <Button onClick={submit} disabled={busy} className="rounded-full">
          {busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Submit
        </Button>
      </div>
    </SettingsPage>
  );
}

/* ----------------------------- NOTIFICATIONS ----------------------------- */

interface Prefs {
  trip_updates: boolean;
  group_chat: boolean;
  new_trip_alerts: boolean;
  offers_promotions: boolean;
}
const NOTIF_FIELDS: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: "trip_updates", label: "Trip updates", desc: "Itinerary, payments, member changes." },
  { key: "group_chat", label: "Group chat messages", desc: "New messages from your trip groups." },
  { key: "new_trip_alerts", label: "New trip alerts", desc: "When trips that match your interests appear." },
  { key: "offers_promotions", label: "Offers & promotions", desc: "Discounts, seasonal deals, partner offers." },
];

export function NotificationsPage({ focusKey }: { focusKey?: keyof Prefs }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>({ trip_updates: true, group_chat: true, new_trip_alerts: true, offers_promotions: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("notification_prefs").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setPrefs({ trip_updates: data.trip_updates, group_chat: data.group_chat, new_trip_alerts: data.new_trip_alerts, offers_promotions: data.offers_promotions });
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("notification_prefs").upsert({ user_id: user.id, ...prefs });
    setBusy(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    toast({ title: "Notifications updated" });
  };

  const title = focusKey ? NOTIF_FIELDS.find(f => f.key === focusKey)?.label || "Notifications" : "Notifications";

  return (
    <SettingsPage title={title}>
      <p className="mb-4 text-sm text-muted-foreground">Choose what you'd like to hear about.</p>
      <div className="space-y-2">
        {NOTIF_FIELDS.map(f => (
          <div key={f.key} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${focusKey === f.key ? "border-primary bg-primary/5" : "border-border"}`}>
            <div><Label className="text-sm font-medium">{f.label}</Label><p className="text-xs text-muted-foreground">{f.desc}</p></div>
            <Switch checked={prefs[f.key]} onCheckedChange={(v) => setPrefs(p => ({ ...p, [f.key]: v }))} />
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={busy} className="mt-6 rounded-full">
        {busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Save
      </Button>
    </SettingsPage>
  );
}

/* ----------------------------- PREFERENCES ----------------------------- */

type PrefFocus = "location" | "destinations" | "budget" | "interests";

const PREF_TITLES: Record<PrefFocus | "all", string> = {
  all: "Travel preferences",
  location: "Location access",
  destinations: "Preferred destinations",
  budget: "Budget range",
  interests: "Travel interests",
};

export function PreferencesPage({ focusKey }: { focusKey?: PrefFocus }) {
  const { user } = useAuth();
  const [locationAccess, setLocationAccess] = useState(false);
  const [destinationsText, setDestinationsText] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [interestsText, setInterestsText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("travel_prefs").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setLocationAccess(data.location_access);
      setDestinationsText((data.preferred_destinations || []).join(", "));
      setBudgetMin(data.budget_min?.toString() || "");
      setBudgetMax(data.budget_max?.toString() || "");
      setInterestsText((data.travel_interests || []).join(", "));
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const payload = {
      user_id: user.id,
      location_access: locationAccess,
      preferred_destinations: destinationsText.split(",").map(s => s.trim()).filter(Boolean),
      budget_min: budgetMin ? Number(budgetMin) : null,
      budget_max: budgetMax ? Number(budgetMax) : null,
      travel_interests: interestsText.split(",").map(s => s.trim()).filter(Boolean),
    };
    const { error } = await supabase.from("travel_prefs").upsert(payload);
    if (locationAccess && navigator.geolocation) navigator.geolocation.getCurrentPosition(() => {}, () => {});
    setBusy(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    toast({ title: "Preferences saved" });
  };

  const show = (k: PrefFocus) => !focusKey || focusKey === k;

  return (
    <SettingsPage title={PREF_TITLES[focusKey || "all"]}>
      <div className="space-y-4">
        {show("location") && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <div><Label className="text-sm font-medium">Location access</Label><p className="text-xs text-muted-foreground">Show trips near you.</p></div>
            <Switch checked={locationAccess} onCheckedChange={setLocationAccess} />
          </div>
        )}
        {show("destinations") && (
          <div className="space-y-1.5">
            <Label>Preferred destinations</Label>
            <Input value={destinationsText} onChange={(e) => setDestinationsText(e.target.value)} placeholder="Goa, Bali, Iceland..." />
            <p className="text-xs text-muted-foreground">Comma separated.</p>
          </div>
        )}
        {show("budget") && (
          <div className="space-y-1.5">
            <Label>Budget range (₹)</Label>
            <div className="flex gap-2">
              <Input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="Min" />
              <Input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="Max" />
            </div>
          </div>
        )}
        {show("interests") && (
          <div className="space-y-1.5">
            <Label>Travel interests</Label>
            <Input value={interestsText} onChange={(e) => setInterestsText(e.target.value)} placeholder="Adventure, beaches, food, culture..." />
          </div>
        )}
      </div>
      <Button onClick={save} disabled={busy} className="mt-6 rounded-full">
        {busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Save
      </Button>
    </SettingsPage>
  );
}
