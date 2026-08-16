// Firebase for the web build. Metro picks this over firebase.js by the
// `.web` extension, so `import { auth, db } from './firebase'` resolves
// per target and nothing here needs a Platform check.
//
// This is the plain browser wiring, and it's a separate file rather than a
// branch inside firebase.js for one concrete reason: the native file
// imports `getReactNativePersistence` from 'firebase/auth', which only
// exists in Firebase's React Native entry point. Importing it in a browser
// bundle resolves to undefined.
//
// Neither native workaround applies here either — the browser has its own
// persistence (IndexedDB, which getAuth sets up by default), and Firestore's
// streaming transport is what it was written for, so no long-polling
// override.
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
