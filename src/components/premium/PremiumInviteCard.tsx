import { useState } from "react";
import { Compass, Crown, ChevronRight } from "lucide-react";
import { PremiumSheet } from "./PremiumSheet";
import { usePremium, planById, formatDate } from "@/lib/premium";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "home" | "profile";
  className?: string;
}

/**
 * Premium invite card — luxury burgundy + gold. Layout preserved; visuals refined.
 */
export function PremiumInviteCard({ variant = "home", className }: Props) {
  const [open, setOpen] = useState(false);
  const { sub, isPremium, loading } = usePremium();

  if (loading) return null;

  if (isPremium && sub) {
    const plan = planById(sub.plan);
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "group relative block w-full overflow-hidden rounded-3xl p-5 text-left text-primary-foreground transition-transform hover:-translate-y-0.5",
            "bg-gradient-to-br from-primary via-primary to-[#3d0016] ring-gold-luxe shadow-elegant",
            className
          )}
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#f4dc94]/15 blur-2xl" />
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-luxe shadow-gold">
              <Crown className="h-5 w-5 text-[#3d0016]" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-luxe">Helola Premium Member</p>
              <p className="mt-0.5 text-base font-semibold">You're on the {plan.name} plan</p>
              <p className="text-xs text-primary-foreground/70">Renews {formatDate(sub.renewal_date)}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-primary-foreground/70" />
          </div>
        </button>
        <PremiumSheet open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group relative block w-full overflow-hidden rounded-3xl p-6 text-left text-primary-foreground transition-all",
          "bg-gradient-to-br from-primary via-primary to-[#3d0016]",
          "ring-gold-luxe shadow-elegant hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-24px_rgba(92,1,32,0.75)]",
          className
        )}
      >
        {/* Ambient burgundy glow + faint gold light */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#f4dc94]/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-14 h-40 w-40 rounded-full bg-[#c9a24a]/10 blur-3xl" />

        <div className="relative flex items-start gap-4">
          {/* Emblem: compass in a gold coin */}
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-luxe shadow-gold">
            <span className="absolute inset-[3px] rounded-full ring-1 ring-black/10" />
            <Compass className="relative h-6 w-6 text-[#3d0016]" strokeWidth={2} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-luxe">
              Helola Premium
            </p>
            <p className="mt-1.5 font-display text-[1.35rem] font-semibold leading-tight tracking-tight">
              Experience Helola at Its Finest
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-primary-foreground/75">
              Members-only events, visa concierge & curated perks worldwide.
            </p>

            {/* Luxury gold CTA */}
            <span
              className={cn(
                "gold-shimmer mt-4 inline-flex items-center gap-1.5 rounded-full bg-gold-luxe px-5 py-2 text-xs font-semibold tracking-wide text-[#3d0016] shadow-gold",
                "transition-transform group-hover:scale-[1.03] group-active:scale-[0.99]"
              )}
            >
              Explore Premium
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </button>
      <PremiumSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
