/**
 * Anzeige waehrend des Spiels: Leben, Energie, Ort, Muenzen, Bossleiste,
 * Meldungen und die Ortseinblendung beim Kartenwechsel.
 */

import { useEffect, useState } from 'react';
import type { BossBarPayload, HudSnapshot, ToastPayload } from '@/core/EventBus';
import { useBusEvent } from './useBus';
import { FullscreenButton } from './FullscreenButton';

interface HudProps {
  hud: HudSnapshot;
  onOpenMenu: () => void;
}

export function Hud({ hud, onOpenMenu }: HudProps) {
  const hpPct = hud.maxHp > 0 ? (hud.hp / hud.maxHp) * 100 : 0;
  const energyPct = hud.maxEnergy > 0 ? (hud.energy / hud.maxEnergy) * 100 : 0;

  return (
    <div className="hud">
      <div className="hud-links">
        <div className="balken balken-leben" role="meter" aria-label="Leben">
          <div className="balken-fuellung" style={{ width: `${hpPct}%` }} />
          <div className="balken-text">
            {hud.hp} / {hud.maxHp}
          </div>
        </div>
        <div className="balken balken-energie" role="meter" aria-label="Energie">
          <div className="balken-fuellung" style={{ width: `${energyPct}%` }} />
        </div>
        <div className="hud-ort">{hud.areaName || hud.regionName}</div>
      </div>

      <div className="hud-rechts">
        <div className="hud-muenzen" aria-label={`${hud.coins} Muenzen`}>
          <span aria-hidden="true">◉</span>
          {hud.coins}
        </div>
        <FullscreenButton variante="icon" />
        <button className="icon-knopf" onClick={onOpenMenu} aria-label="Menue oeffnen">
          ☰
        </button>
      </div>
    </div>
  );
}

/** Lebensleiste des aktuellen Bosses. */
export function BossBar() {
  const [boss, setBoss] = useState<BossBarPayload | null>(null);

  useBusEvent('boss:update', (payload) => {
    setBoss(payload.visible ? payload : null);
  });

  if (!boss) return null;
  const pct = boss.maxHp > 0 ? (boss.hp / boss.maxHp) * 100 : 0;

  return (
    <div className="boss-leiste">
      <div className="boss-name">{boss.name}</div>
      <div className="balken">
        <div className="balken-fuellung" style={{ width: `${pct}%` }} />
      </div>
      <div className="boss-phase">Phase {boss.phase}</div>
    </div>
  );
}

interface ToastEntry extends ToastPayload {
  key: number;
}

/** Kurze Meldungen (Gegenstaende, Quests, Hinweise). */
export function Toasts() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  useBusEvent('toast', (payload) => {
    const entry: ToastEntry = { ...payload, key: Date.now() + Math.random() };
    // Hoechstens vier gleichzeitig, sonst verdeckt die Liste das Spielfeld.
    setToasts((current) => [...current, entry].slice(-4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.key !== entry.key));
    }, 2800);
  });

  if (toasts.length === 0) return null;

  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.key} className={`toast ${toast.kind}`}>
          {toast.text}
        </div>
      ))}
    </div>
  );
}

/** Einblendung des Ortsnamens beim Betreten einer neuen Karte. */
export function AreaBanner() {
  const [banner, setBanner] = useState<{ area: string; region: string; key: number } | null>(null);

  useBusEvent('scene:transition', ({ areaName, regionName }) => {
    setBanner({ area: areaName, region: regionName, key: Date.now() });
  });

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), 2700);
    return () => window.clearTimeout(timer);
  }, [banner]);

  if (!banner) return null;

  return (
    <div className="ortsanzeige" key={banner.key}>
      <div className="region">{banner.region}</div>
      <div className="ort">{banner.area}</div>
    </div>
  );
}

/** Schwarze Balken oben und unten waehrend einer Zwischensequenz. */
export function Cinematics({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <>
      <div className="kinobalken oben" />
      <div className="kinobalken unten" />
    </>
  );
}
