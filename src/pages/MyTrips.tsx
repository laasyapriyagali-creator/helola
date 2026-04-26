import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, CheckCircle2, Plus, Plane } from "lucide-react";

interface MyTrip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  max_members: number;
  status: string;
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
      const { data: ts } = await supabase.from("trips").select("id,destination,start_date,end_date,max_members,status").in("id", ids).order("start_date");
      setTrips((ts ?? []) as MyTrip[]);

      const { data: allM } = await supabase.from("trip_members").select("trip_id").in("trip_id", ids);
      const c: Record<string, number> = {};
      (allM ?? []).forEach(m => { c[m.trip_id] = (c[m.trip_id] || 0) + 1; });
      setCounts(c);
      setLoading(false);
    })();
  }, [user]);

  const upcoming = trips.filter(t => t.status === "upcoming" || t.status === "ongoing");
  const completed = trips.filter(t => t.status === "completed");

  return (
    <div className="px-4 pt-6 md:px-8 md:pt-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Your adventures</p>
          <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">My Trips</h1>
        </div>
        <Button onClick={() => navigate("/trips/new")} className="rounded-full"><Plus className="mr-1 h-4 w-4" />New trip</Button>
      </div>

      {loading ? (
        <div className="space-y-3"><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>
      ) : trips.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <Plane className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 font-display text-xl font-semibold">No trips yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Browse trips on the home tab or create your own.</p>
          <Button asChild className="mt-5 rounded-full"><Link to="/">Discover trips</Link></Button>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map(t => <TripRow key={t.id} t={t} count={counts[t.id] || 0} />)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {completed.map(t => <TripRow key={t.id} t={t} count={counts[t.id] || 0} done />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TripRow({ t, count, done }: { t: MyTrip; count: number; done?: boolean }) {
  const start = new Date(t.start_date);
  return (
    <Link to={`/trips/${t.id}`}>
      <Card className="overflow-hidden border-border/60 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl ${done ? "bg-success text-success-foreground" : "bg-gradient-warm text-primary-foreground"}`}>
            {done ? <CheckCircle2 className="h-6 w-6" /> : (
              <>
                <span className="text-[10px] font-semibold uppercase">{start.toLocaleDateString("en-IN", { month: "short" })}</span>
                <span className="font-display text-xl font-bold leading-none">{start.getDate()}</span>
              </>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold">{t.destination}</p>
            <p className="text-xs text-muted-foreground"><Calendar className="mr-1 inline h-3 w-3" />{start.toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <Badge variant="secondary" className="rounded-full"><Users className="mr-1 h-3 w-3" />{count}/{t.max_members}</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
