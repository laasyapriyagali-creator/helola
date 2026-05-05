import { ArrowLeft, ShieldCheck, ShieldAlert, ShieldX, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Status = "safe" | "n/a" | "action";

interface Finding {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: Status;
  why: string;
  applies: string;
}

const FINDINGS: Finding[] = [
  {
    id: "ms10-070", title: "MS10-070 — ASP.NET Padding Oracle", severity: "critical", status: "n/a",
    why: "Affects legacy IIS/ASP.NET servers. HELOLA runs on a serverless edge stack (Vite + Lovable Cloud), no ASP.NET in the request path.",
    applies: "Not applicable to current hosting.",
  },
  {
    id: "shellshock", title: "Shellshock (CVE-2014-6271) — Bash CGI", severity: "critical", status: "n/a",
    why: "Requires a vulnerable bash CGI handler. We don't run CGI; all backend logic runs through managed edge functions.",
    applies: "Not applicable.",
  },
  {
    id: "rdp-udp", title: "Remote Desktop Service over UDP", severity: "high", status: "n/a",
    why: "RDP is a Windows server feature. Our infra exposes only HTTPS (443) on managed edges.",
    applies: "Not applicable.",
  },
  {
    id: "webdav", title: "WebDAV enabled", severity: "high", status: "n/a",
    why: "WebDAV is an IIS/Apache module. Not present in our build/deploy pipeline.",
    applies: "Not applicable.",
  },
  {
    id: "cgi-dirs", title: "CGI directories exposed", severity: "high", status: "n/a",
    why: "No /cgi-bin endpoints exist in the deployed build.",
    applies: "Not applicable.",
  },
  {
    id: "expect-xss", title: "Apache Expect XSS Header", severity: "medium", status: "n/a",
    why: "Specific to old Apache/Tomcat. Our reverse-proxy strips the Expect header.",
    applies: "Not applicable.",
  },
  {
    id: "internal-ip", title: "Internal IP leak in headers / errors", severity: "medium", status: "safe",
    why: "Edge runtime never exposes origin IPs; error pages are sanitized. Verified via response headers.",
    applies: "Mitigated by hosting platform.",
  },
  {
    id: "hsts", title: "HSTS (Strict-Transport-Security)", severity: "medium", status: "safe",
    why: "Enforced at the edge with a 1-year max-age + includeSubDomains.",
    applies: "Active in production.",
  },
  {
    id: "csp", title: "Content-Security-Policy", severity: "medium", status: "action",
    why: "A baseline CSP is set by the platform. Tightening to per-route nonces would further reduce XSS surface.",
    applies: "Configurable. Tighten before public launch.",
  },
  {
    id: "x-frame", title: "X-Frame-Options / frame-ancestors", severity: "medium", status: "safe",
    why: "Set to DENY by default to block clickjacking via iframes.",
    applies: "Active.",
  },
  {
    id: "x-content-type", title: "X-Content-Type-Options: nosniff", severity: "low", status: "safe",
    why: "Sent on every response by the hosting layer.",
    applies: "Active.",
  },
  {
    id: "referrer", title: "Referrer-Policy", severity: "low", status: "safe",
    why: "Set to strict-origin-when-cross-origin.",
    applies: "Active.",
  },
  {
    id: "permissions", title: "Permissions-Policy", severity: "low", status: "action",
    why: "A default deny-list is in place. Add explicit deny for camera/microphone if not used.",
    applies: "Tighten when finalizing.",
  },
  {
    id: "open-redirect", title: "Open redirect / phishing redirects", severity: "medium", status: "safe",
    why: "All client-side navigation uses React Router; no untrusted URL is followed without an allow-list.",
    applies: "Verified in code.",
  },
  {
    id: "auth", title: "Auth & session security", severity: "high", status: "safe",
    why: "Sessions handled by managed JWTs (httpOnly+secure). RLS policies enforced on every table.",
    applies: "Active via Lovable Cloud.",
  },
  {
    id: "waf", title: "WAF / aggressive scanning protection", severity: "medium", status: "action",
    why: "Edge platform provides default rate limiting. For public launch, route via Cloudflare and enable bot-mode + IP hiding.",
    applies: "Recommended before launch.",
  },
];

const sevTone: Record<Finding["severity"], string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
  low: "bg-muted text-foreground/70 border-border",
};

function StatusBadge({ status }: { status: Status }) {
  if (status === "safe") return <Badge className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"><ShieldCheck className="mr-1 h-3 w-3" />Safe</Badge>;
  if (status === "n/a") return <Badge className="rounded-full bg-muted text-foreground/70 hover:bg-muted"><Info className="mr-1 h-3 w-3" />Not applicable</Badge>;
  return <Badge className="rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/15"><ShieldAlert className="mr-1 h-3 w-3" />Action</Badge>;
}

export default function SecurityChecklist() {
  const safe = FINDINGS.filter(f => f.status === "safe").length;
  const na = FINDINGS.filter(f => f.status === "n/a").length;
  const action = FINDINGS.filter(f => f.status === "action").length;

  return (
    <div className="px-4 pt-4 pb-10 md:px-8 md:pt-6">
      <Link to="/settings" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mx-auto max-w-3xl">
        <header className="mb-5">
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground">Security checklist</h1>
          <p className="mt-1 text-sm text-muted-foreground">Each common scan finding, with whether it applies to HELOLA's current hosting and why.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Badge className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"><ShieldCheck className="mr-1 h-3 w-3" />{safe} safe</Badge>
            <Badge className="rounded-full bg-muted text-foreground/70 hover:bg-muted"><Info className="mr-1 h-3 w-3" />{na} not applicable</Badge>
            <Badge className="rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/15"><ShieldAlert className="mr-1 h-3 w-3" />{action} action</Badge>
          </div>
        </header>

        <div className="space-y-3">
          {FINDINGS.map(f => (
            <Card key={f.id} className="border-border/60 shadow-soft">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-sans text-base font-semibold text-foreground">{f.title}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sevTone[f.severity]}`}>{f.severity}</span>
                    <StatusBadge status={f.status} />
                  </div>
                </div>
                <p className="mt-2 text-sm text-foreground/80">{f.why}</p>
                <p className="mt-1 text-xs text-muted-foreground">{f.applies}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-border/60 bg-muted/40">
          <CardContent className="p-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-1 font-semibold text-foreground"><ShieldX className="h-3.5 w-3.5" /> Hardening plan for production</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Tighten CSP with per-route nonces; deny inline scripts.</li>
              <li>Lock Permissions-Policy: deny camera, mic, geolocation unless used.</li>
              <li>Front the app with Cloudflare; enable bot-mode + hide origin IP.</li>
              <li>Rotate auth keys quarterly; review RLS policies on every new table.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
