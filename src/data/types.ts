/**
 * Datenmodell des Spiels.
 *
 * Grundsatz: Inhalte sind Daten, keine Logik. Karten, NPCs, Dialoge, Quests,
 * Gegenstaende und Gegner werden hier deklariert und von den Systemen in
 * src/game/systems interpretiert. Dadurch laesst sich das Spiel erweitern,
 * ohne Spielcode anzufassen.
 */

// ---------------------------------------------------------------------------
// Regionen
// ---------------------------------------------------------------------------

export type RegionId =
  | 'miezlingen'
  | 'schnurrwald'
  | 'kratzfels'
  | 'miauport'
  | 'mondsee'
  | 'schattenlande'
  | 'schloss';

export interface RegionDef {
  id: RegionId;
  name: string;
  /** Kurzbeschreibung fuer die Weltkarte. */
  blurb: string;
  /** Farbstimmung der Region - steuert Tiles, Licht und Partikel. */
  palette: RegionPalette;
  music: MusicTrackId;
  /** Position auf der Weltkarte (0..1, relativ zur Kartenflaeche). */
  mapPosition: { x: number; y: number };
}

export interface RegionPalette {
  /** Basis-Grasflaeche bzw. Bodenfarbe. */
  ground: number;
  groundAlt: number;
  /** Weg / Pflaster. */
  path: number;
  pathAlt: number;
  /** Wasser. */
  water: number;
  waterDeep: number;
  /** Fels, Mauern, Klippen. */
  rock: number;
  rockDark: number;
  /** Vegetation. */
  foliage: number;
  foliageDark: number;
  trunk: number;
  /** Gebaeude. */
  wall: number;
  roof: number;
  roofAlt: number;
  /** Umgebungslicht als Tint (0xffffff = neutral). */
  ambient: number;
  /** Staerke der Verdunkelung, 0 = keine. */
  ambientAlpha: number;
  /** Akzentfarbe fuer Partikel und Lichter. */
  accent: number;
}

// ---------------------------------------------------------------------------
// Kacheln
// ---------------------------------------------------------------------------

/**
 * Kacheltypen. Das Zeichen in eckigen Klammern ist das ASCII-Kuerzel, mit dem
 * die Karte in den Regionsdateien geschrieben wird - siehe LEGEND in tiles.ts.
 */
export type TileId =
  | 'void' //        [ ] nichts, blockiert
  | 'grass' //       [.] begehbarer Boden (regionsabhaengig)
  | 'grassAlt' //    [,] Bodenvariante
  | 'path' //        [-] Weg
  | 'floor' //       [_] Innenraumboden
  | 'sand' //        [s] Sand
  | 'water' //       [~] flaches Wasser, blockiert (ausser mit Faehigkeit)
  | 'waterDeep' //   [W] tiefes Wasser, blockiert
  | 'bridge' //      [=] Bruecke ueber Wasser
  | 'rock' //        [#] Fels / Mauer, blockiert
  | 'cliff' //       [^] Klippe, blockiert
  | 'tree' //        [T] Baum, blockiert
  | 'bush' //        [b] Busch, begehbar, versteckt Gegenstaende
  | 'flower' //      [f] Blume, Deko
  | 'wall' //        [X] Hauswand, blockiert
  | 'roof' //        [R] Dach, blockiert
  | 'door' //        [D] Tuer (Portal wird als Objekt gesetzt)
  | 'window' //      [w] Fenster, blockiert
  | 'ledge' //       [j] Absatz - nur mit Kratzsprung ueberwindbar
  | 'shadow' //      [%] Schattenfeld - nur mit Schattenpfote begehbar
  | 'pit' //         [o] Abgrund, blockiert, wirft zurueck
  | 'ice' //         [i] Eis, rutschig
  | 'stairs' //      [/] Treppe
  | 'rubble' //      [r] Geroell, blockiert
  | 'carpet' //      [c] Teppich
  | 'sign' //        [!] Schild, blockiert, lesbar
  | 'crystal' //     [*] Kristall, blockiert, leuchtet
  | 'grave' //       [+] Ruine / Schrein, blockiert
  | 'mud' //         [m] Schlamm, verlangsamt
  | 'lilypad' //     [p] Seerosenblatt, begehbar ueber Wasser
  | 'fence' //       [n] Zaun, blockiert
  | 'table' //       [t] Tisch, blockiert
  | 'counter'; //    [u] Tresen, blockiert

export interface TileDef {
  id: TileId;
  /** Blockiert die Bewegung? */
  solid: boolean;
  /** Geschwindigkeitsfaktor beim Begehen (1 = normal). */
  speedFactor?: number;
  /** Nur mit dieser Faehigkeit passierbar. */
  requiresAbility?: AbilityId;
  /** Rutschig - der Spieler gleitet weiter. */
  slippery?: boolean;
  /** Wird ueber dem Spieler gezeichnet (Baumkronen, Dachvorspruenge). */
  overhang?: boolean;
  /** Leuchtet und erhellt die Umgebung. */
  emissive?: boolean;
}

// ---------------------------------------------------------------------------
// Karten
// ---------------------------------------------------------------------------

export type AreaId = string;

export interface AreaDef {
  id: AreaId;
  region: RegionId;
  /** Anzeigename, erscheint beim Betreten. */
  name: string;
  /** Kartenzeilen aus ASCII-Kuerzeln. Alle Zeilen muessen gleich lang sein. */
  rows: string[];
  /** Objekte auf der Karte: NPCs, Truhen, Gegner, Portale, Raetselteile. */
  objects: MapObject[];
  /** Abweichende Musik (sonst die der Region). */
  music?: MusicTrackId;
  /** Innenraum: kein Wetter, andere Beleuchtung. */
  indoor?: boolean;
  /** Ueberschreibt die Umgebungsverdunkelung der Region. */
  ambientAlpha?: number;
  /** Diese Flaeche taucht erst auf der Weltkarte auf, wenn sie betreten wurde. */
  hiddenOnMap?: boolean;
}

export type MapObject =
  | ObjNpc
  | ObjEnemy
  | ObjBoss
  | ObjChest
  | ObjPortal
  | ObjTrigger
  | ObjSign
  | ObjSwitch
  | ObjPressurePlate
  | ObjPushBlock
  | ObjDoorGate
  | ObjPickup
  | ObjSavePoint
  | ObjMirror
  | ObjTorch
  | ObjWaterValve
  | ObjRuneStone
  | ObjDecor;

interface ObjBase {
  /** Kachelkoordinaten auf dieser Karte. */
  x: number;
  y: number;
  /** Eindeutige ID innerhalb der Karte - noetig fuer Weltzustaende. */
  id?: string;
  /** Objekt erscheint nur, wenn diese Bedingung erfuellt ist. */
  showIf?: Condition;
}

export interface ObjNpc extends ObjBase {
  type: 'npc';
  npc: string;
  /** Laeuft der NPC umher? */
  wander?: boolean;
  /** Blickrichtung im Ruhezustand. */
  facing?: Direction;
}

export interface ObjEnemy extends ObjBase {
  type: 'enemy';
  enemy: string;
  /** Gegner bleibt nach dem Besiegen weg (sonst respawnt er beim Neubetreten). */
  permanent?: boolean;
  /** Bewachungsradius in Kacheln. */
  leash?: number;
}

export interface ObjBoss extends ObjBase {
  type: 'boss';
  boss: string;
  /** Wird erst ausgeloest, wenn der Spieler diese Kachelzeile ueberschreitet. */
  arena?: { x: number; y: number; w: number; h: number };
}

export interface ObjChest extends ObjBase {
  type: 'chest';
  id: string;
  contents: { item: string; count?: number }[];
  /** Truhe benoetigt diesen Schluessel. */
  requiresItem?: string;
  /** Truhe ist unsichtbar, bis Schnurrimpuls eingesetzt wurde. */
  hidden?: boolean;
}

export interface ObjPortal extends ObjBase {
  type: 'portal';
  /** Zielkarte. */
  to: AreaId;
  /** Zielposition in Kacheln. */
  toX: number;
  toY: number;
  /** Blickrichtung nach dem Uebergang. */
  facing?: Direction;
  /** Uebergangsart. */
  transition?: 'fade' | 'door' | 'stairs';
  /** Portal ist gesperrt, bis die Bedingung erfuellt ist. */
  lockedUnless?: Condition;
  /** Text, wenn gesperrt. */
  lockedText?: string;
}

export interface ObjTrigger extends ObjBase {
  type: 'trigger';
  id: string;
  /** Groesse des Ausloesebereichs in Kacheln. */
  w?: number;
  h?: number;
  /** Szene, die abgespielt wird. */
  script: string;
  /** Nur einmal ausloesen. */
  once?: boolean;
}

export interface ObjSign extends ObjBase {
  type: 'sign';
  text: string[];
}

export interface ObjSwitch extends ObjBase {
  type: 'switch';
  id: string;
  /** Raetselgruppe, zu der dieser Schalter gehoert. */
  puzzle: string;
  /** Schalter bleibt gedrueckt (sonst Umschalter). */
  latching?: boolean;
  /** Symbol auf dem Schalter - fuer Reihenfolge-Raetsel. */
  symbol?: string;
}

export interface ObjPressurePlate extends ObjBase {
  type: 'plate';
  id: string;
  puzzle: string;
  /** Bleibt gedrueckt, wenn ein Block darauf steht. */
  symbol?: string;
}

export interface ObjPushBlock extends ObjBase {
  type: 'block';
  id: string;
  /** Block faellt in Abgruende und bildet dort eine Bruecke. */
  fillsPits?: boolean;
}

export interface ObjDoorGate extends ObjBase {
  type: 'gate';
  id: string;
  /** Oeffnet sich, wenn dieses Raetsel geloest ist. */
  puzzle?: string;
  /** Oder wenn diese Bedingung erfuellt ist. */
  opensIf?: Condition;
  /** Ausrichtung des Tores. */
  orientation?: 'h' | 'v';
}

export interface ObjPickup extends ObjBase {
  type: 'pickup';
  id: string;
  item: string;
  count?: number;
  /** Nur mit Schnurrimpuls sichtbar. */
  hidden?: boolean;
}

export interface ObjSavePoint extends ObjBase {
  type: 'save';
}

export interface ObjMirror extends ObjBase {
  type: 'mirror';
  id: string;
  puzzle: string;
  /** Startausrichtung in Grad (0 = nach Norden). */
  angle: number;
}

export interface ObjTorch extends ObjBase {
  type: 'torch';
  id: string;
  puzzle?: string;
  lit?: boolean;
}

export interface ObjWaterValve extends ObjBase {
  type: 'valve';
  id: string;
  puzzle: string;
  /** Wasserstand, den dieses Ventil setzt. */
  level: number;
}

export interface ObjRuneStone extends ObjBase {
  type: 'rune';
  id: string;
  puzzle: string;
  symbol: string;
}

export interface ObjDecor extends ObjBase {
  type: 'decor';
  sprite: string;
  /** Wird ueber dem Spieler gezeichnet. */
  overhang?: boolean;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

// ---------------------------------------------------------------------------
// Bedingungen (Weltzustand)
// ---------------------------------------------------------------------------

/**
 * Bedingungen werden gegen den Spielzustand geprueft. Sie sind absichtlich
 * einfach gehalten: alles laesst sich als Flag, Quest-Status oder Besitz
 * ausdruecken. Komplexere Logik gehoert in ein Skript, nicht in Daten.
 */
export type Condition =
  | { flag: string; value?: boolean }
  | { hasItem: string; count?: number }
  | { questState: QuestId; state: QuestState }
  | { hasAbility: AbilityId }
  | { puzzleSolved: string }
  | { bossDefeated: string }
  | { secretsFound: number }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

// ---------------------------------------------------------------------------
// Dialoge
// ---------------------------------------------------------------------------

export type SpeakerId = string;

export interface DialogueLine {
  /** Sprecher-ID; bestimmt Portrait und Namensanzeige. */
  speaker: SpeakerId;
  text: string;
  /** Gefuehlslage - beeinflusst das Portrait. */
  mood?: 'neutral' | 'happy' | 'sad' | 'angry' | 'scared' | 'surprised' | 'sly';
  /** Kurze Erschuetterung beim Erscheinen (fuer dramatische Momente). */
  shake?: boolean;
}

export interface DialogueChoice {
  id: string;
  text: string;
  /** Auswahl nur sichtbar, wenn erfuellt. */
  showIf?: Condition;
  /** Effekte bei Auswahl. */
  effects?: Effect[];
  /** Anschlussdialog. */
  then?: DialogueNodeId;
}

export type DialogueNodeId = string;

export interface DialogueNode {
  id: DialogueNodeId;
  lines: DialogueLine[];
  choices?: DialogueChoice[];
  /** Effekte, die nach dem Durchlesen greifen. */
  effects?: Effect[];
  /** Direkt anschliessender Knoten. */
  then?: DialogueNodeId;
}

// ---------------------------------------------------------------------------
// Effekte
// ---------------------------------------------------------------------------

/** Alles, was ein Dialog, Trigger oder Quest-Schritt in der Welt bewirken kann. */
export type Effect =
  | { setFlag: string; value?: boolean }
  | { giveItem: string; count?: number }
  | { takeItem: string; count?: number }
  | { giveCoins: number }
  | { takeCoins: number }
  | { giveAbility: AbilityId }
  | { startQuest: QuestId }
  | { advanceQuest: QuestId; step?: number }
  | { completeQuest: QuestId }
  | { heal: number }
  | { increaseMaxHp: number }
  | { increaseMaxEnergy: number }
  | { increaseAttack: number }
  | { playScript: string }
  | { warp: { to: AreaId; x: number; y: number } }
  | { toast: string; kind?: ToastKind }
  | { unlockMapRegion: RegionId }
  | { solvePuzzle: string };

export type ToastKind = 'item' | 'quest' | 'ability' | 'info' | 'warning';

// ---------------------------------------------------------------------------
// NPCs
// ---------------------------------------------------------------------------

export interface NpcDef {
  id: string;
  name: string;
  /** Aussehen: Fellfarbe und Koerperbau werden daraus generiert. */
  look: CatLook;
  /** Dialogknoten. Der erste passende Eintrag gewinnt - daher Reihenfolge
   *  von speziell nach allgemein sortieren. */
  dialogue: { showIf?: Condition; node: DialogueNodeId }[];
  /** Haendler-Angebot. */
  shop?: { item: string; price: number; stock?: number }[];
  /** Kurzbeschreibung fuer Notizen/Quest-Log. */
  role?: string;
}

export interface CatLook {
  fur: number;
  furDark: number;
  belly: number;
  eye: number;
  /** Fellmuster. */
  pattern?: 'plain' | 'stripes' | 'patch' | 'spots' | 'mask';
  /** Groesse relativ zur Standardkatze. */
  scale?: number;
  /** Accessoire. */
  accessory?: 'none' | 'scarf' | 'hat' | 'apron' | 'crown' | 'bandana' | 'cloak' | 'glasses';
  accessoryColor?: number;
}

// ---------------------------------------------------------------------------
// Gegner
// ---------------------------------------------------------------------------

export type EnemyBehavior =
  | 'chaser' //     laeuft direkt auf den Spieler zu
  | 'wanderer' //   streift umher, greift in Reichweite an
  | 'charger' //    zielt, dann schneller Sturmangriff
  | 'shooter' //    haelt Abstand und schiesst Projektile
  | 'ambusher' //   unsichtbar, bis der Spieler nahe kommt
  | 'orbiter' //    umkreist den Spieler und schlaegt zu
  | 'splitter' //   teilt sich beim Tod in kleinere Gegner
  | 'guard'; //     bleibt am Posten, verfolgt nur kurz

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  attack: number;
  speed: number;
  behavior: EnemyBehavior;
  /** Sichtweite in Weltpixeln. */
  aggroRange: number;
  /** Angriffsreichweite in Weltpixeln. */
  attackRange: number;
  attackCooldownMs: number;
  look: CreatureLook;
  /** Beute beim Besiegen. */
  drops?: { item?: string; coins?: number; chance: number }[];
  /** Erfahrungsaequivalent - erhoeht den Fortschrittsbalken der Region. */
  threat?: number;
  /** Sonderverhalten. */
  projectile?: { speed: number; damage: number; lifetimeMs: number; color: number };
  splitsInto?: string;
  splitCount?: number;
  /** Immun gegen normale Angriffe, bis diese Faehigkeit eingesetzt wurde. */
  weakTo?: AbilityId;
}

export interface CreatureLook {
  /** Grundform der Kreatur. */
  shape: 'cat' | 'blob' | 'spider' | 'wisp' | 'thorn' | 'wraith' | 'mouse' | 'crab' | 'sentinel';
  body: number;
  bodyDark: number;
  eye: number;
  accent: number;
  scale?: number;
  /** Schwebt (kein Bodenschatten, sanftes Auf und Ab). */
  floating?: boolean;
}

// ---------------------------------------------------------------------------
// Bosse
// ---------------------------------------------------------------------------

export interface BossPhase {
  /** Phase beginnt, sobald die HP unter diesen Anteil fallen (1 = Start). */
  hpThreshold: number;
  /** Angriffsmuster dieser Phase, werden zyklisch abgespielt. */
  patterns: BossPattern[];
  /** Ansage beim Phasenwechsel. */
  taunt?: string;
  /** Aendert die Arena (z. B. Dornenfelder, Saeulen). */
  arenaChange?: string;
  /** Geschwindigkeitsfaktor in dieser Phase. */
  speedFactor?: number;
}

export type BossPattern =
  | { kind: 'charge'; windupMs: number; speed: number; damage: number }
  | { kind: 'slam'; windupMs: number; radius: number; damage: number }
  | { kind: 'volley'; count: number; spreadDeg: number; speed: number; damage: number }
  | { kind: 'summon'; enemy: string; count: number }
  | { kind: 'spawnHazard'; hazard: string; count: number; damage: number }
  | { kind: 'dash'; times: number; speed: number; damage: number }
  | { kind: 'beam'; windupMs: number; durationMs: number; damage: number }
  | { kind: 'shield'; durationMs: number; breakWith?: AbilityId }
  | { kind: 'rest'; durationMs: number }
  | { kind: 'teleport'; times: number };

export interface BossDef {
  id: string;
  name: string;
  title: string;
  hp: number;
  attack: number;
  speed: number;
  look: CreatureLook;
  phases: BossPhase[];
  /** Dialog vor dem Kampf. */
  introDialogue?: DialogueNodeId;
  /** Dialog nach dem Sieg. */
  outroDialogue?: DialogueNodeId;
  /** Belohnungen. */
  rewards?: Effect[];
  music?: MusicTrackId;
  /** Erkennbare Schwaeche - Hinweis fuer den Spieler und Kampfmechanik. */
  weakness?: { ability?: AbilityId; whenVulnerable: string; damageMultiplier: number };
}

// ---------------------------------------------------------------------------
// Faehigkeiten
// ---------------------------------------------------------------------------

export type AbilityId =
  | 'kratzsprung'
  | 'schattenpfote'
  | 'schnurrimpuls'
  | 'katzenflink'
  | 'mondkralle';

export interface AbilityDef {
  id: AbilityId;
  name: string;
  description: string;
  /** Kurzer Hinweis, wofuer die Faehigkeit ausserhalb des Kampfes gut ist. */
  worldUse: string;
  energyCost: number;
  cooldownMs: number;
  icon: string;
  color: number;
}

// ---------------------------------------------------------------------------
// Gegenstaende
// ---------------------------------------------------------------------------

export type ItemCategory = 'heal' | 'quest' | 'key' | 'equip' | 'special';

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  /** Nur bei category 'heal'. */
  healAmount?: number;
  energyAmount?: number;
  /** Nur bei category 'equip'. */
  equip?: { attack?: number; maxHp?: number; defense?: number; speed?: number };
  /** Verkaufswert. */
  value?: number;
  stackable?: boolean;
  icon: string;
  color: number;
}

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------

export type QuestId = string;
export type QuestState = 'unknown' | 'active' | 'completed';

export interface QuestStep {
  /** Beschreibung im Questlog. */
  text: string;
  /** Schritt gilt als erfuellt, wenn diese Bedingung wahr ist. */
  done?: Condition;
  /** Ort-Hinweis fuer die Karte. */
  hintArea?: AreaId;
}

export interface QuestDef {
  id: QuestId;
  name: string;
  /** Hauptquests treiben die Geschichte, Nebenquests sind optional. */
  kind: 'main' | 'side';
  /** Kurzbeschreibung im Log. */
  summary: string;
  steps: QuestStep[];
  /** Belohnung bei Abschluss. */
  rewards?: Effect[];
  /** Region, in der die Quest verankert ist. */
  region: RegionId;
  /** Auftraggeber. */
  giver?: string;
}

// ---------------------------------------------------------------------------
// Musik
// ---------------------------------------------------------------------------

export type MusicTrackId =
  | 'title'
  | 'village'
  | 'forest'
  | 'mountain'
  | 'harbor'
  | 'lake'
  | 'shadow'
  | 'castle'
  | 'dungeon'
  | 'boss'
  | 'finale'
  | 'sad'
  | 'victory'
  | 'credits';

// ---------------------------------------------------------------------------
// Skripte (Cutscenes)
// ---------------------------------------------------------------------------

/**
 * Skripte sind kleine Sequenzen, die die Kamera und Figuren steuern.
 * Sie sind bewusst als Daten modelliert, damit Story-Momente ohne neuen
 * Spielcode entstehen koennen.
 */
export type ScriptStep =
  | { do: 'dialogue'; node: DialogueNodeId }
  | { do: 'wait'; ms: number }
  | { do: 'move'; who: 'player' | 'pookie' | string; toX: number; toY: number; speed?: number }
  | { do: 'face'; who: 'player' | 'pookie' | string; dir: Direction }
  | { do: 'spawn'; npc: string; x: number; y: number; as?: string }
  | { do: 'despawn'; who: string }
  | { do: 'camera'; toX?: number; toY?: number; follow?: 'player' | string; ms?: number }
  | { do: 'shake'; ms: number; intensity?: number }
  | { do: 'flash'; color?: number; ms?: number }
  | { do: 'fade'; to: 'black' | 'clear'; ms?: number }
  | { do: 'music'; track: MusicTrackId | 'stop' }
  | { do: 'sfx'; sound: string }
  | { do: 'effects'; effects: Effect[] }
  | { do: 'warp'; to: AreaId; x: number; y: number }
  | { do: 'boss'; boss: string; x: number; y: number }
  | { do: 'credits'; ending: 'true' | 'good' };

export interface ScriptDef {
  id: string;
  steps: ScriptStep[];
  /** Skript laeuft nur, wenn erfuellt. */
  showIf?: Condition;
  /** Spieler kann waehrenddessen nicht steuern. */
  cutscene?: boolean;
}
