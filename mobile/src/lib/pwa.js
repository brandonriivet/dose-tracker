// Native builds have nothing to register — they *are* the installed app.
// The web implementation lives in pwa.web.js; Metro picks it by extension,
// so app/_layout.js can call this unconditionally.
export function registerServiceWorker() {}
