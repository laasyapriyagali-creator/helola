import { useState } from "react";
import { PassportPreviewDialog } from "./PassportPreviewDialog";

export function PassportCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open HELOLA Passport preview"
        className="group relative block w-full aspect-[16/10] overflow-hidden rounded-2xl bg-[#020617] ring-1 ring-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_40px_rgba(30,41,59,0.3)] transition-all duration-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
      >
        {/* Constellation background */}
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <svg width="100%" height="100%" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <g stroke="#94a3b8" strokeWidth="0.5" fill="none" opacity="0.6">
              <path d="M100,80 L180,120 L160,200 L120,240" />
              <path d="M600,100 L680,60 L750,110 L720,180 Z" />
              <path d="M150,400 L220,350 L300,380 L320,450" />
              <path d="M550,420 L620,380 L680,410" />
            </g>
            <g fill="#f8fafc">
              <circle cx="100" cy="80" r="1.5" className="animate-pulse" style={{ animationDuration: "3s" }} />
              <circle cx="180" cy="120" r="2" className="animate-pulse" style={{ animationDelay: "1.2s", animationDuration: "4s" }} />
              <circle cx="160" cy="200" r="1.5" className="animate-pulse" style={{ animationDelay: "0.5s", animationDuration: "3.5s" }} />
              <circle cx="120" cy="240" r="1" className="animate-pulse" style={{ animationDelay: "2.1s", animationDuration: "5s" }} />
              <circle cx="600" cy="100" r="2" className="animate-pulse" style={{ animationDuration: "3.8s" }} />
              <circle cx="680" cy="60" r="1.5" className="animate-pulse" style={{ animationDelay: "0.8s", animationDuration: "3.2s" }} />
              <circle cx="750" cy="110" r="2" className="animate-pulse" style={{ animationDelay: "1.5s", animationDuration: "4.5s" }} />
              <circle cx="720" cy="180" r="1.5" className="animate-pulse" style={{ animationDelay: "2.5s", animationDuration: "3s" }} />
              <circle cx="150" cy="400" r="1.5" className="animate-pulse" style={{ animationDuration: "4.2s" }} />
              <circle cx="220" cy="350" r="2" className="animate-pulse" style={{ animationDelay: "0.4s", animationDuration: "3.6s" }} />
              <circle cx="300" cy="380" r="1.5" className="animate-pulse" style={{ animationDelay: "1.8s", animationDuration: "5s" }} />
              <circle cx="320" cy="450" r="1" className="animate-pulse" style={{ animationDelay: "0.2s", animationDuration: "4s" }} />
              <circle cx="550" cy="420" r="1.5" className="animate-pulse" style={{ animationDuration: "3.4s" }} />
              <circle cx="620" cy="380" r="2" className="animate-pulse" style={{ animationDelay: "1.1s", animationDuration: "4.8s" }} />
              <circle cx="680" cy="410" r="1.5" className="animate-pulse" style={{ animationDelay: "2.2s", animationDuration: "3s" }} />
              <circle cx="400" cy="150" r="0.5" opacity="0.5" className="animate-pulse" style={{ animationDuration: "6s" }} />
              <circle cx="250" cy="50" r="0.5" opacity="0.5" className="animate-pulse" style={{ animationDelay: "1s", animationDuration: "7s" }} />
              <circle cx="500" cy="280" r="0.5" opacity="0.5" className="animate-pulse" style={{ animationDelay: "3s", animationDuration: "5.5s" }} />
              <circle cx="50" cy="300" r="0.5" opacity="0.5" className="animate-pulse" style={{ animationDelay: "2s", animationDuration: "8s" }} />
              <circle cx="780" cy="450" r="0.5" opacity="0.5" className="animate-pulse" style={{ animationDelay: "0.5s", animationDuration: "6.5s" }} />
            </g>
          </svg>
        </div>

        {/* North star bottom-right */}
        <div className="pointer-events-none absolute bottom-6 right-6 opacity-40 sm:bottom-8 sm:right-10">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="0.5" className="animate-pulse" style={{ animationDuration: "4s" }}>
            <path d="M12 2L13 9L20 10L13 11L12 18L11 11L4 10L11 9L12 2Z" fill="#f8fafc" fillOpacity="0.1" />
            <circle cx="12" cy="10" r="4" strokeDasharray="1 2" />
          </svg>
        </div>

        {/* Coordinates top-left */}
        <div className="pointer-events-none absolute left-5 top-5 opacity-40 sm:left-8 sm:top-6 text-left">
          <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.3em] text-slate-100 sm:text-[9px]">Origin</div>
          <div className="font-mono text-[10px] font-light text-slate-100 sm:text-[11px]">51.5074° N, 0.1278° W</div>
        </div>

        {/* Spine */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-white/10 to-transparent" />

        {/* In Development badge top-right */}
        <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 backdrop-blur-md sm:right-8">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-300" />
          <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-100">In Development</span>
        </div>

        {/* Title + tagline */}
        <div className="relative flex h-full w-full flex-col items-center justify-center px-6 text-center">
          <h3 className="font-display text-3xl font-bold tracking-tight bg-gradient-to-b from-white via-slate-300 to-slate-500 bg-clip-text text-transparent sm:text-4xl md:text-5xl">
            HELOLA Passport
          </h3>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="h-px w-6 bg-slate-600 sm:w-8" />
            <p className="font-display text-[11px] italic tracking-wider text-slate-400 sm:text-sm">
              Your adventures, beautifully preserved.
            </p>
            <span className="h-px w-6 bg-slate-600 sm:w-8" />
          </div>
          <div className="absolute bottom-6 left-1/2 h-px w-20 -translate-x-1/2 bg-gradient-to-r from-transparent via-slate-500/30 to-transparent sm:w-24" />
        </div>

        {/* Shimmer sweep */}
        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-tr from-transparent via-white/5 to-transparent transition-transform duration-[1500ms] ease-in-out group-hover:translate-x-full" />
      </button>

      <PassportPreviewDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
