import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type FocusKey = "location" | "destinations" | "budget" | "interests";

export function PreferencesDialog({ open, onOpenChange, focusKey }: { open: boolean; onOpenChange: (v: boolean) => void; focusKey?: FocusKey }) {
  const { user } = useAuth();
  const [locationAccess, setLocationAccess] = useState(false);
  const [destinationsText, setDestinationsText] = useState("");
  const [budgetMin, setBudgetMin] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");
  const [interestsText, setInterestsText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("travel_prefs").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setLocationAccess(data.location_access);
      setDestinationsText((data.preferred_destinations || []).join(", "));
      setBudgetMin(data.budget_min?.toString() || "");
      setBudgetMax(data.budget_max?.toString() || "");
      setInterestsText((data.travel_interests || []).join(", "));
    });
  }, [open, user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const payload = {
      user_id: user.id,
      location_access: locationAccess,
      preferred_destinations: destinationsText.split(",").map(s => s.trim()).filter(Boolean),
      budget_min: budgetMin ? Number(budgetMin) : null,
      budget_max: budgetMax ? Number(budgetMax) : null,
      travel_interests: interestsText.split(",").map(s => s.trim()).filter(Boolean),
    };
    const { error } = await supabase.from("travel_prefs").upsert(payload);
    if (locationAccess && navigator.geolocation) navigator.geolocation.getCurrentPosition(() => {}, () => {});
    setBusy(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    toast({ title: "Preferences saved" });
    onOpenChange(false);
  };

  const ring = (k: FocusKey) => focusKey === k ? "ring-2 ring-primary" : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Travel preferences</DialogTitle><DialogDescription>Help us recommend trips you'll love.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className={`flex items-center justify-between gap-3 rounded-xl border border-border p-3 ${ring("location")}`}>
            <div><Label className="text-sm font-medium">Location access</Label><p className="text-xs text-muted-foreground">Show trips near you.</p></div>
            <Switch checked={locationAccess} onCheckedChange={setLocationAccess} />
          </div>
          <div className={`space-y-1.5 rounded-xl ${ring("destinations")} ${focusKey === "destinations" ? "p-3" : ""}`}>
            <Label>Preferred destinations</Label>
            <Input value={destinationsText} onChange={(e) => setDestinationsText(e.target.value)} placeholder="Goa, Bali, Iceland..." />
            <p className="text-xs text-muted-foreground">Comma separated.</p>
          </div>
          <div className={`space-y-1.5 rounded-xl ${ring("budget")} ${focusKey === "budget" ? "p-3" : ""}`}>
            <Label>Budget range (₹)</Label>
            <div className="flex gap-2">
              <Input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="Min" />
              <Input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="Max" />
            </div>
          </div>
          <div className={`space-y-1.5 rounded-xl ${ring("interests")} ${focusKey === "interests" ? "p-3" : ""}`}>
            <Label>Travel interests</Label>
            <Input value={interestsText} onChange={(e) => setInterestsText(e.target.value)} placeholder="Adventure, beaches, food, culture..." />
          </div>
        </div>
        <DialogFooter><Button onClick={save} disabled={busy} className="rounded-full">{busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
