import { Home, Plane, MessageCircle, User as UserIcon, Camera } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const leftItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/trips", icon: Plane, label: "Trips" },
];
const rightItems = [
  { to: "/chats", icon: MessageCircle, label: "Chats" },
  { to: "/profile", icon: UserIcon, label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();
  if (location.pathname.startsWith("/auth")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg md:hidden">
      <div className="relative mx-auto flex max-w-md items-end justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {leftItems.map(({ to, icon: Icon, label }) => (
          <TabLink key={to} to={to} Icon={Icon} label={label} />
        ))}

        {/* Raised center FAB — Moments */}
        <NavLink
          to="/moments"
          aria-label="Moments"
          className={({ isActive }) =>
            cn(
              "relative -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform active:scale-95",
              isActive && "ring-primary/30",
            )
          }
        >
          <Camera className="h-6 w-6" strokeWidth={2.2} />
        </NavLink>

        {rightItems.map(({ to, icon: Icon, label }) => (
          <TabLink key={to} to={to} Icon={Icon} label={label} />
        ))}
      </div>
    </nav>
  );
}

function TabLink({ to, Icon, label }: { to: string; Icon: any; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium transition-colors",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-all",
              isActive ? "bg-primary text-primary-foreground shadow-soft" : "",
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </span>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
