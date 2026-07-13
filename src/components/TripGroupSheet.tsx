import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { TripImage } from "@/components/TripImage";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, ArrowRight } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tripId: string | null;
}

interface TripInfo {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  cover_image_url: string | null;
  max_members: number;
}

interface Member {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  joined_at?: string | null;
}

export function TripGroupSheet({ open, onOpenChange, tripId }: Props) {
  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !tripId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: t } = await supabase.from("trips")
        .select("id,destination,start_date,end_date,cover_image_url,max_members").eq("id", tripId).maybeSingle();
      const { data: tm } = await supabase.from("trip_members")
        .select("user_id,joined_at").eq("trip_id", tripId);
      const ids = (tm ?? []).map(m => m.user_id);
      let profs: any[] = [];
      if (ids.length) {
        const { data } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", ids);
        profs = data ?? [];
      }
      const byId = new Map(profs.map(p => [p.id, p]));
      const ms: Member[] = (tm ?? []).map(m => {
        const p = byId.get(m.user_id);
        return { user_id: m.user_id, full_name: p?.full_name ?? null, avatar_url: p?.avatar_url ?? null, joined_at: m.joined_at };
      });
      if (!cancelled) {
        setTrip(t as TripInfo);
        setMembers(ms);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, tripId]);

  const dateLabel = trip
    ? `${new Date(trip.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – ${new Date(trip.end_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`
    : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl p-0">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle className="text-left font-display text-xl">Trip details</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-8 pt-3">
          {loading || !trip ? (
            <Skeleton className="h-44 w-full rounded-2xl" />
          ) : (
            <>
              <TripImage destination={trip.destination} coverUrl={trip.cover_image_url} rounded="2xl" className="h-44 w-full" />
              <h2 className="mt-3 font-display text-2xl font-bold uppercase">{trip.destination}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> {dateLabel}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm font-semibold">
                  <Users className="mr-1 inline h-4 w-4 text-primary" />
                  {members.length}/{trip.max_members} members
                </p>
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link to={`/trips/${trip.id}`} onClick={() => onOpenChange(false)}>
                    Open trip <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                {members.map(m => (
                  <Link key={m.user_id} to={`/u/${m.user_id}`} onClick={() => onOpenChange(false)}
                    className="flex w-16 shrink-0 flex-col items-center gap-1 text-center">
                    <UserAvatar url={m.avatar_url} name={m.full_name} size={56} />
                    <span className="line-clamp-1 text-[11px] font-medium">{m.full_name?.split(" ")[0] ?? "Friend"}</span>
                  </Link>
                ))}
              </div>

              <div className="mt-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Joined</h3>
                <div className="space-y-1.5">
                  {members.map(m => (
                    <Link key={m.user_id} to={`/u/${m.user_id}`} onClick={() => onOpenChange(false)}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted">
                      <UserAvatar url={m.avatar_url} name={m.full_name} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{m.full_name ?? "Traveler"}</p>
                        {m.joined_at && (
                          <p className="text-[11px] text-muted-foreground">
                            Joined {new Date(m.joined_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
