/**
 * Kacheldefinitionen und ASCII-Legende.
 *
 * Karten werden als Zeichenketten geschrieben (siehe src/data/areas/*). Das ist
 * im Editor lesbar, in Git diffbar und braucht kein Tooling. Die Legende
 * uebersetzt Zeichen in Kacheltypen.
 */

import type { TileDef, TileId } from './types';

export const TILES: Record<TileId, TileDef> = {
  void: { id: 'void', solid: true },
  grass: { id: 'grass', solid: false },
  grassAlt: { id: 'grassAlt', solid: false },
  path: { id: 'path', solid: false },
  floor: { id: 'floor', solid: false },
  sand: { id: 'sand', solid: false, speedFactor: 0.92 },
  water: { id: 'water', solid: true },
  waterDeep: { id: 'waterDeep', solid: true },
  bridge: { id: 'bridge', solid: false },
  rock: { id: 'rock', solid: true },
  cliff: { id: 'cliff', solid: true },
  tree: { id: 'tree', solid: true, overhang: true },
  bush: { id: 'bush', solid: false, speedFactor: 0.8 },
  flower: { id: 'flower', solid: false },
  wall: { id: 'wall', solid: true },
  roof: { id: 'roof', solid: true, overhang: true },
  door: { id: 'door', solid: false },
  window: { id: 'window', solid: true },
  ledge: { id: 'ledge', solid: true, requiresAbility: 'kratzsprung' },
  shadow: { id: 'shadow', solid: true, requiresAbility: 'schattenpfote' },
  pit: { id: 'pit', solid: true },
  ice: { id: 'ice', solid: false, slippery: true },
  stairs: { id: 'stairs', solid: false },
  rubble: { id: 'rubble', solid: true },
  carpet: { id: 'carpet', solid: false },
  sign: { id: 'sign', solid: true },
  crystal: { id: 'crystal', solid: true, emissive: true },
  grave: { id: 'grave', solid: true },
  mud: { id: 'mud', solid: false, speedFactor: 0.6 },
  lilypad: { id: 'lilypad', solid: false },
  fence: { id: 'fence', solid: true },
  table: { id: 'table', solid: true },
  counter: { id: 'counter', solid: true },
};

/** Zeichen -> Kachel. Siehe Kommentare in types.ts (TileId). */
export const LEGEND: Record<string, TileId> = {
  ' ': 'void',
  '.': 'grass',
  ',': 'grassAlt',
  '-': 'path',
  _: 'floor',
  s: 'sand',
  '~': 'water',
  W: 'waterDeep',
  '=': 'bridge',
  '#': 'rock',
  '^': 'cliff',
  T: 'tree',
  b: 'bush',
  f: 'flower',
  X: 'wall',
  R: 'roof',
  D: 'door',
  w: 'window',
  j: 'ledge',
  '%': 'shadow',
  o: 'pit',
  i: 'ice',
  '/': 'stairs',
  r: 'rubble',
  c: 'carpet',
  '!': 'sign',
  '*': 'crystal',
  '+': 'grave',
  m: 'mud',
  p: 'lilypad',
  n: 'fence',
  t: 'table',
  u: 'counter',
};

export function tileFromChar(ch: string): TileId {
  const tile = LEGEND[ch];
  if (!tile) {
    console.warn(`[tiles] Unbekanntes Kartenzeichen "${ch}" - als Boden behandelt.`);
    return 'grass';
  }
  return tile;
}

export function tileDef(id: TileId): TileDef {
  return TILES[id];
}

/** Kacheln, die als "Boden" unter Objekten gezeichnet werden duerfen. */
export const WALKABLE_BASE: TileId[] = ['grass', 'grassAlt', 'path', 'floor', 'sand', 'carpet'];
