// Every Firestore read/write in the app, ported 1:1 from the web version's
// lib.js. The data model is unchanged, so this app and the web app read and
// write the exact same documents on the same account.
//
//   users/{uid}/peptides/{id}
//     name, source, reorderUrl, vialAmountMg, bacWaterMl, unitsPerMl, logUnit,
//     schedule: 'morning' | 'evening' | 'both'
//     status: 'active' | 'finished', reconstitutedDate, notes, createdAt
//     -> concentration (mg/mL) is DERIVED, never stored.
//
//   users/{uid}/supplements/{id}
//     name, dosage, unit, schedule, reorderUrl, active, notes, createdAt
//
//   users/{uid}/peptideDoses/{dateKey_period_peptideId}
//     peptideId, peptideName, period, dateKey, taken, amount, unit, savedAt
//
//   users/{uid}/supplementLogs/{dateKey_period_supplementId}
//     supplementId, supplementName, period, dateKey, taken, amount, unit, savedAt
//
//   users/{uid}/weightLogs/{dateKey_period}
//     dateKey, period, weight, unit, savedAt
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { ALL_DAYS } from './dates';

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
    reconstitutedDate: data.reconstitutedDate
      ? Timestamp.fromDate(new Date(data.reconstitutedDate))
      : serverTimestamp(),
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
  return setDoc(ref, {
    dateKey: dk,
    period,
    weight: Number(weight),
    unit: unit || 'lb',
    savedAt: serverTimestamp(),
  });
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
