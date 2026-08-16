/**
 * Prueft die ASCII-Karten auf Fehler, bevor sie im Spiel landen.
 *
 * Geprueft wird:
 *  1. Alle Zeilen einer Karte sind gleich lang.
 *  2. Nur Zeichen aus der Legende werden verwendet.
 *  3. Karten-IDs sind eindeutig.
 *  4. Objekte liegen innerhalb der Karte.
 *  5. Objekte stehen nicht in einer festen Kachel (sonst sind sie
 *     unerreichbar - der haeufigste Fehler beim Kartenzeichnen).
 *  6. Portale zeigen auf existierende Karten und auf begehbare Zielfelder.
 *
 * Aufruf: npm run check:maps
 *
 * Laeuft ueber Nodes Type-Stripping, damit die TypeScript-Datendateien ohne
 * Build-Schritt gelesen werden koennen.
 */

import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const REGION_FILES = [
  'miezlingen',
  'schnurrwald',
  'kratzfels',
  'miauport',
  'mondsee',
  'schattenlande',
  'schloss',
];

// Legende aus tiles.ts gespiegelt. Bewusst dupliziert, damit das Pruefskript
// nicht von den Pfad-Aliassen der Anwendung abhaengt.
const LEGEND = {
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

const SOLID = new Set([
  'void',
  'water',
  'waterDeep',
  'rock',
  'cliff',
  'tree',
  'wall',
  'roof',
  'window',
  'ledge',
  'shadow',
  'pit',
  'rubble',
  'sign',
  'crystal',
  'grave',
  'fence',
  'table',
  'counter',
]);

/** Objekte, die bewusst auf einer festen Kachel stehen duerfen. */
const MAY_BE_SOLID = new Set(['sign', 'decor', 'trigger', 'boss']);

const areas = [];
for (const region of REGION_FILES) {
  const url = pathToFileURL(join(ROOT, 'src', 'data', 'areas', `${region}.ts`)).href;
  const module = await import(url);
  const exported = Object.values(module).find(Array.isArray);
  if (!exported) {
    console.error(`FEHLER: ${region}.ts exportiert keine Kartenliste.`);
    process.exitCode = 1;
    continue;
  }
  areas.push(...exported);
}

const byId = new Map();
const errors = [];
const warnings = [];

for (const area of areas) {
  if (byId.has(area.id)) {
    errors.push(`Doppelte Karten-ID "${area.id}".`);
  }
  byId.set(area.id, area);
}

for (const area of areas) {
  const rows = area.rows;
  const width = rows[0]?.length ?? 0;
  const height = rows.length;

  // 1. Gleiche Zeilenlaenge
  rows.forEach((row, index) => {
    if (row.length !== width) {
      errors.push(
        `${area.id}: Zeile ${index} ist ${row.length} Zeichen lang, erwartet ${width}.\n` +
          `        "${row}"`,
      );
    }
  });

  // 2. Nur bekannte Zeichen
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (!(ch in LEGEND)) {
        errors.push(`${area.id}: Unbekanntes Zeichen "${ch}" bei ${x},${y}.`);
      }
    });
  });

  const tileAt = (x, y) => {
    if (y < 0 || y >= height || x < 0 || x >= width) return 'void';
    return LEGEND[rows[y][x]] ?? 'void';
  };

  for (const object of area.objects ?? []) {
    const label = `${area.id}: ${object.type}${object.id ? ` "${object.id}"` : ''} bei ${object.x},${object.y}`;

    // 4. Innerhalb der Karte
    if (object.x < 0 || object.x >= width || object.y < 0 || object.y >= height) {
      errors.push(`${label} liegt ausserhalb der Karte (${width}x${height}).`);
      continue;
    }

    // 5. Nicht in einer festen Kachel
    const tile = tileAt(object.x, object.y);
    if (SOLID.has(tile) && !MAY_BE_SOLID.has(object.type)) {
      errors.push(`${label} steht auf "${tile}" und ist damit nicht erreichbar.`);
    }

    // 6. Portalziele
    if (object.type === 'portal') {
      const target = byId.get(object.to);
      if (!target) {
        errors.push(`${label} zeigt auf unbekannte Karte "${object.to}".`);
      } else {
        const targetTile =
          target.rows[object.toY]?.[object.toX] !== undefined
            ? LEGEND[target.rows[object.toY][object.toX]]
            : 'void';
        if (SOLID.has(targetTile)) {
          errors.push(
            `${label} landet auf "${targetTile}" in "${object.to}" (${object.toX},${object.toY}).`,
          );
        }
      }
    }
  }

  // Hinweis: sehr kleine Karten sind meist ein Tippfehler.
  if (width < 6 || height < 4) {
    warnings.push(`${area.id}: ungewoehnlich klein (${width}x${height}).`);
  }
}

console.log(`Geprueft: ${areas.length} Karten\n`);

for (const warning of warnings) console.log(`HINWEIS  ${warning}`);
for (const error of errors) console.log(`FEHLER   ${error}`);

if (errors.length > 0) {
  console.log(`\n${errors.length} Fehler gefunden.`);
  process.exit(1);
}
console.log('Alle Karten in Ordnung.');
