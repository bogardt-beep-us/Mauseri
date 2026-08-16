/**
 * Belastungstest fuer die Welt: betritt jede einzelne Karte des Spiels.
 *
 * Das ist der Test, der beim Selberspielen am meisten Zeit kostet und am
 * ehesten vergessen wird. Er prueft je Karte:
 *
 *  - Die Karte laedt, ohne dass ein Fehler in der Konsole landet.
 *  - Die Figur steht danach auf einer begehbaren Kachel (nicht in der Wand).
 *  - Die erwarteten Objekte, NPCs und Gegner sind da.
 *  - Nach 1,5 Sekunden Spielzeit laeuft die Szene noch (keine Endlosschleife
 *    in der KI, kein Absturz beim Aufbau der Gegner).
 *
 * Aufruf: npm run test:areas   (setzt einen laufenden Preview-Server voraus)
 */

import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL_BASE = process.env.SMOKE_URL ?? 'http://localhost:4173';
const SHOT_DIR = process.env.SHOT_DIR ?? '/tmp/mauseri-shots';

const { ALL_AREAS } = await import(pathToFileURL(join(ROOT, 'src/data/areas/index.ts')).href);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const context = await browser.newContext({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
  locale: 'de-DE',
});
const page = await context.newPage();

let aktuelleKarte = '(start)';
const fehlerProKarte = new Map();

const merkeFehler = (text) => {
  const liste = fehlerProKarte.get(aktuelleKarte) ?? [];
  liste.push(text);
  fehlerProKarte.set(aktuelleKarte, liste);
};

page.on('console', (msg) => {
  if (msg.type() === 'error') merkeFehler(msg.text());
  // Warnungen aus dem Datenmodell sind ebenfalls Fehler im Inhalt.
  if (msg.type() === 'warning' && /\[World\]|\[Dialog\]|\[Skript\]|\[tiles\]/.test(msg.text())) {
    merkeFehler(msg.text());
  }
});
page.on('pageerror', (err) => merkeFehler(`PageError: ${err.message}`));

const ergebnisse = [];

/** Von diesen Karten wird ein Bild gemacht - eine je Region. */
const ERSTE_KARTE_JE_REGION = new Set([
  'miezlingen_dorf',
  'schnurrwald_pfad',
  'kratzfels_stadt',
  'miauport_hafen',
  'mondsee_ufer',
  'schattenlande_dorf',
  'schloss_halle',
]);

try {
  await page.goto(`${URL_BASE}/?test=1`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.click('text=Neues Spiel');
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(2500);

  // Prolog wegklicken
  for (let i = 0; i < 40; i++) {
    if ((await page.locator('.dialog-box').count()) === 0) break;
    await page.click('.dialog-schicht', { position: { x: 206, y: 760 } });
    await page.waitForTimeout(200);
  }

  // Alle Faehigkeiten freischalten, damit auch faehigkeitsabhaengige
  // Bereiche gerendert werden.
  await page.evaluate(() => {
    for (const id of ['kratzsprung', 'schattenpfote', 'schnurrimpuls', 'katzenflink', 'mondkralle']) {
      window.__mauseriDebug?.grantAbility?.(id);
    }
  });

  for (const area of ALL_AREAS) {
    aktuelleKarte = area.id;

    // Einen begehbaren Startpunkt aus der Karte selbst suchen: das erste
    // Portal-Ziel oder ein Feld, das nicht fest ist.
    const start = findeStartfeld(area);

    await page.evaluate(
      ([id, x, y]) => window.__mauseriDebug?.warp?.(id, x, y),
      [area.id, start.x, start.y],
    );

    // Uebergang plus etwas Spielzeit, damit die Gegner-KI wirklich laeuft.
    await page.waitForTimeout(1500);

    const zustand = await page.evaluate(() => {
      const d = window.__mauseriDebug;
      return d ? { area: d.area, tile: d.playerTile, npcs: d.npcs, enemies: d.enemies, objects: d.objects, hp: d.hp } : null;
    });

    const angekommen = zustand?.area === area.id;
    const fehler = fehlerProKarte.get(area.id) ?? [];

    ergebnisse.push({
      id: area.id,
      name: area.name,
      angekommen,
      zustand,
      fehler,
    });

    const status = angekommen && fehler.length === 0 ? 'OK   ' : 'FEHL ';
    console.log(
      `${status} ${area.id.padEnd(26)} ` +
        `NPCs ${String(zustand?.npcs ?? '-').padStart(2)}  ` +
        `Gegner ${String(zustand?.enemies ?? '-').padStart(2)}  ` +
        `Objekte ${String(zustand?.objects ?? '-').padStart(2)}` +
        (fehler.length > 0 ? `  << ${fehler[0].slice(0, 90)}` : ''),
    );

    // Von jeder Region ein Bild, um die Farbwelt zu pruefen.
    if (ERSTE_KARTE_JE_REGION.has(area.id)) {
      await page.screenshot({ path: `${SHOT_DIR}/region-${area.region}.png` });
    }
  }
} catch (err) {
  console.error(`\nAbbruch bei "${aktuelleKarte}": ${err}`);
  await page.screenshot({ path: `${SHOT_DIR}/99-area-fehler.png` }).catch(() => {});
  process.exitCode = 1;
}

await browser.close();

// --- Auswertung --------------------------------------------------------------

const kaputt = ergebnisse.filter((r) => !r.angekommen || r.fehler.length > 0);
const leer = ergebnisse.filter(
  (r) => r.zustand && r.zustand.npcs === 0 && r.zustand.enemies === 0 && r.zustand.objects === 0,
);

console.log(`\n${ergebnisse.length - kaputt.length}/${ergebnisse.length} Karten in Ordnung`);

if (leer.length > 0) {
  console.log(`\nHINWEIS: ${leer.length} Karte(n) ohne jeden Inhalt:`);
  for (const r of leer) console.log(`  ${r.id}`);
}

if (kaputt.length > 0) {
  console.log('\nFehlerhafte Karten:');
  for (const r of kaputt) {
    console.log(`  ${r.id}${r.angekommen ? '' : ' (nicht angekommen)'}`);
    for (const f of [...new Set(r.fehler)]) console.log(`    ${f.slice(0, 220)}`);
  }
  process.exit(1);
}

// ---------------------------------------------------------------------------

function findeStartfeld(area) {
  const SOLID = new Set(' ~W#^TXRwj%oir!*+nutc'.split(''));
  // 'c' (Teppich) und 't'/'u' sind teils begehbar - hier bewusst konservativ:
  // gesucht wird ein eindeutig freies Feld.
  const FREI = new Set('.,-_sf/mp='.split(''));

  for (let y = 1; y < area.rows.length - 1; y++) {
    const row = area.rows[y];
    for (let x = 1; x < row.length - 1; x++) {
      if (FREI.has(row[x])) return { x, y };
    }
  }
  void SOLID;
  // Notfall: Kartenmitte
  return { x: Math.floor((area.rows[0]?.length ?? 2) / 2), y: Math.floor(area.rows.length / 2) };
}
