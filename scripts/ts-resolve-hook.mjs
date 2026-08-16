/**
 * Modul-Aufloesung fuer die Pruefskripte.
 *
 * Die Quelldateien sind fuer einen Bundler geschrieben und importieren ohne
 * Dateiendung ("./npcs" statt "./npcs.ts"). Node verlangt die Endung. Dieser
 * Hook ergaenzt sie und loest ausserdem den Alias "@/" auf src/ auf, damit die
 * Skripte dieselben Dateien lesen koennen wie das Spiel - ohne Build-Schritt.
 */

import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

export async function resolve(specifier, context, nextResolve) {
  // Alias "@/..." -> src/...
  if (specifier.startsWith('@/')) {
    const ziel = join(SRC, specifier.slice(2));
    for (const suffix of ['.ts', '.tsx', '/index.ts', '']) {
      try {
        return await nextResolve(pathToFileURL(ziel + suffix).href, context);
      } catch {
        // naechste Variante versuchen
      }
    }
  }

  try {
    return await nextResolve(specifier, context);
  } catch (fehler) {
    if (specifier.startsWith('.')) {
      for (const suffix of ['.ts', '.tsx', '/index.ts']) {
        try {
          return await nextResolve(specifier + suffix, context);
        } catch {
          // naechste Variante versuchen
        }
      }
    }
    throw fehler;
  }
}
