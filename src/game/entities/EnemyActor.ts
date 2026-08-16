/**
 * Gegner.
 *
 * Jedes Verhalten aus EnemyBehavior hat ein eigenes Bewegungs- und
 * Angriffsmuster. Ziel ist, dass der Spieler an der Silhouette und den ersten
 * zwei Sekunden erkennt, womit er es zu tun hat - und dass jeder Gegner eine
 * andere Antwort verlangt (ausweichen, Abstand halten, blocken, umlaufen).
 */

import Phaser from 'phaser';
import { audio } from '../systems/AudioSystem';
import type { EnemyDef } from '@/data/types';
import { Actor } from './Actor';
import { ensureCreatureTexture } from '../art/characterTextures';

export interface EnemyContext {
  playerX: number;
  playerY: number;
  /** Sichtlinie frei? (keine Wand dazwischen) */
  canSeePlayer: boolean;
  /** Ist der Spieler im Schattenlauf und damit unsichtbar? */
  playerHidden: boolean;
}

export type EnemyAttackRequest =
  | { kind: 'melee'; x: number; y: number; radius: number; damage: number }
  | { kind: 'projectile'; x: number; y: number; vx: number; vy: number; damage: number; color: number; lifetimeMs: number };

export class EnemyActor extends Actor {
  readonly def: EnemyDef;
  /** Eindeutige ID auf der Karte - fuer dauerhaftes Besiegen. */
  readonly instanceId: string;
  readonly permanent: boolean;

  /** Position, an der der Gegner gestartet ist. */
  readonly homeX: number;
  readonly homeY: number;
  /** Maximale Entfernung vom Startpunkt in Weltpixeln. */
  private leash: number;

  private attackCooldownMs = 0;
  private stateTimerMs = 0;
  /** Zustand des Verhaltens - Bedeutung haengt vom Verhalten ab. */
  private phase: 'idle' | 'chase' | 'windup' | 'act' | 'recover' | 'retreat' = 'idle';

  private wanderDir = { x: 0, y: 0 };
  private wanderTimer = 0;
  private orbitAngle = Math.random() * Math.PI * 2;
  private chargeDir = { x: 0, y: 0 };

  /** Nur fuer 'ambusher': noch versteckt? */
  private hidden: boolean;

  /** Schild aktiv (nur relevant fuer Gegner mit weakTo). */
  shielded: boolean;

  /** Markierung, die vor einem Sturmangriff am Boden erscheint. */
  private telegraphSprite: Phaser.GameObjects.Sprite | null = null;

  constructor(
    scene: Phaser.Scene,
    def: EnemyDef,
    x: number,
    y: number,
    options: { instanceId: string; permanent?: boolean; leash?: number },
  ) {
    const key = ensureCreatureTexture(scene.textures, def.look);
    super(scene, {
      textureKey: key,
      x,
      y,
      bodyWidth: Math.round(14 * (def.look.scale ?? 1)),
      bodyHeight: Math.round(11 * (def.look.scale ?? 1)),
      maxHp: def.hp,
    });

    this.def = def;
    this.instanceId = options.instanceId;
    this.permanent = options.permanent ?? false;
    this.homeX = x;
    this.homeY = y;
    this.leash = (options.leash ?? 8) * 32;
    this.hidden = def.behavior === 'ambusher';
    this.shielded = def.weakTo !== undefined;

    if (this.hidden) {
      this.sprite.setAlpha(0.12);
    }
    this.sprite.setName(`enemy:${def.id}`);
  }

  get isHidden(): boolean {
    return this.hidden;
  }

  /** Wird von der Szene je Frame aufgerufen. Liefert einen Angriff, wenn einer faellig ist. */
  think(delta: number, ctx: EnemyContext): EnemyAttackRequest | null {
    if (!this.isAlive) return null;

    if (this.attackCooldownMs > 0) this.attackCooldownMs -= delta;
    if (this.stateTimerMs > 0) this.stateTimerMs -= delta;
    if (this.knockbackMs > 0) return null;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, ctx.playerX, ctx.playerY);
    const awake = !ctx.playerHidden && distance <= this.def.aggroRange && ctx.canSeePlayer;

    // Versteckte Gegner brechen erst aus, wenn der Spieler nah genug ist.
    if (this.hidden) {
      if (distance < this.def.aggroRange * 0.45 && !ctx.playerHidden) {
        this.hidden = false;
        this.sprite.setAlpha(1);
        audio.play('warn');
        this.scene.cameras.main.shake(120, 0.004);
      } else {
        this.body.setVelocity(0, 0);
        return null;
      }
    }

    // Zu weit vom Posten entfernt: zurueckkehren.
    const homeDistance = Phaser.Math.Distance.Between(this.x, this.y, this.homeX, this.homeY);
    if (homeDistance > this.leash && this.phase !== 'act') {
      this.moveToward(this.homeX, this.homeY, this.def.speed * 0.8);
      if (homeDistance < 12) this.phase = 'idle';
      return null;
    }

    switch (this.def.behavior) {
      case 'chaser':
        return this.actChaser(distance, awake, ctx);
      case 'wanderer':
        return this.actWanderer(delta, distance, awake, ctx);
      case 'charger':
        return this.actCharger(distance, awake, ctx);
      case 'shooter':
        return this.actShooter(distance, awake, ctx);
      case 'ambusher':
        return this.actChaser(distance, awake, ctx);
      case 'orbiter':
        return this.actOrbiter(delta, distance, awake, ctx);
      case 'splitter':
        return this.actChaser(distance, awake, ctx);
      case 'guard':
        return this.actGuard(distance, awake, ctx);
    }
  }

  // -------------------------------------------------------------------------
  // Verhaltensmuster
  // -------------------------------------------------------------------------

  private actChaser(distance: number, awake: boolean, ctx: EnemyContext): EnemyAttackRequest | null {
    if (!awake) {
      this.body.setVelocity(0, 0);
      return null;
    }
    if (distance > this.def.attackRange) {
      this.moveToward(ctx.playerX, ctx.playerY, this.def.speed);
      return null;
    }
    this.body.setVelocity(0, 0);
    this.faceVector(ctx.playerX - this.x, ctx.playerY - this.y);
    return this.meleeIfReady(ctx);
  }

  private actWanderer(
    delta: number,
    distance: number,
    awake: boolean,
    ctx: EnemyContext,
  ): EnemyAttackRequest | null {
    if (awake && distance < this.def.aggroRange) {
      return this.actChaser(distance, awake, ctx);
    }

    this.wanderTimer -= delta;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 900 + Math.random() * 1800;
      if (Math.random() < 0.35) {
        this.wanderDir = { x: 0, y: 0 };
      } else {
        const angle = Math.random() * Math.PI * 2;
        this.wanderDir = { x: Math.cos(angle), y: Math.sin(angle) };
      }
    }
    const speed = this.def.speed * 0.45;
    this.body.setVelocity(this.wanderDir.x * speed, this.wanderDir.y * speed);
    this.faceVector(this.wanderDir.x, this.wanderDir.y);
    return null;
  }

  private actCharger(distance: number, awake: boolean, ctx: EnemyContext): EnemyAttackRequest | null {
    switch (this.phase) {
      case 'idle':
      case 'chase': {
        if (!awake) {
          this.body.setVelocity(0, 0);
          return null;
        }
        if (distance < this.def.aggroRange * 0.85 && this.attackCooldownMs <= 0) {
          // Zielen: kurz stehen bleiben, damit der Spieler reagieren kann.
          this.phase = 'windup';
          this.stateTimerMs = 620;
          this.body.setVelocity(0, 0);
          this.faceVector(ctx.playerX - this.x, ctx.playerY - this.y);
          this.chargeDir = this.normalized(ctx.playerX - this.x, ctx.playerY - this.y);
          this.showTelegraph();
          audio.play('warn');
        } else {
          this.moveToward(ctx.playerX, ctx.playerY, this.def.speed * 0.55);
        }
        return null;
      }
      case 'windup': {
        this.body.setVelocity(0, 0);
        // Leichtes Zittern als Ankuendigung
        this.sprite.x += Math.sin(this.stateTimerMs / 22) * 0.6;
        if (this.stateTimerMs <= 0) {
          this.phase = 'act';
          this.stateTimerMs = 520;
          this.hideTelegraph();
        }
        return null;
      }
      case 'act': {
        this.body.setVelocity(this.chargeDir.x * this.def.speed * 3.1, this.chargeDir.y * this.def.speed * 3.1);
        if (this.stateTimerMs <= 0) {
          this.phase = 'recover';
          this.stateTimerMs = 700;
          this.attackCooldownMs = this.def.attackCooldownMs;
        }
        // Waehrend des Sturms trifft die Beruehrung selbst - das erledigt die
        // Kollisionspruefung in der Szene, hier kein eigener Angriff.
        return null;
      }
      case 'recover':
      default: {
        this.body.setVelocity(this.body.velocity.x * 0.85, this.body.velocity.y * 0.85);
        if (this.stateTimerMs <= 0) this.phase = 'chase';
        return null;
      }
    }
  }

  private actShooter(distance: number, awake: boolean, ctx: EnemyContext): EnemyAttackRequest | null {
    if (!awake) {
      this.body.setVelocity(0, 0);
      return null;
    }
    this.faceVector(ctx.playerX - this.x, ctx.playerY - this.y);

    const preferred = this.def.attackRange * 0.75;
    if (distance < preferred * 0.7) {
      // Abstand halten
      const away = this.normalized(this.x - ctx.playerX, this.y - ctx.playerY);
      this.body.setVelocity(away.x * this.def.speed, away.y * this.def.speed);
    } else if (distance > this.def.attackRange) {
      this.moveToward(ctx.playerX, ctx.playerY, this.def.speed * 0.8);
    } else {
      this.body.setVelocity(0, 0);
    }

    if (this.attackCooldownMs <= 0 && distance <= this.def.attackRange && ctx.canSeePlayer) {
      this.attackCooldownMs = this.def.attackCooldownMs;
      this.playAttack(240);
      const projectile = this.def.projectile;
      if (!projectile) return null;
      const dir = this.normalized(ctx.playerX - this.x, ctx.playerY - this.y);
      return {
        kind: 'projectile',
        x: this.x,
        y: this.y,
        vx: dir.x * projectile.speed,
        vy: dir.y * projectile.speed,
        damage: projectile.damage,
        color: projectile.color,
        lifetimeMs: projectile.lifetimeMs,
      };
    }
    return null;
  }

  private actOrbiter(
    delta: number,
    distance: number,
    awake: boolean,
    ctx: EnemyContext,
  ): EnemyAttackRequest | null {
    if (!awake) {
      this.body.setVelocity(0, 0);
      return null;
    }

    const radius = this.def.attackRange * 1.35;
    this.orbitAngle += (delta / 1000) * 1.5;

    if (distance > radius * 1.4) {
      this.moveToward(ctx.playerX, ctx.playerY, this.def.speed);
      return null;
    }

    // Auf einer Kreisbahn um den Spieler bewegen
    const targetX = ctx.playerX + Math.cos(this.orbitAngle) * radius;
    const targetY = ctx.playerY + Math.sin(this.orbitAngle) * radius;
    this.moveToward(targetX, targetY, this.def.speed * 1.15);
    this.faceVector(ctx.playerX - this.x, ctx.playerY - this.y);

    if (distance <= this.def.attackRange && this.attackCooldownMs <= 0) {
      return this.meleeIfReady(ctx);
    }
    return null;
  }

  private actGuard(distance: number, awake: boolean, ctx: EnemyContext): EnemyAttackRequest | null {
    const homeDistance = Phaser.Math.Distance.Between(this.x, this.y, this.homeX, this.homeY);
    if (!awake || homeDistance > this.leash * 0.8) {
      if (homeDistance > 6) {
        this.moveToward(this.homeX, this.homeY, this.def.speed * 0.7);
      } else {
        this.body.setVelocity(0, 0);
      }
      return null;
    }
    return this.actChaser(distance, awake, ctx);
  }

  // -------------------------------------------------------------------------
  // Hilfen
  // -------------------------------------------------------------------------

  private meleeIfReady(ctx: EnemyContext): EnemyAttackRequest | null {
    if (this.attackCooldownMs > 0) return null;
    this.attackCooldownMs = this.def.attackCooldownMs;
    this.playAttack(260);

    const dir = this.normalized(ctx.playerX - this.x, ctx.playerY - this.y);
    return {
      kind: 'melee',
      x: this.x + dir.x * 14,
      y: this.y + dir.y * 14,
      radius: 15,
      damage: this.def.attack,
    };
  }

  private moveToward(x: number, y: number, speed: number): void {
    const dir = this.normalized(x - this.x, y - this.y);
    this.body.setVelocity(dir.x * speed, dir.y * speed);
    this.faceVector(dir.x, dir.y);
  }

  private normalized(dx: number, dy: number): { x: number; y: number } {
    const length = Math.hypot(dx, dy);
    if (length < 0.001) return { x: 0, y: 0 };
    return { x: dx / length, y: dy / length };
  }

  private showTelegraph(): void {
    if (this.telegraphSprite) return;
    this.telegraphSprite = this.scene.add.sprite(this.x, this.y + 6, 'fx:telegraph');
    this.telegraphSprite.setDepth(9);
    this.telegraphSprite.setAlpha(0.85);
    this.scene.tweens.add({
      targets: this.telegraphSprite,
      scale: { from: 0.6, to: 1.25 },
      alpha: { from: 0.9, to: 0.35 },
      duration: 600,
    });
  }

  private hideTelegraph(): void {
    this.telegraphSprite?.destroy();
    this.telegraphSprite = null;
  }

  /** Der Gegner ist gerade im Sturmangriff - Beruehrung verursacht Schaden. */
  get isCharging(): boolean {
    return this.def.behavior === 'charger' && this.phase === 'act';
  }

  /** Bricht den Schild - nur mit der passenden Faehigkeit moeglich. */
  breakShield(): void {
    if (!this.shielded) return;
    this.shielded = false;
    audio.play('puzzle');
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: { from: 1.3, to: 1 },
      scaleY: { from: 0.7, to: 1 },
      duration: 260,
      ease: 'Back.easeOut',
    });
  }

  override die(): void {
    super.die();
    this.hideTelegraph();
  }

  override destroy(): void {
    this.hideTelegraph();
    super.destroy();
  }
}
