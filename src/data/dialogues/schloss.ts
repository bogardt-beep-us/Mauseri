/**
 * Dialoge im Schloss Nyxara.
 *
 * Aufloesung. Folio und Mira liefern die letzten Puzzlestuecke: was das Herz
 * der Nacht ist und warum Nyxara es nicht loslassen konnte. Beide sind
 * freiwillig geblieben - das ist der Schluessel zum Verstaendnis.
 */

import type { DialogueNode } from '../types';

export const SCHLOSS_DIALOGUES: Record<string, DialogueNode> = {
  schloss_ankunft_1: {
    id: 'schloss_ankunft_1',
    lines: [
      { speaker: 'erzaehler', text: 'Schloss Nyxara steht offen. Kein Tor, keine Wache, kein Widerstand.' },
      { speaker: 'pookie', text: 'Das ist schlimmer als verschlossen.', mood: 'scared' },
      { speaker: 'mauseri', text: 'Warum?' },
      { speaker: 'pookie', text: 'Weil verschlossen heisst "geh weg".' },
      { speaker: 'pookie', text: 'Offen heisst "komm rein, ich weiss, dass du nichts aendern kannst".' },
      { speaker: 'mauseri', text: '...' },
      { speaker: 'mauseri', text: 'Pookie, du bist manchmal beunruhigend klug.' },
      { speaker: 'pookie', text: 'Ich weiss. Das erschreckt mich auch.', mood: 'sad' },
    ],
  },

  // --- Folio ---------------------------------------------------------------
  folio_erstes_mal: {
    id: 'folio_erstes_mal',
    lines: [
      { speaker: 'bibliothekar_folio', text: 'Pssst.', mood: 'neutral' },
      { speaker: 'mauseri', text: 'Es ist niemand hier.' },
      { speaker: 'bibliothekar_folio', text: 'Gewohnheit. Neunzehn Jahre Gewohnheit.' },
      { speaker: 'bibliothekar_folio', text: 'Folio. Bibliothekar. Der Letzte, weil ich der Einzige war.' },
      { speaker: 'mauseri', text: 'Warum sind Sie geblieben?' },
      { speaker: 'bibliothekar_folio', text: 'Weil Buecher niemanden haben, der auf sie aufpasst.' },
      { speaker: 'bibliothekar_folio', text: 'Und weil sie mich gebeten hat.', mood: 'sad' },
      { speaker: 'bibliothekar_folio', text: 'Kurz bevor es schlimm wurde. Sie hat gesagt:' },
      { speaker: 'bibliothekar_folio', text: '"Folio, wenn ich es vergesse, dann lies es mir vor."' },
      { speaker: 'bibliothekar_folio', text: 'Sie kam nie zurueck. Ich lese trotzdem. Jeden Abend.' },
    ],
    effects: [{ setFlag: 'folio_getroffen' }, { startQuest: 'q_tagebuch' }],
    then: 'folio_erzaehlt',
  },

  folio_erzaehlt: {
    id: 'folio_erzaehlt',
    lines: [
      { speaker: 'bibliothekar_folio', text: 'Ihr Tagebuch ist auseinandergefallen. Sieben Seiten, ueberall im Reich.' },
      { speaker: 'bibliothekar_folio', text: 'Ich hab sie nicht suchen koennen. Ich komm ja nicht raus.' },
      { speaker: 'bibliothekar_folio', text: 'Bring sie mir. Dann weisst du, was ich weiss.' },
      { speaker: 'bibliothekar_folio', text: 'Und was ich weiss, ist nicht das, was man sich erzaehlt.' },
      { speaker: 'mauseri', text: 'Was erzaehlt man sich?' },
      { speaker: 'bibliothekar_folio', text: 'Dass die Macht sie verdorben hat.' },
      { speaker: 'bibliothekar_folio', text: 'Die Wahrheit ist langweiliger und viel schlimmer.' },
      { speaker: 'bibliothekar_folio', text: 'Sie war muede und hat niemanden gefragt.' },
    ],
  },

  folio_alles: {
    id: 'folio_alles',
    lines: [
      { speaker: 'bibliothekar_folio', text: 'Alle sieben.', mood: 'surprised' },
      { speaker: 'bibliothekar_folio', text: 'Setz dich. Das dauert.' },
      { speaker: 'erzaehler', text: 'Folio liest. Seine Stimme wird waehrenddessen leiser.' },
      { speaker: 'bibliothekar_folio', text: '"Das Herz der Nacht ist kein Artefakt. Es ist ein Riss."' },
      { speaker: 'bibliothekar_folio', text: '"Es war immer da, unter dem Mondsee. Ich habe es nur gefunden."' },
      { speaker: 'bibliothekar_folio', text: '"Wenn ich es halte, bleibt es zu. Wenn ich es loslasse, oeffnet es sich."' },
      { speaker: 'bibliothekar_folio', text: '"Ich kann es nicht weggeben. Wer es traegt, wird was ich werde."' },
      { speaker: 'bibliothekar_folio', text: '"Also trage ich es. Und werde, was ich werde."' },
      { speaker: 'bibliothekar_folio', text: '"Ich wuerde gern jemanden fragen. Aber wen fragt eine Koenigin?"' },
      { speaker: 'bibliothekar_folio', text: '...' },
      { speaker: 'bibliothekar_folio', text: 'Die letzte Seite hat nur noch einen Satz.', mood: 'sad' },
      { speaker: 'bibliothekar_folio', text: '"Falls jemand das liest: es tut mir leid. Ich war nur muede."' },
      { speaker: 'mauseri', text: '...' },
      { speaker: 'mauseri', text: 'Sie muss es nicht allein halten.' },
      { speaker: 'bibliothekar_folio', text: 'Nein.', mood: 'happy' },
      { speaker: 'bibliothekar_folio', text: 'Das hat in neunzehn Jahren niemand gesagt.' },
      { speaker: 'bibliothekar_folio', text: 'Nimm das. Es lag in ihrem Schrank. Sie hat es nie benutzt.' },
    ],
  },

  // --- Mira ----------------------------------------------------------------
  mira_gefangen: {
    id: 'mira_gefangen',
    lines: [
      { speaker: 'gefangene_mira', text: 'Oh! Besuch.', mood: 'happy' },
      { speaker: 'mauseri', text: 'Sie sind eingesperrt.' },
      { speaker: 'gefangene_mira', text: 'Ja.' },
      { speaker: 'mauseri', text: 'Sie klingen sehr froehlich dafuer.' },
      { speaker: 'gefangene_mira', text: 'Ich hab mich selbst eingesperrt.', mood: 'sly' },
      { speaker: 'pookie', text: 'Sie haben WAS?', mood: 'surprised' },
      { speaker: 'gefangene_mira', text: 'Der Nebel nimmt, wer draussen ist. Drinnen kommt er nicht rein.' },
      { speaker: 'gefangene_mira', text: 'Das hab ich rausgefunden, als das Schloss leer wurde.' },
      { speaker: 'gefangene_mira', text: 'Ich hab die Zellentuer zugezogen und den Mechanismus verstellt.' },
      { speaker: 'gefangene_mira', text: 'Nur - ich hab mir die Reihenfolge falsch gemerkt.' },
      { speaker: 'gefangene_mira', text: 'Die Zahlen stehen an der Wand da drueben. Ich hab sie eingekratzt.' },
      { speaker: 'gefangene_mira', text: 'In der Reihenfolge, in der ich sie gedrueckt hab. Nicht der richtigen.' },
      { speaker: 'pookie', text: 'Das ist der beste Plan mit dem schlechtesten Ende, den ich kenne.', mood: 'sly' },
    ],
    effects: [{ startQuest: 'q_mira' }],
  },

  mira_befreit: {
    id: 'mira_befreit',
    lines: [
      { speaker: 'gefangene_mira', text: 'Luft!', mood: 'happy' },
      { speaker: 'gefangene_mira', text: 'Vier Jahre. Ich hab vier Jahre lang dieselbe Wand angeschaut.' },
      { speaker: 'gefangene_mira', text: 'Sie hat sich nicht veraendert. Ich schon.' },
      { speaker: 'mauseri', text: 'Waren Sie hier, als die Koenigin sich veraendert hat?' },
      { speaker: 'gefangene_mira', text: 'Ich war ihre Kammerkatze.', mood: 'sad' },
      { speaker: 'gefangene_mira', text: 'Ich hab jeden Abend ihr Bett gerichtet. Sie hat nie drin geschlafen.' },
      { speaker: 'gefangene_mira', text: 'Sie sass im Thronsaal. Die ganze Nacht. Jede Nacht.' },
      { speaker: 'gefangene_mira', text: 'Ich hab einmal gefragt, ob ich ihr Gesellschaft leisten soll.' },
      { speaker: 'gefangene_mira', text: 'Sie hat gesagt nein. Und dann hat sie zwei Sekunden zu lang gewartet.' },
      { speaker: 'gefangene_mira', text: 'Ich bin gegangen. Ich haette bleiben sollen.' },
      { speaker: 'gefangene_mira', text: 'Nimm das mit. Und geh nicht, wenn sie nein sagt.' },
    ],
    effects: [{ completeQuest: 'q_mira' }],
  },

  // --- Nyxara --------------------------------------------------------------
  nyxara_thron: {
    id: 'nyxara_thron',
    lines: [
      { speaker: 'nyxara', text: 'Du bist weit gekommen.', mood: 'neutral' },
      { speaker: 'nyxara', text: 'Setz dich nicht. Es dauert nicht lange.' },
    ],
  },

  nyxara_erinnerung_1: {
    id: 'nyxara_erinnerung_1',
    lines: [
      { speaker: 'erzaehler', text: 'Fuer einen Moment ist der Saal hell. Jemand sitzt auf den Stufen zum Thron, nicht darauf.' },
      { speaker: 'nyxara_erinnerung', text: 'Ich kann es nicht weggeben.', mood: 'sad' },
      { speaker: 'nyxara_erinnerung', text: 'Ich hab es versucht. Dreimal. Es kommt zurueck.' },
      { speaker: 'nyxara_erinnerung', text: 'Und jedes Mal ist ein bisschen weniger von mir da.' },
      { speaker: 'nyxara_erinnerung', text: 'Ich sollte jemandem Bescheid sagen.' },
      { speaker: 'nyxara_erinnerung', text: '...' },
      { speaker: 'nyxara_erinnerung', text: 'Morgen. Ich sag morgen jemandem Bescheid.' },
      { speaker: 'erzaehler', text: 'Das Bild verblasst. Der Saal ist wieder dunkel.' },
      { speaker: 'pookie', text: 'Sie hat es nie gesagt.', mood: 'sad' },
      { speaker: 'mauseri', text: 'Nein.' },
    ],
  },

  // --- Das wahre Ende ------------------------------------------------------
  wahres_ende_1: {
    id: 'wahres_ende_1',
    lines: [
      { speaker: 'erzaehler', text: 'Das Herz der Nacht liegt zwischen ihnen und schlaegt langsam weiter.' },
      { speaker: 'nyxara', text: 'Es hoert nicht auf. Es hat nie aufgehoert.', mood: 'sad' },
      { speaker: 'nyxara', text: 'Wenn ich es loslasse, oeffnet sich der Riss.' },
      { speaker: 'nyxara', text: 'Deshalb halte ich es. Seit sechs Jahren. Jede Nacht.' },
      { speaker: 'mauseri', text: 'Ich weiss.' },
      { speaker: 'nyxara', text: 'Du weisst.', mood: 'surprised' },
      { speaker: 'mauseri', text: 'Ich hab Ihr Tagebuch gelesen. Alle sieben Seiten.' },
      { speaker: 'mauseri', text: 'Sie haben geschrieben, dass Sie gern jemanden fragen wuerden.' },
      { speaker: 'nyxara', text: '...' },
      { speaker: 'mauseri', text: 'Dann fragen Sie.' },
      { speaker: 'nyxara', text: 'Ich bin die Koenigin. Wen soll ich fragen.', mood: 'sad' },
      { speaker: 'pookie', text: 'Uns?', mood: 'neutral' },
      { speaker: 'nyxara', text: '...' },
      { speaker: 'nyxara', text: 'Ihr seid zwei Katzen aus einem Dorf, dessen Namen ich nicht kenne.' },
      { speaker: 'mauseri', text: 'Miezlingen.' },
      { speaker: 'nyxara', text: 'Miezlingen.', mood: 'sad' },
      { speaker: 'erzaehler', text: 'Sie spricht den Namen aus, als lerne sie ihn auswendig.' },
      { speaker: 'nyxara', text: 'Es ist schwer.' },
      { speaker: 'mauseri', text: 'Dann tragen wir mit.' },
      { speaker: 'erzaehler', text: 'Mauseri legt eine Pfote auf das Herz. Pookie legt eine daneben.' },
      { speaker: 'erzaehler', text: 'Nyxara sieht sehr lange auf die drei Pfoten.' },
      { speaker: 'nyxara', text: 'Ich haette einfach fragen sollen.', mood: 'sad' },
      { speaker: 'mauseri', text: 'Ja. Aber jetzt haben Sie es.' },
      { speaker: 'erzaehler', text: 'Das Herz wird still. Nicht dunkel - still.' },
      { speaker: 'erzaehler', text: 'Zum ersten Mal seit sechs Jahren geht ueber Miaurien die Sonne auf, ohne dass jemand sie festhalten muss.' },
    ],
  },

  // --- Ankunft im Dorf (nachgereicht, wird vom Skript genutzt) -------------
  dorf_ankunft: {
    id: 'dorf_ankunft',
    lines: [
      { speaker: 'erzaehler', text: 'Der Dorfplatz von Miezlingen. Um diese Zeit sollte er voll sein.' },
      { speaker: 'pookie', text: 'Wo sind denn alle?' },
      { speaker: 'mauseri', text: 'Drinnen.' },
      { speaker: 'pookie', text: 'Bei dem Wetter?', mood: 'scared' },
      { speaker: 'mauseri', text: 'Bei diesen Nachrichten.' },
      { speaker: 'pookie', text: 'Red mit Tobb. Der laesst uns nicht raus, aber vielleicht redet er.' },
    ],
  },
};
