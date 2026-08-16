/**
 * Prueft die Verweise zwischen den Inhaltsdateien.
 *
 * Das Spiel ist datengetrieben - ein Tippfehler in einer Knoten-ID faellt sonst
 * erst auf, wenn ein Spieler den NPC anspricht und nichts passiert. Dieses
 * Skript findet solche Luecken vor dem Build.
 *
 * Geprueft wird:
 *  1. Jeder von NPCs, Skripten und Bossen genannte Dialogknoten existiert.
 *  2. Jeder `then`- und Auswahl-Verweis innerhalb der Dialoge zeigt auf einen
 *     vorhandenen Knoten.
 *  3. Jeder Sprecher ist bekannt (sonst fehlt das Portrait).
 *  4. Jedes in Effekten genannte Item, jede Quest und jede Faehigkeit gibt es.
 *  5. Jeder in Karten genannte NPC, Gegner, Boss, Gegenstand und jedes
 *     Skript und Raetsel existiert.
 *  6. Jedes Raetsel hat auf seiner Karte auch Elemente.
 *  7. Jede Quest ist ueber einen NPC oder ein Skript erreichbar.
 *
 * Aufruf: npm run check:content
 */

import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = async (relative) => import(pathToFileURL(join(ROOT, 'src', relative)).href);

const { DIALOGUES } = await load('data/dialogues/index.ts');
const { NPCS } = await load('data/npcs.ts');
const { SCRIPTS } = await load('data/scripts.ts');
const { BOSSES } = await load('data/bosses.ts');
const { ENEMIES } = await load('data/enemies.ts');
const { ITEMS } = await load('data/items.ts');
const { QUESTS } = await load('data/quests.ts');
const { PUZZLES } = await load('data/puzzles.ts');
const { ABILITIES } = await load('data/abilities.ts');
const { SPEAKERS } = await load('data/speakers.ts');
const { ALL_AREAS } = await load('data/areas/index.ts');

const fehler = [];
const hinweise = [];

const meldung = (liste, text) => liste.push(text);
const pruefeDialog = (id, wo) => {
  if (id && !DIALOGUES[id]) meldung(fehler, `${wo}: Dialogknoten "${id}" fehlt.`);
};

// --- 1. Verweise von NPCs, Skripten und Bossen -------------------------------

for (const npc of Object.values(NPCS)) {
  for (const eintrag of npc.dialogue) {
    pruefeDialog(eintrag.node, `NPC "${npc.id}"`);
  }
  for (const angebot of npc.shop ?? []) {
    if (!ITEMS[angebot.item]) {
      meldung(fehler, `NPC "${npc.id}": Ladenware "${angebot.item}" ist kein bekannter Gegenstand.`);
    }
  }
}

for (const [id, script] of Object.entries(SCRIPTS)) {
  for (const step of script.steps) {
    if (step.do === 'dialogue') pruefeDialog(step.node, `Skript "${id}"`);
    if (step.do === 'boss' && !BOSSES[step.boss]) {
      meldung(fehler, `Skript "${id}": Boss "${step.boss}" ist unbekannt.`);
    }
    if (step.do === 'spawn' && !NPCS[step.npc]) {
      meldung(fehler, `Skript "${id}": NPC "${step.npc}" ist unbekannt.`);
    }
    if (step.do === 'effects') pruefeEffekte(step.effects, `Skript "${id}"`);
  }
}

for (const boss of Object.values(BOSSES)) {
  pruefeDialog(boss.introDialogue, `Boss "${boss.id}" (intro)`);
  pruefeDialog(boss.outroDialogue, `Boss "${boss.id}" (outro)`);
  pruefeEffekte(boss.rewards, `Boss "${boss.id}"`);
  for (const phase of boss.phases) {
    for (const muster of phase.patterns) {
      if (muster.kind === 'summon' && !ENEMIES[muster.enemy]) {
        meldung(fehler, `Boss "${boss.id}": ruft unbekannten Gegner "${muster.enemy}".`);
      }
    }
  }
}

// --- 2. Verweise innerhalb der Dialoge --------------------------------------

for (const [id, node] of Object.entries(DIALOGUES)) {
  if (node.then) pruefeDialog(node.then, `Dialog "${id}" (then)`);
  pruefeEffekte(node.effects, `Dialog "${id}"`);

  for (const zeile of node.lines) {
    if (!SPEAKERS[zeile.speaker]) {
      meldung(fehler, `Dialog "${id}": unbekannter Sprecher "${zeile.speaker}".`);
    }
  }

  for (const auswahl of node.choices ?? []) {
    if (auswahl.then) pruefeDialog(auswahl.then, `Dialog "${id}" (Auswahl "${auswahl.id}")`);
    pruefeEffekte(auswahl.effects, `Dialog "${id}" (Auswahl "${auswahl.id}")`);
  }
}

// --- 4. Effekte --------------------------------------------------------------

function pruefeEffekte(effekte, wo) {
  for (const effekt of effekte ?? []) {
    if ('giveItem' in effekt && !ITEMS[effekt.giveItem]) {
      meldung(fehler, `${wo}: gibt unbekannten Gegenstand "${effekt.giveItem}".`);
    }
    if ('takeItem' in effekt && !ITEMS[effekt.takeItem]) {
      meldung(fehler, `${wo}: nimmt unbekannten Gegenstand "${effekt.takeItem}".`);
    }
    if ('giveAbility' in effekt && !ABILITIES[effekt.giveAbility]) {
      meldung(fehler, `${wo}: gibt unbekannte Faehigkeit "${effekt.giveAbility}".`);
    }
    for (const schluessel of ['startQuest', 'advanceQuest', 'completeQuest']) {
      if (schluessel in effekt && !QUESTS[effekt[schluessel]]) {
        meldung(fehler, `${wo}: nennt unbekannte Quest "${effekt[schluessel]}".`);
      }
    }
    if ('playScript' in effekt && !SCRIPTS[effekt.playScript]) {
      meldung(fehler, `${wo}: startet unbekanntes Skript "${effekt.playScript}".`);
    }
    if ('solvePuzzle' in effekt && !PUZZLES[effekt.solvePuzzle]) {
      meldung(fehler, `${wo}: loest unbekanntes Raetsel "${effekt.solvePuzzle}".`);
    }
  }
}

// --- 5. Verweise aus den Karten ---------------------------------------------

const genutzteRaetsel = new Set();
const genutzteSkripte = new Set();
const erreichbareQuests = new Set();

for (const area of ALL_AREAS) {
  for (const obj of area.objects ?? []) {
    const wo = `Karte "${area.id}" (${obj.type} bei ${obj.x},${obj.y})`;

    if (obj.type === 'npc' && !NPCS[obj.npc]) {
      meldung(fehler, `${wo}: NPC "${obj.npc}" ist unbekannt.`);
    }
    if (obj.type === 'enemy' && !ENEMIES[obj.enemy]) {
      meldung(fehler, `${wo}: Gegner "${obj.enemy}" ist unbekannt.`);
    }
    if (obj.type === 'boss' && !BOSSES[obj.boss]) {
      meldung(fehler, `${wo}: Boss "${obj.boss}" ist unbekannt.`);
    }
    if (obj.type === 'trigger') {
      if (!SCRIPTS[obj.script]) meldung(fehler, `${wo}: Skript "${obj.script}" ist unbekannt.`);
      else genutzteSkripte.add(obj.script);
    }
    if (obj.type === 'pickup' && !ITEMS[obj.item]) {
      meldung(fehler, `${wo}: Gegenstand "${obj.item}" ist unbekannt.`);
    }
    if (obj.type === 'chest') {
      for (const eintrag of obj.contents) {
        // "coins" ist ein Sonderfall und kein Gegenstand.
        if (eintrag.item !== 'coins' && !ITEMS[eintrag.item]) {
          meldung(fehler, `${wo}: Truheninhalt "${eintrag.item}" ist unbekannt.`);
        }
      }
      if (obj.requiresItem && !ITEMS[obj.requiresItem]) {
        meldung(fehler, `${wo}: verlangt unbekannten Gegenstand "${obj.requiresItem}".`);
      }
    }
    if ('puzzle' in obj && obj.puzzle) {
      if (!PUZZLES[obj.puzzle]) meldung(fehler, `${wo}: Raetsel "${obj.puzzle}" ist unbekannt.`);
      else {
        genutzteRaetsel.add(obj.puzzle);
        if (PUZZLES[obj.puzzle].area !== area.id) {
          meldung(
            fehler,
            `${wo}: Raetsel "${obj.puzzle}" ist fuer Karte "${PUZZLES[obj.puzzle].area}" definiert, liegt aber hier.`,
          );
        }
      }
    }
  }
}

// --- 6. Raetsel ohne Elemente ------------------------------------------------

for (const raetsel of Object.values(PUZZLES)) {
  if (!genutzteRaetsel.has(raetsel.id)) {
    meldung(fehler, `Raetsel "${raetsel.id}" hat auf keiner Karte Elemente und ist unloesbar.`);
  }
}

// --- 7. Erreichbarkeit der Quests -------------------------------------------

const sammleQuests = (effekte) => {
  for (const effekt of effekte ?? []) {
    if ('startQuest' in effekt) erreichbareQuests.add(effekt.startQuest);
  }
};

for (const node of Object.values(DIALOGUES)) {
  sammleQuests(node.effects);
  for (const auswahl of node.choices ?? []) sammleQuests(auswahl.effects);
}
for (const script of Object.values(SCRIPTS)) {
  for (const step of script.steps) {
    if (step.do === 'effects') sammleQuests(step.effects);
  }
}
for (const boss of Object.values(BOSSES)) sammleQuests(boss.rewards);
for (const quest of Object.values(QUESTS)) sammleQuests(quest.rewards);

for (const quest of Object.values(QUESTS)) {
  if (!erreichbareQuests.has(quest.id)) {
    meldung(hinweise, `Quest "${quest.id}" (${quest.name}) wird nirgends gestartet.`);
  }
}

// --- Nicht genutzte Skripte --------------------------------------------------

const skripteAusEffekten = new Set();
for (const node of Object.values(DIALOGUES)) {
  for (const effekt of node.effects ?? []) {
    if ('playScript' in effekt) skripteAusEffekten.add(effekt.playScript);
  }
}
for (const id of Object.keys(SCRIPTS)) {
  if (!genutzteSkripte.has(id) && !skripteAusEffekten.has(id)) {
    meldung(hinweise, `Skript "${id}" wird von keinem Trigger und keinem Effekt aufgerufen.`);
  }
}

// --- Ausgabe -----------------------------------------------------------------

console.log(
  `Geprueft: ${Object.keys(DIALOGUES).length} Dialogknoten, ${Object.keys(NPCS).length} NPCs, ` +
    `${Object.keys(QUESTS).length} Quests, ${Object.keys(PUZZLES).length} Raetsel, ` +
    `${Object.keys(SCRIPTS).length} Skripte\n`,
);

for (const h of hinweise) console.log(`HINWEIS  ${h}`);
if (hinweise.length > 0) console.log('');
for (const f of fehler) console.log(`FEHLER   ${f}`);

if (fehler.length > 0) {
  console.log(`\n${fehler.length} Fehler gefunden.`);
  process.exit(1);
}
console.log('Alle Verweise in Ordnung.');
