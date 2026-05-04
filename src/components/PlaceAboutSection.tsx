import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ImageIcon, MapPin } from "lucide-react";
import { getPlaceImages, getPlaceSummary, type PlaceImage } from "@/lib/places";
import { PlaceGalleryDialog } from "@/components/PlaceGalleryDialog";

interface Props { place: string; }

export function PlaceAboutSection({ place }: Props) {
  const [images, setImages] = useState<PlaceImage[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showFull, setShowFull] = useState(false);
  const [openGallery, setOpenGallery] = useState(false);

  useEffect(() => {
    if (!place) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [imgs, sum] = await Promise.all([
          getPlaceImages(place, 8).catch(() => []),
          getPlaceSummary(place).catch(() => null),
        ]);
        if (cancelled) return;
        setImages(imgs);
        setSummary(sum?.extract || "");
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [place]);

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
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
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
              <div className="grid grid-cols-3 gap-2">
                {images.slice(0, 6).map((img, idx) => (
                  <button
                    key={img.url + idx}
                    onClick={() => setOpenGallery(true)}
                    className="group relative block overflow-hidden rounded-lg bg-muted shadow-soft"
                  >
                    <img
                      src={img.thumb}
                      alt={img.title}
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://source.unsplash.com/600x400/?${encodeURIComponent(place)}&sig=${idx}`; }}
                      className="h-24 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" className="rounded-full" onClick={() => setOpenGallery(true)}>
                  <ImageIcon className="mr-1 h-3.5 w-3.5" /> More photos
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <a href={mapsUrl} target="_blank" rel="noreferrer">
                    <MapPin className="mr-1 h-3.5 w-3.5" /> View on map
                  </a>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PlaceGalleryDialog open={openGallery} onOpenChange={setOpenGallery} place={place} />
    </section>
  );
}
