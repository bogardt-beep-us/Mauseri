/**
 * Die Spielwelt.
 *
 * Diese Szene haelt die Karte, alle Figuren und die Regeln, nach denen sie
 * miteinander umgehen. Sie ist bewusst der einzige Ort, an dem Welt, Kampf,
 * Raetsel und Story zusammenlaufen - die einzelnen Regeln selbst liegen in
 * den Systemen und Datendateien.
 */

import Phaser from 'phaser';
import {
  AUTOSAVE_INTERVAL_MS,
  DEPTH,
  INTERACT_RANGE,
  MAX_CAMERA_ZOOM,
  MIN_CAMERA_ZOOM,
  MIN_VISIBLE_TILES_X,
  MIN_VISIBLE_TILES_Y,
  TILE,
} from '@/core/constants';
import { bus, type HudSnapshot } from '@/core/EventBus';
import { applyEffects, gameState, setWorldEffectHandler } from '@/state/gameState';
import { ABILITIES } from '@/data/abilities';
import { AREAS } from '@/data/areas';
import { BOSSES } from '@/data/bosses';
import { ENEMIES } from '@/data/enemies';
import { getItem, ITEMS } from '@/data/items';
import { NPCS } from '@/data/npcs';
import { getPuzzle } from '@/data/puzzles';
import { QUESTS } from '@/data/quests';
import { REGIONS } from '@/data/regions';
import { TILES } from '@/data/tiles';
import type {
  AbilityId,
  AreaDef,
  AreaId,
  Direction,
  MapObject,
  ObjBoss,
  ObjChest,
  ObjEnemy,
  ObjNpc,
  ObjPortal,
  ObjPickup,
  ObjTrigger,
} from '@/data/types';

import { BossActor, type BossAction } from '../entities/BossActor';
import { Companion } from '../entities/Companion';
import { EnemyActor } from '../entities/EnemyActor';
import { NpcActor } from '../entities/NpcActor';
import { Player } from '../entities/Player';
import { audio } from '../systems/AudioSystem';
import { DialogueSystem, resolveNpcDialogue } from '../systems/DialogueSystem';
import { InputSystem } from '../systems/InputSystem';
import { PuzzleSystem } from '../systems/PuzzleSystem';
import { ScriptRunner, type ScriptHost } from '../systems/ScriptRunner';
import { buildMap, hasLineOfSight, tileToWorld, worldToTile, type BuiltMap } from '../world/mapBuilder';
import { ensureItemIcon, type ItemIconId } from '../art/objectTextures';

/** Ein Weltobjekt mit seinem Sprite und seinen Daten. */
interface WorldObject {
  def: MapObject;
  sprite: Phaser.GameObjects.Sprite;
  /** Physikkoerper fuer feste Objekte (Bloecke, geschlossene Tore). */
  body?: Phaser.Physics.Arcade.Sprite;
  id: string;
}

interface Projectile {
  sprite: Phaser.Physics.Arcade.Sprite;
  damage: number;
  lifetimeMs: number;
  /** Vom Spieler oder vom Gegner abgefeuert? */
  hostile: boolean;
}

interface Hazard {
  sprite: Phaser.GameObjects.Sprite;
  damage: number;
  lifetimeMs: number;
  cooldownMs: number;
}

export class WorldScene extends Phaser.Scene implements ScriptHost {
  // --- Kernobjekte ---------------------------------------------------------
  private player!: Player;
  private pookie!: Companion;
  private inputSystem!: InputSystem;
  private dialogue = new DialogueSystem();
  private puzzles = new PuzzleSystem();
  private scripts!: ScriptRunner;

  // --- Aktuelle Karte ------------------------------------------------------
  private area!: AreaDef;
  private built!: BuiltMap;
  private npcs: NpcActor[] = [];
  private enemies: EnemyActor[] = [];
  private boss: BossActor | null = null;
  private objects: WorldObject[] = [];
  private projectiles: Projectile[] = [];
  private hazards: Hazard[] = [];

  private solidGroup!: Phaser.Physics.Arcade.StaticGroup;
  private blockGroup!: Phaser.Physics.Arcade.Group;

  // --- Zustand -------------------------------------------------------------
  private autosaveTimer = 0;
  private hudTimer = 0;
  private shadowWalkActive = false;
  private transitioning = false;
  private ambientOverlay: Phaser.GameObjects.Rectangle | null = null;
  private backdrop!: Phaser.GameObjects.TileSprite;
  private beamGraphics: Phaser.GameObjects.Graphics | null = null;

  /** Merkt sich, welche Trigger auf dieser Karte schon gelaufen sind. */
  private firedThisVisit = new Set<string>();

  constructor() {
    super({ key: 'World' });
  }

  // =========================================================================
  // Aufbau
  // =========================================================================

  create(): void {
    this.scripts = new ScriptRunner(this);
    this.inputSystem = new InputSystem(this);

    this.solidGroup = this.physics.add.staticGroup();
    this.blockGroup = this.physics.add.group();

    const save = gameState.state;
    const start = tileToWorld(save.x, save.y);

    this.player = new Player(this, start.x, start.y);
    this.pookie = new Companion(this, start.x - 16, start.y + 10);

    // Hintergrund hinter der Welt - fuellt den Rand, wenn eine Karte kleiner
    // ist als das Sichtfeld (auf Handys im Hochformat der Normalfall).
    this.backdrop = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'bg:nacht');
    this.backdrop.setOrigin(0, 0);
    this.backdrop.setScrollFactor(0);
    this.backdrop.setDepth(-100);

    this.beamGraphics = this.add.graphics();
    this.beamGraphics.setDepth(DEPTH.entities + 900);

    setWorldEffectHandler({
      warp: (to, x, y) => void this.warpTo(to, x, y),
      playScript: (id) => void this.scripts.play(id),
    });

    this.registerBusHandlers();
    this.setupCamera();

    void this.loadArea(save.area, save.x, save.y, save.facing, { initial: true });

    bus.emit('game:ready');

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
  }

  private registerBusHandlers(): void {
    this.events.on('destroy', () => this.cleanup());

    bus.on('screen:shake', ({ duration, intensity }) => {
      this.cameras.main.shake(duration, intensity);
    });
    bus.on('screen:flash', ({ color, duration }) => {
      const r = (color >> 16) & 0xff;
      const g = (color >> 8) & 0xff;
      const b = color & 0xff;
      this.cameras.main.flash(duration, r, g, b);
    });
    bus.on('ui:openMenu', (menu) => {
      // Waehrend ein Menue offen ist, laeuft die Welt weiter, aber die Figur
      // bewegt sich nicht - so bleibt der Uebergang fluessig.
      this.inputSystem.setLocked(menu !== null || this.dialogue.isActive);
    });
  }

  private setupCamera(): void {
    const camera = this.cameras.main;
    camera.startFollow(this.player.sprite, true, 0.12, 0.12);
    camera.setRoundPixels(true);
    this.applyZoom();
    this.scale.on(Phaser.Scale.Events.RESIZE, () => this.applyZoom());
  }

  /**
   * Waehlt den Kamerazoom so, dass immer mindestens die gewuenschte Anzahl
   * Kacheln sichtbar ist - in Hoch- und Querformat. Damit ist das Spiel in
   * beiden Orientierungen spielbar, ohne den Spieler zum Drehen zu zwingen.
   */
  private applyZoom(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    if (width === 0 || height === 0) return;

    const zoomX = width / (MIN_VISIBLE_TILES_X * TILE);
    const zoomY = height / (MIN_VISIBLE_TILES_Y * TILE);
    const zoom = Phaser.Math.Clamp(Math.min(zoomX, zoomY), MIN_CAMERA_ZOOM, MAX_CAMERA_ZOOM);
    this.cameras.main.setZoom(zoom);

    // Der Hintergrund haengt an der Kamera und wird deshalb mitskaliert -
    // seine Groesse muss durch den Zoom geteilt werden, damit er den Bildschirm
    // weiterhin genau ausfuellt.
    if (this.backdrop) {
      this.backdrop.setSize(width / zoom + 2, height / zoom + 2);
    }

    this.applyCameraBounds();
  }

  /**
   * Setzt die Kameragrenzen.
   *
   * Ist eine Karte kleiner als das Sichtfeld - auf einem hochkant gehaltenen
   * Handy passiert das bei jedem Innenraum -, wuerde die Kamera die Karte an
   * den oberen linken Rand klemmen. Deshalb werden die Grenzen in diesem Fall
   * so aufgeweitet, dass die Karte mittig im Bild steht.
   */
  private applyCameraBounds(): void {
    if (!this.built) return;

    const camera = this.cameras.main;
    const worldWidth = this.built.widthInTiles * TILE;
    const worldHeight = this.built.heightInTiles * TILE;

    const viewWidth = this.scale.width / camera.zoom;
    const viewHeight = this.scale.height / camera.zoom;

    const boundsWidth = Math.max(worldWidth, viewWidth);
    const boundsHeight = Math.max(worldHeight, viewHeight);

    camera.setBounds(
      (worldWidth - boundsWidth) / 2,
      (worldHeight - boundsHeight) / 2,
      boundsWidth,
      boundsHeight,
    );
  }

  // =========================================================================
  // Kartenwechsel
  // =========================================================================

  async loadArea(
    areaId: AreaId,
    tx: number,
    ty: number,
    facing: Direction = 'down',
    options: { initial?: boolean } = {},
  ): Promise<void> {
    const area = AREAS[areaId];
    if (!area) {
      console.error(`[World] Unbekannte Karte "${areaId}".`);
      return;
    }

    this.clearArea();
    this.area = area;
    this.firedThisVisit.clear();

    this.built = buildMap(this, area);
    this.physics.world.setBounds(0, 0, this.built.widthInTiles * TILE, this.built.heightInTiles * TILE);
    this.applyCameraBounds();

    // Kollision mit dem Gelaende
    this.physics.add.collider(this.player.sprite, this.built.baseLayer);
    this.physics.add.collider(this.player.sprite, this.built.overLayer);
    this.physics.add.collider(this.pookie.sprite, this.built.baseLayer);
    this.physics.add.collider(this.pookie.sprite, this.built.overLayer);

    this.spawnObjects(area);
    this.applyAmbient(area);

    // Figur setzen
    const position = tileToWorld(tx, ty);
    this.player.placeAt(position.x, position.y, facing);
    this.pookie.warpTo(position.x, position.y);
    this.pookie.forgetComments();

    // Ob Pookie dabei ist, steht im Spielstand - sonst waere er nach dem
    // Laden eines Spielstands aus den Schattenlanden wieder da, obwohl ihn
    // der Nebel geholt hat.
    this.pookie.setPresent(
      !gameState.flag('pookie_getrennt') || gameState.flag('pookie_zurueck'),
    );
    // Ein Portal auf dem Ankunftsfeld darf nicht sofort wieder ausloesen.
    this.ankunftsFeld = { tx, ty };

    gameState.setPosition(areaId, tx, ty, facing);
    gameState.visitArea(areaId);
    gameState.discoverRegion(area.region);

    const region = REGIONS[area.region];
    audio.playMusic(area.music ?? region.music);

    bus.emit('scene:transition', {
      areaId,
      areaName: area.name,
      regionName: region.name,
    });

    if (!options.initial) {
      this.cameras.main.fadeIn(320, 0, 0, 0);
    }

    this.emitHud();
    this.checkTriggers(true);
  }

  private clearArea(): void {
    for (const npc of this.npcs) npc.destroy();
    for (const enemy of this.enemies) enemy.destroy();
    for (const object of this.objects) {
      object.sprite.destroy();
      object.body?.destroy();
    }
    for (const projectile of this.projectiles) projectile.sprite.destroy();
    for (const hazard of this.hazards) hazard.sprite.destroy();

    this.boss?.destroy();
    this.boss = null;
    this.npcs = [];
    this.enemies = [];
    this.objects = [];
    this.projectiles = [];
    this.hazards = [];

    this.solidGroup.clear(true, true);
    this.blockGroup.clear(true, true);
    this.puzzles.reset();

    this.ambientOverlay?.destroy();
    this.ambientOverlay = null;

    // Alte Karte und alle Kollisionspruefungen entfernen. Tilemap.destroy()
    // raeumt die zugehoerigen Ebenen mit auf, deshalb hier nur die Maps.
    this.built?.map.destroy();
    this.built?.overMap.destroy();
    this.physics.world.colliders.destroy();
  }

  private applyAmbient(area: AreaDef): void {
    const region = REGIONS[area.region];
    const alpha = area.ambientAlpha ?? region.palette.ambientAlpha;
    if (alpha <= 0) return;

    const width = this.built.widthInTiles * TILE;
    const height = this.built.heightInTiles * TILE;
    this.ambientOverlay = this.add.rectangle(width / 2, height / 2, width, height, region.palette.ambient, alpha);
    this.ambientOverlay.setDepth(DEPTH.overhang + 100);
    this.ambientOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  // =========================================================================
  // Objekte
  // =========================================================================

  private spawnObjects(area: AreaDef): void {
    this.wartendeObjekte = [];
    for (const def of area.objects) {
      if (!gameState.check(def.showIf)) {
        // Noch nicht sichtbar - aber die Bedingung kann waehrend des
        // Aufenthalts wahr werden (Raetsel geloest, Boss besiegt). Deshalb
        // vormerken statt vergessen.
        this.wartendeObjekte.push(def);
        continue;
      }
      this.spawnObject(area, def);
    }

    // Kollision zwischen Figuren und festen Objekten
    this.physics.add.collider(this.player.sprite, this.solidGroup);
    this.physics.add.collider(this.pookie.sprite, this.solidGroup);
    this.physics.add.collider(this.player.sprite, this.blockGroup, (_p, blockSprite) =>
      this.pushBlock(blockSprite as Phaser.Physics.Arcade.Sprite),
    );
    this.physics.add.collider(this.blockGroup, this.built.baseLayer);
    this.physics.add.collider(this.blockGroup, this.solidGroup);
  }

  private spawnObject(area: AreaDef, def: MapObject): void {
    const { x: wx, y: wy } = tileToWorld(def.x, def.y);
    const objectId = def.id ?? `${area.id}:${def.type}:${def.x},${def.y}`;

    switch (def.type) {
      case 'npc': {
        const npcDef = NPCS[(def as ObjNpc).npc];
        if (!npcDef) {
          console.warn(`[World] Unbekannter NPC "${(def as ObjNpc).npc}".`);
          return;
        }
        const npc = new NpcActor(this, npcDef, wx, wy, {
          wander: (def as ObjNpc).wander,
          facing: (def as ObjNpc).facing,
        });
        this.npcs.push(npc);
        this.solidGroup.add(npc.sprite);
        this.updateNpcHint(npc);
        break;
      }

      case 'enemy': {
        const enemyObj = def as ObjEnemy;
        const enemyDef = ENEMIES[enemyObj.enemy];
        if (!enemyDef) {
          console.warn(`[World] Unbekannter Gegner "${enemyObj.enemy}".`);
          return;
        }
        // Dauerhaft besiegte Gegner bleiben weg.
        if (enemyObj.permanent && gameState.isSlain(objectId)) return;

        const enemy = new EnemyActor(this, enemyDef, wx, wy, {
          instanceId: objectId,
          permanent: enemyObj.permanent,
          leash: enemyObj.leash,
        });
        this.enemies.push(enemy);
        break;
      }

      case 'boss': {
        const bossObj = def as ObjBoss;
        if (gameState.isBossDefeated(bossObj.boss)) return;
        // Bosse werden erst durch den Trigger geweckt, nicht beim Laden.
        this.pendingBoss = { def: bossObj, x: wx, y: wy };
        break;
      }

      case 'chest': {
        const chestObj = def as ObjChest;
        const opened = gameState.isCollected(chestObj.id);
        if (chestObj.hidden && !opened && !this.revealedSecrets.has(chestObj.id)) {
          // Versteckte Truhen erscheinen erst nach einem Schnurrimpuls.
          return;
        }
        const sprite = this.add.sprite(wx, wy, opened ? 'obj:chest:open' : 'obj:chest');
        sprite.setDepth(DEPTH.entities + wy / 1000);
        this.objects.push({ def, sprite, id: chestObj.id });
        this.addSolid(sprite);
        break;
      }

      case 'portal': {
        // Portale sind unsichtbar; die Kachel darunter (Tuer/Treppe) zeigt sie.
        const sprite = this.add.sprite(wx, wy, 'px');
        sprite.setVisible(false);
        this.objects.push({ def, sprite, id: objectId });
        break;
      }

      case 'trigger': {
        const sprite = this.add.sprite(wx, wy, 'px');
        sprite.setVisible(false);
        this.objects.push({ def, sprite, id: (def as ObjTrigger).id });
        break;
      }

      case 'sign': {
        const sprite = this.add.sprite(wx, wy, 'obj:sign');
        sprite.setDepth(DEPTH.entities + wy / 1000);
        this.objects.push({ def, sprite, id: objectId });
        this.addSolid(sprite);
        break;
      }

      case 'switch': {
        const solved = gameState.isPuzzleSolved(def.puzzle);
        const symbol = def.symbol;
        const key = symbol
          ? `obj:switch:${symbol}${solved ? ':on' : ''}`
          : `obj:switch${solved ? ':on' : ''}`;
        const sprite = this.add.sprite(wx, wy, key);
        sprite.setDepth(DEPTH.entities + wy / 1000);
        this.objects.push({ def, sprite, id: def.id });
        this.puzzles.register({
          id: def.id,
          puzzle: def.puzzle,
          kind: 'switch',
          active: solved,
          value: 0,
          symbol,
        });
        this.addSolid(sprite);
        break;
      }

      case 'plate': {
        const solved = gameState.isPuzzleSolved(def.puzzle);
        const sprite = this.add.sprite(wx, wy, solved ? 'obj:plate:on' : 'obj:plate');
        sprite.setDepth(DEPTH.groundDetail);
        this.objects.push({ def, sprite, id: def.id });
        this.puzzles.register({
          id: def.id,
          puzzle: def.puzzle,
          kind: 'plate',
          active: solved,
          value: 0,
          symbol: def.symbol,
        });
        break;
      }

      case 'block': {
        const sprite = this.physics.add.sprite(wx, wy, 'obj:block');
        sprite.setDepth(DEPTH.entities + wy / 1000);
        sprite.setImmovable(false);
        sprite.setDrag(2200);
        (sprite.body as Phaser.Physics.Arcade.Body).setSize(26, 20);
        (sprite.body as Phaser.Physics.Arcade.Body).setOffset(3, 9);
        this.blockGroup.add(sprite);
        this.objects.push({ def, sprite, body: sprite, id: def.id });
        break;
      }

      case 'gate': {
        const open = def.puzzle
          ? gameState.isPuzzleSolved(def.puzzle)
          : gameState.check(def.opensIf);
        const orientation = def.orientation ?? 'h';
        const key = `obj:gate:${orientation}${open ? ':open' : ''}`;
        const sprite = this.add.sprite(wx, wy, key);
        sprite.setDepth(DEPTH.entities + wy / 1000);
        const object: WorldObject = { def, sprite, id: def.id };
        this.objects.push(object);
        if (!open) {
          this.addSolid(sprite);
          if (def.puzzle) {
            this.puzzles.onSolved(def.puzzle, () => this.openGate(object));
          }
        }
        break;
      }

      case 'pickup': {
        if (gameState.isCollected(def.id)) return;
        if (def.hidden && !this.revealedSecrets.has(def.id)) return;
        const item = getItem(def.item);
        const key = ensureItemIcon(this.textures, (item?.icon ?? 'gem') as ItemIconId, item?.color ?? 0xffd98a);
        const sprite = this.add.sprite(wx, wy, key);
        sprite.setDepth(DEPTH.entities + wy / 1000);
        sprite.setScale(0.75);
        this.tweens.add({
          targets: sprite,
          y: wy - 4,
          duration: 1100,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        this.objects.push({ def, sprite, id: def.id });
        break;
      }

      case 'save': {
        const sprite = this.add.sprite(wx, wy, 'obj:save');
        sprite.setDepth(DEPTH.entities + wy / 1000);
        this.tweens.add({ targets: sprite, alpha: { from: 0.75, to: 1 }, duration: 1400, yoyo: true, repeat: -1 });
        this.objects.push({ def, sprite, id: objectId });
        break;
      }

      case 'torch': {
        const solved = def.puzzle ? gameState.isPuzzleSolved(def.puzzle) : false;
        const lit = solved || def.lit === true;
        const sprite = this.add.sprite(wx, wy, lit ? 'obj:torch:lit' : 'obj:torch');
        sprite.setDepth(DEPTH.entities + wy / 1000);
        this.objects.push({ def, sprite, id: def.id });
        if (def.puzzle) {
          this.puzzles.register({
            id: def.id,
            puzzle: def.puzzle,
            kind: 'torch',
            active: lit,
            value: 0,
          });
        }
        this.addSolid(sprite);
        break;
      }

      case 'mirror': {
        const sprite = this.add.sprite(wx, wy, `obj:mirror:${def.angle % 8}`);
        sprite.setDepth(DEPTH.entities + wy / 1000);
        this.objects.push({ def, sprite, id: def.id });
        this.puzzles.register({
          id: def.id,
          puzzle: def.puzzle,
          kind: 'mirror',
          active: false,
          value: def.angle % 8,
        });
        this.addSolid(sprite);
        break;
      }

      case 'valve': {
        const sprite = this.add.sprite(wx, wy, `obj:valve:${def.level % 4}`);
        sprite.setDepth(DEPTH.entities + wy / 1000);
        this.objects.push({ def, sprite, id: def.id });
        this.puzzles.register({
          id: def.id,
          puzzle: def.puzzle,
          kind: 'valve',
          active: false,
          value: def.level % 4,
        });
        this.addSolid(sprite);
        break;
      }

      case 'rune': {
        const solved = gameState.isPuzzleSolved(def.puzzle);
        const sprite = this.add.sprite(wx, wy, `obj:rune:${def.symbol}${solved ? ':on' : ''}`);
        sprite.setDepth(DEPTH.entities + wy / 1000);
        this.objects.push({ def, sprite, id: def.id });
        this.puzzles.register({
          id: def.id,
          puzzle: def.puzzle,
          kind: 'rune',
          active: solved,
          value: 0,
          symbol: def.symbol,
        });
        this.addSolid(sprite);
        break;
      }

      case 'decor': {
        const sprite = this.add.sprite(wx, wy, def.sprite);
        sprite.setDepth(def.overhang ? DEPTH.overhang : DEPTH.entities + wy / 1000);
        this.objects.push({ def, sprite, id: objectId });
        break;
      }
    }
  }

  private pendingBoss: { def: ObjBoss; x: number; y: number } | null = null;
  private revealedSecrets = new Set<string>();

  /** Objekte dieser Karte, deren Bedingung beim Laden noch nicht erfuellt war. */
  private wartendeObjekte: MapObject[] = [];

  /**
   * Prueft, ob wartende Objekte inzwischen erscheinen duerfen.
   *
   * Ohne das erschiene die Belohnungstruhe nach einem geloesten Raetsel erst
   * beim naechsten Betreten der Karte - und ein Boss, der an ein Raetsel auf
   * derselben Karte gebunden ist, ueberhaupt nicht. Fuer den Spieler sah das
   * so aus, als sei nichts passiert.
   */
  private refreshConditionalObjects(): void {
    if (this.wartendeObjekte.length === 0 || !this.area) return;

    const nochWartend: MapObject[] = [];
    for (const def of this.wartendeObjekte) {
      if (gameState.check(def.showIf)) {
        this.spawnObject(this.area, def);
      } else {
        nochWartend.push(def);
      }
    }

    if (nochWartend.length !== this.wartendeObjekte.length) {
      this.wartendeObjekte = nochWartend;
      // Neu erschienene feste Objekte brauchen wieder eine Kollisionspruefung.
      this.physics.add.collider(this.player.sprite, this.solidGroup);
      this.physics.add.collider(this.pookie.sprite, this.solidGroup);
    }
  }

  /**
   * Kurzform des Weltzustands. Aendert sie sich, koennen neue Objekte
   * erscheinen oder Quests weiterlaufen - alles andere (Leben, Position)
   * aendert sich jeden Frame und darf das nicht ausloesen.
   */
  private zustandsKennung(): string {
    const s = gameState.state;
    return [
      s.puzzles.length,
      s.bosses.length,
      s.collected.length,
      s.slain.length,
      s.abilities.length,
      s.inventory.length,
      Object.keys(s.flags).length,
      Object.values(s.quests).filter((q) => q.state === 'completed').length,
    ].join(':');
  }

  private letzteKennung = '';

  private addSolid(sprite: Phaser.GameObjects.Sprite): void {
    this.solidGroup.add(sprite);
    const body = sprite.body as Phaser.Physics.Arcade.StaticBody | null;
    body?.setSize(TILE - 4, TILE - 8);
    body?.updateFromGameObject();
  }

  private openGate(object: WorldObject): void {
    const def = object.def;
    if (def.type !== 'gate') return;
    const orientation = def.orientation ?? 'h';
    object.sprite.setTexture(`obj:gate:${orientation}:open`);
    this.solidGroup.remove(object.sprite, false, false);
    const body = object.sprite.body as Phaser.Physics.Arcade.StaticBody | null;
    if (body) body.enable = false;
    audio.play('gate');
    this.cameras.main.shake(220, 0.004);
  }

  // =========================================================================
  // Spielschleife
  // =========================================================================

  update(_time: number, delta: number): void {
    if (!this.built) return;

    gameState.addPlaytime(delta);
    this.inputSystem.update();

    this.updatePlayer(delta);
    this.updateCompanion(delta);
    this.updateNpcs(delta);
    this.updateEnemies(delta);
    this.updateBoss(delta);
    this.updateProjectiles(delta);
    this.updateHazards(delta);
    this.updatePlates();

    // Hat sich am Weltzustand etwas geaendert, das Folgen hat? Der Vergleich
    // ist absichtlich billig, damit er jeden Frame laufen darf.
    const kennung = this.zustandsKennung();
    if (kennung !== this.letzteKennung) {
      this.letzteKennung = kennung;
      gameState.syncQuests();
      this.refreshConditionalObjects();
    }

    this.checkTriggers(false);
    this.checkBossArena();
    this.updateShadowWalk();

    // Anzeige nur zehnmal pro Sekunde aktualisieren - React muss nicht
    // im Takt der Spielschleife rendern.
    this.hudTimer += delta;
    if (this.hudTimer > 100) {
      this.hudTimer = 0;
      this.emitHud();
    }

    this.autosaveTimer += delta;
    if (this.autosaveTimer > AUTOSAVE_INTERVAL_MS) {
      this.autosaveTimer = 0;
      this.autosave();
    }

    // Leichte Parallaxe: der Hintergrund wandert langsamer als die Welt.
    const camera = this.cameras.main;
    this.backdrop.setTilePosition(camera.scrollX * 0.25, camera.scrollY * 0.25);

    this.publishDebugState();
    this.inputSystem.endFrame();
  }

  private updatePlayer(delta: number): void {
    const state = this.inputSystem.state;

    // Geschwindigkeit der Kachel unter der Figur
    const { tx, ty } = worldToTile(this.player.x, this.player.y);
    const tile = TILES[this.built.tileAt(tx, ty)];
    this.player.tileSpeedFactor = tile.speedFactor ?? 1;

    this.player.move(state.moveX, state.moveY, state.blocking);
    this.player.update(delta);

    if (!this.player.isAlive) {
      this.handlePlayerDeath();
      return;
    }

    if (this.inputSystem.consume('attack')) this.performAttack();
    if (this.inputSystem.consume('interact')) this.tryInteract();
    if (this.inputSystem.consume('dodge')) this.player.tryDodge();
    if (this.inputSystem.consume('special')) this.useSelectedAbility();

    this.checkPortals();

    // Position im Spielstand mitfuehren (fuer Autosave)
    if (!this.transitioning) {
      const position = worldToTile(this.player.x, this.player.y);
      gameState.update((d) => {
        d.x = position.tx;
        d.y = position.ty;
        d.facing = this.player.facing;
      });
    }
  }

  private updateCompanion(delta: number): void {
    const moving = Math.hypot(this.player.body.velocity.x, this.player.body.velocity.y) > 10;
    this.pookie.follow(this.player.x, this.player.y, delta, moving);
    this.pookie.update(delta);
    this.maybePookieComment();
  }

  private updateNpcs(delta: number): void {
    for (const npc of this.npcs) {
      npc.update(delta);
      this.updateNpcHint(npc);
    }
  }

  private updateNpcHint(npc: NpcActor): void {
    // Fragezeichen/Haken ueber NPCs, die eine Quest starten oder abschliessen.
    const node = resolveNpcDialogue(npc.def.dialogue);
    if (!node) {
      npc.setHint('none');
      return;
    }

    let hint: 'none' | 'talk' | 'quest' | 'questDone' = 'talk';
    for (const quest of Object.values(QUESTS)) {
      if (quest.giver !== npc.def.id) continue;
      const state = gameState.questState(quest.id);
      if (state === 'unknown') {
        hint = 'quest';
        break;
      }
      if (state === 'active' && this.isQuestReadyToTurnIn(quest.id)) {
        hint = 'questDone';
        break;
      }
    }
    npc.setHint(hint);
  }

  private isQuestReadyToTurnIn(questId: string): boolean {
    const quest = QUESTS[questId];
    if (!quest) return false;
    const step = quest.steps[gameState.questStep(questId)];
    // Letzter Schritt erfuellt -> beim Auftraggeber abgebbar
    return step !== undefined && gameState.questStep(questId) >= quest.steps.length - 1 && gameState.check(step.done);
  }

  private updateEnemies(delta: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i]!;

      if (!enemy.isAlive) {
        this.killEnemy(enemy, i);
        continue;
      }

      enemy.update(delta);

      const canSee = hasLineOfSight(this.built, enemy.x, enemy.y, this.player.x, this.player.y);
      const action = enemy.think(delta, {
        playerX: this.player.x,
        playerY: this.player.y,
        canSeePlayer: canSee,
        playerHidden: this.player.isShadowWalking,
      });

      if (action) this.resolveEnemyAction(action);

      // Sturmangriff: Beruehrung verletzt
      if (enemy.isCharging) {
        const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        if (distance < 18) {
          this.damagePlayer(enemy.def.attack, enemy.x, enemy.y);
        }
      }
    }
  }

  private resolveEnemyAction(action: ReturnType<EnemyActor['think']>): void {
    if (!action) return;
    if (action.kind === 'melee') {
      const distance = Phaser.Math.Distance.Between(action.x, action.y, this.player.x, this.player.y);
      if (distance <= action.radius) {
        this.damagePlayer(action.damage, action.x, action.y);
      }
      this.spawnSlash(action.x, action.y, 0.7);
    } else {
      this.spawnProjectile(action.x, action.y, action.vx, action.vy, action.damage, action.color, action.lifetimeMs, true);
    }
  }

  private killEnemy(enemy: EnemyActor, index: number): void {
    const def = enemy.def;
    audio.play('enemyDie');
    this.spawnBurst(enemy.x, enemy.y, 'fx:particle:purple', 10);

    // Beute
    for (const drop of def.drops ?? []) {
      if (Math.random() > drop.chance) continue;
      if (drop.coins) {
        gameState.addCoins(drop.coins);
        this.floatText(enemy.x, enemy.y - 8, `+${drop.coins}`, '#ffd98a');
      }
      if (drop.item) {
        gameState.addItem(drop.item, 1);
        const item = getItem(drop.item);
        bus.emit('toast', { text: `${item?.name ?? drop.item} erhalten`, kind: 'item' });
      }
    }

    // Teilende Gegner spalten sich auf
    if (def.splitsInto && ENEMIES[def.splitsInto]) {
      const count = def.splitCount ?? 2;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const child = new EnemyActor(
          this,
          ENEMIES[def.splitsInto]!,
          enemy.x + Math.cos(angle) * 14,
          enemy.y + Math.sin(angle) * 14,
          { instanceId: `${enemy.instanceId}:split:${i}` },
        );
        this.enemies.push(child);
      }
    }

    if (enemy.permanent) gameState.markSlain(enemy.instanceId);

    enemy.destroy();
    this.enemies.splice(index, 1);
  }

  private updateBoss(delta: number): void {
    this.beamGraphics?.clear();
    if (!this.boss) return;

    if (!this.boss.isAlive) {
      this.handleBossDefeated();
      return;
    }

    this.boss.update(delta);

    const arena = this.bossArena ?? {
      x: 0,
      y: 0,
      w: this.built.widthInTiles * TILE,
      h: this.built.heightInTiles * TILE,
    };

    const actions = this.boss.think(delta, {
      playerX: this.player.x,
      playerY: this.player.y,
      arena,
    });

    for (const action of actions) this.resolveBossAction(action);

    // Sturm/Dash: Beruehrung verletzt
    if (this.boss.isRushing) {
      const distance = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
      if (distance < 26) this.damagePlayer(this.boss.def.attack, this.boss.x, this.boss.y);
    }

    // Strahl zeichnen und pruefen
    if (this.boss.isBeaming) this.updateBossBeam();
  }

  private bossArena: { x: number; y: number; w: number; h: number } | null = null;

  private resolveBossAction(action: BossAction): void {
    switch (action.kind) {
      case 'melee': {
        const distance = Phaser.Math.Distance.Between(action.x, action.y, this.player.x, this.player.y);
        if (distance <= action.radius) this.damagePlayer(action.damage, action.x, action.y);
        break;
      }
      case 'projectile':
        this.spawnProjectile(
          action.x,
          action.y,
          action.vx,
          action.vy,
          action.damage,
          action.color,
          action.lifetimeMs,
          true,
        );
        break;
      case 'summon': {
        const def = ENEMIES[action.enemy];
        if (!def || !this.boss) break;
        for (let i = 0; i < action.count; i++) {
          const angle = (i / action.count) * Math.PI * 2;
          const enemy = new EnemyActor(
            this,
            def,
            this.boss.x + Math.cos(angle) * 46,
            this.boss.y + Math.sin(angle) * 46,
            { instanceId: `boss-summon:${Date.now()}:${i}` },
          );
          this.enemies.push(enemy);
          this.spawnBurst(enemy.x, enemy.y, 'fx:particle:purple', 6);
        }
        break;
      }
      case 'hazard':
        this.spawnHazard(action.x, action.y, action.hazard, action.damage);
        break;
      case 'shockwave': {
        const distance = Phaser.Math.Distance.Between(action.x, action.y, this.player.x, this.player.y);
        if (distance <= action.radius) this.damagePlayer(action.damage, action.x, action.y);
        this.spawnShockwave(action.x, action.y, action.radius);
        break;
      }
    }
  }

  private updateBossBeam(): void {
    const boss = this.boss;
    if (!boss || !this.beamGraphics) return;

    const length = 400;
    const endX = boss.x + Math.cos(boss.beamAngle) * length;
    const endY = boss.y + Math.sin(boss.beamAngle) * length;

    this.beamGraphics.lineStyle(7, 0xff6a8a, 0.75);
    this.beamGraphics.lineBetween(boss.x, boss.y, endX, endY);
    this.beamGraphics.lineStyle(3, 0xfff4dc, 0.9);
    this.beamGraphics.lineBetween(boss.x, boss.y, endX, endY);

    // Abstand des Spielers zur Strahlgeraden
    const distance = Phaser.Math.Distance.BetweenPoints(
      new Phaser.Math.Vector2(this.player.x, this.player.y),
      new Phaser.Geom.Line(boss.x, boss.y, endX, endY).getPoint(
        Phaser.Math.Clamp(
          ((this.player.x - boss.x) * (endX - boss.x) + (this.player.y - boss.y) * (endY - boss.y)) /
            (length * length),
          0,
          1,
        ),
      ),
    );
    if (distance < 12) {
      this.damagePlayer(Math.round(boss.def.attack * 0.8), boss.x, boss.y);
    }
  }

  private handleBossDefeated(): void {
    const boss = this.boss;
    if (!boss) return;
    this.boss = null;

    gameState.defeatBoss(boss.def.id);
    audio.play('levelUp');
    this.cameras.main.shake(500, 0.01);
    this.spawnBurst(boss.x, boss.y, 'fx:particle:gold', 26);

    const x = boss.x;
    const y = boss.y;
    boss.destroy();

    this.time.delayedCall(900, () => {
      applyEffects(boss.def.rewards);
      audio.playMusic(AREAS[this.area.id]?.music ?? REGIONS[this.area.region].music);
      if (boss.def.outroDialogue) {
        void this.startDialogue(boss.def.outroDialogue);
      }
      void x;
      void y;
    });
  }

  private updateProjectiles(delta: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i]!;
      projectile.lifetimeMs -= delta;

      const { tx, ty } = worldToTile(projectile.sprite.x, projectile.sprite.y);
      const blocked = TILES[this.built.tileAt(tx, ty)].solid;

      let hit = false;
      if (projectile.hostile) {
        const distance = Phaser.Math.Distance.Between(
          projectile.sprite.x,
          projectile.sprite.y,
          this.player.x,
          this.player.y,
        );
        if (distance < 13) {
          this.damagePlayer(projectile.damage, projectile.sprite.x, projectile.sprite.y);
          hit = true;
        }
      }

      if (hit || blocked || projectile.lifetimeMs <= 0) {
        this.spawnBurst(projectile.sprite.x, projectile.sprite.y, 'fx:particle:purple', 4);
        projectile.sprite.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateHazards(delta: number): void {
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const hazard = this.hazards[i]!;
      hazard.lifetimeMs -= delta;
      hazard.cooldownMs -= delta;

      const distance = Phaser.Math.Distance.Between(
        hazard.sprite.x,
        hazard.sprite.y,
        this.player.x,
        this.player.y,
      );
      if (distance < 15 && hazard.cooldownMs <= 0) {
        hazard.cooldownMs = 700;
        this.damagePlayer(hazard.damage, hazard.sprite.x, hazard.sprite.y, 80);
      }

      if (hazard.lifetimeMs <= 0) {
        this.tweens.add({
          targets: hazard.sprite,
          alpha: 0,
          duration: 240,
          onComplete: () => hazard.sprite.destroy(),
        });
        this.hazards.splice(i, 1);
      }
    }
  }

  /** Druckplatten pruefen: Spieler oder Block darauf? */
  private updatePlates(): void {
    for (const object of this.objects) {
      if (object.def.type !== 'plate') continue;
      const { x, y } = tileToWorld(object.def.x, object.def.y);

      const playerOn = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < TILE * 0.6;
      const blockOn = this.objects.some(
        (other) =>
          other.def.type === 'block' &&
          other.body &&
          Phaser.Math.Distance.Between(x, y, other.body.x, other.body.y) < TILE * 0.7,
      );

      const puzzle = getPuzzle(object.def.puzzle);
      // Bei Block-Raetseln zaehlt nur ein Block, nicht der Spieler selbst -
      // sonst waere jedes Raetsel durch Draufstellen geloest.
      const pressed = puzzle?.kind === 'blocksOnPlates' ? blockOn : playerOn || blockOn;

      if (this.puzzles.setPressed(object.def.id, pressed)) {
        object.sprite.setTexture(pressed ? 'obj:plate:on' : 'obj:plate');
      }
    }
  }

  private pushBlock(blockSprite: Phaser.Physics.Arcade.Sprite): void {
    // Bloecke werden durch Anlaufen geschoben; die Reibung bremst sie schnell
    // wieder ab, damit sie nicht durch den Raum rutschen.
    const body = blockSprite.body as Phaser.Physics.Arcade.Body;
    const dx = blockSprite.x - this.player.x;
    const dy = blockSprite.y - this.player.y;
    const length = Math.hypot(dx, dy) || 1;
    const push = 70;
    // Nur in die dominante Achse schieben - das fuehlt sich kontrollierter an.
    if (Math.abs(dx) > Math.abs(dy)) {
      body.setVelocity(Math.sign(dx) * push, 0);
    } else {
      body.setVelocity(0, Math.sign(dy) * push);
    }
    void length;
  }

  private updateShadowWalk(): void {
    const active = this.player.isShadowWalking;
    if (active === this.shadowWalkActive) return;
    this.shadowWalkActive = active;
    this.built.refreshCollision({ shadowWalk: active });
    if (!active) {
      // Steht die Figur beim Ablauf im Schatten, wird sie sanft herausgesetzt.
      const { tx, ty } = worldToTile(this.player.x, this.player.y);
      if (this.built.tileAt(tx, ty) === 'shadow') {
        this.nudgeOutOfSolid();
      }
      this.player.sprite.setAlpha(1);
    }
  }

  /** Sucht die naechste begehbare Kachel und setzt die Figur dorthin. */
  private nudgeOutOfSolid(): void {
    const { tx, ty } = worldToTile(this.player.x, this.player.y);
    for (let radius = 1; radius <= 4; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const tile = this.built.tileAt(tx + dx, ty + dy);
          if (!TILES[tile].solid) {
            const position = tileToWorld(tx + dx, ty + dy);
            this.player.placeAt(position.x, position.y);
            return;
          }
        }
      }
    }
  }

  // =========================================================================
  // Kampf
  // =========================================================================

  private performAttack(): void {
    const attack = this.player.tryAttack();
    if (!attack) return;

    this.spawnSlash(attack.x, attack.y, attack.empowered ? 1.4 : 1);

    let hitSomething = false;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive || enemy.isHidden) continue;
      const distance = Phaser.Math.Distance.Between(attack.x, attack.y, enemy.x, enemy.y);
      if (distance > attack.radius + 8) continue;

      // Geschuetzte Gegner brauchen erst einen Mondkrallen-Treffer.
      if (enemy.shielded) {
        if (attack.empowered) {
          enemy.breakShield();
          this.floatText(enemy.x, enemy.y - 12, 'Schild gebrochen!', '#bfe0ff');
        } else {
          audio.play('block');
          this.floatText(enemy.x, enemy.y - 12, 'Geschuetzt', '#8fb4ff');
        }
        hitSomething = true;
        continue;
      }

      if (enemy.takeDamage(attack.damage, this.player.x, this.player.y, 190)) {
        hitSomething = true;
        audio.play('hit');
        this.spawnImpact(enemy.x, enemy.y);
        this.floatText(enemy.x, enemy.y - 12, `${attack.damage}`, attack.empowered ? '#bfe0ff' : '#fff4dc');
      }
    }

    if (this.boss?.isAlive) {
      const distance = Phaser.Math.Distance.Between(attack.x, attack.y, this.boss.x, this.boss.y);
      if (distance <= attack.radius + 20) {
        const weakness = this.boss.def.weakness;
        const needsEmpowered = weakness?.ability === 'mondkralle';
        if (this.boss.isShielded && !attack.empowered) {
          audio.play('block');
          this.floatText(this.boss.x, this.boss.y - 20, 'Geschuetzt', '#8fb4ff');
        } else if (needsEmpowered && !attack.empowered && this.boss.vulnerableMs <= 0) {
          audio.play('block');
          this.floatText(this.boss.x, this.boss.y - 20, 'Kein Effekt', '#8fb4ff');
        } else if (this.boss.takeDamage(attack.damage, this.player.x, this.player.y)) {
          hitSomething = true;
          this.spawnImpact(this.boss.x, this.boss.y);
          this.floatText(this.boss.x, this.boss.y - 20, `${attack.damage}`, '#ffd98a');
        }
      }
    }

    if (hitSomething) this.cameras.main.shake(90, 0.0035);
  }

  private damagePlayer(amount: number, fromX: number, fromY: number, knockback = 150): void {
    if (!this.player.takeDamage(amount, fromX, fromY, knockback)) return;

    this.cameras.main.shake(160, 0.006);
    bus.emit('screen:flash', { color: 0xff4040, duration: 120 });
    this.floatText(this.player.x, this.player.y - 16, `-${amount}`, '#ff8a8a');
    this.emitHud();

    if (gameState.state.hp <= 0) this.handlePlayerDeath();
  }

  private handlePlayerDeath(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.inputSystem.setLocked(true);
    this.dialogue.abort();

    audio.play('die');
    audio.playMusic('sad');
    bus.emit('game:over', { cause: 'Mauseri ist zusammengebrochen.' });
  }

  /** Wird von der Oberflaeche nach dem Bildschirmtod aufgerufen. */
  respawn(): void {
    this.transitioning = false;
    this.player.revive(0.5);
    this.inputSystem.setLocked(false);

    // Zurueck an den Anfang der aktuellen Karte, Gegner erholen sich.
    const save = gameState.state;
    void this.loadArea(save.area, this.lastSafeTile.tx, this.lastSafeTile.ty, save.facing);
    audio.playMusic(REGIONS[this.area.region].music);
  }

  private lastSafeTile = { tx: 5, ty: 5 };

  // =========================================================================
  // Interaktion
  // =========================================================================

  private tryInteract(): void {
    if (this.dialogue.isActive || this.scripts.isRunning) return;

    const facing = this.player.directionVector(this.player.facing);
    const targetX = this.player.x + facing.x * INTERACT_RANGE * 0.7;
    const targetY = this.player.y + facing.y * INTERACT_RANGE * 0.7;

    // 1. NPCs
    const npc = this.nearest(this.npcs, targetX, targetY, INTERACT_RANGE);
    if (npc) {
      npc.lookAt(this.player.x, this.player.y);
      const node = resolveNpcDialogue(npc.def.dialogue);
      if (node) void this.startDialogue(node);
      return;
    }

    // 2. Objekte
    for (const object of this.objects) {
      const distance = Phaser.Math.Distance.Between(targetX, targetY, object.sprite.x, object.sprite.y);
      if (distance > INTERACT_RANGE) continue;
      if (this.interactWithObject(object)) return;
    }

    // 3. Nichts in Reichweite - Pookie kommentiert gelegentlich
    this.pookie.say('nichts_da', 'Da ist nichts. Ich hab schon geschaut.', { once: false });
  }

  private interactWithObject(object: WorldObject): boolean {
    const def = object.def;

    switch (def.type) {
      case 'sign':
        void this.showSign(def.text);
        return true;

      case 'chest': {
        if (gameState.isCollected(def.id)) {
          this.pookie.say('truhe_leer', 'Leer. Ich hab nachgesehen. Zweimal.', { once: false });
          return true;
        }
        if (def.requiresItem && !gameState.hasItem(def.requiresItem)) {
          const item = getItem(def.requiresItem);
          bus.emit('toast', { text: `Verschlossen. Es fehlt: ${item?.name ?? def.requiresItem}`, kind: 'warning' });
          audio.play('cancel');
          return true;
        }
        this.openChest(object, def);
        return true;
      }

      case 'switch': {
        const element = this.puzzles.toggle(def.id);
        if (element) {
          const symbol = def.symbol;
          const key = symbol
            ? `obj:switch:${symbol}${element.active ? ':on' : ''}`
            : `obj:switch${element.active ? ':on' : ''}`;
          object.sprite.setTexture(key);
          this.refreshPuzzleVisuals(def.puzzle);
        }
        return true;
      }

      case 'torch': {
        if (!def.puzzle) return false;
        const element = this.puzzles.toggle(def.id);
        if (element) object.sprite.setTexture(element.active ? 'obj:torch:lit' : 'obj:torch');
        return true;
      }

      case 'mirror': {
        const element = this.puzzles.get(def.id);
        if (!element) return false;
        const next = (element.value + 1) % 8;
        this.puzzles.setValue(def.id, next);
        object.sprite.setTexture(`obj:mirror:${next}`);
        return true;
      }

      case 'valve': {
        const element = this.puzzles.get(def.id);
        if (!element) return false;
        const next = (element.value + 1) % 4;
        this.puzzles.setValue(def.id, next);
        object.sprite.setTexture(`obj:valve:${next}`);
        audio.play('splash');
        return true;
      }

      case 'rune': {
        const element = this.puzzles.toggle(def.id);
        if (element) {
          object.sprite.setTexture(`obj:rune:${def.symbol}${element.active ? ':on' : ''}`);
          this.refreshPuzzleVisuals(def.puzzle);
        }
        return true;
      }

      case 'save':
        this.saveGame();
        return true;

      case 'pickup':
        this.collectPickup(object, def);
        return true;

      case 'portal':
        void this.usePortal(def);
        return true;

      default:
        return false;
    }
  }

  /** Nach einem Fehlversuch bei Reihenfolge-Raetseln alle Zeichen zuruecksetzen. */
  private refreshPuzzleVisuals(puzzleId: string): void {
    for (const object of this.objects) {
      const def = object.def;
      if (def.type === 'switch' && def.puzzle === puzzleId) {
        const element = this.puzzles.get(def.id);
        const key = def.symbol
          ? `obj:switch:${def.symbol}${element?.active ? ':on' : ''}`
          : `obj:switch${element?.active ? ':on' : ''}`;
        object.sprite.setTexture(key);
      } else if (def.type === 'rune' && def.puzzle === puzzleId) {
        const element = this.puzzles.get(def.id);
        object.sprite.setTexture(`obj:rune:${def.symbol}${element?.active ? ':on' : ''}`);
      }
    }
  }

  private openChest(object: WorldObject, def: ObjChest): void {
    gameState.markCollected(def.id);
    object.sprite.setTexture('obj:chest:open');
    audio.play('chest');
    this.spawnBurst(object.sprite.x, object.sprite.y - 8, 'fx:particle:gold', 12);

    for (const entry of def.contents) {
      const count = entry.count ?? 1;
      if (entry.item === 'coins') {
        gameState.addCoins(count);
        bus.emit('toast', { text: `${count} Muenzen`, kind: 'item' });
        continue;
      }
      gameState.addItem(entry.item, count);
      const item = getItem(entry.item);
      bus.emit('toast', {
        text: count > 1 ? `${item?.name ?? entry.item} x${count}` : (item?.name ?? entry.item),
        kind: 'item',
      });
      this.applySpecialItem(entry.item, count);
    }
  }

  private collectPickup(object: WorldObject, def: ObjPickup): void {
    gameState.markCollected(def.id);
    const count = def.count ?? 1;
    gameState.addItem(def.item, count);
    const item = getItem(def.item);
    audio.play('pickup');
    bus.emit('toast', { text: `${item?.name ?? def.item} erhalten`, kind: 'item' });
    this.spawnBurst(object.sprite.x, object.sprite.y, 'fx:particle:gold', 8);
    this.applySpecialItem(def.item, count);

    object.sprite.destroy();
    this.objects = this.objects.filter((o) => o !== object);
  }

  /** Sammelstuecke, die sofort wirken (Herzscherben, Seelenfunken, Geheimnisse). */
  private applySpecialItem(itemId: string, count: number): void {
    if (itemId === 'herzscherbe') {
      gameState.update((d) => {
        d.maxHp += 8 * count;
        d.hp = d.maxHp;
      });
      audio.play('levelUp');
      bus.emit('toast', { text: 'Maximale Lebenskraft erhoeht', kind: 'ability' });
    } else if (itemId === 'seelenfunke') {
      gameState.update((d) => {
        d.maxEnergy += 6 * count;
        d.energy = d.maxEnergy;
      });
      audio.play('levelUp');
      bus.emit('toast', { text: 'Maximale Energie erhoeht', kind: 'ability' });
    } else if (itemId === 'tagebuchseite') {
      gameState.findSecret(`tagebuch:${gameState.itemCount('tagebuchseite')}`);
    } else if (itemId === 'mondsplitter') {
      gameState.findSecret(`mondsplitter:${gameState.itemCount('mondsplitter')}`);
    }
  }

  private async showSign(lines: string[]): Promise<void> {
    return new Promise((resolve) => {
      this.inputSystem.setLocked(true);
      bus.emit('dialogue:start', {
        speaker: 'Schild',
        portrait: 'erzaehler',
        lines: lines.map((text) => ({ speaker: 'erzaehler', text })),
        onDone: () => {
          bus.emit('dialogue:end');
          this.inputSystem.setLocked(false);
          resolve();
        },
      });
    });
  }

  /**
   * Loest ein Portal aus, sobald die Figur darauf steht.
   *
   * Tueren und Kartenraender nur per Taste zu oeffnen fuehlt sich zaeh an, und
   * mehrere Portale liegen genau auf dem Feld, auf dem man ankommt. Deshalb:
   * Betreten genuegt - aber erst, nachdem die Figur das Ankunftsfeld einmal
   * verlassen hat, sonst wuerde sie sofort wieder zurueckgeworfen.
   */
  private checkPortals(): void {
    if (this.transitioning || this.dialogue.isActive || this.scripts.isRunning) return;

    const hier = worldToTile(this.player.x, this.player.y);

    if (this.ankunftsFeld && (hier.tx !== this.ankunftsFeld.tx || hier.ty !== this.ankunftsFeld.ty)) {
      this.ankunftsFeld = null;
    }
    if (this.ankunftsFeld) return;

    for (const object of this.objects) {
      const def = object.def;
      if (def.type !== 'portal') continue;
      if (def.x !== hier.tx || def.y !== hier.ty) continue;
      void this.usePortal(def);
      return;
    }
  }

  /** Feld, auf dem die Figur die Karte betreten hat. */
  private ankunftsFeld: { tx: number; ty: number } | null = null;

  private async usePortal(def: ObjPortal): Promise<void> {
    if (def.lockedUnless && !gameState.check(def.lockedUnless)) {
      bus.emit('toast', { text: def.lockedText ?? 'Hier geht es nicht weiter.', kind: 'warning' });
      audio.play('cancel');
      return;
    }
    await this.warpTo(def.to, def.toX, def.toY, def.facing);
  }

  private saveGame(): void {
    if (gameState.save()) {
      audio.play('save');
      gameState.heal(gameState.state.maxHp);
      gameState.restoreEnergy(gameState.state.maxEnergy);
      bus.emit('toast', { text: 'Gespeichert. Du fuehlst dich ausgeruht.', kind: 'info' });
      this.lastSafeTile = worldToTile(this.player.x, this.player.y);
      this.emitHud();
    } else {
      bus.emit('toast', { text: 'Speichern nicht moeglich.', kind: 'warning' });
    }
  }

  private autosave(): void {
    const position = worldToTile(this.player.x, this.player.y);
    if (!TILES[this.built.tileAt(position.tx, position.ty)].solid) {
      this.lastSafeTile = position;
    }
    gameState.save();
  }

  // =========================================================================
  // Faehigkeiten
  // =========================================================================

  /** Aktuell gewaehlte Faehigkeit - wird von der Oberflaeche gesetzt. */
  selectedAbility: AbilityId | null = null;

  useAbility(id: AbilityId): void {
    if (!this.player.canUseAbility(id)) {
      audio.play('cancel');
      const def = ABILITIES[id];
      if (gameState.state.energy < def.energyCost) {
        bus.emit('toast', { text: 'Zu wenig Energie.', kind: 'warning' });
      }
      return;
    }

    if (!this.player.useAbility(id)) return;

    switch (id) {
      case 'kratzsprung':
        this.doKratzsprung();
        break;
      case 'schnurrimpuls':
        this.doSchnurrimpuls();
        break;
      case 'katzenflink':
        this.spawnRing('fx:ring:gold');
        break;
      case 'schattenpfote':
        this.spawnRing('fx:ring:purple');
        audio.play('shadowStep');
        break;
      case 'mondkralle':
        this.spawnRing('fx:ring:blue');
        break;
    }

    this.emitHud();
  }

  private useSelectedAbility(): void {
    const abilities = gameState.state.abilities;
    if (abilities.length === 0) {
      bus.emit('toast', { text: 'Du kennst noch keine Faehigkeit.', kind: 'warning' });
      return;
    }
    const id = this.selectedAbility && abilities.includes(this.selectedAbility)
      ? this.selectedAbility
      : abilities[0]!;
    this.useAbility(id);
  }

  /** Sprung ueber Absaetze und schmale Spalten. */
  private doKratzsprung(): void {
    const dir = this.player.directionVector(this.player.facing);
    const start = worldToTile(this.player.x, this.player.y);

    // Bis zu drei Kacheln weit springen - erste freie Landung gewinnt.
    let landing: { tx: number; ty: number } | null = null;
    for (let distance = 2; distance <= 3; distance++) {
      const tx = start.tx + dir.x * distance;
      const ty = start.ty + dir.y * distance;
      const tile = this.built.tileAt(tx, ty);
      if (!TILES[tile].solid) {
        landing = { tx, ty };
        break;
      }
    }

    audio.play('jump');
    this.spawnRing('fx:ring:green');

    if (!landing) {
      // Kein Ziel: kleiner Satz auf der Stelle, damit der Einsatz nicht
      // wirkungslos wirkt.
      this.tweens.add({
        targets: this.player.sprite,
        y: this.player.y - 10,
        duration: 160,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
      return;
    }

    const target = tileToWorld(landing.tx, landing.ty);
    const body = this.player.body;
    body.enable = false;
    this.player.invulnerableMs = Math.max(this.player.invulnerableMs, 420);

    this.tweens.add({
      targets: this.player.sprite,
      x: target.x,
      y: target.y,
      duration: 340,
      ease: 'Quad.easeOut',
      onComplete: () => {
        body.enable = true;
        this.player.placeAt(target.x, target.y);
        this.spawnBurst(target.x, target.y + 6, 'fx:particle:dust', 6);
      },
    });

    // Schattenwurf waehrend des Sprungs: kurze Anhebung
    this.tweens.add({
      targets: this.player.sprite,
      scaleX: { from: 1, to: 1.12 },
      scaleY: { from: 1, to: 1.12 },
      duration: 170,
      yoyo: true,
    });
  }

  /** Macht verborgene Dinge sichtbar. */
  private doSchnurrimpuls(): void {
    this.spawnRing('fx:ring:blue', 2.6);
    audio.play('purr');

    let found = 0;
    const radius = TILE * 5;

    for (const def of this.area.objects) {
      const isHideable =
        (def.type === 'chest' && def.hidden) || (def.type === 'pickup' && def.hidden);
      if (!isHideable) continue;

      const id = def.type === 'chest' ? def.id : def.id;
      if (this.revealedSecrets.has(id) || gameState.isCollected(id)) continue;

      const { x, y } = tileToWorld(def.x, def.y);
      if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) > radius) continue;

      this.revealedSecrets.add(id);
      this.spawnObject(this.area, def);
      this.spawnBurst(x, y, 'fx:particle:blue', 10);
      found++;

      if (gameState.findSecret(`geheimnis:${this.area.id}:${id}`)) {
        bus.emit('toast', { text: 'Etwas war hier verborgen.', kind: 'info' });
      }
    }

    if (found === 0) {
      this.pookie.say('impuls_nichts', 'Hier antwortet nichts. Vielleicht woanders?', { once: false });
    } else {
      audio.play('puzzle');
    }
  }

  // =========================================================================
  // Trigger und Skripte
  // =========================================================================

  private checkTriggers(onEnter: boolean): void {
    if (this.scripts.isRunning || this.dialogue.isActive) return;

    for (const object of this.objects) {
      const def = object.def;
      if (def.type !== 'trigger') continue;

      const width = (def.w ?? 1) * TILE;
      const height = (def.h ?? 1) * TILE;
      const { x, y } = tileToWorld(def.x, def.y);
      const bounds = new Phaser.Geom.Rectangle(
        x - TILE / 2,
        y - TILE / 2,
        width,
        height,
      );

      if (!bounds.contains(this.player.x, this.player.y)) continue;
      if (def.once && gameState.hasFiredTrigger(def.id)) continue;
      if (this.firedThisVisit.has(def.id)) continue;

      this.firedThisVisit.add(def.id);
      if (def.once) gameState.markTriggerFired(def.id);

      void this.scripts.play(def.script);
      return;
    }

    void onEnter;
  }

  /** Weckt einen Boss, wenn der Spieler die Arena betritt. */
  private checkBossArena(): void {
    if (!this.pendingBoss || this.boss) return;
    const arena = this.pendingBoss.def.arena;
    if (arena) {
      const rect = new Phaser.Geom.Rectangle(
        arena.x * TILE,
        arena.y * TILE,
        arena.w * TILE,
        arena.h * TILE,
      );
      if (!rect.contains(this.player.x, this.player.y)) return;
      this.bossArena = { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
    }

    const pending = this.pendingBoss;
    this.pendingBoss = null;
    this.spawnBoss(pending.def.boss, Math.floor(pending.x / TILE), Math.floor(pending.y / TILE));
  }

  // =========================================================================
  // Pookie
  // =========================================================================

  private maybePookieComment(): void {
    if (this.dialogue.isActive || this.scripts.isRunning) return;

    // Hinweis nur, wenn der Spieler tatsaechlich vor dem Raetsel steht -
    // sonst kommentierte Pookie es schon beim Betreten der Karte, egal wie
    // weit weg es lag.
    const naehe = TILE * 5;
    for (const puzzleId of this.puzzles.activePuzzleIds()) {
      if (gameState.isPuzzleSolved(puzzleId)) continue;
      const hint = this.puzzles.hintFor(puzzleId);
      if (!hint) continue;

      const stehtDavor = this.objects.some((object) => {
        const def = object.def;
        if (!('puzzle' in def) || def.puzzle !== puzzleId) return false;
        return (
          Phaser.Math.Distance.Between(object.sprite.x, object.sprite.y, this.player.x, this.player.y) <
          naehe
        );
      });
      if (!stehtDavor) continue;

      if (this.pookie.say(`raetsel:${puzzleId}`, hint)) return;
    }

    // Hinweis bei wenig Leben
    if (gameState.state.hp < gameState.state.maxHp * 0.25) {
      if (this.pookie.say('wenig_leben', 'Du blutest. Hast du noch was zu essen dabei?')) return;
    }
  }

  // =========================================================================
  // Effekte
  // =========================================================================

  private spawnSlash(x: number, y: number, scale = 1): void {
    const sprite = this.add.sprite(x, y, 'fx:slash');
    sprite.setDepth(DEPTH.entities + 500);
    sprite.setScale(scale);
    sprite.setRotation(
      this.player.facing === 'left'
        ? Math.PI
        : this.player.facing === 'up'
          ? -Math.PI / 2
          : this.player.facing === 'down'
            ? Math.PI / 2
            : 0,
    );
    this.tweens.add({
      targets: sprite,
      alpha: { from: 1, to: 0 },
      scale: scale * 1.4,
      duration: 190,
      onComplete: () => sprite.destroy(),
    });
  }

  private spawnImpact(x: number, y: number): void {
    const sprite = this.add.sprite(x, y, 'fx:impact');
    sprite.setDepth(DEPTH.entities + 600);
    this.tweens.add({
      targets: sprite,
      alpha: { from: 1, to: 0 },
      scale: { from: 0.6, to: 1.5 },
      duration: 230,
      onComplete: () => sprite.destroy(),
    });
  }

  private spawnShockwave(x: number, y: number, radius: number): void {
    const sprite = this.add.sprite(x, y, 'fx:ring:gold');
    sprite.setDepth(DEPTH.groundDetail);
    this.tweens.add({
      targets: sprite,
      scale: { from: 0.4, to: radius / 14 },
      alpha: { from: 0.9, to: 0 },
      duration: 380,
      onComplete: () => sprite.destroy(),
    });
  }

  private spawnRing(texture: string, scale = 1.8): void {
    const sprite = this.add.sprite(this.player.x, this.player.y + 4, texture);
    sprite.setDepth(DEPTH.groundDetail);
    this.tweens.add({
      targets: sprite,
      scale: { from: 0.3, to: scale },
      alpha: { from: 0.95, to: 0 },
      duration: 460,
      onComplete: () => sprite.destroy(),
    });
  }

  private spawnBurst(x: number, y: number, texture: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 8 + Math.random() * 22;
      const sprite = this.add.sprite(x, y, texture);
      sprite.setDepth(DEPTH.entities + 700);
      sprite.setScale(0.4 + Math.random() * 0.4);
      this.tweens.add({
        targets: sprite,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.1,
        duration: 320 + Math.random() * 260,
        onComplete: () => sprite.destroy(),
      });
    }
  }

  private spawnProjectile(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    color: number,
    lifetimeMs: number,
    hostile: boolean,
  ): void {
    const key =
      color === 0x8fe08a
        ? 'fx:projectile:green'
        : color === 0x7fd8ff
          ? 'fx:projectile:blue'
          : color === 0xff6a6a
            ? 'fx:projectile:red'
            : color === 0xffd98a
              ? 'fx:projectile:gold'
              : 'fx:projectile:purple';

    const sprite = this.physics.add.sprite(x, y, key);
    sprite.setDepth(DEPTH.entities + 400);
    sprite.setScale(0.75);
    (sprite.body as Phaser.Physics.Arcade.Body).setSize(10, 10);
    sprite.setVelocity(vx, vy);

    this.projectiles.push({ sprite, damage, lifetimeMs, hostile });
  }

  private spawnHazard(x: number, y: number, hazard: string, damage: number): void {
    const key =
      hazard === 'thorn'
        ? 'fx:hazard:thorn'
        : hazard === 'frost'
          ? 'fx:hazard:frost'
          : 'fx:hazard:shadow';

    const sprite = this.add.sprite(x, y, key);
    sprite.setDepth(DEPTH.groundDetail);
    sprite.setAlpha(0);
    this.tweens.add({ targets: sprite, alpha: 1, scale: { from: 0.5, to: 1 }, duration: 220 });

    this.hazards.push({ sprite, damage, lifetimeMs: 5200, cooldownMs: 260 });
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    const label = this.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color,
      stroke: '#241a3d',
      strokeThickness: 3,
      resolution: 3,
    });
    label.setOrigin(0.5, 0.5);
    label.setDepth(DEPTH.entities + 900);
    this.tweens.add({
      targets: label,
      y: y - 20,
      alpha: 0,
      duration: 720,
      ease: 'Quad.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  // =========================================================================
  // Hilfsfunktionen
  // =========================================================================

  private nearest<T extends { x: number; y: number }>(
    list: T[],
    x: number,
    y: number,
    maxDistance: number,
  ): T | null {
    let best: T | null = null;
    let bestDistance = maxDistance;
    for (const item of list) {
      const distance = Phaser.Math.Distance.Between(x, y, item.x, item.y);
      if (distance < bestDistance) {
        best = item;
        bestDistance = distance;
      }
    }
    return best;
  }

  private emitHud(): void {
    const state = gameState.state;
    const region = REGIONS[this.area?.region ?? 'miezlingen'];

    const abilities: HudSnapshot['abilities'] = state.abilities.map((id) => {
      const def = ABILITIES[id];
      const cooldown = this.player.abilityCooldowns[id] ?? 0;
      return {
        id,
        name: def.name,
        ready: cooldown <= 0 && state.energy >= def.energyCost,
        cooldownPct: cooldown > 0 ? Math.max(0, Math.min(1, cooldown / def.cooldownMs)) : 0,
      };
    });

    bus.emit('hud:update', {
      hp: Math.round(state.hp),
      maxHp: state.maxHp,
      energy: Math.round(state.energy),
      maxEnergy: state.maxEnergy,
      coins: state.coins,
      regionName: region.name,
      areaName: this.area?.name ?? '',
      abilities,
    });
  }

  /** Verbraucht einen Gegenstand aus dem Inventar. */
  useItem(itemId: string): void {
    const item = ITEMS[itemId];
    if (!item) return;

    if (item.category === 'heal') {
      if (!gameState.removeItem(itemId, 1)) return;
      if (item.healAmount) gameState.heal(item.healAmount);
      if (item.energyAmount) gameState.restoreEnergy(item.energyAmount);
      audio.play('heal');
      this.spawnBurst(this.player.x, this.player.y, 'fx:particle:green', 8);
      bus.emit('toast', { text: `${item.name} benutzt`, kind: 'info' });
      this.emitHud();
      return;
    }

    if (item.category === 'equip') {
      this.equipItem(itemId);
      return;
    }

    bus.emit('toast', { text: 'Das laesst sich hier nicht benutzen.', kind: 'warning' });
  }

  /** Legt Ausruestung an und rechnet die Werte um. */
  equipItem(itemId: string): void {
    const item = ITEMS[itemId];
    if (!item?.equip) return;

    const slot = item.equip.attack !== undefined ? 'weapon' : 'charm';
    const current = gameState.state.equipped[slot];
    if (current === itemId) {
      // Ablegen
      this.applyEquipStats(current, -1);
      gameState.update((d) => {
        delete d.equipped[slot];
      });
      bus.emit('toast', { text: `${item.name} abgelegt`, kind: 'info' });
    } else {
      if (current) this.applyEquipStats(current, -1);
      this.applyEquipStats(itemId, 1);
      gameState.update((d) => {
        d.equipped[slot] = itemId;
      });
      audio.play('confirm');
      bus.emit('toast', { text: `${item.name} angelegt`, kind: 'info' });
    }
    this.emitHud();
  }

  private applyEquipStats(itemId: string, sign: 1 | -1): void {
    const equip = ITEMS[itemId]?.equip;
    if (!equip) return;
    gameState.update((d) => {
      if (equip.attack) d.attack += equip.attack * sign;
      if (equip.defense) d.defense += equip.defense * sign;
      if (equip.maxHp) {
        d.maxHp += equip.maxHp * sign;
        d.hp = Math.min(d.hp, d.maxHp);
      }
    });
  }

  // =========================================================================
  // ScriptHost
  // =========================================================================

  async wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  setControlsLocked(locked: boolean): void {
    this.inputSystem.setLocked(locked);
  }

  async startDialogue(nodeId: string): Promise<void> {
    return new Promise((resolve) => {
      this.inputSystem.setLocked(true);
      this.dialogue.start(nodeId, () => {
        if (!this.scripts.isRunning) this.inputSystem.setLocked(false);
        resolve();
      });
    });
  }

  private findActor(who: string): { sprite: Phaser.GameObjects.Sprite; setFacing: (d: Direction) => void } | null {
    if (who === 'player') return this.player;
    if (who === 'pookie') return this.pookie;
    const npc = this.npcs.find((n) => n.def.id === who);
    return npc ?? null;
  }

  async moveActor(who: string, toX: number, toY: number, speed: number): Promise<void> {
    const actor = this.findActor(who);
    if (!actor) return;
    const target = tileToWorld(toX, toY);
    const distance = Phaser.Math.Distance.Between(actor.sprite.x, actor.sprite.y, target.x, target.y);
    const duration = (distance / speed) * 1000;

    actor.setFacing(
      Math.abs(target.x - actor.sprite.x) > Math.abs(target.y - actor.sprite.y)
        ? target.x > actor.sprite.x
          ? 'right'
          : 'left'
        : target.y > actor.sprite.y
          ? 'down'
          : 'up',
    );

    return new Promise((resolve) => {
      this.tweens.add({
        targets: actor.sprite,
        x: target.x,
        y: target.y,
        duration: Math.max(80, duration),
        ease: 'Linear',
        onComplete: () => {
          const body = actor.sprite.body as Phaser.Physics.Arcade.Body | null;
          body?.reset(target.x, target.y);
          resolve();
        },
      });
    });
  }

  faceActor(who: string, dir: Direction): void {
    this.findActor(who)?.setFacing(dir);
  }

  spawnNpc(npcId: string, tx: number, ty: number): void {
    const { x, y } = tileToWorld(tx, ty);

    // Pookie ist kein NPC, sondern der Begleiter. Nach der Trennung in den
    // Schattenlanden muss er wieder eingesetzt werden koennen - sonst bliebe
    // er fuer den Rest des Spiels verschwunden.
    if (npcId === 'pookie') {
      this.pookie.setPresent(true);
      this.pookie.warpTo(x, y);
      this.spawnBurst(x, y, 'fx:particle:gold', 12);
      return;
    }

    const def = NPCS[npcId];
    if (!def) return;
    const npc = new NpcActor(this, def, x, y, {});
    this.npcs.push(npc);
    this.spawnBurst(x, y, 'fx:particle:white', 6);
  }

  despawnActor(who: string): void {
    const index = this.npcs.findIndex((n) => n.def.id === who);
    if (index >= 0) {
      const npc = this.npcs[index]!;
      this.spawnBurst(npc.x, npc.y, 'fx:particle:white', 6);
      npc.destroy();
      this.npcs.splice(index, 1);
    } else if (who === 'pookie') {
      this.pookie.setPresent(false);
    }
  }

  async panCamera(x: number | undefined, y: number | undefined, follow: string | undefined, ms: number): Promise<void> {
    const camera = this.cameras.main;
    if (follow) {
      const actor = this.findActor(follow);
      if (actor) camera.startFollow(actor.sprite, true, 0.12, 0.12);
      return;
    }
    if (x === undefined || y === undefined) return;
    camera.stopFollow();
    const target = tileToWorld(x, y);
    camera.pan(target.x, target.y, ms, 'Sine.easeInOut');
    await this.wait(ms);
  }

  async fadeScreen(to: 'black' | 'clear', ms: number): Promise<void> {
    const camera = this.cameras.main;
    if (to === 'black') camera.fadeOut(ms, 0, 0, 0);
    else camera.fadeIn(ms, 0, 0, 0);
    await this.wait(ms);
  }

  async warpTo(area: AreaId, tx: number, ty: number, facing: Direction = 'down'): Promise<void> {
    if (this.transitioning) return;
    this.transitioning = true;
    this.inputSystem.setLocked(true);

    await this.fadeScreen('black', 260);
    await this.loadArea(area, tx, ty, facing);
    this.lastSafeTile = { tx, ty };
    await this.fadeScreen('clear', 260);

    this.transitioning = false;
    if (!this.scripts.isRunning && !this.dialogue.isActive) {
      this.inputSystem.setLocked(false);
    }
  }

  spawnBoss(bossId: string, tx: number, ty: number): void {
    const def = BOSSES[bossId];
    if (!def || gameState.isBossDefeated(bossId)) return;

    const { x, y } = tileToWorld(tx, ty);
    this.boss = new BossActor(this, def, x, y);
    audio.playMusic(def.music ?? 'boss');
    this.cameras.main.shake(400, 0.008);

    if (def.introDialogue) {
      void this.startDialogue(def.introDialogue);
    }
  }

  private cleanup(): void {
    this.inputSystem?.destroy();
    setWorldEffectHandler(null);
    bus.clear();
  }

  /** Wird vom React-Rahmen fuer die Karte gebraucht. */
  getCurrentArea(): AreaDef | undefined {
    return this.area;
  }

  /**
   * Stellt den Zustand fuer automatisierte Tests bereit. Bewusst auch im
   * fertigen Spiel vorhanden: es sind nur Lesewerte, und ohne sie liesse sich
   * nicht pruefen, ob die Figur sich tatsaechlich bewegt.
   *
   * Die schreibenden Testhilfen (Springen zu einer Karte, Faehigkeiten
   * freischalten) haengen an "?test=1". Ohne diesen Parameter gibt es sie
   * nicht - sonst waere das Spiel mit zwei Zeilen Konsole durchgespielt.
   */
  private publishDebugState(): void {
    const tile = worldToTile(this.player.x, this.player.y);
    const debug: Record<string, unknown> = {
      area: this.area?.id,
      playerTile: { x: tile.tx, y: tile.ty },
      hp: gameState.state.hp,
      maxHp: gameState.state.maxHp,
      enemies: this.enemies.length,
      npcs: this.npcs.length,
      objects: this.objects.length,
      boss: this.boss?.def.id ?? null,
      dialogueActive: this.dialogue.isActive,
      scriptRunning: this.scripts.isRunning,
      abilities: [...gameState.state.abilities],
      puzzles: [...gameState.state.puzzles],
      bossesDefeated: [...gameState.state.bosses],
      bossHp: this.boss?.hp ?? null,
      quests: Object.fromEntries(
        Object.entries(gameState.state.quests).map(([id, q]) => [id, q.state]),
      ),
    };

    if (this.testModeEnabled) {
      debug.warp = (area: AreaId, x: number, y: number) => void this.warpTo(area, x, y);
      // Versetzt die Figur innerhalb der Karte, ohne sie neu zu laden - beim
      // Warpen gingen sonst halb geloeste Raetsel verloren.
      debug.placeAt = (tx: number, ty: number) => {
        const p = tileToWorld(tx, ty);
        this.player.placeAt(p.x, p.y);
        this.pookie.warpTo(p.x, p.y);
      };
      debug.grantAbility = (id: AbilityId) => gameState.grantAbility(id);
      debug.setFlag = (name: string, value = true) => gameState.setFlag(name, value);
      debug.attack = () => this.performAttack();
      debug.hurt = (amount: number) => this.damagePlayer(amount, this.player.x + 20, this.player.y);
    }

    (window as unknown as { __mauseriDebug: unknown }).__mauseriDebug = debug;
  }

  /** Nur aktiv, wenn die Seite mit "?test=1" geoeffnet wurde. */
  private readonly testModeEnabled =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('test') === '1';
}
