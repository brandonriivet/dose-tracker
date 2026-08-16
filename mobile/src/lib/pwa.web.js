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

  // Expo inlines experiments.baseUrl here, so this lands on
  // /dose-tracker/sw.js under GitHub Pages and /sw.js everywhere else.
  // Registering at the wrong path silently yields a worker whose scope
  // doesn't cover the app, which looks exactly like no worker at all.
  const swUrl = `${process.env.EXPO_BASE_URL || ''}/sw.js`;

  const register = () =>
    navigator.serviceWorker.register(swUrl).catch((err) => {
      // Not fatal — it only costs the offline shell. Common causes are
      // being served over plain http from something other than localhost,
      // or the file 404ing because public/ wasn't copied.
      console.warn('Service worker registration failed:', err);
    });

  // This runs from a layout effect, and with static rendering the document
  // has usually finished loading before React mounts — so waiting on the
  // 'load' event alone means waiting for an event that already fired, and
  // the worker never registers at all. Check first, listen only if it is
  // genuinely still loading.
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
