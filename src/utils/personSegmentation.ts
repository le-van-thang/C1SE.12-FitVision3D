/**
 * Smart Client-Side Person Cutout & Distance Normalization
 * - Samples border/corner background color clusters
 * - Runs edge-aware BFS flood-fill from image edges so interior skin & bright clothing stay intact
 * - Crops tight foreground bounding box so people photographed at any distance scale uniformly in the Loft
 */

export interface CutoutResult {
  cutoutDataUrl: string;
  originalDataUrl: string;
  foregroundRatio: number;
  width: number;
  height: number;
}

interface RgbSample {
  r: number;
  g: number;
  b: number;
}

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

/** Quantizes outer perimeter colors into up to 5 representative background centroids. */
function extractBorderPalette(data: Uint8ClampedArray, w: number, h: number): RgbSample[] {
  const samples: RgbSample[] = [];
  const margin = Math.max(2, Math.floor(Math.min(w, h) * 0.025));

  const pushPx = (x: number, y: number) => {
    const idx = (y * w + x) * 4;
    samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  };

  for (let x = 0; x < w; x += 3) {
    for (let y = 0; y < margin; y += 2) pushPx(x, y);
  }
  for (let y = margin; y < h - margin; y += 3) {
    for (let dx = 0; dx < margin; dx += 2) {
      pushPx(dx, y);
      pushPx(w - 1 - dx, y);
    }
  }

  // Greedy clustering with color radius 28
  const clusters: { sumR: number; sumG: number; sumB: number; count: number }[] = [];
  for (const s of samples) {
    let matched = false;
    for (const c of clusters) {
      const cr = c.sumR / c.count;
      const cg = c.sumG / c.count;
      const cb = c.sumB / c.count;
      const dist = Math.hypot(s.r - cr, s.g - cg, s.b - cb);
      if (dist < 30) {
        c.sumR += s.r;
        c.sumG += s.g;
        c.sumB += s.b;
        c.count += 1;
        matched = true;
        break;
      }
    }
    if (!matched && clusters.length < 8) {
      clusters.push({ sumR: s.r, sumG: s.g, sumB: s.b, count: 1 });
    }
  }

  clusters.sort((a, b) => b.count - a.count);
  return clusters.slice(0, 5).map((c) => ({
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
 * Processes an uploaded user photo into:
 * 1) Background-removed & distance-normalized person cutout PNG
 * 2) Clean distance-cropped original image (for fallback/comparison)
 */
export async function processPersonCutout(
  input: File | Blob | string,
  sensitivity = 0.5
): Promise<CutoutResult> {
  const originalDataUrl = typeof input === 'string' ? input : await readFileAsDataUrl(input);
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
    return { cutoutDataUrl: originalDataUrl, originalDataUrl, foregroundRatio: 1, width: w, height: h };
  }

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 1. Grayscale & Sobel edge magnitude so strong human contours halt background flood fill
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
  const distThresh = 24 + sens * 48; // ~36..72 RGB distance
  const edgeGate = 28 + sens * 32;

  // 2. BFS flood-fill background from top, left, right, and bottom corners
  const visited = new Uint8Array(total);
  const isBg = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const trySeed = (idx: number) => {
    if (visited[idx]) return;
    const p = idx * 4;
    const d = minPaletteDist(data[p], data[p + 1], data[p + 2], palette);
    if (d <= distThresh * 1.15) {
      visited[idx] = 1;
      isBg[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < w; x++) {
    trySeed(x);
    if (x < w * 0.25 || x > w * 0.75) trySeed((h - 1) * w + x);
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
      // Allow slightly tighter threshold across edges, generous on smooth walls
      if (d <= distThresh && edge[nb] <= edgeGate) {
        isBg[nb] = 1;
        queue[tail++] = nb;
      }
    }
  }

  // 3. Soften border alpha + clear interior gap pockets matching tight palette (e.g. between arms & waist)
  const alpha = new Uint8ClampedArray(total);
  for (let i = 0; i < total; i++) {
    if (isBg[i]) {
      alpha[i] = 0;
    } else {
      const p = i * 4;
      const d = minPaletteDist(data[p], data[p + 1], data[p + 2], palette);
      // Very strict pocket check in outer 28%..72% band if smooth background peeks between arms/legs
      if (d < distThresh * 0.58 && edge[i] < 12) {
        alpha[i] = 0;
      } else {
        alpha[i] = 255;
      }
    }
  }

  // 3x3 contour smoothing feather (prevents harsh staircase halos)
  const smoothAlpha = new Uint8ClampedArray(total);
  let fgCount = 0;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        smoothAlpha[idx] = alpha[idx];
        continue;
      }
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const row = (y + dy) * w + x;
        sum += alpha[row - 1] + alpha[row] + alpha[row + 1];
      }
      const avg = Math.round(sum / 9);
      // Preserve crisp core opacity while feathering 1-2px silhouette edge
      const finalA = alpha[idx] === 255 && avg > 200 ? 255 : avg < 35 ? 0 : avg;
      smoothAlpha[idx] = finalA;
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

  // Fallback gracefully if segmentation stripped nearly everything (< 4% foreground)
  if (fgRatio < 0.04 || maxX <= minX || maxY <= minY) {
    return {
      cutoutDataUrl: originalDataUrl,
      originalDataUrl,
      foregroundRatio: fgRatio,
      width: w,
      height: h,
    };
  }

  // 4. Crop tightly around extracted human silhouette so distance differences normalize cleanly
  const padX = Math.round((maxX - minX) * 0.06);
  const padY = Math.round((maxY - minY) * 0.03);
  const cropX = Math.max(0, minX - padX);
  const cropY = Math.max(0, minY - padY);
  const cropW = Math.min(w - cropX, maxX - minX + padX * 2);
  const cropH = Math.min(h - cropY, maxY - minY + padY * 2);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = cropW;
  outCanvas.height = cropH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) {
    return { cutoutDataUrl: workCanvas.toDataURL('image/png'), originalDataUrl, foregroundRatio: fgRatio, width: w, height: h };
  }
  outCtx.drawImage(workCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return {
    cutoutDataUrl: outCanvas.toDataURL('image/png'),
    originalDataUrl,
    foregroundRatio: fgRatio,
    width: cropW,
    height: cropH,
  };
}
