/**
 * Fehlergrenze um die Bedienoberflaeche.
 *
 * Hintergrund: React raeumt bei einem Fehler waehrend des Renderns den
 * kompletten Baum ab. Ein einziger Programmierfehler in einem Knopf loeschte
 * damit HUD, Dialog UND Steuerung auf einmal - das Spiel lief im Hintergrund
 * weiter, war aber nicht mehr bedienbar und sah aus wie abgestuerzt.
 *
 * Mit dieser Grenze bleibt der Rest stehen, der Spieler sieht, was passiert
 * ist, und kommt mit einem Knopf zurueck ins Spiel. Der Spielstand liegt im
 * localStorage und ueberlebt selbst ein Neuladen.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Name des gekapselten Bereichs, erscheint in der Meldung. */
  bereich: string;
}

interface State {
  fehler: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { fehler: null };

  static getDerivedStateFromError(fehler: Error): State {
    return { fehler };
  }

  override componentDidCatch(fehler: Error, info: ErrorInfo): void {
    console.error(`Fehler in "${this.props.bereich}":`, fehler, info.componentStack);
  }

  private erneutVersuchen = (): void => {
    this.setState({ fehler: null });
  };

  override render(): ReactNode {
    if (!this.state.fehler) return this.props.children;

    return (
      <div className="fehler-grenze" role="alert">
        <p className="fehler-titel">Hier ist etwas schiefgegangen.</p>
        <p className="fehler-text">
          Der Bereich &bdquo;{this.props.bereich}&ldquo; hat sich verschluckt. Dein Spielstand ist
          gespeichert.
        </p>
        <div className="fehler-knoepfe">
          <button type="button" onClick={this.erneutVersuchen}>
            Weiterspielen
          </button>
          <button type="button" onClick={() => window.location.reload()}>
            Neu laden
          </button>
        </div>
      </div>
    );
  }
}
