import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { AvatarUploader } from "@/components/AvatarUploader";
import { AvatarViewerDialog } from "@/components/AvatarViewerDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Settings as SettingsIcon, Camera, Trash2 } from "lucide-react";
import { CoverUploader } from "@/components/CoverUploader";
import { CoverViewerDialog } from "@/components/CoverViewerDialog";
import { EditProfileSheet } from "@/components/EditProfileSheet";

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
  const { user, loading: authLoading } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [coverViewerOpen, setCoverViewerOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

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

  if (loading) return <div className="space-y-3 p-4"><Skeleton className="h-36 w-full" /><Skeleton className="h-32 w-full" /></div>;
  if (!profile) return <div className="p-10 text-center">Profile not found.</div>;

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background">
      {/* Cover banner — slim 4:1, edge-to-edge, no card chrome */}
      <div className="relative aspect-[4/1] w-full max-h-[140px]">
        {isOwn ? (
          <CoverUploader
            userId={user!.id}
            currentUrl={profile.cover_url}
            onChange={(url) => setProfile({ ...profile, cover_url: url })}
            className="absolute inset-0 h-full w-full"
            onView={() => profile.cover_url && setCoverViewerOpen(true)}
          />
        ) : (
          <button
            type="button"
            onClick={() => profile.cover_url && setCoverViewerOpen(true)}
            className="block h-full w-full focus:outline-none"
            aria-label="View cover photo"
          >
            {profile.cover_url ? (
              <img src={profile.cover_url} alt="Profile background" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-primary bg-texture-hero" />
            )}
          </button>
        )}

        {/* Settings gear — top-right, only on own profile */}
        {isOwn && (
          <button
            type="button"
            onClick={() => navigate("/settings")}
            aria-label="Settings"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-primary shadow-soft backdrop-blur hover:bg-background"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Body — natural screen padding, no floating card */}
      <div className="px-4 pb-10 md:px-6">
        {/* Avatar overlap (40% cover / 60% white) */}
        <div className="flex items-center gap-4">
          <div className="-mt-12 shrink-0">
            {isOwn ? (
              <AvatarUploader
                userId={user!.id}
                currentUrl={profile.avatar_url}
                fullName={profile.full_name}
                onChange={(url) => setProfile({ ...profile, avatar_url: url })}
                size={108}
                onView={() => profile.avatar_url && setViewerOpen(true)}
                compact
              />
            ) : (
              <button
                type="button"
                onClick={() => profile.avatar_url && setViewerOpen(true)}
                className="block rounded-full ring-[4px] ring-background shadow-elegant focus:outline-none focus:ring-primary"
                aria-label="View profile photo"
              >
                <UserAvatar url={profile.avatar_url} name={profile.full_name} size={108} />
              </button>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[24px] font-bold leading-tight tracking-tight text-primary md:text-[28px] break-words">
                {profile.full_name || "Unnamed traveler"}
              </h1>
              {profile.is_verified && (
                <Badge className="rounded-full bg-accent text-accent-foreground">✓ Verified</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground break-all">
              @{profile.username || "user"}
            </p>
          </div>
        </div>

        {/* Single primary action — Edit Profile */}
        {isOwn && (
          <div className="mt-5">
            <Button
              type="button"
              onClick={() => setEditSheetOpen(true)}
              className="h-10 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Edit Profile
            </Button>
          </div>
        )}

        {/* Profile details */}
        <div className="mt-6 divide-y divide-border/60">
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
      </div>

      <AvatarViewerDialog open={viewerOpen} onOpenChange={setViewerOpen} url={profile.avatar_url} name={profile.full_name} />
      <CoverViewerDialog open={coverViewerOpen} onOpenChange={setCoverViewerOpen} url={profile.cover_url} name={profile.full_name} />
      {isOwn && (
        <EditProfileSheet
          open={editSheetOpen}
          onOpenChange={setEditSheetOpen}
          hasPhoto={!!profile.avatar_url}
        />
      )}
    </div>
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
