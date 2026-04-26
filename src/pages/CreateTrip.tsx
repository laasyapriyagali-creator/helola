import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Users, ImageOff } from "lucide-react";
import { PlaceSearchInput } from "@/components/PlaceSearchInput";
import { getPlaceSummary } from "@/lib/places";

const INTERESTS = ["Beach", "Mountains", "Adventure", "Culture", "Food", "Nightlife", "Wellness", "Wildlife", "Road Trip"];

export default function CreateTrip() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);

  const [destination, setDestination] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [placeBlurb, setPlaceBlurb] = useState<string>("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxMembers, setMaxMembers] = useState(6);
  const [price, setPrice] = useState<number | "">("");
  const [stay, setStay] = useState<number | "">("");
  const [travel, setTravel] = useState<number | "">("");
  const [food, setFood] = useState<number | "">("");
  const [other, setOther] = useState<number | "">("");
  const [chosenInterests, setChosenInterests] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState("");
  const [safetyRules, setSafetyRules] = useState("");

  useEffect(() => { document.title = "Create a trip · HELOLA"; }, []);
  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  async function loadPlaceMeta(name: string) {
    const sum = await getPlaceSummary(name);
    if (sum?.image) setCoverImage(sum.image);
    if (sum?.extract) setPlaceBlurb(sum.extract);
  }

  // Prefill destination from query string (e.g. /trips/new?destination=Goa)
  useEffect(() => {
    const d = params.get("destination");
    if (d && !destination) {
      setDestination(d);
      loadPlaceMeta(d);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const total = Number(stay || 0) + Number(travel || 0) + Number(food || 0) + Number(other || 0);

  useEffect(() => { if (total > 0) setPrice(total); }, [total]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.from("trips").insert({
        creator_id: user.id,
        destination,
        description,
        start_date: startDate,
        end_date: endDate,
        max_members: maxMembers,
        price_per_person: Number(price || 0),
        cost_stay: Number(stay || 0),
        cost_travel: Number(travel || 0),
        cost_food: Number(food || 0),
        cost_other: Number(other || 0),
        interests: chosenInterests,
        cover_image_url: coverImage,
        itinerary: itinerary ? [{ summary: itinerary }] : [],
        important_notes: safetyRules ? { safety_and_rules: safetyRules } : {},
      }).select("id").single();
      if (error) throw error;

      // Auto-add creator as a member
      await supabase.from("trip_members").insert({ trip_id: data.id, user_id: user.id });

      toast({ title: "Trip created!", description: `${destination} is live. Share it with friends.` });
      navigate(`/trips/${data.id}`);
    } catch (err: unknown) {
      toast({ title: "Couldn't create trip", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 pt-4 md:px-8 md:pt-8">
      <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="font-display text-3xl font-bold md:text-4xl">Create a group trip</h1>
      <p className="mt-1 text-sm text-muted-foreground">4 to 20 friendly faces. Share what makes it special.</p>

      <form onSubmit={submit} className="mt-6 max-w-2xl space-y-5">
        <Card className="border-border/60 shadow-soft"><CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <Label>Destination *</Label>
            <Input required value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Goa, Bali, Manali..." />
          </div>
          <div className="space-y-2">
            <Label>What's the vibe?</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beach mornings, sunset shacks, scooter rides..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start *</Label>
              <Input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End *</Label>
              <Input required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>Max members</span>
              <span className="flex items-center gap-1 text-primary"><Users className="h-4 w-4" /> {maxMembers}</span>
            </Label>
            <input type="range" min={2} max={20} value={maxMembers} onChange={(e) => setMaxMembers(Number(e.target.value))} className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-muted-foreground"><span>2</span><span>20</span></div>
          </div>
        </CardContent></Card>

        <Card className="border-border/60 shadow-soft"><CardContent className="space-y-4 p-5">
          <div>
            <h3 className="font-display text-lg font-semibold">Cost breakdown (per person)</h3>
            <p className="text-xs text-muted-foreground">Be transparent — travelers love clarity.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Stay", v: stay, set: setStay },
              { label: "Travel", v: travel, set: setTravel },
              { label: "Food", v: food, set: setFood },
              { label: "Other", v: other, set: setOther },
            ].map(({ label, v, set }) => (
              <div key={label} className="space-y-2">
                <Label>{label} (₹)</Label>
                <Input type="number" min={0} value={v} onChange={(e) => set(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-rose px-4 py-3">
            <span className="text-sm font-medium text-rose-foreground">Total per person</span>
            <span className="font-display text-2xl font-bold text-primary">₹{total.toLocaleString("en-IN")}</span>
          </div>
        </CardContent></Card>

        <Card className="border-border/60 shadow-soft"><CardContent className="space-y-3 p-5">
          <Label>Interests</Label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(i => {
              const on = chosenInterests.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setChosenInterests(on ? chosenInterests.filter(x => x !== i) : [...chosenInterests, i])}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${on ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70 hover:bg-rose"}`}
                >
                  {i}
                </button>
              );
            })}
          </div>
        </CardContent></Card>

        <Button type="submit" disabled={busy} className="h-12 w-full rounded-2xl text-base font-semibold shadow-soft">
          {busy ? "Creating..." : "Create trip"}
        </Button>
      </form>
    </div>
  );
}
