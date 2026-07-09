import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plane, Train, Bus, Car, ExternalLink, Ban, Clock, MapPin, Loader2, AlertTriangle, Info, Radio } from "lucide-react";
import { PlaceSearchInput } from "@/components/PlaceSearchInput";
import { getKnownIndianCity, isInternationalRoute, normalizePlaceKey, resolveIata, type PlaceSuggestion, type PlaceKind } from "@/lib/places";
import { searchLiveTransport, type LiveTransportOption, type Mode } from "@/lib/transportProviders";
import { formatPriceFromINR } from "@/lib/i18n";

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
    return { valid: false, intl, distanceKm, available: { flight: false, train: false, bus: false, cab: false }, reason: "Select a city, airport, railway station, or bus stand from suggestions to check transport options." };
  }
  if (distanceKm !== null && distanceKm < 8) {
    return { valid: false, intl, distanceKm, available: { flight: false, train: false, bus: false, cab: false }, reason: "Origin and destination are too close or resolve to the same place." };
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

function fmtDuration(min?: number) {
  if (!min || min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m ? `${m}m` : ""}`.trim();
}

export default function BookTickets() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromPlace, setFromPlace] = useState<PlaceSuggestion | null>(null);
  const [toPlace, setToPlace] = useState<PlaceSuggestion | null>(null);
  const [date, setDate] = useState("");
  const [mode, setMode] = useState<Mode>("flight");
  const [results, setResults] = useState<LiveTransportOption[]>([]);
  const [liveOk, setLiveOk] = useState(false);
  const [liveReason, setLiveReason] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [route, setRoute] = useState<RouteAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.title = "Book travel · HELOLA"; }, []);

  const intl = useMemo(() => route?.intl ?? isInternationalRoute(fromPlace?.display_name || from, toPlace?.display_name || to), [from, to, fromPlace, toPlace, route]);

  useEffect(() => {
    setResults([]);
    setUnavailable(false);
    setSearched(false);
    setRoute(null);
    setLiveOk(false);
    setLiveReason(null);
  }, [from, to]);

  const fromIata = fromPlace?.iata ?? resolveIata(from);
  const toIata = toPlace?.iata ?? resolveIata(to);

  const compare = async (m: Mode = mode) => {
    setError(null);
    if (!from || !to) { setError("Enter both origin and destination."); return; }
    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      setError("Origin and destination can't be the same.");
      return;
    }
    setMode(m);
    setSearched(true);
    setSearching(true);

    const nextRoute = analyseRoute(from, to, fromPlace, toPlace);
    setRoute(nextRoute);

    if (!nextRoute.valid) {
      setUnavailable(true);
      setResults([]);
      setError(nextRoute.reason || "Route unavailable.");
      setSearching(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      return;
    }
    if (!nextRoute.available[m]) {
      setUnavailable(true);
      setResults([]);
      setSearching(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      return;
    }

    const live = await searchLiveTransport({
      from, to, fromIata: fromIata || undefined, toIata: toIata || undefined, date, mode: m,
    });
    setLiveOk(live.ok);
    setLiveReason(live.ok ? null : live.reason || "Live data unavailable.");
    setResults(live.options);
    setUnavailable(false);
    setSearching(false);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const switchMode = (m: Mode) => {
    if (!searched) { setMode(m); return; }
    compare(m);
  };

  const ModeIcon = MODE_META[mode].icon;
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
      <p className="mt-1 text-sm text-muted-foreground">Live prices when available — otherwise tap a partner to check fares directly.</p>

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
          <div className="flex items-end"><Button onClick={() => compare()} className="w-full rounded-xl" disabled={searching}>Search</Button></div>
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
            Checking route and querying live transport providers…
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
              <p className="font-display text-lg font-semibold">{route?.valid === false ? "Route unavailable" : `${MODE_META[mode].label} aren't available for this route`}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {route?.reason || <>No {MODE_META[mode].label.toLowerCase()} between <strong>{from}</strong> and <strong>{to}</strong>{intl ? " (international route)" : ""}. Try another available mode above.</>}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live data unavailable — honest fallback with partner links */}
      {searched && !unavailable && !searching && !liveOk && (
        <Card className="mt-6 border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Info className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold">Live prices couldn't be retrieved</p>
                <p className="mt-1 text-sm text-muted-foreground">{liveReason}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Check fares on a partner:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <a
                      key={p.name}
                      href={p.href(params)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      {p.name}<ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {liveOk && results.length > 0 && !searching && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <ModeIcon className="h-5 w-5 text-primary" />
              {from} → {to}
            </h2>
            <span className="text-sm text-muted-foreground">· {MODE_META[mode].label}</span>
            {intl && <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-medium text-rose-foreground">International</span>}
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <Radio className="h-3 w-3" /> Live
            </span>
          </div>

          {results.map((r) => {
            const duration = fmtDuration(r.durationMinutes);
            return (
              <Card key={r.id} className="border-border/60 shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ModeIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-base font-bold">{r.operator}</p>
                        {r.classOrSeat && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{r.classOrSeat}</span>}
                        {typeof r.seatsAvailable === "number" && (
                          <span className="text-[11px] text-muted-foreground">{r.seatsAvailable} seats left</span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        {r.departTime && <span className="font-medium text-foreground">{r.departTime}</span>}
                        {r.departTime && r.arriveTime && <span>→</span>}
                        {r.arriveTime && <span className="font-medium text-foreground">{r.arriveTime}</span>}
                        {duration && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{duration}</span>}
                        {r.stops && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{r.stops}</span>}
                      </div>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Source: {r.source}</p>
                    </div>
                    <div className="text-right">
                      {r.price != null ? (
                        <>
                          <p className="font-display text-lg font-bold text-primary leading-tight">
                          <p className="font-display text-lg font-bold text-primary leading-tight">
                            {(r.currency || "INR") === "INR"
                              ? formatPriceFromINR(r.price)
                              : `${r.currency} ${r.price.toLocaleString(undefined)}`}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">live price</p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">Price unavailable</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                    {r.bookingUrl && (
                      <a href={r.bookingUrl} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90">
                        Book <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <span className="text-xs font-medium text-muted-foreground">Or via:</span>
                    {PLATFORMS.map((p) => (
                      <a
                        key={p.name}
                        href={p.href(params)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-muted"
                      >
                        {p.name}<ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
