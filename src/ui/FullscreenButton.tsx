/**
 * Vollbild-Knopf.
 *
 * Steht bewusst an zwei Stellen: im Titelbildschirm und im HUD. Wer Vollbild
 * will, will es vor dem Losspielen - und nicht erst suchen muessen, wenn er
 * schon laeuft.
 *
 * Der Knopf verschwindet NICHT, wenn der Browser kein Vollbild kann. Das war
 * die erste Fassung, und sie war nicht zu unterscheiden von "die Funktion
 * fehlt". Stattdessen erklaert er dann, wie man auf diesem Geraet trotzdem
 * randlos spielt. Ausgeblendet wird er nur, wenn das Spiel bereits als
 * installierte App ohne Browserrahmen laeuft - dort waere er sinnlos.
 */

import { useState } from 'react';
import { useFullscreen } from './useFullscreen';

interface Props {
  /** "icon" fuer das HUD, "text" fuer den Titelbildschirm. */
  variante: 'icon' | 'text';
}

/** Laeuft das Spiel schon ohne Browserrahmen (vom Home-Bildschirm gestartet)? */
function alsAppInstalliert(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return window.matchMedia?.('(display-mode: standalone)').matches || iosStandalone;
}

export function FullscreenButton({ variante }: Props) {
  const { aktiv, unterstuetzt, umschalten } = useFullscreen();
  const [hinweis, setHinweis] = useState(false);
  const [installiert] = useState(alsAppInstalliert);

  if (installiert) return null;

  const beiKlick = () => {
    if (unterstuetzt) void umschalten();
    else setHinweis((s) => !s);
  };

  const beschriftung = aktiv ? 'Vollbild verlassen' : 'Vollbild';

  return (
    <>
      {variante === 'icon' ? (
        <button
          className="icon-knopf"
          onClick={beiKlick}
          aria-label={beschriftung}
          aria-pressed={aktiv}
        >
          {aktiv ? '⤢' : '⛶'}
        </button>
      ) : (
        <button
          className="btn btn-leise"
          onClick={beiKlick}
          aria-label={beschriftung}
          aria-pressed={aktiv}
        >
          <span aria-hidden="true">{aktiv ? '⤢' : '⛶'}</span> {beschriftung}
        </button>
      )}

      {hinweis && (
        <p className="vollbild-hinweis" role="status">
          Dieser Browser kann kein echtes Vollbild — auf dem iPhone kann das
          keine Seite. Randlos wird es so: <strong>Teilen</strong> (das Symbol
          mit dem Pfeil nach oben) → <strong>Zum Home-Bildschirm</strong>.
          Mauseri startet dann wie eine App, ganz ohne Browserleisten.
        </p>
      )}
    </>
  );
}
