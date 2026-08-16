/**
 * Zentraler Spielzustand.
 *
 * Bewusst ohne State-Bibliothek: der Zustand ist ein einfaches serialisierbares
 * Objekt mit einem schmalen Abonnement-Mechanismus. Das haelt die Abhaengigkeiten
 * klein und macht das Speichern trivial - der Spielstand ist buchstaeblich
 * JSON.stringify(state).
 */

import type { AbilityId, AreaId, Condition, Effect, QuestId, QuestState, RegionId } from '@/data/types';
import { SAVE_KEY } from '@/core/constants';
import { bus } from '@/core/EventBus';

export interface InventoryEntry {
  item: string;
  count: number;
}

export interface QuestProgress {
  state: QuestState;
  step: number;
}

export interface SaveData {
  version: number;
  /** Zeitpunkt des Speicherns (fuer die Anzeige im Hauptmenue). */
  savedAt: number;
  /** Gesamte Spielzeit in Millisekunden. */
  playtimeMs: number;

  // Position
  area: AreaId;
  x: number;
  y: number;
  facing: 'up' | 'down' | 'left' | 'right';

  // Werte
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  attack: number;
  defense: number;
  coins: number;

  // Fortschritt
  abilities: AbilityId[];
  inventory: InventoryEntry[];
  equipped: { weapon?: string; charm?: string };
  quests: Record<QuestId, QuestProgress>;
  flags: Record<string, boolean>;
  /** Geloeste Raetsel (Karten-uebergreifend eindeutige IDs). */
  puzzles: string[];
  /** Besiegte Bosse. */
  bosses: string[];
  /** Geoeffnete Truhen und aufgesammelte Einzelstuecke. */
  collected: string[];
  /** Dauerhaft besiegte Gegner. */
  slain: string[];
  /** Besuchte Karten - fuer die Weltkarte. */
  visitedAreas: AreaId[];
  /** Freigeschaltete Regionen auf der Weltkarte. */
  knownRegions: RegionId[];
  /** Bereits abgespielte Einmal-Trigger. */
  firedTriggers: string[];
  /** Gefundene Geheimnisse - Voraussetzung fuer das wahre Ende. */
  secrets: string[];
}

const SAVE_VERSION = 1;

export function createNewSave(): SaveData {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    playtimeMs: 0,

    area: 'miezlingen_home',
    x: 5,
    y: 5,
    facing: 'down',

    hp: 60,
    maxHp: 60,
    energy: 40,
    maxEnergy: 40,
    attack: 8,
    defense: 0,
    coins: 0,

    abilities: [],
    inventory: [{ item: 'fischkeks', count: 2 }],
    equipped: {},
    quests: {},
    flags: {},
    puzzles: [],
    bosses: [],
    collected: [],
    slain: [],
    visitedAreas: [],
    knownRegions: ['miezlingen'],
    firedTriggers: [],
    secrets: [],
  };
}

type Listener = () => void;

class GameStateStore {
  private data: SaveData = createNewSave();
  private listeners = new Set<Listener>();
  /** Snapshot-Zaehler, damit React per useSyncExternalStore effizient rendert. */
  private version = 0;

  get state(): Readonly<SaveData> {
    return this.data;
  }

  getVersion(): number {
    return this.version;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.version++;
    for (const listener of this.listeners) listener();
  }

  /** Aendert den Zustand und benachrichtigt Abonnenten. */
  update(mutator: (draft: SaveData) => void): void {
    mutator(this.data);
    this.notify();
  }

  replace(data: SaveData): void {
    this.data = data;
    this.notify();
  }

  reset(): void {
    this.data = createNewSave();
    this.notify();
  }

  // -------------------------------------------------------------------------
  // Abfragen
  // -------------------------------------------------------------------------

  hasItem(item: string, count = 1): boolean {
    const entry = this.data.inventory.find((e) => e.item === item);
    return !!entry && entry.count >= count;
  }

  itemCount(item: string): number {
    return this.data.inventory.find((e) => e.item === item)?.count ?? 0;
  }

  hasAbility(ability: AbilityId): boolean {
    return this.data.abilities.includes(ability);
  }

  questState(id: QuestId): QuestState {
    return this.data.quests[id]?.state ?? 'unknown';
  }

  questStep(id: QuestId): number {
    return this.data.quests[id]?.step ?? 0;
  }

  flag(name: string): boolean {
    return this.data.flags[name] === true;
  }

  isPuzzleSolved(id: string): boolean {
    return this.data.puzzles.includes(id);
  }

  isBossDefeated(id: string): boolean {
    return this.data.bosses.includes(id);
  }

  isCollected(id: string): boolean {
    return this.data.collected.includes(id);
  }

  isSlain(id: string): boolean {
    return this.data.slain.includes(id);
  }

  hasFiredTrigger(id: string): boolean {
    return this.data.firedTriggers.includes(id);
  }

  /** Prueft eine deklarative Bedingung gegen den aktuellen Zustand. */
  check(condition: Condition | undefined): boolean {
    if (!condition) return true;
    if ('flag' in condition) {
      return this.flag(condition.flag) === (condition.value ?? true);
    }
    if ('hasItem' in condition) {
      return this.hasItem(condition.hasItem, condition.count ?? 1);
    }
    if ('questState' in condition) {
      return this.questState(condition.questState) === condition.state;
    }
    if ('hasAbility' in condition) {
      return this.hasAbility(condition.hasAbility);
    }
    if ('puzzleSolved' in condition) {
      return this.isPuzzleSolved(condition.puzzleSolved);
    }
    if ('bossDefeated' in condition) {
      return this.isBossDefeated(condition.bossDefeated);
    }
    if ('secretsFound' in condition) {
      return this.data.secrets.length >= condition.secretsFound;
    }
    if ('all' in condition) {
      return condition.all.every((c) => this.check(c));
    }
    if ('any' in condition) {
      return condition.any.some((c) => this.check(c));
    }
    if ('not' in condition) {
      return !this.check(condition.not);
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // Mutationen
  // -------------------------------------------------------------------------

  addItem(item: string, count = 1): void {
    this.update((d) => {
      const entry = d.inventory.find((e) => e.item === item);
      if (entry) entry.count += count;
      else d.inventory.push({ item, count });
    });
  }

  removeItem(item: string, count = 1): boolean {
    const entry = this.data.inventory.find((e) => e.item === item);
    if (!entry || entry.count < count) return false;
    this.update((d) => {
      const e = d.inventory.find((i) => i.item === item)!;
      e.count -= count;
      if (e.count <= 0) d.inventory = d.inventory.filter((i) => i.item !== item);
    });
    return true;
  }

  setFlag(name: string, value = true): void {
    this.update((d) => {
      d.flags[name] = value;
    });
  }

  solvePuzzle(id: string): void {
    if (this.isPuzzleSolved(id)) return;
    this.update((d) => {
      d.puzzles.push(id);
    });
  }

  defeatBoss(id: string): void {
    if (this.isBossDefeated(id)) return;
    this.update((d) => {
      d.bosses.push(id);
    });
  }

  markCollected(id: string): void {
    if (this.isCollected(id)) return;
    this.update((d) => {
      d.collected.push(id);
    });
  }

  markSlain(id: string): void {
    if (this.isSlain(id)) return;
    this.update((d) => {
      d.slain.push(id);
    });
  }

  markTriggerFired(id: string): void {
    if (this.hasFiredTrigger(id)) return;
    this.update((d) => {
      d.firedTriggers.push(id);
    });
  }

  visitArea(area: AreaId): void {
    if (this.data.visitedAreas.includes(area)) return;
    this.update((d) => {
      d.visitedAreas.push(area);
    });
  }

  discoverRegion(region: RegionId): void {
    if (this.data.knownRegions.includes(region)) return;
    this.update((d) => {
      d.knownRegions.push(region);
    });
  }

  findSecret(id: string): boolean {
    if (this.data.secrets.includes(id)) return false;
    this.update((d) => {
      d.secrets.push(id);
    });
    return true;
  }

  startQuest(id: QuestId): void {
    if (this.questState(id) !== 'unknown') return;
    this.update((d) => {
      d.quests[id] = { state: 'active', step: 0 };
    });
    bus.emit('quest:updated', { questId: id, state: 'started' });
  }

  advanceQuest(id: QuestId, step?: number): void {
    const current = this.data.quests[id];
    if (!current || current.state !== 'active') return;
    this.update((d) => {
      const q = d.quests[id]!;
      q.step = step ?? q.step + 1;
    });
    bus.emit('quest:updated', { questId: id, state: 'advanced' });
  }

  completeQuest(id: QuestId): void {
    if (this.questState(id) === 'completed') return;
    this.update((d) => {
      d.quests[id] = { state: 'completed', step: d.quests[id]?.step ?? 0 };
    });
    bus.emit('quest:updated', { questId: id, state: 'completed' });
  }

  damage(amount: number): number {
    const reduced = Math.max(1, Math.round(amount * (1 - Math.min(0.6, this.data.defense * 0.04))));
    this.update((d) => {
      d.hp = Math.max(0, d.hp - reduced);
    });
    return reduced;
  }

  heal(amount: number): void {
    this.update((d) => {
      d.hp = Math.min(d.maxHp, d.hp + amount);
    });
  }

  spendEnergy(amount: number): boolean {
    if (this.data.energy < amount) return false;
    this.update((d) => {
      d.energy -= amount;
    });
    return true;
  }

  restoreEnergy(amount: number): void {
    this.update((d) => {
      d.energy = Math.min(d.maxEnergy, d.energy + amount);
    });
  }

  addCoins(amount: number): void {
    this.update((d) => {
      d.coins = Math.max(0, d.coins + amount);
    });
  }

  grantAbility(ability: AbilityId): boolean {
    if (this.hasAbility(ability)) return false;
    this.update((d) => {
      d.abilities.push(ability);
    });
    return true;
  }

  setPosition(area: AreaId, x: number, y: number, facing?: SaveData['facing']): void {
    this.update((d) => {
      d.area = area;
      d.x = x;
      d.y = y;
      if (facing) d.facing = facing;
    });
  }

  addPlaytime(ms: number): void {
    // Kein notify(): die Spielzeit aendert sich jeden Frame und darf die UI
    // nicht neu rendern. Sie wird beim Speichern ohnehin mitgeschrieben.
    this.data.playtimeMs += ms;
  }

  // -------------------------------------------------------------------------
  // Persistenz
  // -------------------------------------------------------------------------

  save(): boolean {
    try {
      this.data.savedAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      bus.emit('game:saved');
      return true;
    } catch (err) {
      console.error('[GameState] Speichern fehlgeschlagen:', err);
      return false;
    }
  }

  load(): boolean {
    const raw = readRawSave();
    if (!raw) return false;
    this.replace(migrate(raw));
    return true;
  }

  static hasSave(): boolean {
    return readRawSave() !== null;
  }

  static clearSave(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* localStorage kann in privaten Fenstern gesperrt sein - kein Grund zum Absturz. */
    }
  }
}

function readRawSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveData;
    if (typeof parsed !== 'object' || parsed === null || typeof parsed.area !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Ergaenzt fehlende Felder aus aelteren Spielstaenden. */
function migrate(data: SaveData): SaveData {
  const base = createNewSave();
  return {
    ...base,
    ...data,
    // Arrays und Objekte defensiv auffuellen, damit ein alter Stand nicht
    // mitten im Spiel auf `undefined.push` laeuft.
    abilities: data.abilities ?? [],
    inventory: data.inventory ?? [],
    equipped: data.equipped ?? {},
    quests: data.quests ?? {},
    flags: data.flags ?? {},
    puzzles: data.puzzles ?? [],
    bosses: data.bosses ?? [],
    collected: data.collected ?? [],
    slain: data.slain ?? [],
    visitedAreas: data.visitedAreas ?? [],
    knownRegions: data.knownRegions ?? ['miezlingen'],
    firedTriggers: data.firedTriggers ?? [],
    secrets: data.secrets ?? [],
    version: SAVE_VERSION,
  };
}

export const gameState = new GameStateStore();
export const hasSavedGame = (): boolean => GameStateStore.hasSave();
export const clearSavedGame = (): void => GameStateStore.clearSave();

/**
 * Wendet eine Liste deklarativer Effekte an. Zentral hier, damit Dialoge,
 * Trigger, Quests und Skripte exakt dieselbe Semantik haben.
 */
export function applyEffects(effects: Effect[] | undefined): void {
  if (!effects) return;
  for (const effect of effects) {
    applyEffect(effect);
  }
}

/** Wird von der Spielszene gesetzt, damit Effekte in die Welt wirken koennen. */
export interface WorldEffectHandler {
  warp(to: AreaId, x: number, y: number): void;
  playScript(id: string): void;
}

let worldHandler: WorldEffectHandler | null = null;

export function setWorldEffectHandler(handler: WorldEffectHandler | null): void {
  worldHandler = handler;
}

function applyEffect(effect: Effect): void {
  if ('setFlag' in effect) {
    gameState.setFlag(effect.setFlag, effect.value ?? true);
  } else if ('giveItem' in effect) {
    gameState.addItem(effect.giveItem, effect.count ?? 1);
  } else if ('takeItem' in effect) {
    gameState.removeItem(effect.takeItem, effect.count ?? 1);
  } else if ('giveCoins' in effect) {
    gameState.addCoins(effect.giveCoins);
  } else if ('takeCoins' in effect) {
    gameState.addCoins(-effect.takeCoins);
  } else if ('giveAbility' in effect) {
    gameState.grantAbility(effect.giveAbility);
  } else if ('startQuest' in effect) {
    gameState.startQuest(effect.startQuest);
  } else if ('advanceQuest' in effect) {
    gameState.advanceQuest(effect.advanceQuest, effect.step);
  } else if ('completeQuest' in effect) {
    gameState.completeQuest(effect.completeQuest);
  } else if ('heal' in effect) {
    gameState.heal(effect.heal);
  } else if ('increaseMaxHp' in effect) {
    gameState.update((d) => {
      d.maxHp += effect.increaseMaxHp;
      d.hp = d.maxHp;
    });
  } else if ('increaseMaxEnergy' in effect) {
    gameState.update((d) => {
      d.maxEnergy += effect.increaseMaxEnergy;
      d.energy = d.maxEnergy;
    });
  } else if ('increaseAttack' in effect) {
    gameState.update((d) => {
      d.attack += effect.increaseAttack;
    });
  } else if ('playScript' in effect) {
    worldHandler?.playScript(effect.playScript);
  } else if ('warp' in effect) {
    worldHandler?.warp(effect.warp.to, effect.warp.x, effect.warp.y);
  } else if ('toast' in effect) {
    bus.emit('toast', { text: effect.toast, kind: effect.kind ?? 'info' });
  } else if ('unlockMapRegion' in effect) {
    gameState.discoverRegion(effect.unlockMapRegion);
  } else if ('solvePuzzle' in effect) {
    gameState.solvePuzzle(effect.solvePuzzle);
  }
}
