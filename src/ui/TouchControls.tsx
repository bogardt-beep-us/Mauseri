/**
 * Touch-Steuerung.
 *
 * Links ein virtueller Joystick, der dort erscheint, wo der Daumen aufsetzt -
 * das ist auf kleinen Displays deutlich angenehmer als ein fester Ring, weil
 * die Hand nie nach der richtigen Stelle suchen muss.
 *
 * Rechts die Aktionsknoepfe. Sie sind bewusst gross (68px) und rund, mit
 * Abstand zum Bildschirmrand, damit sie auch mit Huelle und in Bewegung
 * treffbar bleiben.
 *
 * Die gesamte Steuerung blendet sich aus, solange nur Tastatur benutzt wird,
 * und erscheint beim ersten Fingerkontakt.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { bus } from '@/core/EventBus';
import { ABILITIES } from '@/data/abilities';
import type { HudSnapshot } from '@/core/EventBus';

/** Auslenkung in Pixeln, ab der die Figur volle Geschwindigkeit laeuft. */
const JOYSTICK_RADIUS = 46;
/** Totzone, damit ein ruhender Daumen die Figur nicht driften laesst. */
const DEADZONE = 6;

interface Props {
  hud: HudSnapshot;
  selectedAbility: string | null;
  onSelectAbility: (id: string) => void;
  onUseAbility: (id: string) => void;
  visible: boolean;
}

export function TouchControls({ hud, selectedAbility, onSelectAbility, onUseAbility, visible }: Props) {
  const [touchUsed, setTouchUsed] = useState(false);
  const [stick, setStick] = useState<{ baseX: number; baseY: number; dx: number; dy: number } | null>(null);
  const pointerId = useRef<number | null>(null);

  // Erst anzeigen, wenn das Geraet tatsaechlich beruehrt wird.
  useEffect(() => {
    if (touchUsed) return;
    const onTouch = () => setTouchUsed(true);
    window.addEventListener('touchstart', onTouch, { once: true, passive: true });
    return () => window.removeEventListener('touchstart', onTouch);
  }, [touchUsed]);

  const sendVector = useCallback((x: number, y: number) => {
    bus.emit('input:virtual', { x, y });
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerId.current !== null) return;
      pointerId.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      const rect = event.currentTarget.getBoundingClientRect();
      setStick({
        baseX: event.clientX - rect.left,
        baseY: event.clientY - rect.top,
        dx: 0,
        dy: 0,
      });
      setTouchUsed(true);
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerId.current !== event.pointerId) return;
      setStick((current) => {
        if (!current) return current;
        const rect = event.currentTarget.getBoundingClientRect();
        let dx = event.clientX - rect.left - current.baseX;
        let dy = event.clientY - rect.top - current.baseY;

        const length = Math.hypot(dx, dy);
        if (length > JOYSTICK_RADIUS) {
          dx = (dx / length) * JOYSTICK_RADIUS;
          dy = (dy / length) * JOYSTICK_RADIUS;
        }

        if (length < DEADZONE) {
          sendVector(0, 0);
        } else {
          // Auf 0..1 normieren, damit leichtes Antippen langsam laeuft.
          const strength = Math.min(1, length / JOYSTICK_RADIUS);
          const nx = (dx / (length || 1)) * strength;
          const ny = (dy / (length || 1)) * strength;
          sendVector(nx, ny);
        }

        return { ...current, dx, dy };
      });
    },
    [sendVector],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerId.current !== event.pointerId) return;
      pointerId.current = null;
      setStick(null);
      sendVector(0, 0);
    },
    [sendVector],
  );

  const action = useCallback((name: 'attack' | 'interact' | 'dodge') => {
    bus.emit('input:action', name);
  }, []);

  if (!visible || !touchUsed) {
    return <div className="touch-controls versteckt" aria-hidden="true" />;
  }

  return (
    <div className="touch-controls">
      {/* Bewegungsfeld */}
      <div
        className="joystick-zone"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="application"
        aria-label="Bewegung"
      >
        {stick && (
          <div className="joystick" style={{ left: stick.baseX, top: stick.baseY }}>
            <div
              className="joystick-stick"
              style={{ transform: `translate(${stick.dx}px, ${stick.dy}px)` }}
            />
          </div>
        )}
      </div>

      {/* Faehigkeiten */}
      {hud.abilities.length > 0 && (
        <div className="faehigkeiten-leiste">
          {hud.abilities.map((ability) => {
            const def = ABILITIES[ability.id as keyof typeof ABILITIES];
            return (
              <button
                key={ability.id}
                className={[
                  'faehigkeit',
                  ability.ready ? 'bereit' : '',
                  selectedAbility === ability.id ? 'gewaehlt' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onPointerDown={(event) => {
                  event.preventDefault();
                  onSelectAbility(ability.id);
                  onUseAbility(ability.id);
                }}
                aria-label={`${def?.name ?? ability.name} einsetzen`}
              >
                {ability.cooldownPct > 0 && (
                  <div
                    className="faehigkeit-cooldown"
                    style={{ height: `${ability.cooldownPct * 100}%` }}
                  />
                )}
                <span>{shorten(def?.name ?? ability.name)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Aktionen */}
      <div className="aktions-knoepfe">
        <button
          className="aktions-knopf ausweichen"
          onPointerDown={(event) => {
            event.preventDefault();
            action('dodge');
          }}
          aria-label="Ausweichen"
        >
          Roll
        </button>
        <button
          className="aktions-knopf interakt"
          onPointerDown={(event) => {
            event.preventDefault();
            action('interact');
          }}
          aria-label="Reden oder untersuchen"
        >
          Reden
        </button>
        <button
          className="aktions-knopf blocken"
          onPointerDown={(event) => {
            event.preventDefault();
            bus.emit('input:action', 'block-start');
          }}
          onPointerUp={() => bus.emit('input:action', 'block-end')}
          onPointerLeave={() => bus.emit('input:action', 'block-end')}
          onPointerCancel={() => bus.emit('input:action', 'block-end')}
          aria-label="Blocken"
        >
          Block
        </button>
        <button
          className="aktions-knopf angriff"
          onPointerDown={(event) => {
            event.preventDefault();
            action('attack');
          }}
          aria-label="Angreifen"
        >
          Kralle
        </button>
      </div>
    </div>
  );
}

/** Kuerzt lange Faehigkeitsnamen fuer den kleinen Knopf. */
function shorten(name: string): string {
  if (name.length <= 9) return name;
  return `${name.slice(0, 8)}.`;
}
