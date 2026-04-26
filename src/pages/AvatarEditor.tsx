import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar2D } from "@/components/Avatar2D";
import {
  AvatarConfig, DEFAULT_AVATAR, mergeAvatar, randomAvatar, AVATAR_OPTIONS,
  SKIN_TONES, HAIR_COLORS, EYE_COLORS, OUTFIT_COLORS, BACKGROUND_COLORS,
} from "@/lib/avatar";
import { toast } from "@/hooks/use-toast";
import { X, Dices, Loader2 } from "lucide-react";

type CategoryKey = keyof typeof AVATAR_OPTIONS;
type CategoryDef = { key: CategoryKey; label: string; icon: string };

const CATEGORIES: CategoryDef[] = [
  { key: "face", label: "Face", icon: "😀" },
  { key: "skin", label: "Skin", icon: "🤚" },
  { key: "hair", label: "Hair", icon: "💇" },
  { key: "hairColor", label: "Hair color", icon: "🎨" },
  { key: "eyebrows", label: "Brows", icon: "🤨" },
  { key: "eyes", label: "Eyes", icon: "👁️" },
  { key: "eyeColor", label: "Eye color", icon: "🌈" },
  { key: "nose", label: "Nose", icon: "👃" },
  { key: "mouth", label: "Mouth", icon: "👄" },
  { key: "beard", label: "Beard", icon: "🧔" },
  { key: "glasses", label: "Glasses", icon: "👓" },
  { key: "accessory", label: "Extras", icon: "✨" },
  { key: "hat", label: "Hat", icon: "🎩" },
  { key: "outfit", label: "Outfit", icon: "👕" },
  { key: "outfitColor", label: "Outfit color", icon: "🎨" },
  { key: "background", label: "Background", icon: "🖼️" },
];

const COLOR_MAPS: Partial<Record<CategoryKey, Record<string, string>>> = {
  skin: SKIN_TONES,
  hairColor: HAIR_COLORS,
  eyeColor: EYE_COLORS,
  outfitColor: OUTFIT_COLORS,
  background: BACKGROUND_COLORS,
};

export default function AvatarEditor() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("hair");
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { document.title = "Edit your 2D avatar · HELOLA"; }, []);
  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("avatar_config").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        setConfig(mergeAvatar((data?.avatar_config as Partial<AvatarConfig>) || null));
        setLoaded(true);
      });
  }, [user]);

  const update = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles")
      .update({ avatar_config: config as unknown as Record<string, string> })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Avatar saved! ✨" });
    navigate("/profile");
  };

  const previewBg = BACKGROUND_COLORS[config.background] === "transparent"
    ? "#C9D2DA"
    : BACKGROUND_COLORS[config.background];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar — X / Dice / Save */}
      <div className="flex items-center justify-between px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground/70 hover:bg-muted/70"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfig(randomAvatar())}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90"
            aria-label="Randomize"
          >
            <Dices className="h-5 w-5" />
          </button>
          <button
            onClick={save}
            disabled={busy || !loaded}
            className="flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </button>
        </div>
      </div>

      {/* Big preview */}
      <div
        className="mx-4 mt-3 flex h-[44vh] items-end justify-center overflow-hidden rounded-3xl md:h-[48vh]"
        style={{ backgroundColor: previewBg }}
      >
        <Avatar2D config={config} size={420} rounded={false} showBackground={false} className="h-full w-auto" />
      </div>

      {/* Category bar */}
      <div className="border-t border-border bg-card pt-2">
        <div className="flex gap-1 overflow-x-auto px-2 pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex shrink-0 flex-col items-center gap-0.5 rounded-2xl px-3 py-2 text-[10px] font-medium transition-colors ${
                activeCategory === cat.key
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/60 hover:bg-muted"
              }`}
            >
              <span className="text-lg leading-none">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Parts grid */}
        <div className="max-h-[36vh] overflow-y-auto border-t border-border bg-background px-3 py-3 md:max-h-[32vh]">
          <PartsGrid
            category={activeCategory}
            config={config}
            onSelect={(value) => update(activeCategory as keyof AvatarConfig, value as never)}
          />
        </div>
      </div>
    </div>
  );
}

function PartsGrid({ category, config, onSelect }: {
  category: CategoryKey;
  config: AvatarConfig;
  onSelect: (value: string) => void;
}) {
  const options = AVATAR_OPTIONS[category] as readonly string[];
  const selected = config[category as keyof AvatarConfig];
  const colorMap = COLOR_MAPS[category];

  if (colorMap) {
    return (
      <div className="grid grid-cols-5 gap-3 sm:grid-cols-7 md:grid-cols-10">
        {options.map(opt => {
          const isTransparent = opt === "transparent";
          return (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`flex flex-col items-center gap-1 rounded-2xl p-1.5 transition-all ${
                selected === opt ? "bg-muted ring-2 ring-foreground" : "hover:bg-muted"
              }`}
            >
              <span
                className="h-12 w-12 rounded-full border-2 border-foreground shadow-soft"
                style={{
                  backgroundColor: colorMap[opt],
                  borderStyle: isTransparent ? "dashed" : "solid",
                }}
              />
              <span className="text-[9px] capitalize text-muted-foreground">{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
      {options.map(opt => {
        const previewConfig = { ...config, [category]: opt } as AvatarConfig;
        const isSelected = selected === opt;
        return (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`flex flex-col items-center gap-1 rounded-2xl p-1.5 transition-all ${
              isSelected ? "bg-muted ring-2 ring-foreground" : "hover:bg-muted"
            }`}
          >
            <div className="overflow-hidden rounded-2xl border-2 border-foreground bg-background">
              <Avatar2D config={previewConfig} size={72} rounded={false} showBackground={false} />
            </div>
            <span className="text-[9px] capitalize text-muted-foreground">{opt === "none" ? "None" : opt}</span>
          </button>
        );
      })}
    </div>
  );
}
