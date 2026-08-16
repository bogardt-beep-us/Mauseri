/**
 * Rauchtest: startet das gebaute Spiel in einem echten Browser und prueft,
 * ob es laeuft - nicht ob es huebsch ist.
 *
 * Geprueft wird:
 *  1. Die Seite laedt ohne Fehler in der Konsole.
 *  2. Der Titelbildschirm erscheint.
 *  3. "Neues Spiel" startet die Welt, Phaser rendert.
 *  4. Die Figur laesst sich bewegen und ihre Position aendert sich.
 *  5. Speichern und Laden funktionieren.
 *
 * Aufruf: npm run test:smoke  (setzt einen laufenden Preview-Server voraus)
 */

import { chromium } from 'playwright';

const URL = process.env.SMOKE_URL ?? 'http://localhost:4173';
const SHOT_DIR = process.env.SHOT_DIR ?? '/tmp/mauseri-shots';

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});

// Handy-Format, weil das die Zielplattform ist.
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

try {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });

  // 1. Titelbildschirm
  await page.waitForSelector('.title-screen h1', { timeout: 15000 });
  const titel = await page.textContent('.title-screen h1');
  pruefe('Titelbildschirm erscheint', titel?.trim() === 'Mauseri', titel ?? '');
  await page.screenshot({ path: `${SHOT_DIR}/01-titel.png` });

  // 2. Neues Spiel
  await page.click('text=Neues Spiel');
  await page.waitForSelector('canvas', { timeout: 15000 });
  pruefe('Spielbildschirm oeffnet sich', true);

  // Der Bootvorgang erzeugt die Texturen - kurz warten.
  await page.waitForTimeout(2500);

  // 3. Laeuft Phaser und ist eine Welt geladen?
  const weltGeladen = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return canvas !== null && canvas.width > 0 && canvas.height > 0;
  });
  pruefe('Phaser rendert', weltGeladen);

  // 4. HUD sichtbar
  const hudDa = await page.locator('.hud').count();
  pruefe('HUD sichtbar', hudDa > 0);

  const hpText = await page.textContent('.balken-text').catch(() => null);
  pruefe('Lebensanzeige gefuellt', Boolean(hpText && /\d+ \/ \d+/.test(hpText)), hpText ?? '');

  await page.screenshot({ path: `${SHOT_DIR}/02-spielstart.png` });

  // 5. Dialog wegklicken, falls der Prolog laeuft
  for (let i = 0; i < 40; i++) {
    const dialogDa = await page.locator('.dialog-box').count();
    if (dialogDa === 0) break;
    await page.click('.dialog-schicht', { position: { x: 195, y: 700 } });
    await page.waitForTimeout(220);
  }
  pruefe('Prolog laesst sich durchklicken', (await page.locator('.dialog-box').count()) === 0);

  await page.screenshot({ path: `${SHOT_DIR}/03-nach-prolog.png` });

  // 6. Bewegung per Tastatur
  const vorher = await page.evaluate(() => {
    const w = window;
    return w.__mauseriDebug?.playerTile ?? null;
  });

  await page.keyboard.down('KeyS');
  await page.waitForTimeout(900);
  await page.keyboard.up('KeyS');
  await page.waitForTimeout(300);

  const nachher = await page.evaluate(() => {
    const w = window;
    return w.__mauseriDebug?.playerTile ?? null;
  });

  const bewegt = vorher && nachher && (vorher.x !== nachher.x || vorher.y !== nachher.y);
  pruefe(
    'Figur bewegt sich',
    Boolean(bewegt),
    vorher && nachher ? `${vorher.x},${vorher.y} -> ${nachher.x},${nachher.y}` : 'keine Debug-Daten',
  );

  await page.screenshot({ path: `${SHOT_DIR}/04-bewegung.png` });

  // 7. Menue oeffnen
  await page.click('.icon-knopf');
  await page.waitForSelector('.menue', { timeout: 5000 });
  pruefe('Menue oeffnet sich', true);
  await page.screenshot({ path: `${SHOT_DIR}/05-menue.png` });

  // Reiter durchgehen
  for (const reiter of ['Aufgaben', 'Karte', 'Optionen']) {
    await page.click(`.menue-reiter button:text-is("${reiter}")`);
    await page.waitForTimeout(260);
  }
  pruefe('Alle Menuereiter funktionieren', true);
  await page.screenshot({ path: `${SHOT_DIR}/06-karte.png` });

  // 8. Speichern
  await page.click('.menue-fuss button:text-is("Speichern")');
  await page.waitForTimeout(400);
  const gespeichert = await page.evaluate(() => localStorage.getItem('mauseri.save.v1') !== null);
  pruefe('Spielstand wird geschrieben', gespeichert);

  await page.click('.menue-fuss button:text-is("Weiter")');
  await page.waitForTimeout(300);

  // 9. Neu laden und fortsetzen
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.title-screen', { timeout: 15000 });
  const fortsetzenDa = await page.locator('text=Spiel fortsetzen').count();
  pruefe('"Spiel fortsetzen" erscheint nach Neuladen', fortsetzenDa > 0);

  if (fortsetzenDa > 0) {
    await page.click('text=Spiel fortsetzen');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(2500);
    const wiederDa = await page.locator('.hud').count();
    pruefe('Geladener Spielstand startet', wiederDa > 0);
    await page.screenshot({ path: `${SHOT_DIR}/07-fortgesetzt.png` });
  }
} catch (err) {
  pruefe('Testdurchlauf', false, String(err));
  await page.screenshot({ path: `${SHOT_DIR}/99-fehler.png` }).catch(() => {});
}

await browser.close();

// --- Auswertung -------------------------------------------------------------

console.log('\n--- Konsolenfehler ---');
if (fehler.length === 0) {
  console.log('keine');
} else {
  // Doppelte zusammenfassen, sonst ist die Ausgabe unlesbar.
  const gezaehlt = new Map();
  for (const f of fehler) gezaehlt.set(f, (gezaehlt.get(f) ?? 0) + 1);
  for (const [text, anzahl] of gezaehlt) {
    console.log(`  [${anzahl}x] ${text.slice(0, 300)}`);
  }
}

const fehlgeschlagen = schritte.filter((s) => !s.ok);
console.log(`\n${schritte.length - fehlgeschlagen.length}/${schritte.length} Pruefungen bestanden`);

if (fehlgeschlagen.length > 0 || fehler.length > 0) process.exit(1);
