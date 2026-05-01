import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Camera, Trash2, User, FileText, MapPin, Sliders } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  hasPhoto: boolean;
}

/**
 * Bottom sheet shown when the user taps "Edit Profile".
 * Triggers existing hidden buttons in the page for photo actions, and
 * navigates to existing settings sub-pages for text fields.
 */
export function EditProfileSheet({ open, onOpenChange, hasPhoto }: Props) {
  const navigate = useNavigate();

  const close = () => onOpenChange(false);
  const trigger = (id: string) => {
    close();
    setTimeout(() => document.getElementById(id)?.click(), 50);
  };
  const go = (to: string) => { close(); navigate(to); };

  const Item = ({ icon, label, onClick, danger = false }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left transition-colors hover:bg-muted ${danger ? "text-destructive" : "text-foreground"}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-6 pt-3">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        <SheetHeader className="mb-2">
          <SheetTitle className="text-center text-base">Edit profile</SheetTitle>
        </SheetHeader>
        <div className="space-y-1">
          <Item icon={<Camera className="h-5 w-5" />} label="Change profile photo" onClick={() => trigger("avatar-change-trigger")} />
          {hasPhoto && (
            <Item icon={<Trash2 className="h-5 w-5" />} label="Remove profile photo" onClick={() => trigger("avatar-remove-trigger")} danger />
          )}
          <Item icon={<User className="h-5 w-5" />} label="Edit name" onClick={() => go("/settings/edit-profile")} />
          <Item icon={<FileText className="h-5 w-5" />} label="Edit bio" onClick={() => go("/settings/edit-profile")} />
          <Item icon={<MapPin className="h-5 w-5" />} label="Edit location" onClick={() => go("/settings/edit-profile")} />
          <Item icon={<Sliders className="h-5 w-5" />} label="Add filters" onClick={() => go("/settings/preferences")} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
