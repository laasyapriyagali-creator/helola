import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, MapPin, Users, MessageCircle, Heart, Share2, Phone, Plane, Hotel, Cloud, ListChecks, ShieldAlert, Download, X, IndianRupee, Trash2 } from "lucide-react";

interface Trip {
  id: string;
  destination: string;
  description: string | null;
  start_date: string;
  end_date: string;
  max_members: number;
  price_per_person: number;
  cost_stay: number; cost_travel: number; cost_food: number; cost_other: number;
  interests: string[];
  itinerary: { day: string; plan: string }[] | null;
  stay_details: { hotel?: string; room?: string; checkin?: string; checkout?: string } | null;
  travel_details: { mode?: string; timing?: string; pickup?: string } | null;
  important_notes: { carry?: string; rules?: string; weather?: string } | null;
  coordinator_name: string | null;
  coordinator_contact: string | null;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  creator_id: string;
}

interface Member { user_id: string; full_name: string | null; avatar_url: string | null; is_verified: boolean; }

const DEFAULT_ITINERARY = [
  { day: "Day 1", plan: "Arrival + welcome dinner" },
  { day: "Day 2", plan: "Sightseeing + group activities" },
  { day: "Day 3", plan: "Free day + chill + return" },
];

export default function TripDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: t } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
      if (!t) { setLoading(false); return; }
      setTrip(t as unknown as Trip);
      document.title = `${t.destination} · HELOLA Trips`;

      const { data: tm } = await supabase.from("trip_members").select("user_id").eq("trip_id", id);
      const memberIds = (tm ?? []).map(m => m.user_id);
      if (memberIds.length) {
        const { data: ps } = await supabase.from("profiles").select("id,full_name,avatar_url,is_verified").in("id", memberIds);
        setMembers((ps ?? []).map(p => ({
          user_id: p.id,
          full_name: p.full_name,
          avatar_url: p.avatar_url ?? null,
          is_verified: p.is_verified,
        })));
        if (user) setIsMember(memberIds.includes(user.id));
      } else {
        setMembers([]);
      }

      if (user) {
        const { data: w } = await supabase.from("wishlists").select("id").eq("user_id", user.id).eq("trip_id", id).maybeSingle();
        setInWishlist(!!w);
      }
      setLoading(false);
    })();
  }, [id, user]);

  const join = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!trip) return;
    if (members.length >= trip.max_members) { toast({ title: "This trip is full", variant: "destructive" }); return; }
    const { error } = await supabase.from("trip_members").insert({ trip_id: trip.id, user_id: user.id });
    if (error) { toast({ title: "Couldn't join", description: error.message, variant: "destructive" }); return; }
    toast({ title: "You're in! 🎉", description: "Group chat unlocked." });
    setIsMember(true);
    setMembers([...members, { user_id: user.id, full_name: "You", avatar_url: null, is_verified: false }]);
  };

  const leave = async () => {
    if (!user || !trip) return;
    await supabase.from("trip_members").delete().eq("trip_id", trip.id).eq("user_id", user.id);
    setIsMember(false);
    setMembers(members.filter(m => m.user_id !== user.id));
    toast({ title: "You left the trip" });
  };

  const toggleWishlist = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!trip) return;
    if (inWishlist) {
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("trip_id", trip.id);
    } else {
      await supabase.from("wishlists").insert({ user_id: user.id, trip_id: trip.id });
    }
    setInWishlist(!inWishlist);
  };

  const deleteTrip = async () => {
    if (!user || !trip) return;
    if (!confirm("Delete this trip? This can't be undone.")) return;
    const { error } = await supabase.from("trips").delete().eq("id", trip.id);
    if (error) return toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
    toast({ title: "Trip deleted" });
    navigate("/trips");
  };

  const isCreator = !!user && !!trip && user.id === trip.creator_id;
  const otherMembersCount = members.filter(m => m.user_id !== trip?.creator_id).length;
  const canDelete = isCreator && otherMembersCount === 0;

  if (loading) return <div className="space-y-3 p-4"><Skeleton className="h-48 w-full rounded-2xl" /><Skeleton className="h-32 w-full rounded-2xl" /></div>;
  if (!trip) return <div className="p-10 text-center"><p>Trip not found.</p><Link to="/" className="mt-3 inline-block text-primary underline">Back home</Link></div>;

  const start = new Date(trip.start_date);
  const end = new Date(trip.end_date);
  const dateLabel = `${start.toLocaleDateString("en-IN", { month: "long", day: "numeric" })} – ${end.toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}`;
  const total = Number(trip.cost_stay) + Number(trip.cost_travel) + Number(trip.cost_food) + Number(trip.cost_other);
  const itinerary = (Array.isArray(trip.itinerary) && trip.itinerary.length ? trip.itinerary : DEFAULT_ITINERARY);

  return (
    <div className="pb-8">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden bg-gradient-warm md:h-72 md:rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-primary/40 to-primary/70" />
        <button onClick={() => navigate(-1)} className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-soft backdrop-blur">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button onClick={toggleWishlist} className="absolute right-16 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-soft backdrop-blur">
          <Heart className={`h-4 w-4 ${inWishlist ? "fill-primary text-primary" : ""}`} />
        </button>
        <button onClick={() => navigator.share?.({ title: `${trip.destination} trip`, url: window.location.href }).catch(()=>{})} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-soft backdrop-blur">
          <Share2 className="h-4 w-4" />
        </button>
        <div className="absolute bottom-5 left-5 right-5 text-primary-foreground">
          <Badge className="rounded-full bg-background/20 text-primary-foreground backdrop-blur">{trip.status}</Badge>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight md:text-5xl">{trip.destination}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{dateLabel}</span>
            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{members.length}/{trip.max_members}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-6 md:px-8">
        {/* Action bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {isMember ? (
            <>
              <Button asChild className="flex-1 rounded-full"><Link to={`/chats/${trip.id}`}><MessageCircle className="mr-1 h-4 w-4" />Group chat</Link></Button>
              <Button variant="outline" onClick={leave} className="rounded-full"><X className="mr-1 h-4 w-4" />Leave</Button>
            </>
          ) : (
            <Button onClick={join} disabled={members.length >= trip.max_members} className="flex-1 rounded-full">
              {members.length >= trip.max_members ? "Trip is full" : "Join this trip"}
            </Button>
          )}
          {canDelete && (
            <Button onClick={deleteTrip} variant="outline" className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Trash2 className="mr-1 h-4 w-4" />Delete trip
            </Button>
          )}
        </div>
        {isCreator && otherMembersCount > 0 && (
          <p className="mb-4 text-xs text-muted-foreground">You can delete this trip once everyone else has left.</p>
        )}

        {trip.description && <p className="mb-6 text-base leading-relaxed text-foreground/80">{trip.description}</p>}

        {/* Members */}
        <Section title="Members" icon={<Users className="h-4 w-4" />}>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No one has joined yet — be first!</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {members.map(m => (
                <Link key={m.user_id} to={`/u/${m.user_id}`} className="group flex flex-col items-center gap-1.5">
                  <div className="relative">
                    <UserAvatar url={m.avatar_url} name={m.full_name} size={56} />
                    {m.is_verified && <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground ring-2 ring-background">✓</span>}
                  </div>
                  <span className="max-w-[64px] truncate text-xs text-foreground/70 group-hover:text-foreground">{m.full_name?.split(" ")[0] ?? "Friend"}</span>
                </Link>
              ))}
            </div>
          )}
        </Section>

        {/* Cost breakdown */}
        <Section title="Cost breakdown" icon={<IndianRupee className="h-4 w-4" />}>
          <div className="space-y-2">
            {[
              ["Stay", trip.cost_stay], ["Travel", trip.cost_travel],
              ["Food", trip.cost_food], ["Other", trip.cost_other],
            ].map(([label, v]) => (
              <div key={label as string} className="flex items-center justify-between border-b border-dashed border-border py-1.5 text-sm">
                <span className="text-foreground/70">{label}</span>
                <span className="font-medium">₹{Number(v).toLocaleString("en-IN")}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="font-semibold">Total per person</span>
              <span className="font-display text-2xl font-bold text-primary">₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </Section>

        {/* Important notes */}
        <Section title="Important notes" icon={<ShieldAlert className="h-4 w-4" />}>
          <div className="grid gap-2 sm:grid-cols-3">
            <NoteCard icon={<ListChecks className="h-4 w-4" />} title="Things to carry" text={trip.important_notes?.carry || "Light clothes, ID, sunscreen, basic meds, charger."} />
            <NoteCard icon={<ShieldAlert className="h-4 w-4" />} title="Group rules" text={trip.important_notes?.rules || "Be on time. Respect everyone. Keep phones away during activities."} />
            <NoteCard icon={<Cloud className="h-4 w-4" />} title="Weather" text={trip.important_notes?.weather || "Check forecast 2 days before departure."} />
          </div>
        </Section>

        {/* Itinerary */}
        <Section title="Itinerary" icon={<Calendar className="h-4 w-4" />}>
          <ol className="space-y-3">
            {itinerary.map((d, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-card p-3 shadow-soft">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i + 1}</div>
                <div>
                  <p className="font-semibold">{d.day}</p>
                  <p className="text-sm text-muted-foreground">{d.plan}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* Stay */}
        <Section title="Stay details" icon={<Hotel className="h-4 w-4" />}>
          <KV k="Hotel" v={trip.stay_details?.hotel ?? "To be confirmed"} />
          <KV k="Room" v={trip.stay_details?.room ?? "Twin sharing"} />
          <KV k="Check-in" v={trip.stay_details?.checkin ?? start.toLocaleDateString("en-IN")} />
          <KV k="Check-out" v={trip.stay_details?.checkout ?? end.toLocaleDateString("en-IN")} />
        </Section>

        {/* Travel */}
        <Section title="Travel details" icon={<Plane className="h-4 w-4" />}>
          <KV k="Mode" v={trip.travel_details?.mode ?? "Flight / Train"} />
          <KV k="Timing" v={trip.travel_details?.timing ?? "Shared in group chat"} />
          <KV k="Pickup" v={trip.travel_details?.pickup ?? "Airport"} />
        </Section>

        {/* Coordinator */}
        <Section title="Trip coordinator" icon={<MapPin className="h-4 w-4" />}>
          <div className="flex items-center justify-between rounded-xl bg-card p-3 shadow-soft">
            <div>
              <p className="font-semibold">{trip.coordinator_name ?? "HELOLA Support"}</p>
              <p className="text-xs text-muted-foreground">Available 24/7 during the trip</p>
            </div>
            {trip.coordinator_contact && (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <a href={`tel:${trip.coordinator_contact}`}><Phone className="mr-1 h-3.5 w-3.5" />Call</a>
              </Button>
            )}
          </div>
        </Section>

        {/* Bottom actions */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Button variant="outline" className="rounded-xl"><Download className="mr-1 h-4 w-4" />Itinerary PDF</Button>
          <Button variant="outline" className="rounded-xl" onClick={() => navigator.share?.({ url: window.location.href }).catch(()=>{})}><Share2 className="mr-1 h-4 w-4" />Share</Button>
          {isMember ? (
            <Button variant="outline" className="rounded-xl col-span-2 md:col-span-1" asChild>
              <Link to={`/chats/${trip.id}`}><MessageCircle className="mr-1 h-4 w-4" />Chat</Link>
            </Button>
          ) : (
            <Button onClick={join} className="rounded-xl col-span-2 md:col-span-1">Join trip</Button>
          )}
          {isMember && <Button variant="ghost" className="rounded-xl text-destructive" onClick={leave}>Cancel</Button>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold text-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose text-rose-foreground">{icon}</span>
        {title}
      </h2>
      <Card className="border-border/60 shadow-soft"><CardContent className="p-4">{children}</CardContent></Card>
    </section>
  );
}
function KV({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between border-b border-dashed border-border py-1.5 text-sm last:border-0"><span className="text-foreground/70">{k}</span><span className="text-right font-medium">{v}</span></div>;
}
function NoteCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl bg-rose p-3 text-rose-foreground">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-80">{icon}{title}</div>
      <p className="mt-1 text-sm">{text}</p>
    </div>
  );
}
