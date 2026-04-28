import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/UserAvatar";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { AvatarEditorDialog } from "@/components/AvatarEditorDialog";

interface AvatarUploaderProps {
  userId: string;
  currentUrl: string | null;
  fullName: string | null;
  onChange: (url: string | null) => void;
  size?: number;
  onView?: () => void;
  /** Hide the inline action buttons (Change/Edit/Remove) and only show the camera FAB. */
  compact?: boolean;
}

const MAX_BYTES = 25 * 1024 * 1024;

export function AvatarUploader({
  userId,
  currentUrl,
  fullName,
  onChange,
  size = 108,
  onView,
  compact = false,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [editorSrc, setEditorSrc] = useState<string | null>(null);

  const openPicker = () => inputRef.current?.click();

  const editExisting = () => {
    if (currentUrl) setEditorSrc(currentUrl);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Pick an image file", variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "Image too large", description: "Max 25 MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setEditorSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadBlob = async (blob: Blob) => {
    setBusy(true);
    try {
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);
      if (dbErr) throw dbErr;

      onChange(publicUrl);
      setEditorSrc(null);
      toast({ title: "Profile photo updated ✨" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);
      if (error) throw error;
      onChange(null);
      toast({ title: "Photo removed" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't remove photo";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="relative">
        {onView && currentUrl ? (
          <button
            type="button"
            onClick={onView}
            className="block rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="View profile photo"
          >
            <UserAvatar url={currentUrl} name={fullName} size={size} />
          </button>
        ) : (
          <UserAvatar url={currentUrl} name={fullName} size={size} />
        )}
        <button
          type="button"
          onClick={openPicker}
          disabled={busy}
          className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elegant ring-2 ring-background transition-transform hover:scale-105 disabled:opacity-60"
          aria-label="Upload profile photo"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </button>
      </div>
      {!compact && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            onClick={openPicker}
            disabled={busy}
          >
            <Camera className="mr-1 h-3.5 w-3.5" />
            {currentUrl ? "Change photo" : "Upload photo"}
          </Button>
          {currentUrl && (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={editExisting}
                disabled={busy}
              >
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={remove}
                disabled={busy}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Remove
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
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <AvatarEditorDialog
        open={!!editorSrc}
        imageSrc={editorSrc}
        onCancel={() => setEditorSrc(null)}
        onSave={uploadBlob}
      />
    </div>
  );
}
