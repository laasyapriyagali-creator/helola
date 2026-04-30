import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string | null;
  name?: string | null;
}

/** Full-screen cover viewer with screenshot/copy protection. */
export function CoverViewerDialog({ open, onOpenChange, url, name }: Props) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!open) { setHidden(false); return; }
    const warn = () =>
      toast({ title: "Screenshots are privacy restricted", description: "Cover photos are private.", variant: "destructive" });

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.key === "PrintScreen") { warn(); navigator.clipboard?.writeText(""); setHidden(true); setTimeout(() => setHidden(false), 1500); return; }
      if ((e.shiftKey && (e.metaKey || e.ctrlKey) && (k === "s" || k === "3" || k === "4" || k === "5"))
          || ((e.ctrlKey || e.metaKey) && (k === "p" || k === "s"))) {
        e.preventDefault(); warn(); setHidden(true); setTimeout(() => setHidden(false), 1500);
      }
    };
    const onCtx = (e: MouseEvent) => { e.preventDefault(); warn(); };
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); warn(); };
    const onBlur = () => setHidden(true);
    const onFocus = () => setHidden(false);

    window.addEventListener("keydown", onKey);
    window.addEventListener("contextmenu", onCtx);
    window.addEventListener("copy", onCopy);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("contextmenu", onCtx);
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [open]);

  if (!url) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-none bg-black/95 p-0 sm:rounded-3xl">
        <DialogTitle className="sr-only">{name ? `${name}'s cover photo` : "Cover photo"}</DialogTitle>
        <div className="relative aspect-[4/1] w-full select-none">
          <img
            src={url}
            alt={name ? `${name}'s cover photo` : "Cover photo"}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            className={`h-full w-full select-none object-cover pointer-events-none transition-opacity duration-100 ${hidden ? "opacity-0" : "opacity-100"}`}
            style={{ WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
          />
          {hidden && (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-center text-white/95 px-6">
              <p className="text-sm font-semibold">🔒 Screenshots are privacy restricted</p>
            </div>
          )}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-2 text-center text-xs text-white/90">
            🔒 Screenshots are privacy restricted
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
