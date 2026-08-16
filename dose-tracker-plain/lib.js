// ---------- Firebase (loaded from Google's own CDN — no npm needed) ----------
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDocs,
  writeBatch,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

// ---------- Shared logic ----------
// The dates, quotes, dosing maths and CSV serialisation used to be defined
// here and again in mobile/src/lib/. They now live once in ../shared/ and
// are re-exported below, so this app and the phone app cannot drift apart
// on what "today" means or how much is left in a vial.
//
// Re-exported rather than imported directly by screens.js so every existing
// `import { dateKey } from './lib.js'` keeps working untouched.
export {
  ALL_DAYS,
  DOW_KEYS,
  DOW_LABELS,
  dateKey,
  dayOfWeekForDateKey,
  formatDateKeyFromDate,
  formatFriendlyDate,
  formatHeaderDate,
  formatTime,
  isScheduledOn,
  isScheduledToday,
  parseDateKey,
  recentDateKeys,
  shiftDateKey,
  todayDayOfWeek,
  todayKey,
} from '../shared/dates.js';
export { quoteOfTheDay } from '../shared/quotes.js';
export {
  blendDoseBreakdown,
  calculatorUnits,
  componentConcentration,
  componentMcgPerUnit,
  concentration,
  doseVolumeMl,
  mcgPerUnit,
  remainingMg,
  remainingSupplementAmount,
} from '../shared/dosing.js';
import { toCsv } from '../shared/csv.js';
export { toCsv };

import { firebaseConfig } from './firebase-config.js';
import { html } from './react-setup.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ---------- Auth context ----------
const { createContext, useContext, useEffect, useState } = React;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = {
    user,
    loading,
    login: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signup: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
    logout: () => signOut(auth),
  };

  return html`<${AuthContext.Provider} value=${value}>${children}</${AuthContext.Provider}>`;
}

export function useAuth() {
  return useContext(AuthContext);
}

// ---------- Date helpers ----------
// "day" runs 4am-to-4am (see dose-tracker README) so the log resets each
// morning without any scheduled job — todayKey() itself just rolls over.

// ---------- Header date: "Friday, August 14th, 2026" ----------
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---------- Daily quote — same one all day, changes at the 4am rollover ----------

// ---------- CSV export ----------
export function downloadCsv(filename, rows) {
  const csv = toCsv(rows);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/*
  DATA MODEL

  users/{uid}/peptides/{id}
    name, source, reorderUrl, vialAmountMg, bacWaterMl, unitsPerMl, logUnit,
    schedule: 'morning' | 'evening' | 'both'
    status: 'active' | 'finished', reconstitutedDate, notes, createdAt
    -> concentration (mg/mL) is DERIVED, never stored.

  users/{uid}/supplements/{id}
    name, dosage, unit, schedule, reorderUrl, active, notes, createdAt

  users/{uid}/peptideDoses/{dateKey_period_peptideId}
    peptideId, peptideName, period, dateKey, taken, amount, unit, savedAt

  users/{uid}/supplementLogs/{dateKey_period_supplementId}
    supplementId, supplementName, period, dateKey, taken, amount, unit, savedAt

  users/{uid}/weightLogs/{dateKey_period}
    dateKey, period, weight, unit, savedAt
*/

const userCol = (uid, name) => collection(db, 'users', uid, name);
const logId = (dk, period, itemId) => `${dk}_${period}_${itemId}`;

// ---------- Peptides (inventory) ----------

export function listenPeptides(uid, cb) {
  const q = query(userCol(uid, 'peptides'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function addPeptide(uid, data) {
  return addDoc(userCol(uid, 'peptides'), {
    name: data.name,
    source: data.source || '',
    reorderUrl: data.reorderUrl || '',
    vialAmountMg: Number(data.vialAmountMg),
    bacWaterMl: Number(data.bacWaterMl),
    unitsPerMl: data.unitsPerMl ? Number(data.unitsPerMl) : 100,
    logUnit: data.logUnit || 'mcg',
    schedule: data.schedule || 'morning',
    daysOfWeek: data.daysOfWeek && data.daysOfWeek.length ? data.daysOfWeek : ALL_DAYS,
    isBlend: !!data.isBlend,
    blendComponents: data.isBlend && Array.isArray(data.blendComponents) ? data.blendComponents : [],
    priorUsedMg: data.priorUsedMg ? Number(data.priorUsedMg) : 0,
    reconstitutedDate: data.reconstitutedDate ? Timestamp.fromDate(new Date(data.reconstitutedDate)) : serverTimestamp(),
    status: 'active',
    notes: data.notes || '',
    createdAt: serverTimestamp(),
  });
}

export function updatePeptide(uid, id, patch) {
  return updateDoc(doc(db, 'users', uid, 'peptides', id), patch);
}

export function deletePeptide(uid, id) {
  return deleteDoc(doc(db, 'users', uid, 'peptides', id));
}

// ---------- Supplements (inventory) ----------

export function listenSupplements(uid, cb) {
  const q = query(userCol(uid, 'supplements'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function addSupplement(uid, data) {
  return addDoc(userCol(uid, 'supplements'), {
    name: data.name,
    dosage: Number(data.dosage),
    unit: data.unit || 'mg',
    schedule: data.schedule || 'morning',
    daysOfWeek: data.daysOfWeek && data.daysOfWeek.length ? data.daysOfWeek : ALL_DAYS,
    reorderUrl: data.reorderUrl || '',
    containerAmount: data.containerAmount ? Number(data.containerAmount) : null,
    priorUsedAmount: data.priorUsedAmount ? Number(data.priorUsedAmount) : 0,
    active: true,
    notes: data.notes || '',
    createdAt: serverTimestamp(),
  });
}

export function updateSupplement(uid, id, patch) {
  return updateDoc(doc(db, 'users', uid, 'supplements', id), patch);
}

export function deleteSupplement(uid, id) {
  return deleteDoc(doc(db, 'users', uid, 'supplements', id));
}

// ---------- Daily log ----------

export function listenPeptideLogForPeriod(uid, dk, period, cb) {
  const q = query(userCol(uid, 'peptideDoses'), where('dateKey', '==', dk), where('period', '==', period));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function listenSupplementLogForPeriod(uid, dk, period, cb) {
  const q = query(userCol(uid, 'supplementLogs'), where('dateKey', '==', dk), where('period', '==', period));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export async function savePeptideLog(uid, dk, period, rows) {
  const batch = writeBatch(db);
  rows.forEach((r) => {
    const ref = doc(db, 'users', uid, 'peptideDoses', logId(dk, period, r.itemId));
    batch.set(ref, {
      peptideId: r.itemId,
      peptideName: r.itemName,
      period,
      dateKey: dk,
      taken: !!r.taken,
      amount: r.taken && r.amount !== '' ? Number(r.amount) : null,
      unit: r.unit,
      savedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function saveSupplementLog(uid, dk, period, rows) {
  const batch = writeBatch(db);
  rows.forEach((r) => {
    const ref = doc(db, 'users', uid, 'supplementLogs', logId(dk, period, r.itemId));
    batch.set(ref, {
      supplementId: r.itemId,
      supplementName: r.itemName,
      period,
      dateKey: dk,
      taken: !!r.taken,
      amount: r.taken && r.amount !== '' ? Number(r.amount) : null,
      unit: r.unit,
      savedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

// ---------- Daily weight ----------

export function listenWeightForPeriod(uid, dk, period, cb) {
  const ref = doc(db, 'users', uid, 'weightLogs', `${dk}_${period}`);
  return onSnapshot(ref, (snap) => cb(snap.exists() ? snap.data() : null));
}

export function saveWeightLog(uid, dk, period, { weight, unit }) {
  const ref = doc(db, 'users', uid, 'weightLogs', `${dk}_${period}`);
  return setDoc(ref, { dateKey: dk, period, weight: Number(weight), unit: unit || 'lb', savedAt: serverTimestamp() });
}

export function listenRecentWeightLogs(uid, cb, max = 60) {
  const q = query(userCol(uid, 'weightLogs'), orderBy('dateKey', 'desc'), limit(max));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

// ---------- History ----------
//
// These filter by dateKey order only (never needs a Firestore "composite
// index" - those require manual one-time setup in the Firebase console,
// and it's easy to add a feature later that needs a different one). The
// equality filtering (taken===true, matching one item's id) happens here
// in JS after the fetch instead. For a personal app's data volume this
// costs nothing noticeable and never needs any Firestore configuration.

export function listenRecentPeptideDoses(uid, cb, max = 400) {
  const q = query(userCol(uid, 'peptideDoses'), orderBy('dateKey', 'desc'), limit(max));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => d.taken)));
}

export function listenRecentSupplementLogs(uid, cb, max = 400) {
  const q = query(userCol(uid, 'supplementLogs'), orderBy('dateKey', 'desc'), limit(max));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => d.taken)));
}

export function listenPeptideHistory(uid, peptideId, cb, max = 200) {
  const q = query(userCol(uid, 'peptideDoses'), orderBy('dateKey', 'desc'), limit(max));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => d.peptideId === peptideId)));
}

export function listenSupplementHistory(uid, supplementId, cb, max = 200) {
  const q = query(userCol(uid, 'supplementLogs'), orderBy('dateKey', 'desc'), limit(max));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => d.supplementId === supplementId)));
}

// ---------- Removing a single History entry (with confirmation in the UI) ----------
export function deletePeptideDoseEntry(uid, id) {
  return deleteDoc(doc(db, 'users', uid, 'peptideDoses', id));
}
export function deleteSupplementLogEntry(uid, id) {
  return deleteDoc(doc(db, 'users', uid, 'supplementLogs', id));
}
export function deleteWeightLogEntry(uid, id) {
  return deleteDoc(doc(db, 'users', uid, 'weightLogs', id));
}

// ---------- Derived math ----------

// ---------- Blend math ----------
// A blend vial has multiple peptides reconstituted together in the SAME
// bacWaterMl. Each component's own concentration is its own mg divided by
// the vial's water — never the vial's total mg. (E.g. 5mg + 5mg in 1mL
// means each one is 5mg/mL, not 10mg/mL - the 10mg/mL figure is only the
// combined total, useful for vial-depletion tracking, not per-component
// dosing.)

// ---------- Full wipe (Settings "danger zone") ----------
// Deletes every document across all 5 collections for this account.
// Batches are chunked to 450 to stay safely under Firestore's 500-op limit.
export async function wipeAllData(uid) {
  const collections = ['peptides', 'supplements', 'peptideDoses', 'supplementLogs', 'weightLogs'];
  for (const name of collections) {
    const snap = await getDocs(userCol(uid, name));
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 450) {
      const batch = writeBatch(db);
      docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}
