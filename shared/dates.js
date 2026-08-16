// Date, rollover and day-of-week scheduling helpers.
//
// Shared verbatim by the React Native app in mobile/ and the plain-files
// app in dose-tracker-plain/ — this file is the single definition of the
// 4am day boundary, which is the whole reason the log resets each morning
// without a scheduled job. It has to behave identically everywhere or the
// two apps disagree about what "today" is.
//
// Nothing in here imports anything. That is a hard constraint, not a
// coincidence: the plain app loads this straight into the browser as an ES
// module, and Metro bundles the same file for iOS, Android and web.
const ROLLOVER_HOUR = 4;


const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

function pad2(n) {
  return String(n).padStart(2, '0');
}

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

export function parseDateKey(dk) {
  const [y, m, d] = dk.split('-').map(Number);
  return new Date(y, m - 1, d);
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

export function formatHeaderDate(date = new Date()) {
  return `${WEEKDAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${ordinal(date.getDate())}, ${date.getFullYear()}`;
}

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

export function recentDateKeys(n = 4) {
  const keys = [];
  for (let i = 0; i < n; i++) keys.push(dateKey(new Date(Date.now() - i * 86400000)));
  return keys;
}

export function todayDayOfWeek() {
  return dayOfWeekForDateKey(todayKey());
}

export function isScheduledToday(daysOfWeek) {
  return isScheduledOn(daysOfWeek);
}

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function dayShortSummary(daysOfWeek) {
  if (!daysOfWeek || daysOfWeek.length === 0 || daysOfWeek.length === 7) return 'Daily';
  return DOW_KEYS.filter((k) => daysOfWeek.includes(k)).map((k) => DOW_LABELS[DOW_KEYS.indexOf(k)]).join(' ');
}
