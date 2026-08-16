# Dose — iOS app

The same peptide & supplement tracker as the web version in the repo root,
rebuilt as a real iOS app with **Expo / React Native**. It talks to the same
Firebase project and the same Firestore collections, so it's the same
account and the same data — log a dose on your phone, it's there on the web
version, and vice versa.

## Running it on your phone

You don't need a Mac for day-to-day use — Expo Go runs the app on your
iPhone straight from the dev server.

```bash
cd ios-app
npm install
npm run ios       # or: npx expo start, then scan the QR code
```

Install **Expo Go** from the App Store first, then scan the QR code the dev
server prints. Your phone and computer need to be on the same network.

Every dependency here is one Expo Go already ships, so nothing needs a
custom native build to develop against.

## Putting it on your home screen for real

Expo Go is fine for development, but for an app that lives on your home
screen and opens without a dev server, build it once with EAS:

```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile preview
```

`preview` produces an install-on-your-own-device build; `production` plus
`eas submit` is the TestFlight / App Store path. Both need a paid Apple
Developer account — that's Apple's rule for putting an app on a device for
more than 7 days, not an Expo one.

The bundle identifier is `com.nbv.dose` (`app.json` → `ios`), the same
reverse-DNS name the Android build uses for its application ID. That's fine
and normal — the two stores don't share a namespace, and nothing in either
app is keyed on them matching or differing. Change it if you'd rather use a
different Apple team's namespace.

## Layout

```
app/                     the screens — expo-router maps files to routes
  _layout.js               root: auth provider, and the signed-in/out gate
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
  lib/csv.js               CSV export via the iOS share sheet
  components/              Card, Button, Toggle, Modal, calendar, chart, …
assets/                  app icon and splash image
```

## What's different from the web version

Everything you can *do* is the same. What changed is how a few things
have to work on a phone:

| | Web | iOS |
|---|---|---|
| Staying logged in | browser localStorage | AsyncStorage, so it survives the app being killed |
| CSV export | file download | written to cache, then handed to the iOS share sheet (Save to Files, AirDrop, Mail) |
| Reconstituted-on date | `<input type="date">` | the system date picker |
| "App link" in Settings | the page's URL | version + build number — an installed app has no URL to share |
| Toggling / saving | — | haptic feedback |
| Fonts | Sora / Inter / JetBrains Mono from Google Fonts | the iOS system faces, so nothing is downloaded at launch |

Firestore is also pinned to long polling (`src/firebase.js`). Its default
streaming transport isn't fully supported by React Native's networking
stack, and without this listeners silently never fire.

## Firebase setup

Already done if the web version works — this app points at the same project
and needs no extra configuration. `src/firebase-config.js` is a copy of the
root `firebase-config.js`; if you ever rotate the project, update both.

Nothing new is needed in the Firebase console: same Email/Password sign-in,
same `firestore.rules`, same collections, no composite indexes.

## Checks

```bash
npx eslint .                        # lint
npm run bundle                      # full Metro bundle, catches broken imports
npx expo-doctor                     # dependency / config sanity check
```

## Ideas for next passes

The web version's backlog still applies, plus what being a real app now
makes possible:

- **Scheduled reminders** — the big one. `expo-notifications` can schedule
  local notifications for your morning and evening windows entirely
  on-device, no Firebase Cloud Messaging and no server needed.
- A home-screen widget showing what's still untaken today
- Face ID / Touch ID lock on open (`expo-local-authentication`)
- Offline write queue, so logging works with no signal
- Everything still on the old list: titration / cycling, injection site
  rotation, beyond-use dates, multiple concurrent vials, cost tracking,
  editing past days in History
