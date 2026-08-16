/**
 * Dialoge in den Schattenlanden.
 *
 * Der schwerste Teil der Geschichte. Hier wird Pookie genommen, und der Spieler
 * merkt beim Weiterlaufen, wie laut die Stille ist - die Sprechblasen fehlen,
 * die Kommentare fehlen, es fehlt jemand.
 *
 * Wichtig fuer den Ton: Mauseri wird hier nicht heldenhaft. Sie wird still.
 */

import type { DialogueNode } from '../types';

export const SCHATTENLANDE_DIALOGUES: Record<string, DialogueNode> = {
  schattenlande_ankunft_1: {
    id: 'schattenlande_ankunft_1',
    lines: [
      { speaker: 'erzaehler', text: 'Hier hoert die Farbe auf. Nicht ploetzlich - sie wird einfach immer weniger.' },
      { speaker: 'pookie', text: 'Da war mal Gras.', mood: 'sad' },
      { speaker: 'pookie', text: 'Guck. Da unten. Das war mal Gras.' },
      { speaker: 'mauseri', text: 'Bleib nah bei mir.' },
      { speaker: 'pookie', text: 'Bin ich doch immer.' },
    ],
  },

  // --- Die Trennung --------------------------------------------------------
  trennung_1: {
    id: 'trennung_1',
    lines: [
      { speaker: 'erzaehler', text: 'Der Nebel vor ihnen wird dichter. Er bewegt sich gegen den Wind.' },
      { speaker: 'pookie', text: 'Mauseri.', mood: 'scared' },
      { speaker: 'pookie', text: 'Mauseri, der Nebel ist genau der von damals. Aus Miezlingen.' },
      { speaker: 'mauseri', text: 'Ich weiss. Wir gehen zurueck.' },
      { speaker: 'pookie', text: 'Nein.', mood: 'sad' },
      { speaker: 'mauseri', text: 'Was?' },
      { speaker: 'pookie', text: 'Du gehst nicht zurueck. Du gehst nie zurueck, das ist ja das Problem an dir.' },
      { speaker: 'pookie', text: 'Also geh ich vor.', mood: 'neutral' },
      { speaker: 'mauseri', text: 'Pookie, nicht -' },
      { speaker: 'pookie', text: 'Ich hab die ganze Zeit hinter dir gestanden, Mauseri.' },
      { speaker: 'pookie', text: 'Einmal. Einmal will ich vorne sein.', mood: 'sad' },
    ],
  },

  trennung_2: {
    id: 'trennung_2',
    lines: [
      { speaker: 'erzaehler', text: 'Der Nebel schliesst sich. Als er aufreisst, ist der Weg leer.' },
      { speaker: 'mauseri', text: 'Pookie.' },
      { speaker: 'mauseri', text: 'Pookie!' },
      { speaker: 'erzaehler', text: 'Nichts antwortet. Nicht einmal ein Echo - der Nebel schluckt auch das.' },
      { speaker: 'mauseri', text: '...' },
      { speaker: 'erzaehler', text: 'Mauseri steht sehr lange still.' },
      { speaker: 'erzaehler', text: 'Dann geht sie weiter. Nach Norden.' },
    ],
  },

  // --- Ascha ---------------------------------------------------------------
  ascha_erstes_mal: {
    id: 'ascha_erstes_mal',
    lines: [
      { speaker: 'ueberlebende_ascha', text: 'Du bist echt.', mood: 'surprised' },
      { speaker: 'ueberlebende_ascha', text: 'Entschuldige. Ich frag das inzwischen zuerst.' },
      { speaker: 'mauseri', text: 'Ich bin echt.' },
      { speaker: 'ueberlebende_ascha', text: 'Ascha. Ich wohne hier. Ich bin die Einzige, die hier noch wohnt.' },
      { speaker: 'ueberlebende_ascha', text: 'Die anderen sind nicht gestorben. Das ist wichtig. Sie sind vergessen worden.' },
      { speaker: 'mauseri', text: 'Von wem?' },
      { speaker: 'ueberlebende_ascha', text: 'Von allem.', mood: 'sad' },
      { speaker: 'ueberlebende_ascha', text: 'Vom Nebel. Der nimmt keine Koerper. Der nimmt, dass es dich gab.' },
      { speaker: 'ueberlebende_ascha', text: 'Ich putze jeden Morgen die Namensschilder. Damit wenigstens ich mich erinnere.' },
      { speaker: 'mauseri', text: 'Er hat jemanden mitgenommen. Vorhin.' },
      { speaker: 'ueberlebende_ascha', text: 'Oh.', mood: 'sad' },
      { speaker: 'ueberlebende_ascha', text: 'Dann hoer mir genau zu.' },
    ],
    effects: [{ setFlag: 'ascha_getroffen' }, { startQuest: 'q_hauptquest_6' }],
    then: 'ascha_erzaehlt',
  },

  ascha_erzaehlt: {
    id: 'ascha_erzaehlt',
    lines: [
      { speaker: 'ueberlebende_ascha', text: 'Der Nebel haelt nicht fest, was noch gehalten wird.' },
      { speaker: 'ueberlebende_ascha', text: 'Vier Feuer standen in diesem Dorf. Jedes gehoerte einer Familie.' },
      { speaker: 'ueberlebende_ascha', text: 'Solange sie brannten, hat er sich nicht hereingetraut.' },
      { speaker: 'ueberlebende_ascha', text: 'Zuend sie an. Alle vier. Dann ist der Weg zur Ruine offen.' },
      { speaker: 'ueberlebende_ascha', text: 'Und in der Ruine... da ist er. Der, der den Nebel schickt.' },
      { speaker: 'mauseri', text: 'Nyxara?' },
      { speaker: 'ueberlebende_ascha', text: 'Nein, Kind. Nyxara ist im Schloss.' },
      { speaker: 'ueberlebende_ascha', text: 'Hier ist der, der ihr das antut. Oder der, dem SIE es angetan hat.' },
      { speaker: 'ueberlebende_ascha', text: 'Ich bin mir nicht mehr sicher, in welche Richtung das geht.' },
    ],
  },

  ascha_wahrheit: {
    id: 'ascha_wahrheit',
    lines: [
      { speaker: 'ueberlebende_ascha', text: 'Vier Feuer. Zum ersten Mal seit sechs Jahren.', mood: 'happy' },
      { speaker: 'ueberlebende_ascha', text: 'Setz dich einen Moment. Ich erzaehl dir etwas, das ich niemandem erzaehlt hab.' },
      { speaker: 'ueberlebende_ascha', text: 'Ich kannte sie. Nyxara. Bevor sie Koenigin war.' },
      { speaker: 'ueberlebende_ascha', text: 'Sie kam als Kind hierher. Jeden Sommer. Sie hat in der Ruine lesen gelernt.' },
      { speaker: 'ueberlebende_ascha', text: 'Sie war die freundlichste Katze, die ich je gekannt hab. Und die einsamste.' },
      { speaker: 'ueberlebende_ascha', text: 'Als sie das Herz gefunden hat, ist sie noch einmal hergekommen.' },
      { speaker: 'ueberlebende_ascha', text: 'Sie hat gesagt: "Ascha, ich hab etwas gefunden, das nicht aufhoert."' },
      { speaker: 'ueberlebende_ascha', text: '"Und wenn ich es loslasse, hoert alles andere auf."' },
      { speaker: 'ueberlebende_ascha', text: 'Ich hab sie nicht verstanden. Ich hab gesagt, sie soll sich ausruhen.' },
      { speaker: 'ueberlebende_ascha', text: 'Das war das Letzte, was ich zu ihr gesagt hab.', mood: 'sad' },
      { speaker: 'ueberlebende_ascha', text: 'Ruh dich aus.' },
    ],
  },

  // --- Orin ----------------------------------------------------------------
  orin_erstes_mal: {
    id: 'orin_erstes_mal',
    lines: [
      { speaker: 'erzaehler', text: 'Eine Schattenwache steht regungslos an der Ruinenwand. Sie greift nicht an.' },
      { speaker: 'schattenwache_orin', text: 'Nicht... naeher.', mood: 'sad' },
      { speaker: 'mauseri', text: 'Sie koennen sprechen.' },
      { speaker: 'schattenwache_orin', text: 'Noch. Es wird weniger. Jeden Tag ein bisschen.' },
      { speaker: 'schattenwache_orin', text: 'Orin. Ich hiess Orin. Ich war Wache am Nordtor.' },
      { speaker: 'schattenwache_orin', text: 'Ich hab sie rausgehen sehen. Die Koenigin. Mit dem Ding in der Pfote.' },
      { speaker: 'schattenwache_orin', text: 'Ich hab gefragt, ob alles in Ordnung ist. Das war mein Fehler.' },
      { speaker: 'mauseri', text: 'Zu fragen war ein Fehler?' },
      { speaker: 'schattenwache_orin', text: 'Nein.', mood: 'sad' },
      { speaker: 'schattenwache_orin', text: 'Nicht nachzuhaken, als sie ja gesagt hat.' },
      { speaker: 'schattenwache_orin', text: 'Geh weiter, Mauseri. Und wenn du sie triffst - frag zweimal.' },
    ],
    effects: [{ setFlag: 'orin_befreit' }, { giveItem: 'tagebuchseite' }],
  },

  orin_befreit: {
    id: 'orin_befreit',
    lines: [
      { speaker: 'schattenwache_orin', text: 'Ich steh hier noch eine Weile.' },
      { speaker: 'schattenwache_orin', text: 'Irgendwer muss den Weg bewachen. Auch wenn keiner mehr kommt.' },
    ],
  },

  // --- Wiedersehen ---------------------------------------------------------
  wiedersehen_1: {
    id: 'wiedersehen_1',
    lines: [
      { speaker: 'erzaehler', text: 'Die Runen erloeschen der Reihe nach. In der Mitte der Ruine loest sich der Nebel.' },
      { speaker: 'erzaehler', text: 'Etwas Kleines liegt dort. Grau-blau. Mit einem gruenen Halstuch.' },
      { speaker: 'mauseri', text: 'Pookie.' },
      { speaker: 'mauseri', text: 'Pookie!' },
      { speaker: 'pookie', text: '...', mood: 'sad' },
      { speaker: 'pookie', text: 'Wer -' },
      { speaker: 'pookie', text: 'Wer bist du?', mood: 'scared' },
      { speaker: 'mauseri', text: '...' },
      { speaker: 'mauseri', text: 'Ich bin Mauseri.' },
      { speaker: 'pookie', text: 'Mauseri.', mood: 'sad' },
      { speaker: 'pookie', text: 'Mauseri. Das ist ein guter Name. Den moechte ich kennen.' },
      { speaker: 'mauseri', text: 'Du kennst ihn.' },
      { speaker: 'mauseri', text: 'Du hast ihn heute frueh sechzehnmal gerufen, bevor ich wach war.' },
      { speaker: 'pookie', text: '...', mood: 'surprised' },
      { speaker: 'mauseri', text: 'Du hast vor einem Grashalm gekreischt. Der hat sich bewegt.' },
      { speaker: 'pookie', text: 'Der hat sich BEWEGT!', mood: 'angry' },
      { speaker: 'pookie', text: '...oh.', mood: 'surprised' },
    ],
  },

  wiedersehen_2: {
    id: 'wiedersehen_2',
    lines: [
      { speaker: 'pookie', text: 'Oh. Oh nein. Oh nein, ich hab das fast verloren.', mood: 'sad' },
      { speaker: 'pookie', text: 'Mauseri, ich hab dich fast VERLOREN. Nicht du mich. Ich dich.' },
      { speaker: 'mauseri', text: 'Ich weiss.' },
      { speaker: 'pookie', text: 'Ich bin vorgegangen und es hat gar nichts gebracht.' },
      { speaker: 'mauseri', text: 'Doch.' },
      { speaker: 'mauseri', text: 'Ich bin weitergegangen, weil ich dich holen wollte.' },
      { speaker: 'mauseri', text: 'Ohne dich waere ich in Miezlingen geblieben.' },
      { speaker: 'pookie', text: '...', mood: 'happy' },
      { speaker: 'pookie', text: 'Sag das nochmal, wenn wir hier raus sind. Ich moechte das aufschreiben.', mood: 'sly' },
      { speaker: 'mauseri', text: 'Nein.' },
      { speaker: 'pookie', text: 'Wusste ich.' },
    ],
  },

  // --- Nebelfuerst ---------------------------------------------------------
  nebelfuerst_erwacht_1: {
    id: 'nebelfuerst_erwacht_1',
    lines: [
      { speaker: 'erzaehler', text: 'Aus dem Boden der Ruine steigt eine Gestalt, die aus dem Nebel selbst besteht.' },
      { speaker: 'stimme', text: 'Ihr habt mir etwas weggenommen.' },
      { speaker: 'mauseri', text: 'Du hattest ihn nicht.' },
      { speaker: 'stimme', text: 'Ich hatte ihn genug.' },
      { speaker: 'stimme', text: 'Weisst du, was ich bin? Ich bin, was sie weggelegt hat.' },
      { speaker: 'stimme', text: 'Alles, was ihr zu schwer wurde. Jahr um Jahr.' },
      { speaker: 'pookie', text: 'Das ist... traurig?', mood: 'scared' },
      { speaker: 'stimme', text: 'Ja.' },
      { speaker: 'stimme', text: 'Und jetzt sei still.' },
    ],
  },
};
