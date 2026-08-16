# Mauseri — Das Geheimnis der Katzenwelt

Ein 2D-Top-down-Adventure für den mobilen Browser. Miaurien ist ein Reich aus
Katzen, und seit Königin Nyxara das Herz der Nacht gefunden hat, verschwinden
Dörfer im Nebel. Mauseri und ihr Begleiter Pookie ziehen los, um herauszufinden,
warum.

Das Spiel läuft ohne Installation im Browser, ist für das Handy gebaut und
funktioniert nach dem ersten Laden auch offline.

---

## Schnellstart

```bash
npm install
npm run dev          # Entwicklungsserver, http://localhost:5173
```

Für einen Produktionsbuild:

```bash
npm run build        # prüft Karten, Inhalte und Typen, dann Build nach dist/
npm run preview      # gebauten Stand lokal ansehen
```

---

## Steuerung

**Handy** — links auf den Bildschirm legen und ziehen: der Joystick erscheint
unter dem Daumen. Rechts liegen die Aktionsknöpfe.

| Knopf | Wirkung |
| --- | --- |
| Kralle | Nahkampfangriff |
| Reden | Ansprechen, Untersuchen, Truhen öffnen |
| Roll | Ausweichrolle — währenddessen unverwundbar |
| Block | Halten reduziert Schaden um 75 % |
| Fähigkeiten (links unten) | Antippen wählt aus und setzt ein |

**Rechner**

| Taste | Wirkung |
| --- | --- |
| `W` `A` `S` `D` / Pfeiltasten | Laufen |
| `Leertaste` / `J` | Angriff |
| `E` / `Enter` / `K` | Reden, Untersuchen |
| `Shift` / `L` | Ausweichen |
| `Strg` / `I` | Blocken |
| `Q` / `U` | Fähigkeit einsetzen |
| `Esc` | Menü (Beutel, Aufgaben, Karte, Optionen) |

---

## Was das Spiel enthält

- **Sieben Regionen** mit 36 Karten: Miezlingen, Schnurrwald, Kratzfels,
  Miauport, Mondsee, Schattenlande, Schloss Nyxara. Die Farbwelt wandert von
  warmem Grün ins fast Entsättigte.
- **25 NPCs** mit eigenem Aussehen, eigener Rolle und eigenen Dialogen.
- **19 Quests** — sieben Hauptquests und zwölf Nebenquests. Jede Nebenquest hat
  eine Person mit einem Anliegen dahinter, keine Sammelaufträge.
- **16 Gegnertypen** mit acht Verhaltensmustern: Verfolger, Streuner, Stürmer,
  Schütze, Hinterhalt, Umkreiser, Teiler, Wache.
- **Sieben Bosse** mit Phasenwechseln, eigenen Angriffsmustern und einem
  erkennbaren Verwundbarkeitsfenster.
- **13 Rätsel** in fünf Bauarten: Schalter, Druckplatten mit Schiebeblöcken,
  Symbolreihenfolgen, Wasserstände, Spiegel.
- **Fünf Fähigkeiten**, die jeweils im Kampf *und* außerhalb wirken — dadurch
  werden früh besuchte Gebiete später wieder interessant.
- **Zwei Enden.** Wer genug Geheimnisse findet, sieht das wahre.

---

## Architekturentscheidungen

### Es gibt keine Asset-Dateien

Jede Grafik wird beim Start aus Code gezeichnet, jeder Ton wird synthetisiert.
Das Projekt enthält kein einziges Bild und keine einzige Audiodatei — die
PWA-Icons sind der einzige Sonderfall, und die erzeugt `npm run icons`
ebenfalls aus Code.

Gründe:

1. **Rechtssicherheit.** Jede Linie ist eigener Code. Es kann nichts Fremdes
   hineingeraten.
2. **Ladezeit.** Es gibt nichts nachzuladen. Das Spiel startet auf dem Handy
   sofort, auch bei schlechter Verbindung.
3. **Konsistenz.** Regionen bekommen ihre Farbwelt aus einer Palette. Statt 200
   Einzelbilder aufeinander abzustimmen, wird eine Palette geändert.

Zu finden in `src/game/art/`: `draw.ts` (Zeichenprimitive), `tileTextures.ts`
(ein Tileset je Region), `characterTextures.ts` (Figuren-Spritesheets mit vier
Blickrichtungen), `objectTextures.ts` (Objekte, Effekte, Gegenstandssymbole).
Die Musik liegt in `src/game/systems/AudioSystem.ts` als Sequenzer mit
Akkordfolgen je Region.

### Inhalte sind Daten, keine Logik

Karten, NPCs, Dialoge, Quests, Gegenstände, Gegner, Bosse, Rätsel und
Zwischensequenzen sind deklarative Datenstrukturen in `src/data/`. Die Systeme
in `src/game/systems/` interpretieren sie. Eine neue Nebenquest oder eine
umgebaute Zwischensequenz braucht keinen Spielcode.

Karten werden als ASCII geschrieben:

```ts
rows: [
  'TTTTTTTTTTTTTT-TTTTTTTTTTTTTTT',
  'T.............-..............T',
  'T..TT.........-.........TT...T',
]
```

Das ist im Editor lesbar, in Git diffbar und braucht kein Tooling. Die Legende
steht in `src/data/tiles.ts`.

### Phaser für die Welt, React für die Oberfläche

Phaser rendert die Spielwelt in der `requestAnimationFrame`-Schleife. React
rendert HUD, Dialoge, Menüs und Touch-Steuerung als DOM darüber — dort sind
Safe-Area-Behandlung, Schriftgrößen und Trefferflächen mit CSS deutlich besser
zu lösen als im Canvas.

Verbunden sind beide über einen typisierten Event-Bus (`src/core/EventBus.ts`).
Nur Ereignisse, die die Oberfläche wirklich betreffen, gehen nach oben — sonst
würde React 60-mal pro Sekunde neu rendern.

### Hoch- und Querformat ohne Sonderfall

Phaser bekommt die volle Fenstergröße; die Kamera wählt ihren Zoom so, dass
immer mindestens 15 × 11 Kacheln sichtbar sind. Ist eine Karte kleiner als das
Sichtfeld — auf einem hochkant gehaltenen Handy bei jedem Innenraum der Fall —,
werden die Kameragrenzen aufgeweitet, damit die Karte mittig steht statt am
oberen Rand zu kleben. Der Rand bekommt einen gestalteten Nachthintergrund.

Beide Orientierungen sind spielbar. Niemand wird zum Drehen des Geräts
gezwungen.

---

## Projektstruktur

```
src/
  core/           Konstanten, Event-Bus, Zufallsgenerator
  data/           Alle Inhalte als Daten
    areas/        36 Karten, nach Region getrennt
    dialogues/    112 Dialogknoten, nach Region getrennt
    npcs.ts  quests.ts  items.ts  enemies.ts  bosses.ts
    puzzles.ts  abilities.ts  regions.ts  tiles.ts  scripts.ts
  game/
    art/          Prozedurale Grafik
    entities/     Actor, Player, Companion, NpcActor, EnemyActor, BossActor
    scenes/       BootScene, WorldScene
    systems/      Eingabe, Audio, Dialog, Rätsel, Skripte
    world/        Kartenaufbau aus ASCII
  state/          Spielzustand und Persistenz
  ui/             React-Oberfläche
scripts/          Prüf- und Testwerkzeuge
```

---

## Prüfen und Testen

Das Spiel ist datengetrieben, und ein Tippfehler in einer ID fällt sonst erst
auf, wenn jemand die betroffene Stelle im Spiel erreicht. Deshalb hängen vor
jedem Build zwei Prüfschritte:

```bash
npm run check           # Karten + Inhalte + Typen
npm run check:maps      # Zeilenlängen, unbekannte Zeichen, Objekte in Wänden,
                        # Portale, die ins Leere oder in Wände zeigen
npm run check:content   # fehlende Dialogknoten, unbekannte Sprecher, Items,
                        # Quests, Rätsel ohne Elemente, tote Skripte
```

Browsertests gegen den gebauten Stand (Preview-Server muss laufen):

```bash
npm run preview &
npm run test:smoke      # Start, Prolog, Bewegung, Menü, Speichern, Laden
npm run test:areas      # betritt alle 36 Karten und prüft jede auf Fehler
```

`test:areas` nutzt Testhilfen, die nur mit `?test=1` in der URL existieren —
ohne diesen Parameter gibt es sie nicht.

---

## Deployment

Das Spiel ist eine statische Seite ohne Backend. `dist/` kann auf jeden
Static-Host.

**Vercel** — die mitgelieferte `vercel.json` genügt:

```bash
npx vercel --prod
```

**Netlify** — die mitgelieferte `netlify.toml` genügt:

```bash
npx netlify deploy --prod
```

**Beliebiger Static-Host** — `npm run build`, dann den Inhalt von `dist/`
hochladen. Wichtig ist nur, dass unbekannte Pfade auf `index.html` fallen
(SPA-Fallback); beide mitgelieferten Konfigurationen erledigen das.

Nach dem Deployment ist das Spiel über einen normalen Link spielbar und kann
auf dem Handy über „Zum Homebildschirm hinzufügen" wie eine App installiert
werden.

---

## Speicherstände

Der Spielstand liegt in `localStorage` unter `mauseri.save.v1` und wird alle
20 Sekunden sowie an jedem Speicherpunkt geschrieben. Speicherpunkte heilen
zusätzlich vollständig.

Nach dem Tod verliert man keinen Fortschritt: Mauseri wacht am letzten sicheren
Ort mit halber Kraft auf. Quests, Gegenstände und gelöste Rätsel bleiben.

Der Spielstand lässt sich in den Optionen löschen.

---

## Lizenzhinweis zu den Inhalten

Welt, Figuren, Kreaturen, Geschichte, Grafik und Musik sind für dieses Projekt
entstanden. Es wurden keine Grafiken, Klänge, Namen, Karten oder Mechaniken aus
bestehenden Spielen übernommen.
