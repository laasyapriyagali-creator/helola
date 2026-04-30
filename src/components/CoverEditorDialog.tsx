import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  imageSrc: string | null;
  onCancel: () => void;
  onSave: (blob: Blob) => Promise<void> | void;
}

export function CoverEditorDialog({ open, imageSrc, onCancel, onSave }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [areaPx, setAreaPx] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setAreaPx(areaPixels);
  }, []);

  const reset = () => { setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0); };

  const handleSave = async () => {
    if (!imageSrc || !areaPx) return;
    setBusy(true);
    try {
      const blob = await renderCropped(imageSrc, areaPx, rotation);
      await onSave(blob);
      reset();
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onCancel(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit cover photo</DialogTitle></DialogHeader>
        <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-muted">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={11 / 4}
              showGrid={true}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
            />
          )}
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Zoom</Label>
            <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={(v) => setZoom(v[0])} className="mt-2" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Rotate</Label>
            <Slider value={[rotation]} min={0} max={360} step={1} onValueChange={(v) => setRotation(v[0])} className="mt-2" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { reset(); onCancel(); }} disabled={busy} className="rounded-full">Cancel</Button>
          <Button onClick={handleSave} disabled={busy || !areaPx} className="rounded-full">
            {busy ? "Saving…" : "Save cover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function renderCropped(src: string, area: Area, rotation: number): Promise<Blob> {
  const img = await loadImage(src);
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const fullW = img.width * cos + img.height * sin;
  const fullH = img.width * sin + img.height * cos;
  const full = document.createElement("canvas");
  full.width = fullW; full.height = fullH;
  const fctx = full.getContext("2d")!;
  fctx.translate(fullW / 2, fullH / 2);
  fctx.rotate(rad);
  fctx.drawImage(img, -img.width / 2, -img.height / 2);
  const out = document.createElement("canvas");
  out.width = area.width; out.height = area.height;
  const octx = out.getContext("2d")!;
  octx.drawImage(full, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  return await new Promise<Blob>((resolve, reject) => {
    out.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))), "image/jpeg", 0.92);
  });
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
