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
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback((isCancelled: () => boolean) => {
    if (!place) return;
    setSummaryLoading(true);
    setImagesLoading(true);
    setError(null);
    getPlaceSummary(place)
      .then((sum) => {
        if (!isCancelled()) setSummary(sum?.extract || "");
      })
      .catch(() => {
        if (!isCancelled()) setSummary("");
      })
      .finally(() => {
        if (!isCancelled()) setSummaryLoading(false);
      });

    getPlaceImages(place, 32)
      .then(async (rawImgs) => {
        const verified = await filterLoadable(rawImgs, 24);
        if (isCancelled()) return;
        setImages(verified);
        if (verified.length === 0) setError("No photos found for this place yet.");
      })
      .catch(() => {
        if (!isCancelled()) setError("Couldn't load photos right now.");
      })
      .finally(() => {
        if (!isCancelled()) setImagesLoading(false);
      });
  }, [place]);

  useEffect(() => {
    if (!open) return;
    setShowFull(false);
    setImages([]);
    setSummary("");
    let cancelled = false;
    load(() => cancelled);
    return () => { cancelled = true; };
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
          <>
              {summaryLoading ? (
                <Skeleton className="mb-4 h-20 w-full rounded-xl" />
              ) : summary ? (
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

              {imagesLoading && images.length === 0 ? (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="relative h-32 overflow-hidden rounded-xl bg-muted md:h-44">
                      <Skeleton className="h-full w-full" />
                      <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : error && images.length === 0 ? (
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
              <p className="mt-3 text-[11px] text-muted-foreground">Photos via Wikimedia Commons, Wikipedia.</p>
            </>
        </div>
      </DialogContent>
    </Dialog>
  );
}
