/**
 * Aufsetzen und Abbauen der Phaser-Instanz.
 *
 * Skalierung: Phaser bekommt die volle Fenstergroesse (Scale.RESIZE) und die
 * Kamera regelt den Zoom (siehe WorldScene.applyZoom). Der Vorteil gegenueber
 * einer festen Aufloesung mit FIT: es gibt keine schwarzen Balken, und Hoch-
 * wie Querformat funktionieren ohne Sonderfall.
 */

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';

let game: Phaser.Game | null = null;

export function createGame(parent: HTMLElement): Phaser.Game {
  if (game) return game;

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#171126',
    // Pixelgrafik darf nicht weichgezeichnet werden.
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%',
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
        // Feste Schrittweite haelt die Kollisionen auf schwachen Geraeten
        // berechenbar, auch wenn die Bildrate schwankt.
        fps: 60,
        fixedStep: true,
      },
    },
    render: {
      antialias: false,
      powerPreference: 'high-performance',
    },
    // Auf Handys ist der Bildlauf der Seite unerwuenscht.
    input: {
      activePointers: 3,
    },
    scene: [BootScene, WorldScene],
  });

  return game;
}

export function getGame(): Phaser.Game | null {
  return game;
}

export function getWorldScene(): WorldScene | null {
  const scene = game?.scene.getScene('World');
  return (scene as WorldScene) ?? null;
}

export function destroyGame(): void {
  game?.destroy(true);
  game = null;
}
