/**
 * Quests.
 *
 * Hauptquests treiben die Geschichte, Nebenquests erzaehlen kleine eigene
 * Geschichten. Bewusste Regel aus dem Konzept: keine Nebenquest ist blosses
 * "Sammle 10 Dinge" - jede hat eine Person mit einem Anliegen dahinter.
 *
 * Der aktuelle Schritt wird im Spielstand gefuehrt; `done` beschreibt, wann ein
 * Schritt erfuellt ist, damit das Questlog sich selbst aktualisiert.
 */

import type { QuestDef, QuestId } from './types';

export const QUESTS: Record<QuestId, QuestDef> = {
  // =========================================================================
  // Hauptgeschichte
  // =========================================================================

  q_hauptquest_1: {
    id: 'q_hauptquest_1',
    name: 'Der schwarze Nebel',
    kind: 'main',
    region: 'miezlingen',
    summary:
      'In der Nacht wurde am Dorfrand schwarzer Nebel gesehen. Und seither fehlt Murr.',
    giver: 'mutter_lina',
    steps: [
      { text: 'Sprich mit den Bewohnern von Miezlingen.', done: { flag: 'prolog_nebel_gesehen' }, hintArea: 'miezlingen_dorf' },
      { text: 'Ueberrede Tobb, dich aus dem Dorf zu lassen.', done: { flag: 'kapitel_2' }, hintArea: 'miezlingen_dorf' },
      { text: 'Suche am Dorfrand nach Spuren von Murr.', done: { flag: 'murr_gefunden' }, hintArea: 'miezlingen_rand' },
    ],
    rewards: [{ toast: 'Ihr wisst jetzt, wohin der Nebel fuehrt.', kind: 'quest' }],
  },

  q_hauptquest_2: {
    id: 'q_hauptquest_2',
    name: 'Was im Wald wohnt',
    kind: 'main',
    region: 'schnurrwald',
    summary: 'Der Schnurrwald hat sich veraendert. Bork weiss mehr, als er sagt.',
    giver: 'foerster_bork',
    steps: [
      { text: 'Finde den Weg zur Lichtung im Schnurrwald.', done: { flag: 'lichtung_erreicht' }, hintArea: 'schnurrwald_lichtung' },
      { text: 'Entzuende die drei Schreine.', done: { puzzleSolved: 'schnurrwald_schreine' }, hintArea: 'schnurrwald_lichtung' },
      { text: 'Stelle dich dem, was die Schreine bewacht.', done: { bossDefeated: 'dornenkater' } },
    ],
    rewards: [{ toast: 'Der Schnurrwald ist frei - vorerst.', kind: 'quest' }],
  },

  q_hauptquest_3: {
    id: 'q_hauptquest_3',
    name: 'Der Stein und das Feuer',
    kind: 'main',
    region: 'kratzfels',
    summary: 'In den Minen von Kratzfels ist etwas erwacht, das dort nicht hingehoert.',
    giver: 'schmiedin_ambra',
    steps: [
      { text: 'Verschaffe dir Zutritt zur alten Mine.', done: { hasItem: 'minenschluessel' }, hintArea: 'kratzfels_mine' },
      { text: 'Steige hinab in die Tiefe.', done: { flag: 'kratzfels_tiefe_erreicht' }, hintArea: 'kratzfels_tiefe' },
      { text: 'Besiege, was in der Grube schlaeft.', done: { bossDefeated: 'grubenherz' } },
    ],
  },

  q_hauptquest_4: {
    id: 'q_hauptquest_4',
    name: 'Passage nach Norden',
    kind: 'main',
    region: 'miauport',
    summary: 'Nur ueber Miauport kommt man zum Mondsee. Und Kapitaenin Welle faehrt niemanden umsonst.',
    giver: 'kapitaenin_welle',
    steps: [
      { text: 'Verdiene dir die Ueberfahrt.', done: { flag: 'ueberfahrt_bezahlt' }, hintArea: 'miauport_hafen' },
      { text: 'Raeume die Schmugglerhoehle aus.', done: { bossDefeated: 'tiefenkralle' }, hintArea: 'miauport_hoehle_tief' },
    ],
  },

  q_hauptquest_5: {
    id: 'q_hauptquest_5',
    name: 'Der Mond steht falsch',
    kind: 'main',
    region: 'mondsee',
    summary: 'Luna sagt, der See spiegelt nicht mehr den Himmel. Sondern etwas anderes.',
    giver: 'seherin_luna',
    steps: [
      { text: 'Erreiche die Ruine auf der Insel.', done: { flag: 'mondsee_faehre_frei' }, hintArea: 'mondsee_ruine' },
      { text: 'Lenke das Mondlicht auf den Altar.', done: { puzzleSolved: 'mondsee_spiegel' }, hintArea: 'mondsee_ruine' },
      { text: 'Stelle dich deinem Spiegelbild.', done: { bossDefeated: 'spiegelkatze' } },
    ],
  },

  q_hauptquest_6: {
    id: 'q_hauptquest_6',
    name: 'Wo nichts mehr waechst',
    kind: 'main',
    region: 'schattenlande',
    summary: 'Die Schattenlande waren einmal bewohnt. Ascha ist die Letzte, die sich erinnert.',
    giver: 'ueberlebende_ascha',
    steps: [
      { text: 'Finde Ascha im verlassenen Dorf.', done: { flag: 'ascha_getroffen' }, hintArea: 'schattenlande_dorf' },
      { text: 'Entzuende die vier Feuer des Dorfes.', done: { puzzleSolved: 'schattenlande_licht' }, hintArea: 'schattenlande_dorf' },
      { text: 'Loese die Runen an der Ruine.', done: { puzzleSolved: 'schattenlande_runen' }, hintArea: 'schattenlande_ruine' },
      { text: 'Besiege den Nebelfuersten.', done: { bossDefeated: 'nebelfuerst' } },
    ],
  },

  q_hauptquest_7: {
    id: 'q_hauptquest_7',
    name: 'Das Herz der Nacht',
    kind: 'main',
    region: 'schloss',
    summary: 'Der Weg zum Thronsaal ist offen. Was dahinter wartet, weiss niemand mehr.',
    steps: [
      { text: 'Durchquere das Schloss.', done: { flag: 'schloss_betreten' }, hintArea: 'schloss_halle' },
      { text: 'Finde den Schluessel des Thronsaals.', done: { hasItem: 'thronschluessel' }, hintArea: 'schloss_spiegel' },
      { text: 'Stelle Nyxara.', done: { bossDefeated: 'nyxara' }, hintArea: 'schloss_thron' },
    ],
  },

  // =========================================================================
  // Nebenquests - Miezlingen
  // =========================================================================

  q_brot: {
    id: 'q_brot',
    name: 'Ein Brot fuer Hetta',
    kind: 'side',
    region: 'miezlingen',
    summary:
      'Brummel backt seit dem Nebel nicht mehr. Er sagt, es lohne sich nicht. Hetta sieht das anders.',
    giver: 'brummel',
    steps: [{ text: 'Bringe Oma Hetta den Brotlaib.', done: { flag: 'brummel_brot_gebracht' }, hintArea: 'miezlingen_hetta' }],
    rewards: [{ giveCoins: 30 }, { giveItem: 'fischkeks', count: 3 }],
  },

  q_spielzeugmaus: {
    id: 'q_spielzeugmaus',
    name: 'Fips hat etwas verloren',
    kind: 'side',
    region: 'miezlingen',
    summary: 'Fips vermisst seine Spielzeugmaus. Er behauptet, sie sei weggelaufen.',
    giver: 'fips',
    steps: [{ text: 'Finde die Spielzeugmaus.', done: { hasItem: 'spielzeugmaus' }, hintArea: 'miezlingen_scheune' }],
    rewards: [{ giveCoins: 20 }, { giveItem: 'mondbeere', count: 2 }],
  },

  q_glocke: {
    id: 'q_glocke',
    name: 'Die Glocke von Miezlingen',
    kind: 'side',
    region: 'miezlingen',
    summary:
      'Die Dorfglocke schweigt seit Jahren. Hetta sagt, das sei kein Zufall, sondern Diebstahl.',
    giver: 'oma_hetta',
    steps: [{ text: 'Finde das Glockenherz.', done: { hasItem: 'glockenherz' }, hintArea: 'miezlingen_scheune' }],
    rewards: [{ giveItem: 'stoffhalsband' }, { giveCoins: 40 }, { setFlag: 'glocke_laeutet' }],
  },

  // =========================================================================
  // Nebenquests - Schnurrwald
  // =========================================================================

  q_laterne: {
    id: 'q_laterne',
    name: 'Licht gegen den Nebel',
    kind: 'side',
    region: 'schnurrwald',
    summary: 'Bork hat seine Nebellaterne verloren. Ohne sie geht er keinen Schritt tiefer.',
    giver: 'foerster_bork',
    steps: [{ text: 'Finde Borks Nebellaterne.', done: { hasItem: 'laterne' }, hintArea: 'schnurrwald_tiefe' }],
    rewards: [{ giveCoins: 50 }, { giveItem: 'heilmilch', count: 2 }],
  },

  q_geist: {
    id: 'q_geist',
    name: 'Die zweite Haelfte',
    kind: 'side',
    region: 'schnurrwald',
    summary:
      'Taute weiss nicht mehr, wer sie war. Nur, dass ihr etwas fehlt - und dass es zwei Haelften hatte.',
    giver: 'geist_taute',
    steps: [{ text: 'Finde den zerbrochenen Gluecksbringer.', done: { hasItem: 'gluecksbringer' }, hintArea: 'schnurrwald_schrein' }],
    rewards: [{ giveItem: 'seelenfunke' }, { setFlag: 'taute_erloest' }],
  },

  // =========================================================================
  // Nebenquests - Kratzfels
  // =========================================================================

  q_minen: {
    id: 'q_minen',
    name: 'Was Stoll nicht sagt',
    kind: 'side',
    region: 'kratzfels',
    summary:
      'Ambra sucht ihren Bruder Stoll. Stoll steht direkt vor ihr und tut, als sei nichts.',
    giver: 'schmiedin_ambra',
    steps: [
      { text: 'Sprich mit Stoll ueber die Mine.', done: { flag: 'stoll_gestanden' }, hintArea: 'kratzfels_stadt' },
      { text: 'Bringe Ambra die Wahrheit.', done: { flag: 'ambra_wahrheit' }, hintArea: 'kratzfels_stadt' },
    ],
    rewards: [{ giveItem: 'eisenkralle' }, { giveCoins: 60 }],
  },

  q_arena: {
    id: 'q_arena',
    name: 'Die Kampfstaette',
    kind: 'side',
    region: 'kratzfels',
    summary: 'Grimm laesst niemanden vorbei, der nicht drei Runden ueberstanden hat.',
    giver: 'arenameister_grimm',
    steps: [{ text: 'Ueberstehe drei Runden in der Arena.', done: { flag: 'arena_gewonnen' }, hintArea: 'kratzfels_arena' }],
    rewards: [{ giveCoins: 150 }, { giveItem: 'herzscherbe' }],
  },

  // =========================================================================
  // Nebenquests - Miauport
  // =========================================================================

  q_fischvorrat: {
    id: 'q_fischvorrat',
    name: 'Salz und der Dieb',
    kind: 'side',
    region: 'miauport',
    summary:
      'Salz wurde ihr Wochenvorrat gestohlen. Sie weiss auch, von wem. Sie traut sich nur nicht, es zu sagen.',
    giver: 'fischerin_salz',
    steps: [
      { text: 'Finde heraus, wer gestohlen hat.', done: { flag: 'knopf_gestellt' }, hintArea: 'miauport_hafen' },
      { text: 'Bringe Salz ihren Vorrat zurueck.', done: { flag: 'fischvorrat_zurueck' }, hintArea: 'miauport_hafen' },
    ],
    rewards: [{ giveCoins: 80 }, { giveItem: 'schuppenhalsband' }],
  },

  q_wirt: {
    id: 'q_wirt',
    name: 'Was der Wirt gehoert hat',
    kind: 'side',
    region: 'miauport',
    summary: 'Schluck erzaehlt Geschichten. Eine davon stimmt.',
    giver: 'wirt_schluck',
    steps: [{ text: 'Ueberpruefe Schlucks Geruecht in der Schmugglerhoehle.', done: { flag: 'schluck_bestaetigt' }, hintArea: 'miauport_hoehle' }],
    rewards: [{ giveCoins: 70 }, { giveItem: 'tagebuchseite' }],
  },

  // =========================================================================
  // Nebenquests - Mondsee und spaeter
  // =========================================================================

  q_faehre: {
    id: 'q_faehre',
    name: 'Tropf und die Schleuse',
    kind: 'side',
    region: 'mondsee',
    summary: 'Tropf faehrt nicht, solange der Wasserstand nicht stimmt. Und er stimmt nie.',
    giver: 'faehrmann_tropf',
    steps: [{ text: 'Bringe die Schleuse auf den richtigen Stand.', done: { puzzleSolved: 'mondsee_wasserstand' }, hintArea: 'mondsee_schleuse' }],
    rewards: [{ giveCoins: 90 }, { giveItem: 'seelenfunke' }],
  },

  q_mira: {
    id: 'q_mira',
    name: 'Die Gefangene',
    kind: 'side',
    region: 'schloss',
    summary: 'Im Kerker sitzt jemand, der freiwillig hierhergekommen ist.',
    giver: 'gefangene_mira',
    steps: [{ text: 'Oeffne Miras Zelle.', done: { flag: 'mira_befreit' }, hintArea: 'schloss_kerker' }],
    rewards: [{ giveItem: 'nachthalsband' }, { giveItem: 'tagebuchseite' }],
  },

  q_tagebuch: {
    id: 'q_tagebuch',
    name: 'Nyxaras Tagebuch',
    kind: 'side',
    region: 'schloss',
    summary:
      'Folio sammelt die verstreuten Seiten. Wer alle findet, erfaehrt, was wirklich geschehen ist.',
    giver: 'bibliothekar_folio',
    steps: [{ text: 'Finde alle sieben Tagebuchseiten.', done: { hasItem: 'tagebuchseite', count: 7 } }],
    rewards: [
      { setFlag: 'folio_alles_gelesen' },
      { giveItem: 'mondstahlkralle' },
      { toast: 'Du kennst jetzt die ganze Geschichte.', kind: 'quest' },
    ],
  },
};

export const MAIN_QUEST_ORDER: QuestId[] = [
  'q_hauptquest_1',
  'q_hauptquest_2',
  'q_hauptquest_3',
  'q_hauptquest_4',
  'q_hauptquest_5',
  'q_hauptquest_6',
  'q_hauptquest_7',
];

export function getQuest(id: QuestId): QuestDef | undefined {
  return QUESTS[id];
}
