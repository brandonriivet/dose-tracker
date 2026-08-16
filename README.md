# Dose — personal peptide & supplement tracker (plain-files edition)

A private, phone-installable web app for tracking reconstituted peptide
vials and daily supplements. This version is **plain HTML/CSS/JS — no build
step, no npm, no GitHub Actions.** Upload the files, flip one GitHub Pages
setting, done. Updating later is just: edit a file, save, refresh your
phone a minute later.

## How this is different from a "normal" React app

Instead of writing JSX and compiling it ahead of time (which is what needed
the whole Vite/Actions pipeline in the earlier version of this project), this
version loads React itself straight from a CDN like a normal script, and
uses a tiny library called **htm** to write JSX-*like* templates using plain
JavaScript template literals — no compiler needed. You'll see syntax like
this in the code:

```js
html`<div className="foo">${someValue}</div>`
```

That's the one syntax difference from JSX (`${}` instead of `{}`, and a
`` html` `` tag in front) — everything else about how the app is built is
the same component-based React you'd recognize from before.

## What's built

- **Log** — a date + a small daily quote up top, then Morning / Evening
  tabs, then Supplements / Peptides / Daily Weight sub-tabs. Toggle an
  item, type an amount, hit **Save**. **Clear all** resets before you save.
- **Navigate any day** — ‹ › arrows step one day at a time, or tap the
  date (or the 📅 icon) for a full month calendar to jump anywhere. Past
  days are fully editable — same toggle/amount/Save screen you use daily.
  Future days switch to a **view-only preview** of what's scheduled that
  day (no toggles, no entry — just a look ahead), with a clear color-coded
  banner either way and a one-tap "Back to today."
- **Day-of-week scheduling** — when adding (or editing) a peptide or
  supplement, pick exactly which days it's active — e.g. creatine on
  Mon/Wed/Fri only. It simply won't show up to log on the other days.
  Existing items with no days set default to every day.
- Tap any item's name for its detail view: source, vial math, reorder link,
  last 7 days taken.
- **4am day rollover** — the "day" runs 4am-to-4am instead of midnight-to-
  midnight, so the log naturally resets each morning with no scheduled job.
  Nothing is ever deleted; unsaved drafts just don't carry over.
- **Peptides / Supplements** tabs — your inventory. Edit an existing item's
  schedule (time of day + days of week) any time your plan changes.
- **Blend vials** — mark a peptide vial as a blend (multiple peptides
  reconstituted together, up to 4), each with its own name and mg amount.
  Shows a "Blend" badge on the card and the breakdown in the detail view;
  editable any time from the vial's Details. Each component's own
  concentration and mcg/unit are shown correctly (its own mg ÷ the vial's
  water — never the vial's total mg), and while logging a dose for a blend,
  a live line shows exactly how much of each component that amount
  delivers (e.g. "1.00mg BPC-157 · 1.00mg TB-500").
- **Adding a vial that's already partway used** — an "Already used (mg)"
  field when adding a peptide (also editable later from its Details) so the
  remaining-amount bar starts accurate instead of assuming a full vial.
- **Optional supplement inventory tracking** — set a container size (and
  "already used" if it's not a fresh bottle) on any supplement to get the
  same kind of remaining-amount bar peptides have, so you know when to
  reorder. Entirely opt-in — supplements without a container size set look
  exactly as before.
- **Weight tab** — a 30-day line chart of your logged weight, plus the
  existing recent-entries list.
- **History** — merged timeline, with per-day and "export all" CSV
  buttons, and a tap-to-confirm **remove** on any single entry (for fixing
  a mistaken log).
- **Settings** — log out, see/share the app's URL, set a reorder link for
  any item, and a **"Danger zone"** card that opens a separate confirm
  screen before you ever reach anything destructive (currently just wipe
  all data, typing `WIPE` unlocks the button — built as a general gate so
  more destructive actions can be added behind it later without changing
  how it feels to use).
- **Delete** any peptide or supplement from its inventory screen (for an
  active peptide, tap "Details" first to reveal it; supplements show it
  directly on each row).
- **Forgot password?** link on the login screen, if you're using a real
  email address for your account.
- Installs to your phone's home screen, opens full-screen.

## File map

```
index.html            the shell — loads React, Tailwind, fonts, then app.js
firebase-config.js     <-- the ONLY file you normally need to edit
react-setup.js         binds htm to React so every file can use html`...`
lib.js                 Firebase, auth, Firestore functions, date/CSV helpers
ui.js                  small reusable pieces: Card, Button, Toggle, etc.
screens.js             every screen and modal in the app
app.js                 ties it together and mounts it to the page
manifest.webmanifest   home-screen install config
service-worker.js      lets the app shell load instantly / offline
icons/                 home-screen icons
firestore.rules        paste into Firebase's Firestore Rules tab
firestore.indexes.json not used by anything — every query here is written
                       to avoid needing Firestore composite indexes, so
                       there's nothing to set up manually
```

## Data model (Firestore) — unchanged from before

```
users/{uid}/peptides/{id}               name, source, reorderUrl, vialAmountMg, bacWaterMl,
                                         unitsPerMl, logUnit, schedule, status, notes
users/{uid}/supplements/{id}            name, dosage, unit, schedule, reorderUrl, active, notes
users/{uid}/peptideDoses/{dk_period_id} peptideId, peptideName, period, dateKey, taken, amount, unit
users/{uid}/supplementLogs/{dk_period_id} supplementId, supplementName, period, dateKey, taken, amount, unit
users/{uid}/weightLogs/{dk_period}      dateKey, period, weight, unit
```

## Setup (fully browser-based)

### 1. Firebase (skip if already done)

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. **Authentication → Sign-in method → Email/Password → Enable**
3. **Firestore Database → Create database → Production mode**
4. Firestore's **Rules** tab → paste in this project's `firestore.rules` → **Publish**
5. **Project settings → General → Your apps → Web (`</>`)** → register an app → keep the 6 config values handy

### 2. Start with a clean GitHub repo

Because this is a different way of building the app (no more Vite, no more
Actions), it's cleanest to start the repo over rather than upload on top of
the old build-based files:

1. Go to your existing repo → **Settings** → scroll to **Danger Zone** → **Delete this repository** → confirm
2. Create it again: [github.com/new](https://github.com/new) → same name → **Public** (required for free GitHub Pages) → no README

### 3. Upload these files

1. **Add file → Upload files**
2. Open this unzipped folder, select everything **inside** it, drag it onto the upload box
3. Commit

### 4. Add your Firebase values

1. Click into **`firebase-config.js`** → pencil icon to edit
2. Replace each `'PASTE_YOUR_..._HERE'` with your real value from step 1 — keep the quote marks
3. Commit

### 5. Turn on Pages

1. **Settings → Pages**
2. **Source → Deploy from a branch**
3. **Branch → main**, folder **/ (root)** → **Save**

Give it about 30–60 seconds, then refresh that same Pages settings page —
it'll show your live URL. Open it on your phone, **Add to Home Screen**,
and you're set.

### From here on

Editing anything is just: click the file on GitHub → pencil icon → change
it → commit. No Actions tab, no waiting for a build, no npm — refresh your
phone a few seconds later and it's live.

## Ideas for next passes

Same backlog as before — nothing here changed with this rewrite:

- Scheduled reminders (needs Firebase Cloud Messaging)
- Dosing schedules with planned-vs-actual tracking
- Titration / cycling support
- Injection site rotation
- Expiration / beyond-use dates per vial
- Multiple concurrent vials of the same peptide
- Cost / inventory tracking
- Editing past days in History (currently read-only)
- Longer history window on the item detail view (`HISTORY_DAYS` in `screens.js`)
