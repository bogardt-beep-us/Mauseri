/**
 * Service Worker: macht Mauseri offline spielbar.
 *
 * Strategie: "network first, cache fallback" fuer das HTML-Dokument (damit
 * Aktualisierungen ankommen) und "cache first" fuer alles andere (JS, CSS,
 * Icons - die tragen einen Hash im Namen und aendern sich nie unter demselben
 * Pfad). Das Spiel selbst laedt keine weiteren Dateien nach, deshalb reicht
 * dieser schlanke Ansatz.
 *
 * Alle Pfade werden aus dem Scope der Registrierung abgeleitet. Dadurch
 * funktioniert der Worker sowohl unter einer eigenen Domain als auch unter
 * einem Unterpfad wie /Mauseri/ - mit festen Pfaden ab "/" waere das Spiel
 * dort offline nicht startbar.
 */

const CACHE = 'mauseri-v2';

/** Basis-URL dieser Registrierung, z. B. "https://host/Mauseri/". */
const BASIS = new URL(self.registration.scope);

const url = (pfad) => new URL(pfad, BASIS).toString();
const KERN = [url('./'), url('./index.html'), url('./manifest.webmanifest'), url('./icon.svg')];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Einzeln statt addAll: faellt eine Datei aus, soll die Installation
      // trotzdem gelingen - sonst waere der Worker gar nicht aktiv.
      .then((cache) =>
        Promise.all(
          KERN.map((eintrag) =>
            cache.add(eintrag).catch((err) => {
              console.warn('[SW] konnte nicht vorladen:', eintrag, err);
            }),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const ziel = new URL(request.url);
  if (ziel.origin !== self.location.origin) return;
  // Nur Anfragen innerhalb des eigenen Scopes bedienen.
  if (!ziel.pathname.startsWith(BASIS.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const kopie = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, kopie));
          return response;
        })
        .catch(() =>
          caches.match(request).then((treffer) => treffer ?? caches.match(url('./index.html'))),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((treffer) => {
      if (treffer) return treffer;
      return fetch(request).then((response) => {
        if (response.ok) {
          const kopie = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, kopie));
        }
        return response;
      });
    }),
  );
});
