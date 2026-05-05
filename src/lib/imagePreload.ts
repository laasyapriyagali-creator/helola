// Probe image URLs and return only the ones that successfully load.
// Used to guarantee a gallery never shows broken/blank tiles.

export function probeImage(url: string, timeoutMs = 6000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (ok: boolean) => { if (done) return; done = true; resolve(ok); };
    const t = window.setTimeout(() => finish(false), timeoutMs);
    img.onload = () => { window.clearTimeout(t); finish(img.naturalWidth > 0); };
    img.onerror = () => { window.clearTimeout(t); finish(false); };
    img.referrerPolicy = "no-referrer";
    img.src = url;
  });
}

export async function filterLoadable<T extends { url: string }>(
  items: T[],
  want: number,
  timeoutMs = 6000,
): Promise<T[]> {
  const out: T[] = [];
  // Probe in small parallel batches so we keep order but fail fast.
  const batchSize = 4;
  for (let i = 0; i < items.length && out.length < want; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(b => probeImage(b.url, timeoutMs)));
    results.forEach((ok, idx) => { if (ok && out.length < want) out.push(batch[idx]); });
  }
  return out;
}
