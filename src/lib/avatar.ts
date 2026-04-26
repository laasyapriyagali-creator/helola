// HELOLA 2D Avatar — fully customizable layered SVG character.
// All parts are pure SVG so the avatar scales perfectly and saves as a small JSON config.

export type SkinTone = "porcelain" | "peach" | "sand" | "honey" | "bronze" | "umber" | "espresso";
export type FaceShape = "round" | "oval" | "square" | "heart";
export type HairStyle =
  | "buns" | "ponytail" | "long" | "wavy" | "bob" | "pixie"
  | "buzz" | "swept" | "curly" | "afro" | "manbun" | "messy";
export type HairColor = "black" | "brown" | "blonde" | "auburn" | "red" | "pink" | "purple" | "blue" | "platinum";
export type EyeStyle = "round" | "smile" | "sleepy" | "wink" | "star" | "heart" | "sharp";
export type EyeColor = "brown" | "hazel" | "green" | "blue" | "gray" | "amber";
export type MouthStyle = "smile" | "grin" | "smirk" | "neutral" | "kiss" | "pout" | "tongue" | "open";
export type Accessory = "none" | "glasses" | "sunglasses" | "earrings" | "freckles" | "blush";
export type Hat = "none" | "beanie" | "cap" | "sunhat" | "headband";
export type Outfit = "tee" | "hoodie" | "sweater" | "tank" | "blazer" | "kurta";
export type OutfitColor = "maroon" | "rose" | "cream" | "navy" | "olive" | "mustard" | "sky" | "lilac" | "black";
export type Background = "rose" | "peach" | "sky" | "lavender" | "mint" | "cream" | "maroon" | "transparent";

export interface AvatarConfig {
  skin: SkinTone;
  face: FaceShape;
  hair: HairStyle;
  hairColor: HairColor;
  eyes: EyeStyle;
  eyeColor: EyeColor;
  mouth: MouthStyle;
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
  brown: "#5C3A21",
  blonde: "#D4A85C",
  auburn: "#7A2E1F",
  red: "#B83A1F",
  pink: "#E879A8",
  purple: "#7C3AED",
  blue: "#2563EB",
  platinum: "#E8DDC8",
};

export const EYE_COLORS: Record<EyeColor, string> = {
  brown: "#4A2A18",
  hazel: "#8B6F3F",
  green: "#3F7A4F",
  blue: "#3B6FB8",
  gray: "#6B7280",
  amber: "#B8782E",
};

export const OUTFIT_COLORS: Record<OutfitColor, string> = {
  maroon: "#65081F",
  rose: "#E8A5B5",
  cream: "#F5E8D4",
  navy: "#1E3A5F",
  olive: "#6B7A3A",
  mustard: "#D4A02E",
  sky: "#7DB8E0",
  lilac: "#B89AD4",
  black: "#1F1F1F",
};

export const BACKGROUND_COLORS: Record<Background, string> = {
  rose: "#FBE4EA",
  peach: "#FDE4D2",
  sky: "#D8ECF7",
  lavender: "#E5DCF5",
  mint: "#D7EFE0",
  cream: "#FAF1E0",
  maroon: "#65081F",
  transparent: "transparent",
};

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: "peach",
  face: "oval",
  hair: "wavy",
  hairColor: "brown",
  eyes: "smile",
  eyeColor: "brown",
  mouth: "smile",
  accessory: "none",
  hat: "none",
  outfit: "tee",
  outfitColor: "maroon",
  background: "rose",
};

export function randomAvatar(): AvatarConfig {
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
  return {
    skin: pick(["porcelain", "peach", "sand", "honey", "bronze", "umber", "espresso"] as const),
    face: pick(["round", "oval", "square", "heart"] as const),
    hair: pick(["buns", "ponytail", "long", "wavy", "bob", "pixie", "buzz", "swept", "curly", "afro", "manbun", "messy"] as const),
    hairColor: pick(["black", "brown", "blonde", "auburn", "red", "pink", "purple", "blue", "platinum"] as const),
    eyes: pick(["round", "smile", "sleepy", "wink", "star", "heart", "sharp"] as const),
    eyeColor: pick(["brown", "hazel", "green", "blue", "gray", "amber"] as const),
    mouth: pick(["smile", "grin", "smirk", "neutral", "kiss", "pout", "tongue", "open"] as const),
    accessory: pick(["none", "glasses", "sunglasses", "earrings", "freckles", "blush"] as const),
    hat: pick(["none", "none", "beanie", "cap", "sunhat", "headband"] as const),
    outfit: pick(["tee", "hoodie", "sweater", "tank", "blazer", "kurta"] as const),
    outfitColor: pick(["maroon", "rose", "cream", "navy", "olive", "mustard", "sky", "lilac", "black"] as const),
    background: pick(["rose", "peach", "sky", "lavender", "mint", "cream"] as const),
  };
}

export function mergeAvatar(c?: Partial<AvatarConfig> | null): AvatarConfig {
  return { ...DEFAULT_AVATAR, ...(c || {}) };
}
