/**
 * Dialoge am Mondsee.
 *
 * Hier faellt zum ersten Mal Nyxaras Name in einem anderen Ton: nicht als
 * Bedrohung, sondern als Person, die jemand gekannt hat. Luna ist die erste
 * Figur, die nicht sagt "sie ist boese", sondern "sie hat sich veraendert".
 */

import type { DialogueNode } from '../types';

export const MONDSEE_DIALOGUES: Record<string, DialogueNode> = {
  mondsee_ankunft_1: {
    id: 'mondsee_ankunft_1',
    lines: [
      { speaker: 'erzaehler', text: 'Der Mondsee liegt still. Im Wasser steht ein Mond, obwohl es Tag ist.' },
      { speaker: 'pookie', text: 'Mauseri.' },
      { speaker: 'mauseri', text: 'Ich seh es.' },
      { speaker: 'pookie', text: 'Ich wollte nur sichergehen, dass wir beide dasselbe Falsche sehen.', mood: 'scared' },
      { speaker: 'erzaehler', text: 'Am Ufer sitzt eine weisse Katze und schaut aufs Wasser, als lese sie darin.' },
    ],
  },

  // --- Luna ----------------------------------------------------------------
  luna_erstes_mal: {
    id: 'luna_erstes_mal',
    lines: [
      { speaker: 'seherin_luna', text: 'Du hast lange gebraucht.', mood: 'neutral' },
      { speaker: 'mauseri', text: 'Sie haben mich erwartet?' },
      { speaker: 'seherin_luna', text: 'Ich erwarte jeden. Die meisten kommen nicht.' },
      { speaker: 'seherin_luna', text: 'Sieh in den See. Was spiegelt er?' },
      { speaker: 'mauseri', text: 'Den Mond.' },
      { speaker: 'seherin_luna', text: 'Und am Himmel?' },
      { speaker: 'mauseri', text: '...die Sonne.' },
      { speaker: 'seherin_luna', text: 'Der See spiegelt seit sechs Jahren nicht mehr den Himmel.', mood: 'sad' },
      { speaker: 'seherin_luna', text: 'Er spiegelt etwas anderes. Etwas, das nicht ueber uns ist, sondern unter uns.' },
      { speaker: 'pookie', text: 'Ich moechte diesen Satz zurueckgeben.', mood: 'scared' },
    ],
    effects: [{ setFlag: 'luna_getroffen' }, { startQuest: 'q_hauptquest_5' }],
    then: 'luna_aufgabe',
  },

  luna_aufgabe: {
    id: 'luna_aufgabe',
    lines: [
      { speaker: 'seherin_luna', text: 'Auf der Insel steht eine Ruine. Aelter als das Reich.' },
      { speaker: 'seherin_luna', text: 'Darin ist ein Altar, auf den frueher das Mondlicht fiel.' },
      { speaker: 'seherin_luna', text: 'Bring das Licht zurueck, und der See sagt dir, was er gesehen hat.' },
      { speaker: 'mauseri', text: 'Und was hat er gesehen?' },
      { speaker: 'seherin_luna', text: 'Eine Koenigin, die etwas aus dem Wasser gezogen hat.' },
      { speaker: 'seherin_luna', text: 'Und die danach anders zurueckgegangen ist, als sie gekommen war.' },
      { speaker: 'seherin_luna', text: 'Sie war nicht boese, Mauseri. Sie war erschoepft.' },
      { speaker: 'seherin_luna', text: 'Das ist etwas anderes. Und viel schwerer zu heilen.' },
    ],
  },

  luna_nach_spiegel: {
    id: 'luna_nach_spiegel',
    lines: [
      { speaker: 'seherin_luna', text: 'Du hast dein Spiegelbild geschlagen und stehst noch.' },
      { speaker: 'seherin_luna', text: 'Das schaffen wenige. Die meisten erkennen sich und hoeren auf.' },
      { speaker: 'seherin_luna', text: 'Nach Norden liegen die Schattenlande. Und dort steht Nyxaras Wache.' },
      { speaker: 'mauseri', text: 'Die mit den Schilden.' },
      { speaker: 'seherin_luna', text: 'Du hast sie also schon gesehen.', mood: 'sad' },
      { speaker: 'seherin_luna', text: 'Deine Kralle geht da nicht durch. Kein Stahl geht da durch.' },
      { speaker: 'seherin_luna', text: 'Der Nebel schluckt alles, was aus der Welt kommt.' },
      { speaker: 'mauseri', text: 'Und was kommt nicht aus der Welt?' },
      { speaker: 'seherin_luna', text: 'Das da oben.' },
      { speaker: 'erzaehler', text: 'Luna hebt die Pfote zum Mond. Der See spiegelt ihn - zum ersten Mal richtig herum.' },
      { speaker: 'seherin_luna', text: 'Halt still. Das tut kurz weh.' },
      { speaker: 'erzaehler', text: 'Mauseri hat die Mondkralle gelernt.' },
      { speaker: 'seherin_luna', text: 'Damit brichst du, was der Nebel schuetzt. Drei Schlaege, dann ist sie leer.' },
      { speaker: 'seherin_luna', text: 'Also ziel gut.' },
      { speaker: 'pookie', text: 'Sie geht nicht allein da hoch. Ich bin dabei.', mood: 'happy' },
      { speaker: 'seherin_luna', text: '...', mood: 'sad' },
      { speaker: 'seherin_luna', text: 'Ja. Gut.' },
      { speaker: 'mauseri', text: 'Was war das fuer eine Pause?' },
      { speaker: 'seherin_luna', text: 'Nichts. Geht.' },
    ],
    effects: [
      { giveAbility: 'mondkralle' },
      { toast: 'Mondkralle erlernt', kind: 'ability' },
      { increaseMaxEnergy: 8 },
    ],
  },

  luna_danach: {
    id: 'luna_danach',
    lines: [
      { speaker: 'seherin_luna', text: 'Der See spiegelt wieder den Himmel. Seit heute frueh.' },
      { speaker: 'seherin_luna', text: 'Ich sitze hier und gucke. Mehr mache ich gerade nicht.', mood: 'happy' },
      { speaker: 'seherin_luna', text: 'Geh nach Norden, Mauseri. Ich pass hier auf.' },
    ],
  },

  luna_herz: {
    id: 'luna_herz',
    lines: [
      { speaker: 'seherin_luna', text: 'Zeig mir die Splitter.', mood: 'surprised' },
      { speaker: 'erzaehler', text: 'Luna haelt die Mondsplitter nebeneinander. Sie leuchten staerker, je naeher sie sich kommen.' },
      { speaker: 'seherin_luna', text: 'Drei. Und sie suchen einander.' },
      { speaker: 'seherin_luna', text: 'Das sind Bruchstuecke von dem, was Nyxara aus dem See gezogen hat.' },
      { speaker: 'mauseri', text: 'Dann ist es zerbrochen?' },
      { speaker: 'seherin_luna', text: 'Nein. Es hat abgegeben.', mood: 'sad' },
      { speaker: 'seherin_luna', text: 'Sechs Jahre lang, Stueck fuer Stueck. Deshalb wurde der Nebel groesser.' },
      { speaker: 'seherin_luna', text: 'Und deshalb wurde sie kleiner.' },
      { speaker: 'mauseri', text: 'Kann man das rueckgaengig machen?' },
      { speaker: 'seherin_luna', text: 'Ich weiss es nicht.' },
      { speaker: 'seherin_luna', text: 'Aber ich weiss, warum es sie veraendert hat und dich nicht.' },
      { speaker: 'seherin_luna', text: 'Sie hat es allein getragen.' },
      { speaker: 'seherin_luna', text: 'Das ist der ganze Unterschied. Der einzige.' },
    ],
  },

  // --- Tropf ---------------------------------------------------------------
  tropf_standard: {
    id: 'tropf_standard',
    lines: [
      { speaker: 'faehrmann_tropf', text: 'Ich faehre nicht.' },
      { speaker: 'mauseri', text: 'Sie sind Faehrmann.' },
      { speaker: 'faehrmann_tropf', text: 'Ich BIN Faehrmann. Ich FAEHRE nicht. Zwei verschiedene Dinge.' },
      { speaker: 'faehrmann_tropf', text: 'Der Wasserstand stimmt nicht. Zu hoch, die Seerosen tragen nicht.' },
      { speaker: 'faehrmann_tropf', text: 'Und ohne Seerosen kein Weg zur Insel, und ohne Weg keine Faehre.' },
      { speaker: 'pookie', text: 'Warum brauchen Sie Seerosen? Sie haben ein BOOT.', mood: 'sly' },
      { speaker: 'faehrmann_tropf', text: '...', mood: 'surprised' },
      { speaker: 'faehrmann_tropf', text: 'Das Boot hat ein Loch.' },
      { speaker: 'faehrmann_tropf', text: 'Die Schleuse ist oben am Kanal. Stell sie auf eins. Nicht auf zwei. Eins.' },
    ],
    effects: [{ startQuest: 'q_faehre' }],
  },

  tropf_frei: {
    id: 'tropf_frei',
    lines: [
      { speaker: 'faehrmann_tropf', text: 'Die Seerosen tragen wieder.', mood: 'happy' },
      { speaker: 'faehrmann_tropf', text: 'Ich haette das selbst machen koennen. Vor Jahren.' },
      { speaker: 'faehrmann_tropf', text: 'Frag mich nicht, warum ich es nicht getan hab. Ich weiss es naemlich nicht.' },
    ],
    effects: [{ completeQuest: 'q_faehre' }],
  },

  // --- Spiegelkatze --------------------------------------------------------
  spiegelkatze_erwacht_1: {
    id: 'spiegelkatze_erwacht_1',
    lines: [
      { speaker: 'erzaehler', text: 'Der Mondstrahl trifft den Altar. Das Licht bricht - und wirft einen Schatten, der nicht zu Mauseri gehoert.' },
      { speaker: 'pookie', text: 'Das bist DU.', mood: 'scared' },
      { speaker: 'mauseri', text: 'Nein.' },
      { speaker: 'stimme', text: 'Doch.' },
      { speaker: 'stimme', text: 'Ich bin die, die zu Hause geblieben waere.' },
      { speaker: 'stimme', text: 'Die, die Tobb zugehoert haette. Die, die umgedreht waere.' },
      { speaker: 'mauseri', text: 'Und du bist wuetend darueber, dass ich es nicht war.' },
      { speaker: 'stimme', text: 'Ich bin, was von dir uebrig bleibt, wenn du aufhoerst.' },
      { speaker: 'pookie', text: 'Dann hoert sie eben nicht auf. Nie. Frag mich, ich kenn sie.', mood: 'angry' },
    ],
  },
};
