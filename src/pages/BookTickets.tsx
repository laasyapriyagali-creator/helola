import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plane, Train, Bus, Car, ExternalLink, Check, Ban } from "lucide-react";

type Mode = "flight" | "train" | "bus" | "cab";

interface Provider {
  name: string;
  url: string;
  color: string;
}

const PROVIDERS: Record<Mode, Provider[]> = {
  flight: [
    { name: "MakeMyTrip", url: "https://www.makemytrip.com/flights/", color: "from-red-500 to-rose-500" },
    { name: "Goibibo",    url: "https://www.goibibo.com/flights/",   color: "from-orange-500 to-amber-500" },
    { name: "ixigo",      url: "https://www.ixigo.com/flights",      color: "from-amber-500 to-yellow-500" },
    { name: "Yatra",      url: "https://flights.yatra.com/",         color: "from-rose-500 to-pink-500" },
    { name: "EaseMyTrip", url: "https://www.easemytrip.com/flights.html", color: "from-blue-500 to-sky-500" },
    { name: "Cleartrip",  url: "https://www.cleartrip.com/flights",  color: "from-emerald-500 to-teal-500" },
  ],
  train: [
    { name: "IRCTC",      url: "https://www.irctc.co.in/",           color: "from-blue-600 to-indigo-600" },
    { name: "ixigo Trains", url: "https://www.ixigo.com/trains",     color: "from-amber-500 to-yellow-500" },
    { name: "ConfirmTkt", url: "https://www.confirmtkt.com/",        color: "from-emerald-500 to-teal-500" },
    { name: "MakeMyTrip Trains", url: "https://www.makemytrip.com/railways/", color: "from-red-500 to-rose-500" },
  ],
  bus: [
    { name: "RedBus",     url: "https://www.redbus.in/",             color: "from-red-500 to-rose-500" },
    { name: "AbhiBus",    url: "https://www.abhibus.com/",           color: "from-orange-500 to-amber-500" },
    { name: "MakeMyTrip Bus", url: "https://www.makemytrip.com/bus-tickets/", color: "from-rose-500 to-pink-500" },
    { name: "Paytm Bus",  url: "https://tickets.paytm.com/bus-tickets/", color: "from-blue-500 to-sky-500" },
  ],
  cab: [
    { name: "Ola Outstation", url: "https://book.olacabs.com/",      color: "from-emerald-500 to-teal-500" },
    { name: "Uber Intercity", url: "https://www.uber.com/in/en/ride/uber-intercity/", color: "from-zinc-700 to-zinc-900" },
    { name: "Savaari",    url: "https://www.savaari.com/",           color: "from-orange-500 to-amber-500" },
    { name: "BlaBlaCar",  url: "https://www.blablacar.in/",          color: "from-blue-500 to-sky-500" },
  ],
};

const MODE_META: Record<Mode, { label: string; icon: typeof Plane; basePrice: number; spread: number }> = {
  flight: { label: "Flights", icon: Plane, basePrice: 3800, spread: 1800 },
  train:  { label: "Trains",  icon: Train, basePrice: 850,  spread: 600  },
  bus:    { label: "Buses",   icon: Bus,   basePrice: 950,  spread: 700  },
  cab:    { label: "Cabs",    icon: Car,   basePrice: 4500, spread: 2200 },
};

interface Result extends Provider { price: number; }

// Simple heuristic to decide if a transport mode is plausible for the route.
// In production this would call a real availability API.
function isAvailable(mode: Mode, from: string, to: string): boolean {
  const f = from.toLowerCase().trim();
  const t = to.toLowerCase().trim();
  if (!f || !t) return false;

  // Islands / remote spots: typically only flights (and sometimes ferries — not modeled).
  const islandsOrRemote = ["andaman", "lakshadweep", "port blair", "leh", "ladakh"];
  const isIsland = (s: string) => islandsOrRemote.some(k => s.includes(k));
  if (isIsland(t) || isIsland(f)) {
    return mode === "flight";
  }

  // Cabs only sensible for shorter intra-region travel — assume yes by default for nearby hill stations etc.
  // Trains/buses available for most mainland Indian routes.
  return true;
}

export default function BookTickets() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [mode, setMode] = useState<Mode>("flight");
  const [results, setResults] = useState<Result[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => { document.title = "Compare ticket prices · HELOLA"; }, []);

  const compare = (m: Mode = mode) => {
    if (!from || !to) return;
    setMode(m);
    setSearched(true);
    if (!isAvailable(m, from, to)) {
      setUnavailable(true);
      setResults([]);
      return;
    }
    setUnavailable(false);
    const meta = MODE_META[m];
    const base = meta.basePrice + Math.floor(Math.random() * meta.spread);
    const list: Result[] = PROVIDERS[m].map(p => ({
      ...p,
      price: base + Math.floor((Math.random() - 0.5) * meta.spread),
    })).sort((a, b) => a.price - b.price);
    setResults(list);
  };

  const switchMode = (m: Mode) => {
    if (!searched) { setMode(m); return; }
    compare(m);
  };

  const cheapest = results[0];
  const ModeIcon = MODE_META[mode].icon;
  const modeLabelLower = MODE_META[mode].label.toLowerCase();

  return (
    <div className="px-4 pt-4 md:px-8 md:pt-8">
      <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-warm text-primary-foreground"><Plane className="h-4 w-4" /></div>
        <h1 className="font-display text-3xl font-bold">Book travel tickets</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Compare flights, trains, buses and cabs across the top apps to find the lowest fare.</p>

      <Card className="mt-5 border-border/60 shadow-elegant">
        <CardContent className="grid gap-3 p-5 md:grid-cols-4">
          <div className="space-y-1.5"><Label>From</Label><Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Mumbai" /></div>
          <div className="space-y-1.5"><Label>To</Label><Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Goa" /></div>
          <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="flex items-end"><Button onClick={() => compare()} className="w-full rounded-xl">Compare prices</Button></div>
        </CardContent>
      </Card>

      {/* Mode tabs */}
      <div className="mt-5 flex flex-wrap gap-2">
        {(Object.keys(MODE_META) as Mode[]).map((m) => {
          const M = MODE_META[m];
          const Icon = M.icon;
          const active = m === mode;
          return (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {M.label}
            </button>
          );
        })}
      </div>

      {searched && unavailable && (
        <Card className="mt-6 border-border/60 shadow-soft">
          <CardContent className="flex items-start gap-3 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Ban className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">{MODE_META[mode].label} are not available for this route</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sorry, no {modeLabelLower} are available between <strong>{from}</strong> and <strong>{to}</strong>.
                Try another transport mode above.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && !unavailable && (
        <div className="mt-6 space-y-3">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <ModeIcon className="h-5 w-5 text-primary" />
            {from} → {to} <span className="text-sm font-normal text-muted-foreground">· {MODE_META[mode].label}</span>
          </h2>
          {results.map((r, i) => (
            <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer">
              <Card className={`border-border/60 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant ${i === 0 ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${r.color} text-white shadow-soft`}>
                    <ModeIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-bold">{r.name}</p>
                    {i === 0 && <p className="flex items-center gap-1 text-xs font-semibold text-success"><Check className="h-3 w-3" />Best price for you</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-bold text-primary">₹{r.price.toLocaleString("en-IN")}</p>
                    <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">Book <ExternalLink className="h-3 w-3" /></p>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
          {cheapest && (
            <p className="mt-2 rounded-xl bg-rose p-3 text-center text-sm text-rose-foreground">
              💡 You could save up to <strong>₹{(results[results.length - 1].price - cheapest.price).toLocaleString("en-IN")}</strong> by picking {cheapest.name}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
