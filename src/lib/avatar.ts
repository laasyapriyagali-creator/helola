// HELOLA 2D Avatar — original bold-outline cartoon character.
// Inspired by classic avatar-maker apps but every shape is hand-drawn here as plain SVG.
// All parts are pure SVG so the avatar scales perfectly and saves as a small JSON config.

export type SkinTone = "porcelain" | "peach" | "sand" | "honey" | "bronze" | "umber" | "espresso";
export type FaceShape = "round" | "oval" | "square" | "heart" | "long";
export type HairStyle =
  | "buns" | "ponytail" | "long" | "wavy" | "bob" | "pixie"
  | "buzz" | "swept" | "curly" | "afro" | "manbun" | "messy"
  | "mohawk" | "topknot" | "bald";
export type HairColor = "black" | "brown" | "blonde" | "auburn" | "red" | "pink" | "purple" | "blue" | "platinum" | "gray";
export type EyebrowStyle = "natural" | "thick" | "thin" | "arched" | "straight" | "raised";
export type EyeStyle = "round" | "smile" | "sleepy" | "wink" | "star" | "heart" | "sharp" | "side";
export type EyeColor = "brown" | "hazel" | "green" | "blue" | "gray" | "amber";
export type NoseStyle = "small" | "angular" | "round" | "pointy";
export type MouthStyle = "smile" | "grin" | "smirk" | "neutral" | "kiss" | "pout" | "tongue" | "open" | "frown";
export type Beard = "none" | "stubble" | "goatee" | "full" | "mustache";
export type Glasses = "none" | "round" | "square" | "sunglasses" | "cat-eye";
export type Accessory = "none" | "earrings" | "freckles" | "blush" | "mole";
export type Hat = "none" | "beanie" | "cap" | "sunhat" | "headband" | "santa" | "graduation" | "bow";
export type Outfit = "tee" | "hoodie" | "sweater" | "tank" | "blazer" | "kurta" | "overalls";
export type OutfitColor = "maroon" | "rose" | "cream" | "navy" | "olive" | "mustard" | "sky" | "lilac" | "black" | "white";
export type Background = "rose" | "peach" | "sky" | "lavender" | "mint" | "cream" | "maroon" | "slate" | "transparent";

export interface AvatarConfig {
  skin: SkinTone;
  face: FaceShape;
  hair: HairStyle;
  hairColor: HairColor;
  eyebrows: EyebrowStyle;
  eyes: EyeStyle;
  eyeColor: EyeColor;
  nose: NoseStyle;
  mouth: MouthStyle;
  beard: Beard;
  glasses: Glasses;
  accessory: Accessory;
  hat: Hat;
  outfit: Outfit;
  outfitColor: OutfitColor;
  background: Background;
}

export const SKIN_TONES: Record<SkinTone, string> = {
  porcelain: "#F5DCC4",
  peach: "#F2C9A7",
  sand: "#E0AD86",
  honey: "#C68B5F",
  bronze: "#A36B40",
  umber: "#75462A",
  espresso: "#4A2A18",
};

export const HAIR_COLORS: Record<HairColor, string> = {
  black: "#1A1410",
  brown: "#4A2E1A",
  blonde: "#D4A85C",
  auburn: "#7A2E1F",
  red: "#B83A1F",
  pink: "#E879A8",
  purple: "#7C3AED",
  blue: "#2563EB",
  platinum: "#E8DDC8",
  gray: "#8E8E8E",
};

export const EYE_COLORS: Record<EyeColor, string> = {
  brown: "#3A1F0E",
  hazel: "#8B6F3F",
  green: "#3F7A4F",
  blue: "#3B6FB8",
  gray: "#5B6470",
  amber: "#B8782E",
};

export const OUTFIT_COLORS: Record<OutfitColor, string> = {
  maroon: "#5C0120",
  rose: "#E8A5B5",
  cream: "#F5E8D4",
  navy: "#1E3A5F",
  olive: "#6B7A3A",
  mustard: "#D4A02E",
  sky: "#7DB8E0",
  lilac: "#B89AD4",
  black: "#1F1F1F",
  white: "#FFFFFF",
};

export const BACKGROUND_COLORS: Record<Background, string> = {
  rose: "#FBE4EA",
  peach: "#FDE4D2",
  sky: "#D8ECF7",
  lavender: "#E5DCF5",
  mint: "#D7EFE0",
  cream: "#FAF1E0",
  maroon: "#5C0120",
  slate: "#C9D2DA",
  transparent: "transparent",
};

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: "peach",
  face: "oval",
  hair: "buns",
  hairColor: "brown",
  eyebrows: "natural",
  eyes: "round",
  eyeColor: "brown",
  nose: "angular",
  mouth: "smile",
  beard: "none",
  glasses: "none",
  accessory: "none",
  hat: "none",
  outfit: "tee",
  outfitColor: "maroon",
  background: "slate",
};

export const AVATAR_OPTIONS = {
  skin: ["porcelain", "peach", "sand", "honey", "bronze", "umber", "espresso"] as const,
  face: ["round", "oval", "square", "heart", "long"] as const,
  hair: ["bald", "buzz", "pixie", "swept", "messy", "wavy", "bob", "long", "ponytail", "buns", "topknot", "manbun", "curly", "afro", "mohawk"] as const,
  hairColor: ["black", "brown", "blonde", "auburn", "red", "pink", "purple", "blue", "platinum", "gray"] as const,
  eyebrows: ["natural", "thick", "thin", "arched", "straight", "raised"] as const,
  eyes: ["round", "smile", "sleepy", "wink", "star", "heart", "sharp", "side"] as const,
  eyeColor: ["brown", "hazel", "green", "blue", "gray", "amber"] as const,
  nose: ["small", "angular", "round", "pointy"] as const,
  mouth: ["smile", "grin", "smirk", "neutral", "kiss", "pout", "tongue", "open", "frown"] as const,
  beard: ["none", "stubble", "mustache", "goatee", "full"] as const,
  glasses: ["none", "round", "square", "sunglasses", "cat-eye"] as const,
  accessory: ["none", "earrings", "freckles", "blush", "mole"] as const,
  hat: ["none", "beanie", "cap", "sunhat", "headband", "santa", "graduation", "bow"] as const,
  outfit: ["tee", "hoodie", "sweater", "tank", "blazer", "kurta", "overalls"] as const,
  outfitColor: ["maroon", "rose", "cream", "navy", "olive", "mustard", "sky", "lilac", "black", "white"] as const,
  background: ["slate", "rose", "peach", "sky", "lavender", "mint", "cream", "maroon", "transparent"] as const,
};

export function randomAvatar(): AvatarConfig {
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
  return {
    skin: pick(AVATAR_OPTIONS.skin),
    face: pick(AVATAR_OPTIONS.face),
    hair: pick(AVATAR_OPTIONS.hair),
    hairColor: pick(AVATAR_OPTIONS.hairColor),
    eyebrows: pick(AVATAR_OPTIONS.eyebrows),
    eyes: pick(AVATAR_OPTIONS.eyes),
    eyeColor: pick(AVATAR_OPTIONS.eyeColor),
    nose: pick(AVATAR_OPTIONS.nose),
    mouth: pick(AVATAR_OPTIONS.mouth),
    beard: pick(["none", "none", "none", "stubble", "mustache", "goatee", "full"] as const),
    glasses: pick(["none", "none", "round", "square", "sunglasses", "cat-eye"] as const),
    accessory: pick(AVATAR_OPTIONS.accessory),
    hat: pick(["none", "none", "beanie", "cap", "sunhat", "headband", "bow"] as const),
    outfit: pick(AVATAR_OPTIONS.outfit),
    outfitColor: pick(AVATAR_OPTIONS.outfitColor),
    background: pick(["slate", "rose", "peach", "sky", "lavender", "mint", "cream"] as const),
  };
}

export function mergeAvatar(c?: Partial<AvatarConfig> | null): AvatarConfig {
  return { ...DEFAULT_AVATAR, ...(c || {}) };
}
