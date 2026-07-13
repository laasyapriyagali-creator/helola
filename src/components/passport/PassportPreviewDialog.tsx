import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Star } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function PassportPreviewDialog({ open, onOpenChange }: Props) {
  const handleNotify = () => {
    toast.success("We'll let you know the moment HELOLA Passport is ready.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        {/* Midnight header echoing the cover */}
        <div className="relative bg-[#020617] px-6 py-6 text-center">
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice">
              <g fill="#f8fafc">
                <circle cx="40" cy="30" r="1" className="animate-pulse" style={{ animationDuration: "3s" }} />
                <circle cx="120" cy="60" r="1.5" className="animate-pulse" style={{ animationDelay: "1s", animationDuration: "4s" }} />
                <circle cx="200" cy="20" r="1" className="animate-pulse" style={{ animationDuration: "5s" }} />
                <circle cx="300" cy="80" r="1.2" className="animate-pulse" style={{ animationDelay: "0.5s", animationDuration: "3.5s" }} />
                <circle cx="360" cy="40" r="1" className="animate-pulse" style={{ animationDelay: "2s", animationDuration: "6s" }} />
              </g>
            </svg>
          </div>
          <DialogHeader className="relative">
            <DialogTitle className="font-display text-2xl font-bold tracking-tight bg-gradient-to-b from-white via-slate-300 to-slate-500 bg-clip-text text-transparent">
              🛂 HELOLA Passport
            </DialogTitle>
          </DialogHeader>
          <div className="relative mt-3 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-slate-500/60" />
            <Star className="h-3 w-3 text-slate-300" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-slate-500/60" />
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-6">
          <p className="font-display text-lg italic text-primary">
            Every journey tells a story.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Soon, every completed trip will automatically become part of your personal travel passport. You'll collect destination stamps, preserve memories, unlock travel achievements, revisit your travel timeline, reconnect with people you've traveled with, and relive every adventure through AI-generated journals and memories.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            In the future, you'll also be able to order a beautifully printed hardcover version of your passport to keep your travel story forever.
          </p>
        </div>

        <DialogFooter className="gap-2 px-6 pb-6 sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleNotify} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Notify Me
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
