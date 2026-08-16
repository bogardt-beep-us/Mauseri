/**
 * Bosse.
 *
 * Entwurfsregel: kein Boss gewinnt durch Lebenspunkte. Jeder hat
 *  - ein eigenes Aussehen,
 *  - eigene Angriffe,
 *  - mehrere Phasen mit veraendertem Verhalten,
 *  - und ein klar erkennbares Fenster, in dem er verwundbar ist.
 *
 * Das Verwundbarkeitsfenster oeffnet sich nach jedem abgeschlossenen Muster
 * (siehe BossActor) - der Spieler lernt also, ein Muster abzuwarten statt
 * dauerhaft draufzuschlagen.
 */

import type { BossDef } from './types';

export const BOSSES: Record<string, BossDef> = {
  // =========================================================================
  // Schnurrwald
  // =========================================================================
  dornenkater: {
    id: 'dornenkater',
    name: 'Der Dornenkater',
    title: 'Waechter des verdorbenen Hains',
    hp: 180,
    attack: 10,
    speed: 60,
    music: 'boss',
    look: {
      shape: 'thorn',
      body: 0x5f7f3a,
      bodyDark: 0x3c5424,
      eye: 0xffd020,
      accent: 0x8fb84a,
      scale: 1.7,
    },
    introDialogue: 'boss_dornenkater_intro',
    outroDialogue: 'boss_dornenkater_outro',
    weakness: {
      whenVulnerable: 'Nach jedem Angriff braucht er einen Moment, um die Dornen neu zu richten.',
      damageMultiplier: 2.2,
    },
    phases: [
      {
        hpThreshold: 1,
        patterns: [
          { kind: 'charge', windupMs: 700, speed: 190, damage: 10 },
          { kind: 'rest', durationMs: 900 },
          { kind: 'volley', count: 3, spreadDeg: 40, speed: 120, damage: 8 },
        ],
      },
      {
        hpThreshold: 0.65,
        taunt: 'Der Boden bricht auf - ueberall Dornen!',
        arenaChange: 'thorns',
        speedFactor: 1.15,
        patterns: [
          { kind: 'spawnHazard', hazard: 'thorn', count: 4, damage: 7 },
          { kind: 'charge', windupMs: 560, speed: 220, damage: 12 },
          { kind: 'rest', durationMs: 800 },
          { kind: 'volley', count: 5, spreadDeg: 70, speed: 130, damage: 8 },
        ],
      },
      {
        hpThreshold: 0.3,
        taunt: 'Die Lichtung selbst wehrt sich!',
        speedFactor: 1.3,
        patterns: [
          { kind: 'summon', enemy: 'dornenkatze', count: 2 },
          { kind: 'spawnHazard', hazard: 'thorn', count: 6, damage: 8 },
          { kind: 'dash', times: 3, speed: 250, damage: 12 },
          { kind: 'rest', durationMs: 700 },
        ],
      },
    ],
    rewards: [
      { giveAbility: 'schnurrimpuls' },
      { increaseMaxHp: 10 },
      { setFlag: 'kapitel_3' },
      { toast: 'Der Schnurrwald atmet wieder.', kind: 'info' },
    ],
  },

  // =========================================================================
  // Kratzfels
  // =========================================================================
  grubenherz: {
    id: 'grubenherz',
    name: 'Grubenherz',
    title: 'Was in der Tiefe erwachte',
    hp: 260,
    attack: 13,
    speed: 44,
    music: 'boss',
    look: {
      shape: 'sentinel',
      body: 0x7a6a5a,
      bodyDark: 0x4e4238,
      eye: 0xff8a20,
      accent: 0xffb45e,
      scale: 1.9,
    },
    introDialogue: 'boss_grubenherz_intro',
    outroDialogue: 'boss_grubenherz_outro',
    weakness: {
      whenVulnerable: 'Nach dem Aufschlag glueht sein Kern - dann ist der Stein weich.',
      damageMultiplier: 2.4,
    },
    phases: [
      {
        hpThreshold: 1,
        patterns: [
          { kind: 'slam', windupMs: 800, radius: 62, damage: 13 },
          { kind: 'rest', durationMs: 1000 },
          { kind: 'volley', count: 4, spreadDeg: 90, speed: 110, damage: 9 },
        ],
      },
      {
        hpThreshold: 0.6,
        taunt: 'Der Stollen bebt - Geroell faellt von der Decke!',
        arenaChange: 'rubble',
        patterns: [
          { kind: 'slam', windupMs: 640, radius: 76, damage: 15 },
          { kind: 'summon', enemy: 'hoehlenkrabbler', count: 2 },
          { kind: 'rest', durationMs: 850 },
          { kind: 'volley', count: 6, spreadDeg: 140, speed: 120, damage: 10 },
        ],
      },
      {
        hpThreshold: 0.25,
        taunt: 'Grubenherz zieht die ganze Mine zusammen!',
        speedFactor: 1.2,
        patterns: [
          { kind: 'shield', durationMs: 2600 },
          { kind: 'slam', windupMs: 520, radius: 88, damage: 16 },
          { kind: 'spawnHazard', hazard: 'thorn', count: 5, damage: 9 },
          { kind: 'rest', durationMs: 700 },
        ],
      },
    ],
    rewards: [
      { giveAbility: 'katzenflink' },
      { increaseMaxHp: 12 },
      { giveItem: 'mondsplitter' },
      { setFlag: 'kapitel_4' },
    ],
  },

  // =========================================================================
  // Miauport
  // =========================================================================
  tiefenkralle: {
    id: 'tiefenkralle',
    name: 'Tiefenkralle',
    title: 'Der Schrecken der Schmugglerhoehle',
    hp: 300,
    attack: 14,
    speed: 58,
    music: 'boss',
    look: {
      shape: 'crab',
      body: 0x4a7a8a,
      bodyDark: 0x2e5260,
      eye: 0xffd020,
      accent: 0x7fd8ff,
      scale: 1.85,
    },
    introDialogue: 'boss_tiefenkralle_intro',
    outroDialogue: 'boss_tiefenkralle_outro',
    weakness: {
      whenVulnerable: 'Wenn die Scheren zuschnappen und ins Leere greifen, liegt der Panzer frei.',
      damageMultiplier: 2.3,
    },
    phases: [
      {
        hpThreshold: 1,
        patterns: [
          { kind: 'dash', times: 2, speed: 230, damage: 14 },
          { kind: 'rest', durationMs: 900 },
          { kind: 'volley', count: 5, spreadDeg: 100, speed: 125, damage: 10 },
        ],
      },
      {
        hpThreshold: 0.6,
        taunt: 'Das Wasser steigt - die Hoehle laeuft voll!',
        arenaChange: 'water',
        speedFactor: 1.1,
        patterns: [
          { kind: 'spawnHazard', hazard: 'frost', count: 4, damage: 9 },
          { kind: 'dash', times: 3, speed: 250, damage: 15 },
          { kind: 'summon', enemy: 'salzgeist', count: 2 },
          { kind: 'rest', durationMs: 800 },
        ],
      },
      {
        hpThreshold: 0.28,
        taunt: 'Tiefenkralle taucht ab - und kommt von unten!',
        speedFactor: 1.25,
        patterns: [
          { kind: 'teleport', times: 1 },
          { kind: 'slam', windupMs: 520, radius: 80, damage: 16 },
          { kind: 'volley', count: 8, spreadDeg: 360, speed: 130, damage: 11 },
          { kind: 'rest', durationMs: 700 },
        ],
      },
    ],
    rewards: [
      { increaseMaxHp: 14 },
      { giveItem: 'schmugglerschluessel' },
      { giveCoins: 120 },
      { setFlag: 'kapitel_5' },
    ],
  },

  // =========================================================================
  // Mondsee
  // =========================================================================
  spiegelkatze: {
    id: 'spiegelkatze',
    name: 'Die Spiegelkatze',
    title: 'Dein Gesicht, falsch herum',
    hp: 340,
    attack: 15,
    speed: 76,
    music: 'boss',
    look: {
      shape: 'cat',
      body: 0xc0d0e8,
      bodyDark: 0x8494b8,
      eye: 0x8a6ad0,
      accent: 0xffffff,
      scale: 1.55,
    },
    introDialogue: 'boss_spiegelkatze_intro',
    outroDialogue: 'boss_spiegelkatze_outro',
    weakness: {
      ability: 'schnurrimpuls',
      whenVulnerable:
        'Sie ahmt jede Bewegung nach - aber ein Schnurrimpuls hat kein Spiegelbild.',
      damageMultiplier: 2.5,
    },
    phases: [
      {
        hpThreshold: 1,
        patterns: [
          { kind: 'teleport', times: 1 },
          { kind: 'dash', times: 2, speed: 260, damage: 15 },
          { kind: 'rest', durationMs: 800 },
        ],
      },
      {
        hpThreshold: 0.7,
        taunt: 'Sie teilt sich - welche ist echt?',
        arenaChange: 'mirrors',
        patterns: [
          { kind: 'summon', enemy: 'spiegelscherbe', count: 3 },
          { kind: 'teleport', times: 1 },
          { kind: 'volley', count: 6, spreadDeg: 360, speed: 140, damage: 11 },
          { kind: 'rest', durationMs: 750 },
        ],
      },
      {
        hpThreshold: 0.35,
        taunt: 'Der See friert - und der Mond steht falsch.',
        speedFactor: 1.3,
        patterns: [
          { kind: 'beam', windupMs: 700, durationMs: 1800, damage: 13 },
          { kind: 'spawnHazard', hazard: 'frost', count: 5, damage: 10 },
          { kind: 'dash', times: 4, speed: 280, damage: 16 },
          { kind: 'rest', durationMs: 650 },
        ],
      },
    ],
    rewards: [
      { giveAbility: 'schattenpfote' },
      { increaseMaxHp: 14 },
      { increaseMaxEnergy: 10 },
      { setFlag: 'kapitel_6' },
    ],
  },

  // =========================================================================
  // Schattenlande
  // =========================================================================
  nebelfuerst: {
    id: 'nebelfuerst',
    name: 'Der Nebelfuerst',
    title: 'Erster Diener des Herzens',
    hp: 420,
    attack: 17,
    speed: 64,
    music: 'boss',
    look: {
      shape: 'wraith',
      body: 0x4a3f6a,
      bodyDark: 0x2a2440,
      eye: 0xff5f8a,
      accent: 0xa77fd8,
      floating: true,
      scale: 1.8,
    },
    introDialogue: 'boss_nebelfuerst_intro',
    outroDialogue: 'boss_nebelfuerst_outro',
    weakness: {
      ability: 'mondkralle',
      whenVulnerable: 'Sein Nebel schluckt gewoehnliche Kralle. Nur Mondlicht beisst.',
      damageMultiplier: 2.6,
    },
    phases: [
      {
        hpThreshold: 1,
        patterns: [
          { kind: 'shield', durationMs: 2400 },
          { kind: 'volley', count: 7, spreadDeg: 160, speed: 145, damage: 12 },
          { kind: 'rest', durationMs: 850 },
        ],
      },
      {
        hpThreshold: 0.7,
        taunt: 'Der Nebel wird dicht. Sieh genau hin.',
        arenaChange: 'fog',
        patterns: [
          { kind: 'summon', enemy: 'nebelschleicher', count: 2 },
          { kind: 'teleport', times: 1 },
          { kind: 'beam', windupMs: 620, durationMs: 1600, damage: 14 },
          { kind: 'rest', durationMs: 800 },
        ],
      },
      {
        hpThreshold: 0.4,
        taunt: 'Du kannst nicht toeten, was schon vergessen wurde!',
        speedFactor: 1.2,
        patterns: [
          { kind: 'spawnHazard', hazard: 'shadow', count: 6, damage: 12 },
          { kind: 'dash', times: 3, speed: 270, damage: 17 },
          { kind: 'volley', count: 10, spreadDeg: 360, speed: 150, damage: 12 },
          { kind: 'rest', durationMs: 700 },
        ],
      },
      {
        hpThreshold: 0.15,
        taunt: 'Sie hat mich auch einmal geliebt!',
        speedFactor: 1.35,
        patterns: [
          { kind: 'summon', enemy: 'schattenmaus', count: 3 },
          { kind: 'beam', windupMs: 500, durationMs: 2000, damage: 15 },
          { kind: 'slam', windupMs: 500, radius: 90, damage: 18 },
          { kind: 'rest', durationMs: 600 },
        ],
      },
    ],
    rewards: [
      { increaseMaxHp: 16 },
      { increaseMaxEnergy: 10 },
      { giveItem: 'mondsplitter' },
      { setFlag: 'kapitel_7' },
    ],
  },

  // =========================================================================
  // Schloss Nyxara - Finale
  // =========================================================================
  nyxara: {
    id: 'nyxara',
    name: 'Nyxara',
    title: 'Koenigin der ewigen Nacht',
    hp: 560,
    attack: 19,
    speed: 70,
    music: 'finale',
    look: {
      shape: 'cat',
      body: 0x342c50,
      bodyDark: 0x1c1830,
      eye: 0xd8a0ff,
      accent: 0xffd98a,
      scale: 1.75,
    },
    introDialogue: 'boss_nyxara_intro',
    outroDialogue: 'boss_nyxara_outro',
    weakness: {
      ability: 'mondkralle',
      whenVulnerable:
        'Das Herz schlaegt sichtbar, wenn sie erschoepft ist. In diesem Moment ist sie sie selbst.',
      damageMultiplier: 2.4,
    },
    phases: [
      {
        hpThreshold: 1,
        patterns: [
          { kind: 'volley', count: 6, spreadDeg: 120, speed: 150, damage: 13 },
          { kind: 'dash', times: 2, speed: 270, damage: 17 },
          { kind: 'rest', durationMs: 900 },
        ],
      },
      {
        hpThreshold: 0.75,
        taunt: 'Nyxara: "Du verstehst nicht, was ich verhindere."',
        arenaChange: 'shadow',
        patterns: [
          { kind: 'summon', enemy: 'schattenwache', count: 2 },
          { kind: 'beam', windupMs: 650, durationMs: 1700, damage: 15 },
          { kind: 'spawnHazard', hazard: 'shadow', count: 5, damage: 13 },
          { kind: 'rest', durationMs: 800 },
        ],
      },
      {
        hpThreshold: 0.5,
        taunt: 'Nyxara: "Ich habe es gehalten. Jahrelang. Allein."',
        speedFactor: 1.2,
        patterns: [
          { kind: 'teleport', times: 1 },
          { kind: 'volley', count: 12, spreadDeg: 360, speed: 155, damage: 14 },
          { kind: 'slam', windupMs: 560, radius: 92, damage: 18 },
          { kind: 'rest', durationMs: 750 },
        ],
      },
      {
        hpThreshold: 0.25,
        taunt: 'Das Herz der Nacht uebernimmt.',
        arenaChange: 'heart',
        speedFactor: 1.4,
        patterns: [
          { kind: 'shield', durationMs: 2200, breakWith: 'mondkralle' },
          { kind: 'beam', windupMs: 480, durationMs: 2200, damage: 17 },
          { kind: 'summon', enemy: 'thronwaechter', count: 1 },
          { kind: 'volley', count: 14, spreadDeg: 360, speed: 165, damage: 15 },
          { kind: 'rest', durationMs: 650 },
        ],
      },
    ],
    rewards: [{ setFlag: 'nyxara_besiegt' }],
  },

  // =========================================================================
  // Optionaler Bosskampf (Geheimnis)
  // =========================================================================
  alter_schrein: {
    id: 'alter_schrein',
    name: 'Der Namenlose',
    title: 'Was vor dem Herzen kam',
    hp: 480,
    attack: 20,
    speed: 82,
    music: 'boss',
    look: {
      shape: 'sentinel',
      body: 0x2a2438,
      bodyDark: 0x181425,
      eye: 0xffd98a,
      accent: 0xfff4dc,
      floating: true,
      scale: 1.7,
    },
    introDialogue: 'boss_namenlos_intro',
    outroDialogue: 'boss_namenlos_outro',
    weakness: {
      whenVulnerable: 'Er kennt jede Faehigkeit - ausser Geduld.',
      damageMultiplier: 2.2,
    },
    phases: [
      {
        hpThreshold: 1,
        patterns: [
          { kind: 'teleport', times: 1 },
          { kind: 'volley', count: 8, spreadDeg: 360, speed: 160, damage: 15 },
          { kind: 'dash', times: 3, speed: 290, damage: 18 },
          { kind: 'rest', durationMs: 700 },
        ],
      },
      {
        hpThreshold: 0.5,
        taunt: 'Er hat aufgehoert, sich zurueckzuhalten.',
        speedFactor: 1.35,
        patterns: [
          { kind: 'beam', windupMs: 420, durationMs: 2000, damage: 18 },
          { kind: 'spawnHazard', hazard: 'shadow', count: 7, damage: 14 },
          { kind: 'slam', windupMs: 460, radius: 96, damage: 20 },
          { kind: 'rest', durationMs: 600 },
        ],
      },
    ],
    rewards: [
      { giveItem: 'mondstahlkralle' },
      { increaseMaxHp: 20 },
      { setFlag: 'geheimnis_namenlos' },
      { toast: 'Ein Geheimnis Miauriens ist geloest.', kind: 'info' },
    ],
  },
};

export function getBoss(id: string): BossDef | undefined {
  return BOSSES[id];
}
