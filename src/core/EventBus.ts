/**
 * Typisierter Event-Bus zwischen Phaser (Spielwelt) und React (UI).
 *
 * Warum kein gemeinsamer Store: Phaser laeuft in der requestAnimationFrame-
 * Schleife und darf React nicht bei jedem Frame neu rendern. Der Bus erlaubt
 * es, gezielt nur die Ereignisse nach oben zu geben, die die UI wirklich
 * betreffen - alles andere bleibt in der Spielschleife.
 */

import type { DialogueLine, DialogueChoice } from '@/data/types';
import type { QuestId } from '@/data/types';

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  coins: number;
  regionName: string;
  areaName: string;
  abilities: { id: string; name: string; ready: boolean; cooldownPct: number }[];
}

export interface ToastPayload {
  text: string;
  kind: 'item' | 'quest' | 'ability' | 'info' | 'warning';
  icon?: string;
}

export interface DialoguePayload {
  speaker: string;
  portrait: string;
  lines: DialogueLine[];
  choices?: DialogueChoice[];
  /** Wird aufgerufen, sobald der Dialog beendet ist. */
  onDone?: (choiceId?: string) => void;
}

export interface BossBarPayload {
  name: string;
  hp: number;
  maxHp: number;
  phase: number;
  visible: boolean;
}

export type GameEvents = {
  'hud:update': HudSnapshot;
  'dialogue:start': DialoguePayload;
  'dialogue:end': void;
  'toast': ToastPayload;
  'boss:update': BossBarPayload;
  'quest:updated': { questId: QuestId; state: 'started' | 'advanced' | 'completed' };
  'game:over': { cause: string };
  'game:saved': void;
  'game:ready': void;
  'scene:transition': { areaId: string; areaName: string; regionName: string };
  'cutscene:start': void;
  'cutscene:end': void;
  'ui:openMenu': 'inventory' | 'quests' | 'map' | 'settings' | null;
  'input:virtual': { x: number; y: number };
  'input:action': 'attack' | 'interact' | 'dodge' | 'special' | 'block-start' | 'block-end';
  'credits:show': { ending: 'true' | 'good' };
  'screen:shake': { duration: number; intensity: number };
  'screen:flash': { color: number; duration: number };
};

type Handler<T> = (payload: T) => void;

class TypedEventBus {
  private handlers = new Map<keyof GameEvents, Set<Handler<never>>>();

  on<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<never>);
    return () => this.off(event, handler);
  }

  once<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): () => void {
    const off = this.on(event, (payload) => {
      off();
      handler(payload);
    });
    return off;
  }

  off<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): void {
    this.handlers.get(event)?.delete(handler as Handler<never>);
  }

  emit<K extends keyof GameEvents>(
    event: K,
    ...args: GameEvents[K] extends void ? [] : [GameEvents[K]]
  ): void {
    const set = this.handlers.get(event);
    if (!set) return;
    const payload = args[0] as GameEvents[K];
    // Kopie, damit Handler sich waehrend der Iteration abmelden duerfen.
    for (const handler of [...set]) {
      try {
        (handler as Handler<GameEvents[K]>)(payload);
      } catch (err) {
        console.error(`[EventBus] Handler fuer "${String(event)}" ist gescheitert:`, err);
      }
    }
  }

  /** Entfernt alle Handler - wird beim Neustart eines Spiels benoetigt. */
  clear(): void {
    this.handlers.clear();
  }
}

export const bus = new TypedEventBus();
