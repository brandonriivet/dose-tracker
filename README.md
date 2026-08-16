# Dose — personal peptide & supplement tracker

A private tracker for reconstituted peptide vials and daily supplements,
built once and rendered to three targets — iOS, Android and the browser —
from a single React Native codebase in **[`mobile/`](mobile/README.md)**.

```
mobile/                the app: iOS, Android, and the web build
dose-tracker-plain/    the original plain-HTML web app, kept as a fallback
firestore.rules        the security rules, shared by everything
.github/workflows/     builds mobile/ for the web and deploys it to Pages
```

Everything talks to the same Firebase project and the same Firestore
collections, so it's the same account and the same data everywhere — log a
dose on your phone and it's on the web, and vice versa.

## The web app

GitHub Pages serves the web build of `mobile/`, published by
[`.github/workflows/deploy-web.yml`](.github/workflows/deploy-web.yml) on
every push to `main` that touches `mobile/`. Nothing built is committed —
the workflow uploads the export as an artifact and Pages serves that.

**One-time setup:** Settings → Pages → Source must be set to
**GitHub Actions**. Until it is, the workflow runs and the deploy step
fails, because "Deploy from a branch" and "GitHub Actions" are mutually
exclusive sources.

The build is published under `/dose-tracker/`, since a project repo is
served from a subpath rather than the domain root. That prefix comes from
`EXPO_WEB_BASE_URL` in the workflow, which `mobile/app.config.js` turns into
Expo's `experiments.baseUrl`. On a custom domain, delete that env line and
everything moves back to the root.

## The plain-HTML web app

`dose-tracker-plain/` is what Pages used to serve: plain HTML/CSS/JS, React
from a CDN, no build step. It still works and still points at the same
Firebase project — open `index.html` and it runs.

It's kept for two reasons. It's a fallback if something goes wrong with the
Expo build, and it's a fraction of the size: roughly 300 KB against 543 KB
gzipped for the React Native build. The service worker makes that a
one-time cost rather than a per-visit one, which is what made the switch
reasonable, but on a cold connection the first load is still the first
load.

If you keep both, be aware they don't share code. `dateKey`,
`quoteOfTheDay`, `isScheduledOn` and `remainingMg` exist in both
`dose-tracker-plain/lib.js` and `mobile/src/lib/` — so a change to dosing
logic has to be made twice. Extracting those pure helpers into a shared
folder would fix the logic half; the UIs stay separate regardless.

## Firebase

`firestore.rules` at the root is the canonical copy — the emulator-backed
e2e tests load it, so what's tested is what's deployed. Publish it from the
Firebase console.

Every document lives under `users/{uid}/...` and the rules allow access
only to your own, so a second account sees nothing of the first.

Both apps carry their own copy of the Firebase web config
(`dose-tracker-plain/firebase-config.js` and
`mobile/src/firebase-config.js`). These values are not secret — Firebase's
client config is meant to be public, and the rules are what protect the
data — but if you ever rotate the project, update both.
