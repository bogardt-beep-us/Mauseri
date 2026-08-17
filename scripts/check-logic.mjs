/**
 * Prueft die Spiellogik - nicht ob Daten existieren, sondern ob sie Sinn ergeben.
 *
 * check:maps prueft Geometrie, check:content prueft Verweise. Dieses Skript
 * prueft die Fragen, die erst beim Spielen auffallen wuerden:
 *
 *  1. Ist jede Karte vom Startpunkt aus erreichbar?
 *  2. Wird jedes Flag, das irgendwo abgefragt wird, auch irgendwo gesetzt?
 *  3. Ist jeder Gegenstand, den eine Tuer oder Truhe verlangt, erreichbar?
 *  4. Kann jede Quest ihren letzten Schritt erfuellen und abgeschlossen werden?
 *  5. Gibt es zirkulaere Dialoge - ein Knoten setzt Flag X, ist aber selbst
 *     nur sichtbar, wenn X schon gesetzt ist? Der waere nie erreichbar.
 *  6. Haengt ein Objekt an einer Bedingung, die erst waehrend des Aufenthalts
 *     auf derselben Karte wahr wird? Das Objekt erschiene dann erst beim
 *     naechsten Betreten.
 *
 * Aufruf: npm run check:logic
 */

import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = async (p) => import(pathToFileURL(join(ROOT, 'src', p)).href);

const { DIALOGUES } = await load('data/dialogues/index.ts');
const { NPCS } = await load('data/npcs.ts');
const { SCRIPTS } = await load('data/scripts.ts');
const { BOSSES } = await load('data/bosses.ts');
const { ITEMS } = await load('data/items.ts');
const { QUESTS } = await load('data/quests.ts');
const { PUZZLES } = await load('data/puzzles.ts');
const { ALL_AREAS, AREAS } = await load('data/areas/index.ts');
const { ENEMIES } = await load('data/enemies.ts');
const { ABILITIES } = await load('data/abilities.ts');

const START_AREA = 'miezlingen_home';

const fehler = [];
const hinweise = [];

// ---------------------------------------------------------------------------
// Sammeln: was setzt was?
// ---------------------------------------------------------------------------

const gesetzteFlags = new Set();
const abgefragteFlags = new Map(); // flag -> [wo]
const gegebeneItems = new Set();
const verlangteItems = new Map(); // item -> [wo]
const geloesteQuests = new Set();
const gestarteteQuests = new Set();

const merkeAbfrage = (map, key, wo) => {
  const liste = map.get(key) ?? [];
  liste.push(wo);
  map.set(key, liste);
};

/** Laeuft ueber alle Effekte im Spiel und merkt sich, was sie setzen. */
function sammleEffekte(effekte, wo) {
  for (const e of effekte ?? []) {
    if ('setFlag' in e && e.value !== false) gesetzteFlags.add(e.setFlag);
    if ('giveItem' in e) gegebeneItems.add(e.giveItem);
    if ('startQuest' in e) gestarteteQuests.add(e.startQuest);
    if ('completeQuest' in e) geloesteQuests.add(e.completeQuest);
    void wo;
  }
}

/** Laeuft ueber eine Bedingung und merkt sich, was sie abfragt. */
function sammleBedingung(cond, wo) {
  if (!cond) return;
  if ('flag' in cond) merkeAbfrage(abgefragteFlags, cond.flag, wo);
  if ('hasItem' in cond) merkeAbfrage(verlangteItems, cond.hasItem, wo);
  if ('all' in cond) cond.all.forEach((c) => sammleBedingung(c, wo));
  if ('any' in cond) cond.any.forEach((c) => sammleBedingung(c, wo));
  if ('not' in cond) sammleBedingung(cond.not, wo);
}

for (const [id, node] of Object.entries(DIALOGUES)) {
  sammleEffekte(node.effects, `Dialog "${id}"`);
  for (const w of node.choices ?? []) {
    sammleEffekte(w.effects, `Dialog "${id}"`);
    sammleBedingung(w.showIf, `Dialog "${id}"`);
  }
}
for (const [id, s] of Object.entries(SCRIPTS)) {
  for (const step of s.steps) {
    if (step.do === 'effects') sammleEffekte(step.effects, `Skript "${id}"`);
  }
}
for (const b of Object.values(BOSSES)) sammleEffekte(b.rewards, `Boss "${b.id}"`);
for (const q of Object.values(QUESTS)) sammleEffekte(q.rewards, `Quest "${q.id}"`);
for (const p of Object.values(PUZZLES)) sammleEffekte(p.rewards, `Raetsel "${p.id}"`);

for (const npc of Object.values(NPCS)) {
  for (const d of npc.dialogue) sammleBedingung(d.showIf, `NPC "${npc.id}"`);
}
for (const q of Object.values(QUESTS)) {
  for (const [i, step] of q.steps.entries()) {
    sammleBedingung(step.done, `Quest "${q.id}" Schritt ${i}`);
  }
}
for (const area of ALL_AREAS) {
  for (const o of area.objects ?? []) {
    sammleBedingung(o.showIf, `Karte "${area.id}"`);
    if (o.type === 'portal') {
      sammleBedingung(o.lockedUnless, `Portal in "${area.id}"`);
    }
    if (o.type === 'gate') sammleBedingung(o.opensIf, `Tor in "${area.id}"`);
    if (o.type === 'chest') {
      for (const c of o.contents) if (c.item !== 'coins') gegebeneItems.add(c.item);
      if (o.requiresItem) merkeAbfrage(verlangteItems, o.requiresItem, `Truhe "${o.id}"`);
    }
    if (o.type === 'pickup') gegebeneItems.add(o.item);
  }
}
for (const e of Object.values(ENEMIES)) {
  for (const d of e.drops ?? []) if (d.item) gegebeneItems.add(d.item);
}
for (const npc of Object.values(NPCS)) {
  for (const angebot of npc.shop ?? []) gegebeneItems.add(angebot.item);
}

// ---------------------------------------------------------------------------
// 1. Erreichbarkeit der Karten
// ---------------------------------------------------------------------------

const nachbarn = new Map();
for (const area of ALL_AREAS) {
  const ziele = new Set();
  for (const o of area.objects ?? []) {
    if (o.type === 'portal') ziele.add(o.to);
  }
  // Skripte koennen den Spieler ebenfalls versetzen.
  nachbarn.set(area.id, ziele);
}
for (const s of Object.values(SCRIPTS)) {
  for (const step of s.steps) {
    if (step.do === 'warp') {
      // Aus einem Skript heraus kann jede Karte erreicht werden; das Skript
      // haengt aber an einem Trigger auf einer bestimmten Karte.
      for (const area of ALL_AREAS) {
        const hatTrigger = (area.objects ?? []).some(
          (o) => o.type === 'trigger' && o.script === s.id,
        );
        if (hatTrigger) nachbarn.get(area.id)?.add(step.to);
      }
    }
  }
}

const erreicht = new Set([START_AREA]);
const queue = [START_AREA];
while (queue.length > 0) {
  const aktuell = queue.shift();
  for (const ziel of nachbarn.get(aktuell) ?? []) {
    if (!erreicht.has(ziel)) {
      erreicht.add(ziel);
      queue.push(ziel);
    }
  }
}

for (const area of ALL_AREAS) {
  if (!erreicht.has(area.id)) {
    fehler.push(
      `Karte "${area.id}" (${area.name}) ist vom Start aus nicht erreichbar - kein Portal fuehrt dorthin.`,
    );
  }
}

// ---------------------------------------------------------------------------
// 2. Flags
// ---------------------------------------------------------------------------

for (const [flag, orte] of abgefragteFlags) {
  if (!gesetzteFlags.has(flag)) {
    fehler.push(
      `Flag "${flag}" wird abgefragt (${orte.length}x, z. B. ${orte[0]}), aber nirgends gesetzt - die Bedingung ist nie erfuellbar.`,
    );
  }
}
for (const flag of gesetzteFlags) {
  if (!abgefragteFlags.has(flag)) {
    hinweise.push(`Flag "${flag}" wird gesetzt, aber nie abgefragt.`);
  }
}

// ---------------------------------------------------------------------------
// 3. Gegenstaende
// ---------------------------------------------------------------------------

for (const [item, orte] of verlangteItems) {
  if (!gegebeneItems.has(item)) {
    fehler.push(
      `Gegenstand "${ITEMS[item]?.name ?? item}" wird verlangt (${orte[0]}), ist aber nirgends zu bekommen.`,
    );
  }
}

// ---------------------------------------------------------------------------
// 4. Quests
// ---------------------------------------------------------------------------

for (const quest of Object.values(QUESTS)) {
  if (!gestarteteQuests.has(quest.id)) {
    fehler.push(`Quest "${quest.id}" (${quest.name}) wird nirgends gestartet.`);
  }
  if (!geloesteQuests.has(quest.id)) {
    hinweise.push(
      `Quest "${quest.id}" (${quest.name}) wird nirgends ausdruecklich abgeschlossen - sie muss sich ueber ihre Schrittbedingungen selbst abschliessen.`,
    );
  }
  for (const [i, step] of quest.steps.entries()) {
    if (!step.done) {
      hinweise.push(`Quest "${quest.id}" Schritt ${i} hat keine Bedingung - er gilt nie als erfuellt.`);
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Zirkulaere Dialoge
// ---------------------------------------------------------------------------

for (const npc of Object.values(NPCS)) {
  for (const eintrag of npc.dialogue) {
    const node = DIALOGUES[eintrag.node];
    if (!node || !eintrag.showIf) continue;

    // Welche Flags/Quests setzt dieser Knoten (inkl. seiner then-Kette)?
    const setztFlags = new Set();
    const setztQuestsFertig = new Set();
    const besucht = new Set();
    let aktuell = node;
    while (aktuell && !besucht.has(aktuell.id)) {
      besucht.add(aktuell.id);
      for (const e of aktuell.effects ?? []) {
        if ('setFlag' in e && e.value !== false) setztFlags.add(e.setFlag);
        if ('completeQuest' in e) setztQuestsFertig.add(e.completeQuest);
      }
      aktuell = aktuell.then ? DIALOGUES[aktuell.then] : null;
    }

    const c = eintrag.showIf;
    if ('flag' in c && c.value !== false && setztFlags.has(c.flag)) {
      fehler.push(
        `NPC "${npc.id}": Knoten "${eintrag.node}" setzt Flag "${c.flag}", ist aber nur sichtbar, wenn "${c.flag}" schon gesetzt ist - er ist nie erreichbar.`,
      );
    }
    if ('questState' in c && c.state === 'completed' && setztQuestsFertig.has(c.questState)) {
      fehler.push(
        `NPC "${npc.id}": Knoten "${eintrag.node}" schliesst Quest "${c.questState}" ab, ist aber nur sichtbar, wenn sie bereits abgeschlossen ist - er ist nie erreichbar.`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 5b. Verdeckte Dialogeintraege
// ---------------------------------------------------------------------------
//
// Ein NPC spielt den ERSTEN Eintrag, dessen Bedingung passt. Ein Eintrag ist
// damit tot, wenn ueber ihm einer steht, dessen Bedingung immer schon erfuellt
// ist, wenn seine eigene es ist. Der haeufigste Fall: der obere Eintrag
// verlangt ein Flag, der untere dasselbe Flag und noch etwas.

/** Ist `a` immer wahr, wenn `b` wahr ist? Bewusst konservativ. */
function impliziert(a, b) {
  if (!a) return true; // Ein Eintrag ohne Bedingung verdeckt alles darunter.
  if (!b) return false;
  if ('all' in b) return b.all.some((teil) => impliziert(a, teil));
  if ('all' in a) return a.all.every((teil) => impliziert(teil, b));
  return JSON.stringify(a) === JSON.stringify(b);
}

for (const npc of Object.values(NPCS)) {
  for (let unten = 1; unten < npc.dialogue.length; unten++) {
    for (let oben = 0; oben < unten; oben++) {
      if (!impliziert(npc.dialogue[oben].showIf, npc.dialogue[unten].showIf)) continue;
      fehler.push(
        `NPC "${npc.id}": Eintrag "${npc.dialogue[unten].node}" wird nie gespielt - ` +
          `"${npc.dialogue[oben].node}" steht darueber und trifft immer schon zu.`,
      );
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Objekte, deren Bedingung erst auf derselben Karte wahr wird
// ---------------------------------------------------------------------------

for (const area of ALL_AREAS) {
  const raetselHier = new Set(
    (area.objects ?? []).filter((o) => 'puzzle' in o && o.puzzle).map((o) => o.puzzle),
  );
  const bosseHier = new Set(
    (area.objects ?? []).filter((o) => o.type === 'boss').map((o) => o.boss),
  );
  // Bosse, die ueber ein Skript auf dieser Karte beschworen werden
  for (const o of area.objects ?? []) {
    if (o.type !== 'trigger') continue;
    for (const step of SCRIPTS[o.script]?.steps ?? []) {
      if (step.do === 'boss') bosseHier.add(step.boss);
    }
  }

  for (const o of area.objects ?? []) {
    const c = o.showIf;
    if (!c) continue;
    // Diese Faelle sind zulaessig, seit die Szene wartende Objekte nachzieht,
    // sobald sich der Weltzustand aendert (WorldScene.refreshConditionalObjects).
    // Sie bleiben als Hinweis stehen, weil sie genau die Stellen markieren,
    // an denen dieses Nachziehen funktionieren MUSS - faellt es aus, erscheint
    // hier nichts mehr.
    if ('puzzleSolved' in c && raetselHier.has(c.puzzleSolved)) {
      hinweise.push(
        `Karte "${area.id}": ${o.type}${o.id ? ` "${o.id}"` : ''} haengt am Raetsel "${c.puzzleSolved}" auf derselben Karte - muss zur Laufzeit nachgezogen werden.`,
      );
    }
    if ('bossDefeated' in c && bosseHier.has(c.bossDefeated)) {
      hinweise.push(
        `Karte "${area.id}": ${o.type}${o.id ? ` "${o.id}"` : ''} haengt am Boss "${c.bossDefeated}" auf derselben Karte - muss zur Laufzeit nachgezogen werden.`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 6b. Spricht Pookie, waehrend ihn der Nebel hat?
//
// Zwischen der Trennung und dem Wiedersehen ist Pookie nicht in der Gruppe.
// Jede Zeile, die er in diesem Fenster spricht, ist ein Widerspruch - und das
// Fenster liegt genau auf den Schattenlande-Karten, die der Spieler dann
// zwangslaeufig durchquert.
// ---------------------------------------------------------------------------

const OHNE_POOKIE = ['schattenlande_pfad', 'schattenlande_dorf', 'schattenlande_ruine'];

/** Alle Knoten, die von einem Startknoten aus erreichbar sind (then-Ketten). */
function dialogKette(startId, gesehen = new Set()) {
  if (!startId || gesehen.has(startId)) return gesehen;
  const node = DIALOGUES[startId];
  if (!node) return gesehen;
  gesehen.add(startId);
  if (node.then) dialogKette(node.then, gesehen);
  for (const w of node.choices ?? []) if (w.then) dialogKette(w.then, gesehen);
  return gesehen;
}

/** Ist dieser Knoten dadurch abgesichert, dass Pookie schon zurueck ist? */
const nurNachWiedersehen = (cond) => {
  if (!cond) return false;
  if ('flag' in cond) return cond.flag === 'pookie_zurueck' && cond.value !== false;
  if ('bossDefeated' in cond) return cond.bossDefeated === 'nebelfuerst';
  if ('all' in cond) return cond.all.some(nurNachWiedersehen);
  return false;
};

for (const areaId of OHNE_POOKIE) {
  const area = AREAS[areaId];
  if (!area) continue;

  for (const o of area.objects ?? []) {
    // Die Szenen, in denen Pookie noch bzw. wieder da ist, sind ausgenommen.
    if (
      o.type === 'trigger' &&
      ['trennung', 'wiedersehen', 'nebelfuerst_erwacht', 'schattenlande_ankunft'].includes(o.script)
    ) {
      continue;
    }
    if (nurNachWiedersehen(o.showIf)) continue;

    const startknoten = [];
    if (o.type === 'npc') {
      for (const e of NPCS[o.npc]?.dialogue ?? []) {
        if (!nurNachWiedersehen(e.showIf)) startknoten.push(e.node);
      }
    }
    if (o.type === 'trigger') {
      for (const step of SCRIPTS[o.script]?.steps ?? []) {
        if (step.do === 'dialogue') startknoten.push(step.node);
      }
    }

    for (const start of startknoten) {
      for (const knotenId of dialogKette(start)) {
        const node = DIALOGUES[knotenId];
        if (!node?.lines.some((l) => l.speaker === 'pookie')) continue;
        // Die Ankunftsszene laeuft noch vor der Trennung.
        if (knotenId === 'schattenlande_ankunft_1') continue;
        fehler.push(
          `Dialog "${knotenId}" auf Karte "${areaId}": Pookie spricht, obwohl er zwischen ` +
            `Trennung und Wiedersehen nicht in der Gruppe ist.`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Ist das Spiel durchspielbar?
//
// Der eigentliche Test. Ausgehend vom Startraum wird wiederholt alles
// eingesammelt, was gerade erreichbar ist - Gegenstaende, Raetsel, Bosse,
// Dialoge, Trigger - und danach geprueft, welche Tueren sich dadurch geoeffnet
// haben. Das laeuft bis sich nichts mehr aendert. Bleibt der Thronsaal
// draussen, gibt es irgendwo eine Verriegelung, die sich nicht loesen laesst.
// ---------------------------------------------------------------------------

const welt = {
  areas: new Set([START_AREA]),
  flags: new Set(),
  items: new Map(), // item -> Anzahl (nur wachsend: "jemals besessen")
  puzzles: new Set(),
  bosses: new Set(),
  slain: new Set(),
  abilities: new Set(),
  quests: new Map(),
  secrets: 0,
};

const hatItem = (id, n = 1) => (welt.items.get(id) ?? 0) >= n;
const gibItem = (id, n = 1) => welt.items.set(id, (welt.items.get(id) ?? 0) + n);

function pruefeBedingung(c) {
  if (!c) return true;
  if ('flag' in c) return welt.flags.has(c.flag) === (c.value ?? true);
  if ('hasItem' in c) return hatItem(c.hasItem, c.count ?? 1);
  if ('questState' in c) return (welt.quests.get(c.questState) ?? 'unknown') === c.state;
  if ('hasAbility' in c) return welt.abilities.has(c.hasAbility);
  if ('puzzleSolved' in c) return welt.puzzles.has(c.puzzleSolved);
  if ('bossDefeated' in c) return welt.bosses.has(c.bossDefeated);
  if ('slain' in c) return welt.slain.has(c.slain);
  if ('secretsFound' in c) return welt.secrets >= c.secretsFound;
  if ('all' in c) return c.all.every(pruefeBedingung);
  if ('any' in c) return c.any.some(pruefeBedingung);
  if ('not' in c) return !pruefeBedingung(c.not);
  return true;
}

function wendeAn(effekte) {
  for (const e of effekte ?? []) {
    if ('setFlag' in e && e.value !== false) welt.flags.add(e.setFlag);
    else if ('giveItem' in e) gibItem(e.giveItem, e.count ?? 1);
    else if ('giveAbility' in e) welt.abilities.add(e.giveAbility);
    else if ('startQuest' in e && !welt.quests.has(e.startQuest)) welt.quests.set(e.startQuest, 'active');
    else if ('completeQuest' in e) {
      if (welt.quests.get(e.completeQuest) !== 'completed') {
        welt.quests.set(e.completeQuest, 'completed');
        wendeAn(QUESTS[e.completeQuest]?.rewards);
      }
    } else if ('solvePuzzle' in e) welt.puzzles.add(e.solvePuzzle);
    else if ('playScript' in e) fuehreSkriptAus(e.playScript);
    // takeItem wird bewusst ignoriert: fuer die Frage "war es je erreichbar?"
    // zaehlt der Besitz, nicht der aktuelle Bestand.
  }
}

function fuehreSkriptAus(id) {
  const s = SCRIPTS[id];
  if (!s) return;
  for (const step of s.steps) {
    if (step.do === 'effects') wendeAn(step.effects);
    if (step.do === 'dialogue') spieleDialog(step.node);
    if (step.do === 'warp') welt.areas.add(step.to);
    if (step.do === 'boss') besiegeBoss(step.boss);
  }
}

function spieleDialog(id, tiefe = 0) {
  const node = DIALOGUES[id];
  if (!node || tiefe > 20) return;
  wendeAn(node.effects);
  // Auswahlmoeglichkeiten: der Spieler kann jede waehlen, also gilt alles
  // Erreichbare als erreichbar.
  for (const w of node.choices ?? []) {
    if (pruefeBedingung(w.showIf)) {
      wendeAn(w.effects);
      if (w.then) spieleDialog(w.then, tiefe + 1);
    }
  }
  if (node.then) spieleDialog(node.then, tiefe + 1);
}

function besiegeBoss(id) {
  if (welt.bosses.has(id)) return;
  const boss = BOSSES[id];
  if (!boss) return;
  welt.bosses.add(id);
  if (boss.outroDialogue) spieleDialog(boss.outroDialogue);
  wendeAn(boss.rewards);
}

/** Quests weiterschalten wie im Spiel (gameState.syncQuests). */
function synchronisiereQuests() {
  for (const quest of Object.values(QUESTS)) {
    if (welt.quests.get(quest.id) !== 'active') continue;
    if (quest.steps.every((s) => pruefeBedingung(s.done))) {
      welt.quests.set(quest.id, 'completed');
      wendeAn(quest.rewards);
    }
  }
}

/** Bereits eingesammelte Truhen und Fundstuecke. */
const geerntet = new Set();

let runde = 0;
let veraendert = true;
while (veraendert && runde < 60) {
  runde++;
  const vorher = JSON.stringify([
    welt.areas.size, welt.flags.size, welt.items.size, welt.puzzles.size,
    welt.bosses.size, welt.slain.size, welt.abilities.size,
    [...welt.quests.entries()].sort().join(),
  ]);

  for (const areaId of [...welt.areas]) {
    const area = AREAS[areaId];
    if (!area) continue;

    for (const o of area.objects ?? []) {
      if (!pruefeBedingung(o.showIf)) continue;

      // Jede Truhe und jedes Fundstueck nur einmal - sonst wachsen die
      // Stueckzahlen in jeder Runde weiter, und Bedingungen wie "sieben
      // Tagebuchseiten" waeren immer erfuellt, egal wie viele es wirklich gibt.
      const schluessel = `${areaId}:${o.type}:${o.id ?? `${o.x},${o.y}`}`;

      switch (o.type) {
        case 'chest':
          if (!geerntet.has(schluessel) && (!o.requiresItem || hatItem(o.requiresItem))) {
            geerntet.add(schluessel);
            for (const c of o.contents) if (c.item !== 'coins') gibItem(c.item, c.count ?? 1);
          }
          break;
        case 'pickup':
          if (!geerntet.has(schluessel)) {
            geerntet.add(schluessel);
            gibItem(o.item, o.count ?? 1);
            welt.secrets++;
          }
          break;
        case 'enemy':
          if (o.permanent && o.id) welt.slain.add(o.id);
          break;
        case 'boss':
          besiegeBoss(o.boss);
          break;
        case 'trigger':
          fuehreSkriptAus(o.script);
          break;
        case 'npc': {
          const npc = NPCS[o.npc];
          for (const eintrag of npc?.dialogue ?? []) {
            if (pruefeBedingung(eintrag.showIf)) {
              spieleDialog(eintrag.node);
              break;
            }
          }
          for (const angebot of npc?.shop ?? []) gibItem(angebot.item);
          break;
        }
        case 'switch':
        case 'plate':
        case 'torch':
        case 'mirror':
        case 'valve':
        case 'rune':
          // Raetselelement vorhanden -> das Raetsel gilt als loesbar.
          if (o.puzzle && !welt.puzzles.has(o.puzzle)) {
            welt.puzzles.add(o.puzzle);
            wendeAn(PUZZLES[o.puzzle]?.rewards);
          }
          break;
        default:
          break;
      }
    }

    synchronisiereQuests();

    // Jetzt pruefen, welche Portale offen sind.
    for (const o of area.objects ?? []) {
      if (o.type !== 'portal') continue;
      if (!pruefeBedingung(o.showIf)) continue;
      if (o.lockedUnless && !pruefeBedingung(o.lockedUnless)) continue;
      welt.areas.add(o.to);
    }
  }

  const nachher = JSON.stringify([
    welt.areas.size, welt.flags.size, welt.items.size, welt.puzzles.size,
    welt.bosses.size, welt.slain.size, welt.abilities.size,
    [...welt.quests.entries()].sort().join(),
  ]);
  veraendert = vorher !== nachher;
}

// Mit DEBUG_ITEMS=1 laesst sich nachsehen, wie viele Exemplare eines
// Gegenstands im Durchlauf ueberhaupt zusammenkommen. Nuetzlich, wenn eine
// Bedingung wie "sieben Tagebuchseiten" nicht aufgeht.
if (process.env.DEBUG_ITEMS) {
  console.log('--- Im Durchlauf gesammelte Gegenstaende ---');
  for (const [id, n] of [...welt.items].sort()) console.log(`  ${id}: ${n}`);
  console.log('');
}

// Eine Quest, deren Auftraggeber sie nie vergibt, kann niemand abschliessen.
// Der haeufigste Weg dahin: ein spaeterer Dialogeintrag steht ueber dem
// Eintrag mit `startQuest` und verdeckt ihn, sobald seine Bedingung frueher
// erfuellt ist.
for (const quest of Object.values(QUESTS)) {
  if (!quest.giver) continue;
  if (welt.quests.has(quest.id)) continue;
  const npc = NPCS[quest.giver];
  const vergibt = (npc?.dialogue ?? []).some((e) => startetQuest(e.node, quest.id));
  if (vergibt) {
    fehler.push(
      `Quest "${quest.id}" wird von "${quest.giver}" zwar vergeben, kommt im ` +
        `Durchlauf aber nie an - vermutlich verdeckt ein Eintrag weiter oben ` +
        `in seiner Dialogliste den Eintrag mit "startQuest".`,
    );
  }
}

/** Setzt dieser Dialogknoten (oder seine Fortsetzung) die Quest in Gang? */
function startetQuest(id, questId, tiefe = 0) {
  const node = DIALOGUES[id];
  if (!node || tiefe > 20) return false;
  const inEffekten = (effekte) => (effekte ?? []).some((e) => e.startQuest === questId);
  if (inEffekten(node.effects)) return true;
  for (const w of node.choices ?? []) {
    if (inEffekten(w.effects)) return true;
    if (w.then && startetQuest(w.then, questId, tiefe + 1)) return true;
  }
  return node.then ? startetQuest(node.then, questId, tiefe + 1) : false;
}

const ZIEL = 'schloss_thron';
if (!welt.areas.has(ZIEL)) {
  fehler.push(
    `Das Spiel ist nicht durchspielbar: der Thronsaal bleibt unerreichbar. ` +
      `Erreicht wurden ${welt.areas.size} von ${ALL_AREAS.length} Karten.`,
  );
  for (const area of ALL_AREAS) {
    if (!welt.areas.has(area.id)) {
      fehler.push(`  nicht erreichbar unter Beruecksichtigung aller Schloesser: "${area.id}"`);
    }
  }
} else if (!welt.bosses.has('nyxara')) {
  fehler.push('Der Thronsaal ist erreichbar, aber Nyxara wird nie besiegt - das Finale loest nicht aus.');
} else {
  const offen = Object.values(QUESTS).filter((q) => welt.quests.get(q.id) !== 'completed');
  for (const q of offen) {
    hinweise.push(`Quest "${q.id}" (${q.name}) laesst sich im Durchlauf nicht abschliessen.`);
  }

  // Faehigkeiten sind keine Kuer: an ihnen haengen Kacheln (Schattenfelder,
  // Absaetze) und die Schilde ganzer Gegnertypen.
  for (const id of Object.keys(ABILITIES)) {
    if (!welt.abilities.has(id)) {
      fehler.push(
        `Faehigkeit "${ABILITIES[id].name}" wird im ganzen Spiel nie verliehen - ` +
          `alles, was sie voraussetzt, ist damit unloesbar.`,
      );
    }
  }

  // Gegner mit Schild brauchen die Faehigkeit, gegen die sie schwach sind.
  for (const e of Object.values(ENEMIES)) {
    if (e.weakTo && !welt.abilities.has(e.weakTo)) {
      fehler.push(`Gegner "${e.name}" ist nur mit "${e.weakTo}" verwundbar, die es nie gibt.`);
    }
  }
  console.log(
    `Durchspielbarkeit: Thronsaal erreicht, Nyxara besiegt. ` +
      `${welt.areas.size}/${ALL_AREAS.length} Karten, ` +
      `${Object.values(QUESTS).length - offen.length}/${Object.values(QUESTS).length} Quests abschliessbar, ` +
      `${welt.abilities.size}/5 Faehigkeiten, ${runde} Durchlaeufe.\n`,
  );
}

// ---------------------------------------------------------------------------
// Ausgabe
// ---------------------------------------------------------------------------

console.log(
  `Geprueft: ${ALL_AREAS.length} Karten, ${erreicht.size} davon erreichbar, ` +
    `${abgefragteFlags.size} abgefragte Flags, ${Object.keys(QUESTS).length} Quests\n`,
);

for (const h of hinweise) console.log(`HINWEIS  ${h}`);
if (hinweise.length > 0) console.log('');
for (const f of fehler) console.log(`FEHLER   ${f}`);

if (fehler.length > 0) {
  console.log(`\n${fehler.length} Fehler gefunden.`);
  process.exit(1);
}
console.log('Die Spiellogik ist schluessig.');

void AREAS;
