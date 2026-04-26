import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, ExternalLink, Plus, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlaceImages, getPlaceSummary, searchPlaces, type PlaceImage } from "@/lib/places";
import { useAuth } from "@/contexts/AuthContext";

export default function DestinationDetail() {
  const { query = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const decoded = decodeURIComponent(query);
  const [summary, setSummary] = useState<{ extract: string; image?: string } | null>(null);
  const [images, setImages] = useState<PlaceImage[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${decoded} · Real photos & trip info · HELOLA`;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [sum, imgs, geo] = await Promise.all([
        getPlaceSummary(decoded),
        getPlaceImages(decoded, 10),
        searchPlaces(decoded, 1),
      ]);
      if (cancelled) return;
      setSummary(sum ? { extract: sum.extract, image: sum.image } : null);
      // Combine summary image first so the hero matches the place
      const combined: PlaceImage[] = [];
      if (sum?.image) combined.push({ url: sum.image, thumb: sum.image, source: "https://en.wikipedia.org", title: decoded });
      for (const i of imgs) if (!combined.find(c => c.url === i.url)) combined.push(i);
      setImages(combined);
      if (geo[0]) setCoords({ lat: geo[0].lat, lon: geo[0].lon });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [decoded]);

  const hero = images[0];

  return (
    <div className="px-4 pt-4 md:px-8 md:pt-6">
      <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mx-auto max-w-5xl">
        <Card className="overflow-hidden border-border/60 shadow-elegant">
          <div className="relative h-64 bg-muted md:h-96">
            {loading ? <Skeleton className="h-full w-full" /> : hero ? (
              <img src={hero.url} alt={`${decoded} real photograph`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ImageOff className="h-8 w-8" /></div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 md:p-7">
              <h1 className="font-display text-3xl font-bold text-white drop-shadow md:text-5xl">{decoded}</h1>
              {coords && (
                <p className="mt-1 flex items-center gap-1 text-sm text-white/85">
                  <MapPin className="h-4 w-4" /> {coords.lat.toFixed(3)}, {coords.lon.toFixed(3)}
                </p>
              )}
            </div>
          </div>
          <CardContent className="space-y-5 p-5 md:p-7">
            {summary?.extract && (
              <p className="text-sm leading-relaxed text-foreground/85 md:text-base">{summary.extract}</p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate(`/trips/new?destination=${encodeURIComponent(decoded)}`)} disabled={!user} className="rounded-full">
                <Plus className="mr-1 h-4 w-4" /> {user ? "Create a trip here" : "Sign in to create"}
              </Button>
              {coords && (
                <Button asChild variant="outline" className="rounded-full">
                  <a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=12/${coords.lat}/${coords.lon}`}>
                    <ExternalLink className="mr-1 h-4 w-4" /> View on map
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <h2 className="mb-3 mt-8 font-display text-xl font-semibold">Photo gallery</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-32 rounded-2xl md:h-40" />)}
          </div>
        ) : images.length <= 1 ? (
          <p className="text-sm text-muted-foreground">No additional photos found for this place yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {images.slice(1).map((img) => (
              <a key={img.url} href={img.source} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-2xl bg-muted shadow-soft">
                <img src={img.thumb} alt={img.title} loading="lazy" className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-40" />
              </a>
            ))}
          </div>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">Photos via Wikimedia Commons & Wikipedia. Map data © OpenStreetMap contributors.</p>
      </div>
    </div>
  );
}
