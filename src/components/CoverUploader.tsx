import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
      toast({ title: "Image too large", description: "Max 25 MB.", variant: "destructive" });
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
      {/* Subtle dark overlay so buttons stay legible on any photo */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/15" />

      <div className="absolute right-3 top-3 flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="h-9 rounded-full bg-primary text-primary-foreground shadow-soft hover:bg-primary/90"
        >
          {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Camera className="mr-1 h-3.5 w-3.5" />}
          {currentUrl ? "Change cover" : "Add cover"}
        </Button>
        {currentUrl && !busy && (
          <Button
            type="button"
            size="icon"
            onClick={remove}
            className="h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-soft hover:bg-primary/90"
            aria-label="Remove background photo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
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
