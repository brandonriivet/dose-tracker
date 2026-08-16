// Re-exported from the repo-root shared/ folder, which dose-tracker-plain
// imports too — one definition of the 4am rollover and the scheduling
// rules for every app.
//
// This file stays as the import site so screens keep importing
// '../lib/dates' and nothing needs to know where the implementation lives.
export {
  ALL_DAYS,
  DOW_KEYS,
  DOW_LABELS,
  MONTH_NAMES,
  WEEKDAY_HEADERS,
  dateKey,
  dayOfWeekForDateKey,
  dayShortSummary,
  formatDateKeyFromDate,
  formatFriendlyDate,
  formatHeaderDate,
  formatTime,
  isScheduledOn,
  parseDateKey,
  shiftDateKey,
  todayKey,
} from '../../../shared/dates.js';
