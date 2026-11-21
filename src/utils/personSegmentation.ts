/**
 * Hybrid Person Cutout & Distance Normalization
 * 1) Prefers MediaPipe SelfieSegmentation endpoint on local AI backend (:8000/api/v1/segment-person) when running
 * 2) Falls back cleanly to enhanced client-side 4-border + floor flood-fill & central-component person cropper
 */

export interface CutoutResult {
  cutoutDataUrl: string;
  originalDataUrl: string;
  foregroundRatio: number;
  width: number;
  height: number;
  engine?: 'mediapipe' | 'canvas';
}

interface RgbSample {
  r: number;
  g: number;
  b: number;
}

const AI_BASE_URL = (import.meta as any).env?.VITE_AI_URL || 'http://localhost:8000';

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/** Quantizes ALL 4 outer borders (wall + corners + floor) into background color clusters. */
function extractBorderPalette(data: Uint8ClampedArray, w: number, h: number): RgbSample[] {
  const samples: RgbSample[] = [];
  const margin = Math.max(3, Math.floor(Math.min(w, h) * 0.035));

  const pushPx = (x: number, y: number) => {
    const idx = (y * w + x) * 4;
    samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  };

  // Top + Bottom floor margin
  for (let x = 0; x < w; x += 3) {
    for (let dy = 0; dy < margin; dy += 2) {
      pushPx(x, dy);
      pushPx(x, h - 1 - dy);
    }
  }
  // Left + Right margins
  for (let y = margin; y < h - margin; y += 3) {
    for (let dx = 0; dx < margin; dx += 2) {
      pushPx(dx, y);
      pushPx(w - 1 - dx, y);
    }
  }

  const clusters: { sumR: number; sumG: number; sumB: number; count: number }[] = [];
  for (const s of samples) {
    let matched = false;
    for (const c of clusters) {
      const cr = c.sumR / c.count;
      const cg = c.sumG / c.count;
      const cb = c.sumB / c.count;
      if (Math.hypot(s.r - cr, s.g - cg, s.b - cb) < 28) {
        c.sumR += s.r;
        c.sumG += s.g;
        c.sumB += s.b;
        c.count += 1;
        matched = true;
        break;
      }
    }
    if (!matched && clusters.length < 12) {
      clusters.push({ sumR: s.r, sumG: s.g, sumB: s.b, count: 1 });
    }
  }

  clusters.sort((a, b) => b.count - a.count);
  return clusters.slice(0, 8).map((c) => ({
    r: c.sumR / c.count,
    g: c.sumG / c.count,
    b: c.sumB / c.count,
  }));
}

function minPaletteDist(r: number, g: number, b: number, palette: RgbSample[]): number {
  let best = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const p = palette[i];
    const dr = r - p.r;
    const dg = g - p.g;
    const db = b - p.b;
    const d = Math.sqrt(dr * dr + dg * dg + db * db);
    if (d < best) best = d;
  }
  return best;
}

/**
 * Keeps ONLY the largest central foreground connected component (automatically drops
 * detached side chairs, bags, or corner slippers so cropping stays strictly on the human).
 */
function isolatePrimaryPersonMask(fgMask: Uint8Array, w: number, h: number): Uint8Array {
  const total = w * h;
  const labels = new Int32Array(total);
  const queue = new Int32Array(total);
  const compStats: { id: number; area: number; centralOverlap: number }[] = [];

  const cxMin = Math.floor(w * 0.28);
  const cxMax = Math.ceil(w * 0.72);
  let nextId = 1;

  for (let i = 0; i < total; i++) {
    if (!fgMask[i] || labels[i] !== 0) continue;
    const id = nextId++;
    let head = 0;
    let tail = 0;
    let area = 0;
    let centralOverlap = 0;

    labels[i] = id;
    queue[tail++] = i;

    while (head < tail) {
      const curr = queue[head++];
      area++;
      const x = curr % w;
      const y = (curr - x) / w;
      if (x >= cxMin && x <= cxMax) centralOverlap++;

      const nbs = [
        x > 0 ? curr - 1 : -1,
        x < w - 1 ? curr + 1 : -1,
        y > 0 ? curr - w : -1,
        y < h - 1 ? curr + w : -1,
      ];
      for (let k = 0; k < 4; k++) {
        const nb = nbs[k];
        if (nb >= 0 && fgMask[nb] && labels[nb] === 0) {
          labels[nb] = id;
          queue[tail++] = nb;
        }
      }
    }

    if (area > 40) {
      compStats.push({ id, area, centralOverlap });
    }
  }

  if (compStats.length === 0) return fgMask;

  // Score components prioritizing human silhouettes spanning the central frame
  compStats.sort((a, b) => (b.centralOverlap * 2 + b.area) - (a.centralOverlap * 2 + a.area));
  const bestId = compStats[0].id;
  const out = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    if (labels[i] === bestId) out[i] = 1;
  }
  return out;
}

async function processPersonCutoutClient(originalDataUrl: string, sensitivity: number): Promise<CutoutResult> {
  const img = await loadImageElement(originalDataUrl);
  const maxDim = 640;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const w = Math.max(32, Math.round((img.naturalWidth || 480) * scale));
  const h = Math.max(32, Math.round((img.naturalHeight || 640) * scale));

  const workCanvas = document.createElement('canvas');
  workCanvas.width = w;
  workCanvas.height = h;
  const ctx = workCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { cutoutDataUrl: originalDataUrl, originalDataUrl, foregroundRatio: 1, width: w, height: h, engine: 'canvas' };
  }

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const total = w * h;
  const gray = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    const p = i * 4;
    gray[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }

  const edge = new Float32Array(total);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const gx =
        -gray[idx - w - 1] + gray[idx - w + 1] +
        -2 * gray[idx - 1] + 2 * gray[idx + 1] +
        -gray[idx + w - 1] + gray[idx + w + 1];
      const gy =
        -gray[idx - w - 1] - 2 * gray[idx - w] - gray[idx - w + 1] +
        gray[idx + w - 1] + 2 * gray[idx + w] + gray[idx + w + 1];
      edge[idx] = Math.hypot(gx, gy) * 0.25;
    }
  }

  const palette = extractBorderPalette(data, w, h);
  const sens = Math.max(0.1, Math.min(1.0, sensitivity));
  const distThresh = 26 + sens * 50;
  const edgeGate = 30 + sens * 34;

  const visited = new Uint8Array(total);
  const isBg = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const trySeed = (idx: number) => {
    if (visited[idx]) return;
    const p = idx * 4;
    if (minPaletteDist(data[p], data[p + 1], data[p + 2], palette) <= distThresh * 1.2) {
      visited[idx] = 1;
      isBg[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < w; x++) {
    trySeed(x);
    trySeed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    trySeed(y * w);
    trySeed(y * w + (w - 1));
  }

  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % w;
    const cy = (curr - cx) / w;
    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < w - 1 ? curr + 1 : -1,
      cy > 0 ? curr - w : -1,
      cy < h - 1 ? curr + w : -1,
    ];
    for (let k = 0; k < 4; k++) {
      const nb = neighbors[k];
      if (nb < 0 || visited[nb]) continue;
      visited[nb] = 1;
      const p = nb * 4;
      const d = minPaletteDist(data[p], data[p + 1], data[p + 2], palette);
      if (d <= distThresh && edge[nb] <= edgeGate) {
        isBg[nb] = 1;
        queue[tail++] = nb;
      }
    }
  }

  const rawFg = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    if (isBg[i]) {
      rawFg[i] = 0;
    } else {
      const p = i * 4;
      const d = minPaletteDist(data[p], data[p + 1], data[p + 2], palette);
      rawFg[i] = d < distThresh * 0.56 && edge[i] < 12 ? 0 : 1;
    }
  }

  // Isolate central person silhouette & strip disconnected corner objects
  const personFg = isolatePrimaryPersonMask(rawFg, w, h);

  let fgCount = 0;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        data[idx * 4 + 3] = personFg[idx] ? 255 : 0;
        continue;
      }
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const row = (y + dy) * w + x;
        sum += (personFg[row - 1] + personFg[row] + personFg[row + 1]) * 255;
      }
      const avg = Math.round(sum / 9);
      const finalA = personFg[idx] === 1 && avg > 200 ? 255 : avg < 35 ? 0 : avg;
      data[idx * 4 + 3] = finalA;

      if (finalA > 60) {
        fgCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const fgRatio = fgCount / total;
  if (fgRatio < 0.04 || maxX <= minX || maxY <= minY) {
    return { cutoutDataUrl: originalDataUrl, originalDataUrl, foregroundRatio: fgRatio, width: w, height: h, engine: 'canvas' };
  }

  const padX = Math.round((maxX - minX) * 0.05);
  const padY = Math.round((maxY - minY) * 0.025);
  const cropX = Math.max(0, minX - padX);
  const cropY = Math.max(0, minY - padY);
  const cropW = Math.min(w - cropX, maxX - minX + padX * 2);
  const cropH = Math.min(h - cropY, maxY - minY + padY * 2);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = cropW;
  outCanvas.height = cropH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) {
    return { cutoutDataUrl: workCanvas.toDataURL('image/png'), originalDataUrl, foregroundRatio: fgRatio, width: w, height: h, engine: 'canvas' };
  }
  outCtx.drawImage(workCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return {
    cutoutDataUrl: outCanvas.toDataURL('image/png'),
    originalDataUrl,
    foregroundRatio: fgRatio,
    width: cropW,
    height: cropH,
    engine: 'canvas',
  };
}

/**
 * Removes background & normalizes human cutout scale so any photo distance stands properly in Loft.
 * Uses MediaPipe SelfieSegmentation when Python backend (:8000) is reachable, else smart browser cutout.
 */
export async function processPersonCutout(
  input: File | Blob | string,
  sensitivity = 0.52
): Promise<CutoutResult> {
  const originalDataUrl = typeof input === 'string' ? input : await readFileAsDataUrl(input);

  // Attempt local MediaPipe neural segmentation first (1.6s timeout)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1600);
    const blob = typeof input === 'string' ? await dataUrlToBlob(input) : input;
    const fd = new FormData();
    fd.append('file', blob, 'person.jpg');
    // Higher slider sensitivity -> slightly stricter foreground threshold
    fd.append('threshold', String(Math.round((0.25 + sensitivity * 0.45) * 100) / 100));

    const resp = await fetch(`${AI_BASE_URL}/api/v1/segment-person`, {
      method: 'POST',
      body: fd,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (resp.ok) {
      const json = await resp.json();
      if (json?.cutout_data_url) {
        return {
          cutoutDataUrl: json.cutout_data_url,
          originalDataUrl,
          foregroundRatio: json.foreground_ratio ?? 0.35,
          width: json.width ?? 400,
          height: json.height ?? 700,
          engine: 'mediapipe',
        };
      }
    }
  } catch {
    // Fallback quietly when Python AI core (:8000) is offline
  }

  return processPersonCutoutClient(originalDataUrl, sensitivity);
}
