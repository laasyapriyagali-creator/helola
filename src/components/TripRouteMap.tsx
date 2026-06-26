import { Plane, MapPin } from "lucide-react";

interface Props {
  from: string;
  to: string;
  onClick?: () => void;
}

/**
 * Minimal, elegant trip route preview. Pure SVG — no map tiles.
 * Shows: origin dot, soft curved route, plane along the arc, pin at destination.
 */
export function TripRouteMap({ from, to, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block w-full overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card to-muted/40 p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Your route
        </p>
        <span className="text-[10px] font-medium text-muted-foreground/80 group-hover:text-primary">
          Open ›
        </span>
      </div>

      <svg viewBox="0 0 320 110" className="h-28 w-full" aria-hidden>
        <defs>
          <linearGradient id="routeStroke" x1="0" x2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* Dotted curve */}
        <path
          d="M 30 80 Q 160 -10 290 80"
          fill="none"
          stroke="url(#routeStroke)"
          strokeWidth="2"
          strokeDasharray="3 5"
          strokeLinecap="round"
        />

        {/* Origin dot */}
        <circle cx="30" cy="80" r="6" fill="hsl(var(--primary))" />
        <circle cx="30" cy="80" r="11" fill="hsl(var(--primary))" fillOpacity="0.15" />

        {/* Destination pin glow */}
        <circle cx="290" cy="80" r="11" fill="hsl(var(--primary))" fillOpacity="0.15" />

        {/* Plane along the apex of the arc */}
        <g transform="translate(160 14) rotate(0)">
          <circle r="14" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        </g>
      </svg>

      {/* Plane + pin lucide overlays for crisp rendering */}
      <div className="pointer-events-none absolute left-1/2 top-[58px] -translate-x-1/2 text-primary">
        <Plane className="h-4 w-4 rotate-45" fill="currentColor" />
      </div>
      <div className="pointer-events-none absolute right-[18px] top-[88px] text-primary">
        <MapPin className="h-5 w-5" fill="currentColor" strokeWidth={1.5} />
      </div>

      <div className="mt-2 flex items-center justify-between text-sm">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">From</p>
          <p className="truncate font-semibold text-foreground">{from}</p>
        </div>
        <div className="mx-3 h-px flex-1 bg-border" />
        <div className="min-w-0 text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">To</p>
          <p className="truncate font-semibold text-primary">{to}</p>
        </div>
      </div>
    </button>
  );
}
