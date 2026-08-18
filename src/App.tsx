/**
 * Rahmen der Anwendung.
 *
 * Verantwortlich fuer den Wechsel zwischen Titelbild, Spiel, Menue, Dialog,
 * Bildschirmtod und Abspann - und dafuer, die Phaser-Instanz genau einmal
 * aufzubauen und beim Verlassen wieder abzuraeumen.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { bus, type DialoguePayload, type HudSnapshot } from '@/core/EventBus';
import { createGame, destroyGame, getWorldScene } from '@/game/PhaserGame';
import { audio } from '@/game/systems/AudioSystem';
import { clearSavedGame, gameState } from '@/state/gameState';
import type { AbilityId } from '@/data/types';

import { AreaBanner, BossBar, Cinematics, Hud, Toasts } from './ui/Hud';
import { Credits } from './ui/Credits';
import { DialogueBox } from './ui/DialogueBox';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { GameMenu, type MenuTab } from './ui/GameMenu';
import { GameOver } from './ui/GameOver';
import { TitleScreen } from './ui/TitleScreen';
import { TouchControls } from './ui/TouchControls';
import { useBusEvent } from './ui/useBus';

type Screen = 'titel' | 'spiel';

const LEERER_HUD: HudSnapshot = {
  hp: 0,
  maxHp: 1,
  energy: 0,
  maxEnergy: 1,
  coins: 0,
  regionName: '',
  areaName: '',
  abilities: [],
};

export function App() {
  const [screen, setScreen] = useState<Screen>('titel');
  const [hud, setHud] = useState<HudSnapshot>(LEERER_HUD);
  // Jeder Dialogknoten bekommt einen eigenen Schluessel, damit die Dialogbox
  // bei einer Kette (node -> then -> then) wirklich neu aufgesetzt wird und
  // nicht mit dem Textstand des vorigen Knotens weiterlaeuft.
  const [dialog, setDialog] = useState<{ payload: DialoguePayload; key: number } | null>(null);
  const dialogKey = useRef(0);
  const [menue, setMenue] = useState<MenuTab | null>(null);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [abspann, setAbspann] = useState<'true' | 'good' | null>(null);
  const [cutscene, setCutscene] = useState(false);
  const [gewaehlteFaehigkeit, setGewaehlteFaehigkeit] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const spielGestartet = useRef(false);

  // --- Ereignisse aus dem Spiel -------------------------------------------

  useBusEvent('hud:update', setHud);
  useBusEvent('dialogue:start', (payload) => {
    dialogKey.current += 1;
    setDialog({ payload, key: dialogKey.current });
  });
  useBusEvent('dialogue:end', () => setDialog(null));
  useBusEvent('game:over', ({ cause }) => setGameOver(cause));
  useBusEvent('cutscene:start', () => setCutscene(true));
  useBusEvent('cutscene:end', () => setCutscene(false));
  useBusEvent('credits:show', ({ ending }) => setAbspann(ending));

  // --- Spiel starten -------------------------------------------------------

  const spielStarten = useCallback((neu: boolean) => {
    if (neu) {
      clearSavedGame();
      gameState.reset();
    } else if (!gameState.load()) {
      // Kein gueltiger Spielstand - dann eben neu.
      gameState.reset();
    }

    setScreen('spiel');
  }, []);

  // Phaser erst aufbauen, wenn der Spielbildschirm sichtbar ist.
  useEffect(() => {
    if (screen !== 'spiel' || !canvasRef.current || spielGestartet.current) return;
    spielGestartet.current = true;
    createGame(canvasRef.current);
    return () => {
      // Nur beim endgueltigen Verlassen abraeumen.
    };
  }, [screen]);

  const zumTitel = useCallback(() => {
    destroyGame();
    spielGestartet.current = false;
    setScreen('titel');
    setMenue(null);
    setDialog(null);
    setGameOver(null);
    setAbspann(null);
    setCutscene(false);
    setHud(LEERER_HUD);
    audio.playMusic('title');
  }, []);

  // --- Menue ---------------------------------------------------------------

  const menueOeffnen = useCallback((tab: MenuTab = 'inventar') => {
    audio.play('select');
    setMenue(tab);
    bus.emit('ui:openMenu', tab);
  }, []);

  const menueSchliessen = useCallback(() => {
    audio.play('cancel');
    setMenue(null);
    bus.emit('ui:openMenu', null);
  }, []);

  // Escape oeffnet und schliesst das Menue.
  useEffect(() => {
    if (screen !== 'spiel') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Escape') return;
      event.preventDefault();
      if (dialog) return;
      if (menue) menueSchliessen();
      else menueOeffnen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, menue, menueOeffnen, menueSchliessen, screen]);

  // --- Aktionen ------------------------------------------------------------

  const gegenstandBenutzen = useCallback((itemId: string) => {
    getWorldScene()?.useItem(itemId);
  }, []);

  const faehigkeitEinsetzen = useCallback((id: string) => {
    getWorldScene()?.useAbility(id as AbilityId);
  }, []);

  const faehigkeitWaehlen = useCallback((id: string) => {
    setGewaehlteFaehigkeit(id);
    const scene = getWorldScene();
    if (scene) scene.selectedAbility = id as AbilityId;
  }, []);

  const speichern = useCallback(() => {
    if (gameState.save()) {
      audio.play('save');
      bus.emit('toast', { text: 'Gespeichert.', kind: 'info' });
    } else {
      bus.emit('toast', { text: 'Speichern nicht moeglich.', kind: 'warning' });
    }
  }, []);

  const wiederbeleben = useCallback(() => {
    setGameOver(null);
    getWorldScene()?.respawn();
  }, []);

  // --- Darstellung ---------------------------------------------------------

  if (screen === 'titel') {
    return (
      <div className="app">
        <TitleScreen onNewGame={() => spielStarten(true)} onContinue={() => spielStarten(false)} />
      </div>
    );
  }

  return (
    <div className={`app${cutscene ? ' cutscene' : ''}`}>
      <div className="game-canvas" ref={canvasRef} />

      <div className="ui-layer">
        <Hud hud={hud} onOpenMenu={() => menueOeffnen()} />
        <BossBar />
        <Toasts />
        <AreaBanner />
        <Cinematics active={cutscene} />

        {/* Eigene Fehlergrenze: geht in der Steuerung etwas kaputt, darf das
            nicht HUD und Dialog mitreissen. Vorher loeschte ein Fehler im
            Joystick die gesamte Oberflaeche - das Spiel lief weiter, war aber
            nicht mehr bedienbar und sah aus wie abgestuerzt. */}
        <ErrorBoundary bereich="Steuerung">
          <TouchControls
            hud={hud}
            selectedAbility={gewaehlteFaehigkeit}
            onSelectAbility={faehigkeitWaehlen}
            onUseAbility={faehigkeitEinsetzen}
            visible={!dialog && !menue && !gameOver && !abspann && !cutscene}
          />
        </ErrorBoundary>

        {dialog && <DialogueBox key={dialog.key} payload={dialog.payload} />}

        {menue && (
          <GameMenu
            initialTab={menue}
            onClose={menueSchliessen}
            onUseItem={gegenstandBenutzen}
            onSave={speichern}
            onQuit={zumTitel}
          />
        )}

        {gameOver && <GameOver cause={gameOver} onRetry={wiederbeleben} onQuit={zumTitel} />}

        {abspann && <Credits ending={abspann} onFinish={zumTitel} />}
      </div>
    </div>
  );
}
