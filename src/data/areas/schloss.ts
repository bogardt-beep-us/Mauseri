/**
 * Schloss Nyxara - das Finale.
 *
 * Fuenf Bereiche: Halle (Verteiler), Bibliothek (Folio und die Tagebuchseiten),
 * Kerker (Mira), Spiegelkammer (Schluessel zum Thronsaal) und der Thronsaal.
 * Alles laeuft auf eine Konfrontation zu, die keine reine Kampfszene ist.
 */

import type { AreaDef } from '../types';

export const SCHLOSS_AREAS: AreaDef[] = [
  {
    id: 'schloss_halle',
    region: 'schloss',
    name: 'Die Eingangshalle',
    ambientAlpha: 0.34,
    music: 'castle',
    rows: [
      '##############################',
      '#............................#',
      '#....######........######....#',
      '#....#....#........#....#....#',
      '#....#....#........#....#....#',
      '#....#..D.#........#.D..#....#',
      '#....######........######....#',
      '#............................#',
      '#.......cccccccccccc.........#',
      '#.......cccccccccccc.........#',
      '#.......cccccccccccc.........#',
      '#.......cccccccccccc.........#',
      '#............................#',
      '#....######........######....#',
      '#....#....#........#....#....#',
      '#....#..D.#........#.D..#....#',
      '#....#....#........#....#....#',
      '#....######........######....#',
      '#..............-.............#',
      '##############################',
    ],
    objects: [
      { type: 'portal', x: 15, y: 18, to: 'schattenlande_ruine', toX: 3, toY: 4, facing: 'down' },

      { type: 'trigger', id: 'schloss_ankunft', x: 13, y: 16, w: 5, h: 3, script: 'schloss_ankunft', once: true },

      { type: 'portal', x: 8, y: 5, to: 'schloss_bibliothek', toX: 15, toY: 18, facing: 'up', transition: 'door' },
      { type: 'portal', x: 21, y: 5, to: 'schloss_kerker', toX: 15, toY: 18, facing: 'up', transition: 'door' },
      { type: 'portal', x: 8, y: 15, to: 'schloss_spiegel', toX: 15, toY: 18, facing: 'up', transition: 'door' },
      {
        type: 'portal',
        x: 21,
        y: 15,
        to: 'schloss_thron',
        toX: 15,
        toY: 18,
        facing: 'up',
        transition: 'door',
        lockedUnless: { hasItem: 'thronschluessel' },
        lockedText: 'Der Thronsaal ist verschlossen. Ein sehr kalter Schluessel fehlt.',
      },

      { type: 'enemy', enemy: 'schattenwache', x: 12, y: 3, leash: 6, permanent: true, id: 'halle_wache_1' },
      { type: 'enemy', enemy: 'schattenwache', x: 18, y: 16, leash: 6, permanent: true, id: 'halle_wache_2' },

      { type: 'save', x: 15, y: 15 },
      {
        type: 'sign',
        x: 14,
        y: 7,
        text: [
          'Vier Tueren. Ueber jeder ein Wappen.',
          'Buch. Ketten. Spiegel. Krone.',
          'Nur das letzte ist frisch poliert.',
        ],
      },
      { type: 'pickup', id: 'halle_geheim', x: 3, y: 10, item: 'tagebuchseite', hidden: true },
    ],
  },

  {
    id: 'schloss_bibliothek',
    region: 'schloss',
    name: 'Die Bibliothek',
    ambientAlpha: 0.3,
    music: 'castle',
    rows: [
      '##############################',
      '#............................#',
      '#..####..####..####..####....#',
      '#..####..####..####..####....#',
      '#............................#',
      '#............................#',
      '#..####..####..####..####....#',
      '#..####..####..####..####....#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#..####..####..####..####....#',
      '#..####..####..####..####....#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#..............-.............#',
      '##############################',
    ],
    objects: [
      { type: 'portal', x: 15, y: 18, to: 'schloss_halle', toX: 8, toY: 7, facing: 'down', transition: 'door' },

      { type: 'npc', npc: 'bibliothekar_folio', x: 15, y: 10, facing: 'down' },

      // Blockraetsel: Baende an ihren Platz zurueckstellen
      { type: 'block', id: 'bib_block_1', x: 9, y: 5 },
      { type: 'block', id: 'bib_block_2', x: 20, y: 5 },
      { type: 'block', id: 'bib_block_3', x: 9, y: 15 },

      { type: 'plate', id: 'bib_platte_1', x: 5, y: 9, puzzle: 'schloss_bibliothek' },
      { type: 'plate', id: 'bib_platte_2', x: 24, y: 9, puzzle: 'schloss_bibliothek' },
      { type: 'plate', id: 'bib_platte_3', x: 15, y: 16, puzzle: 'schloss_bibliothek' },

      {
        type: 'chest',
        id: 'bib_chest_1',
        x: 26,
        y: 16,
        contents: [
          { item: 'tagebuchseite', count: 1 },
          { item: 'heilmilch', count: 2 },
        ],
        showIf: { puzzleSolved: 'schloss_bibliothek' },
      },

      { type: 'enemy', enemy: 'spiegelscherbe', x: 5, y: 4, leash: 6 },
      { type: 'enemy', enemy: 'spiegelscherbe', x: 25, y: 14, leash: 6 },

      {
        type: 'sign',
        x: 15,
        y: 11,
        text: [
          'Ein aufgeschlagenes Buch auf dem Lesepult.',
          'Die Ueberschrift: "Ueber das Halten von Dingen,"',
          '"die nicht gehalten werden wollen."',
        ],
      },
      { type: 'save', x: 12, y: 16 },
      { type: 'pickup', id: 'bib_geheim', x: 27, y: 2, item: 'mondsplitter', hidden: true },
    ],
  },

  {
    id: 'schloss_kerker',
    region: 'schloss',
    name: 'Der Kerker',
    ambientAlpha: 0.5,
    music: 'dungeon',
    rows: [
      '##############################',
      '#............................#',
      '#..####..####..####..####....#',
      '#..#..#..#..#..#..#..#..#....#',
      '#..#..#..#..#..#..#..#..#....#',
      '#..####..####..####..####....#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#..####..####..####..####....#',
      '#..#..#..#..#..#..#..#..#....#',
      '#..#..#..#..#..#..#..#..#....#',
      '#..####..####..####..####....#',
      '#............................#',
      '#............................#',
      '#..............-.............#',
      '##############################',
    ],
    objects: [
      { type: 'portal', x: 15, y: 18, to: 'schloss_halle', toX: 21, toY: 7, facing: 'down', transition: 'door' },

      { type: 'npc', npc: 'gefangene_mira', x: 4, y: 4, facing: 'right' },

      // Zahlenfolge - Mira hat die Zahlen in die Wand gekratzt
      { type: 'rune', id: 'kerker_rune_1', x: 10, y: 8, puzzle: 'schloss_kerker', symbol: 'I' },
      { type: 'rune', id: 'kerker_rune_2', x: 14, y: 8, puzzle: 'schloss_kerker', symbol: 'II' },
      { type: 'rune', id: 'kerker_rune_3', x: 18, y: 8, puzzle: 'schloss_kerker', symbol: 'III' },
      { type: 'rune', id: 'kerker_rune_4', x: 22, y: 8, puzzle: 'schloss_kerker', symbol: 'IV' },

      {
        type: 'chest',
        id: 'kerker_chest_1',
        x: 26,
        y: 16,
        contents: [
          { item: 'nachthalsband', count: 1 },
          { item: 'coins', count: 90 },
        ],
        showIf: { puzzleSolved: 'schloss_kerker' },
      },

      { type: 'enemy', enemy: 'schattenwache', x: 20, y: 16, leash: 6, permanent: true, id: 'kerker_wache_1' },
      { type: 'enemy', enemy: 'spiegelscherbe', x: 6, y: 11, leash: 6 },

      {
        type: 'sign',
        x: 5,
        y: 7,
        text: [
          'In die Wand gekratzt, unregelmaessig tief:',
          'III   I   IV   II',
          'Darunter: "So, wie sie es mir vorgesagt hat."',
        ],
      },
      { type: 'save', x: 12, y: 16 },
    ],
  },

  {
    id: 'schloss_spiegel',
    region: 'schloss',
    name: 'Die Spiegelkammer',
    ambientAlpha: 0.28,
    music: 'castle',
    rows: [
      '##############################',
      '#............................#',
      '#............................#',
      '#....####........####........#',
      '#....####........####........#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#....####........####........#',
      '#....####........####........#',
      '#............................#',
      '#..............-.............#',
      '##############################',
    ],
    objects: [
      { type: 'portal', x: 15, y: 18, to: 'schloss_halle', toX: 8, toY: 16, facing: 'down', transition: 'door' },

      // Vier Spiegel, alle muessen stimmen
      { type: 'mirror', id: 's1', x: 8, y: 6, puzzle: 'schloss_spiegelkammer', angle: 0 },
      { type: 'mirror', id: 's2', x: 21, y: 6, puzzle: 'schloss_spiegelkammer', angle: 0 },
      { type: 'mirror', id: 's3', x: 8, y: 13, puzzle: 'schloss_spiegelkammer', angle: 0 },
      { type: 'mirror', id: 's4', x: 21, y: 13, puzzle: 'schloss_spiegelkammer', angle: 0 },

      { type: 'enemy', enemy: 'spiegelscherbe', x: 4, y: 9, leash: 7 },
      { type: 'enemy', enemy: 'spiegelscherbe', x: 25, y: 9, leash: 7 },
      { type: 'enemy', enemy: 'schattenwache', x: 15, y: 3, leash: 6, permanent: true, id: 'spiegel_wache' },

      {
        type: 'sign',
        x: 15,
        y: 12,
        text: [
          'Vier Spiegel, jeder zeigt dich anders.',
          'Im ersten bist du kleiner. Im zweiten aelter.',
          'Im dritten allein. Im vierten stimmt etwas nicht.',
        ],
      },
      { type: 'save', x: 12, y: 16 },
      { type: 'pickup', id: 'spiegel_geheim', x: 27, y: 2, item: 'tagebuchseite', hidden: true },
    ],
  },

  {
    id: 'schloss_thron',
    region: 'schloss',
    name: 'Der Thronsaal',
    ambientAlpha: 0.3,
    music: 'castle',
    rows: [
      '##############################',
      '#............................#',
      '#............................#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#..........cccccc............#',
      '#............................#',
      '#..............-.............#',
      '##############################',
    ],
    objects: [
      { type: 'portal', x: 15, y: 18, to: 'schloss_halle', toX: 21, toY: 16, facing: 'down', transition: 'door' },

      { type: 'trigger', id: 'finale', x: 12, y: 12, w: 7, h: 4, script: 'finale', once: true },

      // Nach dem Sieg: der Abschluss der Geschichte
      {
        type: 'trigger',
        id: 'abspann_ausloeser',
        x: 12,
        y: 6,
        w: 7,
        h: 4,
        script: 'abspann',
        once: true,
        showIf: {
          all: [{ bossDefeated: 'nyxara' }, { not: { secretsFound: 8 } }],
        },
      },
      {
        type: 'trigger',
        id: 'abspann_wahr_ausloeser',
        x: 12,
        y: 6,
        w: 7,
        h: 4,
        script: 'abspann_wahr',
        once: true,
        showIf: {
          all: [{ bossDefeated: 'nyxara' }, { secretsFound: 8 }],
        },
      },

      { type: 'save', x: 20, y: 16 },
      {
        type: 'sign',
        x: 9,
        y: 16,
        text: [
          'Der Teppich zum Thron ist ausgetreten.',
          'Nicht von vielen Fuessen.',
          'Von denselben, sehr oft.',
        ],
      },
    ],
  },
];
