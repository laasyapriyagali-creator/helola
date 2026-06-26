import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean | (() => void);
  action?: ReactNode;
  className?: string;
  sticky?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
  className,
  sticky = true,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (typeof back === "function") back();
    else navigate(-1);
  };
  return (
    <header
      className={cn(
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border",
        sticky && "sticky top-0 z-30",
        "pt-[env(safe-area-inset-top)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-3 h-14">
        {back && (
          <button
            onClick={handleBack}
            aria-label="Go back"
            className="size-11 -ml-2 flex items-center justify-center rounded-full hover:bg-muted active:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex items-center gap-1">{action}</div>}
      </div>
    </header>
  );
}
