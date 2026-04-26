import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar2D } from "@/components/Avatar2D";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MapPin, Calendar, Users, IndianRupee, Sparkles, TrendingUp, Plane } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AvatarConfig } from "@/lib/avatar";

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

const INTERESTS = ["Beach", "Mountains", "Adventure", "Culture", "Food", "Nightlife", "Wellness", "Wildlife", "Road Trip"];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeInterest, setActiveInterest] = useState<string>("All");
  const [maxBudget, setMaxBudget] = useState<number>(50000);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [members, setMembers] = useState<Record<string, number>>({});
  const [creators, setCreators] = useState<Record<string, { full_name: string | null; avatar_config: Partial<AvatarConfig> | null }>>({});
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    document.title = "HELOLA Trips · Real trips, real friends";
    if (params.get("focus") === "search") {
      document.getElementById("search-input")?.focus();
    }
  }, [params]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfileName(data?.full_name ?? null));
  }, [user]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("trips")
        .select("id,destination,description,start_date,end_date,max_members,price_per_person,interests,creator_id")
        .order("start_date", { ascending: true });
      if (error) { console.error(error); setLoading(false); return; }
      const list = (data ?? []) as Trip[];
      setTrips(list);

      // Member counts
      if (list.length) {
        const ids = list.map(t => t.id);
        const { data: ms } = await supabase.from("trip_members").select("trip_id").in("trip_id", ids);
        const counts: Record<string, number> = {};
        (ms ?? []).forEach(m => { counts[m.trip_id] = (counts[m.trip_id] || 0) + 1; });
        setMembers(counts);

        // Creator profiles
        const creatorIds = Array.from(new Set(list.map(t => t.creator_id)));
        const { data: ps } = await supabase.from("profiles").select("id,full_name,avatar_config").in("id", creatorIds);
        const map: Record<string, { full_name: string | null; avatar_config: Partial<AvatarConfig> | null }> = {};
        (ps ?? []).forEach(p => { map[p.id] = { full_name: p.full_name, avatar_config: (p.avatar_config as Partial<AvatarConfig>) || null }; });
        setCreators(map);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return trips.filter(t => {
      if (search && !t.destination.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeInterest !== "All" && !(t.interests || []).includes(activeInterest)) return false;
      if (Number(t.price_per_person) > maxBudget) return false;
      return true;
    });
  }, [trips, search, activeInterest, maxBudget]);

  return (
    <div>
      {/* Burgundy hero band with centered wordmark */}
      <section className="relative bg-primary px-4 pb-8 pt-10 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary-foreground/60">
            {user ? `Hi ${profileName?.split(" ")[0] ?? "there"} 👋` : "Welcome"}
          </p>
          <h1
            className="mt-3 text-5xl font-semibold tracking-tight text-primary-foreground md:text-7xl"
            style={{ fontFamily: '-apple-system, "SF Pro Display", "SF Pro", BlinkMacSystemFont, "Helvetica Neue", sans-serif', letterSpacing: '-0.04em' }}
          >
            helola<span className="text-accent">.</span>
          </h1>
          <p className="mt-3 text-sm text-primary-foreground/70 md:text-base">
            Real trips. Real friends. Find your next group adventure.
          </p>
        </div>
      </section>

      <div className="px-4 md:px-8">
        {/* Search bar (overlapping the band) */}
        <div className="relative -mt-6 md:-mt-8">
          <div className="mx-auto max-w-3xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Explore places, cities etc"
                className="h-14 rounded-full border-border bg-card pl-12 pr-5 text-base shadow-elegant"
              />
            </div>
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

        {/* Filters */}
        <div className="mx-auto mt-5 max-w-5xl space-y-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {["All", ...INTERESTS].map(i => (
              <button
                key={i}
                onClick={() => setActiveInterest(i)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeInterest === i ? "bg-primary text-primary-foreground shadow-soft" : "bg-card text-foreground/70 hover:bg-muted"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-soft">
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Up to ₹{maxBudget.toLocaleString("en-IN")}</span>
            <input type="range" min={2000} max={100000} step={1000} value={maxBudget} onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="ml-auto flex-1 max-w-[60%] accent-primary" />
          </div>
        </div>

        {/* Book travel tickets card */}
        <div className="mx-auto mt-6 max-w-5xl">
          <BookTicketsCard />
        </div>

        {/* Trips list — wide rectangular boxes */}
        <div className="mx-auto mt-8 max-w-5xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Explore trips
            </h2>
            <span className="text-xs text-muted-foreground">
              <TrendingUp className="mr-1 inline h-3 w-3" />{filtered.length} active
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-44 rounded-3xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onCreate={() => navigate(user ? "/trips/new" : "/auth")} />
          ) : (
            <div className="space-y-4">
              {filtered.map(t => (
                <TripCard key={t.id} trip={t} memberCount={members[t.id] || 0} creator={creators[t.creator_id]} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TripCard({ trip, memberCount, creator }: {
  trip: Trip;
  memberCount: number;
  creator?: { full_name: string | null; avatar_config: Partial<AvatarConfig> | null };
}) {
  const start = new Date(trip.start_date);
  const end = new Date(trip.end_date);
  const dateLabel = `${start.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`;
  const isFull = memberCount >= trip.max_members;

  return (
    <Link to={`/trips/${trip.id}`} className="group block">
      <Card className="overflow-hidden border-border/60 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
        <div className="relative h-40 bg-gradient-warm">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/20 to-accent/30" />
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-xs font-semibold shadow-soft">
            <Users className="h-3 w-3 text-primary" /> {memberCount}/{trip.max_members}
          </div>
          <div className="absolute bottom-3 left-4">
            <h3 className="font-display text-2xl font-bold text-primary-foreground drop-shadow">{trip.destination}</h3>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-primary-foreground/90">
              <Calendar className="h-3 w-3" /> {dateLabel}
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {trip.description || `Group trip to ${trip.destination}`}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Avatar2D config={creator?.avatar_config} size={28} />
                <span className="truncate text-xs text-foreground/70">by {creator?.full_name ?? "HELOLA"}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-primary">₹{Number(trip.price_per_person).toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted-foreground">per person</p>
            </div>
          </div>
          {(trip.interests || []).slice(0, 3).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(trip.interests || []).slice(0, 3).map(i => (
                <Badge key={i} variant="secondary" className="rounded-full bg-rose text-rose-foreground hover:bg-rose">{i}</Badge>
              ))}
              {isFull && <Badge variant="outline" className="rounded-full">Full</Badge>}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function BookTicketsCard() {
  const apps = [
    { name: "MakeMyTrip", color: "bg-red-500" },
    { name: "Goibibo", color: "bg-orange-500" },
    { name: "ixigo", color: "bg-amber-500" },
    { name: "Yatra", color: "bg-rose-500" },
    { name: "EaseMyTrip", color: "bg-blue-500" },
  ];
  return (
    <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-elegant">
      <CardContent className="p-5 md:p-7">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary-foreground/70">
          <Sparkles className="h-3.5 w-3.5" /> Smart price compare
        </div>
        <h3 className="mt-2 font-display text-2xl font-bold leading-tight md:text-3xl">Book travel tickets at the best price</h3>
        <p className="mt-1 text-sm text-primary-foreground/80">We compare MakeMyTrip, Goibibo, ixigo, Yatra & more — book the cheapest in one tap.</p>
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-3 font-display text-xl font-semibold">No trips match yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Be the first — create a trip and invite people to join.</p>
      <Button onClick={onCreate} className="mt-5 rounded-full">Create a trip</Button>
    </div>
  );
}
