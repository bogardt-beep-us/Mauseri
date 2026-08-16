import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './ui/styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Kein #root-Element gefunden.');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Der Startbildschirm aus index.html wird entfernt, sobald React steht.
document.getElementById('boot-splash')?.remove();

// Service Worker fuer den Offline-Betrieb (PWA). Fehlschlaege sind harmlos:
// das Spiel laeuft dann eben nur online.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[PWA] Service Worker konnte nicht registriert werden:', err);
    });
  });
}
