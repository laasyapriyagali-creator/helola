import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Eye, Image as ImageIcon, Loader2, Pencil, Trash2 } from "lucide-react";
import { CoverEditorDialog } from "@/components/CoverEditorDialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Props {
  userId: string;
  currentUrl: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  /** Hide the inline top-right buttons; rely on hidden triggers driven from outside. */
  compact?: boolean;
  /** Called when the user taps the cover image to view it full-size. */
  onView?: () => void;
}

const MAX_BYTES = 25 * 1024 * 1024;

export function CoverUploader({ userId, currentUrl, onChange, className, compact = false, onView }: Props) {
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
        <button
          type="button"
          onClick={onView}
          className="block h-full w-full focus:outline-none"
          aria-label="View cover photo"
        >
          <img src={currentUrl} alt="Profile background" className="h-full w-full object-cover" draggable={false} />
        </button>
      ) : (
        <div className="h-full w-full bg-primary bg-texture-hero" />
      )}
      {/* Subtle dark overlay for button legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

      {!compact && (
        <div className="absolute right-3 top-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={busy}
              aria-label="Edit cover photo"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-primary shadow-soft backdrop-blur transition hover:bg-background disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {currentUrl && (
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onView?.(); }}>
                  <Eye className="mr-2 h-4 w-4" /> View photo
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={openPicker}>
                <ImageIcon className="mr-2 h-4 w-4" /> {currentUrl ? "Change photo" : "Add photo"}
              </DropdownMenuItem>
              {currentUrl && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={remove} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Remove photo
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
