/**
 * Mondsee - die mystische Region.
 *
 * Hier kippt die Geschichte: aus "etwas stimmt nicht" wird "jemand hat das
 * getan, und zwar mit Absicht". Optisch uebernehmen Blau und Violett, das
 * Umgebungslicht wird deutlich dunkler.
 */

import type { AreaDef } from '../types';

export const MONDSEE_AREAS: AreaDef[] = [
  {
    id: 'mondsee_ufer',
    region: 'mondsee',
    name: 'Am Mondsee',
    ambientAlpha: 0.28,
    rows: [
      '##############################',
      '-............................#',
      '#............................#',
      '#....TT..............TT......#',
      '#............................#',
      '#............................#',
      '#....ssssssssssssssssss......#',
      '#....~~~~~~~~~~~~~~~~~~......#',
      '#....~~~~~pppp~~~~~~~~~......#',
      '#....~~~~~pppp~~~~~~~~~......#',
      '#....~~~~~~~~~~~~~~~~~~......#',
      '#....WWWWWWWWWWWWWWWWWW......#',
      '#....WWWWWWWWWWWWWWWWWW......#',
      '#....~~~~~~~~~~~~~~~~~~......#',
      '#....ssssssssssssssssss......#',
      '#............................#',
      '#....TT..............TT......#',
      '#............-...............#',
      '#............-...............#',
      '#############-################',
    ],
    objects: [
      { type: 'portal', x: 0, y: 1, to: 'miauport_hafen', toX: 14, toY: 17, facing: 'left' },
      { type: 'portal', x: 13, y: 19, to: 'mondsee_schleuse', toX: 12, toY: 1, facing: 'down' },

      { type: 'trigger', id: 'mondsee_ankunft', x: 2, y: 2, w: 5, h: 3, script: 'mondsee_ankunft', once: true },

      { type: 'npc', npc: 'seherin_luna', x: 24, y: 9, facing: 'left' },
      { type: 'npc', npc: 'faehrmann_tropf', x: 8, y: 15, facing: 'down' },

      {
        type: 'portal',
        x: 11,
        y: 8,
        to: 'mondsee_ruine',
        toX: 15,
        toY: 18,
        facing: 'up',
        lockedUnless: { flag: 'mondsee_faehre_frei' },
        lockedText: 'Die Seerosen tragen nicht. Der Wasserstand ist zu hoch.',
      },

      { type: 'enemy', enemy: 'seeschemen', x: 25, y: 5, leash: 6 },
      { type: 'enemy', enemy: 'mondwoelkchen', x: 3, y: 12, leash: 6 },
      { type: 'enemy', enemy: 'seeschemen', x: 26, y: 17, leash: 6 },

      { type: 'save', x: 20, y: 3 },
      {
        type: 'sign',
        x: 6,
        y: 5,
        text: [
          'MONDSEE',
          'Der See spiegelt den Himmel.',
          'Jemand hat "nicht mehr" dazugeschrieben.',
        ],
      },
      {
        type: 'chest',
        id: 'ufer_chest_1',
        x: 27,
        y: 12,
        contents: [{ item: 'mondbeere', count: 3 }],
      },
      { type: 'pickup', id: 'ufer_pickup_1', x: 2, y: 17, item: 'tagebuchseite', hidden: true },
    ],
  },

  {
    id: 'mondsee_schleuse',
    region: 'mondsee',
    name: 'Die Schleuse',
    ambientAlpha: 0.32,
    music: 'dungeon',
    rows: [
      '############-#################',
      '#...........-................#',
      '#...........-................#',
      '#...........-................#',
      '#....#########################',
      '#....#.......................#',
      '#....#...####.......####.....#',
      '#....#...####.......####.....#',
      '#....#.......................#',
      '#....#.......................#',
      '#....#....~~~~~~~~~~~........#',
      '#....#....~~~~~~~~~~~........#',
      '#....#....~~~~~~~~~~~........#',
      '#....#.......................#',
      '#....#...####.......####.....#',
      '#....#...####.......####.....#',
      '#....#.......................#',
      '#....#.......................#',
      '#....#.......................#',
      '##############################',
    ],
    objects: [
      { type: 'portal', x: 12, y: 0, to: 'mondsee_ufer', toX: 13, toY: 18, facing: 'up' },

      { type: 'valve', id: 'schleuse_ventil', x: 2, y: 10, puzzle: 'mondsee_wasserstand', level: 3 },

      { type: 'enemy', enemy: 'seeschemen', x: 22, y: 5, leash: 6 },
      { type: 'enemy', enemy: 'mondwoelkchen', x: 15, y: 17, leash: 6 },
      { type: 'enemy', enemy: 'mondwoelkchen', x: 25, y: 12, leash: 6 },

      {
        type: 'chest',
        id: 'schleuse_chest_1',
        x: 26,
        y: 17,
        contents: [
          { item: 'seekarte', count: 1 },
          { item: 'coins', count: 55 },
        ],
      },
      {
        type: 'sign',
        x: 2,
        y: 12,
        text: [
          'Eine Skala am Ventil:',
          '0 - trocken   1 - Seerosen tragen',
          '2 - Bootstiefe   3 - Hochwasser',
        ],
      },
      { type: 'save', x: 8, y: 3 },
      { type: 'pickup', id: 'schleuse_pickup_1', x: 27, y: 5, item: 'mondsplitter', hidden: true },
    ],
  },

  {
    id: 'mondsee_ruine',
    region: 'mondsee',
    name: 'Die Inselruine',
    ambientAlpha: 0.36,
    music: 'dungeon',
    rows: [
      '##############################',
      '#............................#',
      '#....++................++....#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#....########..########......#',
      '#....#................#......#',
      '#....#................#......#',
      '#....#................#......#',
      '#....#................#......#',
      '#....#................#......#',
      '#....########..########......#',
      '#............................#',
      '#............................#',
      '#....++................++....#',
      '#............................#',
      '#............................#',
      '#..............-.............#',
      '##############################',
    ],
    objects: [
      { type: 'portal', x: 15, y: 18, to: 'mondsee_ufer', toX: 11, toY: 9, facing: 'down' },

      // Spiegelraetsel: das Mondlicht muss auf den Altar in der Mitte
      { type: 'mirror', id: 'm1', x: 8, y: 4, puzzle: 'mondsee_spiegel', angle: 0 },
      { type: 'mirror', id: 'm2', x: 21, y: 8, puzzle: 'mondsee_spiegel', angle: 0 },
      { type: 'mirror', id: 'm3', x: 8, y: 14, puzzle: 'mondsee_spiegel', angle: 0 },

      { type: 'trigger', id: 'spiegelkatze_erwacht', x: 12, y: 8, w: 6, h: 4, script: 'spiegelkatze_erwacht', once: true, showIf: { puzzleSolved: 'mondsee_spiegel' } },

      { type: 'npc', npc: 'seherin_luna', x: 25, y: 3, facing: 'down', showIf: { bossDefeated: 'spiegelkatze' } },

      { type: 'enemy', enemy: 'seeschemen', x: 3, y: 8, leash: 5 },
      { type: 'enemy', enemy: 'mondwoelkchen', x: 26, y: 14, leash: 5 },

      {
        type: 'chest',
        id: 'ruine_chest_1',
        x: 15,
        y: 3,
        contents: [
          { item: 'mondstahlkralle', count: 1 },
          { item: 'coins', count: 100 },
        ],
        showIf: { bossDefeated: 'spiegelkatze' },
      },
      {
        type: 'sign',
        x: 14,
        y: 16,
        text: [
          'Auf dem Altarstein, in einer aelteren Schrift:',
          '"Der Mond luegt nicht. Spiegel schon."',
        ],
      },
      { type: 'save', x: 18, y: 16 },
      {
        type: 'portal',
        x: 27,
        y: 2,
        to: 'schattenlande_pfad',
        // Ankunft im Norden: von dort laeuft man nach Sueden und trifft erst
        // die Ankunftsszene, dann die Trennung. Kam man unten an, lief die
        // Trennung vor der Ankunft.
        toX: 14,
        toY: 1,
        facing: 'up',
        lockedUnless: { bossDefeated: 'spiegelkatze' },
        lockedText: 'Der Weg nach Norden liegt hinter dem Spiegel.',
      },
    ],
  },
];
