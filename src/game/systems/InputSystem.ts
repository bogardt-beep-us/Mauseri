/**
 * Vereinheitlichte Eingabe.
 *
 * Touch und Tastatur landen in derselben Struktur, damit der Spielcode nie
 * zwischen "Handy" und "Desktop" unterscheiden muss. Die Touch-Steuerung wird
 * in React gerendert (siehe ui/TouchControls.tsx) und meldet ihre Werte ueber
 * den EventBus - das haelt Safe-Area-Behandlung und Button-Groessen dort, wo
 * CSS ohnehin besser ist als Canvas.
 */

import Phaser from 'phaser';
import { bus } from '@/core/EventBus';
import type { Direction } from '@/data/types';

export interface InputState {
  /** Bewegungsvektor, Laenge 0..1. */
  moveX: number;
  moveY: number;
  /** Wird gerade geblockt? */
  blocking: boolean;
}

export type ActionName = 'attack' | 'interact' | 'dodge' | 'special';

export class InputSystem {
  readonly state: InputState = { moveX: 0, moveY: 0, blocking: false };

  private keys!: {
    up: Phaser.Input.Keyboard.Key[];
    down: Phaser.Input.Keyboard.Key[];
    left: Phaser.Input.Keyboard.Key[];
    right: Phaser.Input.Keyboard.Key[];
    attack: Phaser.Input.Keyboard.Key[];
    interact: Phaser.Input.Keyboard.Key[];
    dodge: Phaser.Input.Keyboard.Key[];
    special: Phaser.Input.Keyboard.Key[];
    block: Phaser.Input.Keyboard.Key[];
  };

  /** Vom virtuellen Joystick gemeldeter Vektor. */
  private virtual = { x: 0, y: 0 };

  /** Haelt der Spieler den Block-Button auf dem Touchscreen gedrueckt? */
  private touchBlocking = false;

  /** In diesem Frame ausgeloeste Aktionen. */
  private pending = new Set<ActionName>();

  /** Eingabe ist waehrend Dialogen und Zwischensequenzen gesperrt. */
  private locked = false;

  private unsubscribers: (() => void)[] = [];

  constructor(private scene: Phaser.Scene) {
    this.bindKeyboard();
    this.bindVirtual();
  }

  private bindKeyboard(): void {
    const kb = this.scene.input.keyboard;
    if (!kb) {
      // Reine Touch-Geraete melden keine Tastatur - das ist kein Fehler.
      this.keys = {
        up: [], down: [], left: [], right: [],
        attack: [], interact: [], dodge: [], special: [], block: [],
      };
      return;
    }

    const K = Phaser.Input.Keyboard.KeyCodes;
    const add = (...codes: number[]) => codes.map((c) => kb.addKey(c, true, false));

    this.keys = {
      up: add(K.W, K.UP),
      down: add(K.S, K.DOWN),
      left: add(K.A, K.LEFT),
      right: add(K.D, K.RIGHT),
      attack: add(K.SPACE, K.J),
      interact: add(K.E, K.ENTER, K.K),
      dodge: add(K.SHIFT, K.L),
      special: add(K.Q, K.U),
      block: add(K.CTRL, K.I),
    };

    // Pfeiltasten und Leertaste sollen die Seite nicht scrollen.
    kb.addCapture([K.UP, K.DOWN, K.LEFT, K.RIGHT, K.SPACE]);

    const bindPress = (keys: Phaser.Input.Keyboard.Key[], action: ActionName) => {
      for (const key of keys) {
        key.on('down', () => {
          if (!this.locked) this.pending.add(action);
        });
      }
    };
    bindPress(this.keys.attack, 'attack');
    bindPress(this.keys.interact, 'interact');
    bindPress(this.keys.dodge, 'dodge');
    bindPress(this.keys.special, 'special');
  }

  private bindVirtual(): void {
    this.unsubscribers.push(
      bus.on('input:virtual', ({ x, y }) => {
        this.virtual.x = x;
        this.virtual.y = y;
      }),
      bus.on('input:action', (action) => {
        if (this.locked) return;
        if (action === 'block-start') {
          this.touchBlocking = true;
        } else if (action === 'block-end') {
          this.touchBlocking = false;
        } else {
          this.pending.add(action);
        }
      }),
    );
  }

  /** Sperrt bzw. entsperrt die Steuerung (Dialoge, Cutscenes, Menues). */
  setLocked(locked: boolean): void {
    this.locked = locked;
    if (locked) {
      this.state.moveX = 0;
      this.state.moveY = 0;
      this.state.blocking = false;
      this.touchBlocking = false;
      this.virtual.x = 0;
      this.virtual.y = 0;
      this.pending.clear();
    }
  }

  isLocked(): boolean {
    return this.locked;
  }

  /** Muss einmal pro Frame vor der Auswertung aufgerufen werden. */
  update(): void {
    if (this.locked) {
      this.state.moveX = 0;
      this.state.moveY = 0;
      return;
    }

    let x = 0;
    let y = 0;
    const anyDown = (keys: Phaser.Input.Keyboard.Key[]) => keys.some((k) => k.isDown);

    if (anyDown(this.keys.left)) x -= 1;
    if (anyDown(this.keys.right)) x += 1;
    if (anyDown(this.keys.up)) y -= 1;
    if (anyDown(this.keys.down)) y += 1;

    // Tastatur-Diagonalen normalisieren, damit schraeg nicht schneller ist.
    if (x !== 0 && y !== 0) {
      const inv = Math.SQRT1_2;
      x *= inv;
      y *= inv;
    }

    // Joystick ueberschreibt die Tastatur, wenn er ausgelenkt ist.
    const virtualLength = Math.hypot(this.virtual.x, this.virtual.y);
    if (virtualLength > 0.08) {
      x = this.virtual.x;
      y = this.virtual.y;
    }

    this.state.moveX = x;
    this.state.moveY = y;
    // Geblockt wird, solange eine der beiden Quellen gedrueckt haelt.
    this.state.blocking = this.touchBlocking || anyDown(this.keys.block);
  }

  /** Wurde die Aktion in diesem Frame ausgeloest? Verbraucht das Ereignis. */
  consume(action: ActionName): boolean {
    if (this.pending.has(action)) {
      this.pending.delete(action);
      return true;
    }
    return false;
  }

  /** Setzt alle noch nicht verbrauchten Aktionen zurueck (Frame-Ende). */
  endFrame(): void {
    this.pending.clear();
  }

  /** Bewegungsrichtung als Himmelsrichtung - fuer Animation und Interaktion. */
  static directionFromVector(x: number, y: number, fallback: Direction): Direction {
    if (Math.abs(x) < 0.05 && Math.abs(y) < 0.05) return fallback;
    if (Math.abs(x) > Math.abs(y)) return x > 0 ? 'right' : 'left';
    return y > 0 ? 'down' : 'up';
  }

  destroy(): void {
    for (const off of this.unsubscribers) off();
    this.unsubscribers = [];
    this.pending.clear();
  }
}
