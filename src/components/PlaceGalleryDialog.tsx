import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getPlaceImages, getPlaceSummary, type PlaceImage } from "@/lib/places";
import { filterLoadable } from "@/lib/imagePreload";
import { ExternalLink, MapPin, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  place: string;
}

export function PlaceGalleryDialog({ open, onOpenChange, place }: Props) {
  const [images, setImages] = useState<PlaceImage[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [showFull, setShowFull] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    if (!place) return;
    setLoading(true);
    setError(null);
    try {
      const [rawImgs, sum] = await Promise.all([
        getPlaceImages(place, 32).catch(() => [] as PlaceImage[]),
        getPlaceSummary(place).catch(() => null),
      ]);
      const candidates: PlaceImage[] = [];
      if (sum?.image) candidates.push({ url: sum.image, thumb: sum.image, source: `https://en.wikipedia.org/wiki/${encodeURIComponent(place)}`, title: place });
      for (const i of rawImgs) if (!candidates.find(c => c.url === i.url)) candidates.push(i);

      let verified = await filterLoadable(candidates, 12);
      if (verified.length < 8) {
        const fallbacks: PlaceImage[] = Array.from({ length: 16 }).map((_, i) => {
          const u = `https://source.unsplash.com/800x600/?${encodeURIComponent(place)}&sig=${i + 100}`;
          return { url: u, thumb: u, source: u, title: `${place} photo` };
        });
        const extra = await filterLoadable(fallbacks, 12 - verified.length);
        verified = [...verified, ...extra];
      }

      setImages(verified);
      setSummary(sum?.extract || "");
      if (verified.length === 0) setError("Couldn't load any photos. Tap retry.");
    } catch (e: any) {
      setError(e?.message || "Couldn't load photos.");
    } finally {
      setLoading(false);
    }
  }, [place]);

  useEffect(() => {
    if (!open) return;
    setShowFull(false);
    setImages([]);
    setSummary("");
    load();
  }, [open, load, attempt]);

  const short = summary.length > 220 ? summary.slice(0, 220).trimEnd() + "…" : summary;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="font-sans text-2xl font-semibold tracking-tight">{place}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          {loading ? (
            <>
              <Skeleton className="mb-3 h-20 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="relative h-32 overflow-hidden rounded-xl bg-muted md:h-44">
                    <Skeleton className="h-full w-full" />
                    <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {summary ? (
                <div className="mb-4 rounded-xl bg-muted/40 p-3">
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {showFull ? summary : short}
                    {summary.length > 220 && (
                      <button onClick={() => setShowFull(s => !s)} className="ml-1 text-xs font-semibold text-primary">
                        {showFull ? "Show less" : "View more"}
                      </button>
                    )}
                  </p>
                </div>
              ) : (
                <div className="mb-4 rounded-xl border border-dashed border-border bg-muted/20 p-3">
                  <p className="text-sm text-muted-foreground">No description available yet for this place.</p>
                </div>
              )}

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <a href={mapsUrl} target="_blank" rel="noreferrer">
                    <MapPin className="mr-1 h-4 w-4" /> Open in Maps
                  </a>
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setAttempt(a => a + 1)}>
                  <RefreshCw className="mr-1 h-4 w-4" /> Refresh photos
                </Button>
              </div>

              {error && images.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => setAttempt(a => a + 1)}>
                    <RefreshCw className="mr-1 h-4 w-4" /> Retry
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Photos</h3>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {images.map((img, idx) => (
                      <a
                        key={img.url + idx}
                        href={img.source}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block h-36 overflow-hidden rounded-xl bg-muted shadow-soft md:h-44"
                      >
                        <img
                          src={img.thumb}
                          alt={img.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute bottom-1 right-1 rounded-full bg-background/80 p-1 opacity-0 transition group-hover:opacity-100">
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      </a>
                    ))}
                  </div>
                </>
              )}
              <p className="mt-3 text-[11px] text-muted-foreground">Photos via Wikimedia Commons, Wikipedia & Unsplash.</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
