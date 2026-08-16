/**
 * Sprites fuer Weltobjekte (Truhen, Schalter, Tore, Fackeln ...), Gegenstaende
 * und Kampfeffekte. Wie alles Grafische im Projekt: aus Code gezeichnet.
 */

import { createRng, hashString } from '@/core/rng';
import { darken, ellipse, glow, lighten, line, makeCanvas, mix, px, rect, triangle, type Ctx } from './draw';

const S = 32;

type ObjectDrawer = (ctx: Ctx, rng: () => number) => void;

/** Truhe geschlossen / offen. */
function chest(open: boolean): ObjectDrawer {
  return (ctx) => {
    const wood = 0x8a5a34;
    const trim = 0xffd98a;
    ellipse(ctx, 16, 27, 10, 3, 0x000000, 0.25);
    if (open) {
      // Deckel aufgeklappt nach hinten
      rect(ctx, 5, 6, 22, 7, darken(wood, 0.3));
      rect(ctx, 6, 7, 20, 5, wood);
      rect(ctx, 6, 7, 20, 1, lighten(wood, 0.2));
      // Innenraum
      rect(ctx, 6, 15, 20, 11, darken(wood, 0.55));
      glow(ctx, 16, 18, 10, trim, 0.5);
    } else {
      // Gewoelbter Deckel
      ellipse(ctx, 16, 15, 11, 6, darken(wood, 0.3));
      ellipse(ctx, 16, 15, 10, 5, wood);
      rect(ctx, 5, 15, 22, 1, darken(wood, 0.45));
    }
    // Korpus
    rect(ctx, 5, 16, 22, 11, darken(wood, 0.3));
    rect(ctx, 6, 17, 20, 9, wood);
    rect(ctx, 6, 17, 20, 1, lighten(wood, 0.15));
    // Beschlaege
    rect(ctx, 5, 16, 22, 2, trim, 0.85);
    rect(ctx, 14, 16, 4, 8, trim, 0.9);
    if (!open) px(ctx, 16, 20, darken(trim, 0.5));
  };
}

function switchTile(pressed: boolean, symbol?: string): ObjectDrawer {
  return (ctx) => {
    const base = 0x6a6270;
    ellipse(ctx, 16, 26, 10, 4, 0x000000, 0.22);
    // Sockel
    rect(ctx, 6, 18, 20, 8, darken(base, 0.35));
    rect(ctx, 7, 19, 18, 6, base);
    // Knopf
    const y = pressed ? 16 : 12;
    const color = pressed ? 0x6fd88a : 0xd85f5f;
    ellipse(ctx, 16, y + 4, 8, 5, darken(color, 0.4));
    ellipse(ctx, 16, y + 3, 7, 4, color);
    ellipse(ctx, 14, y + 2, 3, 1.5, lighten(color, 0.3), 0.7);
    if (pressed) glow(ctx, 16, y + 3, 10, 0x6fd88a, 0.4);
    if (symbol) {
      ctx.fillStyle = '#241a3d';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, 16, y + 3);
    }
  };
}

function plate(pressed: boolean): ObjectDrawer {
  return (ctx) => {
    const base = 0x7a7286;
    const y = pressed ? 20 : 18;
    rect(ctx, 4, y, 24, 8, darken(base, 0.4));
    rect(ctx, 5, y + 1, 22, 6, pressed ? darken(base, 0.1) : base);
    rect(ctx, 5, y + 1, 22, 1, lighten(base, 0.2), 0.7);
    // Eckmarkierungen
    for (const [cx, cy] of [
      [7, y + 3],
      [25, y + 3],
    ]) {
      px(ctx, cx, cy, pressed ? 0x6fd88a : 0xd8a05f);
    }
    if (pressed) glow(ctx, 16, y + 3, 12, 0x6fd88a, 0.3);
  };
}

const pushBlock: ObjectDrawer = (ctx, rng) => {
  const stone = 0x8d8378;
  ellipse(ctx, 16, 28, 11, 3, 0x000000, 0.28);
  rect(ctx, 3, 6, 26, 23, darken(stone, 0.4));
  rect(ctx, 4, 7, 24, 21, stone);
  rect(ctx, 4, 7, 24, 3, lighten(stone, 0.18));
  rect(ctx, 4, 25, 24, 3, darken(stone, 0.25));
  // Runenmarkierung, damit der Block als beweglich erkennbar ist
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    line(ctx, 16, 17, 16 + Math.cos(a) * 6, 17 + Math.sin(a) * 6, darken(stone, 0.35), 1, 0.8);
  }
  ellipse(ctx, 16, 17, 3, 3, 0xffd98a, 0.55);
  for (let i = 0; i < 10; i++) px(ctx, 5 + rng() * 22, 8 + rng() * 19, darken(stone, 0.2), 0.35);
};

function gate(open: boolean, vertical: boolean): ObjectDrawer {
  return (ctx) => {
    const metal = 0x6a6a7e;
    ctx.save();
    if (vertical) {
      ctx.translate(S, 0);
      ctx.rotate(Math.PI / 2);
    }
    if (open) {
      // Zurueckgezogene Gitterstaebe
      rect(ctx, 0, 2, S, 5, darken(metal, 0.4));
      rect(ctx, 0, 3, S, 3, metal);
      for (let x = 2; x < S; x += 6) rect(ctx, x, 3, 2, 3, lighten(metal, 0.15));
    } else {
      rect(ctx, 0, 2, S, 4, darken(metal, 0.45));
      for (let x = 2; x < S; x += 6) {
        rect(ctx, x, 4, 3, 26, darken(metal, 0.3));
        rect(ctx, x, 4, 1, 26, lighten(metal, 0.2));
      }
      rect(ctx, 0, 14, S, 3, darken(metal, 0.35));
      rect(ctx, 0, 14, S, 1, lighten(metal, 0.1));
      // Spitzen unten
      for (let x = 2; x < S; x += 6) triangle(ctx, x, 30, x + 1.5, 32, x + 3, 30, darken(metal, 0.4));
    }
    ctx.restore();
  };
}

function torch(lit: boolean): ObjectDrawer {
  return (ctx, rng) => {
    ellipse(ctx, 16, 28, 6, 2, 0x000000, 0.25);
    // Halterung
    rect(ctx, 14, 14, 4, 14, 0x5a4a3a);
    rect(ctx, 14, 14, 1, 14, 0x7a6a56);
    ellipse(ctx, 16, 13, 5, 3, 0x4a3f32);
    if (lit) {
      glow(ctx, 16, 8, 15, 0xffa040, 0.6);
      ellipse(ctx, 16, 9, 4, 6, 0xff7a2a);
      ellipse(ctx, 16, 9, 2.5, 4.5, 0xffc35e);
      ellipse(ctx, 16, 8, 1.2, 2.5, 0xfff4dc);
      for (let i = 0; i < 4; i++) {
        px(ctx, 14 + rng() * 5, 2 + rng() * 5, 0xffd98a, 0.7);
      }
    } else {
      ellipse(ctx, 16, 11, 3, 3, 0x2e2620);
      px(ctx, 16, 10, 0x4a3f32);
    }
  };
}

const savePoint: ObjectDrawer = (ctx, rng) => {
  glow(ctx, 16, 16, 15, 0xffd98a, 0.4);
  // Schwebender Schrein mit Katzenpfote
  ellipse(ctx, 16, 28, 9, 3, 0x000000, 0.2);
  rect(ctx, 10, 20, 12, 8, 0x6a5c8c);
  rect(ctx, 11, 21, 10, 6, 0x8a7cb0);
  ellipse(ctx, 16, 14, 7, 8, 0xffd98a, 0.25);
  // Pfotenabdruck
  ellipse(ctx, 16, 16, 3.5, 3, 0xffd98a);
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI * 0.85 + (i / 3) * Math.PI * 0.7;
    ellipse(ctx, 16 + Math.cos(a) * 5, 16 + Math.sin(a) * 5, 1.4, 1.4, 0xffd98a);
  }
  for (let i = 0; i < 5; i++) {
    px(ctx, 8 + rng() * 16, 6 + rng() * 16, 0xfff4dc, 0.6);
  }
};

function mirror(angleStep: number): ObjectDrawer {
  return (ctx) => {
    const angle = (angleStep * Math.PI) / 4;
    ellipse(ctx, 16, 27, 9, 3, 0x000000, 0.25);
    rect(ctx, 13, 20, 6, 8, 0x5a5266);
    ctx.save();
    ctx.translate(16, 16);
    ctx.rotate(angle);
    // Spiegelflaeche
    rect(ctx, -11, -3, 22, 6, 0x3a3448);
    rect(ctx, -10, -2, 20, 4, 0xcfe4ff);
    rect(ctx, -10, -2, 20, 1, 0xffffff);
    rect(ctx, -10, 1, 20, 1, 0x8fb4d8);
    ctx.restore();
    ellipse(ctx, 16, 16, 3, 3, 0x6a5c8c);
  };
}

function valve(level: number): ObjectDrawer {
  return (ctx) => {
    const metal = 0x7a8a96;
    ellipse(ctx, 16, 27, 8, 3, 0x000000, 0.25);
    rect(ctx, 13, 18, 6, 10, darken(metal, 0.35));
    // Rad
    ctx.save();
    ctx.translate(16, 15);
    ctx.rotate((level * Math.PI) / 3);
    ellipse(ctx, 0, 0, 9, 9, darken(metal, 0.3));
    ellipse(ctx, 0, 0, 7, 7, metal);
    ellipse(ctx, 0, 0, 4, 4, darken(metal, 0.4));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      line(ctx, 0, 0, Math.cos(a) * 8, Math.sin(a) * 8, lighten(metal, 0.2), 2);
    }
    ctx.restore();
    // Fuellstandsanzeige
    for (let i = 0; i < 3; i++) {
      px(ctx, 24, 12 + i * 3, i < level ? 0x5fd8ff : 0x3a3448);
      px(ctx, 25, 12 + i * 3, i < level ? 0x5fd8ff : 0x3a3448);
    }
  };
}

function runeStone(active: boolean, symbol: string): ObjectDrawer {
  return (ctx, rng) => {
    const stone = 0x6a6278;
    ellipse(ctx, 16, 28, 9, 3, 0x000000, 0.25);
    // Aufrecht stehender Stein
    triangle(ctx, 16, 3, 6, 28, 26, 28, darken(stone, 0.35));
    triangle(ctx, 16, 5, 8, 27, 24, 27, stone);
    for (let i = 0; i < 8; i++) px(ctx, 9 + rng() * 14, 8 + rng() * 18, darken(stone, 0.2), 0.4);
    const color = active ? 0xffd98a : 0x3a3448;
    if (active) glow(ctx, 16, 17, 13, 0xffd98a, 0.45);
    ctx.fillStyle = active ? '#ffd98a' : '#3a3448';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, 16, 18);
    ellipse(ctx, 16, 24, 5, 1, color, 0.6);
  };
}

const signPost: ObjectDrawer = (ctx) => {
  const wood = 0x9a6a3a;
  ellipse(ctx, 16, 28, 7, 2, 0x000000, 0.22);
  rect(ctx, 14, 16, 4, 12, darken(wood, 0.3));
  rect(ctx, 4, 6, 24, 12, darken(wood, 0.35));
  rect(ctx, 5, 7, 22, 10, wood);
  for (let i = 0; i < 3; i++) rect(ctx, 8, 9 + i * 3, 16 - i * 4, 1, darken(wood, 0.45), 0.85);
};

/** Sprechblasen-Symbol ueber interagierbaren Objekten. */
const interactHint: ObjectDrawer = (ctx) => {
  ellipse(ctx, 16, 14, 11, 8, 0x000000, 0.35);
  ellipse(ctx, 16, 13, 10, 7, 0xfff4dc);
  triangle(ctx, 13, 19, 16, 24, 19, 19, 0xfff4dc);
  ctx.fillStyle = '#3a2c60';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', 16, 13);
};

/** Ausrufezeichen ueber NPCs mit offener Quest. */
const questHint: ObjectDrawer = (ctx) => {
  glow(ctx, 16, 14, 12, 0xffd98a, 0.5);
  rect(ctx, 14, 5, 4, 11, 0xffd98a);
  rect(ctx, 14, 5, 4, 2, 0xfff4dc);
  rect(ctx, 14, 18, 4, 4, 0xffd98a);
};

const questDoneHint: ObjectDrawer = (ctx) => {
  glow(ctx, 16, 14, 12, 0x6fd88a, 0.45);
  line(ctx, 10, 14, 14, 19, 0x6fd88a, 3);
  line(ctx, 14, 19, 23, 8, 0x6fd88a, 3);
};

// ---------------------------------------------------------------------------
// Kampf- und Weltpartikel
// ---------------------------------------------------------------------------

/** Kratzer-Effekt beim Nahkampfangriff. */
const slash: ObjectDrawer = (ctx) => {
  for (let i = 0; i < 3; i++) {
    const offset = i * 5 - 5;
    ctx.save();
    ctx.translate(16, 16);
    ctx.rotate(-0.35);
    // Sichelfoermige Kralle
    for (let t = 0; t <= 20; t++) {
      const a = -0.9 + (t / 20) * 1.8;
      const r = 13 - Math.abs(a) * 2;
      const x = Math.cos(a) * r + offset * 0.2;
      const y = Math.sin(a) * r + offset;
      const width = t > 3 && t < 17 ? 2 : 1;
      ctx.fillStyle = `rgba(255,244,220,${0.9 - Math.abs(a) * 0.4})`;
      ctx.fillRect(Math.round(x), Math.round(y), width, width);
    }
    ctx.restore();
  }
};

/** Aufschlag-Effekt bei Treffern. */
const impact: ObjectDrawer = (ctx, rng) => {
  glow(ctx, 16, 16, 12, 0xffd98a, 0.5);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rng() * 0.3;
    const r0 = 4;
    const r1 = 10 + rng() * 4;
    line(
      ctx,
      16 + Math.cos(a) * r0,
      16 + Math.sin(a) * r0,
      16 + Math.cos(a) * r1,
      16 + Math.sin(a) * r1,
      0xfff4dc,
      2,
      0.9,
    );
  }
  ellipse(ctx, 16, 16, 4, 4, 0xffffff, 0.8);
};

/** Kleiner runder Partikel - Basis fuer Staub, Funken, Blaetter. */
function particle(color: number, radius: number): ObjectDrawer {
  return (ctx) => {
    glow(ctx, 16, 16, radius * 2.2, color, 0.45);
    ellipse(ctx, 16, 16, radius, radius, color);
    ellipse(ctx, 16 - radius * 0.3, 16 - radius * 0.3, radius * 0.4, radius * 0.4, 0xffffff, 0.7);
  };
}

/** Projektil (Gegner und Bosse). */
function projectile(color: number): ObjectDrawer {
  return (ctx) => {
    glow(ctx, 16, 16, 12, color, 0.55);
    ellipse(ctx, 16, 16, 5, 5, darken(color, 0.25));
    ellipse(ctx, 16, 16, 3.5, 3.5, color);
    ellipse(ctx, 15, 15, 1.5, 1.5, 0xffffff, 0.85);
  };
}

/** Bodengefahr (Dornenfeld, Schattenpfuetze). */
function hazard(color: number, spiky: boolean): ObjectDrawer {
  return (ctx, rng) => {
    if (spiky) {
      ellipse(ctx, 16, 20, 12, 7, darken(color, 0.35), 0.75);
      for (let i = 0; i < 7; i++) {
        const x = 5 + i * 3.6;
        const h = 8 + rng() * 7;
        triangle(ctx, x, 22, x + 1.8, 22 - h, x + 3.6, 22, color);
        triangle(ctx, x + 0.6, 22, x + 1.8, 22 - h * 0.6, x + 3, 22, lighten(color, 0.2), 0.8);
      }
    } else {
      glow(ctx, 16, 18, 15, color, 0.4);
      ellipse(ctx, 16, 19, 13, 8, darken(color, 0.3), 0.8);
      ellipse(ctx, 16, 18, 11, 6, color, 0.75);
      for (let i = 0; i < 5; i++) {
        ellipse(ctx, 6 + rng() * 20, 14 + rng() * 9, 1.5, 1, lighten(color, 0.3), 0.6);
      }
    }
  };
}

/** Kreis, der die Wirkung einer Faehigkeit anzeigt. */
function abilityRing(color: number): ObjectDrawer {
  return (ctx) => {
    for (let r = 12; r <= 15; r++) {
      for (let a = 0; a < Math.PI * 2; a += 0.05) {
        px(ctx, 16 + Math.cos(a) * r, 16 + Math.sin(a) * r, color, r === 13 || r === 14 ? 0.9 : 0.45);
      }
    }
    glow(ctx, 16, 16, 16, color, 0.3);
  };
}

/** Warnmarkierung am Boden vor Boss-Angriffen. */
const telegraph: ObjectDrawer = (ctx) => {
  for (let r = 13; r <= 15; r++) {
    for (let a = 0; a < Math.PI * 2; a += 0.06) {
      px(ctx, 16 + Math.cos(a) * r, 16 + Math.sin(a) * r, 0xff5f5f, 0.85);
    }
  }
  ellipse(ctx, 16, 16, 12, 12, 0xff5f5f, 0.18);
};

/**
 * Hintergrundfeld hinter der Welt.
 *
 * Auf einem hochkant gehaltenen Handy ist das Sichtfeld deutlich hoeher als
 * jeder Innenraum breit ist. Ohne Hintergrund staende die Karte in einer
 * leeren Flaeche. Dieses kachelbare Muster fuellt den Rand so, dass er wie
 * gestaltete Nacht wirkt statt wie ein Darstellungsfehler.
 */
const backdrop: ObjectDrawer = (ctx, rng) => {
  const size = 64;
  rect(ctx, 0, 0, size, size, 0x171126);

  // Diagonale Schraffur, sehr schwach
  for (let i = -size; i < size * 2; i += 8) {
    line(ctx, i, 0, i + size, size, 0x241a3d, 1, 0.5);
  }

  // Vereinzelte Pfotenabdruecke
  for (let p = 0; p < 2; p++) {
    const px0 = rng() * size;
    const py0 = rng() * size;
    ellipse(ctx, px0, py0, 3, 2.4, 0x2a1f47, 0.75);
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI * 0.85 + (i / 3) * Math.PI * 0.7;
      ellipse(ctx, px0 + Math.cos(a) * 4.4, py0 + Math.sin(a) * 4.4, 1.2, 1.2, 0x2a1f47, 0.75);
    }
  }

  // Sterne
  for (let i = 0; i < 5; i++) {
    px(ctx, rng() * size, rng() * size, 0x6a5b9a, 0.6);
  }
};

/** Nebelschwade fuer Schnurrwald und Schattenlande. */
const fog: ObjectDrawer = (ctx, rng) => {
  for (let i = 0; i < 6; i++) {
    ellipse(ctx, 8 + rng() * 16, 10 + rng() * 12, 6 + rng() * 8, 3 + rng() * 4, 0xffffff, 0.09);
  }
};

// ---------------------------------------------------------------------------
// Gegenstands-Symbole (Inventar, Truhen, Pickups)
// ---------------------------------------------------------------------------

export type ItemIconId =
  | 'biscuit'
  | 'berry'
  | 'milk'
  | 'coin'
  | 'key'
  | 'gem'
  | 'scroll'
  | 'fish'
  | 'bell'
  | 'feather'
  | 'shard'
  | 'claw'
  | 'collar'
  | 'lantern'
  | 'map'
  | 'heart'
  | 'star'
  | 'crown'
  | 'flower'
  | 'bone';

const ITEM_DRAWERS: Record<ItemIconId, (ctx: Ctx, color: number, rng: () => number) => void> = {
  biscuit: (ctx, color) => {
    ellipse(ctx, 16, 17, 10, 9, darken(color, 0.25));
    ellipse(ctx, 16, 16, 9, 8, color);
    for (const [x, y] of [
      [12, 13],
      [19, 15],
      [14, 20],
      [20, 20],
    ]) {
      ellipse(ctx, x, y, 1.6, 1.6, darken(color, 0.45));
    }
  },
  berry: (ctx, color) => {
    ellipse(ctx, 14, 19, 6, 6, darken(color, 0.15));
    ellipse(ctx, 19, 17, 5, 5, color);
    ellipse(ctx, 12, 17, 2, 2, lighten(color, 0.35), 0.8);
    line(ctx, 17, 12, 19, 7, 0x4a7d43, 2);
    ellipse(ctx, 21, 7, 4, 2, 0x4a7d43);
  },
  milk: (ctx, color) => {
    rect(ctx, 10, 10, 12, 16, darken(color, 0.3));
    rect(ctx, 11, 11, 10, 14, color);
    rect(ctx, 11, 11, 10, 4, lighten(color, 0.2));
    rect(ctx, 12, 6, 8, 5, darken(color, 0.2));
    ellipse(ctx, 16, 20, 3, 3, 0xffd98a, 0.6);
  },
  coin: (ctx, color) => {
    ellipse(ctx, 16, 17, 9, 9, darken(color, 0.3));
    ellipse(ctx, 16, 16, 8, 8, color);
    ellipse(ctx, 16, 16, 5, 5, lighten(color, 0.2));
    ellipse(ctx, 13, 13, 2, 2, 0xffffff, 0.7);
    // Pfotenpraegung
    ellipse(ctx, 16, 17, 2, 1.6, darken(color, 0.35));
    for (let i = 0; i < 3; i++) ellipse(ctx, 14 + i * 2, 13.5, 0.8, 0.8, darken(color, 0.35));
  },
  key: (ctx, color) => {
    ellipse(ctx, 11, 12, 5, 5, darken(color, 0.25));
    ellipse(ctx, 11, 12, 3, 3, 0x00000000, 0);
    for (let a = 0; a < Math.PI * 2; a += 0.1) {
      px(ctx, 11 + Math.cos(a) * 4, 12 + Math.sin(a) * 4, color);
      px(ctx, 11 + Math.cos(a) * 5, 12 + Math.sin(a) * 5, darken(color, 0.2));
    }
    line(ctx, 13, 15, 23, 25, color, 3);
    line(ctx, 20, 25, 23, 22, color, 3);
    line(ctx, 23, 27, 25, 25, color, 3);
  },
  gem: (ctx, color) => {
    glow(ctx, 16, 16, 13, color, 0.45);
    triangle(ctx, 16, 5, 6, 15, 26, 15, lighten(color, 0.25));
    triangle(ctx, 6, 15, 26, 15, 16, 28, color);
    line(ctx, 16, 5, 16, 28, lighten(color, 0.4), 1, 0.6);
    line(ctx, 6, 15, 26, 15, darken(color, 0.2), 1, 0.5);
    px(ctx, 12, 11, 0xffffff, 0.9);
  },
  scroll: (ctx, color) => {
    rect(ctx, 8, 8, 16, 18, darken(color, 0.2));
    rect(ctx, 9, 9, 14, 16, color);
    for (let i = 0; i < 4; i++) rect(ctx, 11, 12 + i * 3, 10 - (i % 2) * 3, 1, darken(color, 0.45), 0.8);
    ellipse(ctx, 8, 8, 3, 2, 0x9a6a3a);
    ellipse(ctx, 24, 26, 3, 2, 0x9a6a3a);
  },
  fish: (ctx, color) => {
    ellipse(ctx, 15, 17, 9, 5, darken(color, 0.2));
    ellipse(ctx, 15, 16, 8, 4.5, color);
    triangle(ctx, 23, 16, 29, 11, 29, 21, darken(color, 0.15));
    ellipse(ctx, 10, 15, 1.4, 1.4, 0x241a3d);
    for (let i = 0; i < 3; i++) ellipse(ctx, 13 + i * 3, 17, 1.5, 2, lighten(color, 0.2), 0.6);
  },
  bell: (ctx, color) => {
    ellipse(ctx, 16, 16, 8, 8, darken(color, 0.25));
    ellipse(ctx, 16, 15, 7, 7, color);
    rect(ctx, 8, 16, 16, 5, color);
    rect(ctx, 7, 20, 18, 3, darken(color, 0.2));
    ellipse(ctx, 16, 25, 2.5, 2.5, darken(color, 0.35));
    rect(ctx, 14, 15, 4, 8, darken(color, 0.4), 0.5);
    px(ctx, 12, 11, 0xffffff, 0.8);
  },
  feather: (ctx, color) => {
    line(ctx, 10, 27, 21, 6, darken(color, 0.3), 1);
    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      const x = 10 + (21 - 10) * t;
      const y = 27 + (6 - 27) * t;
      const w = 6 * Math.sin(t * Math.PI);
      line(ctx, x, y, x - w, y - w * 0.3, color, 1, 0.85);
      line(ctx, x, y, x + w * 0.7, y + w * 0.3, lighten(color, 0.15), 1, 0.8);
    }
  },
  shard: (ctx, color) => {
    glow(ctx, 16, 16, 14, color, 0.5);
    triangle(ctx, 16, 4, 9, 20, 20, 24, color);
    triangle(ctx, 16, 7, 12, 19, 18, 21, lighten(color, 0.3));
    triangle(ctx, 20, 14, 24, 26, 15, 25, mix(color, 0x8a6ad0, 0.4));
    px(ctx, 14, 11, 0xffffff, 0.9);
  },
  claw: (ctx, color) => {
    for (let i = 0; i < 3; i++) {
      const x = 9 + i * 7;
      for (let t = 0; t <= 14; t++) {
        const p = t / 14;
        px(ctx, x + p * 3, 6 + p * 18, color, 1);
        px(ctx, x + p * 3 + 1, 6 + p * 18, lighten(color, 0.2), 0.7);
      }
      triangle(ctx, x + 3, 24, x + 4.5, 28, x + 6, 24, color);
    }
  },
  collar: (ctx, color) => {
    for (let a = 0; a < Math.PI * 2; a += 0.05) {
      px(ctx, 16 + Math.cos(a) * 9, 16 + Math.sin(a) * 8, color);
      px(ctx, 16 + Math.cos(a) * 10, 16 + Math.sin(a) * 9, darken(color, 0.25));
    }
    ellipse(ctx, 16, 25, 3.5, 3.5, 0xffd98a);
    px(ctx, 15, 24, 0xfff4dc);
  },
  lantern: (ctx, color) => {
    glow(ctx, 16, 17, 14, 0xffd98a, 0.5);
    rect(ctx, 11, 10, 10, 14, darken(color, 0.35));
    rect(ctx, 12, 11, 8, 12, 0xffd98a, 0.85);
    ellipse(ctx, 16, 17, 3, 4, 0xfff4dc);
    rect(ctx, 10, 8, 12, 2, color);
    rect(ctx, 10, 24, 12, 2, color);
    line(ctx, 16, 8, 16, 4, color, 1);
    ellipse(ctx, 16, 4, 3, 2, 0x00000000, 0);
  },
  map: (ctx, color) => {
    rect(ctx, 6, 9, 20, 15, darken(color, 0.2));
    rect(ctx, 7, 10, 18, 13, color);
    // Faltkanten
    rect(ctx, 13, 10, 1, 13, darken(color, 0.25), 0.7);
    rect(ctx, 19, 10, 1, 13, darken(color, 0.25), 0.7);
    line(ctx, 9, 20, 14, 14, 0x9a6a3a, 1, 0.8);
    line(ctx, 14, 14, 22, 17, 0x9a6a3a, 1, 0.8);
    px(ctx, 22, 17, 0xd85f5f);
    px(ctx, 21, 16, 0xd85f5f);
  },
  heart: (ctx, color) => {
    glow(ctx, 16, 17, 12, color, 0.4);
    ellipse(ctx, 12, 14, 5, 5, color);
    ellipse(ctx, 20, 14, 5, 5, color);
    triangle(ctx, 7, 16, 25, 16, 16, 27, color);
    ellipse(ctx, 11, 12, 2, 1.5, 0xffffff, 0.6);
  },
  star: (ctx, color) => {
    glow(ctx, 16, 16, 14, color, 0.5);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
      const a2 = a + Math.PI / 5;
      triangle(
        ctx,
        16,
        16,
        16 + Math.cos(a) * 11,
        16 + Math.sin(a) * 11,
        16 + Math.cos(a2) * 4.5,
        16 + Math.sin(a2) * 4.5,
        color,
      );
      const a0 = a - Math.PI / 5;
      triangle(
        ctx,
        16,
        16,
        16 + Math.cos(a) * 11,
        16 + Math.sin(a) * 11,
        16 + Math.cos(a0) * 4.5,
        16 + Math.sin(a0) * 4.5,
        lighten(color, 0.15),
      );
    }
  },
  crown: (ctx, color) => {
    glow(ctx, 16, 18, 13, color, 0.35);
    rect(ctx, 7, 20, 18, 5, darken(color, 0.25));
    rect(ctx, 7, 20, 18, 2, color);
    for (let i = 0; i < 3; i++) {
      const x = 9 + i * 7;
      triangle(ctx, x - 2, 20, x + 1, 9, x + 4, 20, color);
      ellipse(ctx, x + 1, 8, 2, 2, 0xff9ecb);
    }
  },
  flower: (ctx, color) => {
    line(ctx, 16, 28, 16, 17, 0x4a7d43, 2);
    ellipse(ctx, 12, 22, 3, 2, 0x4a7d43);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ellipse(ctx, 16 + Math.cos(a) * 5, 15 + Math.sin(a) * 5, 3.5, 3.5, color);
    }
    ellipse(ctx, 16, 15, 3, 3, 0xffd98a);
  },
  bone: (ctx, color) => {
    line(ctx, 10, 22, 22, 10, color, 4);
    ellipse(ctx, 9, 21, 3, 3, color);
    ellipse(ctx, 11, 24, 3, 3, color);
    ellipse(ctx, 23, 11, 3, 3, color);
    ellipse(ctx, 21, 8, 3, 3, color);
    ellipse(ctx, 14, 18, 2, 2, lighten(color, 0.2), 0.6);
  },
};

// ---------------------------------------------------------------------------
// Registrierung
// ---------------------------------------------------------------------------

function addTexture(
  textures: Phaser.Textures.TextureManager,
  key: string,
  drawer: ObjectDrawer,
  size = S,
): void {
  if (textures.exists(key)) return;
  const { canvas, ctx } = makeCanvas(size, size);
  drawer(ctx, createRng(hashString(key)));
  textures.addCanvas(key, canvas);
}

/** Erzeugt ein Gegenstands-Symbol als eigene Textur. */
export function ensureItemIcon(
  textures: Phaser.Textures.TextureManager,
  icon: ItemIconId,
  color: number,
): string {
  const key = `item:${icon}:${color.toString(16)}`;
  if (textures.exists(key)) return key;
  const { canvas, ctx } = makeCanvas(S, S);
  const drawer = ITEM_DRAWERS[icon] ?? ITEM_DRAWERS.gem;
  drawer(ctx, color, createRng(hashString(key)));
  textures.addCanvas(key, canvas);
  return key;
}

/** Gegenstands-Symbol als data-URL fuer die React-Oberflaeche. */
export function renderItemIcon(icon: ItemIconId, color: number, size = 32): string {
  const { canvas, ctx } = makeCanvas(size, size);
  const scale = size / S;
  ctx.save();
  ctx.scale(scale, scale);
  const drawer = ITEM_DRAWERS[icon] ?? ITEM_DRAWERS.gem;
  drawer(ctx, color, createRng(hashString(`${icon}${color}`)));
  ctx.restore();
  return canvas.toDataURL();
}

/** Alle festen Objekt- und Effekttexturen anlegen. */
export function generateObjectTextures(textures: Phaser.Textures.TextureManager): void {
  addTexture(textures, 'obj:chest', chest(false));
  addTexture(textures, 'obj:chest:open', chest(true));
  addTexture(textures, 'obj:switch', switchTile(false));
  addTexture(textures, 'obj:switch:on', switchTile(true));
  addTexture(textures, 'obj:plate', plate(false));
  addTexture(textures, 'obj:plate:on', plate(true));
  addTexture(textures, 'obj:block', pushBlock);
  addTexture(textures, 'obj:gate:h', gate(false, false));
  addTexture(textures, 'obj:gate:h:open', gate(true, false));
  addTexture(textures, 'obj:gate:v', gate(false, true));
  addTexture(textures, 'obj:gate:v:open', gate(true, true));
  addTexture(textures, 'obj:torch', torch(false));
  addTexture(textures, 'obj:torch:lit', torch(true));
  addTexture(textures, 'obj:save', savePoint);
  addTexture(textures, 'obj:sign', signPost);
  addTexture(textures, 'obj:valve:0', valve(0));
  addTexture(textures, 'obj:valve:1', valve(1));
  addTexture(textures, 'obj:valve:2', valve(2));
  addTexture(textures, 'obj:valve:3', valve(3));

  // Spiegel in acht Ausrichtungen
  for (let i = 0; i < 8; i++) {
    addTexture(textures, `obj:mirror:${i}`, mirror(i));
  }

  // Runensteine mit den im Spiel verwendeten Symbolen
  for (const symbol of ['I', 'II', 'III', 'IV', 'V', 'A', 'B', 'C', 'D']) {
    addTexture(textures, `obj:rune:${symbol}`, runeStone(false, symbol));
    addTexture(textures, `obj:rune:${symbol}:on`, runeStone(true, symbol));
  }

  // Schalter mit Symbolen fuer Reihenfolge-Raetsel
  for (const symbol of ['1', '2', '3', '4']) {
    addTexture(textures, `obj:switch:${symbol}`, switchTile(false, symbol));
    addTexture(textures, `obj:switch:${symbol}:on`, switchTile(true, symbol));
  }

  addTexture(textures, 'hint:interact', interactHint);
  addTexture(textures, 'hint:quest', questHint);
  addTexture(textures, 'hint:questDone', questDoneHint);

  addTexture(textures, 'bg:nacht', backdrop, 64);

  addTexture(textures, 'fx:slash', slash);
  addTexture(textures, 'fx:impact', impact);
  addTexture(textures, 'fx:telegraph', telegraph);
  addTexture(textures, 'fx:fog', fog);

  addTexture(textures, 'fx:particle:white', particle(0xfff4dc, 3));
  addTexture(textures, 'fx:particle:gold', particle(0xffd98a, 3));
  addTexture(textures, 'fx:particle:red', particle(0xff6a6a, 3));
  addTexture(textures, 'fx:particle:green', particle(0x8fe08a, 3));
  addTexture(textures, 'fx:particle:blue', particle(0x7fd8ff, 3));
  addTexture(textures, 'fx:particle:purple', particle(0xa77fd8, 3));
  addTexture(textures, 'fx:particle:dust', particle(0xd8c8a8, 2));

  addTexture(textures, 'fx:projectile:purple', projectile(0xa77fd8));
  addTexture(textures, 'fx:projectile:green', projectile(0x8fe08a));
  addTexture(textures, 'fx:projectile:blue', projectile(0x7fd8ff));
  addTexture(textures, 'fx:projectile:red', projectile(0xff6a6a));
  addTexture(textures, 'fx:projectile:gold', projectile(0xffd98a));

  addTexture(textures, 'fx:hazard:thorn', hazard(0x7fa84a, true));
  addTexture(textures, 'fx:hazard:shadow', hazard(0x6a4a9a, false));
  addTexture(textures, 'fx:hazard:frost', hazard(0x7fd8ff, true));

  addTexture(textures, 'fx:ring:gold', abilityRing(0xffd98a));
  addTexture(textures, 'fx:ring:purple', abilityRing(0xa77fd8));
  addTexture(textures, 'fx:ring:blue', abilityRing(0x7fd8ff));
  addTexture(textures, 'fx:ring:green', abilityRing(0x8fe08a));

  // 1x1-Pixel in Weiss - Basis fuer Balken, Blenden und farbige Rechtecke.
  if (!textures.exists('px')) {
    const { canvas, ctx } = makeCanvas(1, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1, 1);
    textures.addCanvas('px', canvas);
  }
}
