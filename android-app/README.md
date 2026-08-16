# Dose — Android app

The same peptide & supplement tracker as the web version in the repo root,
rebuilt as a real Android app with **Expo / React Native**. It talks to the
same Firebase project and the same Firestore collections, so it's the same
account and the same data — log a dose on your phone, it's there on the web
version and on the iOS app, and vice versa.

## Running it on your phone

Expo Go runs the app on your phone straight from the dev server, no Android
Studio needed.

```bash
cd android-app
npm install
npm run android   # or: npx expo start, then scan the QR code
```

Install **Expo Go** from the Play Store first, then scan the QR code the dev
server prints. Your phone and computer need to be on the same network.

Every dependency here is one Expo Go already ships, so nothing needs a
custom native build to develop against.

## Putting it on your home screen for real

Expo Go is fine for development, but for an app that lives on your home
screen and opens without a dev server, build it once with EAS:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

`preview` produces an APK you can download and sideload onto your own phone
— no Play Store account, no signing setup, no 7-day expiry. That's the whole
story for personal use, and it's the one place Android is meaningfully
easier than iOS.

`production` plus `eas submit` builds an AAB and pushes it to the Play
Console instead, which needs a Google Play developer account (one-off fee).
Only worth it if you want other people installing this.

The application ID is `com.nbv.dose` (`app.json` → `android.package`), the
same reverse-DNS name as the iOS bundle identifier — fine and normal, since
the two stores don't share a namespace. Once a build is published under an
application ID, that ID is permanent: Play treats a different one as an
entirely different app.

`versionCode` is the integer Play uses to order builds, and it has to go up
on every upload. EAS increments it remotely by default, which means the
value in `app.json` goes stale — worth knowing, because the Settings screen
reads it via `expo-constants` and will show the stale number. Set
`cli.appVersionSource` to `local` in `eas.json` if you'd rather `app.json`
stay authoritative.

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
  theme.js                 the web app's Tailwind palette as native tokens
  lib/auth.js              auth context (the web app's AuthProvider)
  lib/data.js              every Firestore read/write, ported 1:1
  lib/dates.js             4am rollover, dateKeys, day-of-week scheduling
  lib/quotes.js            the daily quote
  lib/csv.js               CSV export via the Android share sheet
  components/              Card, Button, Toggle, Modal, calendar, chart, …
  components/DateField.js  the tap-to-open Material date dialog
assets/                  launcher icons (incl. adaptive layers) and splash
```

## What's different from the web version

Everything you can *do* is the same. What changed is how a few things have
to work on a phone:

| | Web | Android |
|---|---|---|
| Staying logged in | browser localStorage | AsyncStorage, so it survives the app being killed |
| CSV export | file download | written to app cache, then handed to the share sheet (Drive, Gmail, Files) |
| Reconstituted-on date | `<input type="date">` | the Material date dialog |
| "App link" in Settings | the page's URL | version name + versionCode — an installed app has no URL to share |
| Toggling / saving | — | haptic feedback |
| Fonts | Sora / Inter / JetBrains Mono from Google Fonts | Roboto and Roboto Mono, so nothing is downloaded at launch |

Firestore is also pinned to long polling (`src/firebase.js`). Its default
streaming transport isn't fully supported by React Native's networking
stack, and without this listeners silently never fire.

## What's different from the iOS app

Same screens, same data, same code structure — the ports diverge only where
the platform does. If you're reading both side by side, these are the files
that aren't the same:

| | iOS | Android |
|---|---|---|
| Touch feedback | the view dims while pressed | a Material ripple spreads from your finger (`android_ripple`) |
| Card shadows | `shadowOffset` / `shadowRadius` / `shadowOpacity` | `elevation` — Android ignores the rest |
| Tab bar | UIKit-style, tint only | Material 3, with a rounded indicator behind the selected tab |
| Date entry | an inline picker sitting in the form | a tappable field that opens the system dialog, because Android's picker is modal |
| Back | swipe from the left edge | the system back button/gesture: closes an open sheet, then walks back to the Log tab, then exits |
| Keyboard | `KeyboardAvoidingView` | `windowSoftInputMode=adjustResize` — the window itself shrinks |
| System bars | safe-area insets | drawn behind the app edge-to-edge, which Android 16 makes mandatory |
| Launcher icon | one square image | adaptive foreground/background layers, plus a monochrome one for themed icons |
| Share sheet | needs a UTI *and* a MIME type | MIME type only |

The `android_ripple` bits come with `overflow: 'hidden'` wherever the
pressable is rounded — without it the ripple paints square corners over the
radius.

## Firebase setup

Already done if the web version works — this app points at the same project
and needs no extra configuration. `src/firebase-config.js` is a copy of the
root `firebase-config.js`; if you ever rotate the project, update it, the
iOS copy, and the root one together.

Nothing new is needed in the Firebase console: same Email/Password sign-in,
same `firestore.rules`, same collections, no composite indexes. Firebase's
Android SDK is not involved here — this is the JS SDK talking to the same
REST/streaming endpoints the web app uses, so there's no
`google-services.json` and no SHA-1 fingerprint to register.

## Checks

```bash
npx eslint .                             # lint
npm run bundle                           # full Metro bundle, catches broken imports
npx expo prebuild --platform android     # generates ./android — check the manifest, then delete it
npx expo-doctor                          # dependency / config sanity check
```

`prebuild` is the useful one for anything touching `app.json`: it's what
turns that config into a real `AndroidManifest.xml` and `styles.xml`, so
it's how you confirm a setting actually landed. The generated `android/`
folder is gitignored on purpose — EAS regenerates it on every build, and
committing it means hand-maintaining it forever.

## Ideas for next passes

The web version's backlog still applies, plus what being a real app now
makes possible:

- **Scheduled reminders** — the big one. `expo-notifications` can schedule
  local notifications for your morning and evening windows entirely
  on-device, no Firebase Cloud Messaging and no server needed. Android 13+
  wants the `POST_NOTIFICATIONS` runtime permission for it.
- A home-screen widget showing what's still untaken today — Android's
  widgets are far more capable than iOS's, and `expo-glance-widget` or a
  small native module can drive one
- Fingerprint / face unlock on open (`expo-local-authentication`)
- A quick-settings tile or app shortcut for "log morning doses"
- Offline write queue, so logging works with no signal
- Everything still on the old list: titration / cycling, injection site
  rotation, beyond-use dates, multiple concurrent vials, cost tracking,
  editing past days in History
