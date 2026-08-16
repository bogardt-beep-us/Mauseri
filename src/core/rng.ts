/**
 * Deterministischer Zufallsgenerator (Mulberry32).
 *
 * Wird fuer die prozedurale Grafik und fuer Weltdetails (Grasbueschel, Steine,
 * Fellmuster) verwendet. Deterministisch, damit dieselbe Karte bei jedem Start
 * identisch aussieht - sonst "flackert" die Welt bei jedem Betreten.
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stabiler String-Hash, um aus Namen (z. B. Karten-IDs) Seeds zu gewinnen. */
export function hashString(value: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function randRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(randRange(rng, min, max + 1));
}
