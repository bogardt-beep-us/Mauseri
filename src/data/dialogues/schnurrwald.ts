/**
 * Dialoge im Schnurrwald.
 *
 * Hier lernt Mauseri die erste Faehigkeit - und der Spieler lernt, dass die
 * Welt aelter ist als das Problem. Moos erklaert nichts, er zeigt. Taute ist
 * die erste Figur, die etwas verloren hat, das nicht zurueckkommt.
 */

import type { DialogueNode } from '../types';

export const SCHNURRWALD_DIALOGUES: Record<string, DialogueNode> = {
  // --- Ankunft -------------------------------------------------------------
  wald_eintritt_1: {
    id: 'wald_eintritt_1',
    lines: [
      { speaker: 'erzaehler', text: 'Der Schnurrwald beginnt ohne Uebergang. Ein Schritt Wiese, ein Schritt Wald.' },
      { speaker: 'pookie', text: 'Hier ist es kaelter.', mood: 'scared' },
      { speaker: 'mauseri', text: 'Es ist Schatten, Pookie.' },
      { speaker: 'pookie', text: 'Schatten von WAS? Guck hoch. Da ist nichts, was Schatten wirft.', mood: 'scared' },
      { speaker: 'mauseri', text: '...', mood: 'neutral' },
      { speaker: 'pookie', text: 'Siehst du. Ich hab recht und das gefaellt mir kein bisschen.', mood: 'sad' },
    ],
  },

  tutorial_kampf_1: {
    id: 'tutorial_kampf_1',
    lines: [
      { speaker: 'pookie', text: 'Mauseri. MAUSERI. Da vorne bewegt sich was.', mood: 'scared' },
      { speaker: 'mauseri', text: 'Ich seh es.' },
      { speaker: 'pookie', text: 'Es sieht dich auch. Es sieht dich SEHR.', mood: 'scared' },
    ],
  },

  tutorial_kampf_2: {
    id: 'tutorial_kampf_2',
    lines: [
      { speaker: 'pookie', text: 'Okay. Okay okay okay. Du kannst das. Kralle raus, zuschlagen.' },
      { speaker: 'pookie', text: 'Und wenn es auf dich zukommt: WEG. Rollen. Zur Seite. Irgendwas.' },
      { speaker: 'mauseri', text: 'Danke, Pookie.' },
      { speaker: 'pookie', text: 'Ich bleib hier. Zur moralischen Unterstuetzung. Aus dieser Entfernung.', mood: 'scared' },
    ],
  },

  // --- Moos ----------------------------------------------------------------
  moos_erstes_mal: {
    id: 'moos_erstes_mal',
    lines: [
      { speaker: 'einsiedler_moos', text: 'Steh nicht so nah am Nebel.' },
      { speaker: 'mauseri', text: 'Wer sind Sie?' },
      { speaker: 'einsiedler_moos', text: 'Jemand, der lange genug hier ist, um das Wetter zu kennen.' },
      { speaker: 'einsiedler_moos', text: 'Und das hier ist kein Wetter.' },
      { speaker: 'pookie', text: 'Das sag ich die ganze Zeit!', mood: 'happy' },
      { speaker: 'einsiedler_moos', text: 'Dann hoer auf zu sagen und fang an zu gucken, Kleiner.' },
      { speaker: 'einsiedler_moos', text: 'Ihr wollt tiefer rein. Ich seh es an euren Pfoten.' },
      { speaker: 'einsiedler_moos', text: 'Dann braucht ihr mehr als Mut. Komm her.' },
    ],
    effects: [{ setFlag: 'moos_getroffen' }],
    then: 'moos_lehre',
  },

  moos_lehre: {
    id: 'moos_lehre',
    lines: [
      { speaker: 'einsiedler_moos', text: 'Jede Katze kann springen. Die meisten springen zu kurz, weil sie vorher denken.' },
      { speaker: 'einsiedler_moos', text: 'Der Kratzsprung ist einfach: du denkst nicht. Du bist schon drueben.' },
      { speaker: 'mauseri', text: 'Das klingt gefaehrlich.' },
      { speaker: 'einsiedler_moos', text: 'Ja. Deshalb ueben wir das an einem kleinen Absatz und nicht an einer Schlucht.' },
      { speaker: 'einsiedler_moos', text: 'Nimm es. Es gehoert dir schon laenger als mir.' },
      { speaker: 'erzaehler', text: 'Mauseri hat den Kratzsprung gelernt.' },
    ],
    effects: [
      { giveAbility: 'kratzsprung' },
      { toast: 'Kratzsprung erlernt', kind: 'ability' },
      { increaseMaxEnergy: 6 },
    ],
  },

  moos_nach_lehre: {
    id: 'moos_nach_lehre',
    lines: [
      { speaker: 'einsiedler_moos', text: 'Uebst du?' },
      { speaker: 'mauseri', text: 'Staendig.' },
      { speaker: 'einsiedler_moos', text: 'Gut. Faehigkeiten sind wie Wege. Wer sie nicht geht, verliert sie.' },
      { speaker: 'einsiedler_moos', text: 'Und noch was: Absaetze sind nicht das Einzige, worueber man springen kann.' },
      { speaker: 'einsiedler_moos', text: 'Manchmal sind es Luecken, die aussehen wie Waende.' },
    ],
  },

  // --- Taute ---------------------------------------------------------------
  taute_erstes_mal: {
    id: 'taute_erstes_mal',
    lines: [
      { speaker: 'erzaehler', text: 'Zwischen den Schreinen steht eine Katze. Man sieht die Steine durch sie hindurch.' },
      { speaker: 'pookie', text: 'MAUSERI.', mood: 'scared' },
      { speaker: 'geist_taute', text: 'Oh. Besuch.', mood: 'surprised' },
      { speaker: 'geist_taute', text: 'Das ist lange her. Wie lange, weiss ich nicht. Ich zaehle nicht mehr mit.' },
      { speaker: 'mauseri', text: 'Wer sind Sie?' },
      { speaker: 'geist_taute', text: 'Das ist genau die Frage.', mood: 'sad' },
      { speaker: 'geist_taute', text: 'Ich weiss noch, wie der Wald riecht. Ich weiss noch, wo mein Haus stand.' },
      { speaker: 'geist_taute', text: 'Meinen Namen weiss ich nicht mehr.', mood: 'sad' },
      { speaker: 'geist_taute', text: 'Ich hatte etwas. Eine Muschel, zerbrochen in zwei Haelften.' },
      { speaker: 'geist_taute', text: 'Eine hatte ich, eine hatte jemand anderes. So war das gemeint.' },
      { speaker: 'geist_taute', text: 'Findest du meine? Vielleicht faellt mir dann der Rest wieder ein.' },
    ],
    effects: [{ startQuest: 'q_geist' }],
  },

  taute_wartet: {
    id: 'taute_wartet',
    lines: [
      { speaker: 'geist_taute', text: 'Irgendwo hier. Ich hab sie nicht weit getragen.', mood: 'sad' },
      { speaker: 'geist_taute', text: 'Ich bin nie weit gekommen.' },
    ],
  },

  taute_muschel: {
    id: 'taute_muschel',
    lines: [
      { speaker: 'geist_taute', text: 'Da.', mood: 'surprised' },
      { speaker: 'geist_taute', text: 'Ja. Ja, die ist es.' },
      { speaker: 'geist_taute', text: 'Taute. Ich heisse Taute.', mood: 'happy' },
      { speaker: 'geist_taute', text: 'Und die andere Haelfte hatte meine Schwester. Sie ist damals weggegangen.' },
      { speaker: 'geist_taute', text: 'Ich hab gewartet. Ich hab so lange gewartet, dass ich vergessen hab, worauf.' },
      { speaker: 'mauseri', text: 'Was machen Sie jetzt?' },
      { speaker: 'geist_taute', text: 'Aufhoeren zu warten.', mood: 'happy' },
      { speaker: 'geist_taute', text: 'Nimm das hier. Ich brauch es nicht mehr, wo ich hingehe.' },
      { speaker: 'pookie', text: 'Wo gehst du denn hin?', mood: 'sad' },
      { speaker: 'geist_taute', text: 'Weiter, Kleiner. Endlich weiter.' },
    ],
    effects: [{ takeItem: 'gluecksbringer' }, { completeQuest: 'q_geist' }],
  },

  taute_erloest: {
    id: 'taute_erloest',
    lines: [
      { speaker: 'erzaehler', text: 'Zwischen den Schreinen ist es hell geworden. Ein wenig nur.' },
      { speaker: 'pookie', text: 'Ich hoffe, sie hat ihre Schwester gefunden.', mood: 'sad' },
      { speaker: 'mauseri', text: 'Ich auch.' },
    ],
  },

  // --- Bork ----------------------------------------------------------------
  bork_standard: {
    id: 'bork_standard',
    lines: [
      { speaker: 'foerster_bork', text: 'Ich huete diesen Wald seit vierzehn Jahren.', mood: 'sad' },
      { speaker: 'foerster_bork', text: 'Seit sechs Wochen huete ich etwas, das ich nicht mehr kenne.' },
      { speaker: 'foerster_bork', text: 'Die Wege stimmen nicht. Ich geh geradeaus und komm woanders raus.' },
      { speaker: 'pookie', text: 'Das ist das Unheimlichste, was ich heute gehoert hab.', mood: 'scared' },
      { speaker: 'foerster_bork', text: 'Warte, bis du es selbst machst, Kleiner.' },
      { speaker: 'foerster_bork', text: 'Ich hatte eine Laterne dafuer. Nebellicht. Zeigt den echten Weg.' },
      { speaker: 'foerster_bork', text: 'Hab sie verloren, als ich das letzte Mal zu tief gegangen bin.' },
    ],
    effects: [{ startQuest: 'q_laterne' }, { startQuest: 'q_hauptquest_2' }],
  },

  bork_laterne_aktiv: {
    id: 'bork_laterne_aktiv',
    lines: [
      { speaker: 'foerster_bork', text: 'Tief drin. Da, wo die Steine mit den Zeichen stehen.' },
      { speaker: 'foerster_bork', text: 'Ich bin gerannt. Ich schaeme mich nicht dafuer.' },
    ],
  },

  bork_laterne_fertig: {
    id: 'bork_laterne_fertig',
    lines: [
      { speaker: 'foerster_bork', text: 'Meine Laterne.', mood: 'happy' },
      { speaker: 'foerster_bork', text: 'Weisst du, was das Beste daran ist? Nicht das Licht.' },
      { speaker: 'foerster_bork', text: 'Dass jemand zurueckgegangen ist. Das hat lange keiner mehr gemacht.' },
    ],
    effects: [{ takeItem: 'laterne' }, { completeQuest: 'q_laterne' }],
  },

  bork_danach: {
    id: 'bork_danach',
    lines: [
      { speaker: 'foerster_bork', text: 'Die Wege stimmen wieder. Ich hab es dreimal geprueft.' },
      { speaker: 'foerster_bork', text: 'Beim vierten Mal hab ich einfach nur so gestanden und geguckt.', mood: 'happy' },
      { speaker: 'foerster_bork', text: 'Danke, Mauseri. Der Norden ist offen. Kratzfels wartet.' },
    ],
  },

  // --- Lichtung und Boss ---------------------------------------------------
  lichtung_ankunft_1: {
    id: 'lichtung_ankunft_1',
    lines: [
      { speaker: 'erzaehler', text: 'Die Lichtung ist kreisrund. Zu rund fuer einen Wald.' },
      { speaker: 'pookie', text: 'Drei Fackeln. Und keine brennt.' },
      { speaker: 'pookie', text: 'Mauseri... wenn wir die anzuenden, passiert was. Das weiss ich einfach.' },
      { speaker: 'mauseri', text: 'Ja.' },
      { speaker: 'pookie', text: 'Und wir machen es trotzdem.' },
      { speaker: 'mauseri', text: 'Ja.' },
      { speaker: 'pookie', text: 'Gut. Wollte nur sichergehen, dass wir uns einig sind.', mood: 'sly' },
    ],
  },

  dornenkater_erwacht_1: {
    id: 'dornenkater_erwacht_1',
    lines: [
      { speaker: 'erzaehler', text: 'Die drei Flammen schlagen zusammen. Der Boden in der Mitte reisst auf.' },
      { speaker: 'pookie', text: 'DAS WAR ES! DAS MEINTE ICH!', mood: 'scared' },
      { speaker: 'stimme', text: 'Wer weckt den Hain?' },
      { speaker: 'mauseri', text: 'Ich.' },
      { speaker: 'stimme', text: 'Dann bleib da.' },
    ],
  },
};
