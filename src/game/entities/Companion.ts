/**
 * Pookie - Mauseris Begleiter.
 *
 * Pookie ist kein Deko-NPC. Er folgt eigenstaendig, bleibt an interessanten
 * Stellen stehen, kommentiert unaufgefordert und gibt bei Raetseln Hinweise -
 * aber nie die Loesung. Die Kommentare kommen aus einem Vorrat, der nach
 * Situation gefiltert wird, damit er sich nicht sofort wiederholt.
 */

import Phaser from 'phaser';
import { TILE } from '@/core/constants';
import { bus } from '@/core/EventBus';
import type { CatLook } from '@/data/types';
import { Actor } from './Actor';
import { ensureCatTexture } from '../art/characterTextures';

/** Pookies Aussehen - grau-blau mit weisser Brust und rotem Halstuch. */
export const POOKIE_LOOK: CatLook = {
  fur: 0x8fa8c4,
  furDark: 0x63809e,
  belly: 0xf0f4fa,
  eye: 0x3a5a8a,
  pattern: 'patch',
  scale: 0.88,
  accessory: 'bandana',
  accessoryColor: 0x6fb85f,
};

/** Wie weit Pookie hinter Mauseri herlaeuft (Weltpixel). */
const FOLLOW_DISTANCE = TILE * 1.15;
const CATCHUP_DISTANCE = TILE * 4.5;
const TELEPORT_DISTANCE = TILE * 11;

export type PookieMood = 'normal' | 'nervous' | 'excited' | 'sad' | 'determined';

export class Companion extends Actor {
  /** Verlaufsspur der Spielerposition - Pookie laeuft dieser hinterher,
   *  statt direkt auf den Spieler zuzuhalten. Das sieht natuerlicher aus
   *  und laesst ihn nicht durch Waende schneiden. */
  private trail: { x: number; y: number }[] = [];
  private trailTimer = 0;

  mood: PookieMood = 'normal';
  /** Ist Pookie gerade in der Gruppe? In Kapitel 6 wird er getrennt. */
  present = true;

  /** Kommentare, die bereits gesagt wurden - verhindert Wiederholung. */
  private saidRecently = new Set<string>();
  private commentCooldownMs = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const key = ensureCatTexture(scene.textures, POOKIE_LOOK);
    super(scene, { textureKey: key, x, y, bodyWidth: 12, bodyHeight: 10, maxHp: 1 });
    this.sprite.setName('pookie');
    // Pookie soll den Spieler nicht wegschieben und nicht an Gegnern haengen
    // bleiben - er ist erzaehlerisch anwesend, nicht physisch im Weg.
    this.body.setImmovable(false);
    this.sprite.setDepth(9);
  }

  /** Folgt dem Spieler mit Verzoegerung. */
  follow(playerX: number, playerY: number, delta: number, playerMoving: boolean): void {
    if (!this.present) return;

    // Spur mitschreiben
    this.trailTimer += delta;
    if (this.trailTimer > 55 && playerMoving) {
      this.trailTimer = 0;
      this.trail.push({ x: playerX, y: playerY });
      if (this.trail.length > 40) this.trail.shift();
    }

    const distance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);

    // Zu weit weg (z. B. nach einem Kartenwechsel): direkt nachziehen.
    if (distance > TELEPORT_DISTANCE) {
      this.warpTo(playerX, playerY);
      return;
    }

    // Ziel: der aelteste Punkt der Spur, der weit genug entfernt ist.
    let target: { x: number; y: number } | null = null;
    while (this.trail.length > 0) {
      const point = this.trail[0]!;
      if (Phaser.Math.Distance.Between(point.x, point.y, playerX, playerY) > FOLLOW_DISTANCE) {
        target = point;
        break;
      }
      this.trail.shift();
    }

    if (!target || distance < FOLLOW_DISTANCE) {
      this.body.setVelocity(0, 0);
      // Im Stand zum Spieler schauen
      this.faceVector(playerX - this.x, playerY - this.y);
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const length = Math.hypot(dx, dy);
    if (length < 3) {
      this.trail.shift();
      this.body.setVelocity(0, 0);
      return;
    }

    // Aufholen, wenn Pookie zurueckfaellt.
    const speed = distance > CATCHUP_DISTANCE ? 155 : 105;
    this.body.setVelocity((dx / length) * speed, (dy / length) * speed);
    this.faceVector(dx, dy);
  }

  warpTo(x: number, y: number): void {
    // Etwas versetzt platzieren, damit er nicht im Spieler steckt.
    this.sprite.setPosition(x - 14, y + 8);
    this.body.reset(x - 14, y + 8);
    this.trail = [];
  }

  setPresent(present: boolean): void {
    this.present = present;
    this.sprite.setVisible(present);
    this.body.enable = present;
    if (!present) this.body.setVelocity(0, 0);
  }

  /**
   * Laesst Pookie etwas sagen - als kurze Sprechblase, nicht als Dialogfenster.
   * Ein Kommentar wird pro Schluessel nur einmal je Spielabschnitt gezeigt.
   */
  say(key: string, text: string, options: { once?: boolean; force?: boolean } = {}): boolean {
    if (!this.present) return false;
    if (!options.force && this.commentCooldownMs > 0) return false;
    if (options.once !== false && this.saidRecently.has(key)) return false;

    this.saidRecently.add(key);
    this.commentCooldownMs = 3200;
    this.showBubble(text);
    return true;
  }

  /** Vergisst gesagte Kommentare - z. B. beim Betreten einer neuen Region. */
  forgetComments(): void {
    this.saidRecently.clear();
    this.commentCooldownMs = 0;
    // Eine offene Sprechblase gehoert zur alten Karte und darf nicht
    // mitwandern - sonst kommentiert Pookie in Miauport ein Raetsel aus
    // Kratzfels.
    this.clearBubble();
  }

  /** Entfernt eine sichtbare Sprechblase sofort - samt ihrem Folge-Timer. */
  clearBubble(): void {
    this.bubbleFollow?.remove();
    this.bubbleFollow = null;
    this.bubble?.destroy();
    this.bubble = null;
  }

  private bubble: Phaser.GameObjects.Container | null = null;
  private bubbleFollow: Phaser.Time.TimerEvent | null = null;

  private showBubble(text: string): void {
    this.clearBubble();

    const padding = 6;
    const label = this.scene.add.text(0, 0, text, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#241a3d',
      align: 'center',
      wordWrap: { width: 150 },
      resolution: 3,
    });
    label.setOrigin(0.5, 0.5);

    const width = label.width + padding * 2;
    const height = label.height + padding * 2;

    const background = this.scene.add.graphics();
    background.fillStyle(0xfff4dc, 0.96);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
    background.lineStyle(1, 0x3a2c60, 0.5);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
    background.fillTriangle(-4, height / 2 - 1, 4, height / 2 - 1, 0, height / 2 + 5);

    const container = this.scene.add.container(this.x, this.y - 26, [background, label]);
    container.setDepth(4000);
    container.setAlpha(0);
    this.bubble = container;

    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      y: this.y - 30,
      duration: 160,
      ease: 'Back.easeOut',
    });

    // Sprechblase folgt Pookie und bleibt dabei im Bild: steht er am
    // Kartenrand, wuerde die Blase sonst halb abgeschnitten.
    const followEvent = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        const view = this.scene.cameras.main.worldView;
        const halbeBreite = width / 2 + 4;
        const x = Phaser.Math.Clamp(this.x, view.x + halbeBreite, view.right - halbeBreite);
        const y = Math.max(this.y - 30, view.y + height / 2 + 4);
        container.setPosition(x, y);
      },
    });
    this.bubbleFollow = followEvent;

    this.scene.time.delayedCall(2600 + text.length * 22, () => {
      // Die Blase kann inzwischen durch einen Kartenwechsel entfernt worden
      // sein - dann gehoert dieser Timer zu einer anderen Blase.
      if (this.bubble !== container) return;
      followEvent.remove();
      this.bubbleFollow = null;
      this.bubble = null;
      this.scene.tweens.add({
        targets: container,
        alpha: 0,
        y: container.y - 8,
        duration: 220,
        onComplete: () => container.destroy(),
      });
    });
  }

  override update(delta: number): void {
    super.update(delta);
    if (this.commentCooldownMs > 0) this.commentCooldownMs -= delta;

    // Pookie schaut sich um, wenn er steht - kleine Lebendigkeit.
    if (this.present && Math.hypot(this.body.velocity.x, this.body.velocity.y) < 5) {
      this.idleTimer -= delta;
      if (this.idleTimer <= 0) {
        this.idleTimer = 1800 + Math.random() * 2600;
        const dirs = ['down', 'left', 'right'] as const;
        this.facing = dirs[Math.floor(Math.random() * dirs.length)]!;
      }
    }
  }

  private idleTimer = 2000;

  override destroy(): void {
    this.clearBubble();
    super.destroy();
  }
}

/** Bequemer Zugriff fuer Skripte und Systeme. */
export function pookieToast(text: string): void {
  bus.emit('toast', { text, kind: 'info' });
}
