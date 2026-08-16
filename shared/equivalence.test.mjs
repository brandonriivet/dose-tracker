// Behavioural checks for shared/, pinning the values both apps depend on.
//
// Written while deduplicating dose-tracker-plain/lib.js and mobile/src/lib,
// to prove the merged implementations still did exactly what the two
// separate copies did. Worth keeping: these are the rules the whole app
// rests on — the 4am boundary, ordinal dates, and how much is left in a
// vial — and none of them are covered by the e2e run.
//
//   node shared/equivalence.test.mjs
import * as S from './dates.js';
import * as Q from './quotes.js';
import * as D from './dosing.js';

let pass = 0, fail = 0;
const eq = (name, a, b) => {
  const same = JSON.stringify(a) === JSON.stringify(b);
  same ? pass++ : (fail++, console.log(`  MISMATCH ${name}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`));
};

// --- dates: check against hand-computed expectations ---
eq('dateKey 03:59 -> previous day', S.dateKey(new Date(2026, 7, 16, 3, 59)), '2026-08-15');
eq('dateKey 04:00 -> same day',     S.dateKey(new Date(2026, 7, 16, 4, 0)),  '2026-08-16');
eq('parseDateKey roundtrip', S.formatDateKeyFromDate(S.parseDateKey('2026-02-29')), '2026-03-01');
eq('shiftDateKey month edge', S.shiftDateKey('2026-08-31', 1), '2026-09-01');
eq('shiftDateKey back over year', S.shiftDateKey('2026-01-01', -1), '2025-12-31');
eq('dayOfWeekForDateKey', S.dayOfWeekForDateKey('2026-08-16'), 'sun');
eq('isScheduledOn empty = every day', S.isScheduledOn([], '2026-08-16'), true);
eq('isScheduledOn match', S.isScheduledOn(['sun'], '2026-08-16'), true);
eq('isScheduledOn miss', S.isScheduledOn(['mon'], '2026-08-16'), false);
eq('formatHeaderDate ordinal 1st', S.formatHeaderDate(new Date(2026, 7, 1)), 'Saturday, August 1st, 2026');
eq('formatHeaderDate ordinal 11th', S.formatHeaderDate(new Date(2026, 7, 11)), 'Tuesday, August 11th, 2026');
eq('formatHeaderDate ordinal 22nd', S.formatHeaderDate(new Date(2026, 7, 22)), 'Saturday, August 22nd, 2026');
eq('formatHeaderDate ordinal 23rd', S.formatHeaderDate(new Date(2026, 7, 23)), 'Sunday, August 23rd, 2026');
eq('DOW_KEYS', S.DOW_KEYS.join(), 'sun,mon,tue,wed,thu,fri,sat');
eq('dayShortSummary daily', S.dayShortSummary([]), 'Daily');
eq('dayShortSummary subset', S.dayShortSummary(['mon','wed','fri']), 'M W F');

// --- quotes: stable per day, and the same for a given key ---
eq('quoteOfTheDay is stable', Q.quoteOfTheDay(), Q.quoteOfTheDay());
eq('quoteOfTheDay is a string', typeof Q.quoteOfTheDay(), 'string');

// --- dosing ---
const vial = { vialAmountMg: 10, bacWaterMl: 2, unitsPerMl: 100 };
eq('concentration', D.concentration(vial), 5);
eq('mcgPerUnit', D.mcgPerUnit(vial), 50);
eq('remainingMg no doses', D.remainingMg(vial, []), 10);
eq('remainingMg mcg dose', D.remainingMg(vial, [{ taken: true, amount: 500, unit: 'mcg' }]), 9.5);
eq('remainingMg units dose', D.remainingMg(vial, [{ taken: true, amount: 20, unit: 'units' }]), 9);
eq('remainingMg untaken ignored', D.remainingMg(vial, [{ taken: false, amount: 500, unit: 'mcg' }]), 10);
eq('remainingMg floors at 0', D.remainingMg(vial, [{ taken: true, amount: 99, unit: 'mg' }]), 0);
// the behaviour mobile was missing:
eq('remainingMg honours priorUsedMg', D.remainingMg({ ...vial, priorUsedMg: 3 }, []), 7);
eq('remainingMg without priorUsedMg == old mobile result', D.remainingMg(vial, []), 10);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
