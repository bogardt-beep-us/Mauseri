/**
 * Die Bewohner Miauriens.
 *
 * Jeder wichtige NPC hat Namen, Aussehen, Rolle und eigene Dialoge. Die
 * Dialogliste wird von oben nach unten geprueft - der erste Eintrag, dessen
 * Bedingung erfuellt ist, gewinnt. Deshalb stehen spezielle Zustaende (Quest
 * abgeschlossen, Story fortgeschritten) immer VOR dem allgemeinen Standardtext.
 */

import type { NpcDef } from './types';

export const NPCS: Record<string, NpcDef> = {
  // =========================================================================
  // Miezlingen
  // =========================================================================

  brummel: {
    id: 'brummel',
    name: 'Brummel',
    role: 'Baecker von Miezlingen',
    look: {
      fur: 0xd8b48a,
      furDark: 0xb08a5e,
      belly: 0xfff0d2,
      eye: 0x5a4a2a,
      pattern: 'plain',
      accessory: 'apron',
      accessoryColor: 0xf0e0c0,
      scale: 1.08,
    },
    dialogue: [
      { showIf: { flag: 'brummel_brot_gebracht' }, node: 'brummel_danach' },
      { showIf: { questState: 'q_brot', state: 'active' }, node: 'brummel_wartet' },
      { showIf: { flag: 'prolog_nebel_gesehen' }, node: 'brummel_nebel' },
      { node: 'brummel_standard' },
    ],
  },

  oma_hetta: {
    id: 'oma_hetta',
    name: 'Oma Hetta',
    role: 'Behauptet, eine Abenteurerin gewesen zu sein',
    look: {
      fur: 0xc8c4bc,
      furDark: 0x9a968e,
      belly: 0xf4f2ee,
      eye: 0x6a7a5a,
      pattern: 'spots',
      accessory: 'cloak',
      accessoryColor: 0x7a5a8a,
      scale: 0.95,
    },
    dialogue: [
      { showIf: { bossDefeated: 'nyxara' }, node: 'hetta_ende' },
      { showIf: { hasAbility: 'mondkralle' }, node: 'hetta_stolz' },
      { showIf: { questState: 'q_glocke', state: 'completed' }, node: 'hetta_glocke_fertig' },
      { showIf: { questState: 'q_glocke', state: 'active' }, node: 'hetta_glocke_aktiv' },
      { showIf: { flag: 'prolog_nebel_gesehen' }, node: 'hetta_nebel' },
      { node: 'hetta_standard' },
    ],
  },

  fips: {
    id: 'fips',
    name: 'Fips',
    role: 'Kind, verliert staendig Dinge',
    look: {
      fur: 0xe8a44f,
      furDark: 0xc07c30,
      belly: 0xfff4dc,
      eye: 0x3a6a8a,
      pattern: 'stripes',
      scale: 0.76,
    },
    dialogue: [
      { showIf: { questState: 'q_spielzeugmaus', state: 'completed' }, node: 'fips_danke' },
      { showIf: { hasItem: 'spielzeugmaus' }, node: 'fips_gefunden' },
      { showIf: { questState: 'q_spielzeugmaus', state: 'active' }, node: 'fips_wartet' },
      { node: 'fips_standard' },
    ],
  },

  mutter_lina: {
    id: 'mutter_lina',
    name: 'Lina',
    role: 'Mauseris Mutter',
    look: {
      fur: 0xe0a862,
      furDark: 0xb8813e,
      belly: 0xfff0d2,
      eye: 0x2e5e3a,
      pattern: 'stripes',
      accessory: 'scarf',
      accessoryColor: 0x6f9ec4,
    },
    dialogue: [
      { showIf: { bossDefeated: 'nyxara' }, node: 'lina_ende' },
      { showIf: { flag: 'kapitel_2' }, node: 'lina_sorge' },
      { showIf: { flag: 'prolog_nebel_gesehen' }, node: 'lina_nebel' },
      { node: 'lina_start' },
    ],
  },

  haendler_kork: {
    id: 'haendler_kork',
    name: 'Kork',
    role: 'Dorfhaendler, uebertreibt masslos',
    look: {
      fur: 0x9a8a70,
      furDark: 0x6e6250,
      belly: 0xd8ceb8,
      eye: 0x8a6a2a,
      pattern: 'patch',
      accessory: 'hat',
      accessoryColor: 0x4a7d43,
    },
    shop: [
      { item: 'fischkeks', price: 8 },
      { item: 'mondbeere', price: 14 },
      { item: 'lederkralle', price: 40, stock: 1 },
      { item: 'stoffhalsband', price: 35, stock: 1 },
    ],
    dialogue: [
      { showIf: { flag: 'kork_geschichte_gehoert' }, node: 'kork_shop' },
      { node: 'kork_erstes_mal' },
    ],
  },

  wache_tobb: {
    id: 'wache_tobb',
    name: 'Tobb',
    role: 'Dorfwache, nimmt seine Aufgabe sehr ernst',
    look: {
      fur: 0x7a7284,
      furDark: 0x565062,
      belly: 0xc4bed0,
      eye: 0x8a5a2a,
      pattern: 'mask',
      accessory: 'bandana',
      accessoryColor: 0x8a4a4a,
      scale: 1.1,
    },
    dialogue: [
      { showIf: { flag: 'kapitel_2' }, node: 'tobb_weg_frei' },
      { showIf: { flag: 'prolog_nebel_gesehen' }, node: 'tobb_nebel' },
      { node: 'tobb_standard' },
    ],
  },

  verschwundener_murr: {
    id: 'verschwundener_murr',
    name: 'Murr',
    role: 'Der verschwundene Bewohner',
    look: {
      fur: 0xb08a5e,
      furDark: 0x846238,
      belly: 0xe8dcc4,
      eye: 0x4a6a4a,
      pattern: 'plain',
      scale: 1.02,
    },
    dialogue: [
      { showIf: { flag: 'murr_gerettet' }, node: 'murr_gerettet' },
      { node: 'murr_gefunden' },
    ],
  },

  // =========================================================================
  // Schnurrwald
  // =========================================================================

  einsiedler_moos: {
    id: 'einsiedler_moos',
    name: 'Moos',
    role: 'Einsiedler am Waldrand',
    look: {
      fur: 0x6a7a5a,
      furDark: 0x4a5a3e,
      belly: 0xb8c4a4,
      eye: 0xc8a020,
      pattern: 'spots',
      accessory: 'cloak',
      accessoryColor: 0x3f5636,
      scale: 1.05,
    },
    dialogue: [
      { showIf: { hasAbility: 'kratzsprung' }, node: 'moos_nach_lehre' },
      { showIf: { flag: 'moos_getroffen' }, node: 'moos_lehre' },
      { node: 'moos_erstes_mal' },
    ],
  },

  geist_taute: {
    id: 'geist_taute',
    name: 'Taute',
    role: 'Ein Geist, der seinen Namen vergessen hat',
    look: {
      fur: 0xb0c8d8,
      furDark: 0x7a94a8,
      belly: 0xdcecf4,
      eye: 0x9fe0ff,
      pattern: 'plain',
      scale: 0.94,
    },
    dialogue: [
      { showIf: { questState: 'q_geist', state: 'completed' }, node: 'taute_erloest' },
      { showIf: { hasItem: 'gluecksbringer' }, node: 'taute_muschel' },
      { showIf: { questState: 'q_geist', state: 'active' }, node: 'taute_wartet' },
      { node: 'taute_erstes_mal' },
    ],
  },

  foerster_bork: {
    id: 'foerster_bork',
    name: 'Bork',
    role: 'Waldhueter, seit Wochen ohne Schlaf',
    look: {
      fur: 0x8a6a4a,
      furDark: 0x644a32,
      belly: 0xc4ac8c,
      eye: 0x6a8a4a,
      pattern: 'stripes',
      accessory: 'hat',
      accessoryColor: 0x5a4a32,
    },
    dialogue: [
      { showIf: { bossDefeated: 'dornenkater' }, node: 'bork_danach' },
      { showIf: { questState: 'q_laterne', state: 'completed' }, node: 'bork_laterne_fertig' },
      { showIf: { questState: 'q_laterne', state: 'active' }, node: 'bork_laterne_aktiv' },
      { node: 'bork_standard' },
    ],
  },

  // =========================================================================
  // Kratzfels
  // =========================================================================

  schmiedin_ambra: {
    id: 'schmiedin_ambra',
    name: 'Ambra',
    role: 'Schmiedin von Kratzfels',
    look: {
      fur: 0x8a5a4a,
      furDark: 0x643e32,
      belly: 0xc4a08a,
      eye: 0xd88a20,
      pattern: 'patch',
      accessory: 'apron',
      accessoryColor: 0x6a5a4a,
      scale: 1.12,
    },
    shop: [
      { item: 'eisenkralle', price: 110, stock: 1 },
      { item: 'fischkeks', price: 9 },
      { item: 'heilmilch', price: 26 },
      { item: 'schuppenhalsband', price: 130, stock: 1 },
    ],
    dialogue: [
      { showIf: { questState: 'q_minen', state: 'completed' }, node: 'ambra_dankbar' },
      { showIf: { questState: 'q_minen', state: 'active' }, node: 'ambra_wartet' },
      { node: 'ambra_standard' },
    ],
  },

  bergmann_stoll: {
    id: 'bergmann_stoll',
    name: 'Stoll',
    role: 'Bergmann, kennt jeden Stollen',
    look: {
      fur: 0x74706a,
      furDark: 0x504c48,
      belly: 0xa8a49c,
      eye: 0xc8c020,
      pattern: 'plain',
      accessory: 'hat',
      accessoryColor: 0xd8a020,
    },
    dialogue: [
      { showIf: { puzzleSolved: 'kratzfels_mine' }, node: 'stoll_beeindruckt' },
      { showIf: { hasItem: 'minenschluessel' }, node: 'stoll_schluessel' },
      { node: 'stoll_standard' },
    ],
  },

  arenameister_grimm: {
    id: 'arenameister_grimm',
    name: 'Grimm',
    role: 'Meister der Kampfstaette',
    look: {
      fur: 0x4a4650,
      furDark: 0x2e2c34,
      belly: 0x8a8694,
      eye: 0xd85f5f,
      pattern: 'mask',
      accessory: 'scarf',
      accessoryColor: 0x8a2a2a,
      scale: 1.16,
    },
    dialogue: [
      { showIf: { flag: 'arena_gewonnen' }, node: 'grimm_sieger' },
      { showIf: { flag: 'arena_gestartet' }, node: 'grimm_laeuft' },
      { node: 'grimm_einladung' },
    ],
  },

  // =========================================================================
  // Miauport
  // =========================================================================

  kapitaenin_welle: {
    id: 'kapitaenin_welle',
    name: 'Welle',
    role: 'Kapitaenin, faehrt niemanden umsonst',
    look: {
      fur: 0x5a7a8a,
      furDark: 0x3e5a68,
      belly: 0xa8c4d0,
      eye: 0x20a0c8,
      pattern: 'stripes',
      accessory: 'hat',
      accessoryColor: 0x2a4a6a,
      scale: 1.08,
    },
    dialogue: [
      { showIf: { flag: 'ueberfahrt_bezahlt' }, node: 'welle_bereit' },
      { showIf: { questState: 'q_fischvorrat', state: 'completed' }, node: 'welle_angebot' },
      { node: 'welle_standard' },
    ],
  },

  fischerin_salz: {
    id: 'fischerin_salz',
    name: 'Salz',
    role: 'Fischerin, bestohlen worden',
    look: {
      fur: 0xa8b0b8,
      furDark: 0x7a848c,
      belly: 0xdce4ea,
      eye: 0x4a8aa0,
      pattern: 'spots',
      accessory: 'bandana',
      accessoryColor: 0x4f86a8,
    },
    dialogue: [
      { showIf: { questState: 'q_fischvorrat', state: 'completed' }, node: 'salz_dankbar' },
      { showIf: { hasItem: 'fischvorrat' }, node: 'salz_zurueck' },
      { showIf: { questState: 'q_fischvorrat', state: 'active' }, node: 'salz_wartet' },
      { node: 'salz_standard' },
    ],
  },

  wirt_schluck: {
    id: 'wirt_schluck',
    name: 'Schluck',
    role: 'Wirt der Taverne "Zum nassen Fell"',
    look: {
      fur: 0xc09050,
      furDark: 0x8e6634,
      belly: 0xe8d0a8,
      eye: 0x6a4a2a,
      pattern: 'patch',
      accessory: 'apron',
      accessoryColor: 0xd8c4a0,
      scale: 1.14,
    },
    shop: [
      { item: 'heilmilch', price: 24 },
      { item: 'sardinendose', price: 16 },
      { item: 'mondbeere', price: 13 },
    ],
    dialogue: [
      { showIf: { flag: 'schluck_geruecht_gehoert' }, node: 'schluck_shop' },
      { node: 'schluck_gerucht' },
    ],
  },

  schmuggler_knopf: {
    id: 'schmuggler_knopf',
    name: 'Knopf',
    role: 'Verkauft, was ihm nicht gehoert',
    look: {
      fur: 0x4a5a4a,
      furDark: 0x2e3a2e,
      belly: 0x8a9a8a,
      eye: 0xc8c020,
      pattern: 'mask',
      accessory: 'cloak',
      accessoryColor: 0x2a3a2a,
      scale: 0.96,
    },
    dialogue: [
      { showIf: { flag: 'knopf_gestellt' }, node: 'knopf_gestellt' },
      { node: 'knopf_erstes_mal' },
    ],
  },

  // =========================================================================
  // Mondsee
  // =========================================================================

  seherin_luna: {
    id: 'seherin_luna',
    name: 'Luna',
    role: 'Huterin des Mondsees',
    look: {
      fur: 0xd8dce8,
      furDark: 0xa8aec4,
      belly: 0xf4f6fc,
      eye: 0x8a6ad0,
      pattern: 'plain',
      accessory: 'cloak',
      accessoryColor: 0x5f6f9c,
      scale: 1.04,
    },
    dialogue: [
      { showIf: { hasItem: 'nachtherz' }, node: 'luna_herz' },
      { showIf: { bossDefeated: 'spiegelkatze' }, node: 'luna_nach_spiegel' },
      { showIf: { flag: 'luna_getroffen' }, node: 'luna_aufgabe' },
      { node: 'luna_erstes_mal' },
    ],
  },

  faehrmann_tropf: {
    id: 'faehrmann_tropf',
    name: 'Tropf',
    role: 'Bringt Reisende ueber den See - manchmal',
    look: {
      fur: 0x6a8a94,
      furDark: 0x4a6670,
      belly: 0xb0c8d0,
      eye: 0x40c0d8,
      pattern: 'stripes',
      accessory: 'hat',
      accessoryColor: 0x3a5a64,
    },
    dialogue: [
      { showIf: { puzzleSolved: 'mondsee_wasserstand' }, node: 'tropf_frei' },
      { node: 'tropf_standard' },
    ],
  },

  // =========================================================================
  // Schattenlande
  // =========================================================================

  ueberlebende_ascha: {
    id: 'ueberlebende_ascha',
    name: 'Ascha',
    role: 'Letzte Bewohnerin eines verlassenen Dorfes',
    look: {
      fur: 0x6a6270,
      furDark: 0x484252,
      belly: 0x9a94a4,
      eye: 0xd8a020,
      pattern: 'patch',
      accessory: 'cloak',
      accessoryColor: 0x3e364c,
    },
    dialogue: [
      { showIf: { flag: 'ascha_wahrheit' }, node: 'ascha_wahrheit' },
      { showIf: { flag: 'ascha_getroffen' }, node: 'ascha_erzaehlt' },
      { node: 'ascha_erstes_mal' },
    ],
  },

  schattenwache_orin: {
    id: 'schattenwache_orin',
    name: 'Orin',
    role: 'Eine Wache, die sich erinnert',
    look: {
      fur: 0x3e3850,
      furDark: 0x272238,
      belly: 0x6a6280,
      eye: 0xa77fd8,
      pattern: 'mask',
      accessory: 'cloak',
      accessoryColor: 0x2d2643,
      scale: 1.12,
    },
    dialogue: [
      { showIf: { flag: 'orin_befreit' }, node: 'orin_befreit' },
      { node: 'orin_erstes_mal' },
    ],
  },

  // =========================================================================
  // Schloss Nyxara
  // =========================================================================

  bibliothekar_folio: {
    id: 'bibliothekar_folio',
    name: 'Folio',
    role: 'Bibliothekar, seit Jahren allein',
    look: {
      fur: 0x8a7c94,
      furDark: 0x645a70,
      belly: 0xc0b8cc,
      eye: 0x6a8a4a,
      pattern: 'spots',
      accessory: 'glasses',
      accessoryColor: 0x2a2a3a,
      scale: 0.98,
    },
    dialogue: [
      { showIf: { flag: 'folio_alles_gelesen' }, node: 'folio_alles' },
      { showIf: { flag: 'folio_getroffen' }, node: 'folio_erzaehlt' },
      { node: 'folio_erstes_mal' },
    ],
  },

  gefangene_mira: {
    id: 'gefangene_mira',
    name: 'Mira',
    role: 'Gefangene im Kerker',
    look: {
      fur: 0xc8a878,
      furDark: 0x9a7c50,
      belly: 0xe8d8b8,
      eye: 0x4a8a6a,
      pattern: 'stripes',
      scale: 0.94,
    },
    dialogue: [
      { showIf: { flag: 'mira_befreit' }, node: 'mira_befreit' },
      { node: 'mira_gefangen' },
    ],
  },

  // =========================================================================
  // Erzaehlerische Sonderfiguren
  // =========================================================================

  nyxara: {
    id: 'nyxara',
    name: 'Nyxara',
    role: 'Koenigin von Miaurien',
    look: {
      fur: 0x2e2840,
      furDark: 0x1a1628,
      belly: 0x5a5070,
      eye: 0xd8a0ff,
      pattern: 'mask',
      accessory: 'crown',
      accessoryColor: 0xffd98a,
      scale: 1.2,
    },
    dialogue: [{ node: 'nyxara_thron' }],
  },

  nyxara_erinnerung: {
    id: 'nyxara_erinnerung',
    name: 'Nyxara',
    role: 'Wie sie einmal war',
    look: {
      fur: 0x6a5c8c,
      furDark: 0x4a3f6a,
      belly: 0xc0b0e0,
      eye: 0x9fe0a0,
      pattern: 'plain',
      accessory: 'crown',
      accessoryColor: 0xffd98a,
      scale: 1.16,
    },
    dialogue: [{ node: 'nyxara_erinnerung_1' }],
  },
};

export function getNpc(id: string): NpcDef | undefined {
  return NPCS[id];
}
