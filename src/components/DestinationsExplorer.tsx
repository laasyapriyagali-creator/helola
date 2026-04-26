import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ImageOff } from "lucide-react";
import { FEATURED_DESTINATIONS, getPlaceSummary } from "@/lib/places";

interface DestCard {
  name: string;
  query: string;
  region: string;
  tagline: string;
  image?: string;
  extract?: string;
}

export function DestinationsExplorer() {
  const [items, setItems] = useState<DestCard[]>(FEATURED_DESTINATIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const enriched = await Promise.all(
        FEATURED_DESTINATIONS.map(async (d) => {
          const sum = await getPlaceSummary(d.query);
          return { ...d, image: sum?.image, extract: sum?.extract };
        }),
      );
      if (!cancelled) { setItems(enriched); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="mx-auto mt-10 max-w-5xl">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Real destinations</h2>
          <p className="text-xs text-muted-foreground">Live photos & info from Wikipedia · OpenStreetMap</p>
        </div>
        <Link to="/destinations/search" className="text-xs font-semibold text-primary hover:underline">Search any place →</Link>
      </div>

      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 no-scrollbar md:mx-0 md:px-0">
        {items.map((d) => (
          <Link key={d.query} to={`/destinations/${encodeURIComponent(d.query)}`} className="group shrink-0 basis-64 md:basis-72">
            <Card className="overflow-hidden border-border/60 shadow-soft transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-elegant">
              <div className="relative h-40 bg-muted">
                {loading && !d.image ? (
                  <Skeleton className="h-full w-full" />
                ) : d.image ? (
                  <img
                    src={d.image}
                    alt={`${d.name} — real photograph`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ImageOff className="h-6 w-6" /></div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <h3 className="font-display text-lg font-bold text-white drop-shadow">{d.name}</h3>
                  <p className="flex items-center gap-1 text-xs text-white/85"><MapPin className="h-3 w-3" /> {d.region}</p>
                </div>
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-xs text-muted-foreground">{d.extract || d.tagline}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
