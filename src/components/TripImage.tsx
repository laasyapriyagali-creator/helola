import { useEffect, useState } from "react";
import { getPlaceSummary } from "@/lib/places";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const cache = new Map<string, string | null>();

interface Props {
  destination: string;
  coverUrl?: string | null;
  className?: string;
  rounded?: "full" | "lg" | "xl" | "2xl";
  alt?: string;
}

export function TripImage({ destination, coverUrl, className, rounded = "xl", alt }: Props) {
  const [src, setSrc] = useState<string | null>(coverUrl || cache.get(destination) || null);

  useEffect(() => {
    if (coverUrl) { setSrc(coverUrl); return; }
    if (cache.has(destination)) { setSrc(cache.get(destination) ?? null); return; }
    let cancelled = false;
    (async () => {
      try {
        const s = await getPlaceSummary(destination);
        const url = s?.image || null;
        cache.set(destination, url);
        if (!cancelled) setSrc(url);
      } catch { if (!cancelled) setSrc(null); }
    })();
    return () => { cancelled = true; };
  }, [destination, coverUrl]);

  const r = rounded === "full" ? "rounded-full" : rounded === "lg" ? "rounded-lg" : rounded === "xl" ? "rounded-xl" : "rounded-2xl";
  return (
    <div className={cn("relative overflow-hidden bg-gradient-warm", r, className)}>
      {src ? (
        <img src={src} alt={alt || destination} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-primary-foreground">
          <MapPin className="h-5 w-5 opacity-80" />
        </div>
      )}
    </div>
  );
}
