# Dose — iOS, Android & web app

The peptide & supplement tracker, built once with **Expo / React Native**
and rendered to three targets: iOS, Android, and the browser via
**react-native-web**. It talks to the same Firebase project and the same Firestore
collections, so it's the same account and the same data — log a dose on your
phone, it's there on the web version, and vice versa.

This replaces the old `ios-app/` and `android-app/` directories, which were
91% identical and had to be edited twice for every change. The web target
is the same idea taken one step further: react-native-web maps `<View>` and
`<Text>` onto DOM elements and RN styles onto CSS, so a feature written
once appears on all three.

The plain-HTML web app at the repo root still exists and still works. This
build is its replacement candidate, not its replacement — see "Replacing
the web app" below.

## Running it on your phone

Expo Go runs the app from the dev server, no Xcode or Android Studio needed
for day-to-day work.

```bash
cd mobile
npm install
npm run ios       # or: npm run android, or npx expo start and scan the QR
npm run web       # opens in the browser, no simulator needed
```

Install **Expo Go** from the App Store or Play Store first, then scan the QR
code the dev server prints. Your phone and computer need to be on the same
network.

Every dependency here is one Expo Go already ships, so nothing needs a
custom native build to develop against.

## Putting it on your home screen for real

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview   # APK you can sideload
eas build --platform ios --profile preview       # needs a paid Apple account
```

Android is the easy one: `preview` produces an APK you install directly on
your own phone, no store account and no signing setup. For a Play Store
listing use `--profile production` (an AAB) plus `eas submit`.

iOS needs a paid Apple Developer account for anything on a physical device —
Apple's rule, not Expo's. Without one you can still run the Simulator with
`npx expo run:ios`, or set `"ios": { "simulator": true }` on a build profile.

Both stores use `com.nbv.dose` (`app.json` → `ios.bundleIdentifier` and
`android.package`). They're separate namespaces, so sharing the name is
fine. Once published, neither can ever change.

## Layout

```
app/                     the screens — expo-router maps files to routes
  _layout.js               root: auth provider, system bars, signed-in/out gate
  login.js                 email + password, sign-up, forgot-password
  (tabs)/_layout.js        the five-tab bar
  (tabs)/index.js          Log — date nav, AM/PM, and the three sub-tabs
  (tabs)/peptides.js       vial inventory + add-vial form
  (tabs)/supplements.js    supplement inventory + add form
  (tabs)/history.js        merged timeline, CSV export, per-entry remove
  (tabs)/settings.js       account, reorder links, danger zone
src/
  firebase-config.js       your Firebase values — the one file you edit
  firebase.js              app/auth/firestore setup for React Native
  firebase.web.js          the browser equivalent (see below)
  theme.js                 the web app's Tailwind palette, shared
  theme.platform.*.js      the two tokens that can't be shared (see below)
  lib/auth.js              auth context (the web app's AuthProvider)
  lib/data.js              every Firestore read/write, ported 1:1
  lib/dates.js             4am rollover, dateKeys, day-of-week scheduling
  lib/quotes.js            the daily quote
  lib/csv.shared.js        rows -> CSV text, shared by all three
  lib/csv.js               native: share sheet.  csv.web.js: browser download
  lib/pwa.js               no-op on native.  pwa.web.js registers the worker
  components/              Card, Button, Toggle, Modal, calendar, chart, …
  components/DateField.*   inline picker (iOS), dialog (Android), calendar (web)
assets/                  icons (incl. Android adaptive layers) and splash
app/+html.js             the web document shell — manifest link, meta tags
public/                  copied verbatim into the web build
  manifest.webmanifest     the PWA manifest
  sw.js                    the service worker
  icons/                   192/512 icons, plain and maskable
```

## How the platforms differ

Almost everything is shared across all three targets. Where they genuinely
diverge, this project uses one of three mechanisms, in order of preference:

**1. Nothing at all.** Many props are already inert on the other platform,
so they just stay in the shared file: `android_ripple`, `statusBarTranslucent`
and `navigationBarTranslucent` on `Modal`, `backBehavior` on the tab
navigator, and `<NavigationBar>`, which renders `null` on iOS.

**2. `Platform.OS` / `Platform.select` inline**, where the difference is a
line or two — the share sheet's iOS-only UTI, `KeyboardAvoidingView`'s
behavior, the Material tab pill, and which build-number field Settings
reads. Metro folds these at build time, so the other platform's branch is
not even in the bundle.

**3. Separate `.ios.js` / `.android.js` / `.web.js` files**, only where an
entire implementation differs. Metro picks the file by extension, so the
importer never knows:

| Shared import | iOS | Android | Web |
|---|---|---|---|
| `./theme.platform` | San Francisco / Menlo, `shadow*` | Roboto / Roboto Mono, `elevation` | CSS system stacks, `shadow*` → box-shadow |
| `./DateField` | inline compact picker | field opening the Material dialog | field opening the app's own calendar |
| `./firebase` | AsyncStorage persistence, long polling | same | browser persistence, default transport |
| `./lib/csv` | cache file → share sheet | same | blob → download |

The rule of thumb: reach for a separate file only when the *component* is
different, not when a value is. `csv.shared.js` exists for exactly that
reason — the rows-to-text half is identical, so only delivery is split.

`firebase.web.js` is a separate file rather than a `Platform.OS` branch for
a concrete reason: the native path imports `getReactNativePersistence` from
`firebase/auth`, which only exists in Firebase's React Native entry point.
In a browser bundle that import resolves to undefined, so the two wirings
cannot share a file.

### Behaviour that differs on purpose

| | iOS | Android | Web |
|---|---|---|---|
| Touch feedback | the control dims | a Material ripple | the control dims |
| Card shadows | `shadow*` props | `elevation` | `shadow*` → CSS box-shadow |
| Selected tab | tint only | tint plus a rounded pill | tint only |
| Date entry | inline picker | system dialog | the app's own calendar sheet |
| Back | swipe from the left edge | back button: sheet, then Log tab, then exit | browser back |
| Keyboard | `KeyboardAvoidingView` | `adjustResize` | nothing — the page scrolls |
| CSV export | share sheet | share sheet | file download |
| Haptics | yes | yes | no — the calls reject and are swallowed |

## The web build as a PWA

It installs to a home screen and opens offline, the same as the plain-files
app at the repo root.

`app.json` sets `web.output` to **`static`**, not `single`. That matters:
`app/+html.js` — the only place to put a `<link rel="manifest">` or a
`theme-color` — is **ignored under `single`**, which uses a fixed template.
Static rendering also emits one HTML document per route, so `/settings` is a
real file and deep links work on a plain static host with no rewrite rules.

Three pieces make up the PWA:

- **`app/+html.js`** — the document head: manifest link, `theme-color` (so
  the browser chrome matches the app rather than flashing white), and
  Apple's own meta tags, which predate the manifest spec and are still what
  iOS Safari reads for "Add to Home Screen".
- **`public/manifest.webmanifest`** — name, standalone display, ink
  background, and the four icons carried over from the root web app.
- **`public/sw.js`** — the service worker. Anything in `public/` is copied
  verbatim into the export, which is what lets the worker sit at the root
  scope it needs.

### How the worker caches

Hand-written and small, rather than generated. Two rules do the work:

- **Cross-origin requests are passed straight through.** Every one of them
  is Firebase — auth tokens, Firestore listeners — where a stale reply is
  worse than no reply. The handler returns without calling `respondWith`,
  so the browser handles it as if no worker existed.
- **Same-origin is cache-first**, because Metro hashes build artefacts into
  their filenames: if it's in the cache it cannot be stale. Navigations are
  the exception and go network-first, so a deploy is picked up immediately,
  falling back to the cached document offline.

The one wrinkle is that the JS bundle's filename is hashed per build, so a
static `sw.js` can't name it in a precache list. Rather than add a build
step to substitute it in, the worker fetches `/` during install and reads
the script tags out of it — whatever the shell is loading is by definition
the current bundle. Without that, the first offline load renders a blank
page: the cached HTML arrives, then asks for a bundle nothing ever cached.

To invalidate everything, bump `CACHE` in `public/sw.js`. The activate
handler deletes every cache that isn't the current name.

**Verified in Chromium, not assumed:** the worker registers and activates,
the manifest parses with all four icons, and a reload with the network
disabled renders the login screen with no console errors.

### Replacing the plain-HTML web app

The repo root still holds the original — plain HTML/JS, React from a CDN,
deployed to GitHub Pages, and still what Pages serves.

```bash
npm run bundle:web        # -> .expo-export-web/
```

Copy the contents of `.expo-export-web/` to wherever Pages serves from.
With static output there is no fallback rule to configure.

One thing still argues against switching: **bundle size**. The RN-for-web
bundle is ~2.2 MB of JavaScript before compression, against a fraction of
that for the plain files. The service worker means you pay it once rather
than on every visit, but the first load is the first load. For a personal
tracker on a good connection it doesn't matter; on a cold mobile connection
it does.

Firestore on native is also pinned to long polling (`src/firebase.js`). Its
default streaming transport isn't fully supported by React Native's
networking stack, and without this listeners silently never fire. The web
build has no such problem, which is why `firebase.web.js` doesn't set it.

## Firebase setup

Already done if the web version works — this app points at the same project
and needs no extra configuration. `src/firebase-config.js` is a copy of the
root `firebase-config.js`; if you ever rotate the project, update both.

Nothing new is needed in the Firebase console: same Email/Password sign-in,
same `firestore.rules`, same collections, no composite indexes. This is the
JS SDK, not the native Firebase SDKs, so there is no `google-services.json`,
no `GoogleService-Info.plist`, and no SHA-1 to register — which is also why
renaming the bundle ID changed nothing.

## Checks

```bash
npx eslint .                             # lint
npm run bundle:android                   # full Metro bundle per platform —
npm run bundle:ios                       #   catches broken imports
npm run bundle:web
npx expo prebuild --platform android     # generates ./android — inspect, then delete
npx expo prebuild --platform ios         # same for ./ios
npx expo-doctor                          # dependency / config sanity check
```

Bundle **all three** targets after touching anything shared. A bundle
resolves imports but never renders, so it won't catch a runtime error — but
it does catch a `.web.js` file that a refactor left behind.

The web target is the one you can actually *run* in CI: serve
`.expo-export-web/` and drive it with Playwright, and you get real render
coverage for every screen the other two share. That is how the service
worker and the offline reload above were checked.

Note that `sw.js` and `manifest.webmanifest` live in `public/` and are
copied, not bundled — so a typo in either survives `bundle:web` untouched
and only shows up when the page is actually loaded.

`prebuild` is the one that matters for `app.json` changes: it turns that
config into a real `AndroidManifest.xml` / `Info.plist`, so it's how you
confirm a setting actually landed. Both generated folders are gitignored on
purpose — EAS regenerates them on every build.

## Ideas for next passes

- **Scheduled reminders** — the big one. `expo-notifications` can schedule
  local notifications for your morning and evening windows entirely
  on-device, no push server needed. Android 13+ wants the
  `POST_NOTIFICATIONS` runtime permission.
- A home-screen widget showing what's still untaken today
- Biometric lock on open (`expo-local-authentication`)
- Account deletion — Play requires it for apps with sign-in, and the current
  "wipe all data" clears Firestore documents without deleting the auth user
- Offline write queue, so logging works with no signal
- Everything still on the old list: titration / cycling, injection site
  rotation, beyond-use dates, multiple concurrent vials, cost tracking,
  editing past days in History
