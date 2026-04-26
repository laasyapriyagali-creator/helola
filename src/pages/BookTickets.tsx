import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plane, ExternalLink, Check } from "lucide-react";

const PROVIDERS = [
  { name: "MakeMyTrip", url: "https://www.makemytrip.com/", color: "from-red-500 to-rose-500" },
  { name: "Goibibo", url: "https://www.goibibo.com/", color: "from-orange-500 to-amber-500" },
  { name: "ixigo", url: "https://www.ixigo.com/", color: "from-amber-500 to-yellow-500" },
  { name: "Yatra", url: "https://www.yatra.com/", color: "from-rose-500 to-pink-500" },
  { name: "EaseMyTrip", url: "https://www.easemytrip.com/", color: "from-blue-500 to-sky-500" },
  { name: "Cleartrip", url: "https://www.cleartrip.com/", color: "from-emerald-500 to-teal-500" },
];

export default function BookTickets() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState<{ name: string; price: number; url: string; color: string }[]>([]);

  useEffect(() => { document.title = "Compare ticket prices · HELOLA"; }, []);

  const compare = () => {
    // Mock comparison — in production this would hit a real price-aggregation API
    if (!from || !to) return;
    const base = 3500 + Math.floor(Math.random() * 1500);
    const list = PROVIDERS.map(p => ({
      ...p,
      price: base + Math.floor((Math.random() - 0.5) * 1800),
    })).sort((a, b) => a.price - b.price);
    setResults(list);
  };

  const cheapest = results[0];

  return (
    <div className="px-4 pt-4 md:px-8 md:pt-8">
      <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-warm text-primary-foreground"><Plane className="h-4 w-4" /></div>
        <h1 className="font-display text-3xl font-bold">Book travel tickets</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">We compare top apps to find you the lowest price.</p>

      <Card className="mt-5 border-border/60 shadow-elegant">
        <CardContent className="grid gap-3 p-5 md:grid-cols-4">
          <div className="space-y-1.5"><Label>From</Label><Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Mumbai" /></div>
          <div className="space-y-1.5"><Label>To</Label><Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Goa" /></div>
          <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="flex items-end"><Button onClick={compare} className="w-full rounded-xl">Compare prices</Button></div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="font-display text-xl font-semibold">{from} → {to}</h2>
          {results.map((r, i) => (
            <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer">
              <Card className={`border-border/60 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant ${i === 0 ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${r.color} text-white shadow-soft`}>
                    <Plane className="h-5 w-5" />
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
