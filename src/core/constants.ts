/**
 * Zentrale Konstanten des Spiels.
 *
 * Alle Groessen sind in Weltpixeln angegeben. Die Kamera skaliert das Bild
 * anschliessend auf die tatsaechliche Bildschirmgroesse (siehe camera.ts),
 * damit auf jedem Geraet ungefaehr gleich viel Welt sichtbar ist.
 */

/** Kantenlaenge einer Kachel in Weltpixeln. */
export const TILE = 32;

/**
 * Sichtfeld-Zielgroesse in Kacheln. Die Kamera waehlt ihren Zoom so, dass
 * mindestens so viel Welt sichtbar bleibt - egal ob Hoch- oder Querformat.
 * Damit ist das Spiel in beiden Orientierungen spielbar, ohne dass wir den
 * Spieler zum Drehen des Geraets zwingen.
 */
export const MIN_VISIBLE_TILES_X = 15;
export const MIN_VISIBLE_TILES_Y = 11;

/** Obergrenze fuer den Zoom, damit die Welt auf Tablets nicht winzig wirkt. */
export const MAX_CAMERA_ZOOM = 4;
export const MIN_CAMERA_ZOOM = 1;

/** Bewegungsgeschwindigkeit in Weltpixeln pro Sekunde. */
export const PLAYER_SPEED = 110;
export const PLAYER_SPRINT_MULTIPLIER = 1.75;

/** Kollisionskoerper des Spielers - schmaler als die Grafik, damit sich der
 *  Charakter angenehm durch Tueren und Luecken bewegt ("forgiving hitbox"). */
export const PLAYER_BODY_WIDTH = 16;
export const PLAYER_BODY_HEIGHT = 12;

/** Reichweite, in der Objekte per Interaktionsknopf ansprechbar sind. */
export const INTERACT_RANGE = 34;

/** Kampfwerte. */
export const PLAYER_BASE_MAX_HP = 60;
export const PLAYER_BASE_ATTACK = 8;
export const ATTACK_COOLDOWN_MS = 340;
export const DODGE_COOLDOWN_MS = 700;
export const DODGE_DURATION_MS = 220;
export const DODGE_SPEED = 300;
export const INVULNERABLE_AFTER_HIT_MS = 650;
export const BLOCK_DAMAGE_REDUCTION = 0.75;

/** Energie fuer Spezialfaehigkeiten. */
export const PLAYER_BASE_MAX_ENERGY = 40;
export const ENERGY_REGEN_PER_SECOND = 3.2;

/** Speicherschluessel im localStorage. */
export const SAVE_KEY = 'mauseri.save.v1';
export const SETTINGS_KEY = 'mauseri.settings.v1';

/** Autosave-Intervall in Millisekunden. */
export const AUTOSAVE_INTERVAL_MS = 20_000;

/** Tiefen-Ebenen (z-Index) innerhalb der Phaser-Szene. */
export const DEPTH = {
  ground: 0,
  groundDetail: 5,
  shadow: 8,
  /** Entitaeten werden zusaetzlich nach ihrer Y-Position sortiert. */
  entities: 10,
  overhang: 5000,
  weather: 6000,
  fade: 7000,
} as const;
