/**
 * Miauport - Hafenstadt.
 *
 * Die groesste und lauteste Stadt des Spiels. Viel Wasser, viele Haeuser, viele
 * Leute mit Anliegen. Der Hafen ist bewusst breit gebaut, damit er nach etwas
 * aussieht, das man nicht in zwei Schritten durchquert.
 */

import type { AreaDef } from '../types';

export const MIAUPORT_AREAS: AreaDef[] = [
  {
    id: 'miauport_hafen',
    region: 'miauport',
    name: 'Miauport',
    rows: [
      '##############################',
      '#............................#',
      '#..RRRRR.......RRRRR.........#',
      '#..XXDXX.......XXDXX.........#',
      '#....-...........-...........#',
      '#....-------------...........#',
      '#............-...............#',
      '#............-...............#',
      '#..RRRRRR....-.......bb......#',
      '#..XXXDXX....-...............#',
      '-.....-......-...............#',
      '#.....--------...............#',
      '#............-...............#',
      '#............-...............#',
      '#....ssssssssssssssssss......#',
      '#....ssssssssssssssssss......#',
      '#....~~~~~~~=====~~~~~~......#',
      '#....~~~~~~~=====~~~~~~......#',
      '#....WWWWWWW=====WWWWWW......#',
      '#....WWWWWWWWWWWWWWWWWW......#',
      '##############################',
    ],
    objects: [
      { type: 'portal', x: 0, y: 10, to: 'kratzfels_tiefe', toX: 26, toY: 18, facing: 'left' },
      { type: 'portal', x: 5, y: 3, to: 'miauport_taverne', toX: 8, toY: 10, facing: 'up', transition: 'door' },
      { type: 'portal', x: 17, y: 3, to: 'miauport_markt', toX: 8, toY: 10, facing: 'up', transition: 'door' },
      { type: 'portal', x: 6, y: 9, to: 'miauport_haus', toX: 6, toY: 7, facing: 'up', transition: 'door' },

      // Am Ende des Stegs: links geht es hinunter in die Hoehle, rechts legt
      // Kapitaenin Welle ab.
      {
        type: 'portal',
        x: 13,
        y: 18,
        to: 'miauport_hoehle',
        toX: 14,
        toY: 1,
        facing: 'down',
        lockedUnless: { flag: 'schluck_geruecht_gehoert' },
        lockedText: 'Unter dem Steg fuehrt ein Gang ins Dunkle. Wozu, weiss hier niemand.',
      },
      {
        type: 'portal',
        x: 15,
        y: 18,
        to: 'mondsee_ufer',
        toX: 2,
        toY: 2,
        facing: 'down',
        lockedUnless: { flag: 'ueberfahrt_bezahlt' },
        lockedText: 'Welles Schiff liegt fest vertaut. Ohne sie faehrt es nirgendwohin.',
      },

      { type: 'trigger', id: 'miauport_ankunft', x: 2, y: 9, w: 4, h: 3, script: 'miauport_ankunft', once: true },

      { type: 'npc', npc: 'kapitaenin_welle', x: 15, y: 15, facing: 'down' },
      { type: 'npc', npc: 'fischerin_salz', x: 9, y: 14, facing: 'right' },
      { type: 'npc', npc: 'schmuggler_knopf', x: 25, y: 12, wander: true },

      { type: 'enemy', enemy: 'hafenratte', x: 24, y: 6, leash: 5 },
      { type: 'enemy', enemy: 'hafenratte', x: 24, y: 13, leash: 5 },
      { type: 'enemy', enemy: 'salzgeist', x: 26, y: 3, leash: 6 },

      { type: 'save', x: 15, y: 12 },
      {
        type: 'sign',
        x: 12,
        y: 14,
        text: [
          'MIAUPORT - HAFEN',
          'Abfahrten nach: Mondsee (derzeit nicht)',
          'Gruende: siehe Kapitaenin',
        ],
      },
      {
        type: 'chest',
        id: 'hafen_chest_1',
        x: 26,
        y: 8,
        contents: [
          { item: 'sardinendose', count: 2 },
          { item: 'coins', count: 30 },
        ],
      },
      { type: 'pickup', id: 'hafen_pickup_1', x: 3, y: 17, item: 'tagebuchseite', hidden: true },
    ],
  },

  {
    id: 'miauport_taverne',
    region: 'miauport',
    name: 'Zum nassen Fell',
    indoor: true,
    ambientAlpha: 0.15,
    rows: [
      'XXXXXwXXXXXXXXXX',
      'X______________X',
      'X__uuuuuuu_____X',
      'X______________X',
      'X__tt____tt____X',
      'X__tt____tt____X',
      'X______________X',
      'X__tt____tt____X',
      'X__tt____tt____X',
      'X______________X',
      'XXXXXXXXDXXXXXXX',
    ],
    objects: [
      { type: 'npc', npc: 'wirt_schluck', x: 5, y: 3, facing: 'down' },
      { type: 'npc', npc: 'schmuggler_knopf', x: 12, y: 8, facing: 'left', showIf: { flag: 'knopf_gestellt' } },
      {
        type: 'sign',
        x: 13,
        y: 4,
        text: [
          'Eine Tafel mit Hausregeln.',
          'Regel 1: Keine Geschichten ueber die Koenigin.',
          'Regel 2: Regel 1 gilt nach dem dritten Krug nicht mehr.',
        ],
      },
      { type: 'portal', x: 8, y: 10, to: 'miauport_hafen', toX: 5, toY: 4, facing: 'down', transition: 'door' },
    ],
  },

  {
    id: 'miauport_markt',
    region: 'miauport',
    name: 'Markthalle',
    indoor: true,
    rows: [
      'XXXXXwXXXXXXXXXX',
      'X______________X',
      'X__uuuuuuuuu___X',
      'X______________X',
      'X__tt_____tt___X',
      'X__tt_____tt___X',
      'X______________X',
      'X______________X',
      'X______________X',
      'X______________X',
      'XXXXXXXXDXXXXXXX',
    ],
    objects: [
      { type: 'npc', npc: 'haendler_kork', x: 6, y: 3, facing: 'down' },
      {
        type: 'chest',
        id: 'markt_chest_1',
        x: 13,
        y: 8,
        contents: [{ item: 'schuppenhalsband', count: 1 }],
        requiresItem: 'schmugglerschluessel',
      },
      {
        type: 'sign',
        x: 2,
        y: 6,
        text: ['"Alles frisch aus dem Meer!"', 'Darunter, kleiner: "Meer nicht garantiert."'],
      },
      { type: 'portal', x: 8, y: 10, to: 'miauport_hafen', toX: 17, toY: 4, facing: 'down', transition: 'door' },
    ],
  },

  {
    id: 'miauport_haus',
    region: 'miauport',
    name: 'Salz\' Kate',
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
      {
        type: 'sign',
        x: 10,
        y: 6,
        text: [
          'Ein leeres Netz haengt an der Wand.',
          'Daneben eine Strichliste. Sehr viele Striche.',
          'Der letzte ist durchgestrichen.',
        ],
      },
      {
        type: 'chest',
        id: 'salz_chest_1',
        x: 2,
        y: 5,
        contents: [{ item: 'heilmilch', count: 2 }],
        showIf: { questState: 'q_fischvorrat', state: 'completed' },
      },
      { type: 'portal', x: 6, y: 7, to: 'miauport_hafen', toX: 6, toY: 10, facing: 'down', transition: 'door' },
    ],
  },

  {
    id: 'miauport_hoehle',
    region: 'miauport',
    name: 'Schmugglerhoehle',
    ambientAlpha: 0.45,
    music: 'dungeon',
    rows: [
      '##############-###############',
      '#.............-..............#',
      '#.............-..............#',
      '#....---------...............#',
      '#....-.......................#',
      '#....-...####.......####.....#',
      '#....-...####.......####.....#',
      '#....-.......................#',
      '#....-.......................#',
      '#....----------------........#',
      '#...................-........#',
      '#....####...........-...####.#',
      '#....####...........-...####.#',
      '#...................-........#',
      '#...................-........#',
      '#.......~~~~~~~~....-........#',
      '#.......~~~~~~~~....-........#',
      '#.......~~~~~~~~....-........#',
      '#...................-........#',
      '##############################',
    ],
    objects: [
      { type: 'portal', x: 14, y: 0, to: 'miauport_hafen', toX: 14, toY: 17, facing: 'up' },

      // Drei Laternen - die dritte liegt hinter dem Wasser
      { type: 'torch', id: 'hoehle_laterne_1', x: 7, y: 4, puzzle: 'miauport_schmuggler' },
      { type: 'torch', id: 'hoehle_laterne_2', x: 22, y: 8, puzzle: 'miauport_schmuggler' },
      { type: 'torch', id: 'hoehle_laterne_3', x: 4, y: 17, puzzle: 'miauport_schmuggler' },

      {
        type: 'gate',
        id: 'hoehle_tor',
        x: 20,
        y: 18,
        puzzle: 'miauport_schmuggler',
        orientation: 'h',
      },
      {
        type: 'portal',
        x: 26,
        y: 18,
        to: 'miauport_hoehle_tief',
        toX: 14,
        toY: 1,
        facing: 'down',
        lockedUnless: { puzzleSolved: 'miauport_schmuggler' },
        lockedText: 'Ohne Licht ist der Gang nicht zu finden.',
      },

      {
        type: 'chest',
        id: 'hoehle_chest_1',
        x: 26,
        y: 5,
        contents: [{ item: 'fischvorrat', count: 1 }],
      },
      {
        type: 'chest',
        id: 'hoehle_chest_2',
        x: 12,
        y: 12,
        contents: [
          { item: 'coins', count: 60 },
          { item: 'heilmilch', count: 1 },
        ],
      },

      { type: 'enemy', enemy: 'hafenratte', x: 16, y: 4, leash: 6 },
      { type: 'enemy', enemy: 'hafenratte', x: 8, y: 13, leash: 6 },
      { type: 'enemy', enemy: 'salzgeist', x: 24, y: 13, leash: 7 },
      { type: 'enemy', enemy: 'salzgeist', x: 3, y: 8, leash: 6 },

      { type: 'save', x: 18, y: 10 },
      {
        type: 'sign',
        x: 10,
        y: 10,
        text: [
          'Mit Kreide an den Fels geschrieben:',
          '"Drei Lichter, dann der Weg."',
          'Jemand hat darunter gekritzelt: "Vier waeren sicherer."',
        ],
      },
      { type: 'pickup', id: 'hoehle_pickup_1', x: 24, y: 16, item: 'seelenfunke', hidden: true },
    ],
  },

  {
    id: 'miauport_hoehle_tief',
    region: 'miauport',
    name: 'Die Untiefe',
    ambientAlpha: 0.5,
    music: 'dungeon',
    rows: [
      '##############-###############',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '#.............-..............#',
      '##############################',
    ],
    objects: [
      { type: 'portal', x: 14, y: 0, to: 'miauport_hoehle', toX: 26, toY: 17, facing: 'up' },

      { type: 'valve', id: 'untiefe_ventil', x: 4, y: 4, puzzle: 'miauport_flut', level: 0 },

      { type: 'trigger', id: 'tiefenkralle_erwacht', x: 11, y: 8, w: 8, h: 4, script: 'tiefenkralle_erwacht', once: true },

      {
        type: 'chest',
        id: 'untiefe_chest_1',
        x: 25,
        y: 16,
        contents: [
          { item: 'coins', count: 120 },
          { item: 'herzscherbe', count: 1 },
        ],
        showIf: { bossDefeated: 'tiefenkralle' },
      },
      { type: 'save', x: 17, y: 3, showIf: { bossDefeated: 'tiefenkralle' } },
      {
        type: 'sign',
        x: 6,
        y: 4,
        text: [
          'Ein Ventil, halb verrostet.',
          'Daneben eine Skala mit drei Markierungen.',
          'Die mittlere ist blank gewetzt.',
        ],
      },
    ],
  },
];
