import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Crop, Sliders, Type, Image as ImageIcon, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "crop" | "filter" | "adjust" | "text";

interface Props {
  open: boolean;
  imageSrc: string | null;
  onCancel: () => void;
  onReplace?: () => void;
  onSave: (blob: Blob) => Promise<void> | void;
}

const FILTERS = [
  { id: "none",    label: "Original" },
  { id: "warm",    label: "Warm" },
  { id: "cool",    label: "Cool" },
  { id: "bw",      label: "B&W" },
  { id: "vivid",   label: "Vivid" },
  { id: "vintage", label: "Vintage" },
];

function buildFilter(filter: string, intensity: number, brightness: number, contrast: number, warmth: number) {
  // intensity 0..1, brightness/contrast/warmth -50..50
  const i = intensity;
  const b = 1 + brightness / 100;
  const c = 1 + contrast / 100;
  const hue = warmth * 0.4; // small hue shift; sepia adds warmth
  const sepia = warmth > 0 ? Math.min(1, warmth / 80) : 0;
  let f = `brightness(${b}) contrast(${c}) hue-rotate(${hue}deg) sepia(${sepia})`;
  if (filter === "warm")    f += ` saturate(${1 + 0.2*i}) sepia(${0.2*i})`;
  if (filter === "cool")    f += ` saturate(${1 + 0.15*i}) hue-rotate(${-12*i}deg)`;
  if (filter === "bw")      f += ` grayscale(${i}) contrast(${1 + 0.05*i})`;
  if (filter === "vivid")   f += ` saturate(${1 + 0.6*i}) contrast(${1 + 0.1*i})`;
  if (filter === "vintage") f += ` sepia(${0.5*i}) saturate(${1 + 0.1*i}) contrast(${1 - 0.05*i})`;
  return f;
}

export function PhotoEditorDialog({ open, imageSrc, onCancel, onReplace, onSave }: Props) {
  const [tab, setTab] = useState<Tab>("crop");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [naturalAspect, setNaturalAspect] = useState<number>(1);
  const [filter, setFilter] = useState("none");
  const [intensity, setIntensity] = useState(0.6);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [warmth, setWarmth] = useState(0);
  const [caption, setCaption] = useState("");
  const [areaPx, setAreaPx] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTab("crop"); setCrop({ x:0, y:0 }); setZoom(1); setRotation(0);
      setFilter("none"); setIntensity(0.6);
      setBrightness(0); setContrast(0); setWarmth(0); setCaption("");
    }
    if (open && imageSrc) {
      const i = new Image();
      i.onload = () => setNaturalAspect(i.width / i.height);
      i.src = imageSrc;
    }
  }, [open, imageSrc]);

  const cssFilter = buildFilter(filter, intensity, brightness, contrast, warmth);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => setAreaPx(areaPixels), []);

  const handleSave = async () => {
    if (!imageSrc || !areaPx) return;
    setBusy(true);
    try {
      const blob = await renderEdited(imageSrc, areaPx, rotation, cssFilter, caption.trim());
      await onSave(blob);
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit photo</DialogTitle></DialogHeader>

        <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-black">
          {imageSrc && (
            <div className="absolute inset-0" style={{ filter: cssFilter }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={naturalAspect}
                showGrid={tab === "crop"}
                restrictPosition={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>
          )}
          {caption && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 px-4 text-center">
              <span className="inline-block max-w-full rounded-md bg-black/55 px-2.5 py-1 text-sm font-medium text-white">{caption}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-around border-b border-border pb-2">
          {[
            { id: "crop" as Tab,   icon: Crop,    label: "Crop" },
            { id: "filter" as Tab, icon: ImageIcon, label: "Filter" },
            { id: "adjust" as Tab, icon: Sliders, label: "Adjust" },
            { id: "text" as Tab,   icon: Type,    label: "Text" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex flex-col items-center gap-0.5 px-3 py-1 text-xs", tab===t.id ? "text-primary font-semibold" : "text-muted-foreground")}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Panels */}
        {tab === "crop" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {[
                { label: "Original", val: undefined },
                { label: "1:1", val: 1 },
              ].map(o => (
                <button key={o.label} onClick={() => setAspect(o.val)}
                  className={cn("rounded-full border px-3 py-1 text-xs font-medium",
                    aspect === o.val ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
                  {o.label}
                </button>
              ))}
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Zoom</Label>
              <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={(v) => setZoom(v[0])} className="mt-2" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Rotate</Label>
              <Slider value={[rotation]} min={-180} max={180} step={1} onValueChange={(v) => setRotation(v[0])} className="mt-2" />
            </div>
          </div>
        )}

        {tab === "filter" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={cn("rounded-full px-3 py-1.5 text-xs font-semibold",
                    filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70")}>
                  {f.label}
                </button>
              ))}
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Intensity</Label>
              <Slider value={[intensity]} min={0} max={1} step={0.05} onValueChange={(v) => setIntensity(v[0])} className="mt-2" disabled={filter==="none"} />
            </div>
          </div>
        )}

        {tab === "adjust" && (
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Brightness</Label>
              <Slider value={[brightness]} min={-50} max={50} step={1} onValueChange={(v) => setBrightness(v[0])} className="mt-2" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Contrast</Label>
              <Slider value={[contrast]} min={-50} max={50} step={1} onValueChange={(v) => setContrast(v[0])} className="mt-2" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Warmth</Label>
              <Slider value={[warmth]} min={-50} max={50} step={1} onValueChange={(v) => setWarmth(v[0])} className="mt-2" />
            </div>
          </div>
        )}

        {tab === "text" && (
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Caption on image</Label>
            <Input value={caption} onChange={e => setCaption(e.target.value)} maxLength={80} placeholder="Short caption…" className="mt-2" />
          </div>
        )}

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { onCancel(); }} disabled={busy} className="rounded-full">Cancel</Button>
            {onReplace && (
              <Button variant="outline" onClick={onReplace} disabled={busy} className="rounded-full">
                <RefreshCw className="mr-1 h-4 w-4" /> Replace
              </Button>
            )}
          </div>
          <Button onClick={handleSave} disabled={busy || !areaPx} className="rounded-full">
            <Check className="mr-1 h-4 w-4" /> {busy ? "Saving…" : "Done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function renderEdited(src: string, area: Area, rotation: number, cssFilter: string, caption: string): Promise<Blob> {
  const img = await loadImage(src);
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
  const fullW = img.width * cos + img.height * sin;
  const fullH = img.width * sin + img.height * cos;
  const full = document.createElement("canvas");
  full.width = fullW; full.height = fullH;
  const fctx = full.getContext("2d")!;
  fctx.translate(fullW/2, fullH/2);
  fctx.rotate(rad);
  fctx.drawImage(img, -img.width/2, -img.height/2);

  const out = document.createElement("canvas");
  out.width = area.width; out.height = area.height;
  const octx = out.getContext("2d")!;
  octx.filter = cssFilter || "none";
  octx.drawImage(full, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);

  if (caption) {
    octx.filter = "none";
    const fontSize = Math.max(18, Math.round(area.width * 0.04));
    octx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    octx.textAlign = "center";
    octx.textBaseline = "bottom";
    const text = caption;
    const padX = fontSize * 0.6, padY = fontSize * 0.35;
    const tw = Math.min(area.width - 40, octx.measureText(text).width);
    const x = area.width / 2;
    const y = area.height - fontSize;
    octx.fillStyle = "rgba(0,0,0,0.55)";
    roundRect(octx, x - tw/2 - padX, y - fontSize - padY/2, tw + padX*2, fontSize + padY*1.2, 8);
    octx.fill();
    octx.fillStyle = "#fff";
    octx.fillText(text, x, y);
  }

  return await new Promise<Blob>((resolve, reject) => {
    out.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))), "image/jpeg", 0.92);
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
