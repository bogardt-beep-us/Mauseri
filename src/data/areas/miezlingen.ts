/**
 * Miezlingen - das Startdorf.
 *
 * Karten werden als ASCII geschrieben (Legende in tiles.ts). Alle Zeilen einer
 * Karte muessen gleich lang sein; kuerzere werden beim Aufbau aufgefuellt, aber
 * das Pruefskript (npm run check:maps) meldet solche Faelle.
 */

import type { AreaDef } from '../types';

export const MIEZLINGEN_AREAS: AreaDef[] = [
  // =========================================================================
  // Mauseris Zuhause
  // =========================================================================
  {
    id: 'miezlingen_home',
    region: 'miezlingen',
    name: 'Mauseris Zuhause',
    indoor: true,
    rows: [
      'XXXXwXXXXXXwXXXX',
      'X______________X',
      'X__tt_______cc_X',
      'X__tt_______cc_X',
      'X______________X',
      'X_u____________X',
      'X______________X',
      'X______________X',
      'X______________X',
      'XXXXXXXDXXXXXXXX',
    ],
    objects: [
      { type: 'npc', npc: 'mutter_lina', x: 11, y: 4, facing: 'down' },
      { type: 'trigger', id: 'prolog_aufwachen', x: 5, y: 5, w: 3, h: 3, script: 'prolog_aufwachen', once: true },
      {
        type: 'chest',
        id: 'home_chest_1',
        x: 2,
        y: 8,
        contents: [{ item: 'fischkeks', count: 2 }],
      },
      { type: 'sign', x: 13, y: 5, text: ['Ein Regal voller Muscheln.', 'Mauseri sammelt sie, seit sie laufen kann.'] },
      { type: 'portal', x: 7, y: 9, to: 'miezlingen_dorf', toX: 5, toY: 4, facing: 'down', transition: 'door' },
    ],
  },

  // =========================================================================
  // Dorfplatz
  // =========================================================================
  {
    id: 'miezlingen_dorf',
    region: 'miezlingen',
    name: 'Miezlingen',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T............................T',
      'T..RRRRR..........RRRRR......T',
      'T..XXDXX..........XXDXX......T',
      'T....-..............-........T',
      'T....-..............-........T',
      'T....----------------........T',
      'T...........-................T',
      'T.ff........-................T',
      'T...........-.....ff.........T',
      'T..RRRRR....-.....RRRRR......T',
      'T..XXDXX....-.....XXDXX......T',
      'T....----------------........T',
      'T...........-................T',
      'T...........-................T',
      'T....bb.....-................T',
      'T...........-................T',
      'T...........-................T',
      'T...........-................T',
      'Tnnnnnnnnnnn-nnnnnnnnnnnnnnnnT',
      'T...........-................T',
      'TTTTTTTTTTTT-TTTTTTTTTTTTTTTTT',
    ],
    objects: [
      // Gebaeude-Eingaenge
      { type: 'portal', x: 5, y: 3, to: 'miezlingen_home', toX: 7, toY: 8, facing: 'up', transition: 'door' },
      { type: 'portal', x: 20, y: 3, to: 'miezlingen_baeckerei', toX: 5, toY: 6, facing: 'up', transition: 'door' },
      { type: 'portal', x: 5, y: 11, to: 'miezlingen_laden', toX: 6, toY: 7, facing: 'up', transition: 'door' },
      { type: 'portal', x: 20, y: 11, to: 'miezlingen_hetta', toX: 6, toY: 7, facing: 'up', transition: 'door' },

      // Ausgang nach Sueden
      {
        type: 'portal',
        x: 12,
        y: 21,
        to: 'miezlingen_rand',
        toX: 12,
        toY: 1,
        facing: 'down',
        lockedUnless: { flag: 'kapitel_2' },
        lockedText: 'Tobb steht im Weg. "Nicht bevor wir wissen, was da los ist."',
      },

      // Bewohner
      { type: 'npc', npc: 'wache_tobb', x: 12, y: 19, facing: 'down' },
      { type: 'npc', npc: 'fips', x: 8, y: 14, wander: true },
      { type: 'npc', npc: 'haendler_kork', x: 7, y: 13, facing: 'down' },
      { type: 'npc', npc: 'oma_hetta', x: 22, y: 13, wander: true },

      // Dorfmitte
      { type: 'save', x: 13, y: 8 },
      {
        type: 'sign',
        x: 11,
        y: 6,
        text: ['MIEZLINGEN', 'Einwohner: 41', 'Seit gestern: 40'],
      },

      // Geheimnis: hinter dem Zaun, nur mit Schnurrimpuls zu finden
      {
        type: 'pickup',
        id: 'miezlingen_secret_1',
        x: 2,
        y: 20,
        item: 'tagebuchseite',
        hidden: true,
      },
      {
        type: 'chest',
        id: 'miezlingen_chest_1',
        x: 26,
        y: 20,
        contents: [{ item: 'coins', count: 25 }],
        hidden: true,
      },

      // Story-Trigger
      {
        type: 'trigger',
        id: 'dorf_erstes_betreten',
        x: 5,
        y: 4,
        w: 2,
        h: 2,
        script: 'dorf_erstes_betreten',
        once: true,
      },
    ],
  },

  // =========================================================================
  // Baeckerei
  // =========================================================================
  {
    id: 'miezlingen_baeckerei',
    region: 'miezlingen',
    name: 'Brummels Baeckerei',
    indoor: true,
    rows: [
      'XXXXwXXXXXXXX',
      'X___________X',
      'X_uuuuu_____X',
      'X___________X',
      'X_______tt__X',
      'X_______tt__X',
      'X___________X',
      'XXXXXDXXXXXXX',
    ],
    objects: [
      { type: 'npc', npc: 'brummel', x: 3, y: 3, facing: 'down' },
      { type: 'sign', x: 10, y: 2, text: ['"Heute: Fischkekse."', '"Morgen: auch Fischkekse."'] },
      { type: 'portal', x: 5, y: 7, to: 'miezlingen_dorf', toX: 20, toY: 4, facing: 'down', transition: 'door' },
    ],
  },

  // =========================================================================
  // Korks Laden
  // =========================================================================
  {
    id: 'miezlingen_laden',
    region: 'miezlingen',
    name: 'Korks Laden',
    indoor: true,
    rows: [
      'XXXXXXwXXXXXX',
      'X___________X',
      'X__uuuuuuu__X',
      'X___________X',
      'X_tt____tt__X',
      'X_tt____tt__X',
      'X___________X',
      'XXXXXXDXXXXXX',
    ],
    objects: [
      { type: 'npc', npc: 'haendler_kork', x: 6, y: 3, facing: 'down' },
      {
        type: 'sign',
        x: 2,
        y: 3,
        text: [
          '"Waren aus aller Welt!"',
          'Darunter steht kleiner:',
          '"Und aus Miezlingen."',
        ],
      },
      { type: 'portal', x: 6, y: 7, to: 'miezlingen_dorf', toX: 5, toY: 12, facing: 'down', transition: 'door' },
    ],
  },

  // =========================================================================
  // Oma Hettas Haus
  // =========================================================================
  {
    id: 'miezlingen_hetta',
    region: 'miezlingen',
    name: 'Hettas Haus',
    indoor: true,
    rows: [
      'XXXXXXwXXXXXX',
      'X___________X',
      'X_cc________X',
      'X_cc____tt__X',
      'X_______tt__X',
      'X___________X',
      'X___________X',
      'XXXXXXDXXXXXX',
    ],
    objects: [
      { type: 'npc', npc: 'oma_hetta', x: 6, y: 3, facing: 'down' },
      {
        type: 'sign',
        x: 2,
        y: 5,
        text: [
          'An der Wand haengt eine Karte von Miaurien.',
          'Jemand hat mit Kohle Kreuze eingezeichnet.',
          'Die meisten sind durchgestrichen.',
        ],
      },
      {
        type: 'chest',
        id: 'hetta_chest_1',
        x: 10,
        y: 6,
        contents: [{ item: 'heilmilch', count: 1 }],
        requiresItem: 'glockenherz',
      },
      { type: 'portal', x: 6, y: 7, to: 'miezlingen_dorf', toX: 20, toY: 12, facing: 'down', transition: 'door' },
    ],
  },

  // =========================================================================
  // Dorfrand - erste Route, erster Kampf
  // =========================================================================
  {
    id: 'miezlingen_rand',
    region: 'miezlingen',
    name: 'Am Dorfrand',
    rows: [
      'TTTTTTTTTTTT-TTTTTTTTTTTTTTTTT',
      'TT..........-...............TT',
      'T...........-................T',
      'T..bb.......-.......bb.......T',
      'T...........----------.......T',
      'T....................-.......T',
      'T..TT................-..TT...T',
      'T..TT................-..TT...T',
      'T....................-.......T',
      'T.......~~~~~........-.......T',
      'T......~~~~~~~.......-.......T',
      'T......=======.......-.......T',
      'T......~~~~~~~.......-.......T',
      'T.......~~~~~........-.......T',
      'T....................-.......T',
      'T..RRRRRR............-.......T',
      'T..XXXDXX............-.......T',
      'T....................-.......T',
      'T..bb................-..bb...T',
      'T....................-.......T',
      'TTTTTTTTTTTTTTTTTTTTT-TTTTTTTT',
    ],
    objects: [
      { type: 'portal', x: 12, y: 0, to: 'miezlingen_dorf', toX: 12, toY: 20, facing: 'up' },
      {
        type: 'portal',
        x: 21,
        y: 20,
        to: 'schnurrwald_eingang',
        toX: 14,
        toY: 1,
        facing: 'down',
      },
      {
        type: 'portal',
        x: 6,
        y: 16,
        to: 'miezlingen_scheune',
        toX: 6,
        toY: 8,
        facing: 'up',
        transition: 'door',
        lockedUnless: { hasItem: 'scheunenschluessel' },
        lockedText: 'Die Scheune ist abgeschlossen.',
      },

      // Erster Kampf - bewusst einzeln und langsam
      {
        type: 'trigger',
        id: 'tutorial_kampf',
        x: 12,
        y: 4,
        w: 3,
        h: 2,
        script: 'tutorial_kampf',
        once: true,
      },
      { type: 'enemy', enemy: 'nebelpfote', x: 15, y: 6, permanent: true, id: 'rand_feind_1', leash: 6 },
      { type: 'enemy', enemy: 'nebelpfote', x: 18, y: 12, leash: 5 },
      { type: 'enemy', enemy: 'waldspinne', x: 8, y: 18, leash: 4 },

      { type: 'npc', npc: 'foerster_bork', x: 22, y: 8, facing: 'left' },

      { type: 'sign', x: 20, y: 19, text: ['Nach Sueden: Schnurrwald.', 'Jemand hat daruntergekritzelt:', '"Nicht bei Nacht."'] },

      {
        type: 'chest',
        id: 'rand_chest_1',
        x: 6,
        y: 6,
        contents: [{ item: 'fischkeks', count: 2 }, { item: 'coins', count: 15 }],
      },
      {
        type: 'pickup',
        id: 'rand_pickup_1',
        x: 4,
        y: 12,
        item: 'herzscherbe',
        hidden: true,
      },
      { type: 'save', x: 22, y: 4 },
    ],
  },

  // =========================================================================
  // Die alte Scheune - kleines Nebenraetsel
  // =========================================================================
  {
    id: 'miezlingen_scheune',
    region: 'miezlingen',
    name: 'Die alte Scheune',
    indoor: true,
    ambientAlpha: 0.25,
    rows: [
      'XXXXXXXXXXXXX',
      'X___________X',
      'X__r_____r__X',
      'X___________X',
      'X_____r_____X',
      'X___________X',
      'X__r_____r__X',
      'X___________X',
      'XXXXXXDXXXXXX',
    ],
    objects: [
      { type: 'npc', npc: 'verschwundener_murr', x: 6, y: 2, facing: 'down' },
      {
        type: 'chest',
        id: 'scheune_chest_1',
        x: 10,
        y: 4,
        contents: [{ item: 'glockenherz', count: 1 }],
      },
      {
        type: 'pickup',
        id: 'scheune_pickup_1',
        x: 2,
        y: 7,
        item: 'spielzeugmaus',
      },
      { type: 'portal', x: 6, y: 8, to: 'miezlingen_rand', toX: 6, toY: 17, facing: 'down', transition: 'door' },
    ],
  },
];
