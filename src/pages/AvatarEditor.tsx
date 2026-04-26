import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar2D } from "@/components/Avatar2D";
import {
  AvatarConfig, DEFAULT_AVATAR, mergeAvatar, randomAvatar,
  SKIN_TONES, HAIR_COLORS, EYE_COLORS, OUTFIT_COLORS, BACKGROUND_COLORS,
} from "@/lib/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Shuffle, Save, RotateCcw } from "lucide-react";

const TABS: { key: keyof AvatarConfig | "presets"; label: string; emoji: string }[] = [
  { key: "presets", label: "Presets", emoji: "✨" },
  { key: "skin", label: "Skin", emoji: "👤" },
  { key: "face", label: "Face", emoji: "🟠" },
  { key: "hair", label: "Hair", emoji: "💇" },
  { key: "hairColor", label: "Hair color", emoji: "🎨" },
  { key: "eyes", label: "Eyes", emoji: "👀" },
  { key: "eyeColor", label: "Eye color", emoji: "🌈" },
  { key: "mouth", label: "Mouth", emoji: "👄" },
  { key: "accessory", label: "Accessory", emoji: "🕶️" },
  { key: "hat", label: "Hat", emoji: "🧢" },
  { key: "outfit", label: "Outfit", emoji: "👕" },
  { key: "outfitColor", label: "Outfit color", emoji: "🎨" },
  { key: "background", label: "Background", emoji: "🖼️" },
];

const OPTIONS: Record<string, string[]> = {
  skin: ["porcelain", "peach", "sand", "honey", "bronze", "umber", "espresso"],
  face: ["round", "oval", "square", "heart"],
  hair: ["buns", "ponytail", "long", "wavy", "bob", "pixie", "buzz", "swept", "curly", "afro", "manbun", "messy"],
  hairColor: ["black", "brown", "blonde", "auburn", "red", "pink", "purple", "blue", "platinum"],
  eyes: ["round", "smile", "sleepy", "wink", "star", "heart", "sharp"],
  eyeColor: ["brown", "hazel", "green", "blue", "gray", "amber"],
  mouth: ["smile", "grin", "smirk", "neutral", "kiss", "pout", "tongue", "open"],
  accessory: ["none", "glasses", "sunglasses", "earrings", "freckles", "blush"],
  hat: ["none", "beanie", "cap", "sunhat", "headband"],
  outfit: ["tee", "hoodie", "sweater", "tank", "blazer", "kurta"],
  outfitColor: ["maroon", "rose", "cream", "navy", "olive", "mustard", "sky", "lilac", "black"],
  background: ["rose", "peach", "sky", "lavender", "mint", "cream", "maroon", "transparent"],
};

const COLOR_MAPS: Record<string, Record<string, string>> = {
  skin: SKIN_TONES,
  hairColor: HAIR_COLORS,
  eyeColor: EYE_COLORS,
  outfitColor: OUTFIT_COLORS,
  background: BACKGROUND_COLORS,
};

export default function AvatarEditor() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<keyof AvatarConfig | "presets">("presets");
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [original, setOriginal] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = "Edit your 2D avatar · HELOLA"; }, []);
  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("avatar_config").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        const merged = mergeAvatar((data?.avatar_config as Partial<AvatarConfig>) || null);
        setConfig(merged);
        setOriginal(merged);
      });
  }, [user]);

  const update = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ avatar_config: config }).eq("id", user.id);
    setBusy(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    setOriginal(config);
    toast({ title: "Avatar saved! ✨" });
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-soft pb-8">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-lg font-bold">Edit avatar</h1>
        <Button onClick={save} disabled={busy} size="sm" className="rounded-full">
          <Save className="mr-1 h-3.5 w-3.5" />Save
        </Button>
      </div>

      {/* Avatar preview */}
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="relative mx-auto">
          <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-3xl bg-card shadow-elegant md:h-80 md:w-80">
            <Avatar2D config={config} size={260} />
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfig(randomAvatar())} className="rounded-full">
              <Shuffle className="mr-1 h-3.5 w-3.5" />Randomize
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfig(original)} className="rounded-full">
              <RotateCcw className="mr-1 h-3.5 w-3.5" />Reset
            </Button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          This 2D character is yours — edit anytime. Real photos optional.
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <div className="flex gap-2 overflow-x-auto px-4 no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key ? "bg-primary text-primary-foreground" : "bg-card text-foreground/70 hover:bg-muted"
              }`}
            >
              <span>{tab.emoji}</span>{tab.label}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-4 max-w-2xl px-4">
          <Card className="border-border/60 shadow-soft">
            <CardContent className="p-4">
              {activeTab === "presets" ? (
                <Presets onPick={setConfig} />
              ) : (
                <OptionGrid
                  field={activeTab}
                  selected={config[activeTab as keyof AvatarConfig]}
                  options={OPTIONS[activeTab as string]}
                  config={config}
                  onSelect={(value) => update(activeTab as keyof AvatarConfig, value as never)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function OptionGrid({ field, selected, options, config, onSelect }: {
  field: string;
  selected: unknown;
  options: string[];
  config: AvatarConfig;
  onSelect: (value: string) => void;
}) {
  const colorMap = COLOR_MAPS[field];

  if (colorMap) {
    return (
      <div className="grid grid-cols-5 gap-3 sm:grid-cols-7">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-all ${
              selected === opt ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : "hover:bg-muted"
            }`}
          >
            <span
              className="h-12 w-12 rounded-full shadow-soft"
              style={{ backgroundColor: colorMap[opt], border: opt === "transparent" ? "2px dashed hsl(var(--border))" : undefined }}
            />
            <span className="text-[10px] capitalize text-muted-foreground">{opt}</span>
          </button>
        ))}
      </div>
    );
  }

  // Render avatar previews with the option swapped in
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {options.map(opt => {
        const previewConfig = { ...config, [field]: opt };
        const isSelected = selected === opt;
        return (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl bg-muted/50 p-2 transition-all ${
              isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : "hover:bg-muted"
            }`}
          >
            <Avatar2D config={previewConfig} size={64} rounded={false} showBackground={false} />
            <span className="text-[10px] capitalize text-muted-foreground">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function Presets({ onPick }: { onPick: (c: AvatarConfig) => void }) {
  const presets: AvatarConfig[] = [
    { skin: "peach", face: "round", hair: "buns", hairColor: "black", eyes: "smile", eyeColor: "brown", mouth: "smile", accessory: "blush", hat: "none", outfit: "tee", outfitColor: "rose", background: "rose" },
    { skin: "honey", face: "oval", hair: "wavy", hairColor: "auburn", eyes: "round", eyeColor: "hazel", mouth: "grin", accessory: "freckles", hat: "none", outfit: "hoodie", outfitColor: "maroon", background: "peach" },
    { skin: "bronze", face: "square", hair: "afro", hairColor: "black", eyes: "smile", eyeColor: "brown", mouth: "smile", accessory: "glasses", hat: "none", outfit: "blazer", outfitColor: "navy", background: "mint" },
    { skin: "sand", face: "heart", hair: "long", hairColor: "blonde", eyes: "star", eyeColor: "blue", mouth: "kiss", accessory: "earrings", hat: "headband", outfit: "tank", outfitColor: "lilac", background: "lavender" },
    { skin: "umber", face: "oval", hair: "curly", hairColor: "black", eyes: "smile", eyeColor: "brown", mouth: "grin", accessory: "none", hat: "cap", outfit: "tee", outfitColor: "mustard", background: "sky" },
    { skin: "porcelain", face: "round", hair: "pixie", hairColor: "pink", eyes: "wink", eyeColor: "green", mouth: "smirk", accessory: "earrings", hat: "none", outfit: "sweater", outfitColor: "cream", background: "rose" },
    { skin: "espresso", face: "oval", hair: "manbun", hairColor: "black", eyes: "sharp", eyeColor: "brown", mouth: "neutral", accessory: "sunglasses", hat: "none", outfit: "kurta", outfitColor: "olive", background: "cream" },
    { skin: "peach", face: "round", hair: "messy", hairColor: "brown", eyes: "heart", eyeColor: "brown", mouth: "smile", accessory: "blush", hat: "sunhat", outfit: "tee", outfitColor: "sky", background: "peach" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {presets.map((p, i) => (
        <button key={i} onClick={() => onPick(p)} className="rounded-2xl bg-muted/50 p-2 transition-all hover:bg-muted hover:scale-105">
          <Avatar2D config={p} size={88} />
          <p className="mt-1 text-center text-[10px] text-muted-foreground">Preset {i + 1}</p>
        </button>
      ))}
    </div>
  );
}
