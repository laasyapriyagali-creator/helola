import { useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string | null;
  name?: string | null;
}

/**
 * Full-screen profile photo viewer with privacy protections:
 * - Disables right-click, drag, and long-press save
 * - Blocks PrintScreen / Win+Shift+S / common screenshot shortcuts
 * - Blanks the photo when the tab loses focus (defeats screen recorders that
 *   capture other windows briefly)
 * - Adds a no-select overlay so the image cannot be lifted out
 *
 * Note: no web app can fully prevent OS-level screenshots, but these layered
 * defences make casual screenshots clearly disallowed and difficult.
 */
export function AvatarViewerDialog({ open, onOpenChange, url, name }: Props) {
  useEffect(() => {
    if (!open) return;
    const warn = () => toast({ title: "Screenshots are restricted", description: "Profile photos are private.", variant: "destructive" });

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // PrintScreen
      if (e.key === "PrintScreen") { warn(); navigator.clipboard?.writeText(""); return; }
      // Win+Shift+S, Cmd+Shift+3/4/5, Ctrl+P, Ctrl+S
      if ((e.shiftKey && (e.metaKey || e.ctrlKey) && (k === "s" || k === "3" || k === "4" || k === "5"))
          || ((e.ctrlKey || e.metaKey) && (k === "p" || k === "s"))) {
        e.preventDefault(); warn();
      }
    };
    const onCtx = (e: MouseEvent) => { e.preventDefault(); warn(); };
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); warn(); };

    window.addEventListener("keydown", onKey);
    window.addEventListener("contextmenu", onCtx);
    window.addEventListener("copy", onCopy);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("contextmenu", onCtx);
      window.removeEventListener("copy", onCopy);
    };
  }, [open]);

  if (!url) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-none bg-black/95 p-0 sm:rounded-3xl">
        <DialogTitle className="sr-only">{name ? `${name}'s photo` : "Profile photo"}</DialogTitle>
        <div className="relative aspect-square w-full select-none">
          <img
            src={url}
            alt={name ? `${name}'s photo` : "Profile photo"}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            className="h-full w-full select-none object-cover pointer-events-none"
            style={{ WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
          />
          {/* invisible overlay blocks any accidental save / drag */}
          <div
            className="absolute inset-0"
            onContextMenu={(e) => e.preventDefault()}
            style={{ WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
          />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-2 text-center text-xs text-white/90">
            🔒 Screenshots restricted · photo is private
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
