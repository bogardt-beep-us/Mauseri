/**
 * Alle Karten des Spiels.
 *
 * Die Regionen liegen in eigenen Dateien, damit eine einzelne Datei nicht
 * unuebersichtlich wird und mehrere Regionen unabhaengig bearbeitet werden
 * koennen.
 */

import type { AreaDef, AreaId } from '../types';
import { MIEZLINGEN_AREAS } from './miezlingen';
import { SCHNURRWALD_AREAS } from './schnurrwald';
import { KRATZFELS_AREAS } from './kratzfels';
import { MIAUPORT_AREAS } from './miauport';
import { MONDSEE_AREAS } from './mondsee';
import { SCHATTENLANDE_AREAS } from './schattenlande';
import { SCHLOSS_AREAS } from './schloss';

export const ALL_AREAS: AreaDef[] = [
  ...MIEZLINGEN_AREAS,
  ...SCHNURRWALD_AREAS,
  ...KRATZFELS_AREAS,
  ...MIAUPORT_AREAS,
  ...MONDSEE_AREAS,
  ...SCHATTENLANDE_AREAS,
  ...SCHLOSS_AREAS,
];

export const AREAS: Record<AreaId, AreaDef> = Object.fromEntries(
  ALL_AREAS.map((area) => [area.id, area]),
);

export function getArea(id: AreaId): AreaDef | undefined {
  return AREAS[id];
}
