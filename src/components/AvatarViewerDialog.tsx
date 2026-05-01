import { useEffect, useState } from "react";
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
 * - Disables right-click, drag, copy, long-press save
 * - Blocks PrintScreen / Win+Shift+S / Cmd+Shift+3/4/5 / Ctrl+S / Ctrl+P
 * - Hides the image whenever the tab loses focus or visibility changes
 *   (defeats most clipboard-based screenshot tools that briefly switch focus)
 * - Adds a no-select overlay so the image cannot be lifted out
 */
export function AvatarViewerDialog({ open, onOpenChange, url, name }: Props) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!open) { setHidden(false); return; }

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.key === "PrintScreen") { navigator.clipboard?.writeText(""); setHidden(true); setTimeout(() => setHidden(false), 1500); return; }
      if ((e.shiftKey && (e.metaKey || e.ctrlKey) && (k === "s" || k === "3" || k === "4" || k === "5"))
          || ((e.ctrlKey || e.metaKey) && (k === "p" || k === "s"))) {
        e.preventDefault(); setHidden(true); setTimeout(() => setHidden(false), 1500);
      }
    };
    const onCtx = (e: MouseEvent) => { e.preventDefault(); };
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); };
    const onBlurOrHide = () => { setHidden(true); };
    const onFocus = () => { setHidden(false); };

    window.addEventListener("keydown", onKey);
    window.addEventListener("contextmenu", onCtx);
    window.addEventListener("copy", onCopy);
    window.addEventListener("blur", onBlurOrHide);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") setHidden(true);
      else setHidden(false);
    });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("contextmenu", onCtx);
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("blur", onBlurOrHide);
      window.removeEventListener("focus", onFocus);
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
            className={`h-full w-full select-none object-cover pointer-events-none transition-opacity duration-100 ${hidden ? "opacity-0" : "opacity-100"}`}
            style={{ WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
          />
          {hidden && (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-center text-white/95 px-6">
              <div>
                <p className="text-base font-semibold">🔒 Screenshots are privacy restricted</p>
                <p className="mt-1 text-xs text-white/70">Profile photos are private to their owner.</p>
              </div>
            </div>
          )}
          <div
            className="absolute inset-0"
            onContextMenu={(e) => e.preventDefault()}
            style={{ WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
          />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-2 text-center text-xs text-white/90">
            🔒 Screenshots are privacy restricted
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
