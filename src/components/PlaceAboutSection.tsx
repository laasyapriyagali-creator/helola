import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ImageIcon, MapPin, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { getPlaceImages, getPlaceSummary, type PlaceImage } from "@/lib/places";
import { filterLoadable } from "@/lib/imagePreload";
import { PlaceGalleryDialog } from "@/components/PlaceGalleryDialog";

interface Props { place: string; }

export function PlaceAboutSection({ place }: Props) {
  const [images, setImages] = useState<PlaceImage[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [openGallery, setOpenGallery] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    if (!place) return;
    setLoading(true);
    setError(null);
    try {
      const [rawImgs, sum] = await Promise.all([
        getPlaceImages(place, 16).catch(() => [] as PlaceImage[]),
        getPlaceSummary(place).catch(() => null),
      ]);
      // Only keep images we can actually display, top-up with Unsplash fallbacks if needed.
      const verified = await filterLoadable(rawImgs, 6);
      let final = verified;
      if (final.length < 6) {
        const fallbacks: PlaceImage[] = Array.from({ length: 12 }).map((_, i) => {
          const u = `https://source.unsplash.com/600x400/?${encodeURIComponent(place)}&sig=${i + 50}`;
          return { url: u, thumb: u, source: u, title: place };
        });
        const extra = await filterLoadable(fallbacks, 6 - final.length);
        final = [...final, ...extra];
      }
      setImages(final.slice(0, 6));
      setSummary(sum?.extract || "");
      if (final.length === 0) setError("Couldn't load photos. Tap retry.");
    } catch (e: any) {
      setError(e?.message || "Couldn't load place info.");
    } finally {
      setLoading(false);
    }
  }, [place]);

  useEffect(() => { load(); }, [load, attempt]);

  const short = summary.length > 220 ? summary.slice(0, 220).trimEnd() + "…" : summary;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose text-rose-foreground">
            <ImageIcon className="h-4 w-4" />
          </span>
          About {place}
        </h2>
      </div>
      <Card className="border-border/60 shadow-soft">
        <CardContent className="p-4">
          {loading ? (
            <>
              <Skeleton className="mb-3 h-16 w-full rounded-md" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="relative h-24 overflow-hidden rounded-lg bg-muted">
                    <Skeleton className="h-full w-full" />
                    <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {summary && (
                <p className="mb-3 text-sm leading-relaxed text-foreground/80">
                  {showFull ? summary : short}
                  {summary.length > 220 && (
                    <button onClick={() => setShowFull(s => !s)} className="ml-1 text-xs font-semibold text-primary">
                      {showFull ? "Show less" : "View more"}
                    </button>
                  )}
                </p>
              )}

              {error && images.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => setAttempt(a => a + 1)}>
                    <RefreshCw className="mr-1 h-3.5 w-3.5" /> Retry
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={img.url + idx}
                      onClick={() => setOpenGallery(true)}
                      className="group relative block h-24 overflow-hidden rounded-lg bg-muted shadow-soft"
                    >
                      <img
                        src={img.thumb}
                        alt={img.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" className="rounded-full" onClick={() => setOpenGallery(true)}>
                  <ImageIcon className="mr-1 h-3.5 w-3.5" /> More photos
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <a href={mapsUrl} target="_blank" rel="noreferrer">
                    <MapPin className="mr-1 h-3.5 w-3.5" /> View on map
                  </a>
                </Button>
                {error && images.length > 0 && (
                  <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setAttempt(a => a + 1)}>
                    <RefreshCw className="mr-1 h-3.5 w-3.5" /> Retry
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PlaceGalleryDialog open={openGallery} onOpenChange={setOpenGallery} place={place} />
    </section>
  );
}
