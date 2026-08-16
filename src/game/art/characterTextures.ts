/**
 * Prozedurale Figuren-Sprites.
 *
 * Jede Figur bekommt ein Spritesheet mit 4 Blickrichtungen x 6 Bildern:
 *
 *   Spalte 0  Ruhe
 *   Spalte 1  Schritt A
 *   Spalte 2  Ruhe (Zwischenbild, damit der Lauf nicht "huepft")
 *   Spalte 3  Schritt B
 *   Spalte 4  Angriff
 *   Spalte 5  Treffer
 *
 *   Zeile 0 nach unten, 1 nach oben, 2 nach links, 3 nach rechts
 *
 * Das Aussehen wird aus einem CatLook/CreatureLook abgeleitet und ueber einen
 * Schluessel zwischengespeichert, damit dieselbe Fellfarbe nur einmal gezeichnet
 * wird - bei ueber 40 NPCs macht das den Unterschied beim Start auf dem Handy.
 */

import { createRng, hashString } from '@/core/rng';
import type { CatLook, CreatureLook, Direction } from '@/data/types';
import { darken, ellipse, glow, lighten, line, makeCanvas, mix, px, rect, triangle, type Ctx } from './draw';

export const FRAME = 32;
export const COLS = 6;
export const ROWS = 4;

export const DIRECTION_ROW: Record<Direction, number> = { down: 0, up: 1, left: 2, right: 3 };

/** Bildindex innerhalb des Spritesheets. */
export function frameIndex(dir: Direction, col: number): number {
  return DIRECTION_ROW[dir] * COLS + col;
}

export const WALK_FRAMES = [0, 1, 2, 3];
export const ATTACK_COL = 4;
export const HURT_COL = 5;

// ---------------------------------------------------------------------------
// Katzen
// ---------------------------------------------------------------------------

interface Pose {
  /** Vertikaler Versatz des Koerpers (Laufwippe). */
  bob: number;
  /** Beinversatz. */
  legA: number;
  legB: number;
  /** Vorbeugen beim Angriff. */
  lean: number;
  /** Zusammenzucken beim Treffer. */
  flinch: number;
  /** Schwanzwinkel-Versatz. */
  tail: number;
}

function poseFor(col: number): Pose {
  switch (col) {
    case 1:
      return { bob: -1, legA: 2, legB: -2, lean: 0, flinch: 0, tail: 1 };
    case 3:
      return { bob: -1, legA: -2, legB: 2, lean: 0, flinch: 0, tail: -1 };
    case 4:
      return { bob: 0, legA: 1, legB: -1, lean: 3, flinch: 0, tail: 2 };
    case 5:
      return { bob: 1, legA: -1, legB: 1, lean: -2, flinch: 2, tail: -2 };
    default:
      return { bob: 0, legA: 0, legB: 0, lean: 0, flinch: 0, tail: 0 };
  }
}

function drawCatPattern(
  ctx: Ctx,
  look: CatLook,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rng: () => number,
): void {
  const dark = look.furDark;
  switch (look.pattern) {
    case 'stripes':
      for (let i = -1; i <= 1; i++) {
        const y = cy + i * 3;
        line(ctx, cx - rx * 0.6, y, cx + rx * 0.6, y, dark, 1, 0.65);
      }
      break;
    case 'patch':
      ellipse(ctx, cx + rx * 0.4, cy - ry * 0.2, rx * 0.45, ry * 0.4, dark, 0.75);
      break;
    case 'spots':
      for (let i = 0; i < 4; i++) {
        px(ctx, cx + (rng() - 0.5) * rx * 1.4, cy + (rng() - 0.5) * ry * 1.4, dark, 0.7);
      }
      break;
    case 'mask':
      ellipse(ctx, cx, cy - ry * 0.35, rx * 0.85, ry * 0.45, dark, 0.6);
      break;
    default:
      break;
  }
}

function drawAccessory(ctx: Ctx, look: CatLook, dir: Direction, cx: number, headBottom: number): void {
  const color = look.accessoryColor ?? 0xc75f4a;
  switch (look.accessory) {
    case 'scarf':
      rect(ctx, cx - 6, headBottom - 1, 12, 3, color);
      rect(ctx, cx - 6, headBottom - 1, 12, 1, lighten(color, 0.15));
      if (dir === 'down') {
        rect(ctx, cx + 2, headBottom + 2, 3, 5, color);
        rect(ctx, cx + 2, headBottom + 2, 1, 5, darken(color, 0.2));
      }
      break;
    case 'bandana':
      rect(ctx, cx - 6, headBottom - 2, 12, 3, color);
      triangle(ctx, cx + 5, headBottom - 2, cx + 10, headBottom + 1, cx + 5, headBottom + 2, color);
      break;
    case 'hat': {
      const brim = darken(color, 0.2);
      rect(ctx, cx - 9, headBottom - 13, 18, 2, brim);
      ellipse(ctx, cx, headBottom - 16, 6, 4, color);
      rect(ctx, cx - 6, headBottom - 15, 12, 2, darken(color, 0.35));
      break;
    }
    case 'apron':
      rect(ctx, cx - 5, headBottom + 4, 10, 9, color);
      rect(ctx, cx - 5, headBottom + 4, 10, 1, lighten(color, 0.2));
      rect(ctx, cx - 2, headBottom + 7, 4, 4, darken(color, 0.15));
      break;
    case 'crown':
      rect(ctx, cx - 6, headBottom - 15, 12, 3, color);
      for (let i = -1; i <= 1; i++) {
        triangle(
          ctx,
          cx + i * 4 - 2,
          headBottom - 15,
          cx + i * 4,
          headBottom - 20,
          cx + i * 4 + 2,
          headBottom - 15,
          color,
        );
        px(ctx, cx + i * 4, headBottom - 19, 0xffffff, 0.9);
      }
      break;
    case 'cloak':
      ellipse(ctx, cx, headBottom + 7, 10, 9, color);
      ellipse(ctx, cx, headBottom + 6, 8, 7, darken(color, 0.18));
      rect(ctx, cx - 8, headBottom - 1, 16, 3, color);
      break;
    case 'glasses':
      if (dir !== 'up') {
        rect(ctx, cx - 6, headBottom - 8, 5, 4, 0x2a2a3a, 0.85);
        rect(ctx, cx + 1, headBottom - 8, 5, 4, 0x2a2a3a, 0.85);
        rect(ctx, cx - 1, headBottom - 7, 2, 1, 0x2a2a3a, 0.85);
      }
      break;
    default:
      break;
  }
}

function drawCatDown(ctx: Ctx, look: CatLook, pose: Pose, rng: () => number): void {
  const cx = 16;
  const bob = pose.bob + pose.flinch;
  const fur = look.fur;
  const dark = look.furDark;

  // Schwanz (hinter dem Koerper)
  const tailX = 24 + pose.tail;
  line(ctx, 21, 22 + bob, tailX, 18 + bob, dark, 3);
  line(ctx, tailX, 18 + bob, tailX + 2, 13 + bob, dark, 3);
  px(ctx, tailX + 2, 12 + bob, lighten(fur, 0.1));

  // Hinterpfoten
  ellipse(ctx, 11, 26 + pose.legA, 3, 2, dark);
  ellipse(ctx, 21, 26 + pose.legB, 3, 2, dark);

  // Koerper
  ellipse(ctx, cx, 21 + bob, 8, 7, fur);
  ellipse(ctx, cx, 23 + bob, 5, 4, look.belly);
  drawCatPattern(ctx, look, cx, 21 + bob, 8, 7, rng);

  // Vorderpfoten
  ellipse(ctx, 12, 27 + pose.legB, 3, 2, lighten(fur, 0.08));
  ellipse(ctx, 20, 27 + pose.legA, 3, 2, lighten(fur, 0.08));

  // Ohren
  triangle(ctx, 9, 10 + bob, 10, 3 + bob, 15, 9 + bob, fur);
  triangle(ctx, 23, 10 + bob, 22, 3 + bob, 17, 9 + bob, fur);
  triangle(ctx, 11, 9 + bob, 11, 5 + bob, 14, 9 + bob, 0xc4657f, 0.9);
  triangle(ctx, 21, 9 + bob, 21, 5 + bob, 18, 9 + bob, 0xc4657f, 0.9);

  // Kopf
  ellipse(ctx, cx, 12 + bob, 8, 7, fur);
  ellipse(ctx, cx, 14 + bob, 5, 4, lighten(fur, 0.08));
  drawCatPattern(ctx, look, cx, 11 + bob, 7, 5, rng);

  // Gesicht
  if (pose.flinch > 0) {
    // Augen zugekniffen
    line(ctx, 11, 12 + bob, 14, 12 + bob, look.eye, 1);
    line(ctx, 18, 12 + bob, 21, 12 + bob, look.eye, 1);
  } else {
    ellipse(ctx, 12.5, 12 + bob, 1.8, 2.2, look.eye);
    ellipse(ctx, 19.5, 12 + bob, 1.8, 2.2, look.eye);
    px(ctx, 12, 11 + bob, 0xffffff, 0.9);
    px(ctx, 19, 11 + bob, 0xffffff, 0.9);
  }
  triangle(ctx, cx, 15 + bob, cx + 1.5, 16.5 + bob, cx - 1.5, 16.5 + bob, 0xc4657f);
  line(ctx, cx, 17 + bob, cx - 2, 18 + bob, darken(fur, 0.35), 1, 0.8);
  line(ctx, cx, 17 + bob, cx + 2, 18 + bob, darken(fur, 0.35), 1, 0.8);

  // Schnurrhaare
  line(ctx, 8, 14 + bob, 11, 14 + bob, 0xfff4dc, 1, 0.7);
  line(ctx, 21, 14 + bob, 24, 14 + bob, 0xfff4dc, 1, 0.7);

  drawAccessory(ctx, look, 'down', cx, 19 + bob);
}

function drawCatUp(ctx: Ctx, look: CatLook, pose: Pose, rng: () => number): void {
  const cx = 16;
  const bob = pose.bob + pose.flinch;
  const fur = look.fur;
  const dark = look.furDark;

  // Schwanz nach oben, hinter dem Koerper
  line(ctx, cx + pose.tail, 20 + bob, cx + pose.tail * 2, 10 + bob, dark, 3);
  ellipse(ctx, cx + pose.tail * 2, 9 + bob, 2, 2, lighten(fur, 0.12));

  ellipse(ctx, 11, 26 + pose.legA, 3, 2, dark);
  ellipse(ctx, 21, 26 + pose.legB, 3, 2, dark);

  // Koerper von hinten
  ellipse(ctx, cx, 21 + bob, 8, 7, fur);
  ellipse(ctx, cx, 20 + bob, 6, 5, lighten(fur, 0.05));
  drawCatPattern(ctx, look, cx, 21 + bob, 8, 7, rng);

  ellipse(ctx, 12, 27 + pose.legB, 3, 2, dark);
  ellipse(ctx, 20, 27 + pose.legA, 3, 2, dark);

  // Ohren
  triangle(ctx, 9, 10 + bob, 10, 3 + bob, 15, 9 + bob, fur);
  triangle(ctx, 23, 10 + bob, 22, 3 + bob, 17, 9 + bob, fur);
  triangle(ctx, 11, 9 + bob, 11, 5 + bob, 14, 9 + bob, darken(fur, 0.2));
  triangle(ctx, 21, 9 + bob, 21, 5 + bob, 18, 9 + bob, darken(fur, 0.2));

  // Hinterkopf - kein Gesicht
  ellipse(ctx, cx, 12 + bob, 8, 7, fur);
  ellipse(ctx, cx, 11 + bob, 6, 5, lighten(fur, 0.06));
  drawCatPattern(ctx, look, cx, 12 + bob, 7, 5, rng);

  drawAccessory(ctx, look, 'up', cx, 19 + bob);
}

function drawCatSide(ctx: Ctx, look: CatLook, pose: Pose, rng: () => number, flip: boolean): void {
  // Nach links gezeichnet; fuer rechts wird der Kontext gespiegelt.
  ctx.save();
  if (flip) {
    ctx.translate(FRAME, 0);
    ctx.scale(-1, 1);
  }

  const bob = pose.bob + pose.flinch;
  const lean = pose.lean;
  const fur = look.fur;
  const dark = look.furDark;
  const headX = 11 - lean;

  // Schwanz hinten
  line(ctx, 23, 21 + bob, 27 + pose.tail, 16 + bob, dark, 3);
  ellipse(ctx, 27 + pose.tail, 15 + bob, 2, 2, lighten(fur, 0.1));

  // Hintere Beine
  ellipse(ctx, 21, 26 + pose.legA, 3, 2, dark);
  ellipse(ctx, 17, 27 + pose.legB, 3, 2, dark);

  // Koerper
  ellipse(ctx, 17, 21 + bob, 9, 6, fur);
  ellipse(ctx, 17, 23 + bob, 7, 3, look.belly);
  drawCatPattern(ctx, look, 17, 21 + bob, 8, 5, rng);

  // Vordere Beine
  ellipse(ctx, 12, 27 + pose.legB, 3, 2, lighten(fur, 0.08));
  ellipse(ctx, 9, 26 + pose.legA, 3, 2, lighten(fur, 0.08));

  // Ohr (nur eines sichtbar, das zweite angedeutet)
  triangle(ctx, headX + 4, 9 + bob, headX + 5, 3 + bob, headX + 8, 9 + bob, darken(fur, 0.12));
  triangle(ctx, headX - 2, 10 + bob, headX - 1, 3 + bob, headX + 3, 9 + bob, fur);
  triangle(ctx, headX, 9 + bob, headX, 5 + bob, headX + 2, 9 + bob, 0xc4657f, 0.9);

  // Kopf im Profil
  ellipse(ctx, headX + 2, 13 + bob, 7, 6, fur);
  // Schnauze
  ellipse(ctx, headX - 3, 15 + bob, 3, 2.5, lighten(fur, 0.1));
  px(ctx, headX - 6, 15 + bob, 0xc4657f);

  if (pose.flinch > 0) {
    line(ctx, headX - 1, 13 + bob, headX + 2, 13 + bob, look.eye, 1);
  } else {
    ellipse(ctx, headX, 13 + bob, 1.8, 2.2, look.eye);
    px(ctx, headX - 1, 12 + bob, 0xffffff, 0.9);
  }

  // Schnurrhaare
  line(ctx, headX - 8, 15 + bob, headX - 4, 14 + bob, 0xfff4dc, 1, 0.7);

  drawAccessory(ctx, look, 'left', headX + 2, 20 + bob);

  ctx.restore();
}

/** Schluessel fuer die Textur-Zwischenspeicherung. */
export function catLookKey(look: CatLook): string {
  return [
    'cat',
    look.fur.toString(16),
    look.furDark.toString(16),
    look.belly.toString(16),
    look.eye.toString(16),
    look.pattern ?? 'plain',
    look.accessory ?? 'none',
    (look.accessoryColor ?? 0).toString(16),
    look.scale ?? 1,
  ].join('_');
}

/** Erzeugt (oder liefert) das Spritesheet fuer ein Katzen-Aussehen. */
export function ensureCatTexture(textures: Phaser.Textures.TextureManager, look: CatLook): string {
  const key = catLookKey(look);
  if (textures.exists(key)) return key;

  const { canvas, ctx } = makeCanvas(COLS * FRAME, ROWS * FRAME);
  const rngSeed = hashString(key);

  const directions: Direction[] = ['down', 'up', 'left', 'right'];
  directions.forEach((dir, row) => {
    for (let col = 0; col < COLS; col++) {
      ctx.save();
      ctx.translate(col * FRAME, row * FRAME);
      ctx.beginPath();
      ctx.rect(0, 0, FRAME, FRAME);
      ctx.clip();

      // Skalierung um den Fusspunkt, damit kleine Katzen auf dem Boden bleiben.
      const scale = look.scale ?? 1;
      if (scale !== 1) {
        ctx.translate(FRAME / 2, FRAME - 4);
        ctx.scale(scale, scale);
        ctx.translate(-FRAME / 2, -(FRAME - 4));
      }

      const pose = poseFor(col);
      // Eigener RNG je Bild, aber gleicher Seed pro Position -> Muster
      // bleiben ueber die Animation hinweg stabil.
      const rng = createRng(rngSeed);

      // Bodenschatten
      ellipse(ctx, 16, 28, 8, 3, 0x000000, 0.24);

      if (dir === 'down') drawCatDown(ctx, look, pose, rng);
      else if (dir === 'up') drawCatUp(ctx, look, pose, rng);
      else drawCatSide(ctx, look, pose, rng, dir === 'right');

      ctx.restore();
    }
  });

  textures.addSpriteSheet(key, canvas as unknown as HTMLImageElement, {
    frameWidth: FRAME,
    frameHeight: FRAME,
  });
  return key;
}

// ---------------------------------------------------------------------------
// Kreaturen (Gegner)
// ---------------------------------------------------------------------------

type CreatureDrawer = (ctx: Ctx, look: CreatureLook, pose: Pose, dir: Direction, rng: () => number) => void;

const CREATURE_DRAWERS: Record<CreatureLook['shape'], CreatureDrawer> = {
  cat: (ctx, look, pose, dir, rng) => {
    const asCat: CatLook = {
      fur: look.body,
      furDark: look.bodyDark,
      belly: lighten(look.body, 0.12),
      eye: look.eye,
      pattern: 'stripes',
    };
    if (dir === 'down') drawCatDown(ctx, asCat, pose, rng);
    else if (dir === 'up') drawCatUp(ctx, asCat, pose, rng);
    else drawCatSide(ctx, asCat, pose, rng, dir === 'right');
  },

  blob: (ctx, look, pose, _dir, rng) => {
    const bob = pose.bob + pose.flinch;
    const squash = pose.legA * 0.5;
    ellipse(ctx, 16, 22 + bob, 10 + squash, 8 - squash, look.bodyDark);
    ellipse(ctx, 16, 21 + bob, 9 + squash, 7 - squash, look.body);
    ellipse(ctx, 13, 18 + bob, 4, 3, lighten(look.body, 0.18), 0.7);
    // Tropfen oben
    ellipse(ctx, 16, 15 + bob, 4, 4, look.body);
    // Augen
    ellipse(ctx, 12.5, 21 + bob, 2, 2.4, look.eye);
    ellipse(ctx, 19.5, 21 + bob, 2, 2.4, look.eye);
    px(ctx, 12, 20 + bob, 0xffffff, 0.9);
    px(ctx, 19, 20 + bob, 0xffffff, 0.9);
    for (let i = 0; i < 4; i++) {
      px(ctx, 8 + rng() * 16, 16 + rng() * 12, look.accent, 0.5);
    }
  },

  spider: (ctx, look, pose, _dir, _rng) => {
    const bob = pose.bob + pose.flinch;
    // Beine
    for (let i = 0; i < 3; i++) {
      const y = 19 + i * 3 + bob;
      const spread = 11 + (i === 1 ? pose.legA : pose.legB);
      line(ctx, 16, y, 16 - spread, y - 3 + i * 2, look.bodyDark, 1);
      line(ctx, 16, y, 16 + spread, y - 3 + i * 2, look.bodyDark, 1);
      px(ctx, 16 - spread, y - 3 + i * 2, look.accent);
      px(ctx, 16 + spread, y - 3 + i * 2, look.accent);
    }
    ellipse(ctx, 16, 22 + bob, 7, 6, look.bodyDark);
    ellipse(ctx, 16, 21 + bob, 6, 5, look.body);
    ellipse(ctx, 16, 16 + bob, 4, 3.5, look.bodyDark);
    // Augenreihe
    for (let i = -1; i <= 1; i++) {
      px(ctx, 16 + i * 2, 15 + bob, look.eye);
      px(ctx, 16 + i * 2, 16 + bob, look.eye);
    }
    px(ctx, 15, 15 + bob, lighten(look.eye, 0.5), 0.8);
  },

  wisp: (ctx, look, pose, _dir, rng) => {
    const bob = pose.bob + pose.flinch;
    glow(ctx, 16, 16 + bob, 13, look.accent, 0.4);
    ellipse(ctx, 16, 16 + bob, 6, 7, look.body, 0.85);
    ellipse(ctx, 16, 15 + bob, 4, 5, lighten(look.body, 0.25), 0.9);
    // Schweif
    for (let i = 0; i < 5; i++) {
      ellipse(ctx, 16 + (rng() - 0.5) * 4, 22 + i * 1.5 + bob, 3 - i * 0.5, 2 - i * 0.3, look.body, 0.4 - i * 0.06);
    }
    ellipse(ctx, 13.5, 15 + bob, 1.5, 2, look.eye);
    ellipse(ctx, 18.5, 15 + bob, 1.5, 2, look.eye);
  },

  thorn: (ctx, look, pose, _dir, _rng) => {
    const bob = pose.bob + pose.flinch;
    ellipse(ctx, 16, 21 + bob, 8, 7, look.bodyDark);
    ellipse(ctx, 16, 20 + bob, 7, 6, look.body);
    // Dornen ringsum
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + pose.tail * 0.1;
      const x0 = 16 + Math.cos(a) * 6;
      const y0 = 20 + bob + Math.sin(a) * 5;
      const x1 = 16 + Math.cos(a) * 11;
      const y1 = 20 + bob + Math.sin(a) * 9;
      triangle(ctx, x0 - 1.5, y0, x1, y1, x0 + 1.5, y0, look.accent);
    }
    ellipse(ctx, 13, 19 + bob, 1.8, 2.2, look.eye);
    ellipse(ctx, 19, 19 + bob, 1.8, 2.2, look.eye);
    px(ctx, 12.5, 18 + bob, 0xffffff, 0.8);
  },

  wraith: (ctx, look, pose, _dir, rng) => {
    const bob = pose.bob + pose.flinch;
    glow(ctx, 16, 18 + bob, 14, look.accent, 0.3);
    // Kapuze
    ellipse(ctx, 16, 14 + bob, 7, 8, look.bodyDark);
    ellipse(ctx, 16, 13 + bob, 5.5, 6.5, look.body);
    ellipse(ctx, 16, 15 + bob, 4, 4, 0x0b0812, 0.85);
    // Leuchtende Augen
    ellipse(ctx, 14, 14 + bob, 1.4, 1.8, look.eye);
    ellipse(ctx, 18, 14 + bob, 1.4, 1.8, look.eye);
    glow(ctx, 14, 14 + bob, 3, look.eye, 0.55);
    glow(ctx, 18, 14 + bob, 3, look.eye, 0.55);
    // Ausgefranster Umhang
    for (let i = 0; i < 6; i++) {
      const x = 10 + i * 2.4;
      const h = 8 + rng() * 6 + (i % 2 === 0 ? pose.legA : pose.legB);
      triangle(ctx, x, 18 + bob, x + 1.2, 18 + bob + h, x + 2.4, 18 + bob, look.bodyDark, 0.8);
    }
  },

  mouse: (ctx, look, pose, _dir, _rng) => {
    const bob = pose.bob + pose.flinch;
    // Schwanz
    line(ctx, 21, 22 + bob, 26 + pose.tail, 20 + bob, look.accent, 1);
    ellipse(ctx, 16, 21 + bob, 7, 5, look.bodyDark);
    ellipse(ctx, 16, 20 + bob, 6, 4.5, look.body);
    // Grosse Ohren
    ellipse(ctx, 11, 14 + bob, 4, 4, look.bodyDark);
    ellipse(ctx, 21, 14 + bob, 4, 4, look.bodyDark);
    ellipse(ctx, 11, 14 + bob, 2.5, 2.5, look.accent);
    ellipse(ctx, 21, 14 + bob, 2.5, 2.5, look.accent);
    ellipse(ctx, 16, 15 + bob, 5.5, 5, look.body);
    ellipse(ctx, 13.5, 15 + bob, 1.5, 1.8, look.eye);
    ellipse(ctx, 18.5, 15 + bob, 1.5, 1.8, look.eye);
    px(ctx, 16, 18 + bob, look.accent);
    ellipse(ctx, 12, 26 + pose.legA, 2.5, 1.5, look.bodyDark);
    ellipse(ctx, 20, 26 + pose.legB, 2.5, 1.5, look.bodyDark);
  },

  crab: (ctx, look, pose, _dir, _rng) => {
    const bob = pose.bob + pose.flinch;
    // Beine
    for (let i = 0; i < 3; i++) {
      const y = 22 + i * 2 + bob;
      line(ctx, 10, y, 5 - (i === 1 ? pose.legA : 0), y + 3, look.bodyDark, 1);
      line(ctx, 22, y, 27 + (i === 1 ? pose.legB : 0), y + 3, look.bodyDark, 1);
    }
    // Scheren
    ellipse(ctx, 7, 17 + bob + pose.legA, 3.5, 3, look.accent);
    ellipse(ctx, 25, 17 + bob + pose.legB, 3.5, 3, look.accent);
    // Panzer
    ellipse(ctx, 16, 20 + bob, 9, 6.5, look.bodyDark);
    ellipse(ctx, 16, 19 + bob, 8, 5.5, look.body);
    ellipse(ctx, 16, 17 + bob, 6, 3, lighten(look.body, 0.14), 0.7);
    // Stielaugen
    line(ctx, 13, 15 + bob, 13, 12 + bob, look.bodyDark, 1);
    line(ctx, 19, 15 + bob, 19, 12 + bob, look.bodyDark, 1);
    ellipse(ctx, 13, 11 + bob, 1.8, 1.8, look.eye);
    ellipse(ctx, 19, 11 + bob, 1.8, 1.8, look.eye);
  },

  sentinel: (ctx, look, pose, _dir, _rng) => {
    const bob = pose.bob + pose.flinch;
    // Schwebender Steinwaechter
    glow(ctx, 16, 18 + bob, 12, look.accent, 0.25);
    // Untere Haelfte
    triangle(ctx, 16, 28 + bob, 10, 20 + bob, 22, 20 + bob, look.bodyDark);
    // Kern
    ellipse(ctx, 16, 17 + bob, 8, 8, look.bodyDark);
    ellipse(ctx, 16, 17 + bob, 6.5, 6.5, look.body);
    // Rotierende Splitter
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + pose.tail * 0.4;
      const x = 16 + Math.cos(a) * 11;
      const y = 17 + bob + Math.sin(a) * 9;
      triangle(ctx, x - 2, y, x, y - 3, x + 2, y, look.accent, 0.9);
    }
    // Auge
    ellipse(ctx, 16, 17 + bob, 3, 3.5, 0x0b0812);
    ellipse(ctx, 16, 17 + bob, 1.6, 2.2, look.eye);
    glow(ctx, 16, 17 + bob, 5, look.eye, 0.5);
  },
};

export function creatureLookKey(look: CreatureLook): string {
  return [
    'creature',
    look.shape,
    look.body.toString(16),
    look.bodyDark.toString(16),
    look.eye.toString(16),
    look.accent.toString(16),
    look.scale ?? 1,
    look.floating ? 'f' : 'g',
  ].join('_');
}

export function ensureCreatureTexture(
  textures: Phaser.Textures.TextureManager,
  look: CreatureLook,
): string {
  const key = creatureLookKey(look);
  if (textures.exists(key)) return key;

  const { canvas, ctx } = makeCanvas(COLS * FRAME, ROWS * FRAME);
  const drawer = CREATURE_DRAWERS[look.shape];
  const seed = hashString(key);
  const directions: Direction[] = ['down', 'up', 'left', 'right'];

  directions.forEach((dir, row) => {
    for (let col = 0; col < COLS; col++) {
      ctx.save();
      ctx.translate(col * FRAME, row * FRAME);
      ctx.beginPath();
      ctx.rect(0, 0, FRAME, FRAME);
      ctx.clip();

      const scale = look.scale ?? 1;
      if (scale !== 1) {
        ctx.translate(FRAME / 2, FRAME - 4);
        ctx.scale(scale, scale);
        ctx.translate(-FRAME / 2, -(FRAME - 4));
      }

      const pose = poseFor(col);
      // Schwebende Kreaturen werfen keinen harten Schatten und wippen staerker.
      if (!look.floating) {
        ellipse(ctx, 16, 28, 8, 3, 0x000000, 0.24);
      } else {
        ellipse(ctx, 16, 29, 6, 2, 0x000000, 0.14);
        pose.bob -= 1;
      }

      drawer(ctx, look, pose, dir, createRng(seed));
      ctx.restore();
    }
  });

  textures.addSpriteSheet(key, canvas as unknown as HTMLImageElement, {
    frameWidth: FRAME,
    frameHeight: FRAME,
  });
  return key;
}

// ---------------------------------------------------------------------------
// Portraits fuer das Dialogfenster
// ---------------------------------------------------------------------------

/**
 * Zeichnet ein Portrait als data-URL. Die React-UI kann es direkt als
 * Bildquelle verwenden, ohne den Umweg ueber Phaser-Texturen.
 */
export function renderPortrait(look: CatLook, mood: string = 'neutral', size = 64): string {
  const { canvas, ctx } = makeCanvas(size, size);
  const scale = size / 32;
  ctx.save();
  ctx.scale(scale, scale);

  const fur = look.fur;
  const rng = createRng(hashString(catLookKey(look)));

  // Hintergrund
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 32, 32);

  // Grosser Kopf, fuellt das Portrait
  triangle(ctx, 4, 14, 6, 1, 14, 12, fur);
  triangle(ctx, 28, 14, 26, 1, 18, 12, fur);
  triangle(ctx, 7, 12, 7, 4, 12, 12, 0xc4657f, 0.9);
  triangle(ctx, 25, 12, 25, 4, 20, 12, 0xc4657f, 0.9);

  ellipse(ctx, 16, 17, 12, 11, fur);
  ellipse(ctx, 16, 21, 8, 6, lighten(fur, 0.1));
  drawCatPattern(ctx, look, 16, 15, 10, 7, rng);

  // Augen je nach Stimmung
  const eyeY = 17;
  switch (mood) {
    case 'happy':
      line(ctx, 9, eyeY, 13, eyeY - 2, look.eye, 2);
      line(ctx, 13, eyeY - 2, 15, eyeY, look.eye, 2);
      line(ctx, 17, eyeY, 19, eyeY - 2, look.eye, 2);
      line(ctx, 19, eyeY - 2, 23, eyeY, look.eye, 2);
      break;
    case 'sad':
      ellipse(ctx, 11.5, eyeY + 1, 2.4, 2.6, look.eye);
      ellipse(ctx, 20.5, eyeY + 1, 2.4, 2.6, look.eye);
      line(ctx, 8, eyeY - 4, 14, eyeY - 2, darken(fur, 0.3), 1, 0.8);
      line(ctx, 24, eyeY - 4, 18, eyeY - 2, darken(fur, 0.3), 1, 0.8);
      break;
    case 'angry':
      ellipse(ctx, 11.5, eyeY, 2.4, 2.2, look.eye);
      ellipse(ctx, 20.5, eyeY, 2.4, 2.2, look.eye);
      line(ctx, 8, eyeY - 4, 14, eyeY - 2, darken(fur, 0.4), 2);
      line(ctx, 24, eyeY - 4, 18, eyeY - 2, darken(fur, 0.4), 2);
      break;
    case 'scared':
      ellipse(ctx, 11.5, eyeY, 3.2, 3.4, 0xffffff);
      ellipse(ctx, 20.5, eyeY, 3.2, 3.4, 0xffffff);
      ellipse(ctx, 11.5, eyeY, 1.4, 1.6, look.eye);
      ellipse(ctx, 20.5, eyeY, 1.4, 1.6, look.eye);
      break;
    case 'surprised':
      ellipse(ctx, 11.5, eyeY, 3, 3.2, 0xffffff);
      ellipse(ctx, 20.5, eyeY, 3, 3.2, 0xffffff);
      ellipse(ctx, 11.5, eyeY, 1.8, 2, look.eye);
      ellipse(ctx, 20.5, eyeY, 1.8, 2, look.eye);
      break;
    case 'sly':
      line(ctx, 9, eyeY - 1, 15, eyeY + 1, look.eye, 2);
      ellipse(ctx, 20.5, eyeY, 2.4, 2, look.eye);
      break;
    default:
      ellipse(ctx, 11.5, eyeY, 2.6, 3, look.eye);
      ellipse(ctx, 20.5, eyeY, 2.6, 3, look.eye);
      px(ctx, 10.5, eyeY - 1, 0xffffff, 0.95);
      px(ctx, 19.5, eyeY - 1, 0xffffff, 0.95);
      break;
  }

  // Nase und Mund
  triangle(ctx, 16, 21, 18, 23, 14, 23, 0xc4657f);
  if (mood === 'sad') {
    line(ctx, 13, 27, 16, 25, darken(fur, 0.35), 1);
    line(ctx, 16, 25, 19, 27, darken(fur, 0.35), 1);
  } else {
    line(ctx, 16, 24, 13, 26, darken(fur, 0.35), 1);
    line(ctx, 16, 24, 19, 26, darken(fur, 0.35), 1);
  }

  // Schnurrhaare
  line(ctx, 2, 20, 8, 21, 0xfff4dc, 1, 0.75);
  line(ctx, 2, 24, 8, 23, 0xfff4dc, 1, 0.75);
  line(ctx, 30, 20, 24, 21, 0xfff4dc, 1, 0.75);
  line(ctx, 30, 24, 24, 23, 0xfff4dc, 1, 0.75);

  if (look.accessory && look.accessory !== 'none') {
    drawAccessory(ctx, { ...look, scale: 1 }, 'down', 16, 28);
  }

  ctx.restore();
  return canvas.toDataURL();
}

export { mix };
