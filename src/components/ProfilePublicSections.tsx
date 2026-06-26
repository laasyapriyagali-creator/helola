import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TripImage } from "@/components/TripImage";
import { Calendar, MapPin, Camera, Plane } from "lucide-react";

interface Trip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  cover_image_url: string | null;
}
interface Memory {
  id: string;
  image_url: string;
  caption: string | null;
  trip_id: string | null;
}

/**
 * Public sections shown at the bottom of a user profile.
 * Shows upcoming public trips the user is part of, count of completed trips,
 * and recent travel moments — all click-through to details.
 */
export function ProfilePublicSections({ userId }: { userId: string }) {
  const [upcoming, setUpcoming] = useState<Trip[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [moments, setMoments] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const { data: tm } = await supabase.from("trip_members").select("trip_id").eq("user_id", userId);
      const tripIds = (tm ?? []).map(r => r.trip_id);
      let up: Trip[] = []; let completed = 0;
      if (tripIds.length) {
        const { data: ts } = await supabase.from("trips")
          .select("id,destination,start_date,end_date,cover_image_url")
          .in("id", tripIds);
        (ts ?? []).forEach(t => {
          if (t.end_date < today) completed += 1;
          else up.push(t as Trip);
        });
        up.sort((a, b) => a.start_date.localeCompare(b.start_date));
        up = up.slice(0, 4);
      }
      const { data: mems } = await supabase.from("memories")
        .select("id,image_url,caption,trip_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(6);
      if (!cancelled) {
        setUpcoming(up);
        setCompletedCount(completed);
        setMoments((mems as Memory[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) return null;

  const hasAnything = upcoming.length > 0 || moments.length > 0 || completedCount > 0;
  if (!hasAnything) return null;

  return (
    <div className="mt-8 space-y-7">
      {/* Trip stats — quiet, no ratings, no follower counts */}
      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Plane className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground/70">Trips completed</p>
          <p className="font-display text-xl font-semibold text-foreground">{completedCount}</p>
        </div>
      </div>

      {/* Upcoming public trips */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">Upcoming trips</h2>
          <div className="grid grid-cols-2 gap-3">
            {upcoming.map(t => (
              <Link key={t.id} to={`/trips/${t.id}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-xl shadow-soft">
                <TripImage destination={t.destination} coverUrl={t.cover_image_url} rounded="xl"
                  className="absolute inset-0 h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <p className="line-clamp-1 font-display text-base font-semibold leading-tight">{t.destination}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] opacity-85">
                    <Calendar className="h-3 w-3" />
                    {new Date(t.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Public moments */}
      {moments.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-foreground">
            <Camera className="h-4 w-4 text-primary" /> Travel moments
          </h2>
          <div className="grid grid-cols-3 gap-1.5">
            {moments.map(m => (
              <Link key={m.id} to={m.trip_id ? `/trips/${m.trip_id}` : "/moments"}
                className="group relative block aspect-square overflow-hidden rounded-md bg-muted">
                <img src={m.image_url} alt={m.caption ?? "Memory"} loading="lazy" decoding="async"
                  onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
