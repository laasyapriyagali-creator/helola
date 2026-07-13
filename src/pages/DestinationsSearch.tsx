import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, ImageOff } from "lucide-react";
import { PlaceSearchInput } from "@/components/PlaceSearchInput";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlaceSummary, type PlaceSuggestion } from "@/lib/places";

interface Result extends PlaceSuggestion { image?: string; extract?: string }

export default function DestinationsSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "Search any place · HELOLA"; }, []);

  const onPick = async (p: PlaceSuggestion) => {
    setPicked({ ...p });
    setLoading(true);
    const sum = await getPlaceSummary(p.name);
    setPicked({ ...p, image: sum?.image, extract: sum?.extract });
    setLoading(false);
  };

  return (
    <div className="px-4 pt-4 md:px-8 md:pt-6">
      <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Search any place</h1>
        <p className="mt-1 text-sm text-muted-foreground">Powered by OpenStreetMap. Real photos via Wikipedia.</p>

        <div className="mt-5">
          <PlaceSearchInput value={q} onChange={setQ} onSelect={onPick} placeholder="Try: Hampi, Kyoto, Iceland…" />
        </div>

        {picked && (
          <Card className="mt-6 overflow-hidden border-border/60 shadow-soft">
            <div className="relative h-48 bg-muted md:h-64">
              {loading ? <Skeleton className="h-full w-full" /> : picked.image ? (
                <img src={picked.image} alt={picked.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ImageOff className="h-6 w-6" /></div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4">
                <h2 className="font-display text-2xl font-bold text-white drop-shadow">{picked.name}</h2>
                <p className="flex items-center gap-1 text-xs text-white/85"><MapPin className="h-3 w-3" /> {picked.display_name}</p>
              </div>
            </div>
            <div className="space-y-3 p-4">
              {picked.extract && <p className="line-clamp-4 text-sm text-foreground/85">{picked.extract}</p>}
              <div className="flex flex-wrap gap-2">
                <Link to={`/destinations/${encodeURIComponent(picked.name)}`} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft">
                  See details & photos
                </Link>
                <Link to={`/trips/new?destination=${encodeURIComponent(picked.name)}`} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold">
                  Create a trip here
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
