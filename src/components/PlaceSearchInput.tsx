import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, Search } from "lucide-react";
import { searchPlaces, type PlaceSuggestion } from "@/lib/places";
import { cn } from "@/lib/utils";

interface PlaceSearchInputProps {
  value: string;
  onChange: (v: string) => void;
  onSelect: (p: PlaceSuggestion) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function PlaceSearchInput({ value, onChange, onSelect, placeholder, required, className }: PlaceSearchInputProps) {
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
        const r = await searchPlaces(value, 6);
        setResults(r);
        setOpen(true);
      } finally { setLoading(false); }
    }, 350);
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
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder ?? "Search any place in the world…"}
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
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                <p className="truncate text-xs text-muted-foreground">{r.display_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
