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
const ROLLOVER_HOUR = 4;

export function dateKey(date = new Date()) {
  const shifted = new Date(date.getTime() - ROLLOVER_HOUR * 60 * 60 * 1000);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, '0');
  const d = String(shifted.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey() {
  return dateKey(new Date());
}

// Pure calendar-date arithmetic - unlike dateKey()/todayKey() above, these
// don't apply the 4am rollover shift, because once you already HAVE a
// dateKey, moving it forward/back by whole days is just calendar math.
export function parseDateKey(dk) {
  const [y, m, d] = dk.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function pad2(n) {
  return String(n).padStart(2, '0');
}
export function formatDateKeyFromDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
export function shiftDateKey(dk, deltaDays) {
  const d = parseDateKey(dk);
  d.setDate(d.getDate() + deltaDays);
  return formatDateKeyFromDate(d);
}

export function formatFriendlyDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = todayKey();
  const yesterday = dateKey(new Date(Date.now() - 86400000));
  const tomorrow = shiftDateKey(today, 1);
  if (key === today) return 'Today';
  if (key === yesterday) return 'Yesterday';
  if (key === tomorrow) return 'Tomorrow';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTime(date) {
  if (!date) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// Last n dateKeys ending today, most recent first: [today, yesterday, 2 days ago, ...]
export function recentDateKeys(n = 4) {
  const keys = [];
  for (let i = 0; i < n; i++) keys.push(dateKey(new Date(Date.now() - i * 86400000)));
  return keys;
}

// ---------- Header date: "Friday, August 14th, 2026" ----------
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

export function formatHeaderDate(date = new Date()) {
  return `${WEEKDAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${ordinal(date.getDate())}, ${date.getFullYear()}`;
}

// ---------- Daily quote — same one all day, changes at the 4am rollover ----------
const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "Small, consistent steps move the needle further than big, rare ones.",
  "You don't have to feel motivated. You just have to show up.",
  "Today's effort is a deposit into a future you haven't met yet.",
  "Consistency turns ordinary effort into extraordinary results.",
  "The days you don't feel like it are the days that count the most.",
  "Progress is quiet. Trust the process even when it's boring.",
  "Every rep, every dose, every log — it all compounds.",
  "You're not starting over. You're continuing.",
  "Nobody regrets showing up for themselves.",
  "The best time to take care of yourself was yesterday. The next best time is now.",
  "One good day builds momentum. Stack a few together.",
  "Your future self is watching. Make them proud.",
  "Discomfort today, strength tomorrow.",
  "Habits are the compound interest of self-improvement.",
  "Small wins, tracked daily, become a life transformed.",
  "You don't need to be perfect. You need to be consistent.",
  "The tracker doesn't lie — and neither does your effort.",
  "Show up for the version of you that hasn't arrived yet.",
  "Slow progress is still progress.",
  "What gets measured gets managed.",
  "Discipline weighs ounces. Regret weighs tons.",
  "Every log is a promise kept to yourself.",
  "You are one decision away from a totally different day.",
  "Energy invested in yourself is never wasted.",
  "Momentum loves consistency.",
  "Today's checkbox is tomorrow's confidence.",
  "It's not about motivation. It's about identity — become the person who shows up.",
  "The comeback is always stronger than the setback.",
  "Small daily improvements are the key to staggering long-term results.",
  "Your only competition is who you were yesterday.",
  "Effort compounds quietly until one day it's obvious.",
  "Take care of your body. It's the only place you have to live.",
  "You don't have to see the whole staircase, just take the next step.",
  "The work you do today is invisible until suddenly it isn't.",
  "Keep the promise you made to yourself.",
];

export function quoteOfTheDay() {
  const dk = todayKey();
  let hash = 0;
  for (let i = 0; i < dk.length; i++) hash = (hash * 31 + dk.charCodeAt(i)) | 0;
  return QUOTES[Math.abs(hash) % QUOTES.length];
}

// ---------- Day-of-week scheduling ----------
// Stored as an array of these keys, e.g. ['mon','wed','fri']. Missing or
// empty on an item means "every day" (keeps older items working as-is).
export const DOW_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const DOW_LABELS = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
export const ALL_DAYS = [...DOW_KEYS];

export function dayOfWeekForDateKey(dk) {
  const [y, m, d] = dk.split('-').map(Number);
  return DOW_KEYS[new Date(y, m - 1, d).getDay()];
}

export function todayDayOfWeek() {
  return dayOfWeekForDateKey(todayKey());
}

export function isScheduledOn(daysOfWeek, dk = todayKey()) {
  if (!daysOfWeek || daysOfWeek.length === 0) return true;
  return daysOfWeek.includes(dayOfWeekForDateKey(dk));
}

export function isScheduledToday(daysOfWeek) {
  return isScheduledOn(daysOfWeek);
}

// ---------- CSV export ----------
export function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '');
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',')
    )
    .join('\n');

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

export function concentration(peptide) {
  if (!peptide?.vialAmountMg || !peptide?.bacWaterMl) return 0;
  return peptide.vialAmountMg / peptide.bacWaterMl;
}

export function mcgPerUnit(peptide) {
  const conc = concentration(peptide);
  const perMl = peptide?.unitsPerMl || 100;
  return (conc * 1000) / perMl;
}

export function remainingMg(peptide, dosesForThisPeptide) {
  const conc = concentration(peptide);
  const perUnit = mcgPerUnit(peptide);
  const usedMg = dosesForThisPeptide.reduce((sum, dose) => {
    if (!dose.taken || dose.amount == null) return sum;
    if (dose.unit === 'mg') return sum + dose.amount;
    if (dose.unit === 'mcg') return sum + dose.amount / 1000;
    if (dose.unit === 'units') return sum + (dose.amount * perUnit) / 1000;
    if (dose.unit === 'ml') return sum + dose.amount * conc;
    return sum;
  }, 0);
  return Math.max(0, peptide.vialAmountMg - usedMg);
}

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
