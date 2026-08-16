/**
 * Erzeugt fuer jede Region ein komplettes Tileset als Canvas-Textur.
 *
 * Aufbau des Tilesets: eine Spalte je Variante, eine Zeile je Kacheltyp.
 * Der Kachelindex ergibt sich aus TILE_ORDER.indexOf(id) * VARIANTS + variante.
 * Varianten sorgen dafuer, dass grosse Grasflaechen nicht wie Tapete wirken.
 */

import { TILE } from '@/core/constants';
import { createRng, hashString } from '@/core/rng';
import type { RegionPalette, TileId } from '@/data/types';
import { REGIONS } from '@/data/regions';
import {
  darken,
  ellipse,
  glow,
  hex,
  lighten,
  line,
  makeCanvas,
  mix,
  px,
  rect,
  speckle,
  triangle,
  type Ctx,
} from './draw';

export const VARIANTS = 4;

/** Reihenfolge der Kacheln im Tileset. Aenderungen invalidieren Spielstaende nicht,
 *  da Karten ueber Zeichen und nicht ueber Indizes gespeichert werden. */
export const TILE_ORDER: TileId[] = [
  'void',
  'grass',
  'grassAlt',
  'path',
  'floor',
  'sand',
  'water',
  'waterDeep',
  'bridge',
  'rock',
  'cliff',
  'tree',
  'bush',
  'flower',
  'wall',
  'roof',
  'door',
  'window',
  'ledge',
  'shadow',
  'pit',
  'ice',
  'stairs',
  'rubble',
  'carpet',
  'sign',
  'crystal',
  'grave',
  'mud',
  'lilypad',
  'fence',
  'table',
  'counter',
];

const TILE_INDEX = new Map<TileId, number>(TILE_ORDER.map((id, i) => [id, i]));

export function tileIndex(id: TileId, variant = 0): number {
  const row = TILE_INDEX.get(id);
  if (row === undefined) return 0;
  return row * VARIANTS + (variant % VARIANTS);
}

/** Kacheln, die Varianten sinnvoll nutzen (Natur). Rest bekommt Variante 0. */
const VARIED: TileId[] = ['grass', 'grassAlt', 'path', 'sand', 'water', 'floor', 'rock', 'mud'];

export function usesVariants(id: TileId): boolean {
  return VARIED.includes(id);
}

export function tilesetKey(regionId: string): string {
  return `tileset:${regionId}`;
}

// ---------------------------------------------------------------------------
// Zeichenroutinen je Kacheltyp
// ---------------------------------------------------------------------------

type TileDrawer = (ctx: Ctx, p: RegionPalette, rng: () => number, variant: number) => void;

const S = TILE;

/** Grundflaeche mit leichter Koernung - Basis fuer fast alle Bodenkacheln. */
function groundBase(ctx: Ctx, color: number, rng: () => number, grainCount = 26): void {
  rect(ctx, 0, 0, S, S, color);
  speckle(ctx, 0, 0, S, S, lighten(color, 0.05), grainCount, rng, 0.5);
  speckle(ctx, 0, 0, S, S, darken(color, 0.06), grainCount, rng, 0.4);
}

const DRAWERS: Partial<Record<TileId, TileDrawer>> = {
  void: (ctx) => {
    rect(ctx, 0, 0, S, S, 0x000000, 0);
  },

  grass: (ctx, p, rng, variant) => {
    groundBase(ctx, p.ground, rng, 30);
    // Grashalme: kurze senkrechte Striche, Dichte je Variante
    const blades = 5 + variant * 3;
    for (let i = 0; i < blades; i++) {
      const bx = Math.floor(rng() * S);
      const by = Math.floor(rng() * S);
      const h = 2 + Math.floor(rng() * 2);
      line(ctx, bx, by, bx, by - h, darken(p.foliage, 0.08), 1, 0.55);
    }
  },

  grassAlt: (ctx, p, rng, variant) => {
    groundBase(ctx, p.groundAlt, rng, 24);
    for (let i = 0; i < 3 + variant; i++) {
      const bx = 3 + Math.floor(rng() * (S - 6));
      const by = 3 + Math.floor(rng() * (S - 6));
      ellipse(ctx, bx, by, 2, 1, lighten(p.ground, 0.08), 0.6);
    }
  },

  path: (ctx, p, rng, variant) => {
    groundBase(ctx, p.path, rng, 20);
    // Unregelmaessige Pflastersteine
    const stones = 3 + variant;
    for (let i = 0; i < stones; i++) {
      const sx = 2 + Math.floor(rng() * (S - 8));
      const sy = 2 + Math.floor(rng() * (S - 8));
      const sw = 4 + Math.floor(rng() * 5);
      const sh = 3 + Math.floor(rng() * 4);
      rect(ctx, sx, sy, sw, sh, p.pathAlt, 0.7);
      rect(ctx, sx, sy, sw, 1, lighten(p.pathAlt, 0.1), 0.5);
    }
  },

  floor: (ctx, p, rng) => {
    const board = mix(p.wall, 0x6b4a2f, 0.5);
    rect(ctx, 0, 0, S, S, board);
    // Dielen
    for (let y = 0; y < S; y += 8) {
      rect(ctx, 0, y, S, 1, darken(board, 0.22), 0.8);
      speckle(ctx, 0, y + 1, S, 7, lighten(board, 0.05), 6, rng, 0.35);
    }
    rect(ctx, 0, 0, 1, S, darken(board, 0.15), 0.4);
  },

  sand: (ctx, p, rng, variant) => {
    const sandColor = mix(p.path, 0xf0e0b0, 0.45);
    groundBase(ctx, sandColor, rng, 40);
    // Sandrippel
    for (let i = 0; i < 2 + variant; i++) {
      const y = 4 + Math.floor(rng() * (S - 8));
      for (let x = 0; x < S; x++) {
        px(ctx, x, y + Math.round(Math.sin((x / S) * Math.PI * 2 + variant) * 1.5), darken(sandColor, 0.08), 0.5);
      }
    }
  },

  water: (ctx, p, rng, variant) => {
    rect(ctx, 0, 0, S, S, p.water);
    // Wellenlinien, je Variante versetzt -> ergibt animiertes Wasser
    for (let i = 0; i < 3; i++) {
      const y = 4 + i * 9 + variant * 2;
      for (let x = 0; x < S; x++) {
        const wave = Math.sin((x / S) * Math.PI * 2 + variant * 1.6 + i) * 1.6;
        px(ctx, x, Math.round(y + wave), lighten(p.water, 0.16), 0.55);
      }
    }
    speckle(ctx, 0, 0, S, S, lighten(p.water, 0.22), 6, rng, 0.3);
  },

  waterDeep: (ctx, p, rng, variant) => {
    rect(ctx, 0, 0, S, S, p.waterDeep);
    for (let i = 0; i < 2; i++) {
      const y = 8 + i * 12 + variant;
      for (let x = 0; x < S; x++) {
        const wave = Math.sin((x / S) * Math.PI * 2 + variant + i * 2) * 1.2;
        px(ctx, x, Math.round(y + wave), lighten(p.waterDeep, 0.14), 0.4);
      }
    }
    speckle(ctx, 0, 0, S, S, darken(p.waterDeep, 0.2), 10, rng, 0.3);
  },

  bridge: (ctx, p, rng) => {
    rect(ctx, 0, 0, S, S, p.waterDeep);
    const plank = mix(p.trunk, 0xc9a06a, 0.4);
    rect(ctx, 0, 3, S, S - 6, plank);
    for (let y = 3; y < S - 3; y += 6) {
      rect(ctx, 0, y, S, 1, darken(plank, 0.3), 0.8);
    }
    rect(ctx, 0, 3, S, 1, lighten(plank, 0.12));
    rect(ctx, 0, S - 4, S, 1, darken(plank, 0.35));
    speckle(ctx, 0, 4, S, S - 8, darken(plank, 0.15), 8, rng, 0.35);
  },

  rock: (ctx, p, rng, variant) => {
    rect(ctx, 0, 0, S, S, p.rockDark);
    // Blockiger Fels mit Lichtkante oben
    rect(ctx, 1, 1, S - 2, S - 3, p.rock);
    rect(ctx, 1, 1, S - 2, 2, lighten(p.rock, 0.14));
    rect(ctx, 1, S - 4, S - 2, 2, darken(p.rock, 0.24));
    // Risse
    for (let i = 0; i < 2 + variant; i++) {
      const cx = 4 + Math.floor(rng() * (S - 8));
      const cy = 5 + Math.floor(rng() * (S - 12));
      line(ctx, cx, cy, cx + Math.floor(rng() * 6) - 3, cy + 4 + Math.floor(rng() * 4), darken(p.rock, 0.3), 1, 0.7);
    }
    speckle(ctx, 2, 2, S - 4, S - 6, lighten(p.rock, 0.1), 12, rng, 0.4);
  },

  cliff: (ctx, p, rng) => {
    rect(ctx, 0, 0, S, S, p.rockDark);
    // Senkrechte Felswand mit Schichtung
    for (let y = 0; y < S; y += 5) {
      rect(ctx, 0, y, S, 3, mix(p.rock, p.rockDark, (y / S) * 0.7));
      rect(ctx, 0, y + 3, S, 1, darken(p.rockDark, 0.3), 0.8);
    }
    rect(ctx, 0, 0, S, 2, lighten(p.rock, 0.18));
    speckle(ctx, 0, 0, S, S, darken(p.rockDark, 0.25), 14, rng, 0.4);
  },

  tree: (ctx, p, rng, variant) => {
    // Stamm
    rect(ctx, 13, 18, 6, 12, p.trunk);
    rect(ctx, 13, 18, 2, 12, lighten(p.trunk, 0.12));
    // Krone in drei ueberlappenden Ballen
    const crown = p.foliage;
    ellipse(ctx, 16, 14, 13, 12, p.foliageDark);
    ellipse(ctx, 14, 12, 10, 9, crown);
    ellipse(ctx, 20, 15, 8, 7, lighten(crown, 0.06));
    ellipse(ctx, 12, 17, 7, 6, darken(crown, 0.08));
    // Blattpunkte
    for (let i = 0; i < 10 + variant * 2; i++) {
      const a = rng() * Math.PI * 2;
      const r = rng() * 10;
      px(ctx, 16 + Math.cos(a) * r, 14 + Math.sin(a) * r * 0.9, lighten(crown, 0.16), 0.5);
    }
  },

  bush: (ctx, p, rng, variant) => {
    groundBase(ctx, p.ground, rng, 14);
    ellipse(ctx, 16, 20, 11, 9, p.foliageDark);
    ellipse(ctx, 14, 18, 8, 7, p.foliage);
    ellipse(ctx, 20, 20, 6, 5, lighten(p.foliage, 0.08));
    for (let i = 0; i < 6 + variant; i++) {
      px(ctx, 8 + rng() * 16, 13 + rng() * 12, lighten(p.foliage, 0.2), 0.6);
    }
  },

  flower: (ctx, p, rng, variant) => {
    groundBase(ctx, p.ground, rng, 20);
    const colors = [0xffd98a, 0xff9ecb, 0xa8d8ff, 0xffffff];
    for (let i = 0; i < 3; i++) {
      const fx = 6 + Math.floor(rng() * 20);
      const fy = 8 + Math.floor(rng() * 18);
      const color = colors[(variant + i) % colors.length]!;
      line(ctx, fx, fy, fx, fy + 4, darken(p.foliage, 0.1), 1, 0.8);
      px(ctx, fx, fy - 1, color);
      px(ctx, fx - 1, fy, color);
      px(ctx, fx + 1, fy, color);
      px(ctx, fx, fy + 1, color);
      px(ctx, fx, fy, lighten(color, 0.3));
    }
  },

  wall: (ctx, p, rng) => {
    rect(ctx, 0, 0, S, S, p.wall);
    // Fachwerk / Steinfugen
    for (let y = 0; y < S; y += 8) {
      rect(ctx, 0, y, S, 1, darken(p.wall, 0.18), 0.7);
      const offset = (y / 8) % 2 === 0 ? 0 : 8;
      for (let x = offset; x < S; x += 16) {
        rect(ctx, x, y, 1, 8, darken(p.wall, 0.14), 0.6);
      }
    }
    speckle(ctx, 0, 0, S, S, lighten(p.wall, 0.08), 12, rng, 0.35);
  },

  roof: (ctx, p, rng) => {
    rect(ctx, 0, 0, S, S, p.roof);
    // Dachziegel als versetzte Boegen
    for (let y = 0; y < S; y += 6) {
      for (let x = ((y / 6) % 2) * 5; x < S; x += 10) {
        ellipse(ctx, x + 5, y + 4, 5, 3, p.roofAlt, 0.8);
        ellipse(ctx, x + 5, y + 3, 5, 2, lighten(p.roof, 0.08), 0.5);
      }
      rect(ctx, 0, y, S, 1, darken(p.roof, 0.2), 0.5);
    }
    speckle(ctx, 0, 0, S, S, darken(p.roof, 0.12), 10, rng, 0.3);
  },

  door: (ctx, p) => {
    rect(ctx, 0, 0, S, S, p.wall);
    const wood = mix(p.trunk, 0x8a5a34, 0.5);
    rect(ctx, 5, 3, 22, S - 3, darken(wood, 0.25));
    rect(ctx, 6, 4, 20, S - 4, wood);
    // Bretter
    for (let x = 6; x < 26; x += 5) rect(ctx, x, 4, 1, S - 4, darken(wood, 0.2), 0.7);
    // Bogen oben
    ellipse(ctx, 16, 6, 10, 5, wood);
    ellipse(ctx, 16, 6, 10, 5, darken(wood, 0.25), 0.0);
    // Griff
    ellipse(ctx, 22, 18, 2, 2, 0xffd98a);
    px(ctx, 22, 17, 0xfff4dc);
  },

  window: (ctx, p) => {
    rect(ctx, 0, 0, S, S, p.wall);
    const frame = darken(p.wall, 0.35);
    rect(ctx, 6, 8, 20, 16, frame);
    rect(ctx, 8, 10, 16, 12, 0x6fa8d8);
    rect(ctx, 8, 10, 16, 4, lighten(0x6fa8d8, 0.2), 0.6);
    rect(ctx, 15, 10, 2, 12, frame);
    rect(ctx, 8, 15, 16, 2, frame);
    // Fensterbank
    rect(ctx, 5, 24, 22, 2, lighten(p.wall, 0.1));
  },

  ledge: (ctx, p, rng) => {
    // Erhoehter Absatz: unten Fels, oben begehbar wirkende Kante
    rect(ctx, 0, 0, S, S, p.rockDark);
    rect(ctx, 0, 0, S, 10, p.ground);
    rect(ctx, 0, 9, S, 2, darken(p.ground, 0.3));
    for (let y = 12; y < S; y += 6) {
      rect(ctx, 0, y, S, 4, mix(p.rock, p.rockDark, 0.4));
      rect(ctx, 0, y + 4, S, 1, darken(p.rockDark, 0.3));
    }
    // Kleine Pfeile, die andeuten: hier kann gesprungen werden
    triangle(ctx, 16, 26, 12, 20, 20, 20, lighten(p.accent, 0.1), 0.5);
    speckle(ctx, 0, 12, S, S - 12, darken(p.rockDark, 0.2), 10, rng, 0.35);
  },

  shadow: (ctx, p, rng) => {
    // Schattenfeld: dunkler Nebel mit violettem Schimmer
    rect(ctx, 0, 0, S, S, darken(p.ground, 0.55));
    for (let i = 0; i < 5; i++) {
      ellipse(ctx, rng() * S, rng() * S, 6 + rng() * 6, 4 + rng() * 4, 0x2a1f47, 0.5);
    }
    glow(ctx, 16, 16, 14, 0x8a6ad0, 0.28);
    speckle(ctx, 0, 0, S, S, 0xa77fd8, 8, rng, 0.4);
  },

  pit: (ctx, p, rng) => {
    rect(ctx, 0, 0, S, S, darken(p.rockDark, 0.5));
    // Ausfransender Rand, damit der Abgrund Tiefe bekommt
    rect(ctx, 2, 2, S - 4, S - 4, 0x0b0812);
    for (let i = 0; i < 10; i++) {
      px(ctx, 1 + rng() * (S - 2), 1 + rng() * (S - 2), darken(p.rockDark, 0.3), 0.5);
    }
    rect(ctx, 2, 2, S - 4, 2, darken(p.rockDark, 0.2), 0.6);
  },

  ice: (ctx, p, rng) => {
    const iceColor = mix(p.water, 0xffffff, 0.55);
    rect(ctx, 0, 0, S, S, iceColor);
    rect(ctx, 0, 0, S, 2, lighten(iceColor, 0.2), 0.7);
    // Risse
    for (let i = 0; i < 3; i++) {
      const x0 = rng() * S;
      const y0 = rng() * S;
      line(ctx, x0, y0, x0 + rng() * 12 - 6, y0 + rng() * 12 - 6, lighten(iceColor, 0.25), 1, 0.6);
    }
    speckle(ctx, 0, 0, S, S, 0xffffff, 10, rng, 0.4);
  },

  stairs: (ctx, p) => {
    rect(ctx, 0, 0, S, S, p.rockDark);
    for (let i = 0; i < 4; i++) {
      const y = i * 8;
      rect(ctx, 2, y, S - 4, 6, mix(p.rock, p.wall, 0.3));
      rect(ctx, 2, y, S - 4, 1, lighten(p.rock, 0.2));
      rect(ctx, 2, y + 6, S - 4, 2, darken(p.rockDark, 0.2));
    }
  },

  rubble: (ctx, p, rng) => {
    rect(ctx, 0, 0, S, S, darken(p.ground, 0.15));
    for (let i = 0; i < 9; i++) {
      const rx = 3 + rng() * (S - 8);
      const ry = 3 + rng() * (S - 8);
      const size = 3 + rng() * 5;
      ellipse(ctx, rx, ry, size, size * 0.75, p.rock);
      ellipse(ctx, rx - 1, ry - 1, size * 0.6, size * 0.45, lighten(p.rock, 0.12));
    }
    speckle(ctx, 0, 0, S, S, p.rockDark, 16, rng, 0.5);
  },

  carpet: (ctx, p, rng) => {
    const base = mix(p.accent, 0x8a3a5a, 0.55);
    rect(ctx, 0, 0, S, S, base);
    rect(ctx, 0, 0, S, 2, darken(base, 0.25));
    rect(ctx, 0, S - 2, S, 2, darken(base, 0.25));
    // Muster
    for (let x = 4; x < S; x += 10) {
      ellipse(ctx, x + 1, 16, 3, 5, lighten(base, 0.16), 0.8);
    }
    speckle(ctx, 0, 0, S, S, lighten(base, 0.1), 10, rng, 0.25);
  },

  sign: (ctx, p) => {
    rect(ctx, 0, 0, S, S, p.ground);
    const wood = mix(p.trunk, 0xa87848, 0.4);
    rect(ctx, 15, 16, 3, 13, darken(wood, 0.25));
    rect(ctx, 4, 6, 24, 13, darken(wood, 0.3));
    rect(ctx, 5, 7, 22, 11, wood);
    // Angedeutete Schrift
    for (let i = 0; i < 3; i++) {
      rect(ctx, 8, 9 + i * 3, 14 - i * 3, 1, darken(wood, 0.4), 0.8);
    }
  },

  crystal: (ctx, p, rng) => {
    rect(ctx, 0, 0, S, S, darken(p.rockDark, 0.2));
    glow(ctx, 16, 16, 15, p.accent, 0.45);
    // Kristallsplitter
    triangle(ctx, 16, 3, 9, 22, 23, 22, mix(p.accent, 0xffffff, 0.35));
    triangle(ctx, 16, 6, 12, 21, 20, 21, lighten(p.accent, 0.3));
    triangle(ctx, 10, 14, 6, 26, 15, 26, mix(p.accent, 0x8a6ad0, 0.4));
    triangle(ctx, 22, 16, 18, 27, 27, 27, mix(p.accent, 0x8a6ad0, 0.5));
    for (let i = 0; i < 5; i++) px(ctx, 10 + rng() * 12, 6 + rng() * 16, 0xffffff, 0.7);
  },

  grave: (ctx, p, rng) => {
    rect(ctx, 0, 0, S, S, p.ground);
    // Verwitterter Schrein
    rect(ctx, 8, 8, 16, 20, p.rockDark);
    rect(ctx, 9, 9, 14, 18, p.rock);
    ellipse(ctx, 16, 9, 7, 6, p.rock);
    ellipse(ctx, 16, 9, 7, 6, darken(p.rock, 0.15), 0.0);
    rect(ctx, 14, 13, 4, 10, darken(p.rock, 0.25));
    rect(ctx, 11, 16, 10, 3, darken(p.rock, 0.25));
    // Moos
    for (let i = 0; i < 6; i++) {
      px(ctx, 9 + rng() * 14, 10 + rng() * 17, p.foliageDark, 0.6);
    }
  },

  mud: (ctx, p, rng, variant) => {
    const mudColor = mix(p.ground, 0x4a3a26, 0.6);
    groundBase(ctx, mudColor, rng, 30);
    for (let i = 0; i < 3 + variant; i++) {
      ellipse(ctx, rng() * S, rng() * S, 4 + rng() * 4, 2 + rng() * 3, darken(mudColor, 0.18), 0.7);
    }
    for (let i = 0; i < 3; i++) {
      ellipse(ctx, rng() * S, rng() * S, 2, 1, lighten(mudColor, 0.1), 0.5);
    }
  },

  lilypad: (ctx, p, rng) => {
    rect(ctx, 0, 0, S, S, p.water);
    for (let i = 0; i < 2; i++) {
      const y = 8 + i * 12;
      for (let x = 0; x < S; x++) {
        px(ctx, x, y + Math.round(Math.sin((x / S) * 6) * 1.4), lighten(p.water, 0.15), 0.4);
      }
    }
    ellipse(ctx, 16, 17, 13, 11, darken(p.foliage, 0.15));
    ellipse(ctx, 16, 16, 12, 10, p.foliage);
    ellipse(ctx, 13, 13, 5, 4, lighten(p.foliage, 0.12), 0.7);
    // Einschnitt
    triangle(ctx, 16, 16, 26, 12, 26, 21, p.water);
    for (let i = 0; i < 4; i++) px(ctx, 10 + rng() * 12, 12 + rng() * 9, lighten(p.foliage, 0.2), 0.5);
  },

  fence: (ctx, p) => {
    rect(ctx, 0, 0, S, S, p.ground);
    const wood = mix(p.trunk, 0xb08050, 0.35);
    rect(ctx, 0, 12, S, 3, wood);
    rect(ctx, 0, 12, S, 1, lighten(wood, 0.15));
    rect(ctx, 0, 20, S, 3, wood);
    rect(ctx, 0, 20, S, 1, lighten(wood, 0.15));
    for (const x of [4, 20]) {
      rect(ctx, x, 6, 4, 22, darken(wood, 0.15));
      rect(ctx, x, 6, 1, 22, lighten(wood, 0.1));
      triangle(ctx, x, 6, x + 2, 2, x + 4, 6, darken(wood, 0.2));
    }
  },

  table: (ctx, p) => {
    rect(ctx, 0, 0, S, S, mix(p.wall, 0x6b4a2f, 0.5));
    const wood = mix(p.trunk, 0xc09060, 0.45);
    rect(ctx, 2, 6, 28, 20, darken(wood, 0.3));
    rect(ctx, 3, 7, 26, 17, wood);
    for (let x = 3; x < 29; x += 6) rect(ctx, x, 7, 1, 17, darken(wood, 0.15), 0.6);
    rect(ctx, 3, 7, 26, 2, lighten(wood, 0.14));
  },

  counter: (ctx, p) => {
    rect(ctx, 0, 0, S, S, mix(p.wall, 0x6b4a2f, 0.5));
    const wood = mix(p.trunk, 0x9a6a3a, 0.4);
    rect(ctx, 0, 8, S, 18, darken(wood, 0.3));
    rect(ctx, 0, 9, S, 15, wood);
    rect(ctx, 0, 9, S, 2, lighten(wood, 0.18));
    rect(ctx, 0, 22, S, 2, darken(wood, 0.2));
    // Angedeutete Waren
    ellipse(ctx, 8, 13, 3, 2, p.accent, 0.8);
    ellipse(ctx, 20, 13, 2, 2, lighten(p.foliage, 0.2), 0.8);
  },
};

// ---------------------------------------------------------------------------
// Tileset-Erzeugung
// ---------------------------------------------------------------------------

/** Zeichnet ein einzelnes Tileset-Canvas fuer eine Palette. */
function drawTileset(palette: RegionPalette, seedBase: string): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(VARIANTS * S, TILE_ORDER.length * S);

  TILE_ORDER.forEach((id, row) => {
    const drawer = DRAWERS[id];
    for (let variant = 0; variant < VARIANTS; variant++) {
      ctx.save();
      ctx.translate(variant * S, row * S);
      // Auf den Kachelbereich beschneiden, damit kein Zeichenfehler in die
      // Nachbarkachel blutet - das faellt sonst erst im fertigen Spiel auf.
      ctx.beginPath();
      ctx.rect(0, 0, S, S);
      ctx.clip();

      const rng = createRng(hashString(`${seedBase}:${id}:${variant}`));
      if (drawer) {
        drawer(ctx, palette, rng, variant);
      } else {
        // Fallback: auffaellige Platzhalterkachel, damit fehlende Grafik
        // im Spiel sofort sichtbar wird statt still zu verschwinden.
        rect(ctx, 0, 0, S, S, 0xff00ff);
        rect(ctx, 0, 0, S / 2, S / 2, 0x000000);
        rect(ctx, S / 2, S / 2, S / 2, S / 2, 0x000000);
      }
      ctx.restore();
    }
  });

  return canvas;
}

/**
 * Erzeugt fuer jede Region ein Tileset und registriert es in Phaser.
 * Wird einmalig in der BootScene aufgerufen.
 */
export function generateAllTilesets(textures: Phaser.Textures.TextureManager): void {
  for (const region of Object.values(REGIONS)) {
    const key = tilesetKey(region.id);
    if (textures.exists(key)) continue;
    const canvas = drawTileset(region.palette, region.id);
    textures.addCanvas(key, canvas);
  }
}

/** Fuer die Weltkarte und Menues: eine einzelne Kachel als eigene Textur. */
export function extractTile(
  textures: Phaser.Textures.TextureManager,
  regionId: string,
  id: TileId,
  variant = 0,
): string {
  const key = `tilepreview:${regionId}:${id}:${variant}`;
  if (textures.exists(key)) return key;
  const source = textures.get(tilesetKey(regionId)).getSourceImage() as HTMLCanvasElement;
  const { canvas, ctx } = makeCanvas(S, S);
  const row = TILE_INDEX.get(id) ?? 0;
  ctx.drawImage(source, variant * S, row * S, S, S, 0, 0, S, S);
  textures.addCanvas(key, canvas);
  return key;
}

export { hex };
