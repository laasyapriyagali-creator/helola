import { Plane, Home, MessageCircle, User as UserIcon, Heart, Search } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar2D } from "@/components/Avatar2D";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AvatarConfig } from "@/lib/avatar";

const items = [
  { to: "/", icon: Home, label: "Discover" },
  { to: "/trips", icon: Plane, label: "My Trips" },
  { to: "/chats", icon: MessageCircle, label: "Chats" },
  { to: "/wishlist", icon: Heart, label: "Wishlist" },
];

export function DesktopNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [avatar, setAvatar] = useState<Partial<AvatarConfig> | null>(null);

  useEffect(() => {
    if (!user) { setAvatar(null); return; }
    supabase.from("profiles").select("avatar_config").eq("id", user.id).maybeSingle()
      .then(({ data }) => setAvatar((data?.avatar_config as Partial<AvatarConfig>) || null));
  }, [user]);

  if (location.pathname.startsWith("/auth")) return null;

  return (
    <header className="sticky top-0 z-40 hidden border-b border-border bg-background/80 backdrop-blur-xl md:block">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm text-primary-foreground shadow-soft">
            <Plane className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-primary">helola</span>
        </Link>

        <nav className="flex items-center gap-1">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/?focus=search" aria-label="Search trips">
              <Search className="h-4 w-4" />
            </Link>
          </Button>
          {user ? (
            <Link to="/profile" className="flex items-center gap-2 rounded-full border border-border bg-card px-1 py-1 pr-3 transition-colors hover:bg-muted">
              <Avatar2D config={avatar} size={32} />
              <span className="text-sm font-medium">Profile</span>
            </Link>
          ) : (
            <Button asChild size="sm" className="rounded-full"><Link to="/auth">Sign in</Link></Button>
          )}
        </div>
      </div>
    </header>
  );
}
