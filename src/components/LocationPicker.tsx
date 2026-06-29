import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Loader2, Navigation, Search } from "lucide-react";
import { detectDeviceLocation, searchCities, formatLocation, type CityResult } from "@/lib/location";
import { toast } from "@/hooks/use-toast";

interface Props {
  value: CityResult | null;
  onChange: (next: CityResult) => void;
  /** Hide the inline button and just expose `openSearch` via children render-prop style? Not used here — kept simple. */
  compact?: boolean;
}

/**
 * Trusted city/country picker. No free-text input is ever accepted —
 * every result comes from device geolocation + reverse geocode or an
 * autocomplete search backed by OpenStreetMap.
 */
export function LocationPicker({ value, onChange, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const detect = async () => {
    setDetecting(true);
    try {
      const loc = await detectDeviceLocation();
      onChange(loc);
      toast({ title: "Location set", description: formatLocation(loc.city, loc.country) });
      setOpen(false);
    } catch (e) {
      toast({
        title: "Couldn't detect location",
        description: (e as Error).message + " You can pick from the list instead.",
        variant: "destructive",
      });
    } finally {
      setDetecting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-input bg-background px-4 py-3 text-left text-sm transition-colors hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          {value ? (
            <span className="font-medium">{formatLocation(value.city, value.country)}</span>
          ) : (
            <span className="text-muted-foreground">Set your city</span>
          )}
        </span>
        <span className="text-xs font-medium text-primary">{value ? "Change" : "Add"}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set your location</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              type="button"
              onClick={detect}
              disabled={detecting}
              className="w-full justify-center rounded-full"
            >
              {detecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Navigation className="mr-2 h-4 w-4" />}
              Use my current location
            </Button>
            <p className="text-center text-xs text-muted-foreground">or pick from the list below</p>
            <CitySearch onSelect={(r) => { onChange(r); setOpen(false); }} />
            {!compact && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                We only store your city and country. Free-text addresses aren't allowed — this keeps profiles honest and prevents fakes.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CitySearch({ onSelect }: { onSelect: (r: CityResult) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try { setResults(await searchCities(q)); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search city e.g. Mumbai, Paris…"
          className="pl-9"
        />
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {loading && <p className="py-2 text-center text-xs text-muted-foreground">Searching…</p>}
        {!loading && q.trim().length >= 2 && results.length === 0 && (
          <p className="py-2 text-center text-xs text-muted-foreground">No cities found.</p>
        )}
        {results.map((r) => (
          <button
            key={`${r.city}-${r.country}-${r.lat}-${r.lon}`}
            type="button"
            onClick={() => onSelect(r)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
          >
            <span className="font-medium">{r.city}</span>
            <span className="text-xs text-muted-foreground">{r.country}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
