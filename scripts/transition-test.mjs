/**
 * Kartenwechsel-Test.
 *
 * Portale loesen beim Betreten aus - der Spieler haelt den Joystick also
 * zwangslaeufig noch fest, waehrend die neue Karte laedt. Genau in dieser
 * Sekunde darf die Steuerung nicht haengenbleiben.
 *
 * Aufruf: npm run test:transition  (setzt einen laufenden Preview-Server voraus)
 */

import { chromium } from 'playwright';

const URL = process.env.SMOKE_URL ?? 'http://localhost:4173';
const SHOT_DIR = process.env.SHOT_DIR ?? '/tmp/mauseri-shots';

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});

const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
  locale: 'de-DE',
});

const page = await context.newPage();

const fehler = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') fehler.push(msg.text());
});
page.on('pageerror', (err) => fehler.push(`PageError: ${err.message}`));

const schritte = [];
const pruefe = (name, ok, detail = '') => {
  schritte.push({ name, ok, detail });
  console.log(`${ok ? 'OK   ' : 'FEHL '} ${name}${detail ? ` - ${detail}` : ''}`);
};

const zustand = () => page.evaluate(() => window.__mauseriDebug);

try {
  await page.goto(`${URL}?test=1`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('.title-screen h1', { timeout: 15000 });
  await page.click('text=Neues Spiel');
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(2500);

  for (let i = 0; i < 40; i++) {
    if ((await page.locator('.dialog-box').count()) === 0) break;
    await page.click('.dialog-schicht', { position: { x: 195, y: 700 } });
    await page.waitForTimeout(220);
  }

  await page.touchscreen.tap(195, 500);
  await page.waitForSelector('.touch-controls:not(.versteckt)', { timeout: 5000 });
  const zone = await page.locator('.joystick-zone').boundingBox();
  const client = await page.context().newCDPSession(page);

  /** Zieht den Joystick in eine Richtung und HAELT ihn. */
  const halten = async (dx, dy, id) => {
    const start = { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 };
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: start.x, y: start.y, id }],
    });
    for (let i = 1; i <= 6; i++) {
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: start.x + (dx * i * 46) / 6, y: start.y + (dy * i * 46) / 6, id }],
      });
      await page.waitForTimeout(20);
    }
  };
  const loslassen = () =>
    client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  const start = await zustand();
  pruefe('Startkarte', start.area === 'miezlingen_home', start.area);

  // Direkt vor die Tuer stellen (Portal liegt bei 7,9), damit der Test das
  // Portal sicher trifft und nicht an einer Wand haengenbleibt.
  await page.evaluate(() => window.__mauseriDebug.placeAt(7, 7));
  await page.waitForTimeout(300);

  // Nach unten halten - und den Finger waehrend des Kartenwechsels NICHT heben.
  await halten(0, 1, 1);
  await page.waitForTimeout(3000);

  const drin = await zustand();
  pruefe('Karte gewechselt', drin.area !== 'miezlingen_home', `${start.area} -> ${drin.area}`);

  // Finger erst NACH dem Wechsel heben - so macht es ein echter Spieler auch.
  await loslassen();
  await page.waitForTimeout(400);

  // Ein etwaiger Dialog auf der neuen Karte weg.
  for (let i = 0; i < 20; i++) {
    if ((await page.locator('.dialog-box').count()) === 0) break;
    await page.click('.dialog-schicht', { position: { x: 195, y: 700 } });
    await page.waitForTimeout(220);
  }

  // Die eigentliche Frage: laesst sich die Figur danach noch bewegen?
  const vorher = (await zustand()).playerTile;
  await halten(0, 1, 3);
  await page.waitForTimeout(1000);
  await loslassen();
  await page.waitForTimeout(300);
  const nachher = (await zustand()).playerTile;

  pruefe(
    'Joystick funktioniert nach dem Kartenwechsel',
    vorher.x !== nachher.x || vorher.y !== nachher.y,
    `${vorher.x},${vorher.y} -> ${nachher.x},${nachher.y}`,
  );

  // Und laeuft sie nicht von allein weiter?
  const a = (await zustand()).playerTile;
  await page.waitForTimeout(700);
  const b = (await zustand()).playerTile;
  pruefe('Figur laeuft nicht von allein weiter', a.x === b.x && a.y === b.y, `${b.x},${b.y}`);

  pruefe('Steuerung lebt noch', (await page.locator('.touch-controls').count()) > 0);
  await page.screenshot({ path: `${SHOT_DIR}/transition-01.png` });

  // Zweite Runde: durch die Tuer zurueck, den Finger dabei DURCHGEHEND halten
  // und danach OHNE Neuansetzen weiterlaufen. Genau so bedient man das Spiel
  // wirklich - man hebt den Daumen nicht extra fuer jede Tuer.
  await page.evaluate(() => window.__mauseriDebug.placeAt(5, 5));
  await page.waitForTimeout(300);
  const vorTuer = (await zustand()).area;

  await halten(0, -1, 4);
  await page.waitForTimeout(3000);
  const nachTuer = await zustand();
  pruefe('Zurueck durch die Tuer', nachTuer.area !== vorTuer, `${vorTuer} -> ${nachTuer.area}`);

  // Finger liegt weiterhin auf dem Glas.
  const haltenA = (await zustand()).playerTile;
  await page.waitForTimeout(900);
  const haltenB = (await zustand()).playerTile;
  await loslassen();
  pruefe(
    'Gehaltener Joystick laeuft nach der Tuer weiter',
    haltenA.x !== haltenB.x || haltenA.y !== haltenB.y,
    `${haltenA.x},${haltenA.y} -> ${haltenB.x},${haltenB.y}`,
  );
} catch (err) {
  pruefe('Testdurchlauf', false, String(err.message ?? err).split('\n')[0]);
}

console.log('\n--- Konsolenfehler ---');
console.log(fehler.length === 0 ? 'keine' : fehler.join('\n'));

const bestanden = schritte.filter((s) => s.ok).length;
console.log(`\n${bestanden}/${schritte.length} Pruefungen bestanden`);

await browser.close();
if (bestanden < schritte.length || fehler.length > 0) process.exit(1);
