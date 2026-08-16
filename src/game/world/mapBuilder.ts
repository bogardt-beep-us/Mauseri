/**
 * Baut aus einer AreaDef eine spielbare Karte.
 *
 * Zwei Ebenen werden erzeugt:
 *  - baseLayer: alles, was unter der Figur liegt. Fuer Kacheln, die die Figur
 *    verdecken sollen (Baumkronen), steht hier stattdessen der Untergrund.
 *  - overLayer: genau diese verdeckenden Kacheln, gezeichnet ueber den Figuren.
 *
 * Die Kollision wird auf beiden Ebenen gesetzt, damit ein Baum weiterhin fest
 * ist, obwohl er oben gezeichnet wird.
 */

import Phaser from 'phaser';
import { DEPTH, TILE } from '@/core/constants';
import { createRng, hashString } from '@/core/rng';
import { REGIONS } from '@/data/regions';
import { LEGEND, TILES, tileFromChar } from '@/data/tiles';
import type { AreaDef, TileId } from '@/data/types';
import { tileIndex, tilesetKey, usesVariants, VARIANTS } from '../art/tileTextures';

export interface BuiltMap {
  map: Phaser.Tilemaps.Tilemap;
  /** Zweite Tilemap fuer die verdeckende Ebene - muss mit aufgeraeumt werden. */
  overMap: Phaser.Tilemaps.Tilemap;
  baseLayer: Phaser.Tilemaps.TilemapLayer;
  overLayer: Phaser.Tilemaps.TilemapLayer;
  widthInTiles: number;
  heightInTiles: number;
  /** Kacheltyp je Position - schneller als ueber die Tilemap zu gehen. */
  tileAt: (tx: number, ty: number) => TileId;
  /** Setzt die Kollision neu (z. B. wenn Schattenpfote aktiv wird). */
  refreshCollision: (options: { shadowWalk: boolean }) => void;
}

/** Untergrund, der unter verdeckenden Kacheln gezeichnet wird. */
function baseUnder(tile: TileId): TileId {
  switch (tile) {
    case 'tree':
      return 'grass';
    case 'roof':
      return 'wall';
    default:
      return tile;
  }
}

export function buildMap(scene: Phaser.Scene, area: AreaDef): BuiltMap {
  const rows = area.rows;
  const heightInTiles = rows.length;
  const widthInTiles = Math.max(...rows.map((r) => r.length));

  // Karten muessen rechteckig sein; kuerzere Zeilen werden mit Leerraum
  // aufgefuellt, statt das Spiel mit undefined-Kacheln abstuerzen zu lassen.
  const grid: TileId[][] = rows.map((row) => {
    const padded = row.padEnd(widthInTiles, ' ');
    return [...padded].map((ch) => tileFromChar(ch));
  });

  const rng = createRng(hashString(area.id));
  const baseData: number[][] = [];
  const overData: number[][] = [];

  for (let y = 0; y < heightInTiles; y++) {
    const baseRow: number[] = [];
    const overRow: number[] = [];
    for (let x = 0; x < widthInTiles; x++) {
      const tile = grid[y]![x]!;
      const def = TILES[tile];
      const variant = usesVariants(tile) ? Math.floor(rng() * VARIANTS) : 0;

      if (def.overhang) {
        baseRow.push(tileIndex(baseUnder(tile), Math.floor(rng() * VARIANTS)));
        overRow.push(tileIndex(tile, variant));
      } else {
        baseRow.push(tileIndex(tile, variant));
        // -1 bedeutet in Phaser: hier ist keine Kachel.
        overRow.push(-1);
      }
    }
    baseData.push(baseRow);
    overData.push(overRow);
  }

  const map = scene.make.tilemap({
    data: baseData,
    tileWidth: TILE,
    tileHeight: TILE,
  });

  const region = REGIONS[area.region];
  const tileset = map.addTilesetImage(tilesetKey(region.id), tilesetKey(region.id), TILE, TILE, 0, 0);
  if (!tileset) {
    throw new Error(`[mapBuilder] Tileset fuer Region "${region.id}" fehlt.`);
  }

  const baseLayer = map.createLayer(0, tileset, 0, 0);
  if (!baseLayer) throw new Error(`[mapBuilder] Grundebene fuer "${area.id}" konnte nicht erstellt werden.`);
  baseLayer.setDepth(DEPTH.ground);

  // Zweite Ebene fuer verdeckende Kacheln
  const overMap = scene.make.tilemap({ data: overData, tileWidth: TILE, tileHeight: TILE });
  const overTileset = overMap.addTilesetImage(
    tilesetKey(region.id),
    tilesetKey(region.id),
    TILE,
    TILE,
    0,
    0,
  );
  const overLayer = overMap.createLayer(0, overTileset!, 0, 0);
  if (!overLayer) throw new Error(`[mapBuilder] Deckebene fuer "${area.id}" konnte nicht erstellt werden.`);
  overLayer.setDepth(DEPTH.overhang);

  const tileAt = (tx: number, ty: number): TileId => {
    if (ty < 0 || ty >= heightInTiles || tx < 0 || tx >= widthInTiles) return 'void';
    return grid[ty]![tx]!;
  };

  const refreshCollision = ({ shadowWalk }: { shadowWalk: boolean }): void => {
    // Kollision je Kachelposition setzen statt ueber Indexlisten: die Indizes
    // enthalten Varianten, und Schattenfelder sollen situativ durchlaessig sein.
    for (let y = 0; y < heightInTiles; y++) {
      for (let x = 0; x < widthInTiles; x++) {
        const tile = grid[y]![x]!;
        const def = TILES[tile];
        let solid = def.solid;

        if (tile === 'shadow' && shadowWalk) solid = false;

        const layer = def.overhang ? overLayer : baseLayer;
        const other = def.overhang ? baseLayer : overLayer;
        layer.getTileAt(x, y, true)?.setCollision(solid, solid, solid, solid);
        // Auf der jeweils anderen Ebene darf hier nichts blocken.
        other.getTileAt(x, y, true)?.setCollision(false, false, false, false);
      }
    }
  };

  refreshCollision({ shadowWalk: false });

  map.setLayer(0);
  baseLayer.setCullPadding(2, 2);
  overLayer.setCullPadding(2, 2);

  return { map, overMap, baseLayer, overLayer, widthInTiles, heightInTiles, tileAt, refreshCollision };
}

/** Umrechnung Kachel -> Weltmitte. */
export function tileToWorld(tx: number, ty: number): { x: number; y: number } {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

/** Umrechnung Welt -> Kachel. */
export function worldToTile(x: number, y: number): { tx: number; ty: number } {
  return { tx: Math.floor(x / TILE), ty: Math.floor(y / TILE) };
}

/** Prueft, ob zwischen zwei Punkten eine Wand steht (grobe Sichtlinie). */
export function hasLineOfSight(
  built: BuiltMap,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): boolean {
  const steps = Math.ceil(Phaser.Math.Distance.Between(x0, y0, x1, y1) / (TILE * 0.5));
  if (steps === 0) return true;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const { tx, ty } = worldToTile(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
    const def = TILES[built.tileAt(tx, ty)];
    // Verdeckende Kacheln (Baumkronen) blockieren die Sicht nicht - sonst
    // verlieren Gegner im Wald staendig ihr Ziel.
    if (def.solid && !def.overhang) return false;
  }
  return true;
}

/** Alle Zeichen, die in Karten erlaubt sind - fuer Fehlermeldungen. */
export const LEGEND_CHARS = Object.keys(LEGEND).join('');
