/**
 * Skript-Abspieler fuer Zwischensequenzen.
 *
 * Skripte sind Datenlisten (ScriptStep[]). Der Abspieler arbeitet sie der Reihe
 * nach ab und wartet, wo gewartet werden muss. Waehrenddessen ist die Steuerung
 * gesperrt und die Touch-Bedienelemente werden ausgeblendet.
 *
 * Warum kein Zustandsautomat pro Szene: Story-Momente aendern sich beim
 * Schreiben staendig. Als Daten laesst sich eine Szene umstellen, ohne dass
 * Spiellogik angefasst wird - genau das war die Vorgabe.
 */

import { bus } from '@/core/EventBus';
import { applyEffects } from '@/state/gameState';
import { SCRIPTS } from '@/data/scripts';
import type { AreaId, Direction, MusicTrackId, ScriptStep } from '@/data/types';
import { audio, type SfxName } from './AudioSystem';

/** Was der Abspieler von der Spielszene braucht. */
export interface ScriptHost {
  moveActor(who: string, toX: number, toY: number, speed: number): Promise<void>;
  faceActor(who: string, dir: Direction): void;
  spawnNpc(npcId: string, tx: number, ty: number, as?: string): void;
  despawnActor(who: string): void;
  panCamera(x: number | undefined, y: number | undefined, follow: string | undefined, ms: number): Promise<void>;
  fadeScreen(to: 'black' | 'clear', ms: number): Promise<void>;
  warpTo(area: AreaId, tx: number, ty: number): Promise<void>;
  spawnBoss(bossId: string, tx: number, ty: number): void;
  startDialogue(nodeId: string): Promise<void>;
  setControlsLocked(locked: boolean): void;
  wait(ms: number): Promise<void>;
}

export class ScriptRunner {
  private running = false;
  private cancelled = false;

  constructor(private host: ScriptHost) {}

  get isRunning(): boolean {
    return this.running;
  }

  /** Spielt ein Skript ab. Mehrfachaufrufe werden ignoriert, solange eines laeuft. */
  async play(scriptId: string): Promise<void> {
    if (this.running) {
      console.warn(`[Skript] "${scriptId}" uebersprungen - es laeuft bereits eine Sequenz.`);
      return;
    }
    const script = SCRIPTS[scriptId];
    if (!script) {
      console.warn(`[Skript] Unbekanntes Skript "${scriptId}".`);
      return;
    }

    this.running = true;
    this.cancelled = false;

    const isCutscene = script.cutscene ?? true;
    if (isCutscene) {
      this.host.setControlsLocked(true);
      bus.emit('cutscene:start');
    }

    try {
      for (const step of script.steps) {
        if (this.cancelled) break;
        await this.runStep(step);
      }
    } catch (err) {
      console.error(`[Skript] Fehler in "${scriptId}":`, err);
    } finally {
      if (isCutscene) {
        this.host.setControlsLocked(false);
        bus.emit('cutscene:end');
      }
      this.running = false;
    }
  }

  cancel(): void {
    this.cancelled = true;
  }

  private async runStep(step: ScriptStep): Promise<void> {
    switch (step.do) {
      case 'dialogue':
        await this.host.startDialogue(step.node);
        break;

      case 'wait':
        await this.host.wait(step.ms);
        break;

      case 'move':
        await this.host.moveActor(step.who, step.toX, step.toY, step.speed ?? 80);
        break;

      case 'face':
        this.host.faceActor(step.who, step.dir);
        break;

      case 'spawn':
        this.host.spawnNpc(step.npc, step.x, step.y, step.as);
        break;

      case 'despawn':
        this.host.despawnActor(step.who);
        break;

      case 'camera':
        await this.host.panCamera(step.toX, step.toY, step.follow, step.ms ?? 800);
        break;

      case 'shake':
        bus.emit('screen:shake', { duration: step.ms, intensity: step.intensity ?? 0.006 });
        await this.host.wait(step.ms);
        break;

      case 'flash':
        bus.emit('screen:flash', { color: step.color ?? 0xffffff, duration: step.ms ?? 220 });
        await this.host.wait(step.ms ?? 220);
        break;

      case 'fade':
        await this.host.fadeScreen(step.to, step.ms ?? 500);
        break;

      case 'music':
        audio.playMusic(step.track === 'stop' ? null : (step.track as MusicTrackId));
        break;

      case 'sfx':
        audio.play(step.sound as SfxName);
        break;

      case 'effects':
        applyEffects(step.effects);
        break;

      case 'warp':
        await this.host.warpTo(step.to, step.x, step.y);
        break;

      case 'boss':
        this.host.spawnBoss(step.boss, step.x, step.y);
        break;

      case 'credits':
        bus.emit('credits:show', { ending: step.ending });
        break;
    }
  }
}
