import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ImagePlus, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { PhotoEditorDialog } from "./PhotoEditorDialog";

const MAX_PHOTOS = 10;

interface DraftPhoto {
  id: string;       // local id
  blob: Blob;       // current edited blob
  preview: string;  // object URL
  origPreview: string; // original source URL for re-editing
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

export function CreateMemoryDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [caption, setCaption] = useState("");
  const [story, setStory] = useState("");
  const [busy, setBusy] = useState(false);

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // null = creating from new file
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // queue of new files to edit one by one
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setPhotos([]); setCaption(""); setStory("");
  }

  function handleAddFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    const arr = Array.from(files).slice(0, room);
    if (arr.length === 0) { toast({ title: `Max ${MAX_PHOTOS} photos`, variant: "destructive" }); return; }
    // Open editor on first file, queue the rest
    const [first, ...rest] = arr;
    setPendingFiles(rest);
    openEditorForFile(first);
  }

  function openEditorForFile(file: File) {
    const url = URL.createObjectURL(file);
    setEditorSrc(url);
    setEditingId(null);
    setEditorOpen(true);
  }

  function openEditorForExisting(p: DraftPhoto) {
    setEditorSrc(p.origPreview);
    setEditingId(p.id);
    setEditorOpen(true);
  }

  async function handleEditorSave(blob: Blob) {
    const preview = URL.createObjectURL(blob);
    if (editingId) {
      setPhotos(prev => prev.map(p => p.id === editingId ? { ...p, blob, preview } : p));
    } else {
      const id = crypto.randomUUID();
      setPhotos(prev => [...prev, { id, blob, preview, origPreview: editorSrc! }]);
    }
    setEditorOpen(false);
    setEditingId(null);
    // Process next queued file
    if (pendingFiles.length > 0) {
      const [next, ...rest] = pendingFiles;
      setPendingFiles(rest);
      setTimeout(() => openEditorForFile(next), 100);
    } else {
      setEditorSrc(null);
    }
  }

  function handleEditorCancel() {
    setEditorOpen(false);
    setEditingId(null);
    setEditorSrc(null);
    setPendingFiles([]); // drop the queue if user cancels
  }

  function removePhoto(id: string) {
    setPhotos(prev => prev.filter(p => p.id !== id));
  }

  function triggerReplace() {
    replaceInputRef.current?.click();
  }
  function onReplaceFile(f: File | null) {
    if (!f) return;
    const url = URL.createObjectURL(f);
    setEditorSrc(url);
    // keep editingId so save updates the same draft
  }

  async function submit() {
    if (!user) return;
    if (photos.length === 0) { toast({ title: "Add at least one photo", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const p of photos) {
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.jpg`;
        const { error: upErr } = await supabase.storage.from("memories").upload(path, p.blob, { contentType: "image/jpeg", upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("memories").getPublicUrl(path);
        urls.push(pub.publicUrl);
      }
      const { error: insErr } = await supabase.from("memories").insert({
        user_id: user.id,
        image_url: urls[0],
        media: urls.map(u => ({ type: "image", url: u })),
        caption: caption.trim() || null,
        story: story.trim() || null,
      });
      if (insErr) throw insErr;
      toast({ title: "Moment shared 📸" });
      reset();
      onCreated();
    } catch (e: any) {
      toast({ title: "Couldn't share", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Share a moment</DialogTitle></DialogHeader>

        {photos.length === 0 ? (
          <label className="flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/30">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm">Tap to add photos (up to {MAX_PHOTOS})</span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple hidden
              onChange={e => { handleAddFiles(e.target.files); e.target.value = ""; }} />
          </label>
        ) : (
          <div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos.map((p, i) => (
                <div key={p.id} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border">
                  <img src={p.preview} alt={`Photo ${i+1}`} className="h-full w-full object-cover" />
                  <button onClick={() => removePhoto(p.id)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <button onClick={() => openEditorForExisting(p)}
                    className="absolute bottom-1 left-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <Sparkles className="mr-0.5 inline h-2.5 w-2.5" /> Edit
                  </button>
                  <span className="absolute right-1 bottom-1 rounded bg-black/60 px-1 text-[10px] text-white">{i+1}/{photos.length}</span>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground">
                  <Plus className="h-5 w-5" />
                  <input type="file" accept="image/*" multiple hidden
                    onChange={e => { handleAddFiles(e.target.files); e.target.value = ""; }} />
                </label>
              )}
            </div>
          </div>
        )}

        <Input placeholder="Caption (one line)" value={caption} onChange={e => setCaption(e.target.value)} maxLength={140} />
        <Textarea placeholder="Write a story… (optional)" value={story} onChange={e => setStory(e.target.value)} rows={4} maxLength={2000} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || photos.length === 0} className="rounded-full">
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Post
          </Button>
        </div>

        {/* Hidden replace input for editor */}
        <input ref={replaceInputRef} type="file" accept="image/*" hidden
          onChange={e => { onReplaceFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />

        <PhotoEditorDialog
          open={editorOpen}
          imageSrc={editorSrc}
          onCancel={handleEditorCancel}
          onReplace={triggerReplace}
          onSave={handleEditorSave}
        />
      </DialogContent>
    </Dialog>
  );
}
