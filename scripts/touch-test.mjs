/**
 * Touch-Test: bedient das Spiel so, wie ein Handy-Spieler es bedient.
 *
 * Der Rauchtest bewegt die Figur per Tastatur. Damit blieb der Joystick - das
 * einzige Steuerelement, das auf dem Zielgeraet ueberhaupt existiert - komplett
 * ungetestet. Dieser Test zieht ihn mit echten Touch-Ereignissen.
 *
 * Aufruf: npm run test:touch  (setzt einen laufenden Preview-Server voraus)
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

const testApi = () => page.evaluate(() => window.__mauseriDebug ?? null);

try {
  await page.goto(`${URL}?test=1`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('.title-screen h1', { timeout: 15000 });

  // Der Vollbild-Knopf muss schon HIER stehen. In der ersten Fassung gab es
  // ihn nur im HUD - wer das Spiel oeffnete und nach Vollbild suchte, fand
  // nichts und hielt die Funktion fuer nicht vorhanden.
  pruefe(
    'Vollbild-Knopf auf dem Titelbildschirm',
    (await page.locator('.title-screen button[aria-label="Vollbild"]').count()) > 0,
  );

  await page.click('text=Neues Spiel');
  await page.waitForSelector('canvas', { timeout: 15000 });

  await page.waitForTimeout(2500);

  // Prolog durchklicken - solange er laeuft, ist die Steuerung gesperrt.
  for (let i = 0; i < 40; i++) {
    if ((await page.locator('.dialog-box').count()) === 0) break;
    await page.click('.dialog-schicht', { position: { x: 195, y: 700 } });
    await page.waitForTimeout(220);
  }
  pruefe('Welt laeuft', (await testApi()) !== null);

  // 1. Erste Beruehrung blendet die Steuerung ein.
  const mitte = { x: 195, y: 500 };
  await page.touchscreen.tap(mitte.x, mitte.y);
  await page.waitForSelector('.touch-controls:not(.versteckt)', { timeout: 5000 });
  pruefe('Steuerung erscheint bei Beruehrung', true);

  const zone = await page.locator('.joystick-zone').boundingBox();
  pruefe('Joystick-Zone vorhanden', zone !== null, zone ? `${Math.round(zone.width)}x${Math.round(zone.height)}` : '');

  // 2. Joystick ziehen - genau das, was ein Spieler als Erstes tut.
  const start = { x: zone.x + zone.width * 0.4, y: zone.y + zone.height * 0.5 };
  const vorher = await page.evaluate(() => window.__mauseriDebug.playerTile);

  await page.touchscreen.tap(start.x, start.y);
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: start.x, y: start.y, id: 1 }],
  });
  // Mehrere kleine Schritte, wie ein echter Daumen. Genau hier - ab dem
  // ZWEITEN Zug, wenn React bereits eine Aktualisierung offen hat - trat der
  // Absturz auf.
  for (let i = 1; i <= 12; i++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: start.x + i * 4, y: start.y, id: 1 }],
    });
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(600);
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  const nachher = await page.evaluate(() => window.__mauseriDebug.playerTile);
  pruefe(
    'Figur bewegt sich per Joystick',
    vorher.x !== nachher.x || vorher.y !== nachher.y,
    `${vorher.x},${vorher.y} -> ${nachher.x},${nachher.y}`,
  );

  // 3. Nach dem Loslassen muss sie stehenbleiben.
  await page.waitForTimeout(400);
  const a = await page.evaluate(() => window.__mauseriDebug.playerTile);
  await page.waitForTimeout(600);
  const b = await page.evaluate(() => window.__mauseriDebug.playerTile);
  pruefe('Figur bleibt nach Loslassen stehen', a.x === b.x && a.y === b.y, `${b.x},${b.y}`);

  // 4. Die Oberflaeche darf nicht weggebrochen sein. Genau das passierte
  //    vorher: ein Fehler im Ziehen riss den ganzen React-Baum mit, und das
  //    Spiel lief unbedienbar weiter.
  const lebt = await page.locator('.touch-controls').count();
  pruefe('Steuerung lebt noch', lebt > 0);
  pruefe('HUD lebt noch', (await page.locator('.hud').count()) > 0);
  pruefe('Keine Fehlergrenze ausgeloest', (await page.locator('.fehler-grenze').count()) === 0);

  await page.screenshot({ path: `${SHOT_DIR}/touch-01-joystick.png` });

  // 5. Nochmal ziehen - der Fehler trat erst auf, wenn React beim zweiten
  //    Zugriff bereits eine Aktualisierung offen hatte.
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: start.x, y: start.y, id: 2 }],
  });
  for (let i = 1; i <= 8; i++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: start.x, y: start.y - i * 4, id: 2 }],
    });
    await page.waitForTimeout(30);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(300);
  pruefe('Zweiter Zug ueberlebt', (await page.locator('.touch-controls').count()) > 0);

  // 6. Vollbild-Knopf. Er muss auch auf dem TITELBILDSCHIRM stehen - dort
  //    schaltet man ihn ein, bevor man losspielt. In der ersten Fassung gab es
  //    ihn nur im HUD, und damit fand ihn niemand.
  pruefe('Vollbild-Knopf im HUD', (await page.locator('.hud button[aria-label="Vollbild"]').count()) > 0);

  // Vollbild-Knopf im Spiel.
  const vollbild = page.locator('button[aria-label="Vollbild"]');
  pruefe('Vollbild-Knopf vorhanden', (await vollbild.count()) > 0);
  if ((await vollbild.count()) > 0) {
    await vollbild.click();
    await page.waitForTimeout(500);
    const drin = await page.evaluate(() => document.fullscreenElement !== null);
    pruefe('Vollbild schaltet ein', drin);
    if (drin) {
      await page.locator('button[aria-label="Vollbild verlassen"]').click();
      await page.waitForTimeout(500);
      pruefe(
        'Vollbild schaltet wieder aus',
        await page.evaluate(() => document.fullscreenElement === null),
      );
    }
  }
  // 7. Der iPhone-Fall. Safari kennt die Fullscreen-API nicht. Der Knopf darf
  //    deswegen NICHT verschwinden - "weg" ist fuer den Spieler nicht von
  //    "kaputt" zu unterscheiden. Er muss stattdessen erklaeren, wie es geht.
  const ohneApi = await context.newPage();
  await ohneApi.addInitScript(() => {
    // So sieht Safari auf dem iPhone aus: keine dieser Methoden existiert.
    const proto = Element.prototype;
    delete proto.requestFullscreen;
    delete proto.webkitRequestFullscreen;
  });
  await ohneApi.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await ohneApi.waitForSelector('.title-screen h1', { timeout: 15000 });

  const knopfOhneApi = ohneApi.locator('.title-screen button[aria-label="Vollbild"]');
  pruefe('Knopf bleibt auch ohne Fullscreen-API sichtbar', (await knopfOhneApi.count()) > 0);
  if ((await knopfOhneApi.count()) > 0) {
    await knopfOhneApi.click();
    await ohneApi.waitForTimeout(200);
    const hinweis = await ohneApi.locator('.vollbild-hinweis').textContent().catch(() => null);
    pruefe(
      'Knopf erklaert stattdessen den Weg ueber den Home-Bildschirm',
      Boolean(hinweis && /Home-Bildschirm/.test(hinweis)),
    );
  }
  await ohneApi.close();
} catch (err) {
  pruefe('Testdurchlauf', false, String(err.message ?? err).split('\n')[0]);
}

console.log('\n--- Konsolenfehler ---');
console.log(fehler.length === 0 ? 'keine' : fehler.join('\n'));

const bestanden = schritte.filter((s) => s.ok).length;
console.log(`\n${bestanden}/${schritte.length} Pruefungen bestanden`);

await browser.close();
if (bestanden < schritte.length || fehler.length > 0) process.exit(1);
