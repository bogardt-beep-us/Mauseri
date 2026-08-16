/**
 * Dialogsteuerung.
 *
 * Die Darstellung liegt in React (Textbox, Portraits, Auswahl), die Ablauflogik
 * hier: Knoten aufloesen, Bedingungen pruefen, Effekte anwenden, Folgeknoten
 * anspringen. Waehrend eines Dialogs ist die Spielsteuerung gesperrt.
 */

import { bus } from '@/core/EventBus';
import { applyEffects, gameState } from '@/state/gameState';
import { DIALOGUES } from '@/data/dialogues';
import { SPEAKERS } from '@/data/speakers';
import type { DialogueChoice, DialogueNodeId } from '@/data/types';

export class DialogueSystem {
  private active = false;
  private onFinished: (() => void) | null = null;

  get isActive(): boolean {
    return this.active;
  }

  /**
   * Startet einen Dialog. `onDone` wird aufgerufen, wenn die gesamte Kette
   * (inklusive Folgeknoten) durchlaufen ist.
   */
  start(nodeId: DialogueNodeId, onDone?: () => void): void {
    if (this.active) {
      // Ein bereits laufender Dialog darf nicht ueberschrieben werden -
      // sonst haengt der vorherige Abschluss-Handler in der Luft.
      console.warn(`[Dialog] "${nodeId}" ignoriert: es laeuft bereits ein Dialog.`);
      return;
    }
    this.active = true;
    this.onFinished = onDone ?? null;
    this.runNode(nodeId);
  }

  private runNode(nodeId: DialogueNodeId): void {
    const node = DIALOGUES[nodeId];
    if (!node) {
      console.warn(`[Dialog] Unbekannter Knoten "${nodeId}".`);
      this.finish();
      return;
    }

    // Nur Auswahlmoeglichkeiten anzeigen, deren Bedingung erfuellt ist.
    const choices = node.choices?.filter((choice) => gameState.check(choice.showIf));

    const firstSpeaker = node.lines[0]?.speaker ?? 'mauseri';
    const speakerDef = SPEAKERS[firstSpeaker];

    bus.emit('dialogue:start', {
      speaker: speakerDef?.name ?? firstSpeaker,
      portrait: firstSpeaker,
      lines: node.lines,
      choices: choices && choices.length > 0 ? choices : undefined,
      onDone: (choiceId?: string) => {
        // Effekte des Knotens zuerst, dann die der Auswahl.
        applyEffects(node.effects);

        let next = node.then;
        if (choiceId && choices) {
          const choice = choices.find((c) => c.id === choiceId);
          if (choice) {
            applyEffects(choice.effects);
            if (choice.then) next = choice.then;
          }
        }

        if (next) {
          this.runNode(next);
        } else {
          this.finish();
        }
      },
    });
  }

  private finish(): void {
    this.active = false;
    bus.emit('dialogue:end');
    const callback = this.onFinished;
    this.onFinished = null;
    callback?.();
  }

  /** Bricht einen laufenden Dialog ab (z. B. beim Tod des Spielers). */
  abort(): void {
    if (!this.active) return;
    this.active = false;
    this.onFinished = null;
    bus.emit('dialogue:end');
  }
}

/** Waehlt den ersten Dialogknoten eines NPCs, dessen Bedingung erfuellt ist. */
export function resolveNpcDialogue(
  entries: { showIf?: DialogueChoice['showIf']; node: DialogueNodeId }[],
): DialogueNodeId | null {
  for (const entry of entries) {
    if (gameState.check(entry.showIf)) return entry.node;
  }
  return null;
}
