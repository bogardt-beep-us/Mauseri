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

  // Erst anzeigen, wenn das Geraet tatsaechlich beruehrt wird - am Rechner
  // waere die Steuerung nur im Weg.
  //
  // Es wird auf zwei Ereignisse gehoert: "touchstart" und "pointerdown" mit
  // pointerType "touch". Manche Browser (und einige Android-Geraete im
  // Desktop-Modus) liefern nur das eine oder nur das andere; auf einem davon
  // waere die Steuerung sonst dauerhaft unsichtbar und das Spiel unbedienbar.
  useEffect(() => {
    if (touchUsed) return;

    const zeigen = () => setTouchUsed(true);
    const beiPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.pointerType === 'pen') zeigen();
    };

    window.addEventListener('touchstart', zeigen, { passive: true });
    window.addEventListener('pointerdown', beiPointer, { passive: true });
    return () => {
      window.removeEventListener('touchstart', zeigen);
      window.removeEventListener('pointerdown', beiPointer);
    };
  }, [touchUsed]);

  const sendVector = useCallback((x: number, y: number) => {
    bus.emit('input:virtual', { x, y });
  }, []);

  // Der Aufsetzpunkt liegt bewusst in einer Ref und nicht nur im State: die
  // Bewegung muss noch im Ereignis selbst ausgerechnet werden koennen, und
  // State ist dort noch der alte.
  const basis = useRef<{ x: number; y: number } | null>(null);

  /** Beendet die laufende Beruehrung - egal, wie sie zu Ende gegangen ist. */
  const loslassen = useCallback(() => {
    pointerId.current = null;
    basis.current = null;
    setStick(null);
    sendVector(0, 0);
    // Sonst bliebe die Figur ewig im Block stehen, wenn der Knopf unter dem
    // Finger verschwindet.
    bus.emit('input:action', 'block-end');
  }, [sendVector]);

  // Sicherheitsnetz am Fenster. Der Joystick verschwindet beim Kartenwechsel
  // kurz aus dem Baum (auf der neuen Karte laeuft oft ein Dialog, und dann ist
  // die Steuerung ausgeblendet). Sein "pointerup" kam damit nie an, die
  // gemerkte Zeiger-Nummer blieb stehen - und jede spaetere Beruehrung wurde
  // als "da ist schon ein Finger" abgewiesen. Der Joystick war tot, bis man
  // die Seite neu lud. Genau das faengt dieser Haken ab.
  useEffect(() => {
    const beiEnde = (event: PointerEvent) => {
      if (pointerId.current === null || pointerId.current !== event.pointerId) return;
      loslassen();
    };
    window.addEventListener('pointerup', beiEnde);
    window.addEventListener('pointercancel', beiEnde);
    return () => {
      window.removeEventListener('pointerup', beiEnde);
      window.removeEventListener('pointercancel', beiEnde);
    };
  }, [loslassen]);

  // Wird die Steuerung ausgeblendet (Dialog, Menue, Cutscene, Kartenwechsel),
  // gilt die Beruehrung als beendet. Der Finger liegt zwar noch auf dem Glas,
  // aber das Element darunter gibt es nicht mehr.
  const sichtbar = visible && touchUsed;
  useEffect(() => {
    if (sichtbar) return;
    loslassen();
  }, [sichtbar, loslassen]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Kein vorzeitiges Abbrechen mehr, wenn schon eine Nummer gemerkt ist:
      // die kann von einer Beruehrung stammen, deren Ende nie ankam. Ein
      // neuer Finger uebernimmt einfach.
      pointerId.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      const rect = event.currentTarget.getBoundingClientRect();
      const baseX = event.clientX - rect.left;
      const baseY = event.clientY - rect.top;
      basis.current = { x: baseX, y: baseY };
      setStick({ baseX, baseY, dx: 0, dy: 0 });
      setTouchUsed(true);
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerId.current !== event.pointerId) return;
      const base = basis.current;
      if (!base) return;

      // Alles, was am Ereignis haengt, wird hier gelesen - synchron, solange
      // das Ereignis noch gueltig ist. Frueher stand diese Zeile in der
      // Aktualisierungsfunktion von setStick, die React erst spaeter ausfuehrt;
      // dann ist `currentTarget` bereits null und der Zugriff warf einen
      // Fehler, der beim ersten Ziehen die ganze Oberflaeche wegriss.
      const rect = event.currentTarget.getBoundingClientRect();

      let dx = event.clientX - rect.left - base.x;
      let dy = event.clientY - rect.top - base.y;

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
        sendVector((dx / (length || 1)) * strength, (dy / (length || 1)) * strength);
      }

      setStick((current) => (current ? { ...current, dx, dy } : current));
    },
    [sendVector],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerId.current !== event.pointerId) return;
      loslassen();
    },
    [loslassen],
  );

  const action = useCallback((name: 'attack' | 'interact' | 'dodge') => {
    bus.emit('input:action', name);
  }, []);

  if (!sichtbar) {
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
