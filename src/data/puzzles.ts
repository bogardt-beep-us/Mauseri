/**
 * Raetseldefinitionen.
 *
 * Ein Raetsel besteht aus Elementen auf der Karte (Schalter, Druckplatten,
 * Bloecke, Fackeln, Spiegel, Ventile, Runensteine) und einer Regel, wann es
 * geloest ist. Die Regel steht hier, die Elemente in der Kartendatei - so
 * lassen sich Raetsel umbauen, ohne Spielcode zu aendern.
 *
 * `hint` ist Pookies Hinweis. Er nennt bewusst nie die Loesung, sondern die
 * Frage, die man sich stellen muss.
 */

import type { AreaId, Effect } from './types';

export type PuzzleKind =
  /** Alle zugehoerigen Elemente muessen gleichzeitig aktiv sein. */
  | 'allOn'
  /** Elemente muessen in der angegebenen Symbolreihenfolge ausgeloest werden. */
  | 'sequence'
  /** Der Wasserstand muss den Zielwert erreichen. */
  | 'valveLevel'
  /** Alle Spiegel muessen die vorgegebene Ausrichtung haben. */
  | 'mirrorPath'
  /** Auf jeder Druckplatte muss ein Block stehen. */
  | 'blocksOnPlates';

export interface PuzzleDef {
  id: string;
  area: AreaId;
  kind: PuzzleKind;
  name: string;
  /** Pookies Hinweis - eine Frage, keine Loesung. */
  hint: string;
  /** Reihenfolge der Symbole (nur bei 'sequence'). */
  sequence?: string[];
  /** Zielwert (nur bei 'valveLevel'). */
  targetLevel?: number;
  /** Zielwinkel je Spiegel-ID (nur bei 'mirrorPath'), in Achtelschritten. */
  mirrorAngles?: Record<string, number>;
  /** Was beim Loesen passiert. */
  rewards?: Effect[];
  /** Text, der beim Loesen erscheint. */
  solvedText?: string;
}

export const PUZZLES: Record<string, PuzzleDef> = {
  // --- Schnurrwald --------------------------------------------------------
  schnurrwald_schreine: {
    id: 'schnurrwald_schreine',
    area: 'schnurrwald_lichtung',
    kind: 'allOn',
    name: 'Die drei Schreine',
    hint: 'Drei Schreine, drei Fackeln. Aber eine brennt aus, sobald du dich entfernst - warum wohl?',
    rewards: [{ toast: 'Der Nebel auf der Lichtung lichtet sich.', kind: 'info' }],
    solvedText: 'Die Schreine leuchten gemeinsam auf. Etwas gibt nach.',
  },

  schnurrwald_reihenfolge: {
    id: 'schnurrwald_reihenfolge',
    area: 'schnurrwald_tiefe',
    kind: 'sequence',
    name: 'Die Ordnung der Steine',
    sequence: ['I', 'II', 'III', 'IV'],
    hint: 'Die Steine tragen Zeichen. Der Schrein am Eingang trug dieselben - in welcher Reihenfolge standen sie dort?',
    solvedText: 'Ein tiefer Ton geht durch den Wald. Der Weg ist frei.',
  },

  // --- Kratzfels ----------------------------------------------------------
  kratzfels_mine: {
    id: 'kratzfels_mine',
    area: 'kratzfels_mine',
    kind: 'blocksOnPlates',
    name: 'Die Loren der alten Mine',
    hint: 'Die Platten sind fuer Gewicht gemacht, nicht fuer Pfoten. Was steht hier sonst noch herum?',
    solvedText: 'Es knirscht - und das Gitter zur Tiefe hebt sich.',
    // Der Minenschluessel kommt von Stoll; hier waere er doppelt.
    rewards: [{ giveCoins: 40 }],
  },

  kratzfels_schmelze: {
    id: 'kratzfels_schmelze',
    area: 'kratzfels_tiefe',
    kind: 'sequence',
    name: 'Die Schmelzfolge',
    sequence: ['1', '2', '3'],
    hint: 'Ambra sagte, Metall wird von aussen nach innen heiss. Gilt das auch fuer Schalter?',
    solvedText: 'Die Glut ordnet sich. Eine Tuer im Fels gibt nach.',
  },

  // --- Miauport -----------------------------------------------------------
  miauport_schmuggler: {
    id: 'miauport_schmuggler',
    area: 'miauport_hoehle',
    kind: 'allOn',
    name: 'Die drei Laternen',
    hint: 'Schmuggler markieren ihre Wege. Drei Laternen, aber nur zwei brennen - wo ist die dritte?',
    solvedText: 'Die Laternen zeigen den Weg durch die Untiefen.',
    rewards: [{ setFlag: 'schluck_bestaetigt' }],
  },

  miauport_flut: {
    id: 'miauport_flut',
    area: 'miauport_hoehle_tief',
    kind: 'valveLevel',
    targetLevel: 2,
    name: 'Der Wasserstand',
    hint: 'Zu wenig Wasser, und du kommst nicht drueber. Zu viel, und du kommst nicht durch. Was liegt dazwischen?',
    solvedText: 'Das Wasser sinkt. Auf dem Grund liegt etwas, das lange niemand gesehen hat.',
    rewards: [
      { giveItem: 'tagebuchseite' },
      { giveCoins: 60 },
    ],
  },

  // --- Mondsee ------------------------------------------------------------
  mondsee_spiegel: {
    id: 'mondsee_spiegel',
    area: 'mondsee_ruine',
    kind: 'mirrorPath',
    name: 'Das Mondlicht',
    mirrorAngles: { m1: 2, m2: 4, m3: 6 },
    hint: 'Das Licht kommt von oben und will nach unten. Ein Spiegel allein schafft das nicht.',
    solvedText: 'Der Mondstrahl trifft den Altar. Etwas oeffnet sich.',
  },

  mondsee_wasserstand: {
    id: 'mondsee_wasserstand',
    area: 'mondsee_schleuse',
    kind: 'valveLevel',
    targetLevel: 1,
    name: 'Die Schleuse',
    hint: 'Tropf sagte, der See sei frueher hoeher gewesen. Und dann?',
    solvedText: 'Der Wasserweg zur Insel liegt frei.',
    rewards: [{ setFlag: 'mondsee_faehre_frei' }],
  },

  // --- Schattenlande ------------------------------------------------------
  schattenlande_licht: {
    id: 'schattenlande_licht',
    area: 'schattenlande_dorf',
    kind: 'allOn',
    name: 'Was noch brennt',
    hint: 'In einem toten Dorf brennt kein Feuer von allein. Aber es gibt Reste.',
    solvedText: 'Vier Feuer brennen. Zum ersten Mal seit langem.',
    rewards: [{ setFlag: 'ascha_wahrheit' }],
  },

  schattenlande_runen: {
    id: 'schattenlande_runen',
    area: 'schattenlande_ruine',
    kind: 'sequence',
    name: 'Nyxaras Runen',
    sequence: ['A', 'B', 'C', 'D'],
    hint: 'Vier Runen, vier Worte. Folio hatte ein Buch, in dem sie standen - in welcher Ordnung?',
    solvedText: 'Die Runen erloeschen der Reihe nach. Der Weg zum Schloss ist offen.',
  },

  // --- Schloss Nyxara -----------------------------------------------------
  schloss_bibliothek: {
    id: 'schloss_bibliothek',
    area: 'schloss_bibliothek',
    kind: 'blocksOnPlates',
    name: 'Die Ordnung der Baende',
    hint: 'Ein Bibliothekar sortiert nicht nach Groesse. Aber wonach dann?',
    solvedText: 'Ein Regal dreht sich zur Seite.',
  },

  schloss_spiegelkammer: {
    id: 'schloss_spiegelkammer',
    area: 'schloss_spiegel',
    kind: 'mirrorPath',
    name: 'Die Spiegelkammer',
    mirrorAngles: { s1: 1, s2: 3, s3: 5, s4: 7 },
    hint: 'Jeder Spiegel zeigt dich anders. Nur einer zeigt dich richtig - aber alle muessen mitspielen.',
    solvedText: 'Zum ersten Mal siehst du in allen vier Spiegeln dasselbe.',
    rewards: [{ giveItem: 'thronschluessel' }],
  },

  schloss_kerker: {
    id: 'schloss_kerker',
    area: 'schloss_kerker',
    kind: 'sequence',
    name: 'Das Schloss der Zellen',
    sequence: ['III', 'I', 'IV', 'II'],
    hint: 'Mira hat die Zahlen in die Wand gekratzt. Aber sie hat sie nicht der Reihe nach gekratzt.',
    solvedText: 'Die Zellentuer springt auf.',
    rewards: [{ setFlag: 'mira_befreit' }],
  },
};

export function getPuzzle(id: string): PuzzleDef | undefined {
  return PUZZLES[id];
}

/** Alle Raetsel einer Karte. */
export function puzzlesForArea(area: AreaId): PuzzleDef[] {
  return Object.values(PUZZLES).filter((p) => p.area === area);
}
