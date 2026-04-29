import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Full-screen white settings page used by every "My profile" sub-action.
 * Top bar: back arrow + title. Content lives on a clean white background.
 */
export function SettingsPage({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  useEffect(() => { document.title = `${title} · HELOLA`; }, [title]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-3 md:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-sans text-base font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-8">
        {children}
      </div>
    </div>
  );
}
