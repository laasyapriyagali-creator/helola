import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  memoryId: string | null;
  initialCaption: string | null;
  initialStory: string | null;
  onSaved: () => void;
}

export function EditMemoryDialog({ open, onOpenChange, memoryId, initialCaption, initialStory, onSaved }: Props) {
  const [caption, setCaption] = useState("");
  const [story, setStory] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCaption(initialCaption ?? "");
    setStory(initialStory ?? "");
  }, [memoryId, initialCaption, initialStory, open]);

  async function save() {
    if (!memoryId) return;
    setBusy(true);
    const { error } = await supabase.from("memories").update({
      caption: caption.trim() || null,
      story: story.trim() || null,
    }).eq("id", memoryId);
    setBusy(false);
    if (error) { toast({ title: "Couldn't save", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated" });
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit moment</DialogTitle></DialogHeader>
        <Input placeholder="Caption" value={caption} onChange={e => setCaption(e.target.value)} maxLength={140} />
        <Textarea placeholder="Story" value={story} onChange={e => setStory(e.target.value)} rows={5} maxLength={2000} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy} className="rounded-full">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
