import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ImagePlus, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

export function CreateMemoryDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [story, setStory] = useState("");
  const [busy, setBusy] = useState(false);

  function pickFile(f: File | null) {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  async function submit() {
    if (!user) return;
    if (!file) { toast({ title: "Add a photo first", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("memories").upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("memories").getPublicUrl(path);
      const { error: insErr } = await supabase.from("memories").insert({
        user_id: user.id,
        image_url: pub.publicUrl,
        caption: caption.trim() || null,
        story: story.trim() || null,
      });
      if (insErr) throw insErr;
      toast({ title: "Moment shared 📸" });
      setFile(null); setPreview(null); setCaption(""); setStory("");
      onCreated();
    } catch (e: any) {
      toast({ title: "Couldn't share", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Share a moment</DialogTitle></DialogHeader>

        <label className="flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/30">
          {preview ? (
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm">Tap to upload photo</span>
            </div>
          )}
          <input type="file" accept="image/*" hidden onChange={e => pickFile(e.target.files?.[0] ?? null)} />
        </label>

        <Input placeholder="Caption (one line)" value={caption} onChange={e => setCaption(e.target.value)} maxLength={140} />
        <Textarea placeholder="Write a story… (optional)" value={story} onChange={e => setStory(e.target.value)} rows={4} maxLength={2000} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !file} className="rounded-full">
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
