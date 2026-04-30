import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Camera, Loader2, Pencil, Trash2 } from "lucide-react";
import { CoverEditorDialog } from "@/components/CoverEditorDialog";

interface Props {
  userId: string;
  currentUrl: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  /** Hide the inline top-right buttons; rely on hidden triggers driven from outside. */
  compact?: boolean;
}

const MAX_BYTES = 25 * 1024 * 1024;

export function CoverUploader({ userId, currentUrl, onChange, className, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [editorSrc, setEditorSrc] = useState<string | null>(null);

  const openPicker = () => inputRef.current?.click();
  const editExisting = () => { if (currentUrl) setEditorSrc(currentUrl); };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast({ title: "Pick an image file", variant: "destructive" }); return; }
    if (file.size > MAX_BYTES) { toast({ title: "Image too large", description: "Max 25 MB.", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = () => setEditorSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadBlob = async (blob: Blob) => {
    setBusy(true);
    try {
      const path = `${userId}/cover-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      const { error: dbErr } = await supabase.from("profiles").update({ cover_url: publicUrl }).eq("id", userId);
      if (dbErr) throw dbErr;
      onChange(publicUrl);
      setEditorSrc(null);
      toast({ title: "Cover updated ✨" });
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.from("profiles").update({ cover_url: null }).eq("id", userId);
      if (error) throw error;
      onChange(null);
      toast({ title: "Cover removed" });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Couldn't remove", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className={`relative ${className || ""}`}>
      {currentUrl ? (
        <img src={currentUrl} alt="Profile background" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-primary bg-texture-hero" />
      )}
      {/* Subtle dark overlay for button legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

      {!compact && (
        <div className="absolute right-4 top-4 flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={openPicker}
            disabled={busy}
            className="h-9 rounded-full bg-primary px-4 text-primary-foreground shadow-soft hover:bg-primary/90"
          >
            {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Camera className="mr-1 h-3.5 w-3.5" />}
            {currentUrl ? "Change cover" : "Add cover"}
          </Button>
          {currentUrl && !busy && (
            <>
              <Button
                type="button"
                size="icon"
                onClick={editExisting}
                className="h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-soft hover:bg-primary/90"
                aria-label="Edit cover"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                onClick={remove}
                className="h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-soft hover:bg-primary/90"
                aria-label="Remove background photo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {/* External triggers */}
      <button id="cover-change-trigger" type="button" className="hidden" onClick={openPicker} aria-hidden />
      <button id="cover-edit-trigger" type="button" className="hidden" onClick={editExisting} aria-hidden />
      <button id="cover-remove-trigger" type="button" className="hidden" onClick={remove} aria-hidden />

      <CoverEditorDialog
        open={!!editorSrc}
        imageSrc={editorSrc}
        onCancel={() => setEditorSrc(null)}
        onSave={uploadBlob}
      />
    </div>
  );
}
