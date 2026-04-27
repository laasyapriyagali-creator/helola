import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Camera, Loader2, Trash2 } from "lucide-react";

interface Props {
  userId: string;
  currentUrl: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}

const MAX_BYTES = 25 * 1024 * 1024;

export function CoverUploader({ userId, currentUrl, onChange, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Pick an image file", variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "Image too large", description: "Max 8 MB.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${userId}/cover-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ cover_url: publicUrl })
        .eq("id", userId);
      if (dbErr) throw dbErr;
      onChange(publicUrl);
      toast({ title: "Background updated ✨" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
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
      toast({ title: "Background removed" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Couldn't remove",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`relative ${className || ""}`}>
      {currentUrl ? (
        <img src={currentUrl} alt="Profile background" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-primary bg-texture-hero" />
      )}
      <div className="absolute right-3 top-3 flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-9 items-center gap-1.5 rounded-full bg-background/90 px-3 text-xs font-semibold text-foreground shadow-soft backdrop-blur transition-transform hover:scale-105 disabled:opacity-60"
          aria-label="Change background photo"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          {currentUrl ? "Change cover" : "Add cover"}
        </button>
        {currentUrl && !busy && (
          <button
            type="button"
            onClick={remove}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft backdrop-blur transition-transform hover:scale-105"
            aria-label="Remove background photo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
