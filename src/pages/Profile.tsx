import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { AvatarUploader } from "@/components/AvatarUploader";
import { AvatarViewerDialog } from "@/components/AvatarViewerDialog";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, MapPin, Settings, LogOut, Heart, Bell, Lock, FileText, ChevronRight, Lock as LockIcon, Trash2 } from "lucide-react";
import { CoverUploader } from "@/components/CoverUploader";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { VisibilityDialog, MessagePermissionDialog, BlockedUsersDialog, ReportIssueDialog } from "@/components/settings/PrivacySafetyDialogs";
import { NotificationDialog } from "@/components/settings/NotificationDialog";
import { PreferencesDialog } from "@/components/settings/PreferencesDialog";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  age: number | null;
  gender: string | null;
  location: string | null;
  hobbies: string[] | null;
  avatar_url: string | null;
  cover_url: string | null;
  is_verified: boolean;
  identity_locked: boolean;
  username_change_count: number;
}

type DialogId =
  | "visibility" | "messages" | "blocked" | "report"
  | "notif" | "notif-trip" | "notif-chat" | "notif-alerts" | "notif-offers"
  | "prefs" | "prefs-location" | "prefs-destinations" | "prefs-budget" | "prefs-interests"
  | null;

export default function Profile() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [hobbiesText, setHobbiesText] = useState("");
  const [dialog, setDialog] = useState<DialogId>(null);
  const [saving, setSaving] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const targetId = userId || user?.id;
  const isOwn = !userId || userId === user?.id;

  useEffect(() => {
    if (!authLoading && !user && !userId) navigate("/auth");
  }, [user, authLoading, userId, navigate]);

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    supabase.from("profiles").select("*").eq("id", targetId).maybeSingle()
      .then(({ data }) => {
        setProfile((data as Profile) || null);
        setForm((data as Profile) || {});
        setHobbiesText(((data as Profile)?.hobbies || []).join(", "));
        document.title = data?.full_name ? `${data.full_name} · HELOLA` : "Profile · HELOLA";
        setLoading(false);
      });
  }, [targetId]);

  const save = async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      const hobbies = hobbiesText.split(",").map(s => s.trim()).filter(Boolean);
      const newUsername = (form.username || "").trim().toLowerCase().replace(/\s+/g, "_");
      const usernameChanged = newUsername && newUsername !== (profile.username || "").toLowerCase();

      // Username uniqueness check
      if (usernameChanged) {
        if (profile.username_change_count >= 2) {
          toast({ title: "Username locked", description: "You've already changed your username twice.", variant: "destructive" });
          setSaving(false); return;
        }
        if (!/^[a-z0-9_]{3,20}$/.test(newUsername)) {
          toast({ title: "Invalid username", description: "Use 3–20 lowercase letters, numbers, or underscores.", variant: "destructive" });
          setSaving(false); return;
        }
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .ilike("username", newUsername)
          .neq("id", user.id)
          .maybeSingle();
        if (existing) {
          toast({ title: "This username already exists", description: "Try another one.", variant: "destructive" });
          setSaving(false); return;
        }
      }

      const updates: {
        bio?: string | null;
        location?: string | null;
        hobbies?: string[];
        username?: string;
        full_name?: string | null;
        age?: number | null;
        gender?: string | null;
      } = {
        bio: form.bio ?? null,
        location: form.location ?? null,
        hobbies,
      };
      if (usernameChanged) updates.username = newUsername;
      if (!profile.identity_locked) {
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
      setProfile({ ...profile, ...form, hobbies, username: usernameChanged ? newUsername : profile.username, username_change_count: usernameChanged ? profile.username_change_count + 1 : profile.username_change_count });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-3 p-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>;
  if (!profile) return <div className="p-10 text-center">Profile not found.</div>;

  const close = () => setDialog(null);
  const notifFocus = dialog === "notif-trip" ? "trip_updates"
    : dialog === "notif-chat" ? "group_chat"
    : dialog === "notif-alerts" ? "new_trip_alerts"
    : dialog === "notif-offers" ? "offers_promotions" : undefined;
  const prefsFocus = dialog === "prefs-location" ? "location"
    : dialog === "prefs-destinations" ? "destinations"
    : dialog === "prefs-budget" ? "budget"
    : dialog === "prefs-interests" ? "interests" : undefined;
  const notifOpen = dialog === "notif" || dialog?.startsWith("notif-");
  const prefsOpen = dialog === "prefs" || dialog?.startsWith("prefs-");

  const usernameLeft = Math.max(0, 2 - (profile.username_change_count || 0));

  return (
    <div className="min-w-0 overflow-x-hidden bg-texture-paper px-4 pt-4 md:px-8 md:pt-8">
      {/* Header: taller cover + avatar overlapping ~half of it */}
      <Card className="overflow-hidden border-border/60 bg-card shadow-elegant">
        <div className="relative h-40 md:h-52">
          {isOwn ? (
            <CoverUploader
              userId={user!.id}
              currentUrl={profile.cover_url}
              onChange={(url) => setProfile({ ...profile, cover_url: url })}
              className="absolute inset-0"
            />
          ) : profile.cover_url ? (
            <img src={profile.cover_url} alt="Profile background" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-primary bg-texture-hero" />
          )}
        </div>

        {/* Avatar bar — avatar pulled up so half of it sits over the cover */}
        <div className="relative bg-card px-5 pb-5 md:px-7 md:pb-6">
          <div className="-mt-16 md:-mt-20">
            {isOwn ? (
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => profile.avatar_url && setViewerOpen(true)}
                  className="block rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="View profile photo"
                >
                  <AvatarUploader userId={user!.id} currentUrl={profile.avatar_url} fullName={profile.full_name}
                    onChange={(url) => setProfile({ ...profile, avatar_url: url })} size={128} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => profile.avatar_url && setViewerOpen(true)}
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="View profile photo"
              >
                <UserAvatar url={profile.avatar_url} name={profile.full_name} size={128} />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Profile details — clean stacked rows, divided by lines (no random buttons) */}
      <div className="mx-auto mt-5 max-w-3xl divide-y divide-border rounded-2xl border border-border/60 bg-card shadow-soft">
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl break-words">{profile.full_name || "Unnamed traveler"}</h1>
            {profile.is_verified && <Badge className="rounded-full bg-accent text-accent-foreground">✓ Verified</Badge>}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground break-all">@{profile.username || "user"}</p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</p>
          <p className="mt-1 flex items-center gap-1.5 text-base text-foreground break-words">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            {profile.location || <span className="text-muted-foreground">Not set</span>}
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Age & gender</p>
          <p className="mt-1 text-base text-foreground">
            {profile.age ? `Age ${profile.age}` : <span className="text-muted-foreground">Age not set</span>}
            <span className="mx-2 text-muted-foreground">•</span>
            <span className="capitalize">{profile.gender || <span className="text-muted-foreground">—</span>}</span>
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bio</p>
          <p className="mt-1 text-base leading-relaxed text-foreground/90 break-words">
            {profile.bio || <span className="text-muted-foreground">No bio yet.</span>}
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hobbies</p>
          {profile.hobbies && profile.hobbies.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.hobbies.map(h => <Badge key={h} variant="secondary" className="rounded-full bg-rose text-rose-foreground hover:bg-rose">{h}</Badge>)}
            </div>
          ) : (
            <p className="mt-1 text-muted-foreground">No hobbies added.</p>
          )}
        </div>
      </div>

      {isOwn && (
        <div className="mx-auto mt-8 max-w-3xl space-y-10 pb-6">
          <Section title="Privacy & safety" icon={<Lock className="h-4 w-4" />}>
            <SettingsRow label="Profile visibility" hint="Who can see your profile" onClick={() => setDialog("visibility")} />
            <Divider />
            <SettingsRow label="Who can message you" onClick={() => setDialog("messages")} />
            <Divider />
            <SettingsRow label="Blocked users" onClick={() => setDialog("blocked")} />
            <Divider />
            <SettingsRow label="Report issues" onClick={() => setDialog("report")} />
          </Section>

          <Section title="Notifications" icon={<Bell className="h-4 w-4" />}>
            <SettingsRow label="Trip updates" onClick={() => setDialog("notif-trip")} />
            <Divider />
            <SettingsRow label="Group chat messages" onClick={() => setDialog("notif-chat")} />
            <Divider />
            <SettingsRow label="New trip alerts" onClick={() => setDialog("notif-alerts")} />
            <Divider />
            <SettingsRow label="Offers & promotions" onClick={() => setDialog("notif-offers")} />
          </Section>

          <Section title="Preferences" icon={<Heart className="h-4 w-4" />}>
            <SettingsRow label="Location access" onClick={() => setDialog("prefs-location")} />
            <Divider />
            <SettingsRow label="Preferred destinations" onClick={() => setDialog("prefs-destinations")} />
            <Divider />
            <SettingsRow label="Budget range" onClick={() => setDialog("prefs-budget")} />
            <Divider />
            <SettingsRow label="Travel interests" onClick={() => setDialog("prefs-interests")} />
          </Section>

          <Section title="Legal & support" icon={<FileText className="h-4 w-4" />}>
            <LinkRow to="/legal/privacy" label="Privacy Policy" />
            <Divider />
            <LinkRow to="/legal/terms" label="Terms & Conditions" />
            <Divider />
            <LinkRow to="/legal/community" label="Community Guidelines" />
            <Divider />
            <LinkRow to="/about" label="About HELOLA" />
            <Divider />
            <LinkRow to="/support" label="Contact support" />
          </Section>

          <Section title="My account" icon={<Settings className="h-4 w-4" />}>
            <div className="space-y-4 py-3">
              {!editing ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Edit profile details</p>
                    <p className="truncate text-xs text-muted-foreground">Name, location, age, gender, bio, hobbies</p>
                  </div>
                  <Button size="sm" onClick={() => setEditing(true)} className="rounded-full">
                    <Edit2 className="mr-1 h-3.5 w-3.5" />Edit
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1">Full name {profile.identity_locked && <LockIcon className="h-3 w-3 text-muted-foreground" />}</Label>
                    <Input value={form.full_name || ""} disabled={profile.identity_locked} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                    {profile.identity_locked && <p className="text-xs text-muted-foreground">Name is locked and can't be changed.</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Username {usernameLeft > 0 ? <span className="text-xs text-muted-foreground">({usernameLeft} change{usernameLeft === 1 ? "" : "s"} left)</span> : <span className="text-xs text-destructive">(locked)</span>}</Label>
                    <Input value={form.username || ""} disabled={usernameLeft === 0} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username_only" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1">Age {profile.identity_locked && <LockIcon className="h-3 w-3 text-muted-foreground" />}</Label>
                    <Input type="number" disabled={profile.identity_locked} value={form.age || ""} onChange={(e) => setForm({ ...form, age: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1">Gender {profile.identity_locked && <LockIcon className="h-3 w-3 text-muted-foreground" />}</Label>
                    <Input value={form.gender || ""} disabled={profile.identity_locked} onChange={(e) => setForm({ ...form, gender: e.target.value })} placeholder="Female / Male / Non-binary..." />
                  </div>
                  <div className="space-y-1.5 md:col-span-2"><Label>Location</Label><Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Mumbai, India" /></div>
                  <div className="space-y-1.5 md:col-span-2"><Label>Bio</Label><Textarea rows={3} value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="I like travelling and making friends!" /></div>
                  <div className="space-y-1.5 md:col-span-2"><Label>Hobbies (comma separated)</Label><Input value={hobbiesText} onChange={(e) => setHobbiesText(e.target.value)} placeholder="Swimming, drawing, reading..." /></div>
                  <div className="md:col-span-2 flex gap-2">
                    <Button onClick={save} disabled={saving} className="rounded-full">{saving ? "Saving…" : "Save changes"}</Button>
                    <Button variant="outline" onClick={() => { setEditing(false); setForm(profile); setHobbiesText((profile.hobbies || []).join(", ")); }} className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">Cancel</Button>
                  </div>
                </div>
              )}
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
                <Button size="sm" onClick={async () => { await signOut(); navigate("/auth"); }} className="rounded-full">
                  <LogOut className="mr-1 h-3.5 w-3.5" />Log out
                </Button>
              </div>
            </div>
          </Section>

          <p className="pt-4 text-center text-xs text-muted-foreground">© All rights reserved by HELOLA</p>
        </div>
      )}

      <VisibilityDialog open={dialog === "visibility"} onOpenChange={(v) => !v && close()} />
      <MessagePermissionDialog open={dialog === "messages"} onOpenChange={(v) => !v && close()} />
      <BlockedUsersDialog open={dialog === "blocked"} onOpenChange={(v) => !v && close()} />
      <ReportIssueDialog open={dialog === "report"} onOpenChange={(v) => !v && close()} />
      <NotificationDialog open={notifOpen} onOpenChange={(v) => !v && close()} focusKey={notifFocus} />
      <PreferencesDialog open={prefsOpen} onOpenChange={(v) => !v && close()} focusKey={prefsFocus} />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 text-primary">
        {icon}
        <h3 className="font-display text-lg font-semibold">{title}</h3>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Divider() { return <div className="h-px bg-border" />; }

function LinkRow({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between py-3 hover:text-primary">
      <span className="text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
