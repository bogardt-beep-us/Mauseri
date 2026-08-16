/**
 * Mauseri - die Spielfigur.
 *
 * Die Lebens- und Energiewerte liegen im zentralen Spielzustand (gameState),
 * nicht im Actor: sie muessen Kartenwechsel und Speichern ueberleben. Der
 * Actor spiegelt sie nur fuer die Trefferlogik.
 */

import Phaser from 'phaser';
import {
  ATTACK_COOLDOWN_MS,
  BLOCK_DAMAGE_REDUCTION,
  DODGE_COOLDOWN_MS,
  DODGE_DURATION_MS,
  DODGE_SPEED,
  ENERGY_REGEN_PER_SECOND,
  INVULNERABLE_AFTER_HIT_MS,
  PLAYER_BODY_HEIGHT,
  PLAYER_BODY_WIDTH,
  PLAYER_SPEED,
} from '@/core/constants';
import { gameState } from '@/state/gameState';
import { audio } from '../systems/AudioSystem';
import { ABILITIES } from '@/data/abilities';
import type { AbilityId, CatLook, Direction } from '@/data/types';
import { Actor } from './Actor';
import { ensureCatTexture } from '../art/characterTextures';

/** Mauseris Aussehen - warmes Orange mit heller Brust. */
export const MAUSERI_LOOK: CatLook = {
  fur: 0xf0b45e,
  furDark: 0xc9863a,
  belly: 0xfff0d2,
  eye: 0x2e5e3a,
  pattern: 'stripes',
  accessory: 'scarf',
  accessoryColor: 0xc75f4a,
};

export interface AbilityRuntime {
  cooldownMs: number;
}

export class Player extends Actor {
  /** Restliche Zeit des Ausweichmanoevers. */
  private dodgeMs = 0;
  private dodgeCooldownMs = 0;
  private attackCooldownMs = 0;
  /** Richtung, in die ausgewichen wird. */
  private dodgeDir = { x: 0, y: 0 };

  /** Zeitgeber je Faehigkeit. */
  readonly abilityCooldowns: Record<string, number> = {};

  /** Aktiver Geschwindigkeitsschub (Katzenflink). */
  private hasteMs = 0;
  /** Aktiver Schattenlauf (Schattenpfote). */
  shadowWalkMs = 0;
  /** Verstaerkter naechster Angriff (Mondkralle). */
  private empoweredAttacks = 0;

  /** Geschwindigkeitsfaktor der Kachel, auf der die Figur steht. */
  tileSpeedFactor = 1;

  blocking = false;
  /** Zeitpunkt des letzten Schrittgeraeuschs. */
  private stepTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const key = ensureCatTexture(scene.textures, MAUSERI_LOOK);
    super(scene, {
      textureKey: key,
      x,
      y,
      bodyWidth: PLAYER_BODY_WIDTH,
      bodyHeight: PLAYER_BODY_HEIGHT,
      maxHp: gameState.state.maxHp,
    });
    this.hp = gameState.state.hp;
    this.facing = gameState.state.facing;
    this.sprite.setName('player');
  }

  get isDodging(): boolean {
    return this.dodgeMs > 0;
  }

  get isHasted(): boolean {
    return this.hasteMs > 0;
  }

  get isShadowWalking(): boolean {
    return this.shadowWalkMs > 0;
  }

  /** Bewegt die Figur anhand des Eingabevektors. */
  move(dx: number, dy: number, blocking: boolean): void {
    if (!this.isAlive) return;
    this.blocking = blocking;

    if (this.dodgeMs > 0) {
      this.body.setVelocity(this.dodgeDir.x * DODGE_SPEED, this.dodgeDir.y * DODGE_SPEED);
      return;
    }
    if (this.knockbackMs > 0) return;

    let speed = PLAYER_SPEED * this.tileSpeedFactor;
    if (blocking) speed *= 0.42;
    if (this.hasteMs > 0) speed *= 1.55;
    if (this.state === 'attack') speed *= 0.35;

    const length = Math.hypot(dx, dy);
    if (length > 0.05) {
      const nx = dx / Math.max(1, length);
      const ny = dy / Math.max(1, length);
      this.body.setVelocity(nx * speed, ny * speed);
      if (this.state !== 'attack') this.faceVector(dx, dy);
    } else {
      this.body.setVelocity(0, 0);
    }
  }

  /** Loest einen Nahkampfangriff aus. Gibt die Trefferzone zurueck. */
  tryAttack(): { x: number; y: number; radius: number; damage: number; empowered: boolean } | null {
    if (!this.isAlive || this.attackCooldownMs > 0 || this.dodgeMs > 0) return null;

    this.attackCooldownMs = ATTACK_COOLDOWN_MS;
    this.playAttack(ATTACK_COOLDOWN_MS * 0.7);
    audio.play('attack');

    const reach = 20;
    const offset = this.directionVector(this.facing);
    const empowered = this.empoweredAttacks > 0;
    if (empowered) this.empoweredAttacks--;

    const base = gameState.state.attack;
    return {
      x: this.x + offset.x * reach,
      y: this.y + offset.y * reach + 4,
      radius: empowered ? 24 : 17,
      damage: empowered ? Math.round(base * 2.4) : base,
      empowered,
    };
  }

  tryDodge(): boolean {
    if (!this.isAlive || this.dodgeCooldownMs > 0 || this.dodgeMs > 0) return false;

    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;
    const length = Math.hypot(vx, vy);
    if (length > 5) {
      this.dodgeDir = { x: vx / length, y: vy / length };
    } else {
      const dir = this.directionVector(this.facing);
      this.dodgeDir = dir;
    }

    this.dodgeMs = DODGE_DURATION_MS;
    this.dodgeCooldownMs = DODGE_COOLDOWN_MS;
    // Waehrend des Ausweichens unverwundbar - das ist der Kern des Kampfsystems.
    this.invulnerableMs = Math.max(this.invulnerableMs, DODGE_DURATION_MS + 60);
    audio.play('dodge');
    return true;
  }

  /** Prueft, ob eine Faehigkeit einsatzbereit ist. */
  canUseAbility(id: AbilityId): boolean {
    if (!gameState.hasAbility(id)) return false;
    if ((this.abilityCooldowns[id] ?? 0) > 0) return false;
    return gameState.state.energy >= ABILITIES[id].energyCost;
  }

  /** Setzt eine Faehigkeit ein. Die Weltwirkung uebernimmt die Szene. */
  useAbility(id: AbilityId): boolean {
    if (!this.canUseAbility(id)) return false;
    const def = ABILITIES[id];
    if (!gameState.spendEnergy(def.energyCost)) return false;
    this.abilityCooldowns[id] = def.cooldownMs;

    switch (id) {
      case 'katzenflink':
        this.hasteMs = 4200;
        break;
      case 'schattenpfote':
        this.shadowWalkMs = 5000;
        break;
      case 'mondkralle':
        this.empoweredAttacks = 3;
        break;
      case 'kratzsprung':
      case 'schnurrimpuls':
        // Wirkung liegt in der Welt (Sprung bzw. Aufdecken) - siehe WorldScene.
        break;
    }

    audio.play('ability');
    return true;
  }

  /** Nimmt Schaden - beruecksichtigt Blocken und schreibt in den Spielstand. */
  override takeDamage(amount: number, fromX?: number, fromY?: number, knockback = 150): boolean {
    if (!this.isAlive || this.invulnerableMs > 0 || this.dodgeMs > 0) return false;

    let final = amount;
    if (this.blocking) {
      final = Math.max(1, Math.round(amount * (1 - BLOCK_DAMAGE_REDUCTION)));
      audio.play('block');
    } else {
      audio.play('hurt');
    }

    const dealt = gameState.damage(final);
    this.hp = gameState.state.hp;
    this.maxHp = gameState.state.maxHp;
    this.playHurt();
    this.invulnerableMs = INVULNERABLE_AFTER_HIT_MS;

    if (fromX !== undefined && fromY !== undefined && knockback > 0) {
      const angle = Math.atan2(this.y - fromY, this.x - fromX);
      const force = this.blocking ? knockback * 0.4 : knockback;
      this.body.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force);
      this.knockbackMs = 160;
    }

    if (this.hp <= 0) this.die();
    void dealt;
    return true;
  }

  override update(delta: number): void {
    super.update(delta);

    if (this.dodgeMs > 0) this.dodgeMs -= delta;
    if (this.dodgeCooldownMs > 0) this.dodgeCooldownMs -= delta;
    if (this.attackCooldownMs > 0) this.attackCooldownMs -= delta;
    if (this.hasteMs > 0) this.hasteMs -= delta;
    if (this.shadowWalkMs > 0) this.shadowWalkMs -= delta;

    for (const key of Object.keys(this.abilityCooldowns)) {
      if (this.abilityCooldowns[key]! > 0) this.abilityCooldowns[key]! -= delta;
    }

    // Energie regeneriert langsam; im Block schneller, damit Verteidigung
    // sich lohnt statt nur Zeit zu kosten.
    const regen = (ENERGY_REGEN_PER_SECOND * (this.blocking ? 1.8 : 1) * delta) / 1000;
    if (gameState.state.energy < gameState.state.maxEnergy) {
      gameState.restoreEnergy(regen);
    }

    // Schrittgeraeusche
    const speed = Math.hypot(this.body.velocity.x, this.body.velocity.y);
    if (speed > 20) {
      this.stepTimer -= delta;
      if (this.stepTimer <= 0) {
        audio.play('step');
        this.stepTimer = 300 / (speed / PLAYER_SPEED);
      }
    } else {
      this.stepTimer = 0;
    }

    // Schattenlauf sichtbar machen
    if (this.shadowWalkMs > 0) {
      this.sprite.setAlpha(0.6);
    }

    this.hp = gameState.state.hp;
    this.maxHp = gameState.state.maxHp;
  }

  /** Einheitsvektor einer Blickrichtung. */
  directionVector(dir: Direction): { x: number; y: number } {
    switch (dir) {
      case 'up':
        return { x: 0, y: -1 };
      case 'down':
        return { x: 0, y: 1 };
      case 'left':
        return { x: -1, y: 0 };
      case 'right':
        return { x: 1, y: 0 };
    }
  }

  /** Setzt die Figur nach einem Kartenwechsel neu. */
  placeAt(x: number, y: number, facing?: Direction): void {
    this.sprite.setPosition(x, y);
    this.body.reset(x, y);
    if (facing) this.facing = facing;
    this.dodgeMs = 0;
    this.knockbackMs = 0;
  }

  /** Wiederbelebung nach dem Tod. */
  revive(hpFraction = 0.5): void {
    gameState.update((d) => {
      d.hp = Math.max(1, Math.round(d.maxHp * hpFraction));
    });
    this.hp = gameState.state.hp;
    this.state = 'idle';
    this.body.enable = true;
    this.invulnerableMs = 1200;
    this.sprite.clearTint();
    this.sprite.setAlpha(1);
  }
}
