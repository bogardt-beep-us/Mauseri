/**
 * Pausenmenue mit Inventar, Questlog, Weltkarte und Einstellungen.
 *
 * Alles in einem Fenster mit Reitern: auf dem Handy ist jedes zusaetzliche
 * Menue ein zusaetzlicher Fehlgriff. Die Reiter sind 44px hoch und damit
 * sicher treffbar.
 */

import { useMemo, useState } from 'react';
import { ABILITIES } from '@/data/abilities';
import { CATEGORY_LABEL, CATEGORY_ORDER, ITEMS } from '@/data/items';
import { QUESTS } from '@/data/quests';
import { REGIONS, REGION_ORDER } from '@/data/regions';
import { AREAS } from '@/data/areas';
import { gameState, clearSavedGame } from '@/state/gameState';
import { audio } from '@/game/systems/AudioSystem';
import { renderItemIcon, type ItemIconId } from '@/game/art/objectTextures';
import { useGameState } from './useBus';

export type MenuTab = 'inventar' | 'quests' | 'karte' | 'einstellungen';

interface Props {
  initialTab?: MenuTab;
  onClose: () => void;
  onUseItem: (itemId: string) => void;
  onSave: () => void;
  onQuit: () => void;
}

export function GameMenu({ initialTab = 'inventar', onClose, onUseItem, onSave, onQuit }: Props) {
  const [tab, setTab] = useState<MenuTab>(initialTab);
  const state = useGameState();

  return (
    <div className="menue-schicht">
      <div className="menue">
        <div className="menue-reiter" role="tablist">
          {(
            [
              ['inventar', 'Beutel'],
              ['quests', 'Aufgaben'],
              ['karte', 'Karte'],
              ['einstellungen', 'Optionen'],
            ] as [MenuTab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? 'aktiv' : ''}
              onClick={() => {
                audio.play('select');
                setTab(id);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="menue-inhalt">
          {tab === 'inventar' && <Inventar onUseItem={onUseItem} />}
          {tab === 'quests' && <Questlog />}
          {tab === 'karte' && <Weltkarte />}
          {tab === 'einstellungen' && <Einstellungen onQuit={onQuit} />}
        </div>

        <div className="menue-fuss">
          <button className="btn btn-klein" onClick={onSave}>
            Speichern
          </button>
          <button className="btn btn-klein btn-primaer" onClick={onClose}>
            Weiter
          </button>
        </div>
      </div>

      {/* Spielzeit und Fortschritt als unaufdringliche Fusszeile */}
      <span className="visually-hidden">
        Spielzeit {formatPlaytime(state.playtimeMs)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inventar
// ---------------------------------------------------------------------------

function Inventar({ onUseItem }: { onUseItem: (itemId: string) => void }) {
  const state = useGameState();
  const [selected, setSelected] = useState<string | null>(null);

  const gruppen = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      entries: state.inventory
        .filter((entry) => ITEMS[entry.item]?.category === category)
        .sort((a, b) => (ITEMS[a.item]?.name ?? '').localeCompare(ITEMS[b.item]?.name ?? '')),
    })).filter((group) => group.entries.length > 0);
  }, [state.inventory]);

  const selectedItem = selected ? ITEMS[selected] : null;
  const istAngelegt = selected
    ? state.equipped.weapon === selected || state.equipped.charm === selected
    : false;

  return (
    <>
      {/* Faehigkeiten zuerst - sie sind der eigentliche Fortschritt */}
      {state.abilities.length > 0 && (
        <div className="inv-gruppe">
          <div className="inv-titel">Faehigkeiten</div>
          <div className="inv-liste">
            {state.abilities.map((id) => {
              const def = ABILITIES[id];
              return (
                <div key={id} className="inv-eintrag" title={def.description}>
                  <img src={renderItemIcon(def.icon as ItemIconId, def.color, 32)} alt="" />
                  <div>
                    <div className="inv-name">{def.name}</div>
                    <div className="inv-anzahl">{def.energyCost} Energie</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {gruppen.length === 0 && state.abilities.length === 0 && (
        <div className="leer-hinweis">Dein Beutel ist leer.</div>
      )}

      {gruppen.map((group) => (
        <div key={group.category} className="inv-gruppe">
          <div className="inv-titel">{CATEGORY_LABEL[group.category]}</div>
          <div className="inv-liste">
            {group.entries.map((entry) => {
              const item = ITEMS[entry.item];
              if (!item) return null;
              const angelegt =
                state.equipped.weapon === entry.item || state.equipped.charm === entry.item;
              return (
                <button
                  key={entry.item}
                  className={`inv-eintrag${angelegt ? ' angelegt' : ''}`}
                  onClick={() => {
                    audio.play('select');
                    setSelected(entry.item);
                  }}
                >
                  <img src={renderItemIcon(item.icon as ItemIconId, item.color, 32)} alt="" />
                  <div>
                    <div className="inv-name">{item.name}</div>
                    {entry.count > 1 && <div className="inv-anzahl">x{entry.count}</div>}
                    {angelegt && <div className="inv-anzahl">angelegt</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedItem && (
        <div className="inv-detail">
          <strong>{selectedItem.name}</strong>
          <p style={{ margin: '0.4rem 0 0.7rem' }}>{selectedItem.description}</p>
          {(selectedItem.category === 'heal' || selectedItem.category === 'equip') && (
            <button
              className="btn btn-klein btn-primaer"
              onClick={() => {
                onUseItem(selectedItem.id);
                if (selectedItem.category === 'heal' && gameState.itemCount(selectedItem.id) <= 1) {
                  setSelected(null);
                }
              }}
            >
              {selectedItem.category === 'heal' ? 'Benutzen' : istAngelegt ? 'Ablegen' : 'Anlegen'}
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Questlog
// ---------------------------------------------------------------------------

function Questlog() {
  const state = useGameState();

  const aktive = Object.values(QUESTS).filter((q) => state.quests[q.id]?.state === 'active');
  const fertige = Object.values(QUESTS).filter((q) => state.quests[q.id]?.state === 'completed');

  if (aktive.length === 0 && fertige.length === 0) {
    return <div className="leer-hinweis">Noch keine Aufgaben.</div>;
  }

  return (
    <>
      {aktive.length > 0 && <div className="inv-titel">Offen</div>}
      {aktive.map((quest) => {
        const step = state.quests[quest.id]?.step ?? 0;
        return (
          <div key={quest.id} className={`quest ${quest.kind === 'main' ? 'haupt' : 'neben'}`}>
            <div>
              <span className="quest-name">{quest.name}</span>
              <span className="quest-art">{quest.kind === 'main' ? 'Hauptweg' : 'Nebenweg'}</span>
            </div>
            <p className="quest-summary">{quest.summary}</p>
            {quest.steps.map((s, index) => (
              <div
                key={index}
                className={`quest-schritt ${index < step ? 'erledigt' : 'offen'}`}
              >
                <span>{s.text}</span>
              </div>
            ))}
            {quest.steps[step]?.hintArea && AREAS[quest.steps[step]!.hintArea!] && (
              <div className="quest-summary" style={{ marginTop: '0.4rem', marginBottom: 0 }}>
                Ort: {AREAS[quest.steps[step]!.hintArea!]!.name}
              </div>
            )}
          </div>
        );
      })}

      {fertige.length > 0 && (
        <div className="inv-titel" style={{ marginTop: '1.2rem' }}>
          Abgeschlossen
        </div>
      )}
      {fertige.map((quest) => (
        <div key={quest.id} className="quest fertig">
          <span className="quest-name">{quest.name}</span>
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Weltkarte
// ---------------------------------------------------------------------------

function Weltkarte() {
  const state = useGameState();
  const aktuelleRegion = AREAS[state.area]?.region;

  const besuchteOrte = state.visitedAreas.length;
  const gesamtOrte = Object.keys(AREAS).length;

  return (
    <>
      <div className="karte">
        {/* Verbindungslinien zwischen benachbarten Regionen */}
        {REGION_ORDER.slice(0, -1).map((id, index) => {
          const from = REGIONS[id];
          const to = REGIONS[REGION_ORDER[index + 1]!];
          const bekannt =
            state.knownRegions.includes(id) && state.knownRegions.includes(to.id);
          if (!bekannt) return null;

          const dx = (to.mapPosition.x - from.mapPosition.x) * 100;
          const dy = (to.mapPosition.y - from.mapPosition.y) * 100;
          const laenge = Math.hypot(dx, dy);
          const winkel = (Math.atan2(dy, dx) * 180) / Math.PI;

          return (
            <div
              key={id}
              className="karte-linie"
              style={{
                left: `${from.mapPosition.x * 100}%`,
                top: `${from.mapPosition.y * 100}%`,
                width: `${laenge}%`,
                transform: `rotate(${winkel}deg)`,
              }}
            />
          );
        })}

        {REGION_ORDER.map((id) => {
          const region = REGIONS[id];
          const bekannt = state.knownRegions.includes(id);
          const aktuell = aktuelleRegion === id;
          return (
            <div
              key={id}
              className={[
                'karte-region',
                bekannt ? 'bekannt' : 'unbekannt',
                aktuell ? 'aktuell' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                left: `${region.mapPosition.x * 100}%`,
                top: `${region.mapPosition.y * 100}%`,
              }}
            >
              <div className="karte-punkt" />
              <div className="karte-name">{bekannt ? region.name : '???'}</div>
            </div>
          );
        })}
      </div>

      <div className="karte-info">
        {aktuelleRegion && REGIONS[aktuelleRegion] && (
          <p style={{ margin: '0 0 0.6rem' }}>{REGIONS[aktuelleRegion].blurb}</p>
        )}
        <p style={{ margin: 0, opacity: 0.65 }}>
          Orte entdeckt: {besuchteOrte} / {gesamtOrte}
          {state.secrets.length > 0 && ` · Geheimnisse: ${state.secrets.length}`}
        </p>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Einstellungen
// ---------------------------------------------------------------------------

function Einstellungen({ onQuit }: { onQuit: () => void }) {
  const [, forceRender] = useState(0);
  const settings = audio.settings;

  const setVolume = (kind: 'master' | 'music' | 'sfx', value: number) => {
    audio.setVolume(kind, value);
    forceRender((n) => n + 1);
  };

  return (
    <>
      <div className="einstellung">
        <label htmlFor="vol-master">Gesamtlautstaerke</label>
        <input
          id="vol-master"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.master}
          onChange={(event) => setVolume('master', Number(event.target.value))}
        />
      </div>
      <div className="einstellung">
        <label htmlFor="vol-music">Musik</label>
        <input
          id="vol-music"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.music}
          onChange={(event) => setVolume('music', Number(event.target.value))}
        />
      </div>
      <div className="einstellung">
        <label htmlFor="vol-sfx">Klangeffekte</label>
        <input
          id="vol-sfx"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.sfx}
          onChange={(event) => setVolume('sfx', Number(event.target.value))}
        />
      </div>

      <div className="schalter">
        <span>Weniger Effekte (schont den Akku)</span>
        <button
          className={`schalter-knopf${settings.reducedEffects ? ' an' : ''}`}
          onClick={() => {
            audio.settings.reducedEffects = !audio.settings.reducedEffects;
            audio.saveSettings();
            forceRender((n) => n + 1);
          }}
          aria-pressed={settings.reducedEffects}
          aria-label="Weniger Effekte"
        >
          <span />
        </button>
      </div>

      <div className="inv-titel" style={{ marginTop: '1.3rem' }}>
        Steuerung
      </div>
      <div className="tasten-liste">
        <div>
          Bewegen: <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> oder Pfeiltasten
        </div>
        <div>
          Angriff: <kbd>Leer</kbd> · Reden: <kbd>E</kbd> · Ausweichen: <kbd>Shift</kbd>
        </div>
        <div>
          Blocken: <kbd>Strg</kbd> · Faehigkeit: <kbd>Q</kbd> · Menue: <kbd>Esc</kbd>
        </div>
        <div style={{ marginTop: '0.5rem', opacity: 0.6 }}>
          Auf dem Handy: links ziehen zum Laufen, rechts die Knoepfe.
        </div>
      </div>

      <div className="inv-titel" style={{ marginTop: '1.3rem' }}>
        Spielstand
      </div>
      <button
        className="btn btn-klein btn-gefahr"
        style={{ width: '100%' }}
        onClick={() => {
          if (
            window.confirm(
              'Spielstand wirklich loeschen? Der gesamte Fortschritt geht verloren.',
            )
          ) {
            clearSavedGame();
            onQuit();
          }
        }}
      >
        Spielstand loeschen und zum Titelbild
      </button>
    </>
  );
}

function formatPlaytime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
