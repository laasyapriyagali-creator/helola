import { cn } from "@/lib/utils";

interface UserAvatarProps {
  url?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "?";
}

/**
 * Circular profile photo. Shows the uploaded photo when available,
 * otherwise renders a burgundy initials chip.
 */
export function UserAvatar({ url, name, size = 40, className }: UserAvatarProps) {
  const dim = { width: size, height: size };
  const fontSize = Math.max(10, Math.round(size * 0.4));

  if (url) {
    return (
      <img
        src={url}
        alt={name ? `${name}'s profile photo` : "Profile photo"}
        style={dim}
        className={cn(
          "shrink-0 rounded-full object-cover ring-2 ring-background",
          className,
        )}
        loading="lazy"
      />
    );
  }

  return (
    <div
      style={{ ...dim, fontSize }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground ring-2 ring-background",
        className,
      )}
      aria-label={name ? `${name}'s initials` : "Profile placeholder"}
    >
      {initials(name)}
    </div>
  );
}
