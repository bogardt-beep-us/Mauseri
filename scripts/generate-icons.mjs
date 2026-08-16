/**
 * Erzeugt die PNG-Icons fuer PWA-Manifest und Apple-Touch-Icon.
 *
 * Bewusst ohne Bild-Bibliothek: das Icon wird direkt als RGBA-Puffer gezeichnet
 * und mit Bordmitteln (zlib) als PNG kodiert. Damit bleibt das Projekt frei von
 * nativen Abhaengigkeiten, und die Icons sind reproduzierbar aus Code statt als
 * eingecheckte Binaerdateien, die niemand mehr nachvollziehen kann.
 *
 * Aufruf: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

// ---------------------------------------------------------------------------
// Minimaler PNG-Encoder (RGBA, 8 bit, keine Interlacing-Varianten)
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Jede Zeile bekommt ein Filter-Byte (0 = None) vorangestellt.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Zeichen-Helfer: arbeiten auf einem Float-Canvas mit Alpha-Blending
// ---------------------------------------------------------------------------

function createCanvas(size) {
  return { size, data: new Float64Array(size * size * 4) };
}

function blend(canvas, x, y, [r, g, b], alpha) {
  if (alpha <= 0 || x < 0 || y < 0 || x >= canvas.size || y >= canvas.size) return;
  const i = (y * canvas.size + x) * 4;
  const d = canvas.data;
  const a = Math.min(1, alpha);
  d[i] = d[i] * (1 - a) + r * a;
  d[i + 1] = d[i + 1] * (1 - a) + g * a;
  d[i + 2] = d[i + 2] * (1 - a) + b * a;
  d[i + 3] = Math.min(1, d[i + 3] * (1 - a) + a);
}

/** Fuellt jeden Pixel, fuer den `shape` eine Deckung > 0 liefert. */
function paint(canvas, shape, color, alphaScale = 1) {
  for (let y = 0; y < canvas.size; y++) {
    for (let x = 0; x < canvas.size; x++) {
      const cover = shape(x + 0.5, y + 0.5);
      if (cover > 0) blend(canvas, x, y, color, cover * alphaScale);
    }
  }
}

/** Weiche Ellipse: liefert 1 innen, 0 aussen, mit ~1px Kantenglaettung. */
function ellipse(cx, cy, rx, ry) {
  return (x, y) => {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    const d = Math.sqrt(dx * dx + dy * dy);
    // Kantenbreite in normalisierten Einheiten, damit grosse wie kleine Icons glatt bleiben.
    const edge = 1 / Math.min(rx, ry);
    return Math.max(0, Math.min(1, (1 - d) / edge + 0.5));
  };
}

function triangle(ax, ay, bx, by, cx2, cy2) {
  const sign = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
  return (x, y) => {
    const d1 = sign(x, y, ax, ay, bx, by);
    const d2 = sign(x, y, bx, by, cx2, cy2);
    const d3 = sign(x, y, cx2, cy2, ax, ay);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return hasNeg && hasPos ? 0 : 1;
  };
}

function roundedRect(x0, y0, x1, y1, radius) {
  return (x, y) => {
    const cx = Math.min(Math.max(x, x0 + radius), x1 - radius);
    const cy = Math.min(Math.max(y, y0 + radius), y1 - radius);
    const d = Math.hypot(x - cx, y - cy);
    if (x < x0 || x > x1 || y < y0 || y > y1) return 0;
    return Math.max(0, Math.min(1, (radius - d) / 1 + 0.5));
  };
}

function thickLine(x0, y0, x1, y1, width) {
  return (x, y) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const lenSq = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / lenSq));
    const d = Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy));
    return Math.max(0, Math.min(1, (width / 2 - d) / 1 + 0.5));
  };
}

// ---------------------------------------------------------------------------
// Das eigentliche Icon: Mauseris Gesicht vor dem Mond
// ---------------------------------------------------------------------------

const COLORS = {
  bgOuter: [23, 17, 38],
  bgInner: [58, 44, 96],
  moon: [111, 91, 168],
  furLight: [255, 217, 138],
  furDark: [232, 164, 79],
  innerEar: [196, 101, 127],
  eye: [36, 26, 61],
  white: [255, 255, 255],
  mouth: [140, 90, 43],
  whisker: [255, 244, 220],
};

/**
 * @param size Kantenlaenge in Pixeln
 * @param maskable Wenn true, wird das Motiv verkleinert, damit es im
 *   maskable-Safe-Zone-Kreis (80 % Durchmesser) vollstaendig sichtbar bleibt.
 */
function drawIcon(size, { maskable = false, rounded = true } = {}) {
  const canvas = createCanvas(size);
  const s = size / 512; // Designraster ist 512x512
  const scale = maskable ? 0.78 : 1;
  const cx = 256;

  // Verschiebt eine Designkoordinate ins tatsaechliche Pixelraster.
  const px = (v) => (cx + (v - cx) * scale) * s;
  const py = (v) => (256 + (v - 256) * scale) * s;
  const pr = (v) => v * scale * s;

  // Hintergrund: radialer Verlauf, bei maskable randlos
  const radius = rounded && !maskable ? 96 * s : 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - size / 2, y - size * 0.38) / (size * 0.72);
      const t = Math.min(1, d);
      const color = [
        COLORS.bgInner[0] + (COLORS.bgOuter[0] - COLORS.bgInner[0]) * t,
        COLORS.bgInner[1] + (COLORS.bgOuter[1] - COLORS.bgInner[1]) * t,
        COLORS.bgInner[2] + (COLORS.bgOuter[2] - COLORS.bgInner[2]) * t,
      ];
      const cover = radius > 0 ? roundedRect(0, 0, size - 1, size - 1, radius)(x + 0.5, y + 0.5) : 1;
      blend(canvas, x, y, color, cover);
    }
  }

  // Mond
  paint(canvas, ellipse(px(256), py(196), pr(132), pr(132)), COLORS.moon, 0.28);

  // Ohren
  paint(canvas, triangle(px(138), py(214), px(150), py(96), px(242), py(168)), COLORS.furDark);
  paint(canvas, triangle(px(374), py(214), px(362), py(96), px(270), py(168)), COLORS.furDark);
  paint(canvas, triangle(px(160), py(200), px(168), py(132), px(218), py(176)), COLORS.innerEar);
  paint(canvas, triangle(px(352), py(200), px(344), py(132), px(294), py(176)), COLORS.innerEar);

  // Kopf mit vertikalem Fellverlauf
  const head = ellipse(px(256), py(252), pr(128), pr(116));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cover = head(x + 0.5, y + 0.5);
      if (cover <= 0) continue;
      const t = Math.max(0, Math.min(1, (y - py(136)) / (pr(232) || 1)));
      const color = [
        COLORS.furLight[0] + (COLORS.furDark[0] - COLORS.furLight[0]) * t,
        COLORS.furLight[1] + (COLORS.furDark[1] - COLORS.furLight[1]) * t,
        COLORS.furLight[2] + (COLORS.furDark[2] - COLORS.furLight[2]) * t,
      ];
      blend(canvas, x, y, color, cover);
    }
  }

  // Schnurrhaare (unter den Augen zeichnen, damit sie nicht stoeren)
  const whiskerWidth = Math.max(1, pr(7));
  for (const [x0, y0, x1, y1] of [
    [132, 268, 196, 278],
    [136, 306, 198, 300],
    [380, 268, 316, 278],
    [376, 306, 314, 300],
  ]) {
    paint(canvas, thickLine(px(x0), py(y0), px(x1), py(y1), whiskerWidth), COLORS.whisker, 0.85);
  }

  // Augen
  paint(canvas, ellipse(px(206), py(242), pr(26), pr(32)), COLORS.eye);
  paint(canvas, ellipse(px(306), py(242), pr(26), pr(32)), COLORS.eye);
  paint(canvas, ellipse(px(214), py(232), pr(9), pr(11)), COLORS.white);
  paint(canvas, ellipse(px(314), py(232), pr(9), pr(11)), COLORS.white);

  // Nase
  paint(
    canvas,
    triangle(px(256), py(282), px(272), py(296), px(240), py(296)),
    COLORS.innerEar,
  );
  paint(
    canvas,
    triangle(px(272), py(296), px(256), py(308), px(240), py(296)),
    COLORS.innerEar,
  );

  // Mund
  const mouthWidth = Math.max(1, pr(8));
  paint(canvas, thickLine(px(256), py(308), px(234), py(322), mouthWidth), COLORS.mouth);
  paint(canvas, thickLine(px(256), py(308), px(278), py(322), mouthWidth), COLORS.mouth);

  // Float-Canvas -> RGBA-Bytes
  const out = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    out[i * 4] = Math.round(canvas.data[i * 4]);
    out[i * 4 + 1] = Math.round(canvas.data[i * 4 + 1]);
    out[i * 4 + 2] = Math.round(canvas.data[i * 4 + 2]);
    out[i * 4 + 3] = Math.round(canvas.data[i * 4 + 3] * 255);
  }
  return encodePng(size, size, out);
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-180.png', 180, {}],
  ['icon-maskable-512.png', 512, { maskable: true, rounded: false }],
];

for (const [name, size, opts] of targets) {
  const png = drawIcon(size, opts);
  writeFileSync(join(OUT_DIR, name), png);
  console.log(`${name.padEnd(26)} ${size}x${size}  ${(png.length / 1024).toFixed(1)} KB`);
}

console.log('\nIcons geschrieben nach public/');
