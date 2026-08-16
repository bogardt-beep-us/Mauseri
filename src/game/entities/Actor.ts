/**
 * Basisklasse fuer alles, was sich in der Welt bewegt und animiert wird.
 *
 * Kapselt die Dinge, die Spieler, Begleiter, NPCs und Gegner gemeinsam haben:
 * Blickrichtung, Laufanimation, Trefferblinken, Rueckstoss und Lebenspunkte.
 */

import Phaser from 'phaser';
import { DEPTH } from '@/core/constants';
import type { Direction } from '@/data/types';
import { ATTACK_COL, COLS, DIRECTION_ROW, HURT_COL, WALK_FRAMES } from '../art/characterTextures';

export type ActorState = 'idle' | 'walk' | 'attack' | 'hurt' | 'dead';

export interface ActorOptions {
  textureKey: string;
  x: number;
  y: number;
  bodyWidth?: number;
  bodyHeight?: number;
  maxHp?: number;
  /** Sprite bewegt sich nicht durch Physik (z. B. Deko-NPCs). */
  immovable?: boolean;
}

export class Actor {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly scene: Phaser.Scene;

  facing: Direction = 'down';
  state: ActorState = 'idle';
  hp: number;
  maxHp: number;

  /** Solange > 0, ist der Akteur unverwundbar (in Millisekunden). */
  invulnerableMs = 0;
  /** Solange > 0, laeuft ein Rueckstoss und die Steuerung ist blockiert. */
  knockbackMs = 0;

  private animTimer = 0;
  private walkFrame = 0;
  private stateTimer = 0;
  private flashTimer = 0;

  constructor(scene: Phaser.Scene, options: ActorOptions) {
    this.scene = scene;
    this.maxHp = options.maxHp ?? 1;
    this.hp = this.maxHp;

    this.sprite = scene.physics.add.sprite(options.x, options.y, options.textureKey, 0);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(DEPTH.entities);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const bw = options.bodyWidth ?? 16;
    const bh = options.bodyHeight ?? 12;
    body.setSize(bw, bh);
    // Koerper an die Fuesse setzen: der Kopf soll ueber Kanten ragen duerfen,
    // sonst fuehlt sich die Figur in engen Gaengen klobig an.
    body.setOffset((this.sprite.width - bw) / 2, this.sprite.height - bh - 3);
    if (options.immovable) {
      body.setImmovable(true);
      body.moves = false;
    }

    this.sprite.setData('actor', this);
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }

  get isAlive(): boolean {
    return this.state !== 'dead' && this.hp > 0;
  }

  setFacing(dir: Direction): void {
    this.facing = dir;
  }

  /** Setzt Richtung aus einem Bewegungsvektor, wenn dieser lang genug ist. */
  faceVector(dx: number, dy: number): void {
    if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return;
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
  }

  /** Kurzzeitiger Angriffszustand - blockiert Laufanimation. */
  playAttack(durationMs = 220): void {
    if (this.state === 'dead') return;
    this.state = 'attack';
    this.stateTimer = durationMs;
  }

  playHurt(durationMs = 260): void {
    if (this.state === 'dead') return;
    this.state = 'hurt';
    this.stateTimer = durationMs;
    this.flashTimer = durationMs;
  }

  /** Wendet Schaden an. Gibt zurueck, ob der Treffer gezaehlt hat. */
  takeDamage(amount: number, fromX?: number, fromY?: number, knockback = 150): boolean {
    if (!this.isAlive || this.invulnerableMs > 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.playHurt();

    if (fromX !== undefined && fromY !== undefined && knockback > 0 && this.body.moves) {
      const angle = Math.atan2(this.y - fromY, this.x - fromX);
      this.body.setVelocity(Math.cos(angle) * knockback, Math.sin(angle) * knockback);
      this.knockbackMs = 160;
    }

    if (this.hp <= 0) this.die();
    return true;
  }

  die(): void {
    this.state = 'dead';
    this.body.setVelocity(0, 0);
    this.body.enable = false;
  }

  /** Aktualisiert Animation und Zustandstimer. */
  update(delta: number): void {
    if (this.invulnerableMs > 0) this.invulnerableMs -= delta;
    if (this.knockbackMs > 0) this.knockbackMs -= delta;

    if (this.stateTimer > 0) {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0 && this.state !== 'dead') {
        this.state = 'idle';
      }
    }

    // Trefferblinken: kurz rot einfaerben, im Wechsel mit normaler Farbe.
    if (this.flashTimer > 0) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        this.sprite.clearTint();
      } else if (Math.floor(this.flashTimer / 70) % 2 === 0) {
        this.sprite.setTint(0xff8080);
      } else {
        this.sprite.clearTint();
      }
    } else if (this.invulnerableMs > 0) {
      // Nach dem Blinken noch halbtransparent, solange unverwundbar
      this.sprite.setAlpha(Math.floor(this.invulnerableMs / 90) % 2 === 0 ? 0.55 : 1);
    } else if (this.sprite.alpha !== 1) {
      this.sprite.setAlpha(1);
    }

    this.updateFrame(delta);

    // Tiefensortierung: was weiter unten steht, wird spaeter gezeichnet.
    this.sprite.setDepth(DEPTH.entities + this.sprite.y / 1000);
  }

  private updateFrame(delta: number): void {
    const row = DIRECTION_ROW[this.facing];

    if (this.state === 'attack') {
      this.sprite.setFrame(row * COLS + ATTACK_COL);
      return;
    }
    if (this.state === 'hurt' || this.state === 'dead') {
      this.sprite.setFrame(row * COLS + HURT_COL);
      return;
    }

    const speed = Math.hypot(this.body.velocity.x, this.body.velocity.y);
    if (speed > 6) {
      // Schrittfrequenz haengt am Tempo - schnelles Laufen animiert schneller.
      this.animTimer += delta * (speed / 110);
      const stepMs = 130;
      if (this.animTimer >= stepMs) {
        this.animTimer -= stepMs;
        this.walkFrame = (this.walkFrame + 1) % WALK_FRAMES.length;
      }
      this.sprite.setFrame(row * COLS + WALK_FRAMES[this.walkFrame]!);
    } else {
      this.animTimer = 0;
      this.walkFrame = 0;
      this.sprite.setFrame(row * COLS);
    }
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
