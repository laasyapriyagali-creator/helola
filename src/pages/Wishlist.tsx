import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Item { id: string; destination: string; start_date: string; price_per_person: number; }

export default function Wishlist() {
  const { user, loading: al } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Wishlist · HELOLA"; }, []);
  useEffect(() => { if (!al && !user) navigate("/auth"); }, [user, al, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: w } = await supabase.from("wishlists").select("trip_id").eq("user_id", user.id);
      const ids = (w ?? []).map(x => x.trip_id);
      if (!ids.length) { setItems([]); setLoading(false); return; }
      const { data: ts } = await supabase.from("trips").select("id,destination,start_date,price_per_person").in("id", ids);
      setItems((ts ?? []) as Item[]);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="px-4 pt-6 md:px-8 md:pt-10">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Wishlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">Trips you've saved for later.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {loading ? [1,2].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />) :
         items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center md:col-span-3">
            <Heart className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">Your wishlist is empty</p>
            <Button asChild className="mt-4 rounded-full"><Link to="/">Browse trips</Link></Button>
          </div>
        ) : items.map(t => (
          <Link key={t.id} to={`/trips/${t.id}`}>
            <Card className="border-border/60 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose text-rose-foreground">
                  <Heart className="h-5 w-5 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold">{t.destination}</p>
                  <p className="text-xs text-muted-foreground"><Calendar className="mr-1 inline h-3 w-3" />{new Date(t.start_date).toLocaleDateString("en-IN", { month: "long", day: "numeric" })}</p>
                </div>
                <p className="font-display text-lg font-bold text-primary">₹{Number(t.price_per_person).toLocaleString("en-IN")}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
