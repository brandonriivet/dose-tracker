// Firebase, wired up the React Native way.
//
// Two differences from the web version's lib.js:
//   * auth uses initializeAuth + AsyncStorage persistence, because the
//     browser's localStorage doesn't exist here. Without this you'd be
//     logged out every time the app is killed.
//   * Firestore is forced onto long polling. Its default transport is a
//     streaming WebChannel that React Native's networking stack doesn't
//     fully support, which shows up as "Could not reach Cloud Firestore
//     backend" and listeners that never fire.
//
// Both initializeX calls throw if something already initialized that
// service, which Fast Refresh can cause while you're editing — so each one
// falls back to the getter for the instance that already exists.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';
import { connectEmulators } from './firebase.emulator';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function makeAuth() {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
}

function makeDb() {
  try {
    return initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch {
    return getFirestore(app);
  }
}

export const auth = makeAuth();
export const db = makeDb();

// No-op unless the app was built with EXPO_PUBLIC_FIREBASE_EMULATOR=1.
connectEmulators(auth, db);
