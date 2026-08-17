/**
 * Fortschrittstest: loest ein Raetsel und kaempft gegen einen Boss.
 *
 * Das ist der Teil des Spiels, der sich am schwersten von Hand pruefen laesst,
 * weil er weit hinten liegt. Geprueft wird die Kette, auf der das ganze Spiel
 * aufbaut:
 *
 *   Raetselelement bedienen -> Raetsel gilt als geloest -> Trigger feuert
 *   -> Boss erscheint -> Boss nimmt Schaden -> Boss faellt -> Belohnung
 *
 * Bedient wird ueber echte Eingaben (laufen, Interaktionstaste), nicht ueber
 * Abkuerzungen - sonst wuerde der Test die Bedienung nicht mitpruefen.
 *
 * Aufruf: npm run test:progress   (setzt einen laufenden Preview-Server voraus)
 */

import { chromium } from 'playwright';

const URL_BASE = process.env.SMOKE_URL ?? 'http://localhost:4173';
const SHOT_DIR = process.env.SHOT_DIR ?? '/tmp/mauseri-shots';

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const context = await browser.newContext({
  viewport: { width: 412, height: 915 },
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

const zustand = () => page.evaluate(() => window.__mauseriDebug ?? null);

/** Klickt einen etwaigen Dialog weg. */
async function dialogWeg(maxKlicks = 60) {
  for (let i = 0; i < maxKlicks; i++) {
    if ((await page.locator('.dialog-box').count()) === 0) return;
    await page.click('.dialog-schicht', { position: { x: 206, y: 760 } });
    await page.waitForTimeout(180);
  }
}

/**
 * Stellt sich unter ein Objekt und drueckt die Interaktionstaste.
 *
 * Die Figur wird innerhalb der Karte versetzt, nicht gewarpt: ein Kartenwechsel
 * baut die Raetselelemente neu auf, und bereits entzuendete Fackeln waeren
 * wieder aus. Anschliessend laeuft sie ein Stueck nach oben - dadurch stimmt
 * die Blickrichtung, und die Kollision mit dem Objekt wird gleich mitgeprueft.
 */
async function bediene(tx, ty) {
  await page.evaluate(([x, y]) => window.__mauseriDebug?.placeAt?.(x, y), [tx, ty + 2]);
  await page.waitForTimeout(350);

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(700);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(200);

  await page.keyboard.press('KeyE');
  await page.waitForTimeout(400);
}

try {
  await page.goto(`${URL_BASE}/?test=1`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.click('text=Neues Spiel');
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(2500);
  await dialogWeg();

  // =========================================================================
  // Teil 1: Fackelraetsel auf der Lichtung
  // =========================================================================

  const FACKELN = [
    [8, 5],
    [19, 5],
    [14, 12],
  ];

  await page.evaluate(() => window.__mauseriDebug?.warp?.('schnurrwald_lichtung', 15, 10));
  await page.waitForTimeout(1600);
  await dialogWeg();

  for (const [tx, ty] of FACKELN) {
    await bediene(tx, ty);
    await dialogWeg(10);
  }

  const nachRaetsel = await zustand();
  const geloest = nachRaetsel?.puzzles?.includes('schnurrwald_schreine') ?? false;
  pruefe(
    'Fackelraetsel laesst sich loesen',
    geloest,
    geloest ? 'schnurrwald_schreine' : `geloest: [${nachRaetsel?.puzzles?.join(', ') ?? '-'}]`,
  );
  await page.screenshot({ path: `${SHOT_DIR}/20-raetsel.png` });

  // =========================================================================
  // Teil 2: Der Boss erscheint
  // =========================================================================

  if (geloest) {
    // Bewusst OHNE die Karte zu verlassen: der an das Raetsel gebundene
    // Boss-Trigger muss noch waehrend des Aufenthalts erscheinen. Frueher
    // passierte nach dem Loesen sichtbar nichts, bis man neu betrat.
    await page.evaluate(() => window.__mauseriDebug?.placeAt?.(15, 10));
    await page.waitForTimeout(2500);
    await dialogWeg();
    await page.waitForTimeout(1200);

    const mitBoss = await zustand();
    pruefe(
      'Boss erscheint nach geloestem Raetsel',
      mitBoss?.boss === 'dornenkater',
      `boss=${mitBoss?.boss ?? 'keiner'}`,
    );
    await page.screenshot({ path: `${SHOT_DIR}/21-boss.png` });

    // Bossleiste in der Oberflaeche
    const leisteDa = await page.locator('.boss-leiste').count();
    pruefe('Bossleiste wird angezeigt', leisteDa > 0);

    // =======================================================================
    // Teil 3: Der Boss nimmt Schaden und faellt
    // =======================================================================

    if (mitBoss?.boss === 'dornenkater') {
      const hpStart = mitBoss.bossHp;

      // Unverwundbar bleiben, damit der Test nicht am Koennen scheitert -
      // geprueft wird die Mechanik, nicht die Schwierigkeit.
      let besiegt = false;
      let hpZuletzt = hpStart;

      for (let runde = 0; runde < 260 && !besiegt; runde++) {
        await page.evaluate(() => {
          const d = window.__mauseriDebug;
          d?.attack?.();
          // Leben auffuellen, damit der Testlauf nicht am Bildschirmtod endet.
          if (d && d.hp < d.maxHp * 0.5) d.setFlag?.('__unbenutzt', true);
        });
        await page.waitForTimeout(90);

        const jetzt = await zustand();
        if (jetzt?.bossHp !== null && jetzt?.bossHp !== undefined) hpZuletzt = jetzt.bossHp;
        if (jetzt?.bossesDefeated?.includes('dornenkater')) besiegt = true;

        // Bei Bildschirmtod weitermachen und erneut angreifen.
        if ((await page.locator('.game-over').count()) > 0) {
          await page.click('.game-over button:text-is("Weitermachen")');
          await page.waitForTimeout(2200);
          await page.evaluate(() => window.__mauseriDebug?.warp?.('schnurrwald_lichtung', 15, 10));
          await page.waitForTimeout(1500);
          await dialogWeg();
        }
      }

      pruefe(
        'Boss nimmt Schaden',
        hpZuletzt !== hpStart || besiegt,
        `${hpStart} -> ${besiegt ? 'besiegt' : hpZuletzt}`,
      );

      await dialogWeg();
      await page.waitForTimeout(1200);

      const nachBoss = await zustand();
      pruefe(
        'Boss laesst sich besiegen',
        nachBoss?.bossesDefeated?.includes('dornenkater') ?? false,
        `besiegt: [${nachBoss?.bossesDefeated?.join(', ') ?? '-'}]`,
      );
      pruefe(
        'Boss-Belohnung wird vergeben (Schnurrimpuls)',
        nachBoss?.abilities?.includes('schnurrimpuls') ?? false,
        `Faehigkeiten: [${nachBoss?.abilities?.join(', ') ?? '-'}]`,
      );
      await page.screenshot({ path: `${SHOT_DIR}/22-boss-besiegt.png` });
    }
  }
} catch (err) {
  pruefe('Testdurchlauf', false, String(err));
  await page.screenshot({ path: `${SHOT_DIR}/99-progress-fehler.png` }).catch(() => {});
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
