/**
 * Kleine Hooks fuer die Verbindung zwischen Spiel und Oberflaeche.
 */

import { useEffect, useState, useSyncExternalStore } from 'react';
import { bus, type GameEvents } from '@/core/EventBus';
import { gameState, type SaveData } from '@/state/gameState';

/** Abonniert ein Spielereignis. */
export function useBusEvent<K extends keyof GameEvents>(
  event: K,
  handler: (payload: GameEvents[K]) => void,
  deps: unknown[] = [],
): void {
  useEffect(() => {
    const off = bus.on(event, handler);
    return off;
    // Der Handler wird bewusst ueber die Abhaengigkeitsliste gesteuert, damit
    // die Komponente selbst entscheidet, wann neu abonniert wird.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Haelt einen Wert, der aus einem Spielereignis stammt. */
export function useBusValue<K extends keyof GameEvents>(
  event: K,
  initial: GameEvents[K],
): GameEvents[K] {
  const [value, setValue] = useState<GameEvents[K]>(initial);
  useEffect(() => bus.on(event, setValue as (p: GameEvents[K]) => void), [event]);
  return value;
}

/**
 * Liest den Spielzustand reaktiv. useSyncExternalStore sorgt dafuer, dass
 * React nur dann neu rendert, wenn sich der Zustand tatsaechlich geaendert hat -
 * wichtig, weil das Spiel 60-mal pro Sekunde laeuft.
 */
export function useGameState(): Readonly<SaveData> {
  useSyncExternalStore(
    (listener) => gameState.subscribe(listener),
    () => gameState.getVersion(),
    () => gameState.getVersion(),
  );
  return gameState.state;
}
