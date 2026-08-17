/**
 * Kratzfels - Bergstadt, Minen und die Tiefe.
 *
 * Hier bekommt der Spieler den ersten Absatz zu sehen, den er ohne Kratzsprung
 * nicht ueberwinden kann, und das erste Raetsel, das Gewicht statt Schalter
 * verlangt. Die Region ist enger gebaut als der Wald - Fels statt Weite.
 */

import type { AreaDef } from '../types';

export const KRATZFELS_AREAS: AreaDef[] = [
  {
    id: 'kratzfels_pass',
    region: 'kratzfels',
    name: 'Bergpass',
    rows: [
      '######################',
      '#....................#',
      '#..####........####..#',
      '#..####........####..#',
      '#....................#',
      '#.....jjjj...........#',
      '#....................#',
      '#..####........####..#',
      '#..####........####..#',
      '#....................#',
      '#.......^^^^^........#',
      '#....................#',
      '#..##................#',
      '#..##................#',
      '#....................#',
      '#....................#',
      '#....................#',
      '#....................#',
      '-....................#',
      '#..........-.........#',
      '####################-#',
    ],
    objects: [
      { type: 'portal', x: 0, y: 18, to: 'schnurrwald_lichtung', toX: 23, toY: 17, facing: 'left' },
      { type: 'portal', x: 11, y: 19, to: 'kratzfels_stadt', toX: 15, toY: 20, facing: 'up' },

      { type: 'trigger', id: 'kratzfels_ankunft', x: 9, y: 16, w: 5, h: 3, script: 'kratzfels_ankunft', once: true },

      { type: 'enemy', enemy: 'hoehlenkrabbler', x: 8, y: 9, leash: 6 },
      { type: 'enemy', enemy: 'hoehlenkrabbler', x: 16, y: 14, leash: 6 },
      { type: 'enemy', enemy: 'nebelpfote', x: 18, y: 5, leash: 5 },

      // Hinter dem Absatz - nur mit Kratzsprung erreichbar
      {
        type: 'chest',
        id: 'pass_chest_1',
        x: 7,
        y: 3,
        contents: [
          { item: 'seelenfunke', count: 1 },
          { item: 'coins', count: 40 },
        ],
      },
      {
        type: 'sign',
        x: 9,
        y: 6,
        text: [
          'Der Fels bricht hier senkrecht ab.',
          'Ein geuebter Sprung koennte reichen.',
          'Pookie sieht das anders.',
        ],
      },
      { type: 'save', x: 14, y: 17 },
    ],
  },

  {
    id: 'kratzfels_stadt',
    region: 'kratzfels',
    name: 'Kratzfels',
    rows: [
      '##############################',
      '#............................#',
      '#..RRRRR..........RRRRR......#',
      '#..XXDXX..........XXDXX......#',
      '#....-..............-........#',
      '#....----------------........#',
      '#...........-................#',
      '#...........-................#',
      '#....##.....-.........##.....#',
      '#....##.....-.........##.....#',
      '#...........-................#',
      '#..RRRRRR...-....RRRRRR......#',
      '#..XXXDXX...-....XXXDXX......#',
      '#.....-.....-......-.........#',
      '#.....-------------..........#',
      '#...........-................#',
      '#...........-................#',
      '#....bb.....-.......bb.......#',
      '#...........-................#',
      '#...........-................#',
      '#...........-................#',
      '#############-################',
    ],
    objects: [
      { type: 'portal', x: 13, y: 21, to: 'kratzfels_pass', toX: 11, toY: 18, facing: 'down' },

      // Gebaeude
      { type: 'portal', x: 5, y: 3, to: 'kratzfels_schmiede', toX: 6, toY: 8, facing: 'up', transition: 'door' },
      { type: 'portal', x: 20, y: 3, to: 'kratzfels_arena', toX: 12, toY: 17, facing: 'up', transition: 'door' },
      {
        type: 'portal',
        x: 6,
        y: 12,
        to: 'kratzfels_mine',
        toX: 4,
        toY: 1,
        facing: 'up',
        transition: 'stairs',
        lockedUnless: { hasItem: 'minenschluessel' },
        lockedText: 'Ein schweres Gitter. Stoll hat den Schluessel.',
      },
      { type: 'portal', x: 20, y: 12, to: 'kratzfels_haus', toX: 6, toY: 7, facing: 'up', transition: 'door' },

      { type: 'npc', npc: 'bergmann_stoll', x: 10, y: 17, wander: true },
      { type: 'npc', npc: 'arenameister_grimm', x: 22, y: 5, facing: 'down' },
      { type: 'npc', npc: 'haendler_kork', x: 17, y: 16, facing: 'down', showIf: { flag: 'kapitel_4' } },

      { type: 'save', x: 14, y: 7 },
      {
        type: 'sign',
        x: 9,
        y: 13,
        text: [
          'KRATZFELS',
          'Gegruendet von denen, die keinen besseren Stein fanden.',
          'Und geblieben, weil es keinen besseren gab.',
        ],
      },
      {
        type: 'chest',
        id: 'kratzfels_chest_1',
        x: 26,
        y: 19,
        contents: [{ item: 'coins', count: 35 }],
        hidden: true,
      },
      { type: 'pickup', id: 'kratzfels_pickup_1', x: 3, y: 6, item: 'tagebuchseite', hidden: true },
    ],
  },

  {
    id: 'kratzfels_schmiede',
    region: 'kratzfels',
    name: 'Ambras Schmiede',
    indoor: true,
    ambientAlpha: 0.12,
    rows: [
      'XXXXXwXXXXXXX',
      'X___________X',
      'X__uuuuu____X',
      'X___________X',
      'X_______tt__X',
      'X_______tt__X',
      'X___________X',
      'X___________X',
      'XXXXXXDXXXXXX',
    ],
    objects: [
      { type: 'npc', npc: 'schmiedin_ambra', x: 4, y: 3, facing: 'down' },
      {
        type: 'sign',
        x: 11,
        y: 2,
        text: ['An der Wand haengen Werkzeuge in perfekter Ordnung.', 'Eines fehlt. Der Haken ist leer.'],
      },
      { type: 'portal', x: 6, y: 8, to: 'kratzfels_stadt', toX: 5, toY: 4, facing: 'down', transition: 'door' },
    ],
  },

  {
    id: 'kratzfels_haus',
    region: 'kratzfels',
    name: 'Stolls Kammer',
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
        type: 'chest',
        id: 'stoll_chest_1',
        x: 10,
        y: 6,
        contents: [
          { item: 'tagebuchseite', count: 1 },
          { item: 'heilmilch', count: 1 },
        ],
      },
      {
        type: 'sign',
        x: 2,
        y: 5,
        text: [
          'Auf dem Tisch liegt ein Brief, halb geschrieben.',
          '"Ambra, ich wollte es dir sagen. Ich wollte es wirklich."',
          'Der Rest ist durchgestrichen.',
        ],
      },
      { type: 'portal', x: 6, y: 7, to: 'kratzfels_stadt', toX: 19, toY: 13, facing: 'down', transition: 'door' },
    ],
  },

  {
    id: 'kratzfels_arena',
    region: 'kratzfels',
    name: 'Die Kampfstaette',
    music: 'dungeon',
    rows: [
      '#########################',
      '#.......................#',
      '#.#####...........#####.#',
      '#.#####...........#####.#',
      '#.......................#',
      '#.......................#',
      '#.......................#',
      '#.......................#',
      '#.......................#',
      '#.......................#',
      '#.......................#',
      '#.......................#',
      '#.......................#',
      '#.......................#',
      '#.#####...........#####.#',
      '#.#####...........#####.#',
      '#.......................#',
      '#...........D...........#',
      '#########################',
    ],
    objects: [
      { type: 'portal', x: 12, y: 17, to: 'kratzfels_stadt', toX: 20, toY: 4, facing: 'down', transition: 'door' },
      { type: 'npc', npc: 'arenameister_grimm', x: 12, y: 16, facing: 'up' },

      // Drei Runden - die Gegner erscheinen gestaffelt ueber Bedingungen
      { type: 'enemy', enemy: 'steinbeisser', x: 12, y: 6, id: 'arena_1', permanent: true, leash: 12, showIf: { flag: 'arena_gestartet' } },
      { type: 'enemy', enemy: 'hoehlenkrabbler', x: 7, y: 9, id: 'arena_2', permanent: true, leash: 12, showIf: { flag: 'arena_gestartet' } },
      { type: 'enemy', enemy: 'hoehlenkrabbler', x: 17, y: 9, id: 'arena_3', permanent: true, leash: 12, showIf: { flag: 'arena_gestartet' } },
      { type: 'enemy', enemy: 'steinbeisser', x: 9, y: 12, id: 'arena_4', permanent: true, leash: 12, showIf: { flag: 'arena_gestartet' } },
      { type: 'enemy', enemy: 'steinbeisser', x: 15, y: 12, id: 'arena_5', permanent: true, leash: 12, showIf: { flag: 'arena_gestartet' } },

      {
        type: 'chest',
        id: 'arena_chest_1',
        x: 12,
        y: 3,
        contents: [{ item: 'herzscherbe', count: 1 }],
        showIf: { flag: 'arena_gewonnen' },
      },
    ],
  },

  {
    id: 'kratzfels_mine',
    region: 'kratzfels',
    name: 'Die alte Mine',
    ambientAlpha: 0.4,
    music: 'dungeon',
    rows: [
      '####-####################',
      '#...-...................#',
      '#...-...................#',
      '#...--------............#',
      '#..........-............#',
      '#..#####...-...#####....#',
      '#..#####...-...#####....#',
      '#..........-............#',
      '#..........-............#',
      '#..........-............#',
      '#....ooo...-...ooo......#',
      '#..........-............#',
      '#..........-............#',
      '#..#####...-...#####....#',
      '#..#####...-...#####....#',
      '#..........-............#',
      '#..........--------.....#',
      '#.................-.....#',
      '#.................-.....#',
      '#########################',
    ],
    objects: [
      { type: 'portal', x: 4, y: 0, to: 'kratzfels_stadt', toX: 6, toY: 13, facing: 'up', transition: 'stairs' },

      // Bloecke auf Druckplatten - Gewicht statt Pfoten
      { type: 'block', id: 'mine_block_1', x: 8, y: 8 },
      { type: 'block', id: 'mine_block_2', x: 14, y: 8 },
      { type: 'block', id: 'mine_block_3', x: 11, y: 12 },

      { type: 'plate', id: 'mine_platte_1', x: 6, y: 4, puzzle: 'kratzfels_mine' },
      { type: 'plate', id: 'mine_platte_2', x: 18, y: 4, puzzle: 'kratzfels_mine' },
      { type: 'plate', id: 'mine_platte_3', x: 12, y: 15, puzzle: 'kratzfels_mine' },

      {
        type: 'gate',
        id: 'mine_tor',
        x: 18,
        y: 16,
        puzzle: 'kratzfels_mine',
        orientation: 'h',
      },
      {
        type: 'portal',
        x: 18,
        y: 18,
        to: 'kratzfels_tiefe',
        toX: 12,
        toY: 1,
        facing: 'down',
        transition: 'stairs',
        lockedUnless: { puzzleSolved: 'kratzfels_mine' },
        lockedText: 'Das Gitter zur Tiefe ist verschlossen.',
      },

      { type: 'enemy', enemy: 'hoehlenkrabbler', x: 16, y: 11, leash: 6 },
      { type: 'enemy', enemy: 'hoehlenkrabbler', x: 6, y: 17, leash: 6 },
      { type: 'enemy', enemy: 'steinbeisser', x: 20, y: 8, leash: 5 },

      {
        type: 'sign',
        x: 12,
        y: 9,
        text: [
          'Eingeritzt, von einer sehr ungeduldigen Pfote:',
          '"Die Platten wollen Gewicht. Ich wiege nicht genug."',
          '"Und ja, ich hab mich draufgestellt. Dreimal."',
        ],
      },
      { type: 'save', x: 9, y: 17 },
      { type: 'pickup', id: 'mine_pickup_1', x: 22, y: 12, item: 'mondsplitter', hidden: true },
    ],
  },

  {
    id: 'kratzfels_tiefe',
    region: 'kratzfels',
    name: 'Die Grube',
    ambientAlpha: 0.48,
    music: 'dungeon',
    rows: [
      '########################-#####',
      '#.......................-....#',
      '#.......................-....#',
      '#........----------------....#',
      '#........-...................#',
      '#........-...................#',
      '#........-...................#',
      '#........-...................#',
      '#........-...................#',
      '#........-...................#',
      '#........-...................#',
      '#........-...................#',
      '#........-...................#',
      '#........-...................#',
      '#........-...................#',
      '#........-...................#',
      '#........-...................#',
      '#........-...................#',
      '#........-...................#',
      '##############################',
    ],
    objects: [
      { type: 'portal', x: 24, y: 0, to: 'kratzfels_mine', toX: 18, toY: 17, facing: 'up', transition: 'stairs' },

      { type: 'trigger', id: 'kratzfels_tiefe_erreicht', x: 12, y: 6, w: 8, h: 4, script: 'grubenherz_erwacht', once: true },

      { type: 'switch', id: 'tiefe_schalter_1', x: 4, y: 8, puzzle: 'kratzfels_schmelze', symbol: '1' },
      { type: 'switch', id: 'tiefe_schalter_2', x: 4, y: 12, puzzle: 'kratzfels_schmelze', symbol: '2' },
      { type: 'switch', id: 'tiefe_schalter_3', x: 4, y: 16, puzzle: 'kratzfels_schmelze', symbol: '3' },

      {
        type: 'chest',
        id: 'tiefe_belohnung',
        x: 26,
        y: 16,
        contents: [
          { item: 'eisenkralle', count: 1 },
          { item: 'coins', count: 80 },
        ],
        showIf: { puzzleSolved: 'kratzfels_schmelze' },
      },

      { type: 'save', x: 26, y: 2 },
      {
        type: 'portal',
        x: 27,
        y: 18,
        to: 'miauport_hafen',
        toX: 3,
        toY: 10,
        facing: 'right',
        lockedUnless: { bossDefeated: 'grubenherz' },
        lockedText: 'Der Weg nach Osten ist verschuettet. Etwas haelt ihn zu.',
      },
    ],
  },
];
