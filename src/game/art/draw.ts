/**
 * Kleine Zeichen-Bibliothek fuer die prozedurale Pixelgrafik.
 *
 * Architekturentscheidung: Das Spiel enthaelt keine Bild-Assets. Saemtliche
 * Sprites, Kacheln und Effekte werden beim Start in Canvas-Texturen gezeichnet.
 * Gruende:
 *
 *  1. Rechtssicherheit - jede Linie ist eigener Code, es kann nichts fremdes
 *     hineingeraten.
 *  2. Ladezeit - es gibt nichts nachzuladen; auf dem Handy startet das Spiel
 *     sofort, auch bei schlechter Verbindung.
 *  3. Konsistenz - Regionen bekommen ihre Farbwelt aus einer Palette, statt
 *     dass 200 Einzelbilder von Hand aufeinander abgestimmt werden muessten.
 *
 * Gezeichnet wird bewusst mit harten Kanten (keine Glaettung), damit der
 * Pixel-Look erhalten bleibt.
 */

export type Ctx = CanvasRenderingContext2D;

/** 0xRRGGBB -> "#rrggbb" */
export function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/** 0xRRGGBB + Alpha -> "rgba(...)" */
export function rgba(color: number, alpha: number): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Hellt eine Farbe auf (amount 0..1). */
export function lighten(color: number, amount: number): number {
  const r = Math.min(255, Math.round(((color >> 16) & 0xff) + 255 * amount));
  const g = Math.min(255, Math.round(((color >> 8) & 0xff) + 255 * amount));
  const b = Math.min(255, Math.round((color & 0xff) + 255 * amount));
  return (r << 16) | (g << 8) | b;
}

/** Dunkelt eine Farbe ab (amount 0..1). */
export function darken(color: number, amount: number): number {
  const r = Math.max(0, Math.round(((color >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((color >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((color & 0xff) * (1 - amount)));
  return (r << 16) | (g << 8) | b;
}

/** Mischt zwei Farben (t = 0 -> a, t = 1 -> b). */
export function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

/** Rechteck in Pixelkoordinaten. */
export function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: number, alpha = 1): void {
  ctx.fillStyle = alpha >= 1 ? hex(color) : rgba(color, alpha);
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** Einzelner Pixel. */
export function px(ctx: Ctx, x: number, y: number, color: number, alpha = 1): void {
  rect(ctx, x, y, 1, 1, color, alpha);
}

/** Gefuellte Ellipse mit harten Pixelkanten. */
export function ellipse(
  ctx: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: number,
  alpha = 1,
): void {
  ctx.fillStyle = alpha >= 1 ? hex(color) : rgba(color, alpha);
  const x0 = Math.floor(cx - rx);
  const x1 = Math.ceil(cx + rx);
  const y0 = Math.floor(cy - ry);
  const y1 = Math.ceil(cy + ry);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) ctx.fillRect(x, y, 1, 1);
    }
  }
}

/** Gefuelltes Dreieck. */
export function triangle(
  ctx: Ctx,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  color: number,
  alpha = 1,
): void {
  ctx.fillStyle = alpha >= 1 ? hex(color) : rgba(color, alpha);
  const minX = Math.floor(Math.min(ax, bx, cx));
  const maxX = Math.ceil(Math.max(ax, bx, cx));
  const minY = Math.floor(Math.min(ay, by, cy));
  const maxY = Math.ceil(Math.max(ay, by, cy));
  const sign = (px1: number, py1: number, qx: number, qy: number, rx: number, ry: number) =>
    (px1 - rx) * (qy - ry) - (qx - rx) * (py1 - ry);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const cxp = x + 0.5;
      const cyp = y + 0.5;
      const d1 = sign(cxp, cyp, ax, ay, bx, by);
      const d2 = sign(cxp, cyp, bx, by, cx, cy);
      const d3 = sign(cxp, cyp, cx, cy, ax, ay);
      const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
      const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(hasNeg && hasPos)) ctx.fillRect(x, y, 1, 1);
    }
  }
}

/** Linie nach Bresenham, Dicke in Pixeln. */
export function line(
  ctx: Ctx,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: number,
  width = 1,
  alpha = 1,
): void {
  ctx.fillStyle = alpha >= 1 ? hex(color) : rgba(color, alpha);
  let x = Math.round(x0);
  let y = Math.round(y0);
  const xe = Math.round(x1);
  const ye = Math.round(y1);
  const dx = Math.abs(xe - x);
  const dy = -Math.abs(ye - y);
  const sx = x < xe ? 1 : -1;
  const sy = y < ye ? 1 : -1;
  let err = dx + dy;
  const half = Math.floor(width / 2);
  for (;;) {
    ctx.fillRect(x - half, y - half, width, width);
    if (x === xe && y === ye) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

/** Rechteck mit abgerundeten Ecken (1px Radius-Optik fuer Pixelart). */
export function roundRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  radius = 1,
  alpha = 1,
): void {
  rect(ctx, x + radius, y, w - radius * 2, h, color, alpha);
  rect(ctx, x, y + radius, w, h - radius * 2, color, alpha);
}

/** Weicher radialer Schein - fuer Fackeln, Kristalle, Magie. */
export function glow(ctx: Ctx, cx: number, cy: number, radius: number, color: number, strength = 0.6): void {
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, rgba(color, strength));
  gradient.addColorStop(0.5, rgba(color, strength * 0.35));
  gradient.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
}

/** Bodenschatten unter einer Figur. */
export function shadow(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, alpha = 0.28): void {
  ellipse(ctx, cx, cy, rx, ry, 0x000000, alpha);
}

/**
 * Streut deterministisch Pixel in eine Flaeche - fuer Grasnarbe, Sandkoerner,
 * Steinsprenkel. Ohne diese Textur wirken Kacheln wie einfarbige Bloecke.
 */
export function speckle(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  count: number,
  rng: () => number,
  alpha = 1,
): void {
  for (let i = 0; i < count; i++) {
    px(ctx, x + Math.floor(rng() * w), y + Math.floor(rng() * h), color, alpha);
  }
}

/** Erzeugt ein Canvas mit deaktivierter Kantenglaettung. */
export function makeCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}
