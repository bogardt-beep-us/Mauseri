/**
 * Dialoge vor und nach den Bosskaempfen.
 *
 * Regel fuer diese Texte: kein Boss ist einfach nur boese. Jeder sagt einen
 * Satz, der nachwirkt - meistens erst, wenn man ihn besiegt hat. Der letzte
 * Boss vor Nyxara sagt sogar die Wahrheit.
 */

import type { DialogueNode } from '../types';

export const BOSSE_DIALOGUES: Record<string, DialogueNode> = {
  // --- Dornenkater ---------------------------------------------------------
  boss_dornenkater_intro: {
    id: 'boss_dornenkater_intro',
    lines: [
      { speaker: 'stimme', text: 'Ich bewache diesen Hain, seit er noch gruen war.' },
      { speaker: 'mauseri', text: 'Er ist nicht mehr gruen.' },
      { speaker: 'stimme', text: 'Nein. Aber ich bewache ihn trotzdem.' },
      { speaker: 'stimme', text: 'Das ist es doch, was Bewachen heisst.' },
    ],
  },

  boss_dornenkater_outro: {
    id: 'boss_dornenkater_outro',
    lines: [
      { speaker: 'stimme', text: 'Du hast gewonnen.', mood: 'sad' },
      { speaker: 'stimme', text: 'Gut. Ich bin so muede.' },
      { speaker: 'mauseri', text: 'Wer hat dich hierhergestellt?' },
      { speaker: 'stimme', text: 'Niemand. Ich bin geblieben, als alle gegangen sind.' },
      { speaker: 'stimme', text: 'Der Nebel hat mich gefunden und einen Waechter aus mir gemacht.' },
      { speaker: 'stimme', text: 'Er macht aus jedem das, was er ohnehin schon war.' },
      { speaker: 'erzaehler', text: 'Die Dornen sinken in den Boden. Auf der Lichtung waechst etwas Gruenes.' },
    ],
  },

  // --- Grubenherz ----------------------------------------------------------
  boss_grubenherz_intro: {
    id: 'boss_grubenherz_intro',
    lines: [
      { speaker: 'stimme', text: 'Ihr grabt seit vierhundert Jahren.' },
      { speaker: 'stimme', text: 'Ich habe geschlafen und es ertragen.' },
      { speaker: 'stimme', text: 'Dann kam etwas von oben in den Stein und hat mich geweckt.' },
      { speaker: 'mauseri', text: 'Der Nebel.' },
      { speaker: 'stimme', text: 'Nennt es, wie ihr wollt. Ich bin wach. Das ist euer Problem.' },
    ],
  },

  boss_grubenherz_outro: {
    id: 'boss_grubenherz_outro',
    lines: [
      { speaker: 'stimme', text: 'Zurueck in den Stein also.' },
      { speaker: 'stimme', text: 'Kleine Katze. Eine Frage, bevor ich schlafe.' },
      { speaker: 'stimme', text: 'Warum gehst du nach Norden?' },
      { speaker: 'mauseri', text: 'Weil jemand aufgehalten werden muss.' },
      { speaker: 'stimme', text: 'Aufgehalten.', mood: 'sad' },
      { speaker: 'stimme', text: 'Ich haette gesagt: gefunden.' },
      { speaker: 'stimme', text: 'Das ist nicht dasselbe. Denk darueber nach, wenn du oben bist.' },
    ],
  },

  // --- Tiefenkralle --------------------------------------------------------
  boss_tiefenkralle_intro: {
    id: 'boss_tiefenkralle_intro',
    lines: [
      { speaker: 'stimme', text: 'Zwei Boote.' },
      { speaker: 'stimme', text: 'Und in beiden waren Netze, in denen mein Wasser fehlte.' },
      { speaker: 'pookie', text: 'Sie redet ueber Fischerei. Wir werden von einem BERUFSSTREIT gefressen.', mood: 'scared' },
    ],
  },

  boss_tiefenkralle_outro: {
    id: 'boss_tiefenkralle_outro',
    lines: [
      { speaker: 'stimme', text: 'Nimm den Gang. Ich halte ihn nicht mehr.' },
      { speaker: 'stimme', text: 'Und sag der Kapitaenin, sie soll die Netze enger machen.' },
      { speaker: 'stimme', text: 'Dann muss ich nicht wieder hoch.' },
      { speaker: 'pookie', text: 'Das war... eine sehr vernuenftige Forderung.', mood: 'surprised' },
    ],
  },

  // --- Spiegelkatze --------------------------------------------------------
  boss_spiegelkatze_intro: {
    id: 'boss_spiegelkatze_intro',
    lines: [
      { speaker: 'stimme', text: 'Sieh mich an.' },
      { speaker: 'stimme', text: 'Ich bin jeder Schritt, den du nicht gegangen bist.' },
      { speaker: 'stimme', text: 'Ich bin sehr gross geworden.' },
    ],
  },

  boss_spiegelkatze_outro: {
    id: 'boss_spiegelkatze_outro',
    lines: [
      { speaker: 'stimme', text: 'Du hast dich geschlagen.', mood: 'sad' },
      { speaker: 'mauseri', text: 'Nein. Ich hab aufgehoert, dich anzusehen.' },
      { speaker: 'stimme', text: '...' },
      { speaker: 'stimme', text: 'Das ist schlimmer.' },
      { speaker: 'erzaehler', text: 'Der Mondstrahl bleibt auf dem Altar stehen. Zum ersten Mal wirft er keinen zweiten Schatten.' },
      { speaker: 'pookie', text: 'Mauseri? Du guckst komisch.', mood: 'scared' },
      { speaker: 'mauseri', text: 'Sie hatte in einem Punkt recht.' },
      { speaker: 'pookie', text: 'In welchem?' },
      { speaker: 'mauseri', text: 'Sag ich dir spaeter.' },
    ],
  },

  // --- Nebelfuerst ---------------------------------------------------------
  boss_nebelfuerst_intro: {
    id: 'boss_nebelfuerst_intro',
    lines: [
      { speaker: 'stimme', text: 'Sie hat mich nicht gemacht. Das ist wichtig.' },
      { speaker: 'stimme', text: 'Sie hat mich nur weggelegt. Immer wieder. Jahr um Jahr.' },
      { speaker: 'stimme', text: 'Und irgendwann war der Stapel gross genug, um aufzustehen.' },
    ],
  },

  boss_nebelfuerst_outro: {
    id: 'boss_nebelfuerst_outro',
    lines: [
      { speaker: 'stimme', text: 'Du kannst mich nicht toeten.', mood: 'sad' },
      { speaker: 'stimme', text: 'Ich bin nicht lebendig. Ich bin nur nicht aufgeraeumt.' },
      { speaker: 'mauseri', text: 'Dann raeum ich auf.' },
      { speaker: 'stimme', text: 'Du?' },
      { speaker: 'stimme', text: 'Du bist eine Katze aus einem Dorf.' },
      { speaker: 'mauseri', text: 'Ja.' },
      { speaker: 'mauseri', text: 'Und ich frag sie, ob sie Hilfe braucht.' },
      { speaker: 'stimme', text: '...', mood: 'surprised' },
      { speaker: 'stimme', text: 'Das hat noch nie jemand versucht.' },
      { speaker: 'erzaehler', text: 'Der Nebel faellt in sich zusammen. Im Norden wird ein Tor sichtbar.' },
    ],
  },

  // --- Nyxara --------------------------------------------------------------
  boss_nyxara_intro: {
    id: 'boss_nyxara_intro',
    lines: [
      { speaker: 'erzaehler', text: 'Der Thronsaal ist leer bis auf eine Gestalt, die nicht auf dem Thron sitzt, sondern davor.' },
      { speaker: 'nyxara', text: 'Ihr habt es bis hierher geschafft.' },
      { speaker: 'nyxara', text: 'Das freut mich. Das ist das Problem.' },
      { speaker: 'mauseri', text: 'Warum?' },
      { speaker: 'nyxara', text: 'Weil ich mich seit sechs Jahren ueber nichts mehr gefreut hab.', mood: 'sad' },
      { speaker: 'nyxara', text: 'Und ich kann es mir nicht leisten, jetzt damit anzufangen.' },
      { speaker: 'nyxara', text: 'Geht zurueck. Bitte.' },
      { speaker: 'mauseri', text: 'Nein.' },
      { speaker: 'nyxara', text: 'Dann tut mir das hier wirklich leid.', mood: 'sad' },
    ],
  },

  boss_nyxara_outro: {
    id: 'boss_nyxara_outro',
    lines: [
      { speaker: 'erzaehler', text: 'Nyxara geht in die Knie. Das Herz der Nacht faellt zwischen sie.' },
      { speaker: 'nyxara', text: 'Es hoert nicht auf.', mood: 'sad' },
      { speaker: 'nyxara', text: 'Ich habe alles versucht. Alles.' },
      { speaker: 'nyxara', text: 'Und du kommst hier rein und denkst, du haettest eine Idee.' },
      { speaker: 'mauseri', text: 'Ich hab keine Idee.' },
      { speaker: 'mauseri', text: 'Ich hab nur nicht vor, wieder rauszugehen.' },
      { speaker: 'nyxara', text: '...', mood: 'surprised' },
      { speaker: 'pookie', text: 'Sie meint das ernst. Sie ist furchtbar stur.', mood: 'happy' },
      { speaker: 'pookie', text: 'Ich weiss das. Ich hab es sechs Regionen lang versucht.' },
    ],
  },

  // --- Der Namenlose (optionaler Boss) -------------------------------------
  boss_namenlos_intro: {
    id: 'boss_namenlos_intro',
    lines: [
      { speaker: 'stimme', text: 'Du hast alle sieben Seiten gelesen.' },
      { speaker: 'stimme', text: 'Dann weisst du, dass der Riss aelter ist als sie.' },
      { speaker: 'stimme', text: 'Ich war der davor. Ich hab es dreihundert Jahre gehalten.' },
      { speaker: 'mauseri', text: 'Und dann?' },
      { speaker: 'stimme', text: 'Dann kam ein Kind an den See und hat mich abgeloest.' },
      { speaker: 'stimme', text: 'Ich hab es zugelassen. Ich war so froh.' },
      { speaker: 'stimme', text: 'Das ist die Sache, fuer die ich mich nie verziehen hab.' },
    ],
  },

  boss_namenlos_outro: {
    id: 'boss_namenlos_outro',
    lines: [
      { speaker: 'stimme', text: 'Geh zu ihr.', mood: 'sad' },
      { speaker: 'stimme', text: 'Und mach nicht, was ich gemacht hab.' },
      { speaker: 'mauseri', text: 'Was haben Sie gemacht?' },
      { speaker: 'stimme', text: 'Ich hab weitergegeben statt geteilt.' },
      { speaker: 'stimme', text: 'Das sieht sich sehr aehnlich und ist das Gegenteil.' },
    ],
  },
};
