import { Link } from "react-router-dom";
import { UserAvatar } from "@/components/UserAvatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ChevronRight } from "lucide-react";

interface HostProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  age: number | null;
  location: string | null;
  hobbies: string[] | null;
  avatar_url: string | null;
  cover_url: string | null;
  is_verified: boolean;
  show_age?: boolean | null;
  show_location?: boolean | null;
}

/**
 * Rich host card — cover photo banner with avatar overlap, name + verified badge,
 * age/city/country chips, short bio and interest chips. Whole card is tappable
 * and opens the host's public profile.
 */
export function HostCard({ host }: { host: HostProfile }) {
  const showAge = host.show_age !== false && host.age;
  const showLocation = host.show_location !== false && host.location;

  return (
    <Card className="overflow-hidden border-border/60 shadow-soft">
      <Link to={`/u/${host.id}`} className="block">
        {/* Cover */}
        <div className="relative h-24 w-full overflow-hidden bg-gradient-warm">
          {host.cover_url ? (
            <img src={host.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <div className="h-full w-full bg-primary/90 bg-texture-hero" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary shadow-soft">
            Host
          </span>
        </div>

        <div className="px-4 pb-4">
          <div className="-mt-7 flex items-start justify-between gap-3">
            <UserAvatar url={host.avatar_url} name={host.full_name} size={64} className="ring-4 ring-background" />
            <ChevronRight className="mt-8 h-4 w-4 shrink-0 text-muted-foreground" />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-display text-lg font-semibold leading-tight">{host.full_name || "Traveler"}</h3>
            {host.is_verified && (
              <Badge className="rounded-full bg-accent px-2 py-0 text-[10px] text-accent-foreground">✓ Verified</Badge>
            )}
          </div>
          {host.username && <p className="text-xs text-muted-foreground">@{host.username}</p>}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {showLocation && (
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{host.location}</span>
            )}
            {showAge && <span>· {host.age} yrs</span>}
          </div>

          {host.bio && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/80">{host.bio}</p>
          )}

          {host.hobbies && host.hobbies.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {host.hobbies.slice(0, 5).map(h => (
                <span key={h} className="rounded-full bg-rose px-2 py-0.5 text-[11px] text-rose-foreground">{h}</span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </Card>
  );
}
