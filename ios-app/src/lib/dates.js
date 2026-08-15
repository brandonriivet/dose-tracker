// Date helpers, ported straight across from the web app's lib.js — the
// 4am-to-4am "day" is the whole reason the log resets each morning without
// any scheduled job, so it has to behave identically on both.
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

// ---------- Header date: "Friday, August 14th, 2026" ----------
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

export function isScheduledOn(daysOfWeek, dk = todayKey()) {
  if (!daysOfWeek || daysOfWeek.length === 0) return true;
  return daysOfWeek.includes(dayOfWeekForDateKey(dk));
}

export function dayShortSummary(daysOfWeek) {
  if (!daysOfWeek || daysOfWeek.length === 0 || daysOfWeek.length === 7) return 'Daily';
  return DOW_KEYS.filter((k) => daysOfWeek.includes(k)).map((k) => DOW_LABELS[DOW_KEYS.indexOf(k)]).join(' ');
}
