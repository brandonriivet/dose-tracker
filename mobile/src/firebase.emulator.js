import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';

// Points the app at the local Firebase emulators instead of the real
// project. Shared by firebase.js and firebase.web.js — connectAuthEmulator
// and connectFirestoreEmulator exist in both of Firebase's entry points, so
// this half needs no platform split.
//
// The switch is a build-time constant, not a runtime one: Expo inlines
// EXPO_PUBLIC_* into the bundle when it builds, so a normal `eas build` or
// `expo export` — where the variable isn't set — compiles this down to a
// dead branch that minifies away entirely. It cannot be flipped on at
// runtime in a shipped app.
//
// One caveat, verified the hard way: Metro keys its transform cache without
// EXPO_PUBLIC_* values, so a normal build run straight after an e2e build
// can reuse cached modules with the flag still inlined as '1'. The e2e
// script builds with --clear and drops the cache afterwards for exactly
// this reason. If you ever suspect it, `expo export --clear` settles it —
// grep the bundle for "LOCAL EMULATORS" and it should not be there.
//
// It exists for e2e/, which builds the web bundle with the flag set, seeds a
// user into the Auth emulator and drives the authenticated screens. That
// means the screens behind the login can be tested without a real account
// and without a single write reaching production data.
export const USING_EMULATORS = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR === '1';

// localhost works for the browser and a simulator. A real device on the
// same network needs the host machine's LAN IP instead, hence the override.
const HOST = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';

const AUTH_PORT = 9099;
const FIRESTORE_PORT = 8080;

export function connectEmulators(auth, db) {
  if (!USING_EMULATORS) return;

  // disableWarnings only silences the banner the SDK prints into the
  // console; the emulator connection is still loudly announced below,
  // because silently talking to a different backend than you think you are
  // is the one failure mode worth being noisy about.
  connectAuthEmulator(auth, `http://${HOST}:${AUTH_PORT}`, { disableWarnings: true });
  connectFirestoreEmulator(db, HOST, FIRESTORE_PORT);

  console.warn(
    `[firebase] Connected to LOCAL EMULATORS at ${HOST} ` +
      `(auth:${AUTH_PORT}, firestore:${FIRESTORE_PORT}). This is not production data.`
  );
}
