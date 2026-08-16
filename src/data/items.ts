/**
 * Gegenstaende.
 *
 * Kategorien: heal (verbrauchbar), quest (Questgegenstand), key (Schluessel),
 * equip (Ausruestung), special (Sammelstueck / Geheimnis).
 */

import type { ItemDef } from './types';

export const ITEMS: Record<string, ItemDef> = {
  // --- Heilung ------------------------------------------------------------
  fischkeks: {
    id: 'fischkeks',
    name: 'Fischkeks',
    description: 'Hart gebacken, riecht streng, wirkt zuverlaessig. Stellt 20 Leben wieder her.',
    category: 'heal',
    healAmount: 20,
    value: 8,
    stackable: true,
    icon: 'biscuit',
    color: 0xe8b96a,
  },
  mondbeere: {
    id: 'mondbeere',
    name: 'Mondbeere',
    description: 'Waechst nur bei Nacht. Stellt 15 Energie wieder her.',
    category: 'heal',
    energyAmount: 15,
    value: 12,
    stackable: true,
    icon: 'berry',
    color: 0x8a6ad0,
  },
  heilmilch: {
    id: 'heilmilch',
    name: 'Heilmilch',
    description: 'Warm, mit einem Loeffel Honig. Stellt 45 Leben und 10 Energie wieder her.',
    category: 'heal',
    healAmount: 45,
    energyAmount: 10,
    value: 24,
    stackable: true,
    icon: 'milk',
    color: 0xfff0d2,
  },
  sardinendose: {
    id: 'sardinendose',
    name: 'Sardinendose',
    description: 'Miauports Grundnahrungsmittel. Stellt 30 Leben wieder her.',
    category: 'heal',
    healAmount: 30,
    value: 16,
    stackable: true,
    icon: 'fish',
    color: 0x9ec8e0,
  },

  // --- Ausruestung --------------------------------------------------------
  lederkralle: {
    id: 'lederkralle',
    name: 'Lederkralle',
    description: 'Ein Ueberzug aus gehaertetem Leder. Angriff +3.',
    category: 'equip',
    equip: { attack: 3 },
    value: 40,
    icon: 'claw',
    color: 0x9a6a3a,
  },
  eisenkralle: {
    id: 'eisenkralle',
    name: 'Eisenkralle',
    description: 'In Kratzfels geschmiedet. Angriff +7.',
    category: 'equip',
    equip: { attack: 7 },
    value: 110,
    icon: 'claw',
    color: 0xb8c0cc,
  },
  mondstahlkralle: {
    id: 'mondstahlkralle',
    name: 'Mondstahlkralle',
    description: 'Metall, das im Dunkeln heller wird. Angriff +12.',
    category: 'equip',
    equip: { attack: 12 },
    value: 260,
    icon: 'claw',
    color: 0xbfe0ff,
  },
  stoffhalsband: {
    id: 'stoffhalsband',
    name: 'Stoffhalsband',
    description: 'Weich und unauffaellig. Verteidigung +2.',
    category: 'equip',
    equip: { defense: 2 },
    value: 35,
    icon: 'collar',
    color: 0xc75f4a,
  },
  schuppenhalsband: {
    id: 'schuppenhalsband',
    name: 'Schuppenhalsband',
    description: 'Aus den Schuppen eines Hafenfisches. Verteidigung +5.',
    category: 'equip',
    equip: { defense: 5 },
    value: 130,
    icon: 'collar',
    color: 0x4f86a8,
  },
  nachthalsband: {
    id: 'nachthalsband',
    name: 'Nachthalsband',
    description: 'Es wiegt nichts und schuetzt trotzdem. Verteidigung +9.',
    category: 'equip',
    equip: { defense: 9 },
    value: 280,
    icon: 'collar',
    color: 0x6a5c8c,
  },

  // --- Schluessel ---------------------------------------------------------
  scheunenschluessel: {
    id: 'scheunenschluessel',
    name: 'Scheunenschluessel',
    description: 'Oeffnet die alte Scheune am Dorfrand von Miezlingen.',
    category: 'key',
    icon: 'key',
    color: 0xb08850,
  },
  minenschluessel: {
    id: 'minenschluessel',
    name: 'Minenschluessel',
    description: 'Schwer und rostig. Oeffnet das Gitter zur Tiefe von Kratzfels.',
    category: 'key',
    icon: 'key',
    color: 0x9a8a78,
  },
  schmugglerschluessel: {
    id: 'schmugglerschluessel',
    name: 'Schmugglerschluessel',
    description: 'Hat drei Baerte. Zwei davon sind falsch.',
    category: 'key',
    icon: 'key',
    color: 0x6a8a9a,
  },
  ruinenschluessel: {
    id: 'ruinenschluessel',
    name: 'Ruinenschluessel',
    description: 'Aelter als jede Tuer, die heute noch steht.',
    category: 'key',
    icon: 'key',
    color: 0x8a7cb0,
  },
  thronschluessel: {
    id: 'thronschluessel',
    name: 'Schluessel des Thronsaals',
    description: 'Kalt. Er wird nicht waermer, egal wie lange man ihn haelt.',
    category: 'key',
    icon: 'key',
    color: 0xffd98a,
  },

  // --- Questgegenstaende --------------------------------------------------
  brotlaib: {
    id: 'brotlaib',
    name: 'Frischer Brotlaib',
    description: 'Noch warm. Baecker Brummel hat ihn dreimal umgedreht, bevor er ihn hergab.',
    category: 'quest',
    icon: 'biscuit',
    color: 0xd8a860,
  },
  fischvorrat: {
    id: 'fischvorrat',
    name: 'Gestohlener Fischvorrat',
    description: 'Der Wochenbedarf einer ganzen Hafengasse, in ein Netz gewickelt.',
    category: 'quest',
    icon: 'fish',
    color: 0x7fb8d8,
  },
  gluecksbringer: {
    id: 'gluecksbringer',
    name: 'Zerbrochener Gluecksbringer',
    description: 'Eine Haelfte einer Muschel. Die andere fehlt.',
    category: 'quest',
    icon: 'shard',
    color: 0xe0c8a0,
  },
  laterne: {
    id: 'laterne',
    name: 'Nebellaterne',
    description: 'Ihr Licht durchdringt den Nebel des Schnurrwalds - ein wenig zumindest.',
    category: 'quest',
    icon: 'lantern',
    color: 0xffd98a,
  },
  seekarte: {
    id: 'seekarte',
    name: 'Alte Seekarte',
    description: 'Zeigt den Mondsee, wie er vor hundert Jahren aussah. Vieles stimmt noch.',
    category: 'quest',
    icon: 'map',
    color: 0xe0d0a8,
  },
  spielzeugmaus: {
    id: 'spielzeugmaus',
    name: 'Spielzeugmaus',
    description: 'Abgewetzt, ein Ohr fehlt. Fuer irgendjemanden ist sie alles.',
    category: 'quest',
    icon: 'bone',
    color: 0xc8b8a0,
  },
  glockenherz: {
    id: 'glockenherz',
    name: 'Glockenherz',
    description: 'Der Kloeppel der alten Dorfglocke. Ohne ihn schweigt Miezlingen.',
    category: 'quest',
    icon: 'bell',
    color: 0xd8b060,
  },

  // --- Besonderes / Geheimnisse -------------------------------------------
  mondsplitter: {
    id: 'mondsplitter',
    name: 'Mondsplitter',
    description:
      'Ein Bruchstueck von etwas sehr Altem. Es ist warm, obwohl es das nicht sein sollte.',
    category: 'special',
    stackable: true,
    icon: 'shard',
    color: 0xbfe0ff,
  },
  herzscherbe: {
    id: 'herzscherbe',
    name: 'Herzscherbe',
    description: 'Erhoeht die maximalen Lebenspunkte dauerhaft.',
    category: 'special',
    stackable: true,
    icon: 'heart',
    color: 0xff6a8a,
  },
  seelenfunke: {
    id: 'seelenfunke',
    name: 'Seelenfunke',
    description: 'Erhoeht die maximale Energie dauerhaft.',
    category: 'special',
    stackable: true,
    icon: 'star',
    color: 0x8fe08a,
  },
  tagebuchseite: {
    id: 'tagebuchseite',
    name: 'Tagebuchseite',
    description:
      'Eine einzelne Seite aus einer sehr alten Handschrift. Wer alle findet, kennt die ganze Geschichte.',
    category: 'special',
    stackable: true,
    icon: 'scroll',
    color: 0xe8d8b0,
  },
  nachtherz: {
    id: 'nachtherz',
    name: 'Das Herz der Nacht',
    description: 'Es schlaegt. Sehr langsam, aber es schlaegt.',
    category: 'special',
    icon: 'gem',
    color: 0x8a4ad0,
  },
};

export function getItem(id: string): ItemDef | undefined {
  return ITEMS[id];
}

/** Reihenfolge der Kategorien im Inventar. */
export const CATEGORY_ORDER: ItemDef['category'][] = ['heal', 'equip', 'key', 'quest', 'special'];

export const CATEGORY_LABEL: Record<ItemDef['category'], string> = {
  heal: 'Verbrauch',
  equip: 'Ausruestung',
  key: 'Schluessel',
  quest: 'Quest',
  special: 'Besonderes',
};
