/**
 * Dialoge in Kratzfels.
 *
 * Thema der Region: Leute, die etwas verschweigen, weil sie glauben, damit zu
 * schuetzen. Ambra und Stoll sind Geschwister, die nebeneinander stehen und
 * aneinander vorbeireden - bis jemand die Frage stellt.
 */

import type { DialogueNode } from '../types';

export const KRATZFELS_DIALOGUES: Record<string, DialogueNode> = {
  kratzfels_ankunft_1: {
    id: 'kratzfels_ankunft_1',
    lines: [
      { speaker: 'erzaehler', text: 'Der Pass oeffnet sich, und darunter liegt eine Stadt aus demselben Stein wie der Berg.' },
      { speaker: 'pookie', text: 'Die haben ihre Haeuser aus dem Berg rausgeschnitten.', mood: 'surprised' },
      { speaker: 'mauseri', text: 'Oder der Berg hat sie reingelassen.' },
      { speaker: 'pookie', text: 'Das ist wieder so ein Satz, Mauseri. Du machst das mit Absicht.', mood: 'sad' },
      { speaker: 'pookie', text: 'Aus den Minen kommt Rauch. Und der geht nach UNTEN.' },
    ],
  },

  // --- Ambra ---------------------------------------------------------------
  ambra_standard: {
    id: 'ambra_standard',
    lines: [
      { speaker: 'schmiedin_ambra', text: 'Vorsicht, der Amboss ist heiss. Und ich auch.', mood: 'angry' },
      { speaker: 'schmiedin_ambra', text: 'Entschuldige. Es ist nicht wegen dir.' },
      { speaker: 'schmiedin_ambra', text: 'Mein Bruder Stoll. Der geht seit drei Wochen jeden Abend in die alte Mine.' },
      { speaker: 'schmiedin_ambra', text: 'Und jeden Morgen sagt er, er war nicht da.' },
      { speaker: 'pookie', text: 'Vielleicht schlafwandelt er?', mood: 'scared' },
      { speaker: 'schmiedin_ambra', text: 'Mit einer Laterne und dem Schluessel in der Pfote?' },
      { speaker: 'pookie', text: 'Sehr organisiertes Schlafwandeln.', mood: 'sly' },
      { speaker: 'schmiedin_ambra', text: 'Frag ihn du. Mir sagt er nichts. Ich bin die grosse Schwester, da schweigt man.' },
    ],
    effects: [{ startQuest: 'q_minen' }, { startQuest: 'q_hauptquest_3' }],
  },

  ambra_wartet: {
    id: 'ambra_wartet',
    lines: [
      { speaker: 'schmiedin_ambra', text: 'Und? Hat er geredet?' },
      { speaker: 'schmiedin_ambra', text: 'Nein, sag nichts. Ich seh es an deinem Gesicht.', mood: 'sad' },
      { speaker: 'schmiedin_ambra', text: 'Bleib dran. Er bricht irgendwann.' },
    ],
  },

  ambra_dankbar: {
    id: 'ambra_dankbar',
    lines: [
      { speaker: 'schmiedin_ambra', text: 'Er hat es mir gesagt. Alles.', mood: 'sad' },
      { speaker: 'schmiedin_ambra', text: 'Dass er das Ding da unten gehoert hat. Dass er Angst hatte, ich geh selbst runter.' },
      { speaker: 'schmiedin_ambra', text: 'Dass er dachte, wenn er es allein regelt, muss ich es nie erfahren.' },
      { speaker: 'mauseri', text: 'Sind Sie boese?' },
      { speaker: 'schmiedin_ambra', text: 'Ja. Und erleichtert. Beides gleichzeitig, das geht.' },
      { speaker: 'schmiedin_ambra', text: 'Hier. Die hab ich vorletzte Nacht fertig gemacht, weil ich nicht schlafen konnte.' },
      { speaker: 'schmiedin_ambra', text: 'Sie ist gut geworden. Schlaflosigkeit hat wenigstens einen Nutzen.' },
    ],
    effects: [{ completeQuest: 'q_minen' }],
  },

  ambra_danach: {
    id: 'ambra_danach',
    lines: [
      { speaker: 'schmiedin_ambra', text: 'Er sitzt jeden Abend hier. Redet immer noch nicht viel.' },
      { speaker: 'schmiedin_ambra', text: 'Aber er sitzt hier. Das ist der Unterschied.', mood: 'happy' },
    ],
  },

  // --- Stoll ---------------------------------------------------------------
  stoll_standard: {
    id: 'stoll_standard',
    lines: [
      { speaker: 'bergmann_stoll', text: 'Ich kenn jeden Stollen hier. Jeden.' },
      { speaker: 'mauseri', text: 'Auch den, in den Sie nachts gehen?' },
      { speaker: 'bergmann_stoll', text: '...', mood: 'surprised' },
      { speaker: 'bergmann_stoll', text: 'Wer sagt das.' },
      { speaker: 'mauseri', text: 'Ihre Schwester.' },
      { speaker: 'bergmann_stoll', text: 'Natuerlich.', mood: 'sad' },
      { speaker: 'bergmann_stoll', text: 'Gut. Ja. Ich geh runter. Seit drei Wochen.' },
      { speaker: 'bergmann_stoll', text: 'Da ist was in der Grube. Es atmet, Mauseri. Stein atmet nicht.' },
      { speaker: 'bergmann_stoll', text: 'Und wenn ich es Ambra sage, geht sie selbst. Sie ist so. Sie geht immer selbst.' },
      { speaker: 'bergmann_stoll', text: 'Nimm den Schluessel. Ich geh nicht mehr runter, ich hab es versucht.' },
      { speaker: 'bergmann_stoll', text: 'Und sag ihr... sag ihr, ich komm gleich nach und erklaer es selbst.' },
    ],
    effects: [
      { setFlag: 'stoll_gestanden' },
      { setFlag: 'ambra_wahrheit' },
      { giveItem: 'minenschluessel' },
      { advanceQuest: 'q_minen', step: 1 },
    ],
  },

  stoll_schluessel: {
    id: 'stoll_schluessel',
    lines: [
      { speaker: 'bergmann_stoll', text: 'Der Schluessel klemmt. Zweimal drehen, dann ziehen.' },
      { speaker: 'bergmann_stoll', text: 'Und Mauseri: die Platten da unten. Die wollen Gewicht.' },
      { speaker: 'bergmann_stoll', text: 'Ich hab mich draufgestellt. Dreimal. Es hat nichts gebracht.', mood: 'sad' },
    ],
  },

  stoll_beeindruckt: {
    id: 'stoll_beeindruckt',
    lines: [
      { speaker: 'bergmann_stoll', text: 'Du hast die Platten geloest.', mood: 'surprised' },
      { speaker: 'bergmann_stoll', text: 'Mit den Loren. Natuerlich mit den Loren.' },
      { speaker: 'bergmann_stoll', text: 'Ich bin seit zwanzig Jahren Bergmann und komm nicht auf die Loren.' },
      { speaker: 'pookie', text: 'Passiert den Besten.', mood: 'sly' },
    ],
  },

  // --- Grimm ---------------------------------------------------------------
  grimm_einladung: {
    id: 'grimm_einladung',
    lines: [
      { speaker: 'arenameister_grimm', text: 'Du siehst aus, als haettest du schon mal jemanden geschlagen.' },
      { speaker: 'mauseri', text: 'Nur, wenn es sein musste.' },
      { speaker: 'arenameister_grimm', text: 'Die beste Sorte.' },
      { speaker: 'arenameister_grimm', text: 'Drei Runden. Wer sie ueberlebt, bekommt, was in der Truhe liegt.' },
      { speaker: 'arenameister_grimm', text: 'Wer sie nicht ueberlebt, bekommt einen Platz auf der Liste.' },
      { speaker: 'pookie', text: 'Was fuer eine Liste?', mood: 'scared' },
      { speaker: 'arenameister_grimm', text: 'Eine lange.' },
      { speaker: 'arenameister_grimm', text: 'Ich mach Witze. Meistens.' },
    ],
    effects: [{ startQuest: 'q_arena' }, { setFlag: 'arena_gestartet' }],
  },

  grimm_laeuft: {
    id: 'grimm_laeuft',
    lines: [
      { speaker: 'arenameister_grimm', text: 'Noch stehst du. Das sagt schon was.' },
      { speaker: 'arenameister_grimm', text: 'Raeum auf, was da drin ist. Dann reden wir weiter.' },
    ],
  },

  grimm_sieger: {
    id: 'grimm_sieger',
    lines: [
      { speaker: 'arenameister_grimm', text: 'Drei Runden. Keine Pause.', mood: 'surprised' },
      { speaker: 'arenameister_grimm', text: 'Weisst du, wie viele das schaffen? Sechs. In elf Jahren.' },
      { speaker: 'arenameister_grimm', text: 'Nimm die Truhe. Und komm wieder, wenn du staerker bist.' },
      { speaker: 'arenameister_grimm', text: 'Ich hab noch schlimmere Runden im Keller.' },
    ],
    effects: [{ setFlag: 'arena_gewonnen' }, { completeQuest: 'q_arena' }],
  },

  grimm_danach: {
    id: 'grimm_danach',
    lines: [
      { speaker: 'arenameister_grimm', text: 'Der Siebte.', mood: 'happy' },
      { speaker: 'arenameister_grimm', text: 'Ich fuehr die Liste seit elf Jahren. Du stehst jetzt drauf.' },
      { speaker: 'pookie', text: 'Auf der LISTE?', mood: 'scared' },
      { speaker: 'arenameister_grimm', text: 'Auf der guten.' },
    ],
  },

  // --- Grubenherz ----------------------------------------------------------
  grubenherz_erwacht_1: {
    id: 'grubenherz_erwacht_1',
    lines: [
      { speaker: 'erzaehler', text: 'Die Grube ist warm. Nicht von Feuer - von Atem.' },
      { speaker: 'pookie', text: 'Stoll hatte recht. Stoll hatte SO recht.', mood: 'scared' },
      { speaker: 'stimme', text: 'Ihr grabt und grabt und grabt.' },
      { speaker: 'stimme', text: 'Und wundert euch, wenn etwas zurueckguckt.' },
      { speaker: 'mauseri', text: 'Wer bist du?' },
      { speaker: 'stimme', text: 'Aelter als die Frage.' },
    ],
  },
};
