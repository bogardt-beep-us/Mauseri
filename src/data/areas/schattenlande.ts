/**
 * Schattenlande - die verdorbene Region.
 *
 * Erzaehlerisch der Wendepunkt: hier werden Mauseri und Pookie getrennt, und
 * hier erfaehrt der Spieler zum ersten Mal, dass Nyxara nicht immer so war.
 * Farblich fast entsaettigt, Umgebungslicht sehr dunkel.
 */

import type { AreaDef } from '../types';

export const SCHATTENLANDE_AREAS: AreaDef[] = [
  {
    id: 'schattenlande_pfad',
    region: 'schattenlande',
    name: 'Verdorbenes Land',
    ambientAlpha: 0.45,
    rows: [
      '##############-###############',
      '#.............-..............#',
      '#....rr.......-......rr......#',
      '#.............-..............#',
      '#.............-..............#',
      '#.......%%%%%%%%%%...........#',
      '#.............-..............#',
      '#....rr.......-......rr......#',
      '#.............-..............#',
      '#.............-..............#',
      '#....---------...............#',
      '#....-.......................#',
      '#....-...rr..........rr......#',
      '#....-.......................#',
      '#....-.......................#',
      '#....---------------.........#',
      '#..................-.........#',
      '#..................-.........#',
      '#..............-...-.........#',
      '##############-###-###########',
    ],
    objects: [
      { type: 'portal', x: 14, y: 0, to: 'mondsee_ruine', toX: 26, toY: 4, facing: 'up' },
      { type: 'portal', x: 14, y: 18, to: 'schattenlande_dorf', toX: 15, toY: 1, facing: 'down' },
      {
        type: 'portal',
        x: 18,
        y: 18,
        to: 'schattenlande_ruine',
        toX: 15,
        toY: 18,
        facing: 'down',
        lockedUnless: { puzzleSolved: 'schattenlande_licht' },
        lockedText: 'Der schwarze Nebel ist hier zu dicht. Erst muss das Dorf wieder brennen.',
      },

      // Der Wendepunkt der Geschichte. Beide Ausloeser spannen sich ueber die
      // volle Kartenbreite: die Karte ist offen genug, dass man sonst rechts
      // am Nebel vorbeilaufen und die Trennung ueberspringen koennte - und
      // danach saehe man Ascha mit Pookie an der Seite, waehrend Mauseri
      // erzaehlt, der Nebel habe ihn geholt.
      { type: 'trigger', id: 'schattenlande_ankunft', x: 1, y: 2, w: 28, h: 2, script: 'schattenlande_ankunft', once: true },
      { type: 'trigger', id: 'trennung', x: 1, y: 8, w: 28, h: 3, script: 'trennung', once: true },

      { type: 'enemy', enemy: 'schattenmaus', x: 24, y: 5, leash: 7 },
      { type: 'enemy', enemy: 'nebelschleicher', x: 6, y: 13, leash: 6 },
      { type: 'enemy', enemy: 'schattenmaus', x: 25, y: 16, leash: 7 },
      { type: 'enemy', enemy: 'verdorbener_waechter', x: 22, y: 11, leash: 6, permanent: true, id: 'pfad_waechter' },

      { type: 'save', x: 8, y: 16 },
      {
        type: 'sign',
        x: 10,
        y: 12,
        text: [
          'Ein umgestuerzter Wegweiser.',
          'Nach Norden stand einmal ein Name.',
          'Er wurde herausgekratzt. Sehr gruendlich.',
        ],
      },
      {
        type: 'chest',
        id: 'pfad_chest_schatten',
        x: 27,
        y: 3,
        contents: [
          { item: 'nachthalsband', count: 1 },
          { item: 'heilmilch', count: 2 },
        ],
      },
      { type: 'pickup', id: 'pfad_geheim_schatten', x: 12, y: 4, item: 'mondsplitter', hidden: true },
    ],
  },

  {
    id: 'schattenlande_dorf',
    region: 'schattenlande',
    name: 'Das verlassene Dorf',
    ambientAlpha: 0.52,
    music: 'shadow',
    rows: [
      '##############-###############',
      '#.............-..............#',
      '#..rrrrr......-......rrrrr...#',
      '#..rrrrr......-......rrrrr...#',
      '#.............-..............#',
      '#....----------------........#',
      '#....-.......-.......-.......#',
      '#....-.......-.......-.......#',
      '#..rrr.......-.......rrr.....#',
      '#..rrr.......-.......rrr.....#',
      '#....-.......-.......-.......#',
      '#....-----------------.......#',
      '#............-...............#',
      '#............-...............#',
      '#..rrrrr.....-.....rrrrr.....#',
      '#..rrrrr.....-.....rrrrr.....#',
      '#............-...............#',
      '#............-...............#',
      '#............-...............#',
      '##############################',
    ],
    objects: [
      { type: 'portal', x: 14, y: 0, to: 'schattenlande_pfad', toX: 14, toY: 17, facing: 'up' },

      { type: 'npc', npc: 'ueberlebende_ascha', x: 16, y: 12, facing: 'left' },

      // Vier Feuer - das Raetsel dieser Karte
      { type: 'torch', id: 'dorf_feuer_1', x: 7, y: 6, puzzle: 'schattenlande_licht' },
      { type: 'torch', id: 'dorf_feuer_2', x: 23, y: 6, puzzle: 'schattenlande_licht' },
      { type: 'torch', id: 'dorf_feuer_3', x: 7, y: 17, puzzle: 'schattenlande_licht' },
      { type: 'torch', id: 'dorf_feuer_4', x: 23, y: 17, puzzle: 'schattenlande_licht' },

      { type: 'enemy', enemy: 'nebelschleicher', x: 10, y: 9, leash: 6 },
      { type: 'enemy', enemy: 'schattenmaus', x: 17, y: 15, leash: 7 },
      { type: 'enemy', enemy: 'nebelschleicher', x: 26, y: 12, leash: 6 },

      { type: 'save', x: 11, y: 12 },
      {
        type: 'sign',
        x: 9,
        y: 13,
        text: [
          'Vor einem eingestuerzten Haus steht ein Schild.',
          '"Hier wohnt Familie Brandt."',
          'Das Schild ist frisch geputzt.',
        ],
      },
      {
        type: 'chest',
        id: 'dorf_chest_schatten',
        x: 26,
        y: 3,
        contents: [
          { item: 'tagebuchseite', count: 1 },
          { item: 'coins', count: 70 },
        ],
      },
      { type: 'pickup', id: 'dorf_geheim_schatten', x: 3, y: 17, item: 'herzscherbe', hidden: true },
    ],
  },

  {
    id: 'schattenlande_ruine',
    region: 'schattenlande',
    name: 'Nyxaras alte Ruine',
    ambientAlpha: 0.55,
    music: 'dungeon',
    rows: [
      '##############################',
      '#............................#',
      '#....##################......#',
      '#....#................#......#',
      '#....#................#......#',
      '#....#................#......#',
      '#....#................#......#',
      '#....#................#......#',
      '#....#................#......#',
      '#....#................#......#',
      '#....#................#......#',
      '#....#................#......#',
      '#....#................#......#',
      '#....##########..######......#',
      '#............................#',
      '#....++................++....#',
      '#............................#',
      '#............................#',
      '#..............-.............#',
      '##############################',
    ],
    objects: [
      { type: 'portal', x: 15, y: 18, to: 'schattenlande_pfad', toX: 18, toY: 17, facing: 'down' },

      // Runenfolge - die Reihenfolge steht in Folios Buch im Schloss,
      // findbar aber auch durch Ausprobieren.
      { type: 'rune', id: 'ruine_rune_a', x: 8, y: 5, puzzle: 'schattenlande_runen', symbol: 'A' },
      { type: 'rune', id: 'ruine_rune_b', x: 19, y: 5, puzzle: 'schattenlande_runen', symbol: 'B' },
      { type: 'rune', id: 'ruine_rune_c', x: 8, y: 11, puzzle: 'schattenlande_runen', symbol: 'C' },
      { type: 'rune', id: 'ruine_rune_d', x: 19, y: 11, puzzle: 'schattenlande_runen', symbol: 'D' },

      // Wiedersehen mit Pookie, danach der Boss
      {
        type: 'trigger',
        id: 'wiedersehen',
        x: 12,
        y: 7,
        w: 6,
        h: 3,
        script: 'wiedersehen',
        once: true,
        showIf: { puzzleSolved: 'schattenlande_runen' },
      },
      {
        type: 'trigger',
        id: 'nebelfuerst_erwacht',
        x: 12,
        y: 7,
        w: 6,
        h: 3,
        script: 'nebelfuerst_erwacht',
        once: true,
        showIf: { flag: 'pookie_zurueck' },
      },

      { type: 'npc', npc: 'schattenwache_orin', x: 25, y: 8, facing: 'left' },

      { type: 'enemy', enemy: 'verdorbener_waechter', x: 3, y: 8, leash: 5, permanent: true, id: 'ruine_waechter_1' },
      { type: 'enemy', enemy: 'schattenmaus', x: 26, y: 16, leash: 6 },

      {
        type: 'chest',
        id: 'ruine_chest_schatten',
        x: 15,
        y: 16,
        contents: [
          { item: 'tagebuchseite', count: 1 },
          { item: 'herzscherbe', count: 1 },
        ],
        showIf: { bossDefeated: 'nebelfuerst' },
      },
      { type: 'save', x: 11, y: 16 },
      {
        type: 'sign',
        x: 19,
        y: 16,
        text: [
          'Auf einer Steinplatte, sehr sorgfaeltig gemeisselt:',
          '"Hier lernte N. das Lesen."',
          'Kein Datum. Kein Nachname.',
        ],
      },
      {
        type: 'portal',
        x: 3,
        y: 3,
        to: 'schloss_halle',
        toX: 15,
        toY: 18,
        facing: 'up',
        lockedUnless: { bossDefeated: 'nebelfuerst' },
        lockedText: 'Das Tor zum Schloss ist versiegelt.',
      },
    ],
  },
];
