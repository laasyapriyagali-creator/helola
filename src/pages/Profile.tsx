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
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, MapPin, Settings, LogOut, Heart, Bell, Lock, FileText, ChevronRight, Trash2, UserCircle2, Camera } from "lucide-react";
import { CoverUploader } from "@/components/CoverUploader";


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

export default function Profile() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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
        document.title = data?.full_name ? `${data.full_name} · HELOLA` : "Profile · HELOLA";
        setLoading(false);
      });
  }, [targetId]);

  if (loading) return <div className="space-y-3 p-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>;
  if (!profile) return <div className="p-10 text-center">Profile not found.</div>;

  return (
    <div className="min-w-0 overflow-x-hidden bg-texture-paper px-4 pt-4 md:px-8 md:pt-8">
      {/* One flowing card: cover → avatar+name → details (LinkedIn-style header) */}
      <Card className="mx-auto max-w-3xl overflow-hidden rounded-3xl border-border/40 bg-card shadow-elegant backdrop-blur-sm">
        {/* Compact cover — avatar overlaps bottom-left like the reference mockup */}
        <div className="relative h-32 md:h-40">
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

        <div className="px-6 pb-2 md:px-10">
          {/* Avatar + name row — avatar overlaps cover, name sits to the right */}
          <div className="flex items-end gap-4 -mt-12 md:-mt-14">
            <div className="shrink-0 rounded-full ring-4 ring-background">
              {isOwn ? (
                <AvatarUploader
                  userId={user!.id}
                  currentUrl={profile.avatar_url}
                  fullName={profile.full_name}
                  onChange={(url) => setProfile({ ...profile, avatar_url: url })}
                  size={104}
                  onView={() => profile.avatar_url && setViewerOpen(true)}
                  compact
                />
              ) : (
                <button
                  type="button"
                  onClick={() => profile.avatar_url && setViewerOpen(true)}
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="View profile photo"
                >
                  <UserAvatar url={profile.avatar_url} name={profile.full_name} size={104} />
                </button>
              )}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl break-words">
                  {profile.full_name || "Unnamed traveler"}
                </h1>
                {profile.is_verified && (
                  <Badge className="rounded-full bg-accent text-accent-foreground">✓ Verified</Badge>
                )}
              </div>
              <p className="mt-0.5 text-sm font-light text-muted-foreground/80 break-all">
                @{profile.username || "user"}
              </p>
            </div>
          </div>

          <div className="mt-6 divide-y divide-border/50">
            <DetailRow label="Location" value={
              <span className="inline-flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/8 text-primary">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                </span>
                {profile.location || <span className="text-muted-foreground">Not set</span>}
              </span>
            } />

            <DetailRow label="Age & gender" value={
              <span>
                {profile.age ? `${profile.age}` : <span className="text-muted-foreground">—</span>}
                <span className="mx-2 text-muted-foreground/60">·</span>
                <span className="capitalize">{profile.gender || <span className="text-muted-foreground">—</span>}</span>
              </span>
            } />

            <DetailRow label="Bio" value={
              profile.bio
                ? <span className="leading-relaxed text-foreground/90">{profile.bio}</span>
                : <span className="text-muted-foreground">No bio yet.</span>
            } />

            <DetailRow label="Hobbies" value={
              profile.hobbies && profile.hobbies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.hobbies.map(h => (
                    <Badge key={h} variant="secondary" className="rounded-full bg-rose font-normal text-rose-foreground hover:bg-rose">
                      {h}
                    </Badge>
                  ))}
                </div>
              ) : <span className="text-muted-foreground">No hobbies added.</span>
            } />
          </div>

          {isOwn && (
            <div className="mt-7 pb-7">
              <Button
                onClick={() => navigate("/settings/edit-profile")}
                className="rounded-full px-5 shadow-soft"
              >
                <Edit2 className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                Edit profile
              </Button>
            </div>
          )}
        </div>
      </Card>

      {isOwn && (
        <div className="mx-auto mt-8 max-w-3xl space-y-10 pb-6">
          <Section title="My account" icon={<Settings className="h-4 w-4" />}>
            <NavRow to="/settings/account" label="Account information" hint="Username, display name, email, phone" />
            <Divider />
            <NavRow to="/settings/edit-profile" label="Edit profile details" hint="Name, location, bio, hobbies" />
          </Section>

          <Section title="Privacy & safety" icon={<Lock className="h-4 w-4" />}>
            <NavRow to="/settings/visibility" label="Profile visibility" hint="Who can see your profile" />
            <Divider />
            <NavRow to="/settings/messages" label="Who can message you" />
            <Divider />
            <NavRow to="/settings/blocked" label="Blocked users" />
            <Divider />
            <NavRow to="/settings/report" label="Report issues" />
          </Section>

          <Section title="Notifications" icon={<Bell className="h-4 w-4" />}>
            <NavRow to="/settings/notifications/trip-updates" label="Trip updates" />
            <Divider />
            <NavRow to="/settings/notifications/group-chat" label="Group chat messages" />
            <Divider />
            <NavRow to="/settings/notifications/new-trip-alerts" label="New trip alerts" />
            <Divider />
            <NavRow to="/settings/notifications/offers" label="Offers & promotions" />
          </Section>

          <Section title="Preferences" icon={<Heart className="h-4 w-4" />}>
            <NavRow to="/settings/preferences/location" label="Location access" />
            <Divider />
            <NavRow to="/settings/preferences/destinations" label="Preferred destinations" />
            <Divider />
            <NavRow to="/settings/preferences/budget" label="Budget range" />
            <Divider />
            <NavRow to="/settings/preferences/interests" label="Travel interests" />
          </Section>

          <Section title="Legal & support" icon={<FileText className="h-4 w-4" />}>
            <NavRow to="/legal/privacy" label="Privacy Policy" />
            <Divider />
            <NavRow to="/legal/terms" label="Terms & Conditions" />
            <Divider />
            <NavRow to="/legal/community" label="Community Guidelines" />
            <Divider />
            <NavRow to="/about" label="About HELOLA" />
            <Divider />
            <NavRow to="/support" label="Contact support" />
          </Section>

          <Section title="Account actions" icon={<UserCircle2 className="h-4 w-4" />}>
            <div className="flex items-center justify-between gap-3 py-3">
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              <Button size="sm" onClick={async () => { await signOut(); navigate("/auth"); }} className="rounded-full">
                <LogOut className="mr-1 h-3.5 w-3.5" />Log out
              </Button>
            </div>
            <Divider />
            <div className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-destructive">Delete account</p>
                <p className="truncate text-xs text-muted-foreground">Permanently remove your account after a 30-day grace period.</p>
              </div>
              <Button size="sm" onClick={() => setDeleteOpen(true)} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Trash2 className="mr-1 h-3.5 w-3.5" />Delete account
              </Button>
            </div>
          </Section>

          <p className="pt-4 text-center text-xs text-muted-foreground">© All rights reserved by HELOLA</p>
        </div>
      )}

      <AvatarViewerDialog open={viewerOpen} onOpenChange={setViewerOpen} url={profile.avatar_url} name={profile.full_name} />
      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 text-primary">
        {icon}
        <h3 className="font-sans text-base font-semibold tracking-tight">{title}</h3>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Divider() { return <div className="h-px bg-border" />; }

function NavRow({ to, label, hint }: { to: string; label: string; hint?: string }) {
  return (
    <Link to={to} className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-primary">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">{label}</p>
      <div className="mt-1.5 text-base text-foreground break-words">{value}</div>
    </div>
  );
}
