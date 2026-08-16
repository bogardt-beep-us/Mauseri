/**
 * Titelbildschirm.
 *
 * Erfuellt nebenbei eine technische Aufgabe: Browser erlauben Ton erst nach
 * einer Nutzergeste. Der erste Tipp hier entsperrt den AudioContext, damit die
 * Musik direkt mit dem Spiel einsetzt und nicht stumm bleibt.
 */

import { useEffect, useState } from 'react';
import { audio } from '@/game/systems/AudioSystem';
import { hasSavedGame } from '@/state/gameState';

interface Props {
  onNewGame: () => void;
  onContinue: () => void;
}

export function TitleScreen({ onNewGame, onContinue }: Props) {
  const [saveVorhanden] = useState(() => hasSavedGame());
  const [tonBereit, setTonBereit] = useState(false);

  // Musik startet, sobald der Nutzer irgendetwas beruehrt.
  useEffect(() => {
    const entsperren = () => {
      audio.unlock();
      audio.playMusic('title');
      setTonBereit(true);
    };
    window.addEventListener('pointerdown', entsperren, { once: true });
    window.addEventListener('keydown', entsperren, { once: true });
    return () => {
      window.removeEventListener('pointerdown', entsperren);
      window.removeEventListener('keydown', entsperren);
    };
  }, []);

  const starten = (fortsetzen: boolean) => {
    audio.unlock();
    audio.play('confirm');
    if (fortsetzen) onContinue();
    else onNewGame();
  };

  return (
    <div className="title-screen">
      <h1>Mauseri</h1>
      <p className="untertitel">Das Geheimnis der Katzenwelt</p>

      <div className="title-menu">
        {saveVorhanden && (
          <button className="btn btn-primaer" onClick={() => starten(true)}>
            Spiel fortsetzen
          </button>
        )}
        <button className={saveVorhanden ? 'btn' : 'btn btn-primaer'} onClick={() => starten(false)}>
          Neues Spiel
        </button>
      </div>

      <p className="title-hinweis">
        Miaurien war einmal ein friedliches Reich. Dann fand Koenigin Nyxara
        das Herz der Nacht.
        <br />
        <br />
        Handy: links ziehen zum Laufen, rechts die Knoepfe. Am Rechner:{' '}
        <strong>WASD</strong> laufen, <strong>Leertaste</strong> angreifen,{' '}
        <strong>E</strong> reden.
        {!tonBereit && (
          <>
            <br />
            <br />
            <em>Tippe irgendwo, um den Ton zu aktivieren.</em>
          </>
        )}
      </p>
    </div>
  );
}
