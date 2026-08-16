/**
 * Bosse.
 *
 * Ein Boss ist kein Gegner mit mehr Lebenspunkten. Er arbeitet Angriffsmuster
 * ab, wechselt bei bestimmten Lebensstaenden die Phase (mit anderer Arena und
 * anderem Repertoire) und hat immer ein Zeitfenster, in dem er verwundbar ist -
 * das ist die erkennbare Schwaeche, nach der der Spieler suchen soll.
 */

import Phaser from 'phaser';
import { bus } from '@/core/EventBus';
import { audio } from '../systems/AudioSystem';
import type { BossDef, BossPattern } from '@/data/types';
import { Actor } from './Actor';
import { ensureCreatureTexture } from '../art/characterTextures';

export type BossAction =
  | { kind: 'melee'; x: number; y: number; radius: number; damage: number }
  | { kind: 'projectile'; x: number; y: number; vx: number; vy: number; damage: number; color: number; lifetimeMs: number }
  | { kind: 'summon'; enemy: string; count: number }
  | { kind: 'hazard'; hazard: string; x: number; y: number; damage: number }
  | { kind: 'shockwave'; x: number; y: number; radius: number; damage: number };

interface BossContext {
  playerX: number;
  playerY: number;
  /** Grenzen der Arena in Weltpixeln. */
  arena: { x: number; y: number; w: number; h: number };
}

export class BossActor extends Actor {
  readonly def: BossDef;

  phaseIndex = 0;
  private patternIndex = -1;
  private patternTimer = 0;
  /** Abschnitt innerhalb eines Musters. */
  private step: 'choose' | 'windup' | 'execute' | 'recover' = 'choose';
  private currentPattern: BossPattern | null = null;
  private repeatsLeft = 0;

  private moveDir = { x: 0, y: 0 };
  private beamActive = false;
  private shieldMs = 0;

  /** Verwundbarkeitsfenster - nur dann zaehlt voller Schaden. */
  vulnerableMs = 0;

  private telegraph: Phaser.GameObjects.Sprite | null = null;

  constructor(scene: Phaser.Scene, def: BossDef, x: number, y: number) {
    const key = ensureCreatureTexture(scene.textures, def.look);
    super(scene, {
      textureKey: key,
      x,
      y,
      bodyWidth: Math.round(20 * (def.look.scale ?? 1.4)),
      bodyHeight: Math.round(16 * (def.look.scale ?? 1.4)),
      maxHp: def.hp,
    });
    this.def = def;
    this.sprite.setScale(def.look.scale ?? 1.4);
    this.sprite.setName(`boss:${def.id}`);
    this.body.setImmovable(false);
    this.emitBar();
  }

  get phase() {
    return this.def.phases[this.phaseIndex]!;
  }

  get isShielded(): boolean {
    return this.shieldMs > 0;
  }

  private emitBar(): void {
    bus.emit('boss:update', {
      name: `${this.def.name} - ${this.def.title}`,
      hp: this.hp,
      maxHp: this.maxHp,
      phase: this.phaseIndex + 1,
      visible: this.isAlive,
    });
  }

  /** Fuehrt einen Schritt des aktuellen Musters aus. */
  think(delta: number, ctx: BossContext): BossAction[] {
    if (!this.isAlive) return [];

    if (this.shieldMs > 0) this.shieldMs -= delta;
    if (this.vulnerableMs > 0) this.vulnerableMs -= delta;
    if (this.patternTimer > 0) this.patternTimer -= delta;

    this.checkPhase();

    const actions: BossAction[] = [];
    const speedFactor = this.phase.speedFactor ?? 1;

    switch (this.step) {
      case 'choose': {
        const patterns = this.phase.patterns;
        this.patternIndex = (this.patternIndex + 1) % patterns.length;
        this.currentPattern = patterns[this.patternIndex]!;
        this.beginPattern(this.currentPattern, ctx);
        break;
      }

      case 'windup': {
        // Auf den Spieler ausrichten, langsam nachfuehren
        this.faceVector(ctx.playerX - this.x, ctx.playerY - this.y);
        this.body.setVelocity(0, 0);
        this.sprite.x += Math.sin(this.patternTimer / 26) * 0.7;
        if (this.patternTimer <= 0) {
          this.step = 'execute';
          this.hideTelegraph();
          actions.push(...this.executePattern(this.currentPattern!, ctx));
        }
        break;
      }

      case 'execute': {
        actions.push(...this.continuePattern(this.currentPattern!, ctx, delta, speedFactor));
        if (this.patternTimer <= 0) {
          this.step = 'recover';
          // Nach jedem Muster ein Verwundbarkeitsfenster - hier soll der
          // Spieler zuschlagen.
          this.vulnerableMs = 1100;
          this.patternTimer = 900;
          this.body.setVelocity(0, 0);
          this.beamActive = false;
        }
        break;
      }

      case 'recover': {
        this.body.setVelocity(this.body.velocity.x * 0.9, this.body.velocity.y * 0.9);
        if (this.patternTimer <= 0) this.step = 'choose';
        break;
      }
    }

    return actions;
  }

  private checkPhase(): void {
    const fraction = this.hp / this.maxHp;
    let target = this.phaseIndex;
    for (let i = this.def.phases.length - 1; i >= 0; i--) {
      if (fraction <= this.def.phases[i]!.hpThreshold) {
        target = i;
        break;
      }
    }
    if (target > this.phaseIndex) {
      this.phaseIndex = target;
      this.step = 'choose';
      this.patternIndex = -1;
      this.patternTimer = 0;
      this.vulnerableMs = 0;
      audio.play('warn');
      this.scene.cameras.main.shake(340, 0.008);
      bus.emit('screen:flash', { color: 0xffffff, duration: 180 });

      const taunt = this.phase.taunt;
      if (taunt) {
        bus.emit('toast', { text: taunt, kind: 'warning' });
      }
      this.emitBar();
    }
  }

  private beginPattern(pattern: BossPattern, ctx: BossContext): void {
    switch (pattern.kind) {
      case 'charge':
        this.patternTimer = pattern.windupMs;
        this.step = 'windup';
        this.moveDir = this.normalized(ctx.playerX - this.x, ctx.playerY - this.y);
        this.showTelegraph();
        audio.play('warn');
        break;
      case 'slam':
        this.patternTimer = pattern.windupMs;
        this.step = 'windup';
        this.showTelegraph();
        audio.play('warn');
        break;
      case 'beam':
        this.patternTimer = pattern.windupMs;
        this.step = 'windup';
        this.showTelegraph();
        audio.play('warn');
        break;
      case 'volley':
      case 'summon':
      case 'spawnHazard':
      case 'teleport':
        this.patternTimer = 420;
        this.step = 'windup';
        break;
      case 'dash':
        this.patternTimer = 380;
        this.step = 'windup';
        this.repeatsLeft = pattern.times;
        break;
      case 'shield':
        this.patternTimer = 200;
        this.step = 'windup';
        break;
      case 'rest':
        this.patternTimer = pattern.durationMs;
        this.step = 'execute';
        // Ruhephase ist bewusst ein langes Verwundbarkeitsfenster.
        this.vulnerableMs = pattern.durationMs;
        break;
    }
  }

  private executePattern(pattern: BossPattern, ctx: BossContext): BossAction[] {
    const actions: BossAction[] = [];

    switch (pattern.kind) {
      case 'charge':
        this.patternTimer = 620;
        this.body.setVelocity(this.moveDir.x * pattern.speed, this.moveDir.y * pattern.speed);
        break;

      case 'slam':
        this.patternTimer = 320;
        actions.push({
          kind: 'shockwave',
          x: this.x,
          y: this.y,
          radius: pattern.radius,
          damage: pattern.damage,
        });
        this.scene.cameras.main.shake(260, 0.01);
        audio.play('bossHit');
        break;

      case 'volley': {
        this.patternTimer = 260;
        const base = Math.atan2(ctx.playerY - this.y, ctx.playerX - this.x);
        const spread = (pattern.spreadDeg * Math.PI) / 180;
        for (let i = 0; i < pattern.count; i++) {
          const t = pattern.count === 1 ? 0.5 : i / (pattern.count - 1);
          const angle = base - spread / 2 + spread * t;
          actions.push({
            kind: 'projectile',
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * pattern.speed,
            vy: Math.sin(angle) * pattern.speed,
            damage: pattern.damage,
            color: 0xa77fd8,
            lifetimeMs: 2600,
          });
        }
        break;
      }

      case 'summon':
        this.patternTimer = 500;
        actions.push({ kind: 'summon', enemy: pattern.enemy, count: pattern.count });
        break;

      case 'spawnHazard': {
        this.patternTimer = 420;
        for (let i = 0; i < pattern.count; i++) {
          // Gefahren um den Spieler herum, aber nicht direkt auf ihm -
          // der Spieler soll ausweichen koennen, nicht bestraft werden.
          const angle = Math.random() * Math.PI * 2;
          const radius = 26 + Math.random() * 70;
          const x = Phaser.Math.Clamp(
            ctx.playerX + Math.cos(angle) * radius,
            ctx.arena.x + 16,
            ctx.arena.x + ctx.arena.w - 16,
          );
          const y = Phaser.Math.Clamp(
            ctx.playerY + Math.sin(angle) * radius,
            ctx.arena.y + 16,
            ctx.arena.y + ctx.arena.h - 16,
          );
          actions.push({ kind: 'hazard', hazard: pattern.hazard, x, y, damage: pattern.damage });
        }
        break;
      }

      case 'dash':
        this.patternTimer = 300;
        this.moveDir = this.normalized(ctx.playerX - this.x, ctx.playerY - this.y);
        this.body.setVelocity(this.moveDir.x * pattern.speed, this.moveDir.y * pattern.speed);
        audio.play('dodge');
        break;

      case 'beam':
        this.patternTimer = pattern.durationMs;
        this.beamActive = true;
        break;

      case 'shield':
        this.patternTimer = pattern.durationMs;
        this.shieldMs = pattern.durationMs;
        audio.play('block');
        break;

      case 'teleport': {
        this.patternTimer = 320;
        const x = ctx.arena.x + 24 + Math.random() * (ctx.arena.w - 48);
        const y = ctx.arena.y + 24 + Math.random() * (ctx.arena.h - 48);
        this.scene.tweens.add({
          targets: this.sprite,
          alpha: { from: 1, to: 0.1 },
          duration: 120,
          yoyo: true,
          onYoyo: () => {
            this.sprite.setPosition(x, y);
            this.body.reset(x, y);
          },
        });
        audio.play('shadowStep');
        break;
      }

      case 'rest':
        this.patternTimer = pattern.durationMs;
        break;
    }

    return actions;
  }

  private continuePattern(
    pattern: BossPattern,
    ctx: BossContext,
    delta: number,
    speedFactor: number,
  ): BossAction[] {
    const actions: BossAction[] = [];

    if (pattern.kind === 'charge') {
      // In den Arenagrenzen halten und abprallen
      this.bounceInArena(ctx.arena);
    } else if (pattern.kind === 'dash') {
      if (this.patternTimer <= 0 && this.repeatsLeft > 1) {
        this.repeatsLeft--;
        this.patternTimer = 300;
        this.moveDir = this.normalized(ctx.playerX - this.x, ctx.playerY - this.y);
        this.body.setVelocity(
          this.moveDir.x * pattern.speed * speedFactor,
          this.moveDir.y * pattern.speed * speedFactor,
        );
      }
      this.bounceInArena(ctx.arena);
    } else if (pattern.kind === 'beam' && this.beamActive) {
      // Der Strahl dreht sich langsam auf den Spieler zu; getroffen wird,
      // wer in der Linie steht (Pruefung in der Szene).
      this.faceVector(ctx.playerX - this.x, ctx.playerY - this.y);
      this.beamAngle = Phaser.Math.Angle.RotateTo(
        this.beamAngle,
        Math.atan2(ctx.playerY - this.y, ctx.playerX - this.x),
        (delta / 1000) * 1.1,
      );
    } else if (pattern.kind === 'rest') {
      this.body.setVelocity(0, 0);
    }

    void actions;
    return actions;
  }

  beamAngle = 0;

  get isBeaming(): boolean {
    return this.beamActive;
  }

  private bounceInArena(arena: { x: number; y: number; w: number; h: number }): void {
    const margin = 14;
    if (this.x < arena.x + margin && this.body.velocity.x < 0) {
      this.body.velocity.x *= -1;
      this.moveDir.x *= -1;
    }
    if (this.x > arena.x + arena.w - margin && this.body.velocity.x > 0) {
      this.body.velocity.x *= -1;
      this.moveDir.x *= -1;
    }
    if (this.y < arena.y + margin && this.body.velocity.y < 0) {
      this.body.velocity.y *= -1;
      this.moveDir.y *= -1;
    }
    if (this.y > arena.y + arena.h - margin && this.body.velocity.y > 0) {
      this.body.velocity.y *= -1;
      this.moveDir.y *= -1;
    }
  }

  /** Der Boss beruehrt den Spieler waehrend eines Sturms oder Dashs. */
  get isRushing(): boolean {
    return (
      this.step === 'execute' &&
      (this.currentPattern?.kind === 'charge' || this.currentPattern?.kind === 'dash')
    );
  }

  override takeDamage(amount: number, fromX?: number, fromY?: number, knockback = 0): boolean {
    if (!this.isAlive) return false;

    if (this.shieldMs > 0) {
      audio.play('block');
      this.scene.cameras.main.shake(80, 0.003);
      return false;
    }

    // Ausserhalb des Verwundbarkeitsfensters richtet der Angriff weniger aus.
    const multiplier = this.vulnerableMs > 0 ? (this.def.weakness?.damageMultiplier ?? 2) : 1;
    const dealt = Math.max(1, Math.round(amount * multiplier));

    this.hp = Math.max(0, this.hp - dealt);
    this.playHurt(180);
    audio.play(this.vulnerableMs > 0 ? 'bossHit' : 'hit');
    void fromX;
    void fromY;
    void knockback;

    this.emitBar();
    if (this.hp <= 0) this.die();
    return true;
  }

  private showTelegraph(): void {
    if (this.telegraph) return;
    this.telegraph = this.scene.add.sprite(this.x, this.y + 8, 'fx:telegraph');
    this.telegraph.setDepth(9);
    this.telegraph.setScale(1.6);
    this.scene.tweens.add({
      targets: this.telegraph,
      scale: { from: 0.9, to: 2.1 },
      alpha: { from: 0.9, to: 0.3 },
      duration: 620,
      repeat: -1,
    });
  }

  private hideTelegraph(): void {
    this.telegraph?.destroy();
    this.telegraph = null;
  }

  override die(): void {
    super.die();
    this.hideTelegraph();
    this.beamActive = false;
    bus.emit('boss:update', {
      name: this.def.name,
      hp: 0,
      maxHp: this.maxHp,
      phase: this.phaseIndex + 1,
      visible: false,
    });
  }

  override update(delta: number): void {
    super.update(delta);
    if (this.telegraph) this.telegraph.setPosition(this.x, this.y + 8);
    // Verwundbarkeit sichtbar machen: der Boss leuchtet kurz auf.
    if (this.vulnerableMs > 0 && this.state !== 'hurt') {
      this.sprite.setTint(0xfff0b0);
    } else if (this.shieldMs > 0) {
      this.sprite.setTint(0x8fb4ff);
    } else if (this.state !== 'hurt') {
      this.sprite.clearTint();
    }
  }

  private normalized(dx: number, dy: number): { x: number; y: number } {
    const length = Math.hypot(dx, dy);
    if (length < 0.001) return { x: 1, y: 0 };
    return { x: dx / length, y: dy / length };
  }

  override destroy(): void {
    this.hideTelegraph();
    super.destroy();
  }
}
