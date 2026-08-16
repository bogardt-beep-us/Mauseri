/**
 * Raetselsteuerung.
 *
 * Haelt den Zustand der Raetselelemente der aktuellen Karte und prueft nach
 * jeder Aenderung, ob die Regel des Raetsels erfuellt ist. Geloeste Raetsel
 * werden im Spielstand vermerkt und bleiben es - beim Wiederbetreten steht
 * das Tor offen.
 */

import { bus } from '@/core/EventBus';
import { applyEffects, gameState } from '@/state/gameState';
import { getPuzzle, type PuzzleDef } from '@/data/puzzles';
import { audio } from './AudioSystem';

export interface PuzzleElement {
  id: string;
  puzzle: string;
  kind: 'switch' | 'plate' | 'torch' | 'mirror' | 'valve' | 'rune';
  /** An/aus fuer Schalter, Platten, Fackeln, Runen. */
  active: boolean;
  /** Winkel in Achtelschritten fuer Spiegel, Fuellstand fuer Ventile. */
  value: number;
  symbol?: string;
}

export class PuzzleSystem {
  private elements = new Map<string, PuzzleElement>();
  /** Reihenfolge der Ausloesungen je Raetsel (fuer 'sequence'). */
  private sequences = new Map<string, string[]>();
  /** Rueckrufe, die beim Loesen eines Raetsels feuern (Tore oeffnen usw.). */
  private solveHandlers = new Map<string, (() => void)[]>();

  /** Setzt den Zustand fuer eine neue Karte zurueck. */
  reset(): void {
    this.elements.clear();
    this.sequences.clear();
    this.solveHandlers.clear();
  }

  register(element: PuzzleElement): void {
    this.elements.set(element.id, element);
  }

  onSolved(puzzleId: string, handler: () => void): void {
    const list = this.solveHandlers.get(puzzleId) ?? [];
    list.push(handler);
    this.solveHandlers.set(puzzleId, list);
  }

  get(id: string): PuzzleElement | undefined {
    return this.elements.get(id);
  }

  isSolved(puzzleId: string): boolean {
    return gameState.isPuzzleSolved(puzzleId);
  }

  /** Schaltet ein Element um und prueft das Raetsel. */
  toggle(id: string): PuzzleElement | undefined {
    const element = this.elements.get(id);
    if (!element) return undefined;
    if (this.isSolved(element.puzzle)) return element;

    element.active = !element.active;

    // Bei Reihenfolge-Raetseln zaehlt nur das Einschalten.
    if (element.active && element.symbol) {
      const puzzle = getPuzzle(element.puzzle);
      if (puzzle?.kind === 'sequence') {
        const list = this.sequences.get(element.puzzle) ?? [];
        list.push(element.symbol);
        this.sequences.set(element.puzzle, list);
      }
    }

    audio.play('switch');
    this.evaluate(element.puzzle);
    return element;
  }

  /** Setzt einen Wert (Spiegelwinkel, Ventilstand). */
  setValue(id: string, value: number): PuzzleElement | undefined {
    const element = this.elements.get(id);
    if (!element) return undefined;
    if (this.isSolved(element.puzzle)) return element;

    element.value = value;
    element.active = true;
    audio.play('switch');
    this.evaluate(element.puzzle);
    return element;
  }

  /** Meldet, ob eine Druckplatte belastet ist (durch Block oder Spieler). */
  setPressed(id: string, pressed: boolean): boolean {
    const element = this.elements.get(id);
    if (!element || element.kind !== 'plate') return false;
    if (element.active === pressed) return false;

    element.active = pressed;
    if (pressed) audio.play('switch');
    this.evaluate(element.puzzle);
    return true;
  }

  /** Prueft, ob das Raetsel geloest ist, und loest gegebenenfalls aus. */
  private evaluate(puzzleId: string): void {
    if (this.isSolved(puzzleId)) return;
    const puzzle = getPuzzle(puzzleId);
    if (!puzzle) return;

    const members = [...this.elements.values()].filter((e) => e.puzzle === puzzleId);
    if (members.length === 0) return;

    let solved = false;

    switch (puzzle.kind) {
      case 'allOn':
      case 'blocksOnPlates':
        solved = members.every((e) => e.active);
        break;

      case 'sequence': {
        const entered = this.sequences.get(puzzleId) ?? [];
        const target = puzzle.sequence ?? [];
        // Falsche Eingabe: alles zuruecksetzen, damit der Spieler neu beginnt.
        const prefixOk = entered.every((symbol, i) => symbol === target[i]);
        if (!prefixOk) {
          this.resetSequence(puzzleId, members);
          return;
        }
        solved = entered.length === target.length;
        break;
      }

      case 'valveLevel': {
        const valve = members.find((e) => e.kind === 'valve');
        solved = valve !== undefined && valve.value === puzzle.targetLevel;
        break;
      }

      case 'mirrorPath': {
        const angles = puzzle.mirrorAngles ?? {};
        solved = Object.entries(angles).every(([id, angle]) => {
          const mirror = this.elements.get(id);
          return mirror !== undefined && mirror.value % 8 === angle % 8;
        });
        break;
      }
    }

    if (!solved) return;

    gameState.solvePuzzle(puzzleId);
    audio.play('puzzle');
    bus.emit('toast', {
      text: puzzle.solvedText ?? `${puzzle.name} geloest`,
      kind: 'info',
    });
    applyEffects(puzzle.rewards);

    for (const handler of this.solveHandlers.get(puzzleId) ?? []) handler();
  }

  private resetSequence(puzzleId: string, members: PuzzleElement[]): void {
    this.sequences.set(puzzleId, []);
    for (const element of members) {
      if (element.symbol) element.active = false;
    }
    audio.play('cancel');
    bus.emit('toast', { text: 'Etwas stimmt nicht. Die Zeichen erloeschen.', kind: 'warning' });
  }

  /** Liefert den Hinweis, den Pookie geben darf. */
  hintFor(puzzleId: string): string | null {
    const puzzle: PuzzleDef | undefined = getPuzzle(puzzleId);
    if (!puzzle || this.isSolved(puzzleId)) return null;
    return puzzle.hint;
  }

  /** Alle Raetsel-IDs, die auf dieser Karte registriert sind. */
  activePuzzleIds(): string[] {
    return [...new Set([...this.elements.values()].map((e) => e.puzzle))];
  }
}
