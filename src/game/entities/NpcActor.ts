/**
 * NPCs: Dorfbewohner, Haendler, Questgeber.
 *
 * Sie laufen optional in einem kleinen Radius umher, drehen sich zum Spieler,
 * wenn er sie anspricht, und zeigen ueber dem Kopf an, ob sie etwas zu sagen
 * haben (Ausrufezeichen fuer offene Quest, Haken fuer abschliessbare Quest).
 */

import Phaser from 'phaser';
import { TILE } from '@/core/constants';
import type { Direction, NpcDef } from '@/data/types';
import { Actor } from './Actor';
import { ensureCatTexture } from '../art/characterTextures';

export type NpcHint = 'none' | 'talk' | 'quest' | 'questDone';

export class NpcActor extends Actor {
  readonly def: NpcDef;
  /** Ursprungsposition - Grenze fuer das Umherlaufen. */
  private homeX: number;
  private homeY: number;
  private wander: boolean;
  private restingFacing: Direction;

  private moveTimer = 0;
  private moveDir = { x: 0, y: 0 };
  private pausing = true;

  /** Solange > 0, schaut der NPC den Spieler an und bleibt stehen. */
  private attentionMs = 0;

  private hintSprite: Phaser.GameObjects.Sprite | null = null;
  private currentHint: NpcHint = 'none';

  constructor(
    scene: Phaser.Scene,
    def: NpcDef,
    x: number,
    y: number,
    options: { wander?: boolean; facing?: Direction } = {},
  ) {
    const key = ensureCatTexture(scene.textures, def.look);
    super(scene, { textureKey: key, x, y, bodyWidth: 14, bodyHeight: 10, maxHp: 1 });

    this.def = def;
    this.homeX = x;
    this.homeY = y;
    this.wander = options.wander ?? false;
    this.restingFacing = options.facing ?? 'down';
    this.facing = this.restingFacing;

    // NPCs lassen sich nicht wegschieben.
    this.body.setImmovable(true);
    this.sprite.setName(`npc:${def.id}`);
  }

  /** Setzt das Symbol ueber dem Kopf. */
  setHint(hint: NpcHint): void {
    if (hint === this.currentHint) return;
    this.currentHint = hint;

    if (hint === 'none') {
      this.hintSprite?.destroy();
      this.hintSprite = null;
      return;
    }

    const key = hint === 'quest' ? 'hint:quest' : hint === 'questDone' ? 'hint:questDone' : 'hint:interact';
    if (!this.hintSprite) {
      this.hintSprite = this.scene.add.sprite(this.x, this.y - 26, key);
      this.hintSprite.setDepth(3500);
      this.hintSprite.setScale(0.7);
      this.scene.tweens.add({
        targets: this.hintSprite,
        y: this.y - 31,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      this.hintSprite.setTexture(key);
    }
  }

  /** Laesst den NPC den Spieler ansehen. */
  lookAt(x: number, y: number, durationMs = 2500): void {
    this.faceVector(x - this.x, y - this.y);
    this.attentionMs = durationMs;
    this.body.setVelocity(0, 0);
  }

  override update(delta: number): void {
    super.update(delta);

    if (this.attentionMs > 0) {
      this.attentionMs -= delta;
      this.body.setVelocity(0, 0);
      if (this.attentionMs <= 0 && !this.wander) this.facing = this.restingFacing;
    } else if (this.wander) {
      this.updateWander(delta);
    } else {
      this.facing = this.restingFacing;
    }

    if (this.hintSprite) {
      this.hintSprite.x = this.x;
      // y wird vom Tween animiert; nur der Ausgangswert wandert mit.
      if (!this.scene.tweens.isTweening(this.hintSprite)) {
        this.hintSprite.y = this.y - 28;
      }
    }
  }

  private updateWander(delta: number): void {
    this.moveTimer -= delta;
    if (this.moveTimer <= 0) {
      this.pausing = !this.pausing;
      if (this.pausing) {
        this.moveTimer = 1200 + Math.random() * 2800;
        this.moveDir = { x: 0, y: 0 };
      } else {
        this.moveTimer = 500 + Math.random() * 900;
        const angle = Math.random() * Math.PI * 2;
        this.moveDir = { x: Math.cos(angle), y: Math.sin(angle) };
      }
    }

    if (this.pausing) {
      this.body.setVelocity(0, 0);
      return;
    }

    // Nicht weiter als zwei Kacheln vom Startpunkt entfernen.
    const dx = this.x - this.homeX;
    const dy = this.y - this.homeY;
    if (Math.hypot(dx, dy) > TILE * 2) {
      const back = Math.atan2(-dy, -dx);
      this.moveDir = { x: Math.cos(back), y: Math.sin(back) };
    }

    const speed = 42;
    this.body.setVelocity(this.moveDir.x * speed, this.moveDir.y * speed);
    this.faceVector(this.moveDir.x, this.moveDir.y);
  }

  override destroy(): void {
    this.hintSprite?.destroy();
    super.destroy();
  }
}
