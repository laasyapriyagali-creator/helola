import {
  AvatarConfig, BACKGROUND_COLORS, EYE_COLORS, HAIR_COLORS,
  OUTFIT_COLORS, SKIN_TONES, mergeAvatar,
} from "@/lib/avatar";

interface Avatar2DProps {
  config?: Partial<AvatarConfig> | null;
  size?: number;
  className?: string;
  rounded?: boolean;
  showBackground?: boolean;
}

const STROKE = "#16131A";
const STROKE_W = 4;

/**
 * Bold-outline cartoon 2D avatar (head & shoulders portrait).
 * Layered SVG: background → torso → neck → face → ears/earrings → blush/freckles → eyes → eyebrows → nose → mouth → beard → glasses → hair → hat.
 */
export function Avatar2D({ config, size = 96, className = "", rounded = true, showBackground = true }: Avatar2DProps) {
  const a = mergeAvatar(config);
  const skin = SKIN_TONES[a.skin];
  const skinShade = shade(skin, -22);
  const hair = HAIR_COLORS[a.hairColor];
  const eye = EYE_COLORS[a.eyeColor];
  const outfit = OUTFIT_COLORS[a.outfitColor];
  const outfitDark = shade(outfit, -22);
  const bg = BACKGROUND_COLORS[a.background];

  return (
    <svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: rounded ? "50%" : undefined, overflow: "hidden", display: "block" }}
      aria-label="2D avatar"
    >
      {showBackground && bg !== "transparent" && (
        <rect x="0" y="0" width="240" height="240" fill={bg} />
      )}

      {/* Torso / shoulders */}
      <Outfit outfit={a.outfit} color={outfit} dark={outfitDark} />

      {/* Neck */}
      <path
        d="M104 158 L104 182 Q120 188 136 182 L136 158 Z"
        fill={skin} stroke={STROKE} strokeWidth={STROKE_W} strokeLinejoin="round"
      />
      <path d="M104 178 Q120 184 136 178" stroke={skinShade} strokeWidth="2" fill="none" />

      {/* Face shape */}
      <FaceShape shape={a.face} skin={skin} />

      {/* Ears */}
      <g>
        <path d="M58 118 Q50 118 50 130 Q50 142 60 142" fill={skin} stroke={STROKE} strokeWidth={STROKE_W} strokeLinejoin="round" strokeLinecap="round" />
        <path d="M182 118 Q190 118 190 130 Q190 142 180 142" fill={skin} stroke={STROKE} strokeWidth={STROKE_W} strokeLinejoin="round" strokeLinecap="round" />
      </g>

      {/* Earrings */}
      {a.accessory === "earrings" && (
        <g fill="hsl(var(--primary))" stroke={STROKE} strokeWidth="2">
          <circle cx="54" cy="142" r="4" />
          <circle cx="186" cy="142" r="4" />
        </g>
      )}

      {/* Blush */}
      {a.accessory === "blush" && (
        <g fill="#F08CA8" opacity="0.7">
          <ellipse cx="78" cy="130" rx="11" ry="5" />
          <ellipse cx="162" cy="130" rx="11" ry="5" />
        </g>
      )}

      {/* Freckles */}
      {a.accessory === "freckles" && (
        <g fill={shade(skin, -32)}>
          {[[88,118],[96,124],[104,120],[112,124],[128,124],[136,120],[144,124],[152,118]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="1.5" />
          ))}
        </g>
      )}

      {/* Mole */}
      {a.accessory === "mole" && <circle cx="148" cy="130" r="2.2" fill={STROKE} />}

      {/* Eyes */}
      <Eyes style={a.eyes} color={eye} />

      {/* Eyebrows */}
      <Eyebrows style={a.eyebrows} color={shade(hair, -10)} />

      {/* Nose */}
      <Nose style={a.nose} skinShade={skinShade} />

      {/* Mouth */}
      <Mouth style={a.mouth} />

      {/* Beard */}
      <Beard style={a.beard} color={hair} />

      {/* Glasses */}
      <Glasses style={a.glasses} />

      {/* Hair */}
      <Hair style={a.hair} color={hair} />

      {/* Hat */}
      <Hat style={a.hat} />
    </svg>
  );
}

/* ---------------- Face shapes ---------------- */
function FaceShape({ shape, skin }: { shape: AvatarConfig["face"]; skin: string }) {
  const props = { fill: skin, stroke: STROKE, strokeWidth: STROKE_W, strokeLinejoin: "round" as const };
  switch (shape) {
    case "round":
      return <circle cx="120" cy="118" r="62" {...props} />;
    case "square":
      return <path d="M62 70 Q62 60 78 60 L162 60 Q178 60 178 70 L178 150 Q178 168 160 168 L80 168 Q62 168 62 150 Z" {...props} />;
    case "heart":
      return <path d="M62 78 Q62 60 82 60 Q100 60 110 72 Q120 80 130 72 Q140 60 158 60 Q178 60 178 78 Q178 120 158 145 Q140 168 120 172 Q100 168 82 145 Q62 120 62 78 Z" {...props} />;
    case "long":
      return <path d="M70 70 Q70 60 86 60 L154 60 Q170 60 170 72 L170 150 Q170 178 120 182 Q70 178 70 150 Z" {...props} />;
    case "oval":
    default:
      return <ellipse cx="120" cy="120" rx="58" ry="64" {...props} />;
  }
}

/* ---------------- Outfit ---------------- */
function Outfit({ outfit, color, dark }: { outfit: AvatarConfig["outfit"]; color: string; dark: string }) {
  const stroke = { stroke: STROKE, strokeWidth: STROKE_W, strokeLinejoin: "round" as const };
  switch (outfit) {
    case "tee":
      return <path d="M30 240 L30 200 Q30 180 70 172 Q92 188 120 188 Q148 188 170 172 Q210 180 210 200 L210 240 Z" fill={color} {...stroke} />;
    case "hoodie":
      return (
        <g>
          <path d="M22 240 L22 196 Q22 174 64 166 Q90 188 120 188 Q150 188 176 166 Q218 174 218 196 L218 240 Z" fill={color} {...stroke} />
          {/* hood collar */}
          <path d="M76 174 Q98 198 120 198 Q142 198 164 174 Q150 200 120 204 Q90 200 76 174 Z" fill={dark} stroke={STROKE} strokeWidth="3" />
          {/* pocket line */}
          <path d="M120 198 L120 230" stroke={STROKE} strokeWidth="3" />
        </g>
      );
    case "sweater":
      return (
        <g>
          <path d="M28 240 L28 198 Q28 178 68 170 Q92 188 120 188 Q148 188 172 170 Q212 178 212 198 L212 240 Z" fill={color} {...stroke} />
          <g stroke={dark} strokeWidth="2" opacity="0.7">
            <line x1="40" y1="212" x2="200" y2="212" />
            <line x1="40" y1="226" x2="200" y2="226" />
          </g>
        </g>
      );
    case "tank":
      return (
        <g>
          <path d="M48 240 L48 210 Q72 188 92 178 L96 174 L144 174 L148 178 Q168 188 192 210 L192 240 Z" fill={color} {...stroke} />
        </g>
      );
    case "blazer":
      return (
        <g>
          <path d="M28 240 L28 198 Q28 176 70 168 L120 196 L170 168 Q212 176 212 198 L212 240 Z" fill={color} {...stroke} />
          <path d="M120 196 L70 240 M120 196 L170 240" stroke={STROKE} strokeWidth="3" />
          {/* white shirt v */}
          <path d="M104 178 L120 196 L136 178 L136 232 L104 232 Z" fill="#FFFFFF" stroke={STROKE} strokeWidth="3" strokeLinejoin="round" />
        </g>
      );
    case "kurta":
      return (
        <g>
          <path d="M28 240 L28 198 Q28 178 64 168 Q92 188 120 188 Q148 188 176 168 Q212 178 212 198 L212 240 Z" fill={color} {...stroke} />
          <path d="M104 178 L120 232 L136 178" stroke={STROKE} strokeWidth="3" fill="none" />
          <circle cx="120" cy="200" r="2.5" fill={STROKE} />
          <circle cx="120" cy="216" r="2.5" fill={STROKE} />
        </g>
      );
    case "overalls":
      return (
        <g>
          {/* white tee underneath */}
          <path d="M30 240 L30 200 Q30 180 70 172 Q92 188 120 188 Q148 188 170 172 Q210 180 210 200 L210 240 Z" fill="#FFFFFF" {...stroke} />
          {/* overalls body */}
          <path d="M60 240 L60 210 Q60 196 80 192 L80 184 Q80 178 90 178 L100 188 L140 188 L150 178 Q160 178 160 184 L160 192 Q180 196 180 210 L180 240 Z" fill={color} stroke={STROKE} strokeWidth={STROKE_W} strokeLinejoin="round" />
          {/* buttons */}
          <circle cx="92" cy="194" r="3" fill={dark} stroke={STROKE} strokeWidth="1.5" />
          <circle cx="148" cy="194" r="3" fill={dark} stroke={STROKE} strokeWidth="1.5" />
        </g>
      );
  }
}

/* ---------------- Hair ---------------- */
function Hair({ style, color }: { style: AvatarConfig["hair"]; color: string }) {
  const s = { fill: color, stroke: STROKE, strokeWidth: STROKE_W, strokeLinejoin: "round" as const };
  switch (style) {
    case "bald":
      return null;
    case "buzz":
      return (
        <path d="M64 92 Q66 64 120 60 Q174 64 176 92 Q172 84 120 80 Q68 84 64 92 Z" {...s} opacity="0.9" />
      );
    case "pixie":
      return (
        <path d="M62 96 Q60 56 120 52 Q180 56 178 96 Q170 80 150 78 L130 86 L116 76 Q90 76 70 90 Q66 92 62 96 Z" {...s} />
      );
    case "swept":
      return (
        <path d="M60 96 Q60 52 120 50 Q182 56 180 100 Q170 82 138 78 Q102 74 78 92 Q66 96 60 96 Z" {...s} />
      );
    case "messy":
      return (
        <path d="M58 100 Q52 56 120 50 Q188 56 182 100 Q174 78 158 84 Q146 70 132 84 Q118 66 102 84 Q88 72 74 84 Q64 76 58 100 Z" {...s} />
      );
    case "wavy":
      return (
        <g {...s}>
          <path d="M58 102 Q54 54 120 50 Q186 54 182 102 Q176 88 168 92 Q156 78 138 86 Q120 72 102 86 Q84 78 72 92 Q64 88 58 102 Z" />
          <path d="M62 98 Q56 130 70 152 L78 138 Q72 122 68 110 Z" />
          <path d="M178 98 Q184 130 170 152 L162 138 Q168 122 172 110 Z" />
        </g>
      );
    case "bob":
      return (
        <path d="M60 130 Q56 56 120 50 Q184 56 180 130 L180 150 L162 146 L162 110 Q120 100 78 110 L78 146 L60 150 Z" {...s} />
      );
    case "long":
      return (
        <g {...s}>
          <path d="M58 120 Q54 56 120 50 Q186 56 182 120 L182 200 L160 192 L160 116 Q120 102 80 116 L80 192 L58 200 Z" />
        </g>
      );
    case "ponytail":
      return (
        <g {...s}>
          <path d="M62 110 Q60 56 120 50 Q180 56 178 110 Q174 92 168 86 Q120 70 72 86 Q66 92 62 110 Z" />
          <path d="M168 100 Q200 124 192 168 Q182 156 176 132 Z" />
        </g>
      );
    case "buns":
      return (
        <g {...s}>
          <circle cx="58" cy="62" r="22" />
          <circle cx="182" cy="62" r="22" />
          {/* ribbons */}
          <path d="M58 50 L52 86 L64 86 Z" fill="#C9163A" stroke={STROKE} strokeWidth="2.5" />
          <path d="M182 50 L176 86 L188 86 Z" fill="#C9163A" stroke={STROKE} strokeWidth="2.5" />
          {/* fringe band */}
          <path d="M62 86 Q62 56 120 52 Q178 56 178 86 Q170 100 152 100 Q120 88 88 100 Q70 100 62 86 Z" />
        </g>
      );
    case "topknot":
      return (
        <g {...s}>
          <path d="M62 92 Q60 58 120 56 Q180 58 178 92 Q170 80 150 78 Q120 74 90 78 Q70 80 62 92 Z" />
          <ellipse cx="120" cy="40" rx="22" ry="18" />
        </g>
      );
    case "manbun":
      return (
        <g {...s}>
          <path d="M62 92 Q62 60 120 56 Q178 60 178 92 Q170 82 120 78 Q70 82 62 92 Z" />
          <circle cx="120" cy="42" r="14" />
        </g>
      );
    case "curly":
      return (
        <g {...s}>
          {[[80,60],[104,52],[136,52],[160,60],[64,82],[176,82],[70,100],[170,100]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="16" />
          ))}
        </g>
      );
    case "afro":
      return (
        <g {...s}>
          <ellipse cx="120" cy="64" rx="68" ry="44" />
          <circle cx="60" cy="100" r="22" />
          <circle cx="180" cy="100" r="22" />
        </g>
      );
    case "mohawk":
      return (
        <g {...s}>
          <path d="M64 96 Q66 88 90 86 Q70 90 64 96 Z" />
          <path d="M176 96 Q174 88 150 86 Q170 90 176 96 Z" />
          <path d="M104 56 Q120 28 136 56 L136 96 L104 96 Z" />
        </g>
      );
  }
}

/* ---------------- Eyebrows ---------------- */
function Eyebrows({ style, color }: { style: AvatarConfig["eyebrows"]; color: string }) {
  const s = { stroke: color, strokeWidth: 5, fill: "none", strokeLinecap: "round" as const };
  switch (style) {
    case "thick":
      return <g stroke={color} strokeWidth="9" strokeLinecap="round"><line x1="80" y1="104" x2="106" y2="104" /><line x1="134" y1="104" x2="160" y2="104" /></g>;
    case "thin":
      return <g {...s} strokeWidth={3}><line x1="82" y1="106" x2="106" y2="104" /><line x1="134" y1="104" x2="158" y2="106" /></g>;
    case "arched":
      return <g {...s}><path d="M80 108 Q92 100 106 106" /><path d="M134 106 Q148 100 160 108" /></g>;
    case "straight":
      return <g {...s}><line x1="80" y1="106" x2="108" y2="106" /><line x1="132" y1="106" x2="160" y2="106" /></g>;
    case "raised":
      return <g {...s}><path d="M80 110 Q92 96 108 102" /><path d="M132 102 Q148 96 160 110" /></g>;
    case "natural":
    default:
      return <g {...s}><path d="M80 106 Q93 100 108 106" /><path d="M132 106 Q147 100 160 106" /></g>;
  }
}

/* ---------------- Eyes ---------------- */
function Eyes({ style, color }: { style: AvatarConfig["eyes"]; color: string }) {
  switch (style) {
    case "round":
      return (
        <g>
          {[[92,124],[148,124]].map(([x,y],i) => (
            <g key={i}>
              <ellipse cx={x} cy={y} rx="8" ry="9" fill="#FFFFFF" stroke={STROKE} strokeWidth="3" />
              <circle cx={x} cy={y} r="4.5" fill={color} />
              <circle cx={x+1.5} cy={y-1.5} r="1.4" fill="#FFFFFF" />
            </g>
          ))}
        </g>
      );
    case "smile":
      return (
        <g stroke={STROKE} strokeWidth="4.5" fill="none" strokeLinecap="round">
          <path d="M84 126 Q92 118 100 126" />
          <path d="M140 126 Q148 118 156 126" />
        </g>
      );
    case "sleepy":
      return (
        <g stroke={STROKE} strokeWidth="4" strokeLinecap="round">
          <line x1="84" y1="125" x2="100" y2="125" />
          <line x1="140" y1="125" x2="156" y2="125" />
        </g>
      );
    case "wink":
      return (
        <g>
          <ellipse cx="92" cy="124" rx="7" ry="8" fill="#FFFFFF" stroke={STROKE} strokeWidth="3" />
          <circle cx="92" cy="124" r="4" fill={color} />
          <path d="M140 126 Q148 118 156 126" stroke={STROKE} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </g>
      );
    case "star":
      return (
        <g fill={color} stroke={STROKE} strokeWidth="2">
          {[[92,124],[148,124]].map(([x,y],i)=> (
            <path key={i} d={`M${x} ${y-9} L${x+2.5} ${y-2.5} L${x+9} ${y} L${x+2.5} ${y+2.5} L${x} ${y+9} L${x-2.5} ${y+2.5} L${x-9} ${y} L${x-2.5} ${y-2.5} Z`} />
          ))}
        </g>
      );
    case "heart":
      return (
        <g fill="#E11D48" stroke={STROKE} strokeWidth="2">
          {[[92,124],[148,124]].map(([x,y],i)=> (
            <path key={i} d={`M${x} ${y+5} C${x-9} ${y-3} ${x-10} ${y-10} ${x-4} ${y-10} C${x-1} ${y-10} ${x} ${y-7} ${x} ${y-5} C${x} ${y-7} ${x+1} ${y-10} ${x+4} ${y-10} C${x+10} ${y-10} ${x+9} ${y-3} ${x} ${y+5} Z`} />
          ))}
        </g>
      );
    case "sharp":
      return (
        <g fill={STROKE}>
          <path d="M82 124 Q92 116 102 124 Q92 130 82 124 Z" />
          <path d="M138 124 Q148 116 158 124 Q148 130 138 124 Z" />
        </g>
      );
    case "side":
      return (
        <g>
          {[[95,124],[151,124]].map(([x,y],i) => (
            <g key={i}>
              <ellipse cx={x-3} cy={y} rx="8" ry="9" fill="#FFFFFF" stroke={STROKE} strokeWidth="3" />
              <circle cx={x-1} cy={y} r="4" fill={color} />
            </g>
          ))}
        </g>
      );
  }
}

/* ---------------- Nose ---------------- */
function Nose({ style, skinShade }: { style: AvatarConfig["nose"]; skinShade: string }) {
  switch (style) {
    case "small":
      return <circle cx="120" cy="142" r="2.2" fill={skinShade} />;
    case "round":
      return <ellipse cx="120" cy="142" rx="5" ry="4" fill={skinShade} stroke={STROKE} strokeWidth="2" />;
    case "pointy":
      return <path d="M120 124 L116 146 L124 146 Z" fill="none" stroke={STROKE} strokeWidth="3" strokeLinejoin="round" />;
    case "angular":
    default:
      return <path d="M120 122 L114 146 L124 146" fill="none" stroke={STROKE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
  }
}

/* ---------------- Mouth ---------------- */
function Mouth({ style }: { style: AvatarConfig["mouth"] }) {
  const s = { stroke: STROKE, strokeWidth: 4, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (style) {
    case "smile":
      return <path d="M104 162 Q120 174 136 162" {...s} />;
    case "grin":
      return (
        <g>
          <path d="M100 158 Q120 178 140 158 Z" fill={STROKE} stroke={STROKE} strokeWidth="3" strokeLinejoin="round" />
          <path d="M104 160 Q120 168 136 160" fill="#FFFFFF" />
        </g>
      );
    case "smirk":
      return <path d="M104 164 Q120 164 136 156" {...s} />;
    case "neutral":
      return <line x1="106" y1="164" x2="134" y2="164" {...s} />;
    case "frown":
      return <path d="M104 168 Q120 158 136 168" {...s} />;
    case "kiss":
      return (
        <g>
          <path d="M114 160 Q120 152 126 160 Q120 170 114 160 Z" fill="#C9163A" stroke={STROKE} strokeWidth="2.5" />
        </g>
      );
    case "pout":
      return <path d="M110 164 Q120 156 130 164 Q120 172 110 164 Z" fill="#C9163A" stroke={STROKE} strokeWidth="2.5" />;
    case "tongue":
      return (
        <g>
          <path d="M104 160 Q120 174 136 160" {...s} />
          <path d="M114 168 Q120 178 126 168 Z" fill="#E94560" stroke={STROKE} strokeWidth="2" />
        </g>
      );
    case "open":
      return (
        <g>
          <ellipse cx="120" cy="166" rx="11" ry="7" fill="#3A0F18" stroke={STROKE} strokeWidth="3" />
        </g>
      );
  }
}

/* ---------------- Beard ---------------- */
function Beard({ style, color }: { style: AvatarConfig["beard"]; color: string }) {
  switch (style) {
    case "stubble":
      return (
        <g fill={color} opacity="0.4">
          {Array.from({ length: 26 }).map((_, i) => {
            const angle = (i / 26) * Math.PI;
            const x = 120 + Math.cos(angle + Math.PI) * 44;
            const y = 162 + Math.sin(angle) * 18;
            return <circle key={i} cx={x} cy={y} r="1.4" />;
          })}
        </g>
      );
    case "mustache":
      return (
        <path d="M100 154 Q108 148 120 152 Q132 148 140 154 Q132 160 120 156 Q108 160 100 154 Z"
          fill={color} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
      );
    case "goatee":
      return (
        <g fill={color} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M100 154 Q108 148 120 152 Q132 148 140 154 Q132 160 120 156 Q108 160 100 154 Z" />
          <path d="M108 172 Q120 188 132 172 Q128 178 120 178 Q112 178 108 172 Z" />
        </g>
      );
    case "full":
      return (
        <path d="M76 138 Q78 170 96 184 Q120 196 144 184 Q162 170 164 138 Q150 152 132 154 Q120 158 108 154 Q90 152 76 138 Z"
          fill={color} stroke={STROKE} strokeWidth={STROKE_W} strokeLinejoin="round" opacity="0.95" />
      );
    case "none":
    default:
      return null;
  }
}

/* ---------------- Glasses ---------------- */
function Glasses({ style }: { style: AvatarConfig["glasses"] }) {
  switch (style) {
    case "round":
      return (
        <g stroke={STROKE} strokeWidth="3.5" fill="none">
          <circle cx="92" cy="124" r="14" />
          <circle cx="148" cy="124" r="14" />
          <line x1="106" y1="124" x2="134" y2="124" />
        </g>
      );
    case "square":
      return (
        <g stroke={STROKE} strokeWidth="3.5" fill="none">
          <rect x="78" y="112" width="28" height="22" rx="3" />
          <rect x="134" y="112" width="28" height="22" rx="3" />
          <line x1="106" y1="124" x2="134" y2="124" />
        </g>
      );
    case "sunglasses":
      return (
        <g stroke={STROKE} strokeWidth="3.5">
          <rect x="76" y="112" width="32" height="20" rx="4" fill={STROKE} />
          <rect x="132" y="112" width="32" height="20" rx="4" fill={STROKE} />
          <line x1="108" y1="122" x2="132" y2="122" />
        </g>
      );
    case "cat-eye":
      return (
        <g stroke={STROKE} strokeWidth="3.5" fill="none">
          <path d="M76 128 Q76 110 96 110 Q112 110 112 124 L108 130 Q92 134 80 132 Z" />
          <path d="M164 128 Q164 110 144 110 Q128 110 128 124 L132 130 Q148 134 160 132 Z" />
          <line x1="112" y1="124" x2="128" y2="124" />
        </g>
      );
    case "none":
    default:
      return null;
  }
}

/* ---------------- Hat ---------------- */
function Hat({ style }: { style: AvatarConfig["hat"] }) {
  const s = { stroke: STROKE, strokeWidth: STROKE_W, strokeLinejoin: "round" as const };
  switch (style) {
    case "beanie":
      return (
        <g>
          <path d="M62 80 Q62 38 120 36 Q178 38 178 80 L178 96 L62 96 Z" fill="#1F1F1F" {...s} />
          <rect x="60" y="92" width="120" height="12" fill="#3A3A3A" stroke={STROKE} strokeWidth="3" />
          <ellipse cx="120" cy="36" rx="6" ry="4" fill="#3A3A3A" stroke={STROKE} strokeWidth="2" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M64 88 Q64 44 120 42 Q176 44 176 88 L176 96 L64 96 Z" fill="hsl(var(--primary))" {...s} />
          <path d="M120 96 Q172 96 192 102 Q172 112 132 110 Z" fill="hsl(var(--primary))" {...s} />
          <circle cx="120" cy="62" r="4" fill="#FFFFFF" stroke={STROKE} strokeWidth="2" />
        </g>
      );
    case "sunhat":
      return (
        <g>
          <ellipse cx="120" cy="86" rx="100" ry="18" fill="#E8C77A" {...s} />
          <path d="M70 86 Q70 44 120 42 Q170 44 170 86 Z" fill="#D4A85C" {...s} />
          <rect x="70" y="80" width="100" height="10" fill="#5C0120" stroke={STROKE} strokeWidth="2.5" />
        </g>
      );
    case "headband":
      return (
        <g>
          <rect x="60" y="80" width="120" height="12" rx="4" fill="#E8A5B5" {...s} />
          <circle cx="120" cy="76" r="9" fill="#C9163A" stroke={STROKE} strokeWidth="3" />
          <circle cx="120" cy="76" r="3" fill="#FFE066" />
        </g>
      );
    case "santa":
      return (
        <g>
          <path d="M62 96 Q60 50 120 38 Q170 50 170 80 L150 96 Z" fill="#D6172E" {...s} />
          <rect x="58" y="92" width="124" height="12" fill="#FFFFFF" stroke={STROKE} strokeWidth="3" />
          <circle cx="170" cy="42" r="10" fill="#FFFFFF" stroke={STROKE} strokeWidth="3" />
        </g>
      );
    case "graduation":
      return (
        <g>
          <rect x="60" y="80" width="120" height="14" fill="#1F1F1F" {...s} />
          <path d="M40 76 L120 50 L200 76 L120 102 Z" fill="#1F1F1F" {...s} />
          <line x1="200" y1="76" x2="206" y2="100" stroke="#FFD740" strokeWidth="3" />
          <circle cx="206" cy="100" r="5" fill="#FFD740" stroke={STROKE} strokeWidth="2" />
        </g>
      );
    case "bow":
      return (
        <g>
          <path d="M100 70 L80 56 L80 86 Z" fill="#E8A5B5" {...s} />
          <path d="M140 70 L160 56 L160 86 Z" fill="#E8A5B5" {...s} />
          <rect x="112" y="62" width="16" height="16" rx="3" fill="#C9163A" stroke={STROKE} strokeWidth="2.5" />
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
