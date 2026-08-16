/**
 * Dialoge in Miauport.
 *
 * Die lauteste Region. Hier reden alle viel und meinen die Haelfte. Knopf ist
 * der erste Dieb im Spiel, der kein Boesewicht ist - nur jemand, der zu lange
 * niemanden hatte, der nachfragt.
 */

import type { DialogueNode } from '../types';

export const MIAUPORT_DIALOGUES: Record<string, DialogueNode> = {
  miauport_ankunft_1: {
    id: 'miauport_ankunft_1',
    lines: [
      { speaker: 'erzaehler', text: 'Miauport riecht nach Salz, Fisch und irgendetwas Gebratenem.' },
      { speaker: 'pookie', text: 'Mauseri. MAUSERI. Es gibt hier GEBRATENES.', mood: 'happy' },
      { speaker: 'mauseri', text: 'Wir sind wegen der Ueberfahrt hier.' },
      { speaker: 'pookie', text: 'Wir koennen wegen der Ueberfahrt hier sein UND etwas essen.' },
      { speaker: 'pookie', text: 'Das schliesst sich nicht aus. Das ist elementare Logik.', mood: 'sly' },
      { speaker: 'erzaehler', text: 'Am Kai liegt ein einziges Schiff. Es ist festgemacht wie etwas, das lange nicht ausgelaufen ist.' },
    ],
  },

  // --- Welle ---------------------------------------------------------------
  welle_standard: {
    id: 'welle_standard',
    lines: [
      { speaker: 'kapitaenin_welle', text: 'Nein.' },
      { speaker: 'mauseri', text: 'Ich hab noch nichts gefragt.' },
      { speaker: 'kapitaenin_welle', text: 'Du willst zum Mondsee. Alle wollen zum Mondsee.' },
      { speaker: 'kapitaenin_welle', text: 'Und die Antwort ist nein, solange die Untiefe zu ist.' },
      { speaker: 'kapitaenin_welle', text: 'Da unten sitzt was, das meine Kiele frisst. Zwei Boote. Zwei.', mood: 'angry' },
      { speaker: 'kapitaenin_welle', text: 'Raeum das aus, dann faehrst du. Umsonst faehrt hier keiner, aber dafuer schon.' },
    ],
    effects: [{ startQuest: 'q_hauptquest_4' }],
  },

  welle_angebot: {
    id: 'welle_angebot',
    lines: [
      { speaker: 'kapitaenin_welle', text: 'Salz hat erzaehlt, was du fuer sie getan hast.' },
      { speaker: 'kapitaenin_welle', text: 'Das heisst nichts fuer die Untiefe. Aber es heisst was fuer mich.' },
      { speaker: 'kapitaenin_welle', text: 'Raeum sie aus. Dann leg ich ab, und zwar sofort.' },
    ],
  },

  welle_bereit: {
    id: 'welle_bereit',
    lines: [
      { speaker: 'kapitaenin_welle', text: 'Leinen los.', mood: 'happy' },
      { speaker: 'kapitaenin_welle', text: 'Zum Mondsee also. Ich war seit sechs Jahren nicht mehr da.' },
      { speaker: 'kapitaenin_welle', text: 'Damals hat der See noch den Himmel gespiegelt.' },
      { speaker: 'pookie', text: 'Und heute?', mood: 'scared' },
      { speaker: 'kapitaenin_welle', text: 'Guck selbst. Ich guck nicht mehr hin.' },
    ],
  },

  // --- Salz ----------------------------------------------------------------
  salz_standard: {
    id: 'salz_standard',
    lines: [
      { speaker: 'fischerin_salz', text: 'Mein Wochenvorrat ist weg. Der ganze.', mood: 'sad' },
      { speaker: 'mauseri', text: 'Gestohlen?' },
      { speaker: 'fischerin_salz', text: 'Ja.' },
      { speaker: 'mauseri', text: 'Wissen Sie, von wem?' },
      { speaker: 'fischerin_salz', text: '...', mood: 'sad' },
      { speaker: 'fischerin_salz', text: 'Nein.' },
      { speaker: 'pookie', text: 'Das war das langsamste Nein, das ich je gehoert hab.', mood: 'sly' },
      { speaker: 'fischerin_salz', text: 'Der Kleine ist zu clever.', mood: 'sad' },
      { speaker: 'fischerin_salz', text: 'Ich weiss es. Ich sag es nur nicht, weil er es braucht und ich nicht.' },
      { speaker: 'fischerin_salz', text: 'Aber es war MEIN Vorrat, und irgendwann ist auch mal gut.' },
    ],
    effects: [{ startQuest: 'q_fischvorrat' }],
  },

  salz_wartet: {
    id: 'salz_wartet',
    lines: [
      { speaker: 'fischerin_salz', text: 'Er treibt sich am oestlichen Kai rum. Und in der Hoehle.' },
      { speaker: 'fischerin_salz', text: 'Sei nicht zu hart zu ihm. Bitte.' },
    ],
  },

  salz_zurueck: {
    id: 'salz_zurueck',
    lines: [
      { speaker: 'fischerin_salz', text: 'Mein Netz.', mood: 'happy' },
      { speaker: 'fischerin_salz', text: 'Hat er was gesagt?' },
      { speaker: 'mauseri', text: 'Dass es ihm leidtut. Und dass er nicht wusste, wie er fragen soll.' },
      { speaker: 'fischerin_salz', text: 'Fragen.', mood: 'sad' },
      { speaker: 'fischerin_salz', text: 'Ich haette ihm die Haelfte gegeben. Er haette nur klopfen muessen.' },
      { speaker: 'fischerin_salz', text: 'Nimm das hier. Und sag ihm, er soll klopfen.' },
    ],
    effects: [
      { takeItem: 'fischvorrat' },
      { setFlag: 'fischvorrat_zurueck' },
      { completeQuest: 'q_fischvorrat' },
    ],
  },

  salz_dankbar: {
    id: 'salz_dankbar',
    lines: [
      { speaker: 'fischerin_salz', text: 'Er hat geklopft. Gestern Abend.', mood: 'happy' },
      { speaker: 'fischerin_salz', text: 'Wir haben zusammen gegessen. War komisch. War gut.' },
    ],
  },

  // --- Knopf ---------------------------------------------------------------
  knopf_erstes_mal: {
    id: 'knopf_erstes_mal',
    lines: [
      { speaker: 'schmuggler_knopf', text: 'Ich verkauf nichts. Ich hab nichts. Geh weiter.', mood: 'scared' },
      { speaker: 'mauseri', text: 'Sie haben ein Netz hinter dem Ruecken.' },
      { speaker: 'schmuggler_knopf', text: '...das ist meins.' },
      { speaker: 'mauseri', text: 'Da steht Salz drauf.' },
      { speaker: 'schmuggler_knopf', text: 'Das ist ein haeufiger Name.', mood: 'sly' },
      { speaker: 'pookie', text: 'Ist es nicht.', mood: 'neutral' },
      { speaker: 'schmuggler_knopf', text: 'Nein.', mood: 'sad' },
      { speaker: 'schmuggler_knopf', text: 'Nein, ist es nicht.' },
      { speaker: 'schmuggler_knopf', text: 'Ich hatte drei Wochen nichts. Und sie hat immer so viel.' },
      { speaker: 'schmuggler_knopf', text: 'Ich dachte, sie merkt es nicht.' },
      { speaker: 'mauseri', text: 'Warum haben Sie nicht gefragt?' },
      { speaker: 'schmuggler_knopf', text: 'Weil dann jemand nein sagen koennte.', mood: 'sad' },
      { speaker: 'schmuggler_knopf', text: 'Hier. Bring es zurueck. Ich kann ihr nicht ins Gesicht sehen.' },
    ],
    effects: [
      { setFlag: 'knopf_gestellt' },
      { giveItem: 'fischvorrat' },
      { advanceQuest: 'q_fischvorrat', step: 1 },
    ],
  },

  knopf_gestellt: {
    id: 'knopf_gestellt',
    lines: [
      { speaker: 'schmuggler_knopf', text: 'Sie hat mich zum Essen eingeladen.', mood: 'surprised' },
      { speaker: 'schmuggler_knopf', text: 'Ich versteh diese Stadt nicht.' },
      { speaker: 'schmuggler_knopf', text: 'Hier, nimm den. Ich hab ihn... gefunden. Wirklich gefunden diesmal.' },
    ],
    effects: [{ giveItem: 'schmugglerschluessel' }],
  },

  // --- Schluck -------------------------------------------------------------
  schluck_gerucht: {
    id: 'schluck_gerucht',
    lines: [
      { speaker: 'wirt_schluck', text: 'Setz dich. Nein, steh. Egal. Hoer zu.' },
      { speaker: 'wirt_schluck', text: 'Es gibt einen Gang unter dem Steg. Den kennt hier keiner.' },
      { speaker: 'pookie', text: 'Sie kennen ihn.', mood: 'sly' },
      { speaker: 'wirt_schluck', text: 'Ich bin Wirt, Kleiner. Ich kenne alles, was jemand nach dem dritten Krug sagt.' },
      { speaker: 'wirt_schluck', text: 'Da unten haben die Schmuggler gearbeitet. Frueher.' },
      { speaker: 'wirt_schluck', text: 'Bis etwas eingezogen ist, das keine Miete zahlt.' },
      { speaker: 'wirt_schluck', text: 'Guck es dir an. Und wenn du zurueckkommst, erzaehlst du es mir.' },
      { speaker: 'wirt_schluck', text: 'Das ist der Preis. Geschichten sind hier Waehrung.' },
    ],
    effects: [{ setFlag: 'schluck_geruecht_gehoert' }, { startQuest: 'q_wirt' }],
  },

  schluck_shop: {
    id: 'schluck_shop',
    lines: [
      { speaker: 'wirt_schluck', text: 'Was Warmes? Was Kaltes? Was, das die Erinnerung veraendert?' },
      { speaker: 'wirt_schluck', text: 'Das Letzte hab ich aus. Schon lange.' },
    ],
  },

  // --- Tiefenkralle --------------------------------------------------------
  tiefenkralle_erwacht_1: {
    id: 'tiefenkralle_erwacht_1',
    lines: [
      { speaker: 'erzaehler', text: 'Das Wasser in der Untiefe steht still. Zu still fuer eine Hoehle am Meer.' },
      { speaker: 'pookie', text: 'Mauseri. Das Wasser bewegt sich nicht, weil etwas drunter LIEGT.', mood: 'scared' },
      { speaker: 'erzaehler', text: 'Zwei Augen oeffnen sich unter der Oberflaeche. Dann noch zwei.' },
      { speaker: 'pookie', text: 'VIER. Das sind VIER.', mood: 'scared' },
      { speaker: 'mauseri', text: 'Es sind zwei. Das andere ist die Spiegelung.' },
      { speaker: 'pookie', text: 'Oh. Gut. Das ist... immer noch furchtbar.', mood: 'sad' },
    ],
  },
};
