// Registers the service worker in public/sw.js.
//
// Deliberately not at module scope: registration kicks off a network
// request and an install, and doing that while the bundle is still
// evaluating competes with the first render. Called from a layout effect
// instead, once the app is up.
//
// Dev is skipped on purpose. A service worker caching a Metro dev bundle is
// a reliable way to spend an afternoon debugging a stale app.
export function registerServiceWorker() {
  if (__DEV__) return;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // Not fatal — it only costs the offline shell. Common causes are
      // being served over plain http from something other than localhost,
      // or the file 404ing because public/ wasn't copied.
      console.warn('Service worker registration failed:', err);
    });
  });
}
