/**
 * Vollbild.
 *
 * Auf dem Handy ist das kein Luxus: die Adressleiste des Browsers frisst je
 * nach Geraet 60-100px Hoehe, und genau dort sitzt der untere Rand des
 * Spielfelds. Im Vollbild verschwindet sie, und die Steuerung rutscht aus dem
 * Bereich, in dem eine Wischgeste den Browser statt die Katze bewegt.
 *
 * Zwei Eigenheiten, die das Ganze unangenehmer machen als es klingt:
 *
 *  - Safari auf dem iPhone kennt die Fullscreen-API nicht. Dort meldet dieser
 *    Haken `unterstuetzt: false`; der Weg zum randlosen Spiel fuehrt ueber
 *    "Zum Home-Bildschirm" (die App ist als PWA installierbar).
 *  - Aeltere WebKit-Browser haben nur die `webkit`-Varianten. Die werden hier
 *    mitgenommen, weil sie auf genau den Geraeten liegen, auf denen der
 *    Platzgewinn am meisten zaehlt.
 */

import { useCallback, useEffect, useState } from 'react';

/** Die WebKit-Schreibweisen, die manche Browser statt der Standardnamen haben. */
interface WebkitDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
}

interface WebkitElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

function istVollbild(): boolean {
  const doc = document as WebkitDocument;
  return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
}

function wirdUnterstuetzt(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement as WebkitElement;
  return Boolean(el.requestFullscreen ?? el.webkitRequestFullscreen);
}

export function useFullscreen() {
  const [aktiv, setAktiv] = useState(istVollbild);
  const [unterstuetzt] = useState(wirdUnterstuetzt);

  // Der Zustand muss am Browser haengen, nicht am eigenen Knopf: der Spieler
  // kann das Vollbild jederzeit mit Escape oder einer Wischgeste verlassen,
  // ohne dass unser Knopf davon etwas mitbekaeme.
  useEffect(() => {
    const beiWechsel = () => setAktiv(istVollbild());
    document.addEventListener('fullscreenchange', beiWechsel);
    document.addEventListener('webkitfullscreenchange', beiWechsel);
    return () => {
      document.removeEventListener('fullscreenchange', beiWechsel);
      document.removeEventListener('webkitfullscreenchange', beiWechsel);
    };
  }, []);

  const umschalten = useCallback(async () => {
    const doc = document as WebkitDocument;
    const el = document.documentElement as WebkitElement;
    try {
      if (istVollbild()) {
        await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
      } else {
        await (el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.());
        // Wenn das Geraet sich drehen laesst, quer festhalten - ein
        // Top-Down-Spiel hat im Querformat spuerbar mehr Sichtfeld.
        // Schlaegt fehl, sobald der Nutzer die Drehsperre selbst gesetzt hat;
        // das ist dann seine Entscheidung und kein Fehler.
        try {
          await screen.orientation?.lock?.('landscape');
        } catch {
          /* Drehsperre ist Sache des Nutzers. */
        }
      }
    } catch (fehler) {
      // Der Browser darf Vollbild ablehnen (etwa ohne echte Nutzergeste).
      // Das ist kein Grund, das Spiel anzuhalten.
      console.warn('Vollbild nicht moeglich:', fehler);
    }
  }, []);

  return { aktiv, unterstuetzt, umschalten };
}
