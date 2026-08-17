/**
 * Zwischensequenzen.
 *
 * Ein Skript ist eine Liste von Anweisungen, die der ScriptRunner abarbeitet.
 * Waehrend eines Skripts ist die Steuerung gesperrt und die Touch-Bedienung
 * ausgeblendet, damit nichts dazwischenfunkt.
 */

import type { ScriptDef } from './types';

export const SCRIPTS: Record<string, ScriptDef> = {
  // =========================================================================
  // Miezlingen
  // =========================================================================
  prolog_aufwachen: {
    id: 'prolog_aufwachen',
    cutscene: true,
    steps: [
      { do: 'music', track: 'village' },
      { do: 'face', who: 'player', dir: 'down' },
      { do: 'wait', ms: 400 },
      { do: 'dialogue', node: 'prolog_1' },
      { do: 'wait', ms: 200 },
    ],
  },

  dorf_erstes_betreten: {
    id: 'dorf_erstes_betreten',
    cutscene: true,
    steps: [
      { do: 'camera', toX: 12, toY: 10, ms: 900 },
      { do: 'wait', ms: 700 },
      { do: 'camera', follow: 'player', ms: 700 },
      { do: 'dialogue', node: 'dorf_ankunft' },
    ],
  },

  tutorial_kampf: {
    id: 'tutorial_kampf',
    cutscene: true,
    steps: [
      { do: 'dialogue', node: 'tutorial_kampf_1' },
      { do: 'shake', ms: 260, intensity: 0.005 },
      { do: 'sfx', sound: 'warn' },
      { do: 'wait', ms: 300 },
      { do: 'dialogue', node: 'tutorial_kampf_2' },
    ],
  },

  scheune_murr: {
    id: 'scheune_murr',
    cutscene: true,
    steps: [
      { do: 'music', track: 'sad' },
      { do: 'dialogue', node: 'murr_gefunden' },
      { do: 'wait', ms: 400 },
      { do: 'music', track: 'village' },
    ],
  },

  // =========================================================================
  // Schnurrwald
  // =========================================================================
  wald_eintritt: {
    id: 'wald_eintritt',
    cutscene: true,
    steps: [
      { do: 'music', track: 'forest' },
      { do: 'camera', toX: 14, toY: 10, ms: 900 },
      { do: 'dialogue', node: 'wald_eintritt_1' },
      { do: 'camera', follow: 'player', ms: 600 },
    ],
  },

  lichtung_ankunft: {
    id: 'lichtung_ankunft',
    cutscene: true,
    steps: [
      { do: 'dialogue', node: 'lichtung_ankunft_1' },
      { do: 'effects', effects: [{ setFlag: 'lichtung_erreicht' }, { advanceQuest: 'q_hauptquest_2', step: 1 }] },
    ],
  },

  dornenkater_erwacht: {
    id: 'dornenkater_erwacht',
    cutscene: true,
    steps: [
      { do: 'shake', ms: 700, intensity: 0.01 },
      { do: 'sfx', sound: 'warn' },
      { do: 'dialogue', node: 'dornenkater_erwacht_1' },
      { do: 'boss', boss: 'dornenkater', x: 15, y: 8 },
    ],
  },

  // =========================================================================
  // Kratzfels
  // =========================================================================
  kratzfels_ankunft: {
    id: 'kratzfels_ankunft',
    cutscene: true,
    steps: [
      { do: 'music', track: 'mountain' },
      { do: 'camera', toX: 16, toY: 6, ms: 900 },
      { do: 'dialogue', node: 'kratzfels_ankunft_1' },
      { do: 'camera', follow: 'player', ms: 700 },
      { do: 'effects', effects: [{ startQuest: 'q_hauptquest_3' }, { unlockMapRegion: 'kratzfels' }] },
    ],
  },

  grubenherz_erwacht: {
    id: 'grubenherz_erwacht',
    cutscene: true,
    steps: [
      { do: 'shake', ms: 900, intensity: 0.012 },
      { do: 'effects', effects: [{ setFlag: 'kratzfels_tiefe_erreicht' }] },
      { do: 'dialogue', node: 'grubenherz_erwacht_1' },
      { do: 'boss', boss: 'grubenherz', x: 14, y: 8 },
    ],
  },

  // =========================================================================
  // Miauport
  // =========================================================================
  miauport_ankunft: {
    id: 'miauport_ankunft',
    cutscene: true,
    steps: [
      { do: 'music', track: 'harbor' },
      { do: 'camera', toX: 18, toY: 8, ms: 1000 },
      { do: 'dialogue', node: 'miauport_ankunft_1' },
      { do: 'camera', follow: 'player', ms: 700 },
      { do: 'effects', effects: [{ startQuest: 'q_hauptquest_4' }, { unlockMapRegion: 'miauport' }] },
    ],
  },

  tiefenkralle_erwacht: {
    id: 'tiefenkralle_erwacht',
    cutscene: true,
    steps: [
      { do: 'sfx', sound: 'splash' },
      { do: 'shake', ms: 800, intensity: 0.01 },
      { do: 'dialogue', node: 'tiefenkralle_erwacht_1' },
      { do: 'boss', boss: 'tiefenkralle', x: 15, y: 9 },
    ],
  },

  // =========================================================================
  // Mondsee
  // =========================================================================
  mondsee_ankunft: {
    id: 'mondsee_ankunft',
    cutscene: true,
    steps: [
      { do: 'music', track: 'lake' },
      { do: 'camera', toX: 16, toY: 10, ms: 1200 },
      { do: 'dialogue', node: 'mondsee_ankunft_1' },
      { do: 'camera', follow: 'player', ms: 800 },
      { do: 'effects', effects: [{ startQuest: 'q_hauptquest_5' }, { unlockMapRegion: 'mondsee' }] },
    ],
  },

  spiegelkatze_erwacht: {
    id: 'spiegelkatze_erwacht',
    cutscene: true,
    steps: [
      { do: 'flash', color: 0xffffff, ms: 300 },
      { do: 'dialogue', node: 'spiegelkatze_erwacht_1' },
      { do: 'boss', boss: 'spiegelkatze', x: 15, y: 8 },
    ],
  },

  // =========================================================================
  // Die Trennung - Wendepunkt der Geschichte
  // =========================================================================
  trennung: {
    id: 'trennung',
    cutscene: true,
    steps: [
      { do: 'music', track: 'stop' },
      { do: 'wait', ms: 600 },
      { do: 'dialogue', node: 'trennung_1' },
      { do: 'shake', ms: 900, intensity: 0.014 },
      { do: 'flash', color: 0x2a1f47, ms: 400 },
      { do: 'sfx', sound: 'shadowStep' },
      { do: 'despawn', who: 'pookie' },
      { do: 'wait', ms: 900 },
      { do: 'music', track: 'sad' },
      { do: 'dialogue', node: 'trennung_2' },
      { do: 'effects', effects: [{ setFlag: 'pookie_getrennt' }] },
    ],
  },

  wiedersehen: {
    id: 'wiedersehen',
    cutscene: true,
    steps: [
      { do: 'music', track: 'stop' },
      { do: 'dialogue', node: 'wiedersehen_1' },
      { do: 'wait', ms: 500 },
      { do: 'music', track: 'victory' },
      { do: 'flash', color: 0xffd98a, ms: 500 },
      // Pookie kehrt tatsaechlich in die Gruppe zurueck, nicht nur im Text.
      { do: 'spawn', npc: 'pookie', x: 15, y: 9 },
      { do: 'effects', effects: [{ setFlag: 'pookie_zurueck' }] },
      { do: 'dialogue', node: 'wiedersehen_2' },
      { do: 'music', track: 'shadow' },
    ],
  },

  // =========================================================================
  // Schattenlande
  // =========================================================================
  schattenlande_ankunft: {
    id: 'schattenlande_ankunft',
    cutscene: true,
    steps: [
      { do: 'music', track: 'shadow' },
      { do: 'camera', toX: 16, toY: 10, ms: 1200 },
      { do: 'dialogue', node: 'schattenlande_ankunft_1' },
      { do: 'camera', follow: 'player', ms: 800 },
      { do: 'effects', effects: [{ startQuest: 'q_hauptquest_6' }, { unlockMapRegion: 'schattenlande' }] },
    ],
  },

  nebelfuerst_erwacht: {
    id: 'nebelfuerst_erwacht',
    cutscene: true,
    steps: [
      { do: 'shake', ms: 1000, intensity: 0.014 },
      { do: 'dialogue', node: 'nebelfuerst_erwacht_1' },
      { do: 'boss', boss: 'nebelfuerst', x: 15, y: 8 },
    ],
  },

  // =========================================================================
  // Schloss Nyxara
  // =========================================================================
  schloss_ankunft: {
    id: 'schloss_ankunft',
    cutscene: true,
    steps: [
      { do: 'music', track: 'castle' },
      { do: 'camera', toX: 15, toY: 6, ms: 1400 },
      { do: 'dialogue', node: 'schloss_ankunft_1' },
      { do: 'camera', follow: 'player', ms: 800 },
      { do: 'effects', effects: [{ setFlag: 'schloss_betreten' }, { startQuest: 'q_hauptquest_7' }, { unlockMapRegion: 'schloss' }] },
    ],
  },

  erinnerung_nyxara: {
    id: 'erinnerung_nyxara',
    cutscene: true,
    steps: [
      { do: 'music', track: 'sad' },
      { do: 'fade', to: 'black', ms: 600 },
      { do: 'wait', ms: 400 },
      { do: 'fade', to: 'clear', ms: 600 },
      { do: 'dialogue', node: 'nyxara_erinnerung_1' },
      { do: 'wait', ms: 400 },
      { do: 'music', track: 'castle' },
    ],
  },

  finale: {
    id: 'finale',
    cutscene: true,
    steps: [
      { do: 'music', track: 'stop' },
      { do: 'camera', toX: 15, toY: 6, ms: 1200 },
      { do: 'dialogue', node: 'boss_nyxara_intro' },
      { do: 'camera', follow: 'player', ms: 600 },
      { do: 'boss', boss: 'nyxara', x: 15, y: 6 },
    ],
  },

  abspann: {
    id: 'abspann',
    cutscene: true,
    steps: [
      { do: 'music', track: 'stop' },
      { do: 'fade', to: 'black', ms: 900 },
      { do: 'wait', ms: 600 },
      { do: 'music', track: 'credits' },
      { do: 'credits', ending: 'good' },
    ],
  },

  abspann_wahr: {
    id: 'abspann_wahr',
    cutscene: true,
    steps: [
      { do: 'music', track: 'stop' },
      { do: 'dialogue', node: 'wahres_ende_1' },
      { do: 'fade', to: 'black', ms: 900 },
      { do: 'wait', ms: 600 },
      { do: 'music', track: 'credits' },
      { do: 'credits', ending: 'true' },
    ],
  },
};

export function getScript(id: string): ScriptDef | undefined {
  return SCRIPTS[id];
}
