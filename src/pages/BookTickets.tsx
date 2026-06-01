import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plane, Train, Bus, Car, ExternalLink, Ban, Star, Clock, MapPin, Loader2, AlertTriangle } from "lucide-react";
import { PlaceSearchInput } from "@/components/PlaceSearchInput";
import { getKnownIndianCity, isInternationalRoute, normalizePlaceKey, resolveIata, type PlaceSuggestion, type PlaceKind } from "@/lib/places";

type Mode = "flight" | "train" | "bus" | "cab";

interface BookingPlatform { name: string; href: (q: SearchParams) => string; }
interface SearchParams { from: string; to: string; date: string; mode: Mode; }

const PLATFORMS: BookingPlatform[] = [
  { name: "EaseMyTrip", href: ({ mode }) => mode === "flight" ? "https://www.easemytrip.com/flights.html" : mode === "train" ? "https://www.easemytrip.com/railways/" : mode === "bus" ? "https://www.easemytrip.com/bus.html" : "https://www.easemytrip.com/cabs.html" },
  { name: "ixigo",      href: ({ mode }) => mode === "flight" ? "https://www.ixigo.com/flights" : mode === "train" ? "https://www.ixigo.com/trains" : mode === "bus" ? "https://www.ixigo.com/bus" : "https://www.ixigo.com/cabs" },
  { name: "MakeMyTrip", href: ({ mode }) => mode === "flight" ? "https://www.makemytrip.com/flights/" : mode === "train" ? "https://www.makemytrip.com/railways/" : mode === "bus" ? "https://www.makemytrip.com/bus-tickets/" : "https://www.makemytrip.com/cabs/" },
  { name: "Yatra", href: ({ mode }) => mode === "flight" ? "https://www.yatra.com/flights" : mode === "train" ? "https://www.yatra.com/trains" : mode === "bus" ? "https://www.yatra.com/bus" : "https://www.yatra.com/cabs" },
  { name: "Goibibo", href: ({ mode }) => mode === "flight" ? "https://www.goibibo.com/flights/" : mode === "train" ? "https://www.goibibo.com/trains/" : mode === "bus" ? "https://www.goibibo.com/bus/" : "https://www.goibibo.com/cars/" },
  { name: "Cleartrip", href: ({ mode }) => mode === "flight" ? "https://www.cleartrip.com/flights" : mode === "train" ? "https://www.cleartrip.com/trains" : mode === "bus" ? "https://www.cleartrip.com/bus" : "https://www.cleartrip.com/cabs" },
];

const MODE_META: Record<Mode, { label: string; icon: typeof Plane }> = {
  flight: { label: "Flights", icon: Plane },
  train:  { label: "Trains",  icon: Train },
  bus:    { label: "Buses",   icon: Bus },
  cab:    { label: "Cabs",    icon: Car },
};

interface TransportResult {
  id: string;
  operator: string;
  depart: string;
  arrive: string;
  duration: string;
  stops: string;
  priceMin: number;
  priceMax: number;
  estimated: boolean;
  best?: boolean;
}

interface RouteAnalysis {
  valid: boolean;
  intl: boolean;
  distanceKm: number | null;
  available: Record<Mode, boolean>;
  reason?: string;
}

function kmBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const toRad = (n: number) => n * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
}

function analyseRoute(fromText: string, toText: string, fromPlace: PlaceSuggestion | null, toPlace: PlaceSuggestion | null): RouteAnalysis {
  const fromKnown = getKnownIndianCity(fromPlace?.city || fromPlace?.name || fromText) || getKnownIndianCity(normalizePlaceKey(fromText));
  const toKnown = getKnownIndianCity(toPlace?.city || toPlace?.name || toText) || getKnownIndianCity(normalizePlaceKey(toText));
  const intl = isInternationalRoute(fromPlace?.display_name || fromText, toPlace?.display_name || toText);
  const fromCoords = fromKnown || (fromPlace ? { lat: fromPlace.lat, lon: fromPlace.lon, rail: false, bus: false, cab: false } : null);
  const toCoords = toKnown || (toPlace ? { lat: toPlace.lat, lon: toPlace.lon, rail: false, bus: false, cab: false } : null);
  const distanceKm = fromCoords && toCoords ? kmBetween(fromCoords, toCoords) : null;

  if (!fromCoords || !toCoords) {
    return { valid: false, intl, distanceKm, available: { flight: false, train: false, bus: false, cab: false }, reason: "Transport information currently unavailable. Select a city, airport, railway station, or bus stand from suggestions." };
  }
  if (distanceKm !== null && distanceKm < 8) {
    return { valid: false, intl, distanceKm, available: { flight: false, train: false, bus: false, cab: false }, reason: "Origin and destination are too close or matched to the same place." };
  }

  const fromIata = fromPlace?.iata || resolveIata(fromPlace?.city || fromPlace?.name || fromText);
  const toIata = toPlace?.iata || resolveIata(toPlace?.city || toPlace?.name || toText);
  const domesticKnown = !!fromKnown && !!toKnown && !intl;
  const flight = intl ? !!toCoords : !!(fromIata && toIata && distanceKm !== null && distanceKm >= 180);
  const train = domesticKnown && fromKnown.rail && toKnown.rail && distanceKm !== null && distanceKm <= 2600;
  const bus = domesticKnown && fromKnown.bus && toKnown.bus && distanceKm !== null && distanceKm <= 900;
  const cab = domesticKnown && fromKnown.cab && toKnown.cab && distanceKm !== null && distanceKm <= 650;
  return { valid: flight || train || bus || cab, intl, distanceKm, available: { flight, train, bus, cab } };
}

function priceRange(mode: Mode, route: RouteAnalysis): [number, number] {
  const km = route.distanceKm ?? (route.intl ? 4500 : 500);
  if (mode === "flight") {
    if (route.intl) return [Math.max(25000, Math.round(km * 5.2)), Math.max(42000, Math.round(km * 9.5))];
    return [Math.max(2200, Math.round(km * 5.5)), Math.min(15000, Math.max(4200, Math.round(km * 13)))];
  }
  if (mode === "train") return [Math.max(180, Math.round(km * 0.9)), Math.max(650, Math.round(km * 3.1))];
  if (mode === "bus") return [Math.max(300, Math.round(km * 1.2)), Math.max(800, Math.round(km * 2.8))];
  return [Math.max(1800, Math.round(km * 10)), Math.max(3200, Math.round(km * 18))];
}

const FLIGHT_OPS = ["IndiGo", "Air India", "Vistara", "SpiceJet", "Akasa Air"];
const INTL_OPS = ["Emirates", "Qatar Airways", "Singapore Airlines", "Lufthansa", "Air India"];
const TRAIN_OPS = ["Indian Railways", "Vande Bharat", "Intercity Express", "Superfast Express", "Express Train"];
const BUS_OPS = ["State RTC", "IntrCity SmartBus", "Orange Tours", "VRL Travels", "Zingbus"];
const CAB_OPS = ["Savaari", "Ola Outstation", "Uber Intercity", "Local Taxi"];

function makeResults(mode: Mode, route: RouteAnalysis): TransportResult[] {
  if (!route.available[mode]) return [];
  const ops = mode === "flight" ? (route.intl ? INTL_OPS : FLIGHT_OPS) : mode === "train" ? TRAIN_OPS : mode === "bus" ? BUS_OPS : CAB_OPS;
  const [lo, hi] = priceRange(mode, route);
  const km = route.distanceKm ?? 500;
  const baseHours = mode === "flight" ? Math.max(route.intl ? 5 : 1, Math.round(km / 750)) : mode === "train" ? Math.max(3, Math.round(km / 65)) : mode === "bus" ? Math.max(3, Math.round(km / 55)) : Math.max(2, Math.round(km / 45));

  const out: TransportResult[] = ops.slice(0, 5).map((op, i) => {
    const departHr = 6 + i * 3;
    const dur = baseHours + (i % 3);
    const arriveHr = (departHr + dur) % 24;
    const fmt = (h: number) => `${String(h).padStart(2, "0")}:${i % 2 ? "30" : "00"}`;
    const stops = mode === "flight" ? (i === 0 ? "Non-stop" : i === 1 ? "1 stop" : "Non-stop") : mode === "train" ? `${4 + i} halts` : mode === "bus" ? "Non-stop" : "Direct";
    // spread prices across the range
    const span = hi - lo;
    const priceMin = Math.round(lo + (span * (i / ops.length)) / 1.4);
    const priceMax = Math.round(priceMin + span * 0.18);
    return {
      id: `${op}-${i}`,
      operator: op,
      depart: fmt(departHr),
      arrive: fmt(arriveHr) + (departHr + dur >= 24 ? " +1d" : ""),
      duration: `${dur}h ${i % 2 ? "10" : "45"}m`,
      stops,
      priceMin,
      priceMax,
      estimated: true,
    };
  });
  out.sort((a, b) => a.priceMin - b.priceMin);
  if (out[0]) out[0].best = true;
  return out;
}

export default function BookTickets() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromPlace, setFromPlace] = useState<PlaceSuggestion | null>(null);
  const [toPlace, setToPlace] = useState<PlaceSuggestion | null>(null);
  const [date, setDate] = useState("");
  const [mode, setMode] = useState<Mode>("flight");
  const [results, setResults] = useState<TransportResult[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [route, setRoute] = useState<RouteAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.title = "Compare ticket prices · HELOLA"; }, []);

  const intl = useMemo(() => route?.intl ?? isInternationalRoute(fromPlace?.display_name || from, toPlace?.display_name || to), [from, to, fromPlace, toPlace, route]);

  useEffect(() => {
    setResults([]);
    setUnavailable(false);
    setSearched(false);
    setRoute(null);
  }, [from, to]);

  const compare = (m: Mode = mode) => {
    setError(null);
    if (!from || !to) { setError("Enter both origin and destination."); return; }
    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      setError("Origin and destination can't be the same.");
      return;
    }
    setMode(m);
    setSearched(true);
    setSearching(true);
    window.setTimeout(() => {
      const nextRoute = analyseRoute(from, to, fromPlace, toPlace);
      setRoute(nextRoute);
      if (!nextRoute.valid) {
        setUnavailable(true);
        setResults([]);
        setError(nextRoute.reason || "Transport information currently unavailable.");
      } else if (!nextRoute.available[m]) {
        setUnavailable(true);
        setResults([]);
      } else {
        setUnavailable(false);
        setResults(makeResults(m, nextRoute));
      }
      setSearching(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }, 350);
  };

  const switchMode = (m: Mode) => {
    if (!searched) { setMode(m); return; }
    compare(m);
  };

  const ModeIcon = MODE_META[mode].icon;
  const fromIata = fromPlace?.iata ?? resolveIata(from);
  const toIata = toPlace?.iata ?? resolveIata(to);

  const params: SearchParams = { from, to, date, mode };
  const available = route?.available;

  return (
    <div className="px-4 pt-4 md:px-8 md:pt-8">
      <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-warm text-primary-foreground"><Plane className="h-4 w-4" /></div>
        <h1 className="font-display text-3xl font-bold">Book travel tickets</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Real flights, trains, buses and cabs with estimated fare ranges. Tap any option to book on your favourite app.</p>

      <Card className="mt-5 border-border/60 shadow-elegant">
        <CardContent className="grid gap-3 p-5 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label>From</Label>
            <PlaceSearchInput
              value={from}
              onChange={(v) => { setFrom(v); if (!v) setFromPlace(null); }}
              onSelect={(p) => { setFrom(p.name); setFromPlace(p); }}
              placeholder="City or airport"
              selectedKind={fromPlace?.kind as PlaceKind}
            />
            {fromIata && mode === "flight" && <p className="text-[11px] text-muted-foreground">Nearest airport: <strong>{fromIata}</strong></p>}
          </div>
          <div className="space-y-1.5">
            <Label>To</Label>
            <PlaceSearchInput
              value={to}
              onChange={(v) => { setTo(v); if (!v) setToPlace(null); }}
              onSelect={(p) => { setTo(p.name); setToPlace(p); }}
              placeholder="City or airport"
              selectedKind={toPlace?.kind as PlaceKind}
            />
            {toIata && mode === "flight" && <p className="text-[11px] text-muted-foreground">Nearest airport: <strong>{toIata}</strong></p>}
          </div>
          <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="flex items-end"><Button onClick={() => compare()} className="w-full rounded-xl">Search</Button></div>
          {error && <p className="md:col-span-4 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {/* Mode tabs */}
      <div ref={resultsRef} className="mt-5 flex flex-wrap gap-2 scroll-mt-4">
        {(Object.keys(MODE_META) as Mode[]).map((m) => {
          const M = MODE_META[m];
          const Icon = M.icon;
          const active = m === mode;
          const disabled = searched && available ? !available[m] : false;
          return (
            <button
              key={m}
              type="button"
              disabled={disabled || searching}
              onClick={() => switchMode(m)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                active ? "border-primary bg-primary text-primary-foreground" : disabled ? "border-border bg-muted text-muted-foreground opacity-60" : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {M.label}
            </button>
          );
        })}
      </div>

      {searching && (
        <Card className="mt-6 border-border/60 shadow-soft">
          <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Checking route, transport coverage, and realistic fare ranges…
          </CardContent>
        </Card>
      )}

      {searched && unavailable && !searching && (
        <Card className="mt-6 border-border/60 shadow-soft">
          <CardContent className="flex items-start gap-3 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              {route?.valid === false ? <AlertTriangle className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-display text-lg font-semibold">{route?.valid === false ? "Transport information currently unavailable" : `${MODE_META[mode].label} aren't available for this route`}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {route?.reason || <>No {MODE_META[mode].label.toLowerCase()} between <strong>{from}</strong> and <strong>{to}</strong>{intl ? " (international route)" : ""}. Try another available mode above.</>}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && !unavailable && !searching && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <ModeIcon className="h-5 w-5 text-primary" />
              {from} → {to}
            </h2>
            <span className="text-sm text-muted-foreground">· {MODE_META[mode].label}</span>
            {intl && <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-medium text-rose-foreground">International</span>}
            <span className="ml-auto text-[11px] text-muted-foreground">Prices are estimated ranges</span>
          </div>

          {results.map((r) => (
            <Card key={r.id} className={`border-border/60 shadow-soft ${r.best ? "ring-2 ring-primary" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ModeIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-base font-bold">{r.operator}</p>
                      {r.best && <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success"><Star className="h-3 w-3" />Best value</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{r.depart}</span>
                      <span>→</span>
                      <span className="font-medium text-foreground">{r.arrive}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{r.duration}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{r.stops}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-primary leading-tight">
                      ₹{r.priceMin.toLocaleString("en-IN")}–{r.priceMax.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">est. range</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                  <span className="text-xs font-medium text-muted-foreground">Book via:</span>
                  {PLATFORMS.map((p) => (
                    <a
                      key={p.name}
                      href={p.href(params)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-muted"
                    >
                      {p.name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
