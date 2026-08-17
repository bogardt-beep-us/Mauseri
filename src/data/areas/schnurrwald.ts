/**
 * Schnurrwald - der erste grosse Abschnitt.
 *
 * Aufbau: Eingang (ruhig) -> Pfad (erste echte Gegner) -> Schrein (Nebenquest)
 * -> Tiefe (Reihenfolge-Raetsel, Laterne) -> Lichtung (Schreinraetsel, Boss).
 * Der Wald wird von Karte zu Karte enger und dunkler.
 */

import type { AreaDef } from '../types';

export const SCHNURRWALD_AREAS: AreaDef[] = [
  {
    id: 'schnurrwald_eingang',
    region: 'schnurrwald',
    name: 'Waldrand',
    rows: [
      'TTTTTTTTTTTTTT-TTTTTTTTTTTTTTT',
      'T.............-..............T',
      'T..TT.........-.........TT...T',
      'T..TT.........-.........TT...T',
      'T.............-..............T',
      'T....bb.......-..............T',
      'T.............----------.....T',
      'T....................-.......T',
      'T..TT..TT............-..TT...T',
      'T..TT..TT............-..TT...T',
      'T....................-.......T',
      'T.......++...........-.......T',
      'T....................-.......T',
      'T..TT................-..TT...T',
      'T..TT................-..TT...T',
      'T....................-.......T',
      'T....bb..............-....bb.T',
      'T....................-.......T',
      'TTTTTTTTTTTTTTTTTTTTT-TTTTTTTT',
    ],
    objects: [
      { type: 'portal', x: 14, y: 0, to: 'miezlingen_rand', toX: 21, toY: 19, facing: 'up' },
      { type: 'portal', x: 21, y: 18, to: 'schnurrwald_pfad', toX: 14, toY: 1, facing: 'down' },

      // Volle Breite, damit die Szene nicht durch einen Bogen umgangen wird.
      { type: 'trigger', id: 'wald_eintritt', x: 1, y: 3, w: 28, h: 2, script: 'wald_eintritt', once: true },

      { type: 'npc', npc: 'einsiedler_moos', x: 6, y: 11, facing: 'right' },

      { type: 'enemy', enemy: 'nebelpfote', x: 10, y: 8, leash: 5 },
      { type: 'enemy', enemy: 'nebelpfote', x: 17, y: 14, leash: 5 },
      { type: 'enemy', enemy: 'waldspinne', x: 5, y: 16, leash: 4 },

      { type: 'save', x: 22, y: 6 },
      {
        type: 'sign',
        x: 8,
        y: 11,
        text: [
          'Ein alter Schrein. Die Inschrift ist verwittert.',
          'Nur vier Zeichen sind noch lesbar:',
          'I   II   III   IV',
        ],
      },
      {
        type: 'chest',
        id: 'wald_chest_1',
        x: 26,
        y: 10,
        contents: [
          { item: 'fischkeks', count: 2 },
          { item: 'coins', count: 20 },
        ],
      },
      { type: 'pickup', id: 'wald_pickup_1', x: 3, y: 6, item: 'tagebuchseite', hidden: true },
    ],
  },

  {
    id: 'schnurrwald_pfad',
    region: 'schnurrwald',
    name: 'Nebelpfad',
    ambientAlpha: 0.2,
    rows: [
      'TTTTTTTTTTTTTT-TTTTTTTTTTTTTTT',
      'T.............-..............T',
      'T..TTTT.......-......TTTT....T',
      'T..TTTT.......-......TTTT....T',
      'T.............-..............T',
      'T......--------..............T',
      'T......-.....................T',
      'T..TT..-..TTTT.......TTTT....T',
      'T..TT..-..TTTT.......TTTT....T',
      'T......-.....................T',
      'T......--------------........T',
      'T....................-.......T',
      'T..TTTT..............-..TT...T',
      'T..TTTT..............-..TT...T',
      'T....................-.......T',
      'T.....bb.............-.......T',
      'T....................-.......T',
      'T..TT................-...TT..T',
      'T....................-.......T',
      'TTTTTTTTTTTTTTTTTTTTT-TTTTTTTT',
    ],
    objects: [
      { type: 'portal', x: 14, y: 0, to: 'schnurrwald_eingang', toX: 21, toY: 17, facing: 'up' },
      { type: 'portal', x: 21, y: 19, to: 'schnurrwald_lichtung', toX: 14, toY: 18, facing: 'down' },
      { type: 'portal', x: 7, y: 6, to: 'schnurrwald_schrein', toX: 2, toY: 12, facing: 'left' },
      { type: 'portal', x: 7, y: 9, to: 'schnurrwald_tiefe', toX: 4, toY: 1, facing: 'down' },

      { type: 'enemy', enemy: 'dornenkatze', x: 16, y: 6, leash: 6 },
      { type: 'enemy', enemy: 'nebelpfote', x: 11, y: 11, leash: 5 },
      { type: 'enemy', enemy: 'nebelpfote', x: 24, y: 15, leash: 5 },
      { type: 'enemy', enemy: 'waldspinne', x: 5, y: 16, leash: 4 },
      { type: 'enemy', enemy: 'waldspinne', x: 26, y: 6, leash: 4 },

      {
        type: 'sign',
        x: 9,
        y: 4,
        text: [
          'Links: Alter Schrein.',
          'Geradeaus: Tiefer Wald.',
          'Der Wegweiser nach unten wurde abgebrochen.',
        ],
      },
      {
        type: 'chest',
        id: 'pfad_chest_1',
        x: 27,
        y: 11,
        contents: [{ item: 'mondbeere', count: 2 }],
      },
      { type: 'save', x: 19, y: 16 },
    ],
  },

  {
    id: 'schnurrwald_schrein',
    region: 'schnurrwald',
    name: 'Vergessener Schrein',
    ambientAlpha: 0.26,
    rows: [
      'TTTTTTTTTTTTTTTTTTTT',
      'T..................T',
      'T..TTTT......TTTT..T',
      'T..TTTT......TTTT..T',
      'T..................T',
      'T.....++..++.......T',
      'T..................T',
      'T........++........T',
      'T..................T',
      'T..TT..........TT..T',
      'T..TT..........TT..T',
      'T..................T',
      '-..................T',
      'T..................T',
      'TTTTTTTTTTTTTTTTTTTT',
    ],
    objects: [
      { type: 'portal', x: 0, y: 12, to: 'schnurrwald_pfad', toX: 8, toY: 6, facing: 'right' },

      { type: 'npc', npc: 'geist_taute', x: 9, y: 8, facing: 'down' },

      {
        type: 'chest',
        id: 'schrein_chest_1',
        x: 16,
        y: 6,
        contents: [{ item: 'gluecksbringer', count: 1 }],
      },
      {
        type: 'pickup',
        id: 'schrein_pickup_1',
        x: 3,
        y: 13,
        item: 'herzscherbe',
        hidden: true,
      },
      {
        type: 'sign',
        x: 9,
        y: 7,
        text: [
          'In den Stein geritzt, sehr sorgfaeltig:',
          '"Was zerbrochen wurde, war zu zweit."',
        ],
      },
      { type: 'enemy', enemy: 'waldspinne', x: 15, y: 12, leash: 5 },
    ],
  },

  {
    id: 'schnurrwald_tiefe',
    region: 'schnurrwald',
    name: 'Tiefer Wald',
    ambientAlpha: 0.34,
    rows: [
      'TTTT-TTTTTTTTTTTTTTTTTTTT',
      'T...-...................T',
      'T...-...................T',
      'T...--------............T',
      'T..........-............T',
      'T..TTTT....-....TTTT....T',
      'T..TTTT....-....TTTT....T',
      'T..........-............T',
      'T..........-............T',
      'T....%%%%%%%%%%%........T',
      'T..........-............T',
      'T..........-............T',
      'T..TT......-......TT....T',
      'T..........-............T',
      'T..........--------.....T',
      'T.................-.....T',
      'T.....bb..........-.....T',
      'T.................-.....T',
      'TTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    objects: [
      { type: 'portal', x: 4, y: 0, to: 'schnurrwald_pfad', toX: 7, toY: 10, facing: 'up' },

      // Reihenfolge-Raetsel: die Steine tragen die Zeichen vom Schrein am Waldrand
      { type: 'rune', id: 'tiefe_rune_1', x: 8, y: 4, puzzle: 'schnurrwald_reihenfolge', symbol: 'I' },
      { type: 'rune', id: 'tiefe_rune_2', x: 20, y: 4, puzzle: 'schnurrwald_reihenfolge', symbol: 'II' },
      { type: 'rune', id: 'tiefe_rune_3', x: 6, y: 13, puzzle: 'schnurrwald_reihenfolge', symbol: 'III' },
      { type: 'rune', id: 'tiefe_rune_4', x: 21, y: 13, puzzle: 'schnurrwald_reihenfolge', symbol: 'IV' },

      {
        type: 'gate',
        id: 'tiefe_tor',
        x: 18,
        y: 15,
        puzzle: 'schnurrwald_reihenfolge',
        orientation: 'h',
      },

      {
        type: 'chest',
        id: 'tiefe_chest_1',
        x: 18,
        y: 17,
        contents: [{ item: 'laterne', count: 1 }],
      },
      {
        type: 'chest',
        id: 'tiefe_chest_2',
        x: 3,
        y: 16,
        contents: [
          { item: 'coins', count: 45 },
          { item: 'heilmilch', count: 1 },
        ],
      },

      // Hinter dem Schattenfeld - erst mit Schattenpfote erreichbar.
      {
        type: 'pickup',
        id: 'tiefe_geheim_1',
        x: 16,
        y: 10,
        item: 'mondsplitter',
        hidden: true,
      },

      { type: 'enemy', enemy: 'dornenkatze', x: 13, y: 8, leash: 6 },
      { type: 'enemy', enemy: 'dornenkatze', x: 21, y: 16, leash: 5 },
      { type: 'enemy', enemy: 'waldspinne', x: 4, y: 11, leash: 4 },
      { type: 'enemy', enemy: 'nebelpfote', x: 16, y: 2, leash: 5 },

      {
        type: 'sign',
        x: 13,
        y: 12,
        text: [
          'Der Nebel steht hier so dicht, dass er fest wirkt.',
          'Pookie sagt, er sehe eine Katzengestalt darin.',
          'Sie bewegt sich nicht.',
        ],
      },
      { type: 'save', x: 12, y: 11 },
    ],
  },

  {
    id: 'schnurrwald_lichtung',
    region: 'schnurrwald',
    name: 'Die Lichtung',
    ambientAlpha: 0.18,
    music: 'dungeon',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T............................T',
      'T...TT..................TT...T',
      'T............................T',
      'T.......++........++.........T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T.......++........++.........T',
      'T............................T',
      'T...TT..................TT...T',
      'T............................T',
      'T............................T',
      'T............................T',
      'TTTTTTTTTTTTTT-TTTTTTTTTTTTTTT',
    ],
    objects: [
      { type: 'portal', x: 14, y: 19, to: 'schnurrwald_pfad', toX: 21, toY: 18, facing: 'up' },

      { type: 'trigger', id: 'lichtung_ankunft', x: 13, y: 17, w: 4, h: 2, script: 'lichtung_ankunft', once: true },

      // Drei Fackeln, die gemeinsam brennen muessen
      { type: 'torch', id: 'lichtung_fackel_1', x: 8, y: 5, puzzle: 'schnurrwald_schreine' },
      { type: 'torch', id: 'lichtung_fackel_2', x: 19, y: 5, puzzle: 'schnurrwald_schreine' },
      { type: 'torch', id: 'lichtung_fackel_3', x: 14, y: 12, puzzle: 'schnurrwald_schreine' },

      // Der Boss erwacht erst, wenn das Raetsel geloest ist.
      {
        type: 'trigger',
        id: 'dornenkater_erwacht',
        x: 12,
        y: 8,
        w: 6,
        h: 4,
        script: 'dornenkater_erwacht',
        once: true,
        showIf: { puzzleSolved: 'schnurrwald_schreine' },
      },

      {
        type: 'npc',
        npc: 'foerster_bork',
        x: 5,
        y: 17,
        facing: 'right',
        showIf: { bossDefeated: 'dornenkater' },
      },

      {
        type: 'chest',
        id: 'lichtung_chest_1',
        x: 25,
        y: 3,
        contents: [{ item: 'lederkralle', count: 1 }],
        showIf: { bossDefeated: 'dornenkater' },
      },
      { type: 'save', x: 17, y: 17 },
      {
        type: 'portal',
        x: 24,
        y: 17,
        to: 'kratzfels_pass',
        toX: 12,
        toY: 18,
        facing: 'right',
        lockedUnless: { bossDefeated: 'dornenkater' },
        lockedText: 'Dornenranken versperren den Weg nach Norden.',
      },
    ],
  },
];
