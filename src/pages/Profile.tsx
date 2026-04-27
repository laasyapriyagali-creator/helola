import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { AvatarUploader } from "@/components/AvatarUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, MapPin, Settings, LogOut, Heart, Bell, Lock, FileText, ChevronRight } from "lucide-react";
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
    if (!user) return;
    const hobbies = hobbiesText.split(",").map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, username: form.username, bio: form.bio,
      age: form.age, gender: form.gender, location: form.location, hobbies,
    }).eq("id", user.id);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Profile updated ✨" });
    setProfile({ ...(profile as Profile), ...form, hobbies });
    setEditing(false);
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

  return (
    <div className="min-w-0 overflow-x-hidden bg-texture-paper px-4 pt-4 md:px-8 md:pt-8">
      <Card className="overflow-hidden border-border/60 shadow-elegant">
        <div className="h-32 bg-primary bg-texture-hero md:h-40" />
        <CardContent className="relative p-5 pt-0 md:p-7 md:pt-0">
          {/* Avatar overlapping the band */}
          <div className="-mt-14 flex md:-mt-16">
            {isOwn ? (
              <AvatarUploader userId={user!.id} currentUrl={profile.avatar_url} fullName={profile.full_name}
                onChange={(url) => setProfile({ ...profile, avatar_url: url })} size={108} />
            ) : (
              <UserAvatar url={profile.avatar_url} name={profile.full_name} size={108} />
            )}
          </div>

          {isOwn && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => setEditing(!editing)} size="sm" className="rounded-full">
                <Edit2 className="mr-1 h-3.5 w-3.5" />{editing ? "Cancel" : "Edit profile"}
              </Button>
            </div>
          )}

          {!editing ? (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold md:text-3xl break-words">{profile.full_name || "Unnamed traveler"}</h1>
                {profile.is_verified && <Badge className="rounded-full bg-accent text-accent-foreground">✓ Verified</Badge>}
              </div>
              <p className="text-sm text-muted-foreground break-all">@{profile.username || "user"}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/70">
                {profile.age && <span>Age {profile.age}</span>}
                {profile.gender && <span className="capitalize">{profile.gender}</span>}
                {profile.location && <span className="flex items-center gap-1 min-w-0"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{profile.location}</span></span>}
              </div>
              {profile.bio && <p className="mt-4 text-base leading-relaxed text-foreground/90 break-words">{profile.bio}</p>}
              {profile.hobbies && profile.hobbies.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hobbies</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {profile.hobbies.map(h => <Badge key={h} variant="secondary" className="rounded-full bg-rose text-rose-foreground hover:bg-rose">{h}</Badge>)}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Full name</Label><Input value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Username</Label><Input value={form.username || ""} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Age</Label><Input type="number" value={form.age || ""} onChange={(e) => setForm({ ...form, age: e.target.value ? Number(e.target.value) : null })} /></div>
              <div className="space-y-1.5"><Label>Gender</Label><Input value={form.gender || ""} onChange={(e) => setForm({ ...form, gender: e.target.value })} placeholder="Female / Male / Non-binary..." /></div>
              <div className="space-y-1.5 md:col-span-2"><Label>Location</Label><Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Mumbai, India" /></div>
              <div className="space-y-1.5 md:col-span-2"><Label>Bio</Label><Textarea rows={3} value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="I like travelling and making friends!" /></div>
              <div className="space-y-1.5 md:col-span-2"><Label>Hobbies (comma separated)</Label><Input value={hobbiesText} onChange={(e) => setHobbiesText(e.target.value)} placeholder="Swimming, drawing, reading..." /></div>
              <div className="md:col-span-2"><Button onClick={save} className="rounded-full">Save changes</Button></div>
            </div>
          )}
        </CardContent>
      </Card>

      {isOwn && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <SectionCard title="Privacy & safety" icon={<Lock />}>
            <SettingsRow label="Profile visibility" hint="Who can see your profile" onClick={() => setDialog("visibility")} />
            <Divider />
            <SettingsRow label="Who can message you" onClick={() => setDialog("messages")} />
            <Divider />
            <SettingsRow label="Blocked users" onClick={() => setDialog("blocked")} />
            <Divider />
            <SettingsRow label="Report issues" onClick={() => setDialog("report")} />
          </SectionCard>

          <SectionCard title="Notifications" icon={<Bell />}>
            <SettingsRow label="Trip updates" onClick={() => setDialog("notif-trip")} />
            <Divider />
            <SettingsRow label="Group chat messages" onClick={() => setDialog("notif-chat")} />
            <Divider />
            <SettingsRow label="New trip alerts" onClick={() => setDialog("notif-alerts")} />
            <Divider />
            <SettingsRow label="Offers & promotions" onClick={() => setDialog("notif-offers")} />
          </SectionCard>

          <SectionCard title="Preferences" icon={<Heart />}>
            <SettingsRow label="Location access" onClick={() => setDialog("prefs-location")} />
            <Divider />
            <SettingsRow label="Preferred destinations" onClick={() => setDialog("prefs-destinations")} />
            <Divider />
            <SettingsRow label="Budget range" onClick={() => setDialog("prefs-budget")} />
            <Divider />
            <SettingsRow label="Travel interests" onClick={() => setDialog("prefs-interests")} />
          </SectionCard>

          <SectionCard title="Legal & support" icon={<FileText />}>
            <LinkRow to="/legal/privacy" label="Privacy Policy" />
            <Divider />
            <LinkRow to="/legal/terms" label="Terms & Conditions" />
            <Divider />
            <LinkRow to="/legal/community" label="Community Guidelines" />
            <Divider />
            <LinkRow to="/about" label="About HELOLA" />
            <Divider />
            <LinkRow to="/support" label="Contact support" />
          </SectionCard>

          <Card className="border-border/60 shadow-soft md:col-span-2">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose text-rose-foreground"><Settings className="h-4 w-4" /></div>
                <div><p className="font-semibold">Account</p><p className="text-xs text-muted-foreground">{user?.email}</p></div>
              </div>
              <Button variant="outline" onClick={async () => { await signOut(); navigate("/auth"); }} className="rounded-full">
                <LogOut className="mr-1 h-3.5 w-3.5" />Log out
              </Button>
            </CardContent>
          </Card>
          <p className="md:col-span-2 text-center text-xs text-muted-foreground">© All rights reserved by HELOLA</p>
        </div>
      )}

      {/* Dialogs */}
      <VisibilityDialog open={dialog === "visibility"} onOpenChange={(v) => !v && close()} />
      <MessagePermissionDialog open={dialog === "messages"} onOpenChange={(v) => !v && close()} />
      <BlockedUsersDialog open={dialog === "blocked"} onOpenChange={(v) => !v && close()} />
      <ReportIssueDialog open={dialog === "report"} onOpenChange={(v) => !v && close()} />
      <NotificationDialog open={notifOpen} onOpenChange={(v) => !v && close()} focusKey={notifFocus} />
      <PreferencesDialog open={prefsOpen} onOpenChange={(v) => !v && close()} focusKey={prefsFocus} />
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="border-border/60 shadow-soft">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose text-rose-foreground">{icon}</div>
          <h3 className="font-display text-lg font-semibold">{title}</h3>
        </div>
        <div>{children}</div>
      </CardContent>
    </Card>
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
