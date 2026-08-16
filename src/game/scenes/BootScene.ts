/**
 * Startszene.
 *
 * Erzeugt alle Texturen. Da nichts von der Festplatte geladen wird, gibt es
 * keinen Ladebalken im klassischen Sinn - die Texturerzeugung dauert auf einem
 * Mittelklasse-Handy zusammen unter einer halben Sekunde. Trotzdem wird sie
 * ueber mehrere Bilder verteilt, damit der Browser zwischendurch zeichnen kann
 * und der Startbildschirm nicht einfriert.
 */

import Phaser from 'phaser';
import { bus } from '@/core/EventBus';
import { generateObjectTextures } from '../art/objectTextures';
import { generateAllTilesets } from '../art/tileTextures';
import { ensureCatTexture } from '../art/characterTextures';
import { MAUSERI_LOOK } from '../entities/Player';
import { POOKIE_LOOK } from '../entities/Companion';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create(): void {
    // Schritt 1: Objekte und Effekte (schnell, wird sofort gebraucht)
    generateObjectTextures(this.textures);

    // Schritt 2: die beiden Hauptfiguren
    ensureCatTexture(this.textures, MAUSERI_LOOK);
    ensureCatTexture(this.textures, POOKIE_LOOK);

    // Schritt 3: die Tilesets aller Regionen. Das ist der teuerste Teil,
    // deshalb einen Frame spaeter - so verschwindet der Startbildschirm
    // nicht mitten in einer blockierenden Schleife.
    this.time.delayedCall(0, () => {
      generateAllTilesets(this.textures);
      bus.emit('game:ready');
      this.scene.start('World');
    });
  }
}
