/**
 * Bildschirm nach dem Tod.
 *
 * Bewusst milde: Mauseri wacht am letzten sicheren Ort mit halber Kraft wieder
 * auf. Fortschritt (Quests, Gegenstaende, geloeste Raetsel) bleibt erhalten.
 * Ein Adventure soll neugierig machen, nicht bestrafen.
 */

interface Props {
  cause: string;
  onRetry: () => void;
  onQuit: () => void;
}

export function GameOver({ cause, onRetry, onQuit }: Props) {
  return (
    <div className="game-over">
      <h2>Aus die Maus</h2>
      <p>{cause}</p>
      <p style={{ opacity: 0.6, fontSize: '0.82rem' }}>
        Pookie hat dich zurueckgeschleift. Er sagt, das sei kein Problem gewesen.
        Er keucht aber ziemlich.
      </p>
      <div className="title-menu">
        <button className="btn btn-primaer" onClick={onRetry}>
          Weitermachen
        </button>
        <button className="btn" onClick={onQuit}>
          Zum Titelbild
        </button>
      </div>
    </div>
  );
}
