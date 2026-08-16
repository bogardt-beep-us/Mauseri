/**
 * Dialogfenster.
 *
 * Text laeuft zeichenweise ein. Ein Tippen laesst den Rest der Zeile sofort
 * erscheinen, das naechste Tippen geht weiter - das ist die Konvention aus
 * klassischen Rollenspielen und braucht keine Erklaerung.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DialoguePayload } from '@/core/EventBus';
import { getSpeaker, isNarrator } from '@/data/speakers';
import { renderPortrait } from '@/game/art/characterTextures';
import { audio } from '@/game/systems/AudioSystem';

/**
 * Wichtig: Diese Komponente schliesst sich NICHT selbst.
 *
 * `onDone` kann unmittelbar den naechsten Dialogknoten starten (Dialogketten
 * ueber `then`). Wuerde die Box danach noch ein `onClose` ausloesen, loeschte
 * sie den gerade begonnenen Folgedialog wieder - die Sequenz bliebe haengen
 * und mit ihr die gesperrte Steuerung. Das Schliessen uebernimmt deshalb
 * ausschliesslich das Ereignis `dialogue:end`.
 */
interface Props {
  payload: DialoguePayload;
}

/** Millisekunden pro Zeichen. */
const TYPE_SPEED = 22;

export function DialogueBox({ payload }: Props) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const timerRef = useRef<number | null>(null);

  const line = payload.lines[lineIndex];
  const isLastLine = lineIndex >= payload.lines.length - 1;
  const fullyTyped = line !== undefined && charCount >= line.text.length;

  // Portraits werden nur bei Wechsel neu gezeichnet.
  const portrait = useMemo(() => {
    if (!line) return null;
    const speaker = getSpeaker(line.speaker);
    if (isNarrator(line.speaker)) return null;
    return renderPortrait(speaker.look, line.mood ?? 'neutral', 96);
  }, [line]);

  const speakerName = line ? getSpeaker(line.speaker).name : '';

  // Schreibmaschine
  useEffect(() => {
    if (!line) return;
    setCharCount(0);
    let count = 0;

    const tick = () => {
      count += 1;
      setCharCount(count);
      if (count % 3 === 0) audio.play('text');
      if (count < line.text.length) {
        timerRef.current = window.setTimeout(tick, TYPE_SPEED);
      }
    };
    timerRef.current = window.setTimeout(tick, TYPE_SPEED);

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [line]);

  const advance = useCallback(() => {
    if (!line) return;

    // Erst den Text vervollstaendigen ...
    if (charCount < line.text.length) {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      setCharCount(line.text.length);
      return;
    }

    // ... dann weiterblaettern.
    if (!isLastLine) {
      setLineIndex((index) => index + 1);
      audio.play('select');
      return;
    }

    if (payload.choices && payload.choices.length > 0) {
      setShowChoices(true);
      return;
    }

    audio.play('confirm');
    payload.onDone?.();
  }, [charCount, isLastLine, line, payload]);

  // Weiterschalten auch per Tastatur
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (['Space', 'Enter', 'KeyE', 'KeyK'].includes(event.code)) {
        event.preventDefault();
        if (!showChoices) advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, showChoices]);

  const chooseOption = (id: string) => {
    audio.play('confirm');
    payload.onDone?.(id);
  };

  if (!line) return null;

  return (
    <div
      className="dialog-schicht"
      onPointerDown={(event) => {
        // Klicks auf die Auswahlknoepfe nicht abfangen.
        if ((event.target as HTMLElement).closest('.dialog-auswahl')) return;
        if (!showChoices) advance();
      }}
    >
      <div className="dialog-box">
        <div className="dialog-kopf">
          {portrait ? (
            <img className="dialog-portrait" src={portrait} alt="" />
          ) : (
            <div className="dialog-portrait" aria-hidden="true" />
          )}
          <div className="dialog-name">{speakerName || payload.speaker}</div>
        </div>

        <div className={`dialog-text${isNarrator(line.speaker) ? ' erzaehler' : ''}`}>
          {line.text.slice(0, charCount)}
        </div>

        {showChoices && payload.choices ? (
          <div className="dialog-auswahl">
            {payload.choices.map((choice) => (
              <button key={choice.id} onPointerDown={() => chooseOption(choice.id)}>
                {choice.text}
              </button>
            ))}
          </div>
        ) : (
          fullyTyped && <div className="dialog-weiter">▼</div>
        )}
      </div>
    </div>
  );
}
