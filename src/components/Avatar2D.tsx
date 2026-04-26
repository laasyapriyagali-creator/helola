import { AvatarConfig, BACKGROUND_COLORS, EYE_COLORS, HAIR_COLORS, OUTFIT_COLORS, SKIN_TONES, mergeAvatar } from "@/lib/avatar";

interface Avatar2DProps {
  config?: Partial<AvatarConfig> | null;
  size?: number;
  className?: string;
  rounded?: boolean;
  showBackground?: boolean;
}

/**
 * Pure SVG layered 2D avatar.
 * Layers (bottom→top): background, neck/body, face shape, ears, blush/freckles, hair, eyes, brows, mouth, glasses, hat, earrings.
 */
export function Avatar2D({ config, size = 96, className = "", rounded = true, showBackground = true }: Avatar2DProps) {
  const a = mergeAvatar(config);
  const skin = SKIN_TONES[a.skin];
  const skinShade = shade(skin, -12);
  const hair = HAIR_COLORS[a.hairColor];
  const hairLight = shade(hair, 18);
  const eye = EYE_COLORS[a.eyeColor];
  const outfit = OUTFIT_COLORS[a.outfitColor];
  const outfitDark = shade(outfit, -15);
  const bg = BACKGROUND_COLORS[a.background];

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: rounded ? "50%" : undefined, overflow: "hidden", display: "block" }}
      aria-label="2D avatar"
    >
      {showBackground && bg !== "transparent" && (
        <rect x="0" y="0" width="200" height="200" fill={bg} />
      )}

      {/* Body / shoulders */}
      <Outfit outfit={a.outfit} color={outfit} dark={outfitDark} />

      {/* Neck */}
      <rect x="86" y="128" width="28" height="22" rx="6" fill={skinShade} />

      {/* Face shape */}
      <FaceShape shape={a.face} skin={skin} />

      {/* Ears */}
      <ellipse cx="55" cy="100" rx="7" ry="11" fill={skin} />
      <ellipse cx="145" cy="100" rx="7" ry="11" fill={skin} />

      {/* Earrings */}
      {a.accessory === "earrings" && (
        <>
          <circle cx="55" cy="113" r="3.5" fill="hsl(var(--primary))" />
          <circle cx="145" cy="113" r="3.5" fill="hsl(var(--primary))" />
        </>
      )}

      {/* Blush */}
      {(a.accessory === "blush") && (
        <>
          <ellipse cx="72" cy="108" rx="8" ry="4" fill="#F2A0B5" opacity="0.55" />
          <ellipse cx="128" cy="108" rx="8" ry="4" fill="#F2A0B5" opacity="0.55" />
        </>
      )}

      {/* Freckles */}
      {a.accessory === "freckles" && (
        <g fill={shade(skin, -25)} opacity="0.7">
          {[[80,98],[88,102],[96,99],[104,99],[112,102],[120,98],[85,92],[115,92]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="1.2" />
          ))}
        </g>
      )}

      {/* Hair */}
      <Hair style={a.hair} color={hair} light={hairLight} />

      {/* Eyes */}
      <Eyes style={a.eyes} color={eye} />

      {/* Brows */}
      <g stroke={shade(hair, -15)} strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M70 80 Q80 75 90 80" />
        <path d="M110 80 Q120 75 130 80" />
      </g>

      {/* Mouth */}
      <Mouth style={a.mouth} skin={skin} />

      {/* Glasses */}
      {(a.accessory === "glasses" || a.accessory === "sunglasses") && (
        <g
          stroke={a.accessory === "sunglasses" ? "#1A1410" : "hsl(var(--primary))"}
          strokeWidth="2.5"
          fill={a.accessory === "sunglasses" ? "#1A1410" : "none"}
        >
          <circle cx="80" cy="95" r="13" />
          <circle cx="120" cy="95" r="13" />
          <line x1="93" y1="95" x2="107" y2="95" />
        </g>
      )}

      {/* Hat */}
      <Hat style={a.hat} />
    </svg>
  );
}

/* ---------------- Outfit ---------------- */
function Outfit({ outfit, color, dark }: { outfit: AvatarConfig["outfit"]; color: string; dark: string }) {
  switch (outfit) {
    case "tee":
      return <path d="M30 200 L30 175 Q30 155 70 148 Q85 165 100 165 Q115 165 130 148 Q170 155 170 175 L170 200 Z" fill={color} />;
    case "hoodie":
      return (
        <g>
          <path d="M25 200 L25 170 Q25 150 65 142 Q85 162 100 162 Q115 162 135 142 Q175 150 175 170 L175 200 Z" fill={color} />
          <path d="M70 148 Q85 168 100 168 Q115 168 130 148 Q120 175 100 175 Q80 175 70 148 Z" fill={dark} />
          <line x1="100" y1="168" x2="100" y2="200" stroke={dark} strokeWidth="2" />
        </g>
      );
    case "sweater":
      return (
        <g>
          <path d="M30 200 L30 172 Q30 154 70 148 Q85 165 100 165 Q115 165 130 148 Q170 154 170 172 L170 200 Z" fill={color} />
          <g stroke={dark} strokeWidth="1.5" opacity="0.6">
            <line x1="40" y1="180" x2="160" y2="180" />
            <line x1="40" y1="190" x2="160" y2="190" />
          </g>
        </g>
      );
    case "tank":
      return (
        <g>
          <path d="M40 200 L40 178 Q60 162 78 152 L80 148 L120 148 L122 152 Q140 162 160 178 L160 200 Z" fill={color} />
        </g>
      );
    case "blazer":
      return (
        <g>
          <path d="M30 200 L30 172 Q30 152 70 146 L100 162 L130 146 Q170 152 170 172 L170 200 Z" fill={color} />
          <path d="M70 146 L100 200 L130 146 Z" fill={dark} opacity="0.4" />
          <line x1="100" y1="162" x2="100" y2="200" stroke={dark} strokeWidth="2" />
        </g>
      );
    case "kurta":
      return (
        <g>
          <path d="M30 200 L30 172 Q30 152 65 146 Q85 165 100 165 Q115 165 135 146 Q170 152 170 172 L170 200 Z" fill={color} />
          <path d="M85 148 L100 200 L115 148" stroke={dark} strokeWidth="2.5" fill="none" />
          <circle cx="100" cy="172" r="2" fill={dark} />
          <circle cx="100" cy="184" r="2" fill={dark} />
        </g>
      );
  }
}

/* ---------------- Face shapes ---------------- */
function FaceShape({ shape, skin }: { shape: AvatarConfig["face"]; skin: string }) {
  switch (shape) {
    case "round":
      return <circle cx="100" cy="100" r="48" fill={skin} />;
    case "square":
      return <rect x="55" y="55" width="90" height="92" rx="22" fill={skin} />;
    case "heart":
      return <path d="M100 150 C70 130 55 105 55 85 C55 70 67 60 80 60 C90 60 96 65 100 72 C104 65 110 60 120 60 C133 60 145 70 145 85 C145 105 130 130 100 150 Z" fill={skin} />;
    case "oval":
    default:
      return <ellipse cx="100" cy="102" rx="46" ry="52" fill={skin} />;
  }
}

/* ---------------- Hair ---------------- */
function Hair({ style, color, light }: { style: AvatarConfig["hair"]; color: string; light: string }) {
  switch (style) {
    case "buns":
      return (
        <g fill={color}>
          <circle cx="48" cy="60" r="14" />
          <circle cx="152" cy="60" r="14" />
          <path d="M55 70 Q100 35 145 70 Q150 95 145 105 L142 95 Q100 75 58 95 L55 105 Q50 95 55 70 Z" />
        </g>
      );
    case "ponytail":
      return (
        <g fill={color}>
          <path d="M55 95 Q60 55 100 50 Q140 55 145 95 Q145 80 140 75 Q100 60 60 75 Q55 80 55 95 Z" />
          <path d="M138 90 Q165 110 158 145 Q150 135 145 115 Z" />
        </g>
      );
    case "long":
      return (
        <g fill={color}>
          <path d="M50 100 Q50 50 100 48 Q150 50 150 100 L150 165 L130 158 L130 105 Q100 95 70 105 L70 158 L50 165 Z" />
        </g>
      );
    case "wavy":
      return (
        <g fill={color}>
          <path d="M52 95 Q50 55 100 50 Q150 55 148 95 Q145 110 140 100 Q135 85 100 80 Q65 85 60 100 Q55 110 52 95 Z" />
          <path d="M58 100 Q55 130 65 145 L70 130 Q68 115 65 105 Z" />
          <path d="M142 100 Q145 130 135 145 L130 130 Q132 115 135 105 Z" />
        </g>
      );
    case "bob":
      return (
        <g fill={color}>
          <path d="M55 110 Q52 55 100 50 Q148 55 145 110 L145 125 L130 122 L130 100 Q100 90 70 100 L70 122 L55 125 Z" />
        </g>
      );
    case "pixie":
      return (
        <g fill={color}>
          <path d="M58 88 Q60 50 100 48 Q140 50 142 88 Q138 80 130 78 Q100 70 70 78 Q62 80 58 88 Z" />
        </g>
      );
    case "buzz":
      return (
        <g fill={color} opacity="0.85">
          <path d="M62 82 Q70 55 100 53 Q130 55 138 82 Q130 78 100 76 Q70 78 62 82 Z" />
        </g>
      );
    case "swept":
      return (
        <g fill={color}>
          <path d="M58 88 Q60 50 100 48 Q145 52 144 90 Q140 78 120 75 Q90 72 70 85 Q62 88 58 88 Z" />
        </g>
      );
    case "curly":
      return (
        <g fill={color}>
          {[[70,60],[90,52],[110,52],[130,60],[58,75],[142,75],[65,90],[135,90]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="13" />
          ))}
        </g>
      );
    case "afro":
      return (
        <g fill={color}>
          <circle cx="100" cy="70" r="50" />
          <circle cx="62" cy="85" r="20" />
          <circle cx="138" cy="85" r="20" />
        </g>
      );
    case "manbun":
      return (
        <g fill={color}>
          <circle cx="100" cy="38" r="16" />
          <path d="M58 88 Q60 50 100 48 Q140 50 142 88 Q130 78 100 76 Q70 78 58 88 Z" />
        </g>
      );
    case "messy":
    default:
      return (
        <g fill={color}>
          <path d="M55 95 Q48 55 100 48 Q152 55 145 95 Q140 75 130 80 Q120 70 110 78 Q100 65 90 78 Q80 70 70 80 Q60 75 55 95 Z" />
        </g>
      );
  }
}

/* ---------------- Eyes ---------------- */
function Eyes({ style, color }: { style: AvatarConfig["eyes"]; color: string }) {
  switch (style) {
    case "round":
      return (
        <g>
          <circle cx="80" cy="100" r="6" fill="#fff" />
          <circle cx="120" cy="100" r="6" fill="#fff" />
          <circle cx="80" cy="100" r="4" fill={color} />
          <circle cx="120" cy="100" r="4" fill={color} />
          <circle cx="81" cy="99" r="1.2" fill="#fff" />
          <circle cx="121" cy="99" r="1.2" fill="#fff" />
        </g>
      );
    case "smile":
      return (
        <g stroke={color} strokeWidth="3" fill="none" strokeLinecap="round">
          <path d="M73 102 Q80 95 87 102" />
          <path d="M113 102 Q120 95 127 102" />
        </g>
      );
    case "sleepy":
      return (
        <g stroke={color} strokeWidth="3" strokeLinecap="round">
          <line x1="73" y1="100" x2="87" y2="100" />
          <line x1="113" y1="100" x2="127" y2="100" />
        </g>
      );
    case "wink":
      return (
        <g>
          <circle cx="80" cy="100" r="4" fill={color} />
          <path d="M113 102 Q120 95 127 102" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "star":
      return (
        <g fill={color}>
          {[[80,100],[120,100]].map(([x,y],i)=> (
            <path key={i} d={`M${x} ${y-6} L${x+1.8} ${y-1.8} L${x+6} ${y} L${x+1.8} ${y+1.8} L${x} ${y+6} L${x-1.8} ${y+1.8} L${x-6} ${y} L${x-1.8} ${y-1.8} Z`} />
          ))}
        </g>
      );
    case "heart":
      return (
        <g fill="#E11D48">
          {[[80,100],[120,100]].map(([x,y],i)=> (
            <path key={i} d={`M${x} ${y+4} C${x-6} ${y-2} ${x-7} ${y-7} ${x-3} ${y-7} C${x-1} ${y-7} ${x} ${y-5} ${x} ${y-3} C${x} ${y-5} ${x+1} ${y-7} ${x+3} ${y-7} C${x+7} ${y-7} ${x+6} ${y-2} ${x} ${y+4} Z`} />
          ))}
        </g>
      );
    case "sharp":
      return (
        <g fill={color}>
          <path d="M73 100 Q80 92 87 100 Q80 104 73 100 Z" />
          <path d="M113 100 Q120 92 127 100 Q120 104 113 100 Z" />
        </g>
      );
  }
}

/* ---------------- Mouth ---------------- */
function Mouth({ style, skin }: { style: AvatarConfig["mouth"]; skin: string }) {
  const lip = "#C04157";
  switch (style) {
    case "smile":
      return <path d="M88 122 Q100 132 112 122" stroke={lip} strokeWidth="3" fill="none" strokeLinecap="round" />;
    case "grin":
      return (
        <g>
          <path d="M85 120 Q100 135 115 120 Z" fill="#7A1F2F" />
          <path d="M88 122 Q100 127 112 122" fill="#fff" />
        </g>
      );
    case "smirk":
      return <path d="M88 124 Q100 124 112 118" stroke={lip} strokeWidth="3" fill="none" strokeLinecap="round" />;
    case "neutral":
      return <line x1="90" y1="123" x2="110" y2="123" stroke={lip} strokeWidth="3" strokeLinecap="round" />;
    case "kiss":
      return <path d="M95 120 Q100 114 105 120 Q100 128 95 120 Z" fill={lip} />;
    case "pout":
      return <path d="M92 125 Q100 118 108 125 Q100 130 92 125 Z" fill={lip} />;
    case "tongue":
      return (
        <g>
          <path d="M88 120 Q100 132 112 120" stroke={lip} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M96 126 Q100 132 104 126 Z" fill="#E94560" />
        </g>
      );
    case "open":
      return (
        <g>
          <ellipse cx="100" cy="124" rx="8" ry="5" fill="#5C1828" />
          <path d="M92 122 Q100 119 108 122" stroke={lip} strokeWidth="2" fill="none" />
        </g>
      );
  }
}

/* ---------------- Hat ---------------- */
function Hat({ style }: { style: AvatarConfig["hat"] }) {
  switch (style) {
    case "beanie":
      return (
        <g>
          <path d="M52 65 Q52 35 100 32 Q148 35 148 65 L148 75 L52 75 Z" fill="hsl(var(--primary))" />
          <rect x="50" y="72" width="100" height="8" fill="hsl(var(--primary-glow))" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M55 70 Q55 40 100 38 Q145 40 145 70 L145 78 L55 78 Z" fill="hsl(var(--primary))" />
          <ellipse cx="120" cy="80" rx="40" ry="6" fill="hsl(var(--primary))" />
        </g>
      );
    case "sunhat":
      return (
        <g>
          <ellipse cx="100" cy="72" rx="78" ry="14" fill="#E8C77A" />
          <path d="M62 72 Q62 42 100 40 Q138 42 138 72 Z" fill="#D4A85C" />
          <rect x="62" y="68" width="76" height="6" fill="#65081F" />
        </g>
      );
    case "headband":
      return (
        <g>
          <rect x="55" y="65" width="90" height="8" rx="3" fill="#E8A5B5" />
          <circle cx="100" cy="63" r="6" fill="#E8A5B5" />
        </g>
      );
    case "none":
    default:
      return null;
  }
}

/* ---------------- Color helpers ---------------- */
function shade(hex: string, amt: number): string {
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 0xff) + amt;
  let b = (num & 0xff) + amt;
  r = clamp(r); g = clamp(g); b = clamp(b);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
function clamp(n: number) { return Math.max(0, Math.min(255, n)); }
