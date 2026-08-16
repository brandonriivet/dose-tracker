# Dose — iOS & Android app

The same peptide & supplement tracker as the web version in the repo root,
rebuilt as a real phone app with **Expo / React Native**. One codebase, both
platforms. It talks to the same Firebase project and the same Firestore
collections, so it's the same account and the same data — log a dose on your
phone, it's there on the web version, and vice versa.

This replaces the old `ios-app/` and `android-app/` directories, which were
91% identical and had to be edited twice for every change.

## Running it on your phone

Expo Go runs the app from the dev server, no Xcode or Android Studio needed
for day-to-day work.

```bash
cd mobile
npm install
npm run ios       # or: npm run android, or npx expo start and scan the QR
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
  theme.js                 the web app's Tailwind palette, shared
  theme.platform.*.js      the two tokens that can't be shared (see below)
  lib/auth.js              auth context (the web app's AuthProvider)
  lib/data.js              every Firestore read/write, ported 1:1
  lib/dates.js             4am rollover, dateKeys, day-of-week scheduling
  lib/quotes.js            the daily quote
  lib/csv.js               CSV export via the system share sheet
  components/              Card, Button, Toggle, Modal, calendar, chart, …
  components/DateField.*   inline picker on iOS, dialog on Android
assets/                  icons (incl. Android adaptive layers) and splash
```

## How the platforms differ

Almost everything is shared. Where the platforms genuinely diverge, this
project uses one of three mechanisms, in order of preference:

**1. Nothing at all.** Many props are already inert on the other platform,
so they just stay in the shared file: `android_ripple`, `statusBarTranslucent`
and `navigationBarTranslucent` on `Modal`, `backBehavior` on the tab
navigator, and `<NavigationBar>`, which renders `null` on iOS.

**2. `Platform.OS` / `Platform.select` inline**, where the difference is a
line or two — the share sheet's iOS-only UTI, `KeyboardAvoidingView`'s
behavior, the Material tab pill, and which build-number field Settings
reads. Metro folds these at build time, so the other platform's branch is
not even in the bundle.

**3. Separate `.ios.js` / `.android.js` files**, only where an entire
implementation differs. Metro picks the file by extension, so the importer
never knows:

| Shared import | iOS | Android |
|---|---|---|
| `./theme.platform` | San Francisco / Menlo, `shadow*` props | Roboto / Roboto Mono, `elevation` |
| `./DateField` | inline compact picker | tappable field opening the Material dialog |

The rule of thumb: reach for a separate file only when the *component* is
different, not when a value is.

### Behaviour that differs on purpose

| | iOS | Android |
|---|---|---|
| Touch feedback | the control dims | a Material ripple spreads from your finger |
| Card shadows | `shadowOffset`/`shadowRadius`/`shadowOpacity` | `elevation` |
| Selected tab | tint only | tint plus a rounded indicator pill |
| Date entry | inline picker in the form | tappable field opening the system dialog |
| Back | swipe from the left edge | back button: closes a sheet, then returns to the Log tab, then exits |
| Keyboard | `KeyboardAvoidingView` | `windowSoftInputMode=adjustResize` |
| System bars | safe-area insets | drawn behind the app edge-to-edge |
| Launcher icon | one square image | adaptive foreground/background plus monochrome |

## What's different from the web version

Everything you can *do* is the same. What changed is how a few things have
to work on a phone:

| | Web | Phone |
|---|---|---|
| Staying logged in | browser localStorage | AsyncStorage, so it survives the app being killed |
| CSV export | file download | written to app cache, then handed to the share sheet |
| Reconstituted-on date | `<input type="date">` | the system date picker |
| "App link" in Settings | the page's URL | version + build — an installed app has no URL to share |
| Toggling / saving | — | haptic feedback |
| Fonts | Sora / Inter / JetBrains Mono from Google Fonts | the system faces, so nothing downloads at launch |

Firestore is also pinned to long polling (`src/firebase.js`). Its default
streaming transport isn't fully supported by React Native's networking
stack, and without this listeners silently never fire.

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
npx expo prebuild --platform android     # generates ./android — inspect, then delete
npx expo prebuild --platform ios         # same for ./ios
npx expo-doctor                          # dependency / config sanity check
```

Bundle **both** platforms after touching anything shared. A bundle resolves
imports but never renders, so it won't catch a runtime error — but it does
catch a `.ios.js` file that a refactor left behind.

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
