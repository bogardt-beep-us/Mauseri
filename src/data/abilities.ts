/**
 * Mauseris Faehigkeiten.
 *
 * Entwurfsregel aus dem Konzept: jede Faehigkeit muss in mindestens zwei der
 * drei Bereiche Kampf, Raetsel und Erkundung etwas tun. Deshalb steht bei jeder
 * ausdruecklich dabei, was sie ausserhalb des Kampfes bewirkt - das ist der
 * Grund, warum fruehere Gebiete spaeter wieder interessant werden.
 */

import type { AbilityDef, AbilityId } from './types';

export const ABILITIES: Record<AbilityId, AbilityDef> = {
  kratzsprung: {
    id: 'kratzsprung',
    name: 'Kratzsprung',
    description:
      'Ein kurzer, kraftvoller Satz nach vorn. Ueberwindet Absaetze und bringt dich aus der Gefahrenzone.',
    worldUse: 'Springt ueber Felsabsaetze und schmale Spalten.',
    energyCost: 6,
    cooldownMs: 900,
    icon: 'feather',
    color: 0x8fe08a,
  },

  schattenpfote: {
    id: 'schattenpfote',
    name: 'Schattenpfote',
    description:
      'Mauseri wird fuer kurze Zeit selbst zu Schatten. Angriffe gehen durch dich hindurch.',
    worldUse: 'Durchquert Schattenfelder, die sonst undurchdringlich sind.',
    energyCost: 12,
    cooldownMs: 6000,
    icon: 'shard',
    color: 0xa77fd8,
  },

  schnurrimpuls: {
    id: 'schnurrimpuls',
    name: 'Schnurrimpuls',
    description:
      'Ein tiefes Schnurren, das durch Stein geht. Was sich versteckt, antwortet darauf.',
    worldUse: 'Macht verborgene Truhen, Gegenstaende und Geheimwege sichtbar.',
    energyCost: 8,
    cooldownMs: 2500,
    icon: 'bell',
    color: 0x7fd8ff,
  },

  katzenflink: {
    id: 'katzenflink',
    name: 'Katzenflink',
    description: 'Vier Sekunden, in denen niemand schneller ist als du.',
    worldUse: 'Ueberquert rutschiges Eis und einbrechende Boeden, bevor sie nachgeben.',
    energyCost: 10,
    cooldownMs: 7000,
    icon: 'star',
    color: 0xffd98a,
  },

  mondkralle: {
    id: 'mondkralle',
    name: 'Mondkralle',
    description:
      'Die naechsten drei Angriffe tragen das Licht des Mondes - und treffen, was sonst unberuehrbar ist.',
    worldUse: 'Zerschlaegt verdorbene Barrieren und bricht die Schilde der Wachen.',
    energyCost: 16,
    cooldownMs: 9000,
    icon: 'claw',
    color: 0xbfe0ff,
  },
};

/** Reihenfolge, in der die Faehigkeiten im Spielverlauf erworben werden. */
export const ABILITY_ORDER: AbilityId[] = [
  'kratzsprung',
  'schnurrimpuls',
  'katzenflink',
  'schattenpfote',
  'mondkralle',
];
