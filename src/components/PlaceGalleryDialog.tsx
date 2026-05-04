import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getPlaceImages, getPlaceSummary, type PlaceImage } from "@/lib/places";
import { ExternalLink, MapPin } from "lucide-react";

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

  useEffect(() => {
    if (!open || !place) return;
    let cancelled = false;
    setShowFull(false);
    setImages([]);
    setSummary("");
    (async () => {
      setLoading(true);
      try {
        const [imgs, sum] = await Promise.all([
          getPlaceImages(place, 24).catch(() => []),
          getPlaceSummary(place).catch(() => null),
        ]);
        if (cancelled) return;
        const combined: PlaceImage[] = [];
        if (sum?.image) combined.push({ url: sum.image, thumb: sum.image, source: `https://en.wikipedia.org/wiki/${encodeURIComponent(place)}`, title: place });
        for (const i of imgs) if (!combined.find(c => c.url === i.url)) combined.push(i);
        setImages(combined);
        setSummary(sum?.extract || "");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, place]);

  const short = summary.length > 220 ? summary.slice(0, 220).trimEnd() + "…" : summary;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="font-display text-2xl">{place}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          {loading ? (
            <>
              <Skeleton className="mb-3 h-20 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
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

              <Button asChild variant="outline" size="sm" className="mb-4 rounded-full">
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  <MapPin className="mr-1 h-4 w-4" /> Open in Maps
                </a>
              </Button>

              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Photos</h3>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {images.map((img, idx) => (
                  <a key={img.url + idx} href={img.source} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-xl bg-muted shadow-soft">
                    <img
                      src={img.thumb}
                      alt={img.title}
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://source.unsplash.com/600x400/?${encodeURIComponent(place)}&sig=${idx}`; }}
                      className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-44"
                    />
                    <span className="absolute bottom-1 right-1 rounded-full bg-background/80 p-1 opacity-0 transition group-hover:opacity-100">
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </a>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">Photos via Wikimedia Commons, Wikipedia & Unsplash.</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
