import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Prefs {
  trip_updates: boolean;
  group_chat: boolean;
  new_trip_alerts: boolean;
  offers_promotions: boolean;
}

const FIELDS: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: "trip_updates", label: "Trip updates", desc: "Itinerary, payments, member changes." },
  { key: "group_chat", label: "Group chat messages", desc: "New messages from your trip groups." },
  { key: "new_trip_alerts", label: "New trip alerts", desc: "When trips that match your interests appear." },
  { key: "offers_promotions", label: "Offers & promotions", desc: "Discounts, seasonal deals, partner offers." },
];

export function NotificationDialog({ open, onOpenChange, focusKey }: { open: boolean; onOpenChange: (v: boolean) => void; focusKey?: keyof Prefs }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>({ trip_updates: true, group_chat: true, new_trip_alerts: true, offers_promotions: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("notification_prefs").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setPrefs({ trip_updates: data.trip_updates, group_chat: data.group_chat, new_trip_alerts: data.new_trip_alerts, offers_promotions: data.offers_promotions });
    });
  }, [open, user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("notification_prefs").upsert({ user_id: user.id, ...prefs });
    setBusy(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    toast({ title: "Notifications updated" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Notifications</DialogTitle><DialogDescription>Choose what you'd like to hear about.</DialogDescription></DialogHeader>
        <div className="space-y-2 py-2">
          {FIELDS.map(f => (
            <div key={f.key} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${focusKey === f.key ? "border-primary bg-primary/5" : "border-border"}`}>
              <div><Label className="text-sm font-medium">{f.label}</Label><p className="text-xs text-muted-foreground">{f.desc}</p></div>
              <Switch checked={prefs[f.key]} onCheckedChange={(v) => setPrefs(p => ({ ...p, [f.key]: v }))} />
            </div>
          ))}
        </div>
        <DialogFooter><Button onClick={save} disabled={busy} className="rounded-full">{busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
