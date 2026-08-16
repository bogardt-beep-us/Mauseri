/**
 * Abspann.
 *
 * Zwei Fassungen: das normale Ende und das wahre Ende, das nur sieht, wer
 * genug Geheimnisse gefunden hat. Der Unterschied liegt im letzten Absatz -
 * und der ist der Grund, noch einmal loszuziehen.
 */

import { useGameState } from './useBus';

interface Props {
  ending: 'true' | 'good';
  onFinish: () => void;
}

export function Credits({ ending, onFinish }: Props) {
  const state = useGameState();
  const stunden = Math.floor(state.playtimeMs / 3600000);
  const minuten = Math.floor((state.playtimeMs % 3600000) / 60000);

  return (
    <div className="abspann">
      <div className="abspann-rolle">
        <h2>Mauseri</h2>
        <p style={{ opacity: 0.6 }}>Das Geheimnis der Katzenwelt</p>

        <h3>Was danach geschah</h3>
        {ending === 'true' ? (
          <>
            <p>
              Das Herz der Nacht schlug noch einmal. Dann wurde es still - nicht
              zerstoert, sondern gehalten. Von zwei Pfoten statt von einer.
            </p>
            <p>
              Nyxara ging nicht fort. Sie blieb im Schloss, mit offenen Toren,
              und wurde langsam wieder das, was sie vorher gewesen war: jemand,
              der zuhoert.
            </p>
            <p>
              In Miezlingen laeutete die Glocke drei Tage lang. Brummel buk
              wieder. Murr stand wieder um sechs am Zaun und schimpfte ueber das
              Wetter, das ausgezeichnet war.
            </p>
            <p>
              Und Mauseri und Pookie sassen auf dem Huegel ueber dem Dorf und
              stritten darueber, wer von beiden mehr Angst gehabt hatte.
            </p>
            <p>Keiner von beiden gewann.</p>
          </>
        ) : (
          <>
            <p>
              Das Herz der Nacht zersprang. Der Nebel wich, die Farben kamen
              zurueck, und Miaurien atmete zum ersten Mal seit Jahren durch.
            </p>
            <p>
              Nyxara blieb zurueck - muede, still, ohne Erklaerung. Niemand
              fragte sie, was sie eigentlich hatte verhindern wollen.
            </p>
            <p>
              Vielleicht haette jemand fragen sollen. Es liegen noch Seiten in
              dieser Welt, die niemand gelesen hat.
            </p>
            <p>
              Mauseri und Pookie gingen nach Hause. Der Weg war lang, und Pookie
              redete die ganze Zeit.
            </p>
          </>
        )}

        <h3>Miaurien</h3>
        <p>Miezlingen · Schnurrwald · Kratzfels</p>
        <p>Miauport · Mondsee · Schattenlande</p>
        <p>Schloss Nyxara</p>

        <h3>Deine Reise</h3>
        <p>
          Spielzeit: {stunden} Stunden {minuten} Minuten
        </p>
        <p>Orte entdeckt: {state.visitedAreas.length}</p>
        <p>Geheimnisse gefunden: {state.secrets.length}</p>
        <p>Bosse besiegt: {state.bosses.length}</p>
        <p>Raetsel geloest: {state.puzzles.length}</p>

        <h3>Technik</h3>
        <p>Jede Grafik in diesem Spiel wurde aus Code gezeichnet.</p>
        <p>Jeder Ton wurde synthetisiert.</p>
        <p>Es gibt keine einzige Bild- oder Audiodatei.</p>

        {ending === 'good' && (
          <>
            <h3>Uebrigens</h3>
            <p style={{ opacity: 0.7 }}>
              Sieben Tagebuchseiten liegen in Miaurien verstreut. Wer alle
              findet, erfaehrt, was wirklich geschehen ist.
            </p>
          </>
        )}

        <p className="schluss">
          {ending === 'true'
            ? 'Ende'
            : 'Ende - vorerst'}
        </p>
      </div>

      <button className="btn btn-klein abspann-ende" onClick={onFinish}>
        Abspann beenden
      </button>
    </div>
  );
}
