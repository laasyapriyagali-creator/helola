import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ItineraryItem {
  day: string;
  plan: string;
  city?: string;
  place?: string;
  transport?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tripId: string;
  initial: ItineraryItem[];
  onSaved: (items: ItineraryItem[]) => void;
}

export function EditItineraryDialog({ open, onOpenChange, tripId, initial, onSaved }: Props) {
  const [items, setItems] = useState<ItineraryItem[]>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setItems(initial.length ? initial : [{ day: "Day 1", plan: "" }]); }, [open, initial]);

  const update = (i: number, patch: Partial<ItineraryItem>) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const add = () => setItems([...items, { day: `Day ${items.length + 1}`, plan: "" }]);
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };

  const save = async () => {
    setSaving(true);
    const cleaned = items
      .filter(it => (it.plan || it.place || it.city || it.transport)?.toString().trim())
      .map((it, i) => ({ ...it, day: it.day?.trim() || `Day ${i + 1}` }));
    const { error } = await supabase.from("trips").update({ itinerary: cleaned as any }).eq("id", tripId);
    setSaving(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    toast({ title: "Itinerary updated" });
    onSaved(cleaned);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit itinerary</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="rounded-xl border border-border bg-card/40 p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex flex-col">
                  <button type="button" onClick={() => move(i, -1)} className="text-muted-foreground hover:text-foreground"><GripVertical className="h-4 w-4" /></button>
                </div>
                <Input
                  value={it.day}
                  onChange={(e) => update(i, { day: e.target.value })}
                  placeholder={`Day ${i + 1}`}
                  className="h-8 max-w-[120px]"
                />
                <Input
                  value={it.city || ""}
                  onChange={(e) => update(i, { city: e.target.value })}
                  placeholder="City (optional)"
                  className="h-8"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={it.plan}
                onChange={(e) => update(i, { plan: e.target.value })}
                placeholder="What's the plan for this day?"
                rows={2}
                className="mb-2"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={it.place || ""}
                    onChange={(e) => update(i, { place: e.target.value })}
                    placeholder="Place to visit"
                    className="pl-8"
                  />
                </div>
                <Input
                  value={it.transport || ""}
                  onChange={(e) => update(i, { transport: e.target.value })}
                  placeholder="Transport (e.g. Flight 6E-203)"
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={add} className="w-full rounded-xl">
            <Plus className="mr-1 h-4 w-4" /> Add day / city
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save itinerary"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
