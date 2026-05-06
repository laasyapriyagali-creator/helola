import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, Search, Plane, Landmark, Building2 } from "lucide-react";
import { searchPlaces, type PlaceSuggestion, type PlaceKind } from "@/lib/places";
import { cn } from "@/lib/utils";

interface PlaceSearchInputProps {
  value: string;
  onChange: (v: string) => void;
  onSelect: (p: PlaceSuggestion) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  selectedKind?: PlaceKind;
}

function KindIcon({ kind, className }: { kind?: PlaceKind; className?: string }) {
  const cls = cn("h-4 w-4 shrink-0", className);
  if (kind === "airport") return <Plane className={cls} />;
  if (kind === "landmark") return <Landmark className={cls} />;
  if (kind === "area") return <Building2 className={cls} />;
  return <MapPin className={cls} />;
}

function kindLabel(k?: PlaceKind) {
  if (k === "airport") return "Airport";
  if (k === "city") return "City";
  if (k === "landmark") return "Landmark";
  if (k === "area") return "Area";
  return "Place";
}

export function PlaceSearchInput({ value, onChange, onSelect, placeholder, required, className, selectedKind }: PlaceSearchInputProps) {
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setResults([]); return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchPlaces(value, 8);
        // Prioritize cities & airports
        const order: Record<string, number> = { city: 0, airport: 1, area: 2, landmark: 3 };
        r.sort((a, b) => (order[a.kind ?? "landmark"] ?? 9) - (order[b.kind ?? "landmark"] ?? 9));
        setResults(r);
        setOpen(true);
      } finally { setLoading(false); }
    }, 300);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [value]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="relative">
        {selectedKind ? (
          <KindIcon kind={selectedKind} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
        ) : (
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder ?? "Search city, airport or landmark…"}
          className="pl-9"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-elegant">
          {results.map((r) => (
            <button
              type="button"
              key={`${r.osm_id}-${r.lat}`}
              onClick={() => { onSelect(r); onChange(r.name); setOpen(false); }}
              className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left hover:bg-muted"
            >
              <KindIcon kind={r.kind} className="mt-0.5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {r.name}
                  {r.iata && <span className="ml-1.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{r.iata}</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{r.display_name}</p>
              </div>
              <span className="ml-2 shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {kindLabel(r.kind)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
