import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar2D } from "@/components/Avatar2D";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, MapPin, Settings, LogOut, Sparkles, Heart, Bell, Lock, FileText, HelpCircle } from "lucide-react";
import type { AvatarConfig } from "@/lib/avatar";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  age: number | null;
  gender: string | null;
  location: string | null;
  hobbies: string[] | null;
  avatar_config: Partial<AvatarConfig> | null;
  is_verified: boolean;
}

export default function Profile() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [hobbiesText, setHobbiesText] = useState("");

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
      full_name: form.full_name,
      username: form.username,
      bio: form.bio,
      age: form.age,
      gender: form.gender,
      location: form.location,
      hobbies,
    }).eq("id", user.id);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Profile updated ✨" });
    setProfile({ ...(profile as Profile), ...form, hobbies });
    setEditing(false);
  };

  if (loading) return <div className="space-y-3 p-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>;
  if (!profile) return <div className="p-10 text-center">Profile not found.</div>;

  return (
    <div className="px-4 pt-4 md:px-8 md:pt-8">
      {/* Hero */}
      <Card className="overflow-hidden border-border/60 shadow-elegant">
        <div className="h-24 bg-primary md:h-32" />
        <CardContent className="relative p-5 md:p-7">
          <div className="-mt-16 flex flex-col gap-3 md:-mt-20 md:flex-row md:items-end md:justify-between">
            <div className="w-fit rounded-3xl bg-card p-2 shadow-soft">
              <Avatar2D config={profile.avatar_config} size={108} />
            </div>
            {isOwn && (
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link to="/avatar"><Sparkles className="mr-1 h-3.5 w-3.5" />Edit avatar</Link>
                </Button>
                <Button onClick={() => setEditing(!editing)} size="sm" className="rounded-full">
                  <Edit2 className="mr-1 h-3.5 w-3.5" />{editing ? "Cancel" : "Edit"}
                </Button>
              </div>
            )}
          </div>

          {!editing ? (
            <>
              <div className="mt-4 flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold md:text-3xl">{profile.full_name || "Unnamed traveler"}</h1>
                {profile.is_verified && <Badge className="rounded-full bg-accent text-accent-foreground">✓ Verified</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">@{profile.username || "user"}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/70">
                {profile.age && <span>Age {profile.age}</span>}
                {profile.gender && <span className="capitalize">{profile.gender}</span>}
                {profile.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>}
              </div>
              {profile.bio && <p className="mt-4 text-base leading-relaxed text-foreground/90">{profile.bio}</p>}
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

      {/* Settings — only visible on own profile */}
      {isOwn && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <SettingsCard title="Privacy & safety" icon={<Lock />} items={["Profile visibility", "Who can message you", "Blocked users", "Report issues"]} />
          <SettingsCard title="Notifications" icon={<Bell />} items={["Trip updates", "Group chat messages", "New trip alerts", "Offers & promotions"]} />
          <SettingsCard title="Preferences" icon={<Heart />} items={["Location access", "Preferred destinations", "Budget range", "Travel interest"]} />
          <SettingsCard
            title="Legal & support"
            icon={<FileText />}
            items={[
              { label: "Privacy Policy", to: "/legal/privacy" },
              { label: "Terms & Conditions", to: "/legal/terms" },
              { label: "Community Guidelines", to: "/legal/community" },
              { label: "About HELOLA", to: "/about" },
              { label: "Contact support", to: "/support" },
            ]}
          />
          <Card className="border-border/60 shadow-soft md:col-span-2">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose text-rose-foreground"><Settings className="h-4 w-4" /></div>
                <div>
                  <p className="font-semibold">Account</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button variant="outline" onClick={async () => { await signOut(); navigate("/auth"); }} className="rounded-full">
                <LogOut className="mr-1 h-3.5 w-3.5" />Log out
              </Button>
            </CardContent>
          </Card>
          <p className="md:col-span-2 text-center text-xs text-muted-foreground">© All rights reserved by HELOLA</p>
        </div>
      )}
    </div>
  );
}

function SettingsCard({ title, icon, items }: { title: string; icon: React.ReactNode; items: (string | { label: string; to: string })[] }) {
  return (
    <Card className="border-border/60 shadow-soft">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose text-rose-foreground">{icon}</div>
          <h3 className="font-display text-lg font-semibold">{title}</h3>
        </div>
        <ul className="divide-y divide-border">
          {items.map((it, i) => {
            const label = typeof it === "string" ? it : it.label;
            const to = typeof it === "string" ? null : it.to;
            const inner = (
              <>
                <span className="text-sm">{label}</span>
                <span className="text-muted-foreground">›</span>
              </>
            );
            return (
              <li key={i}>
                {to ? (
                  <Link to={to} className="flex items-center justify-between py-3 hover:text-primary">{inner}</Link>
                ) : (
                  <button className="flex w-full items-center justify-between py-3 text-left hover:text-primary">{inner}</button>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
