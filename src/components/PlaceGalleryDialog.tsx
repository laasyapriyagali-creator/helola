import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlaceImages, getPlaceSummary, type PlaceImage } from "@/lib/places";
import { ExternalLink } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  place: string;
}

export function PlaceGalleryDialog({ open, onOpenChange, place }: Props) {
  const [images, setImages] = useState<PlaceImage[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !place) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [imgs, sum] = await Promise.all([getPlaceImages(place, 18), getPlaceSummary(place)]);
      if (cancelled) return;
      const combined: PlaceImage[] = [];
      if (sum?.image) combined.push({ url: sum.image, thumb: sum.image, source: "https://en.wikipedia.org", title: place });
      for (const i of imgs) if (!combined.find(c => c.url === i.url)) combined.push(i);
      setImages(combined);
      setSummary(sum?.extract || "");
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, place]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{place}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : (
          <>
            {summary && <p className="mb-3 text-sm leading-relaxed text-foreground/85">{summary}</p>}
            {images.length === 0 ? (
              <p className="text-sm text-muted-foreground">No photos found for this place yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {images.map(img => (
                  <a key={img.url} href={img.source} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-xl bg-muted shadow-soft">
                    <img src={img.thumb} alt={img.title} loading="lazy" className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-40" />
                    <span className="absolute bottom-1 right-1 rounded-full bg-background/80 p-1 opacity-0 transition group-hover:opacity-100">
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </a>
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] text-muted-foreground">Photos via Wikimedia Commons & Wikipedia.</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
