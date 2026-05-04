import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, ExternalLink, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [showFull, setShowFull] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    document.title = `${decoded} · Real photos & trip info · HELOLA`;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [sum, imgs, geo] = await Promise.all([
        getPlaceSummary(decoded),
        getPlaceImages(decoded, 12),
        searchPlaces(decoded, 1),
      ]);
      if (cancelled) return;
      setSummary(sum ? { extract: sum.extract, image: sum.image } : null);
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
  const extract = summary?.extract || "";
  const short = extract.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  const tagline = coords ? `${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}` : "Discover real photos & travel info";

  return (
    <div className="px-4 pt-4 md:px-8 md:pt-6">
      <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mx-auto max-w-5xl">
        <Card className="overflow-hidden border-border/60 shadow-elegant">
          <div className="relative h-64 bg-muted md:h-96">
            {loading && !hero ? <Skeleton className="h-full w-full" /> : (
              <img
                src={hero?.url || `https://source.unsplash.com/1200x800/?${encodeURIComponent(decoded)}`}
                alt={`${decoded} real photograph`}
                className="h-full w-full object-cover"
                loading="eager"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 md:p-7">
              <h1 className="font-display text-3xl font-bold text-white drop-shadow md:text-5xl">{decoded}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-white/85">
                <MapPin className="h-4 w-4" /> {tagline}
              </p>
            </div>
          </div>

          <CardContent className="space-y-5 p-5 md:p-7">
            {extract ? (
              <div>
                <p className="text-sm leading-relaxed text-foreground/85 md:text-base">
                  {showFull ? extract : short}
                </p>
                {extract.length > short.length && (
                  <button onClick={() => setShowFull(s => !s)} className="mt-2 text-sm font-semibold text-primary">
                    {showFull ? "Show less" : "View more"}
                  </button>
                )}
              </div>
            ) : (
              <Skeleton className="h-16 w-full" />
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
        {loading && images.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 rounded-2xl md:h-40" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {images.slice(0, 12).map((img, idx) => (
              <button
                key={img.url + idx}
                onClick={() => setLightbox(idx)}
                className="group block overflow-hidden rounded-2xl bg-muted shadow-soft"
              >
                <img
                  src={img.thumb}
                  alt={img.title}
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://source.unsplash.com/600x400/?${encodeURIComponent(decoded)}&sig=${idx}`; }}
                  className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-40"
                />
              </button>
            ))}
          </div>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">Photos via Wikimedia Commons, Wikipedia & Unsplash. Map data © OpenStreetMap contributors.</p>
      </div>

      {lightbox !== null && images[lightbox] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
          <button onClick={() => setLightbox(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white">
            <X className="h-5 w-5" />
          </button>
          <button onClick={() => setLightbox(i => (i! - 1 + images.length) % images.length)} className="absolute left-3 rounded-full bg-white/10 p-2 text-white">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img src={images[lightbox].url} alt={images[lightbox].title} className="max-h-[90vh] max-w-[95vw] object-contain" />
          <button onClick={() => setLightbox(i => (i! + 1) % images.length)} className="absolute right-3 rounded-full bg-white/10 p-2 text-white">
            <ChevronRight className="h-6 w-6" />
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs text-white">
            {lightbox + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  );
}
