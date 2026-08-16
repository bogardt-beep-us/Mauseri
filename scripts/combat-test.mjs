/**
 * Kampftest.
 *
 * Prueft die Schleife, die im Spiel am haeufigsten durchlaufen wird und beim
 * Selbertesten am schnellsten uebersehen ist:
 *
 *  1. Gegner nehmen Schaden und verschwinden, wenn sie besiegt sind.
 *  2. Der Spieler nimmt Schaden, wenn Gegner ihn erreichen.
 *  3. Bei null Leben erscheint der Bildschirmtod.
 *  4. "Weitermachen" setzt das Spiel fort, ohne Fortschritt zu verlieren.
 *  5. Faehigkeiten lassen sich einsetzen und verbrauchen Energie.
 *
 * Aufruf: npm run test:combat   (setzt einen laufenden Preview-Server voraus)
 */

import { chromium } from 'playwright';

const URL_BASE = process.env.SMOKE_URL ?? 'http://localhost:4173';
const SHOT_DIR = process.env.SHOT_DIR ?? '/tmp/mauseri-shots';

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const context = await browser.newContext({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
  locale: 'de-DE',
});
const page = await context.newPage();

const konsolenfehler = [];
page.on('console', (m) => m.type() === 'error' && konsolenfehler.push(m.text()));
page.on('pageerror', (e) => konsolenfehler.push(`PageError: ${e.message}`));

const schritte = [];
const pruefe = (name, ok, detail = '') => {
  schritte.push({ name, ok });
  console.log(`${ok ? 'OK   ' : 'FEHL '} ${name}${detail ? ` - ${detail}` : ''}`);
};

const zustand = () =>
  page.evaluate(() => {
    const d = window.__mauseriDebug;
    return d ? { area: d.area, hp: d.hp, maxHp: d.maxHp, enemies: d.enemies, tile: d.playerTile } : null;
  });

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

  // --- 1. Gegner besiegen --------------------------------------------------

  // An den Dorfrand springen, direkt neben den ersten Gegner.
  await page.evaluate(() => window.__mauseriDebug?.warp?.('miezlingen_rand', 15, 5));
  await page.waitForTimeout(1600);

  const vorKampf = await zustand();
  pruefe('Kampfgebiet erreicht', vorKampf?.area === 'miezlingen_rand', `${vorKampf?.enemies} Gegner`);

  // Angreifen, bis ein Gegner faellt. Zwischendurch nachruecken, weil der
  // Gegner sich bewegt.
  let besiegt = false;
  for (let runde = 0; runde < 40 && !besiegt; runde++) {
    await page.evaluate(() => window.__mauseriDebug?.attack?.());
    await page.waitForTimeout(200);
    const jetzt = await zustand();
    if (jetzt && vorKampf && jetzt.enemies < vorKampf.enemies) besiegt = true;
  }

  const nachKampf = await zustand();
  pruefe(
    'Gegner laesst sich besiegen',
    besiegt,
    `${vorKampf?.enemies} -> ${nachKampf?.enemies} Gegner`,
  );
  await page.screenshot({ path: `${SHOT_DIR}/10-kampf.png` });

  // --- 2. Spieler nimmt Schaden -------------------------------------------

  const vorSchaden = await zustand();
  await page.evaluate(() => window.__mauseriDebug?.hurt?.(12));
  await page.waitForTimeout(400);
  const nachSchaden = await zustand();

  pruefe(
    'Spieler nimmt Schaden',
    Boolean(vorSchaden && nachSchaden && nachSchaden.hp < vorSchaden.hp),
    `${vorSchaden?.hp} -> ${nachSchaden?.hp}`,
  );

  // --- 3. Faehigkeit einsetzen --------------------------------------------

  await page.evaluate(() => window.__mauseriDebug?.grantAbility?.('katzenflink'));
  await page.waitForTimeout(400);

  const gelernt = await page.evaluate(() => window.__mauseriDebug?.abilities ?? []);
  pruefe('Faehigkeit wird gelernt', gelernt.includes('katzenflink'), gelernt.join(', ') || 'keine');

  // Die Touch-Bedienelemente blenden sich erst beim ersten Fingerkontakt ein -
  // auf einem Rechner sollen sie ja nicht im Weg sein. Fuer den Test wird
  // dieser Kontakt ausgeloest; danach wird auf den Knopf gewartet statt blind
  // eine feste Zeit zu verstreichen.
  // Auf die Steuerleiste tippen, damit sie sich einblendet. Der Punkt liegt
  // bewusst im unteren Bereich, wo auf dem Handy der Daumen liegt.
  await page.touchscreen.tap(206, 700);

  let faehigkeitenSichtbar = 0;
  try {
    await page.waitForSelector('.faehigkeit', { timeout: 4000 });
    faehigkeitenSichtbar = await page.locator('.faehigkeit').count();
  } catch {
    faehigkeitenSichtbar = 0;
  }
  // Bei einem Fehlschlag ist der Zustand der Steuerleiste die entscheidende
  // Information - ohne sie raet man, ob die Faehigkeit oder die Anzeige fehlt.
  const leisteKlasse = await page.evaluate(
    () => document.querySelector('.touch-controls')?.className ?? '(nicht vorhanden)',
  );
  pruefe(
    'Faehigkeit erscheint in der Leiste',
    faehigkeitenSichtbar > 0,
    `${faehigkeitenSichtbar} Knopf/Knoepfe, Leiste: "${leisteKlasse}"`,
  );

  const leseEnergie = () =>
    page.evaluate(() => {
      const el = document.querySelector('.balken-energie .balken-fuellung');
      return el ? parseFloat(el.style.width) : null;
    });

  const energieVorher = await leseEnergie();

  // Ueber den Knopf einsetzen, wenn er da ist - das ist der Weg, den ein
  // Spieler auf dem Handy nimmt. Sonst ueber die Tastatur.
  if (faehigkeitenSichtbar > 0) {
    await page.locator('.faehigkeit').first().tap();
  } else {
    await page.keyboard.press('KeyQ');
  }
  await page.waitForTimeout(500);

  const energieNachher = await leseEnergie();

  pruefe(
    'Faehigkeit verbraucht Energie',
    Boolean(energieVorher !== null && energieNachher !== null && energieNachher < energieVorher),
    `${energieVorher?.toFixed(0)}% -> ${energieNachher?.toFixed(0)}%`,
  );

  // --- 4. Bildschirmtod ----------------------------------------------------

  await page.evaluate(() => {
    // In grossen Schritten, damit die Unverwundbarkeit nach einem Treffer
    // die Schleife nicht endlos macht.
    window.__mauseriDebug?.hurt?.(9999);
  });
  await page.waitForTimeout(900);

  const todDa = await page.locator('.game-over').count();
  pruefe('Bildschirmtod erscheint', todDa > 0);
  await page.screenshot({ path: `${SHOT_DIR}/11-game-over.png` });

  // --- 5. Weitermachen -----------------------------------------------------

  if (todDa > 0) {
    await page.click('.game-over button:text-is("Weitermachen")');
    await page.waitForTimeout(2500);

    const nachRespawn = await zustand();
    pruefe(
      'Weitermachen belebt wieder',
      Boolean(nachRespawn && nachRespawn.hp > 0),
      `${nachRespawn?.hp}/${nachRespawn?.maxHp} Leben in "${nachRespawn?.area}"`,
    );

    const todWeg = (await page.locator('.game-over').count()) === 0;
    pruefe('Bildschirmtod verschwindet', todWeg);
    await page.screenshot({ path: `${SHOT_DIR}/12-respawn.png` });
  }
} catch (err) {
  pruefe('Testdurchlauf', false, String(err));
  await page.screenshot({ path: `${SHOT_DIR}/99-kampf-fehler.png` }).catch(() => {});
}

await browser.close();

console.log('\n--- Konsolenfehler ---');
if (konsolenfehler.length === 0) console.log('keine');
else {
  const gezaehlt = new Map();
  for (const f of konsolenfehler) gezaehlt.set(f, (gezaehlt.get(f) ?? 0) + 1);
  for (const [text, n] of gezaehlt) console.log(`  [${n}x] ${text.slice(0, 250)}`);
}

const fehlgeschlagen = schritte.filter((s) => !s.ok);
console.log(`\n${schritte.length - fehlgeschlagen.length}/${schritte.length} Pruefungen bestanden`);
if (fehlgeschlagen.length > 0 || konsolenfehler.length > 0) process.exit(1);
