import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, CheckCircle2, Plus, Plane, ChevronRight, MapPin } from "lucide-react";
import { TripRouteMap } from "@/components/TripRouteMap";
import { computeLiveStatus, type LiveStatus } from "@/lib/tripStatus";

interface MyTrip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  max_members: number;
  status: LiveStatus;
  travel_details: { pickup?: string } | null;
}

export default function MyTrips() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<MyTrip[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "My Trips · HELOLA"; }, []);
  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: tm } = await supabase.from("trip_members").select("trip_id").eq("user_id", user.id);
      const ids = (tm ?? []).map(m => m.trip_id);
      if (ids.length === 0) { setTrips([]); setLoading(false); return; }
      const { data: ts } = await supabase.from("trips")
        .select("id,destination,start_date,end_date,max_members,status,travel_details")
        .in("id", ids).order("start_date");
      setTrips((ts ?? []) as unknown as MyTrip[]);

      const { data: allM } = await supabase.from("trip_members").select("trip_id").in("trip_id", ids);
      const c: Record<string, number> = {};
      (allM ?? []).forEach(m => { c[m.trip_id] = (c[m.trip_id] || 0) + 1; });
      setCounts(c);
      setLoading(false);
    })();
  }, [user]);

  const withStatus = trips.map(t => ({ ...t, live: computeLiveStatus(t) }));
  const upcoming = withStatus.filter(t => t.live === "upcoming" || t.live === "ongoing");
  const completed = withStatus.filter(t => t.live === "completed");
  const nextTrip = upcoming[0];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-4 pt-6 pb-28 md:px-8 md:pt-10">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Your adventures</p>
        <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">My Trips</h1>
      </div>

      {loading ? (
        <div className="space-y-3"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>
      ) : trips.length === 0 ? (
        <EmptyState onCreate={() => navigate("/trips/new")} />
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <SectionHeading label="Upcoming" count={upcoming.length} />
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map(t => <TripRow key={t.id} t={t} count={counts[t.id] || 0} />)}
              </div>
            </section>
          )}
          {completed.length > 0 && (
            <section>
              <SectionHeading label="Completed" count={completed.length} />
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {completed.map(t => <TripRow key={t.id} t={t} count={counts[t.id] || 0} done />)}
              </div>
            </section>
          )}

          {nextTrip && (
            <section className="pt-2">
              <TripRouteMap
                from={nextTrip.travel_details?.pickup?.trim() || "Your city"}
                to={nextTrip.destination}
                onClick={() => navigate(`/trips/${nextTrip.id}`)}
              />
            </section>
          )}
        </div>
      )}

      {/* Floating + button */}
      <button
        aria-label="New trip"
        onClick={() => navigate("/trips/new")}
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elegant transition-all hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}

function SectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <div className="mb-3 flex items-baseline gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</h2>
      <span className="text-xs text-muted-foreground/70">• {count} {count === 1 ? "trip" : "trips"}</span>
    </div>
  );
}

function daysUntil(date: string): number {
  const now = new Date(); now.setHours(0,0,0,0);
  const d = new Date(date); d.setHours(0,0,0,0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function statusBadge(s: LiveStatus) {
  switch (s) {
    case "upcoming": return { dot: "bg-emerald-500", label: "Confirmed", cls: "text-emerald-700 bg-emerald-50" };
    case "ongoing": return { dot: "bg-sky-500", label: "Ongoing", cls: "text-sky-700 bg-sky-50" };
    case "completed": return { dot: "bg-muted-foreground", label: "Completed", cls: "text-muted-foreground bg-muted" };
    case "cancelled": return { dot: "bg-destructive", label: "Cancelled", cls: "text-destructive bg-destructive/10" };
  }
}

function TripRow({ t, count, done }: { t: MyTrip & { live: LiveStatus }; count: number; done?: boolean }) {
  const start = new Date(t.start_date);
  const days = daysUntil(t.start_date);
  const badge = statusBadge(t.live);
  const countdown = t.live === "upcoming"
    ? (days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days left`)
    : null;

  return (
    <Link to={`/trips/${t.id}`} className="block">
      <Card className="overflow-hidden border-border/60 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${done ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"}`}>
            {done ? <CheckCircle2 className="h-6 w-6" /> : (
              <>
                <span className="text-[10px] font-semibold uppercase tracking-wide">{start.toLocaleDateString(undefined, { month: "short" })}</span>
                <span className="font-display text-2xl font-bold leading-none">{start.getDate()}</span>
              </>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <p className="truncate font-display text-lg font-bold leading-tight">{t.destination}</p>
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {start.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} /> {badge.label}
              </span>
              {countdown && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <Plane className="h-3 w-3" /> {countdown}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                <Users className="h-3 w-3" /> {count}/{t.max_members}
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <div className="relative mx-auto mb-4 h-24 w-24">
        <div className="absolute inset-0 rounded-full bg-primary/10" />
        <div className="absolute inset-3 rounded-full bg-primary/15" />
        <Plane className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 -rotate-12 text-primary" fill="currentColor" />
      </div>
      <h3 className="font-display text-xl font-semibold">No adventures planned yet</h3>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">Your next story starts with a single step. Create your first trip.</p>
      <Button onClick={onCreate} className="mt-5 rounded-full px-6">
        <Plus className="mr-1 h-4 w-4" /> Create your first trip
      </Button>
    </div>
  );
}
