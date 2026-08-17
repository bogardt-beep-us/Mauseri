/**
 * Dialoge in Miezlingen.
 *
 * Ton: warm, leicht schrullig, mit Humor - aber der Nebel liegt schon
 * darunter. Pookie redet dazwischen, ohne dass Mauseri ihn fragt. Das ist
 * Absicht: die Freundschaft soll sich durch Beilaeufigkeit zeigen, nicht durch
 * Erklaerungen.
 */

import type { DialogueNode } from '../types';

export const MIEZLINGEN_DIALOGUES: Record<string, DialogueNode> = {
  // =========================================================================
  // Prolog
  // =========================================================================
  prolog_1: {
    id: 'prolog_1',
    lines: [
      { speaker: 'erzaehler', text: 'Miezlingen, kurz nach Sonnenaufgang. Es riecht nach Brot, das niemand gebacken hat.' },
      { speaker: 'pookie', text: 'MAUSERI. Mauseri. Mauseri wach auf.', mood: 'scared' },
      { speaker: 'mauseri', text: 'Pookie. Es ist frueh.', mood: 'neutral' },
      { speaker: 'pookie', text: 'Es ist NICHT frueh, es ist wichtig. Das ist ein Unterschied.', mood: 'scared' },
      { speaker: 'pookie', text: 'Am Dorfrand war heute Nacht was. Schwarz. Wie Nebel, aber... falsch.', mood: 'scared' },
      { speaker: 'mauseri', text: 'Nebel ist Nebel.', mood: 'neutral' },
      { speaker: 'pookie', text: 'Nebel geht nicht rueckwaerts, Mauseri. Dieser ging rueckwaerts.', mood: 'scared' },
      { speaker: 'pookie', text: 'Und Murr ist weg.', mood: 'sad' },
    ],
    effects: [{ setFlag: 'prolog_nebel_gesehen' }, { startQuest: 'q_hauptquest_1' }],
    then: 'prolog_2',
  },

  prolog_2: {
    id: 'prolog_2',
    lines: [
      { speaker: 'mauseri', text: 'Murr? Der Murr, der jeden Morgen um sechs am Zaun steht und ueber das Wetter schimpft?', mood: 'surprised' },
      { speaker: 'pookie', text: 'Der Murr. Heute steht da niemand. Der Zaun ist ganz allein.', mood: 'sad' },
      { speaker: 'pookie', text: 'Ich hab schon geguckt. Zweimal. Von weitem.', mood: 'scared' },
      { speaker: 'mauseri', text: 'Dann gucken wir jetzt von nahem.', mood: 'happy' },
      { speaker: 'pookie', text: 'Das war die Antwort, vor der ich Angst hatte.', mood: 'sad' },
    ],
  },

  // =========================================================================
  // Lina - Mauseris Mutter
  // =========================================================================
  lina_start: {
    id: 'lina_start',
    lines: [
      { speaker: 'mutter_lina', text: 'Du bist wach. Gut. Hast du Pookie gehoert? Das halbe Dorf hat Pookie gehoert.', mood: 'happy' },
      { speaker: 'pookie', text: 'Ich war LEISE.', mood: 'angry' },
      { speaker: 'mutter_lina', text: 'Du warst engagiert.', mood: 'happy' },
    ],
  },

  lina_nebel: {
    id: 'lina_nebel',
    lines: [
      { speaker: 'mutter_lina', text: 'Also stimmt es. Mit Murr.', mood: 'sad' },
      { speaker: 'mutter_lina', text: 'Geh zu Tobb, bevor du irgendwo hinlaeufst. Er soll wissen, wo du bist.' },
      { speaker: 'mutter_lina', text: 'Und Mauseri - komm zurueck. Das ist keine Bitte, das ist eine Bedingung.', mood: 'sad' },
      { speaker: 'mauseri', text: 'Ich komm zurueck.', mood: 'neutral' },
      { speaker: 'pookie', text: 'Ich pass auf sie auf!', mood: 'happy' },
      { speaker: 'mutter_lina', text: 'Pookie, du hast letzte Woche vor einem Grashalm gekreischt.', mood: 'happy' },
      { speaker: 'pookie', text: 'Der hat sich BEWEGT.', mood: 'angry' },
    ],
  },

  lina_sorge: {
    id: 'lina_sorge',
    lines: [
      { speaker: 'mutter_lina', text: 'Ich schlafe schlecht, seit du unterwegs bist.', mood: 'sad' },
      { speaker: 'mutter_lina', text: 'Aber ich wuerde dich nicht aufhalten. Das waere schlimmer.' },
    ],
  },

  lina_ende: {
    id: 'lina_ende',
    lines: [
      { speaker: 'mutter_lina', text: 'Du bist zurueck.', mood: 'happy' },
      { speaker: 'mutter_lina', text: 'Setz dich. Erzaehl. Alles. Von vorn.' },
      { speaker: 'pookie', text: 'Das dauert. Das dauert wirklich lange.', mood: 'happy' },
    ],
  },

  // =========================================================================
  // Brummel - Baecker
  // =========================================================================
  brummel_standard: {
    id: 'brummel_standard',
    lines: [
      { speaker: 'brummel', text: 'Fischkekse. Frisch. Naja. Frisch genug.', mood: 'neutral' },
      { speaker: 'pookie', text: 'Wie frisch ist "frisch genug"?', mood: 'sly' },
      { speaker: 'brummel', text: 'Frisch genug, dass ich nicht drueber reden will.' },
    ],
  },

  brummel_nebel: {
    id: 'brummel_nebel',
    lines: [
      { speaker: 'brummel', text: 'Ich hab heute nicht gebacken.', mood: 'sad' },
      { speaker: 'brummel', text: 'Wozu? Murr war mein erster Kunde. Jeden Tag. Seit neunzehn Jahren.' },
      { speaker: 'brummel', text: 'Und heute frueh steh ich da mit dem Teig in der Hand und keiner kommt.', mood: 'sad' },
      { speaker: 'mauseri', text: 'Andere kommen doch auch.' },
      { speaker: 'brummel', text: 'Ja. Aber Murr kam ZUERST.' },
      { speaker: 'brummel', text: 'Weisst du was, hier. Nimm den Laib. Bring ihn Hetta. Die isst wenigstens noch.', mood: 'neutral' },
    ],
    effects: [{ giveItem: 'brotlaib' }, { startQuest: 'q_brot' }],
  },

  brummel_wartet: {
    id: 'brummel_wartet',
    lines: [
      { speaker: 'brummel', text: 'Hetta wohnt drueben. Das Haus mit den vielen Muscheln am Fenster.' },
      { speaker: 'brummel', text: 'Und sag ihr, sie soll den Rand mitessen. Sie laesst immer den Rand liegen.', mood: 'angry' },
    ],
  },

  brummel_danach: {
    id: 'brummel_danach',
    lines: [
      { speaker: 'brummel', text: 'Sie hat den Rand liegen lassen, oder?', mood: 'sad' },
      { speaker: 'mauseri', text: 'Sie hat ihn gegessen.' },
      { speaker: 'brummel', text: '...', mood: 'surprised' },
      { speaker: 'brummel', text: 'Dann steht es wirklich schlimm.', mood: 'sad' },
      { speaker: 'brummel', text: 'Hier. Fuer unterwegs. Und komm heil wieder, hoerst du.' },
      { speaker: 'erzaehler', text: 'Brummel schiebt ein Buendel ueber den Tresen. Es ist deutlich mehr, als er sagt.' },
    ],
    // Vorher war von "hier, fuer unterwegs" die Rede, ohne dass etwas kam.
    effects: [
      { giveItem: 'fischkeks', count: 3 },
      { giveItem: 'heilmilch', count: 1 },
      { giveCoins: 25 },
    ],
  },

  // =========================================================================
  // Oma Hetta
  // =========================================================================
  hetta_standard: {
    id: 'hetta_standard',
    lines: [
      { speaker: 'oma_hetta', text: 'Frueher bin ich bis zum Mondsee gelaufen. Zu Fuss. An einem Tag.', mood: 'happy' },
      { speaker: 'pookie', text: 'Der Mondsee ist vier Tagesmaersche weit.', mood: 'sly' },
      { speaker: 'oma_hetta', text: 'Ich war schnell.' },
    ],
  },

  hetta_nebel: {
    id: 'hetta_nebel',
    lines: [
      { speaker: 'oma_hetta', text: 'Schwarzer Nebel. Ja.', mood: 'sad' },
      { speaker: 'oma_hetta', text: 'Ich hab den schon einmal gesehen. Als ich jung war. Weit im Norden.' },
      { speaker: 'mauseri', text: 'Und? Was war es?' },
      { speaker: 'oma_hetta', text: 'Weiss ich nicht. Wir sind weggelaufen. Alle.', mood: 'sad' },
      { speaker: 'oma_hetta', text: 'Damals hielt ich das fuer klug.' },
      { speaker: 'pookie', text: 'War es das nicht?', mood: 'scared' },
      { speaker: 'oma_hetta', text: 'Der Nebel ist ja immer noch da, oder?' },
    ],
  },

  hetta_brot: {
    id: 'hetta_brot',
    lines: [
      { speaker: 'oma_hetta', text: 'Brummel schickt dich. Mit Brot.', mood: 'surprised' },
      { speaker: 'oma_hetta', text: 'Der Mann hat seit zwanzig Jahren kein Wort mit mir gewechselt, das nicht "Guten Tag" war.' },
      { speaker: 'oma_hetta', text: 'Und jetzt Brot.' },
      { speaker: 'oma_hetta', text: 'Dann ist es schlimm.', mood: 'sad' },
      { speaker: 'mauseri', text: 'Er sagt, Sie sollen den Rand mitessen.' },
      { speaker: 'oma_hetta', text: 'Sag ihm, ich hab den Rand gegessen.', mood: 'happy' },
      { speaker: 'oma_hetta', text: 'Sag ihm das genau so.' },
    ],
    effects: [
      { takeItem: 'brotlaib' },
      { setFlag: 'brummel_brot_gebracht' },
      { completeQuest: 'q_brot' },
    ],
    then: 'hetta_glocke_angebot',
  },

  hetta_glocke_angebot: {
    id: 'hetta_glocke_angebot',
    lines: [
      { speaker: 'oma_hetta', text: 'Und weil du schon mal da bist: unsere Glocke.' },
      { speaker: 'oma_hetta', text: 'Die haengt oben am Platz und schweigt seit sechs Jahren.' },
      { speaker: 'oma_hetta', text: 'Alle sagen, sie sei kaputt. Sie ist nicht kaputt. Ihr fehlt das Herz.' },
      { speaker: 'pookie', text: 'Glocken haben Herzen?', mood: 'surprised' },
      { speaker: 'oma_hetta', text: 'Den Kloeppel, Kleiner. Und der ist nicht von allein rausgefallen.' },
      { speaker: 'oma_hetta', text: 'Guck in der alten Scheune am Dorfrand. Tobb hat den Schluessel, frag ihn.' },
      { speaker: 'pookie', text: 'Den haben wir schon.', mood: 'happy' },
      { speaker: 'oma_hetta', text: 'Dann seid ihr weiter als ich dachte.' },
    ],
    effects: [{ startQuest: 'q_glocke' }],
  },

  hetta_glocke_aktiv: {
    id: 'hetta_glocke_aktiv',
    lines: [
      { speaker: 'oma_hetta', text: 'Die Scheune. Am Dorfrand. Der Schluessel klemmt, dreh ihn nach links.' },
    ],
  },

  hetta_glocke_fertig: {
    id: 'hetta_glocke_fertig',
    lines: [
      { speaker: 'oma_hetta', text: 'Da ist es ja. Das alte Ding.', mood: 'happy' },
      { speaker: 'oma_hetta', text: 'Weisst du, warum ich das wollte?' },
      { speaker: 'oma_hetta', text: 'Damit man uns hoert. Wenn irgendwann jemand vorbeikommt und wissen will, ob hier noch wer lebt.' },
      { speaker: 'oma_hetta', text: 'Dann soll es laeuten.', mood: 'sad' },
    ],
  },

  hetta_stolz: {
    id: 'hetta_stolz',
    lines: [
      { speaker: 'oma_hetta', text: 'Du bist bis zu den Schattenlanden gekommen.', mood: 'surprised' },
      { speaker: 'oma_hetta', text: 'Ich hab damals kehrtgemacht. Du nicht.' },
      { speaker: 'oma_hetta', text: 'Geh weiter, Kind. Und guck dich nicht so oft um wie ich.' },
    ],
  },

  hetta_ende: {
    id: 'hetta_ende',
    lines: [
      { speaker: 'oma_hetta', text: 'Die Glocke hat gelaeutet, als du zurueckkamst. Wusstest du das?', mood: 'happy' },
      { speaker: 'oma_hetta', text: 'Ich hab sie gelaeutet. Den ganzen Nachmittag.' },
      { speaker: 'oma_hetta', text: 'Mein Arm tut immer noch weh. Es war es wert.' },
    ],
  },

  // =========================================================================
  // Fips
  // =========================================================================
  fips_standard: {
    id: 'fips_standard',
    lines: [
      { speaker: 'fips', text: 'Hast du meine Maus gesehen?', mood: 'sad' },
      { speaker: 'mauseri', text: 'Eine echte Maus?' },
      { speaker: 'fips', text: 'Nein! Meine Maus. Die aus Stoff. Mit dem einen Ohr.' },
      { speaker: 'fips', text: 'Sie ist weggelaufen.' },
      { speaker: 'pookie', text: 'Stoffmaeuse laufen nicht weg.', mood: 'neutral' },
      { speaker: 'fips', text: 'DIESE schon.', mood: 'angry' },
      { speaker: 'pookie', text: '...gut, das kann ich nicht widerlegen.', mood: 'sly' },
    ],
    effects: [{ startQuest: 'q_spielzeugmaus' }],
  },

  fips_wartet: {
    id: 'fips_wartet',
    lines: [{ speaker: 'fips', text: 'Sie hat ein Ohr. Das andere hab ich. Zur Sicherheit.', mood: 'sad' }],
  },

  fips_gefunden: {
    id: 'fips_gefunden',
    lines: [
      { speaker: 'fips', text: 'DA IST SIE!', mood: 'happy' },
      { speaker: 'fips', text: 'Wo war sie? Nein, sag nichts. Sie erzaehlt es mir selbst.' },
      { speaker: 'pookie', text: 'Er redet mit ihr.', mood: 'surprised' },
      { speaker: 'mauseri', text: 'Du redest mit Steinen, wenn du nervoes bist.' },
      { speaker: 'pookie', text: 'Steine hoeren gut zu!', mood: 'angry' },
    ],
    effects: [
      { takeItem: 'spielzeugmaus' },
      { completeQuest: 'q_spielzeugmaus' },
    ],
  },

  fips_danke: {
    id: 'fips_danke',
    lines: [
      { speaker: 'fips', text: 'Sie sagt danke. Ich soll auch danke sagen. Also: danke.', mood: 'happy' },
    ],
  },

  // =========================================================================
  // Kork - Haendler
  // =========================================================================
  kork_erstes_mal: {
    id: 'kork_erstes_mal',
    lines: [
      { speaker: 'haendler_kork', text: 'Waren aus aller Welt! Aus MIAUPORT. Aus KRATZFELS. Aus...', mood: 'happy' },
      { speaker: 'haendler_kork', text: '...also, die Fischkekse sind von Brummel. Aber der Rest!' },
      { speaker: 'pookie', text: 'Was ist der Rest?', mood: 'sly' },
      { speaker: 'haendler_kork', text: 'Der Rest ist BEEINDRUCKEND, junger Herr.' },
      { speaker: 'haendler_kork', text: 'Diese Kralle hier? Getragen von einem Helden aus dem Norden.' },
      { speaker: 'mauseri', text: 'Sie hat ein Preisschild von Ihnen drauf.' },
      { speaker: 'haendler_kork', text: 'Der Held war sehr ordentlich.', mood: 'sly' },
    ],
    effects: [{ setFlag: 'kork_geschichte_gehoert' }],
  },

  kork_shop: {
    id: 'kork_shop',
    lines: [
      { speaker: 'haendler_kork', text: 'Such dir was aus. Alles echt. Fast alles echt. Guck einfach.', mood: 'happy' },
      { speaker: 'haendler_kork', text: 'Und wenn ich mal nicht da bin: ich zieh mit.' },
      { speaker: 'haendler_kork', text: 'Wo Leute hingehen, geh ich hin. Das ist das ganze Geheimnis am Handel.' },
      { speaker: 'pookie', text: 'Sie folgen UNS?', mood: 'surprised' },
      { speaker: 'haendler_kork', text: 'Ich folge dem Geschaeft, junger Herr.' },
      { speaker: 'haendler_kork', text: 'Dass das gerade ihr seid, ist ein gluecklicher Zufall.', mood: 'sly' },
    ],
  },

  // =========================================================================
  // Tobb - Wache
  // =========================================================================
  tobb_standard: {
    id: 'tobb_standard',
    lines: [
      { speaker: 'wache_tobb', text: 'Niemand verlaesst das Dorf. Anweisung.', mood: 'neutral' },
      { speaker: 'mauseri', text: 'Wessen Anweisung?' },
      { speaker: 'wache_tobb', text: 'Meine. Ich bin die Wache. Ich weise an.' },
    ],
  },

  tobb_nebel: {
    id: 'tobb_nebel',
    lines: [
      { speaker: 'wache_tobb', text: 'Du willst raus. Wegen Murr.', mood: 'sad' },
      { speaker: 'mauseri', text: 'Jemand muss nachsehen.' },
      { speaker: 'wache_tobb', text: 'Ja. Ich. Das ist meine Aufgabe.' },
      { speaker: 'wache_tobb', text: 'Nur... ich bin die einzige Wache. Wenn ich rausgehe, ist hier keine mehr.', mood: 'sad' },
      { speaker: 'wache_tobb', text: 'Und wenn ich nicht rausgehe, ist Murr weiter weg.' },
      { speaker: 'pookie', text: 'Wir sind zu zweit. Du bist nur einer.', mood: 'neutral' },
      { speaker: 'wache_tobb', text: '...', mood: 'surprised' },
      { speaker: 'wache_tobb', text: 'Das ist das Vernuenftigste, was heute jemand gesagt hat. Und es kam von dir.' },
      { speaker: 'wache_tobb', text: 'Geh. Aber nimm den Weg am Wasser, nicht den durch die Baeume.' },
      { speaker: 'wache_tobb', text: 'Und wenn ihr den Nebel seht - dreht um. Sofort.' },
      { speaker: 'wache_tobb', text: 'Noch was. Hier.' },
      { speaker: 'wache_tobb', text: 'Der Schluessel zur alten Scheune. Da lagert Zeug, das keiner vermisst.' },
      { speaker: 'wache_tobb', text: 'Wenn Murr sich irgendwo untergestellt hat, dann da.' },
      { speaker: 'pookie', text: 'Du hattest den die ganze Zeit?', mood: 'angry' },
      { speaker: 'wache_tobb', text: 'Ich bin die Wache. Ich hab alle Schluessel.' },
      { speaker: 'wache_tobb', text: 'Das ist so ziemlich der ganze Job.' },
    ],
    effects: [
      { setFlag: 'kapitel_2' },
      { giveItem: 'scheunenschluessel' },
      { toast: 'Der Weg aus dem Dorf ist frei.', kind: 'quest' },
    ],
  },

  tobb_weg_frei: {
    id: 'tobb_weg_frei',
    lines: [
      { speaker: 'wache_tobb', text: 'Am Wasser entlang. Nicht durch die Baeume. Ich sag es nur noch einmal.' },
    ],
  },

  // =========================================================================
  // Murr - der Verschwundene
  // =========================================================================
  murr_gefunden: {
    id: 'murr_gefunden',
    lines: [
      { speaker: 'erzaehler', text: 'In der Ecke der Scheune sitzt jemand. Zusammengekauert, aber unverletzt.' },
      { speaker: 'verschwundener_murr', text: 'Nicht anfassen. Nicht anfassen!', mood: 'scared' },
      { speaker: 'mauseri', text: 'Murr. Ich bin es. Mauseri.' },
      { speaker: 'verschwundener_murr', text: 'Mauseri.', mood: 'surprised' },
      { speaker: 'verschwundener_murr', text: 'Mauseri. Ja. Du warst immer die, die zu weit gelaufen ist.' },
      { speaker: 'verschwundener_murr', text: 'Ich war am Zaun. Wie immer. Und dann war der Nebel da.' },
      { speaker: 'verschwundener_murr', text: 'Er hat nicht wehgetan. Er hat mir was WEGGENOMMEN.', mood: 'scared' },
      { speaker: 'mauseri', text: 'Was?' },
      { speaker: 'verschwundener_murr', text: 'Ich weiss es nicht mehr. Das ist ja der Punkt.', mood: 'sad' },
      { speaker: 'pookie', text: 'Mauseri...', mood: 'scared' },
      { speaker: 'verschwundener_murr', text: 'Er kam aus dem Wald. Und im Wald ist es schlimmer.' },
    ],
    effects: [
      { setFlag: 'murr_gefunden' },
      { setFlag: 'murr_gerettet' },
      { completeQuest: 'q_hauptquest_1' },
      { startQuest: 'q_hauptquest_2' },
      { unlockMapRegion: 'schnurrwald' },
    ],
  },

  murr_gerettet: {
    id: 'murr_gerettet',
    lines: [
      { speaker: 'verschwundener_murr', text: 'Ich geh gleich zurueck. Gleich. Nur noch einen Moment.', mood: 'sad' },
      { speaker: 'verschwundener_murr', text: 'Sag Brummel, ich komm morgen wieder. Als erster.' },
    ],
  },
};
