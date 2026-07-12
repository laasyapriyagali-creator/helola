import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPin, Calendar, Users, Sparkles, TrendingUp, Plane, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DestinationsExplorer } from "@/components/DestinationsExplorer";
import { TripImage } from "@/components/TripImage";
import { PremiumInviteCard } from "@/components/premium/PremiumInviteCard";
import { PlaceSearchInput } from "@/components/PlaceSearchInput";
import type { PlaceSuggestion } from "@/lib/places";
import helolaMapHeader from "@/assets/helola-map-header.png.asset.json";
import { formatPriceFromINR } from "@/lib/i18n";

interface Trip {
  id: string;
  destination: string;
  description: string | null;
  start_date: string;
  end_date: string;
  max_members: number;
  price_per_person: number;
  interests: string[];
  creator_id: string;
}

interface RankedTrip extends Trip {
  memberCount: number;
  seatsLeft: number;
  isFull: boolean;
  destinationScore: number;
  overlapDays: number;
  score: number;
}

function normalizeDest(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function destinationScore(tripDest: string, queryTokens: string[], queryName?: string): number {
  if (!queryTokens.length) return 0;
  if (queryName && tripDest.toLowerCase().includes(queryName.toLowerCase())) return 1;
  const tripTokens = new Set(normalizeDest(tripDest));
  let hits = 0;
  for (const t of queryTokens) if (tripTokens.has(t)) hits++;
  return hits / queryTokens.length;
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(ms / 86_400_000) + 1);
}

function overlapDays(aStart: string, aEnd: string, bStart?: string, bEnd?: string): number {
  if (!bStart || !bEnd) return 0;
  const s = aStart > bStart ? aStart : bStart;
  const e = aEnd < bEnd ? aEnd : bEnd;
  if (s > e) return 0;
  return daysBetween(s, e);
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [destText, setDestText] = useState("");
  const [destPick, setDestPick] = useState<PlaceSuggestion | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");


  const [trips, setTrips] = useState<Trip[]>([]);
  const [members, setMembers] = useState<Record<string, number>>({});
  const [creators, setCreators] = useState<Record<string, { full_name: string | null; avatar_url: string | null }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "HELOLA Trips · Find trips to any destination";
    if (params.get("focus") === "search") {
      (document.querySelector("#dest-search-input input") as HTMLInputElement | null)?.focus();
    }
  }, [params]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const todayIso = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("trips")
        .select("id,destination,description,start_date,end_date,max_members,price_per_person,interests,creator_id,status")
        .gte("end_date", todayIso)
        .in("status", ["upcoming", "ongoing"])
        .order("start_date", { ascending: true });
      if (error) { console.error(error); setLoading(false); return; }
      const raw = (data ?? []) as (Trip & { status?: string })[];

      const counts: Record<string, number> = {};
      if (raw.length) {
        const ids = raw.map(t => t.id);
        const { data: ms } = await supabase.from("trip_members").select("trip_id").in("trip_id", ids);
        (ms ?? []).forEach(m => { counts[m.trip_id] = (counts[m.trip_id] || 0) + 1; });
      }
      setMembers(counts);
      setTrips(raw as Trip[]);

      if (raw.length) {
        const creatorIds = Array.from(new Set(raw.map(t => t.creator_id)));
        const { data: ps } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", creatorIds);
        const map: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
        (ps ?? []).forEach(p => { map[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url ?? null }; });
        setCreators(map);
      }
      setLoading(false);
    })();
  }, []);

  const hasDestFilter = !!(destPick?.name || destText.trim());
  const hasDateFilter = !!(startDate && endDate);

  const ranked: RankedTrip[] = useMemo(() => {
    const queryName = destPick?.name || destText.trim();
    const queryTokens = queryName ? normalizeDest(queryName) : [];

    const out: RankedTrip[] = trips.map((t) => {
      const memberCount = members[t.id] || 0;
      const seatsLeft = Math.max(0, t.max_members - memberCount);
      const isFull = seatsLeft === 0;
      const destScore = queryTokens.length ? destinationScore(t.destination, queryTokens, queryName) : 1;
      const overlap = hasDateFilter ? overlapDays(t.start_date, t.end_date, startDate, endDate) : 1;
      const score =
        destScore * 100 +
        Math.min(overlap, 14) * 4 +
        (isFull ? 0 : 6) +
        seatsLeft * 0.5;
      return { ...t, memberCount, seatsLeft, isFull, destinationScore: destScore, overlapDays: overlap, score };
    });

    const filtered = out.filter((t) => {
      if (hasDestFilter && t.destinationScore <= 0) return false;
      if (hasDateFilter && t.overlapDays <= 0) return false;
      return true;
    });

    filtered.sort((a, b) => b.score - a.score || a.start_date.localeCompare(b.start_date));
    return filtered;
  }, [trips, members, destPick, destText, startDate, endDate, hasDestFilter, hasDateFilter]);


  const clearFilters = () => { setDestPick(null); setDestText(""); setStartDate(""); setEndDate(""); };
  const filtersActive = hasDestFilter || hasDateFilter;
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-texture-paper">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-12 md:py-20">
        <img
          src={helolaMapHeader.url}
          alt="Illustrated travel map of Helola Trips destinations across Europe and Asia"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          width={1920}
          height={768}
        />
        <div className="absolute inset-0 bg-primary/35" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/55 to-transparent" />
        <div className="relative mx-auto flex max-w-3xl items-center justify-center text-center">
          <h1
            className="font-handwritten text-6xl leading-none tracking-normal text-primary-foreground md:text-8xl"
            style={{ textShadow: "0 3px 18px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.35)" }}
          >
            helola
          </h1>
        </div>
      </section>

      <div className="px-4 md:px-8">
        {/* Discovery panel — destination + dates */}
        <div className="relative -mt-9 md:-mt-12">
          <div className="mx-auto max-w-3xl">
            <Card className="border-border/60 shadow-elegant">
              <CardContent className="grid grid-cols-1 gap-3 p-3 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end md:p-4">
                <div id="dest-search-input" className="min-w-0">
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Where to?</label>
                  <PlaceSearchInput
                    value={destText}
                    onChange={(v) => { setDestText(v); if (!v) setDestPick(null); }}
                    onSelect={(p) => { setDestPick(p); setDestText(p.name); }}
                    selectedKind={destPick?.kind}
                    placeholder="Any city, island or landmark…"
                  />
                </div>
                <div>
                  <label htmlFor="start-date" className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">From</label>
                  <input
                    id="start-date"
                    type="date"
                    min={todayIso}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate && e.target.value && endDate < e.target.value) setEndDate(e.target.value);
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">To</label>
                  <input
                    id="end-date"
                    type="date"
                    min={startDate || todayIso}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
                {filtersActive && (
                  <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="justify-self-end md:h-10" aria-label="Clear filters">
                    <X className="mr-1 h-4 w-4" /> Clear
                  </Button>
                )}
              </CardContent>
            </Card>
            <p className="mt-2 pl-1 text-[11px] text-muted-foreground">
              Trips matching your destination and overlapping dates rank first. Full trips sink to the bottom.
            </p>
          </div>
        </div>

        {/* Create trip CTA */}
        <div className="mx-auto mt-4 max-w-3xl">
          <Button
            onClick={() => navigate(user ? "/trips/new" : "/auth")}
            className="h-14 w-full rounded-full text-base font-semibold shadow-soft"
          >
            <Plus className="mr-1.5 h-5 w-5" /> Create a group for trips
          </Button>
        </div>

        <div className="mx-auto mt-5 max-w-3xl">
          <PremiumInviteCard variant="home" />
        </div>


        <div className="mx-auto mt-6 max-w-5xl">
          <BookTicketsCard />
        </div>

        <DestinationsExplorer />

        {/* Trip list */}
        <div className="mx-auto mt-8 max-w-5xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {hasDestFilter ? `Trips to ${destPick?.name || destText}` : "Explore trips"}
            </h2>
            <span className="text-xs text-muted-foreground">
              <TrendingUp className="mr-1 inline h-3 w-3" />{ranked.length} match{ranked.length === 1 ? "" : "es"}
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-44 rounded-3xl" />)}
            </div>
          ) : ranked.length === 0 ? (
            <EmptyState
              onCreate={() => navigate(user ? `/trips/new${destPick ? `?destination=${encodeURIComponent(destPick.name)}` : ""}` : "/auth")}
              destination={destPick?.name || destText.trim()}
            />
          ) : (
            <div className="space-y-4">
              {ranked.map(t => (
                <TripCard key={t.id} trip={t} creator={creators[t.creator_id]} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TripCard({ trip, creator }: {
  trip: RankedTrip;
  creator?: { full_name: string | null; avatar_url: string | null };
}) {
  const start = new Date(trip.start_date);
  const end = new Date(trip.end_date);
  const dateLabel = `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  return (
    <Card className={`overflow-hidden border-border/60 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elegant ${trip.isFull ? "opacity-75" : ""}`}>
      <Link to={`/trips/${trip.id}`} className="block">
        <div className="relative h-44 overflow-hidden md:h-56">
          <TripImage destination={trip.destination} className="absolute inset-0 h-full w-full" rounded="lg" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
          <div className="absolute left-4 top-3 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-soft">
            <Calendar className="h-3 w-3 text-primary" /> {dateLabel}
          </div>
          {trip.isFull ? (
            <div className="absolute right-3 top-3 rounded-full bg-destructive px-3 py-1 text-xs font-bold uppercase tracking-wider text-destructive-foreground shadow-soft">
              Full
            </div>
          ) : (trip.interests || [])[0] && (
            <div className="absolute right-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-soft">
              {trip.interests[0]}
            </div>
          )}
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="font-sans text-2xl font-semibold tracking-tight text-white drop-shadow-md md:text-3xl">
              {trip.destination}
            </h3>
          </div>
        </div>
      </Link>

      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild size="sm" className="rounded-full px-5 font-semibold" disabled={trip.isFull}>
            <Link to={`/trips/${trip.id}`} aria-disabled={trip.isFull}>{trip.isFull ? "Full" : "JOIN"}</Link>
          </Button>
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${trip.isFull ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"}`}>
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            <span aria-label={`${trip.memberCount} of ${trip.max_members} joined`}>
              {trip.memberCount}/{trip.max_members} joined
            </span>
          </div>
          <div className="hidden items-center gap-1.5 sm:flex">
            <UserAvatar url={creator?.avatar_url} name={creator?.full_name} size={24} />
            <span className="truncate text-xs text-muted-foreground">by {creator?.full_name?.split(" ")[0] ?? "HELOLA"}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-xl font-bold text-primary md:text-2xl">{formatPriceFromINR(Number(trip.price_per_person))}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">per person</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BookTicketsCard() {
  const apps = [
    { name: "MakeMyTrip", color: "bg-red-500" },
    { name: "Goibibo", color: "bg-orange-500" },
    { name: "ixigo", color: "bg-amber-500" },
    { name: "Yatra", color: "bg-rose-500" },
    { name: "EaseMyTrip", color: "bg-blue-500" },
    { name: "Cleartrip", color: "bg-primary" },
  ];
  return (
    <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-elegant">
      <CardContent className="p-5 md:p-7">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary-foreground/70">
          <Sparkles className="h-3.5 w-3.5" /> Smart price compare
        </div>
        <h3 className="mt-2 font-display text-2xl font-bold leading-tight md:text-3xl">Book travel tickets at the best price</h3>
        <p className="mt-1 text-sm text-primary-foreground/80">Compare validated routes, realistic fare ranges, and book via trusted travel apps.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {apps.map(a => (
            <span key={a.name} className="rounded-full bg-background/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">{a.name}</span>
          ))}
        </div>
        <Button asChild variant="secondary" className="mt-5 rounded-full bg-background text-primary hover:bg-background/90">
          <Link to="/book-tickets"><Plane className="mr-1 h-4 w-4" /> Compare prices</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({ onCreate, destination }: { onCreate: () => void; destination?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-3 font-display text-xl font-semibold">
        {destination ? `No trips to ${destination} yet` : "No trips match yet"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">Be the first — create a trip and invite people to join.</p>
      <Button onClick={onCreate} className="mt-5 rounded-full">Create a trip</Button>
    </div>
  );
}
