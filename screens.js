import { html } from './react-setup.js';
import { Card, Button, Toggle, LabelChip, Modal } from './ui.js';
import {
  useAuth,
  todayKey,
  formatFriendlyDate,
  formatTime,
  formatHeaderDate,
  quoteOfTheDay,
  downloadCsv,
  listenPeptides,
  addPeptide,
  updatePeptide,
  deletePeptide,
  listenSupplements,
  addSupplement,
  updateSupplement,
  deleteSupplement,
  listenPeptideLogForPeriod,
  listenSupplementLogForPeriod,
  savePeptideLog,
  saveSupplementLog,
  listenWeightForPeriod,
  saveWeightLog,
  listenRecentWeightLogs,
  listenRecentPeptideDoses,
  listenRecentSupplementLogs,
  listenPeptideHistory,
  listenSupplementHistory,
  deletePeptideDoseEntry,
  deleteSupplementLogEntry,
  deleteWeightLogEntry,
  concentration,
  mcgPerUnit,
  remainingMg,
  blendDoseBreakdown,
  componentConcentration,
  componentMcgPerUnit,
  remainingSupplementAmount,
  wipeAllData,
  isScheduledOn,
  parseDateKey,
  shiftDateKey,
  DOW_KEYS,
  DOW_LABELS,
  ALL_DAYS,
} from './lib.js';

const { useState, useEffect, useRef } = React;

/* ===================== Login ===================== */

export function Login() {
  const { login, signup, resetPassword } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await signup(email, password);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    setError('');
    setInfo('');
    if (!email) {
      setError('Type your email above first, then tap "Forgot password?" again.');
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email);
      setInfo('Reset link sent — check that email inbox.');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  }

  return html`
    <div className="min-h-screen flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-bold mb-1">Dose</h1>
        <p className="text-paper-dim mb-8 text-sm">Your peptide & supplement log.</p>

        <form onSubmit=${handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value=${email}
            onChange=${(e) => setEmail(e.target.value)}
            className="w-full bg-ink-soft border border-ink-line rounded-lg px-4 py-3 text-sm outline-none focus:border-amber"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value=${password}
            onChange=${(e) => setPassword(e.target.value)}
            className="w-full bg-ink-soft border border-ink-line rounded-lg px-4 py-3 text-sm outline-none focus:border-amber"
          />
          ${error && html`<p className="text-coral text-sm">${error}</p>`}
          ${info && html`<p className="text-teal-bright text-sm">${info}</p>`}
          <${Button} type="submit" disabled=${busy} className="w-full mt-2">
            ${mode === 'login' ? 'Log in' : 'Create account'}
          <//>
        </form>

        ${mode === 'login' && html`
          <button
            className="text-paper-faint text-xs mt-3 w-full text-center"
            onClick=${handleForgotPassword}
            disabled=${busy}
          >
            Forgot password?
          </button>
        `}

        <button
          className="text-paper-dim text-sm mt-5 w-full text-center"
          onClick=${() => setMode(mode === 'login' ? 'signup' : 'login')}
        >
          ${mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  `;
}

/* ===================== NavBar ===================== */

function SunIcon({ active }) {
  return html`
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.7" fill=${active ? 'currentColor' : 'none'} />
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8" />
      </g>
    </svg>
  `;
}
function VialIcon({ active }) {
  return html`
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 2.5h6M10 2.5v3.2c0 .5-.15.95-.45 1.35L7 10.8c-.4.5-.6 1.1-.6 1.75v6.45A2.5 2.5 0 0 0 8.9 21.5h6.2a2.5 2.5 0 0 0 2.5-2.5v-6.45c0-.65-.2-1.25-.6-1.75l-2.55-3.75A2.3 2.3 0 0 1 14 5.7V2.5"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
      />
      <path d="M7.3 14h9.4" stroke="currentColor" strokeWidth="1.7" fill=${active ? 'currentColor' : 'none'} />
    </svg>
  `;
}
function LeafIcon({ active }) {
  return html`
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 4c0 8-6 14-14 14H4c0-8 6-14 14-14h2Z"
        stroke="currentColor" strokeWidth="1.7"
        fill=${active ? 'currentColor' : 'none'} fillOpacity=${active ? 0.15 : 0}
        strokeLinejoin="round"
      />
      <path d="M6 18C10 13 14 10 19 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  `;
}
function ClockIcon({ active }) {
  return html`
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" fill=${active ? 'currentColor' : 'none'} fillOpacity=${active ? 0.15 : 0} />
      <path d="M12 7.5V12l3.2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  `;
}
function GearIcon({ active }) {
  return html`
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" fill=${active ? 'currentColor' : 'none'} fillOpacity=${active ? 0.15 : 0} />
      <path
        d="M12 3.5v2.1M12 18.4v2.1M20.5 12h-2.1M5.6 12H3.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5M17.7 17.7l-1.5-1.5M7.8 7.8L6.3 6.3"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
      />
    </svg>
  `;
}

const TABS = [
  { id: 'log', label: 'Log', icon: SunIcon },
  { id: 'peptides', label: 'Peptides', icon: VialIcon },
  { id: 'supplements', label: 'Supplements', icon: LeafIcon },
  { id: 'history', label: 'History', icon: ClockIcon },
  { id: 'settings', label: 'Settings', icon: GearIcon },
];

export function NavBar({ active, onChange }) {
  return html`
    <nav className="fixed bottom-0 left-0 right-0 bg-ink-soft/95 backdrop-blur border-t border-ink-line safe-bottom z-40">
      <div className="max-w-md mx-auto flex">
        ${TABS.map((tab) => {
          const isActive = active === tab.id;
          return html`
            <button
              key=${tab.id}
              onClick=${() => onChange(tab.id)}
              className=${`flex-1 flex flex-col items-center gap-1 py-2.5 ${isActive ? 'text-amber' : 'text-paper-faint'}`}
            >
              <${tab.icon} active=${isActive} />
              <span className="text-[11px] font-medium">${tab.label}</span>
            </button>
          `;
        })}
      </div>
    </nav>
  `;
}

/* ===================== Shared small helpers ===================== */

function EmptyState({ text }) {
  return html`<p className="text-paper-faint text-sm py-3">${text}</p>`;
}

function scheduleBadge(s) {
  if (s === 'both') return 'AM & PM';
  if (s === 'evening') return 'PM';
  return 'AM';
}

function scheduleFull(s) {
  if (s === 'both') return 'Morning & Evening';
  if (s === 'evening') return 'Evening';
  return 'Morning';
}

function peptideUnitLabel(u) {
  const map = { mg: 'mg', mcg: 'mcg', units: 'units' };
  return map[u] || u || 'mcg';
}

function supplementUnitLabel(u) {
  const map = { mg: 'mg', mcg: 'mcg', g: 'g', IU: "IU's", capsule: 'caps' };
  return map[u] || u;
}

function DaySelector({ value, onChange }) {
  const days = value && value.length ? value : ALL_DAYS;
  return html`
    <div className="flex gap-1.5">
      ${DOW_KEYS.map((key, i) => {
        const active = days.includes(key);
        return html`
          <button
            key=${key}
            type="button"
            onClick=${() => onChange(active ? days.filter((k) => k !== key) : [...days, key])}
            className=${`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${active ? 'bg-amber text-ink' : 'bg-ink-soft text-paper-faint border border-ink-line'}`}
          >
            ${DOW_LABELS[i]}
          </button>
        `;
      })}
    </div>
  `;
}

function dayShortSummary(daysOfWeek) {
  if (!daysOfWeek || daysOfWeek.length === 0 || daysOfWeek.length === 7) return 'Daily';
  return DOW_KEYS.filter((k) => daysOfWeek.includes(k)).map((k) => DOW_LABELS[DOW_KEYS.indexOf(k)]).join(' ');
}

function blankBlendComponents() {
  return [{ name: '', mg: '' }, { name: '', mg: '' }, { name: '', mg: '' }, { name: '', mg: '' }];
}

// Shared by AddPeptideModal (new vial) and PeptideCard (editing an existing
// one) - a checkbox that reveals up to 4 {name, mg} rows for vials that mix
// more than one peptide together.
function BlendEditor({ isBlend, setIsBlend, components, setComponents }) {
  function updateComponent(i, field, value) {
    setComponents(components.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  }
  const sum = components.reduce((s, c) => s + (Number(c.mg) || 0), 0);

  return html`
    <div>
      <label className="flex items-center gap-2 text-sm text-paper-dim mb-2">
        <input type="checkbox" checked=${isBlend} onChange=${(e) => setIsBlend(e.target.checked)} />
        This is a blend (multiple peptides in one vial)
      </label>
      ${isBlend && html`
        <div className="space-y-2">
          ${components.map((c, i) => html`
            <div key=${i} className="flex gap-2">
              <input
                value=${c.name}
                onChange=${(e) => updateComponent(i, 'name', e.target.value)}
                placeholder=${`Peptide ${i + 1} name`}
                className="input flex-1"
              />
              <input
                type="number" step="any" inputMode="decimal"
                value=${c.mg}
                onChange=${(e) => updateComponent(i, 'mg', e.target.value)}
                placeholder="mg"
                className="input w-20 font-mono"
              />
            </div>
          `)}
          ${sum > 0 && html`<p className="text-xs text-paper-faint">Parts sum to ${sum} mg</p>`}
        </div>
      `}
    </div>
  `;
}

/* ===================== Log screen ===================== */

const PERIODS = [
  { id: 'morning', label: 'Morning' },
  { id: 'evening', label: 'Evening' },
];
const CATEGORIES = [
  { id: 'supplements', label: 'Supplements' },
  { id: 'peptides', label: 'Peptides' },
  { id: 'weight', label: 'Daily Weight' },
];

const MONTH_NAMES_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function DateCalendarModal({ open, onClose, selectedDateKey, onSelect }) {
  const seed = parseDateKey(selectedDateKey);
  const [viewYear, setViewYear] = useState(seed.getFullYear());
  const [viewMonth, setViewMonth] = useState(seed.getMonth());

  if (!open) return null;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const todayDk = todayKey();

  function goPrevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else { setViewMonth(viewMonth - 1); }
  }
  function goNextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else { setViewMonth(viewMonth + 1); }
  }

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  return html`
    <${Modal} open=${open} onClose=${onClose} title=${`${MONTH_NAMES_FULL[viewMonth]} ${viewYear}`}>
      <div className="flex items-center justify-between mb-3">
        <button onClick=${goPrevMonth} className="text-paper-dim px-3 py-1 text-lg">‹</button>
        <button className="text-xs text-amber-bright underline" onClick=${() => onSelect(todayDk)}>Jump to today</button>
        <button onClick=${goNextMonth} className="text-paper-dim px-3 py-1 text-lg">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-paper-faint mb-1.5">
        ${WEEKDAY_HEADERS.map((w, i) => html`<div key=${i}>${w}</div>`)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        ${cells.map((day, i) => {
          if (day == null) return html`<div key=${`empty${i}`} />`;
          const dk = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = dk === selectedDateKey;
          const isToday = dk === todayDk;
          return html`
            <button
              key=${dk}
              onClick=${() => onSelect(dk)}
              className=${`aspect-square rounded-md text-sm flex items-center justify-center transition-colors ${
                isSelected ? 'bg-amber text-ink font-semibold' : isToday ? 'border border-amber text-amber-bright' : 'text-paper hover:bg-ink-soft'
              }`}
            >
              ${day}
            </button>
          `;
        })}
      </div>
    <//>
  `;
}

export function LogScreen({ initialDateKey }) {
  const [period, setPeriod] = useState('morning');
  const [category, setCategory] = useState('supplements');
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey || todayKey());
  const [showCalendar, setShowCalendar] = useState(false);

  const todayDk = todayKey();
  const isToday = selectedDateKey === todayDk;
  const isFuture = selectedDateKey > todayDk;

  function goPrevDay() {
    setSelectedDateKey(shiftDateKey(selectedDateKey, -1));
  }
  function goNextDay() {
    setSelectedDateKey(shiftDateKey(selectedDateKey, 1));
  }
  function handleCalendarSelect(dk) {
    setSelectedDateKey(dk);
    setShowCalendar(false);
  }

  return html`
    <div className="px-4 pt-4 pb-28 max-w-md mx-auto safe-top">
      <p className="text-paper-dim text-sm font-medium mb-0.5">${formatHeaderDate()}</p>
      <p className="text-paper-faint text-[11px] italic mb-4">${quoteOfTheDay()}</p>

      <div className="flex items-center gap-2 mb-3">
        <button onClick=${goPrevDay} className="w-9 h-9 shrink-0 rounded-lg bg-ink-soft border border-ink-line text-paper-dim flex items-center justify-center text-lg" aria-label="Previous day">‹</button>
        <button
          onClick=${() => setShowCalendar(true)}
          className=${`flex-1 py-2 rounded-lg text-sm font-medium text-center border ${
            isToday ? 'bg-ink-soft border-ink-line text-paper' : isFuture ? 'bg-teal-soft border-teal/40 text-teal-bright' : 'bg-coral-soft border-coral/40 text-coral'
          }`}
        >
          ${formatFriendlyDate(selectedDateKey)}
        </button>
        <button onClick=${goNextDay} className="w-9 h-9 shrink-0 rounded-lg bg-ink-soft border border-ink-line text-paper-dim flex items-center justify-center text-lg" aria-label="Next day">›</button>
        <button onClick=${() => setShowCalendar(true)} className="w-9 h-9 shrink-0 rounded-lg bg-ink-soft border border-ink-line text-paper-dim flex items-center justify-center" aria-label="Open calendar">📅</button>
      </div>

      ${!isToday && html`
        <div className=${`flex items-center justify-between gap-2 border rounded-lg px-3 py-2 mb-3 ${isFuture ? 'bg-teal-soft border-teal/30' : 'bg-coral-soft border-coral/30'}`}>
          <p className=${`text-xs font-medium ${isFuture ? 'text-teal-bright' : 'text-coral'}`}>
            ${isFuture ? `Previewing ${formatFriendlyDate(selectedDateKey)} — view only` : `Logging for ${formatFriendlyDate(selectedDateKey)} — not today`}
          </p>
          <button className="text-xs text-paper-faint underline shrink-0" onClick=${() => setSelectedDateKey(todayDk)}>Back to today</button>
        </div>
      `}

      <div className="flex bg-ink-soft border border-ink-line rounded-lg p-1 mb-3">
        ${PERIODS.map((p) => html`
          <button
            key=${p.id}
            onClick=${() => setPeriod(p.id)}
            className=${`flex-1 py-2 rounded-md text-sm font-semibold font-display transition-colors ${period === p.id ? 'bg-amber text-ink' : 'text-paper-dim'}`}
          >
            ${p.label}
          </button>
        `)}
      </div>

      <div className="flex border-b border-ink-line mb-5">
        ${CATEGORIES.map((c) => html`
          <button
            key=${c.id}
            onClick=${() => setCategory(c.id)}
            className=${`flex-1 pb-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${category === c.id ? 'border-amber text-paper' : 'border-transparent text-paper-faint'}`}
          >
            ${c.label}
          </button>
        `)}
      </div>

      ${category === 'supplements' && html`<${SupplementLogList} key=${`sup-${period}-${selectedDateKey}`} period=${period} dateKey=${selectedDateKey} readOnly=${isFuture} />`}
      ${category === 'peptides' && html`<${PeptideLogList} key=${`pep-${period}-${selectedDateKey}`} period=${period} dateKey=${selectedDateKey} readOnly=${isFuture} />`}
      ${category === 'weight' && html`<${WeightLogList} key=${`wt-${period}-${selectedDateKey}`} period=${period} dateKey=${selectedDateKey} readOnly=${isFuture} />`}

      <${DateCalendarModal} open=${showCalendar} onClose=${() => setShowCalendar(false)} selectedDateKey=${selectedDateKey} onSelect=${handleCalendarSelect} />
    </div>
  `;
}

function PeptideLogList({ period, dateKey: dateKeyProp, readOnly }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [savedRows, setSavedRows] = useState([]);
  const [draft, setDraft] = useState({});
  const [detailItem, setDetailItem] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const seeded = useRef(false);

  const dk = dateKeyProp || todayKey();

  useEffect(() => {
    if (!user) return;
    const u1 = listenPeptides(user.uid, setItems);
    if (readOnly) return () => u1();
    const u2 = listenPeptideLogForPeriod(user.uid, dk, period, setSavedRows);
    return () => { u1(); u2(); };
  }, [user, period, readOnly]);

  const scoped = items.filter(
    (p) =>
      p.status !== 'finished' &&
      ((p.schedule || 'morning') === period || p.schedule === 'both') &&
      isScheduledOn(p.daysOfWeek, dk)
  );

  useEffect(() => {
    if (seeded.current || items.length === 0) return;
    const next = {};
    for (const p of scoped) {
      const saved = savedRows.find((r) => r.peptideId === p.id);
      next[p.id] = { taken: saved?.taken ?? false, amount: saved?.amount != null ? String(saved.amount) : '' };
    }
    setDraft(next);
    seeded.current = true;
  }, [items, savedRows]);

  function toggle(id, next) {
    setDraft((d) => ({ ...d, [id]: { ...d[id], taken: next } }));
  }
  function setAmount(id, value) {
    setDraft((d) => ({ ...d, [id]: { ...d[id], amount: value } }));
  }
  function clearAll() {
    const next = {};
    for (const p of scoped) next[p.id] = { taken: false, amount: '' };
    setDraft(next);
  }
  async function save() {
    const rows = scoped.map((p) => ({
      itemId: p.id,
      itemName: p.name,
      taken: draft[p.id]?.taken ?? false,
      amount: draft[p.id]?.amount ?? '',
      unit: p.logUnit || 'mcg',
    }));
    await savePeptideLog(user.uid, dk, period, rows);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  if (items.length > 0 && scoped.length === 0) {
    return html`<${EmptyState} text=${readOnly ? `Nothing scheduled for ${period} on this day.` : `No peptides scheduled for ${period}. Add or edit one from the Peptides tab.`} />`;
  }
  if (items.length === 0) {
    return html`<${EmptyState} text="No reconstituted peptides yet. Add one from the Peptides tab." />`;
  }

  if (readOnly) {
    return html`
      <div>
        ${scoped.map((p) => html`
          <${Card} key=${p.id} className="mb-2.5 opacity-80">
            <div className="flex items-center justify-between">
              <button onClick=${() => setDetailItem(p)} className="flex-1 text-left min-w-0">
                <p className="font-medium truncate">${p.name}</p>
              </button>
              <span className="text-[10px] uppercase tracking-wide text-paper-faint border border-ink-line rounded px-2 py-1 shrink-0">Scheduled</span>
            </div>
          <//>
        `)}
        <p className="text-xs text-paper-faint text-center mt-4">This is a preview — come back on this day to log it.</p>
        <${ItemDetailModal} open=${!!detailItem} onClose=${() => setDetailItem(null)} item=${detailItem} kind="peptide" />
      </div>
    `;
  }

  return html`
    <div>
      ${scoped.map((p) => {
        const row = draft[p.id] || { taken: false, amount: '' };
        const breakdown = row.taken && row.amount !== '' ? blendDoseBreakdown(p, row.amount, p.logUnit || 'mcg') : null;
        return html`
          <${Card} key=${p.id} className="mb-2.5">
            <div className="flex items-center gap-3">
              <button onClick=${() => setDetailItem(p)} className="flex-1 text-left min-w-0">
                <p className="font-medium truncate">${p.name}</p>
              </button>
              <${Toggle} checked=${row.taken} onChange=${(next) => toggle(p.id, next)} tone="amber" />
              <input
                type="number" step="any" inputMode="decimal"
                disabled=${!row.taken}
                value=${row.amount}
                onChange=${(e) => setAmount(p.id, e.target.value)}
                className="input font-mono text-center w-20 py-2 disabled:opacity-40"
              />
              <span className="text-xs text-paper-dim w-12 shrink-0">${peptideUnitLabel(p.logUnit)}</span>
            </div>
            ${breakdown && html`
              <p className="text-xs text-teal-bright font-mono mt-2 pl-1">
                ${breakdown.map((c) => `${c.mg.toFixed(2)}mg ${c.name}`).join(' · ')}
              </p>
            `}
          <//>
        `;
      })}

      <div className="flex gap-3 mt-5">
        <${Button} variant="ghost" className="flex-1" onClick=${clearAll}>Clear all<//>
        <${Button} className="flex-1" onClick=${save}>
          ${savedFlash ? 'Saved ✓' : 'Save'}
        <//>
      </div>

      <${ItemDetailModal} open=${!!detailItem} onClose=${() => setDetailItem(null)} item=${detailItem} kind="peptide" />
    </div>
  `;
}

function SupplementLogList({ period, dateKey: dateKeyProp, readOnly }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [savedRows, setSavedRows] = useState([]);
  const [draft, setDraft] = useState({});
  const [detailItem, setDetailItem] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const seeded = useRef(false);

  const dk = dateKeyProp || todayKey();

  useEffect(() => {
    if (!user) return;
    const u1 = listenSupplements(user.uid, setItems);
    if (readOnly) return () => u1();
    const u2 = listenSupplementLogForPeriod(user.uid, dk, period, setSavedRows);
    return () => { u1(); u2(); };
  }, [user, period, readOnly]);

  const scoped = items.filter(
    (s) =>
      s.active !== false &&
      ((s.schedule || 'morning') === period || s.schedule === 'both') &&
      isScheduledOn(s.daysOfWeek, dk)
  );

  useEffect(() => {
    if (seeded.current || items.length === 0) return;
    const next = {};
    for (const s of scoped) {
      const saved = savedRows.find((r) => r.supplementId === s.id);
      next[s.id] = { taken: saved?.taken ?? false, amount: saved?.amount != null ? String(saved.amount) : String(s.dosage) };
    }
    setDraft(next);
    seeded.current = true;
  }, [items, savedRows]);

  function toggle(id, next) {
    setDraft((d) => ({ ...d, [id]: { ...d[id], taken: next } }));
  }
  function setAmount(id, value) {
    setDraft((d) => ({ ...d, [id]: { ...d[id], amount: value } }));
  }
  function clearAll() {
    const next = {};
    for (const s of scoped) next[s.id] = { taken: false, amount: String(s.dosage) };
    setDraft(next);
  }
  async function save() {
    const rows = scoped.map((s) => ({
      itemId: s.id,
      itemName: s.name,
      taken: draft[s.id]?.taken ?? false,
      amount: draft[s.id]?.amount ?? '',
      unit: s.unit,
    }));
    await saveSupplementLog(user.uid, dk, period, rows);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  if (items.length > 0 && scoped.length === 0) {
    return html`<${EmptyState} text=${readOnly ? `Nothing scheduled for ${period} on this day.` : `No supplements scheduled for ${period}. Add or edit one from the Supplements tab.`} />`;
  }
  if (items.length === 0) {
    return html`<${EmptyState} text="No supplements yet. Add your daily stack from the Supplements tab." />`;
  }

  if (readOnly) {
    return html`
      <div>
        ${scoped.map((s) => html`
          <${Card} key=${s.id} className="mb-2.5 opacity-80">
            <div className="flex items-center justify-between">
              <button onClick=${() => setDetailItem(s)} className="flex-1 text-left min-w-0">
                <p className="font-medium truncate">${s.name}</p>
                <p className="text-xs text-paper-dim mt-0.5 font-mono">${s.dosage}${s.unit === 'capsule' ? ' capsule' : s.unit}</p>
              </button>
              <span className="text-[10px] uppercase tracking-wide text-paper-faint border border-ink-line rounded px-2 py-1 shrink-0">Scheduled</span>
            </div>
          <//>
        `)}
        <p className="text-xs text-paper-faint text-center mt-4">This is a preview — come back on this day to log it.</p>
        <${ItemDetailModal} open=${!!detailItem} onClose=${() => setDetailItem(null)} item=${detailItem} kind="supplement" />
      </div>
    `;
  }

  return html`
    <div>
      ${scoped.map((s) => {
        const row = draft[s.id] || { taken: false, amount: '' };
        return html`
          <${Card} key=${s.id} className="mb-2.5">
            <div className="flex items-center gap-3">
              <button onClick=${() => setDetailItem(s)} className="flex-1 text-left min-w-0">
                <p className="font-medium truncate">${s.name}</p>
              </button>
              <${Toggle} checked=${row.taken} onChange=${(next) => toggle(s.id, next)} tone="teal" />
              <input
                type="number" step="any" inputMode="decimal"
                disabled=${!row.taken}
                value=${row.amount}
                onChange=${(e) => setAmount(s.id, e.target.value)}
                className="input font-mono text-center w-20 py-2 disabled:opacity-40"
              />
              <span className="text-xs text-paper-dim w-12 shrink-0">${supplementUnitLabel(s.unit)}</span>
            </div>
          <//>
        `;
      })}

      <div className="flex gap-3 mt-5">
        <${Button} variant="ghost" className="flex-1" onClick=${clearAll}>Clear all<//>
        <${Button} variant="tealPrimary" className="flex-1" onClick=${save}>
          ${savedFlash ? 'Saved ✓' : 'Save'}
        <//>
      </div>

      <${ItemDetailModal} open=${!!detailItem} onClose=${() => setDetailItem(null)} item=${detailItem} kind="supplement" />
    </div>
  `;
}

function WeightChart({ entries }) {
  if (entries.length < 2) {
    return html`<p className="text-paper-faint text-sm py-3">Log a few more days to see your trend here.</p>`;
  }

  const width = 600;
  const height = 160;
  const padX = 10;
  const padY = 16;
  const weights = entries.map((e) => e.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const points = entries.map((e, i) => ({
    x: padX + (i / (entries.length - 1)) * (width - padX * 2),
    y: padY + (1 - (e.weight - min) / range) * (height - padY * 2),
    e,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padY} L ${points[0].x.toFixed(1)} ${height - padY} Z`;

  const first = entries[0];
  const last = entries[entries.length - 1];
  const delta = last.weight - first.weight;
  const deltaLabel = `${delta > 0 ? '+' : ''}${delta.toFixed(1)} ${last.unit}`;

  return html`
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-2xl font-display font-semibold">
          ${last.weight.toFixed(1)} <span className="text-sm text-paper-dim font-body">${last.unit}</span>
        </p>
        <p className="text-xs text-paper-dim font-mono">${deltaLabel} over ${entries.length} logged days</p>
      </div>
      <svg viewBox=${`0 0 ${width} ${height}`} className="w-full h-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F2760E" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F2760E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d=${areaPath} fill="url(#weightFill)" stroke="none" />
        <path d=${linePath} fill="none" stroke="#F2760E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ${points.map((p, i) => html`
          <circle key=${i} cx=${p.x} cy=${p.y} r="3.5" fill="#0A0908" stroke="#F2760E" strokeWidth="2" />
        `)}
      </svg>
      <div className="flex justify-between text-[10px] text-paper-faint mt-1">
        <span>${formatFriendlyDate(first.dateKey)}</span>
        <span>${formatFriendlyDate(last.dateKey)}</span>
      </div>
    </div>
  `;
}

function WeightLogList({ period, dateKey: dateKeyProp, readOnly }) {
  const { user } = useAuth();
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('lb');
  const [saved, setSaved] = useState(null);
  const [recent, setRecent] = useState([]);
  const [savedFlash, setSavedFlash] = useState(false);

  const dk = dateKeyProp || todayKey();

  useEffect(() => {
    if (!user) return;
    const u2 = listenRecentWeightLogs(user.uid, setRecent, 90);
    if (readOnly) return () => u2();
    const u1 = listenWeightForPeriod(user.uid, dk, period, (data) => {
      setSaved(data);
      if (data) {
        setWeight(String(data.weight));
        setUnit(data.unit);
      } else {
        setWeight('');
      }
    });
    return () => { u1(); u2(); };
  }, [user, period, readOnly]);

  async function save() {
    if (!weight) return;
    await saveWeightLog(user.uid, dk, period, { weight, unit });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function clear() {
    setWeight('');
  }

  const history = recent.filter((r) => r.dateKey !== dk).slice(0, 7);

  const dayMap = {};
  for (const r of recent) {
    (dayMap[r.dateKey] ??= []).push(r);
  }
  const chartEntries = Object.keys(dayMap)
    .sort()
    .slice(-30)
    .map((k) => {
      const rows = dayMap[k];
      return {
        dateKey: k,
        weight: rows.reduce((sum, r) => sum + r.weight, 0) / rows.length,
        unit: rows[rows.length - 1].unit,
      };
    });

  return html`
    <div>
      ${!readOnly && html`
        <${Card} className="mb-5">
          <div className="flex items-center gap-3">
            <input
              type="number" step="any" inputMode="decimal"
              value=${weight}
              onChange=${(e) => setWeight(e.target.value)}
              placeholder="0.0"
              className="input font-mono text-lg text-center flex-1"
            />
            <div className="flex bg-ink border border-ink-line rounded-lg p-1">
              ${['lb', 'kg'].map((u) => html`
                <button
                  key=${u}
                  onClick=${() => setUnit(u)}
                  className=${`px-3 py-1.5 rounded-md text-sm ${unit === u ? 'bg-amber text-ink font-semibold' : 'text-paper-dim'}`}
                >
                  ${u}
                </button>
              `)}
            </div>
          </div>
          ${saved && html`<p className="text-xs text-teal mt-2">Logged for ${period} today</p>`}
        <//>

        <div className="flex gap-3 mb-6">
          <${Button} variant="ghost" className="flex-1" onClick=${clear}>Clear<//>
          <${Button} className="flex-1" onClick=${save} disabled=${!weight}>
            ${savedFlash ? 'Saved ✓' : 'Save'}
          <//>
        </div>
      `}

      ${readOnly && html`
        <p className="text-xs text-paper-faint text-center mb-4">Weight can't be logged for a future day — come back when it arrives.</p>
      `}

      <${Card} className="mb-6">
        <p className="text-xs text-paper-dim uppercase tracking-wide mb-3">Last 30 days</p>
        <${WeightChart} entries=${chartEntries} />
      <//>

      ${history.length > 0 && html`
        <div>
          <p className="text-xs text-paper-dim uppercase tracking-wide mb-2.5">Recent</p>
          <div className="space-y-1.5">
            ${history.map((h) => html`
              <div key=${h.id} className="flex items-center justify-between text-sm px-1">
                <span className="text-paper-dim">
                  ${formatFriendlyDate(h.dateKey)} · <span className="capitalize">${h.period}</span>
                </span>
                <span className="font-mono">${h.weight} ${h.unit}</span>
              </div>
            `)}
          </div>
        </div>
      `}
    </div>
  `;
}

/* ===================== Peptides screen (inventory) ===================== */

function SimpleRow({ label, value }) {
  return html`
    <div className="flex justify-between">
      <span className="text-paper-dim">${label}</span>
      <span className="font-mono">${value}</span>
    </div>
  `;
}

function PeptideCard({ peptide: p, doses, uid, expanded, onToggleExpand }) {
  const [editSchedule, setEditSchedule] = useState(p.schedule || 'morning');
  const [editDays, setEditDays] = useState(p.daysOfWeek && p.daysOfWeek.length ? p.daysOfWeek : ALL_DAYS);
  const [savedFlash, setSavedFlash] = useState(false);
  const [editIsBlend, setEditIsBlend] = useState(!!p.isBlend);
  const [editBlendComponents, setEditBlendComponents] = useState(() => {
    const existing = Array.isArray(p.blendComponents) ? p.blendComponents : [];
    const padded = [...existing];
    while (padded.length < 4) padded.push({ name: '', mg: '' });
    return padded;
  });
  const [blendSavedFlash, setBlendSavedFlash] = useState(false);
  const [editPriorUsed, setEditPriorUsed] = useState(String(p.priorUsedMg || 0));
  const [priorUsedSavedFlash, setPriorUsedSavedFlash] = useState(false);

  const left = remainingMg(p, doses.filter((d) => d.peptideId === p.id));
  const pct = p.vialAmountMg ? left / p.vialAmountMg : 0;
  const low = pct < 0.15;

  async function saveSchedule() {
    await updatePeptide(uid, p.id, { schedule: editSchedule, daysOfWeek: editDays });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }

  async function savePriorUsed() {
    await updatePeptide(uid, p.id, { priorUsedMg: Number(editPriorUsed) || 0 });
    setPriorUsedSavedFlash(true);
    setTimeout(() => setPriorUsedSavedFlash(false), 1200);
  }

  async function saveBlend() {
    const filtered = editBlendComponents.filter((c) => c.name.trim() && c.mg !== '');
    await updatePeptide(uid, p.id, { isBlend: editIsBlend, blendComponents: filtered });
    setBlendSavedFlash(true);
    setTimeout(() => setBlendSavedFlash(false), 1200);
  }

  return html`
    <${Card} className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-medium truncate">${p.name}</p>
          <span className="text-[10px] uppercase tracking-wide text-paper-faint border border-ink-line rounded px-1.5 py-0.5 shrink-0">
            ${scheduleBadge(p.schedule)} · ${dayShortSummary(p.daysOfWeek)}
          </span>
          ${p.isBlend && html`
            <span className="text-[10px] uppercase tracking-wide text-teal-bright border border-teal/40 rounded px-1.5 py-0.5 shrink-0">Blend</span>
          `}
        </div>
        <${LabelChip} tone="amber" text=${`${concentration(p).toFixed(2)} mg/mL`} />
      </div>
      <div className="h-1.5 bg-ink-line rounded-full overflow-hidden mb-2">
        <div
          className=${`h-full rounded-full ${low ? 'bg-coral' : 'bg-amber'}`}
          style=${{ width: `${Math.max(2, pct * 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className=${`font-mono ${low ? 'text-coral' : 'text-paper-dim'}`}>
          ${left.toFixed(1)} mg left of ${p.vialAmountMg} mg
        </span>
        <button className="text-paper-faint" onClick=${onToggleExpand}>
          ${expanded ? 'Hide' : 'Details'}
        </button>
      </div>

      ${expanded && html`
        <div className="mt-3 pt-3 border-t border-ink-line space-y-2 text-sm">
          <${SimpleRow} label="Source" value=${p.source || '—'} />
          <${SimpleRow} label="Reconstituted" value=${p.reconstitutedDate?.toDate?.().toLocaleDateString() ?? '—'} />
          <${SimpleRow} label="BAC water" value=${`${p.bacWaterMl} mL`} />
          <${SimpleRow} label=${`mcg / unit (U-${p.unitsPerMl || 100})`} value=${`${mcgPerUnit(p).toFixed(1)} mcg`} />
          ${p.notes && html`<${SimpleRow} label="Notes" value=${p.notes} />`}

          <div className="pt-3">
            <p className="text-xs text-paper-dim uppercase tracking-wide mb-1.5">Edit schedule</p>
            <div className="flex bg-ink-soft border border-ink-line rounded-lg p-1 mb-2">
              ${[['morning', 'Morning'], ['evening', 'Evening'], ['both', 'Both']].map(([val, lbl]) => html`
                <button key=${val} type="button" onClick=${() => setEditSchedule(val)}
                  className=${`flex-1 py-1.5 rounded-md text-xs font-medium ${editSchedule === val ? 'bg-amber text-ink' : 'text-paper-dim'}`}>
                  ${lbl}
                </button>
              `)}
            </div>
            <${DaySelector} value=${editDays} onChange=${setEditDays} />
            <${Button} className="w-full mt-2" onClick=${saveSchedule}>
              ${savedFlash ? 'Saved ✓' : 'Save schedule'}
            <//>
          </div>

          <div className="pt-3">
            <p className="text-xs text-paper-dim uppercase tracking-wide mb-1.5">Vial composition</p>
            <${BlendEditor} isBlend=${editIsBlend} setIsBlend=${setEditIsBlend} components=${editBlendComponents} setComponents=${setEditBlendComponents} />
            <${Button} className="w-full mt-2" onClick=${saveBlend}>
              ${blendSavedFlash ? 'Saved ✓' : 'Save blend'}
            <//>
            ${p.isBlend && Array.isArray(p.blendComponents) && p.blendComponents.length > 0 && html`
              <div className="mt-3 pt-3 border-t border-ink-line space-y-1.5">
                ${p.blendComponents.map((c, i) => html`
                  <p key=${i} className="text-xs text-paper-dim font-mono">
                    ${c.name}: ${componentConcentration(p, Number(c.mg)).toFixed(2)}mg/mL · ${componentMcgPerUnit(p, Number(c.mg)).toFixed(1)}mcg/unit
                  </p>
                `)}
              </div>
            `}
          </div>

          <div className="pt-3">
            <p className="text-xs text-paper-dim uppercase tracking-wide mb-1.5">Already used before tracking</p>
            <div className="flex gap-2">
              <input type="number" step="any" inputMode="decimal" value=${editPriorUsed}
                onChange=${(e) => setEditPriorUsed(e.target.value)} placeholder="0" className="input font-mono flex-1" />
              <${Button} className="shrink-0" onClick=${savePriorUsed}>
                ${priorUsedSavedFlash ? 'Saved ✓' : 'Save'}
              <//>
            </div>
            <p className="text-xs text-paper-faint mt-1.5">Adjust this if your remaining-amount estimate ever drifts.</p>
          </div>

          <div className="flex gap-2 pt-3">
            <${Button} variant="ghost" className="flex-1" onClick=${() => updatePeptide(uid, p.id, { status: 'finished' })}>
              Mark finished
            <//>
            <${Button} variant="danger" className="flex-1" onClick=${() => deletePeptide(uid, p.id)}>
              Delete
            <//>
          </div>
        </div>
      `}
    <//>
  `;
}

export function PeptidesScreen() {
  const { user } = useAuth();
  const [peptides, setPeptides] = useState([]);
  const [doses, setDoses] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!user) return;
    const u1 = listenPeptides(user.uid, setPeptides);
    const u2 = listenRecentPeptideDoses(user.uid, setDoses, 500);
    return () => { u1(); u2(); };
  }, [user]);

  const active = peptides.filter((p) => p.status !== 'finished');
  const finished = peptides.filter((p) => p.status === 'finished');

  return html`
    <div className="px-4 pt-4 pb-28 max-w-md mx-auto safe-top">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Peptides</h1>
        <${Button} onClick=${() => setShowAdd(true)}>+ Add vial<//>
      </div>

      ${active.length === 0 && html`
        <p className="text-paper-faint text-sm py-3">
          No reconstituted vials yet. Add one to start tracking doses against it.
        </p>
      `}

      ${active.map((p) => html`
        <${PeptideCard}
          key=${p.id}
          peptide=${p}
          doses=${doses}
          uid=${user.uid}
          expanded=${expanded === p.id}
          onToggleExpand=${() => setExpanded(expanded === p.id ? null : p.id)}
        />
      `)}

      ${finished.length > 0 && html`
        <h2 className="text-paper-dim text-xs font-semibold uppercase tracking-wide mt-6 mb-2.5">Finished</h2>
        ${finished.map((p) => html`
          <${Card} key=${p.id} className="mb-2 opacity-60">
            <div className="flex items-center justify-between">
              <p className="font-medium">${p.name}</p>
              <button className="text-xs text-paper-faint" onClick=${() => deletePeptide(user.uid, p.id)}>
                Remove
              </button>
            </div>
          <//>
        `)}
      `}

      <${AddPeptideModal} open=${showAdd} onClose=${() => setShowAdd(false)} />
    </div>
  `;
}

const LOG_UNITS = ['mcg', 'mg', 'units'];

function Field({ label, children, className = '' }) {
  return html`
    <label className=${`block ${className}`}>
      <span className="block text-xs text-paper-dim mb-1">${label}</span>
      ${children}
    </label>
  `;
}

function AddPeptideModal({ open, onClose }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [reorderUrl, setReorderUrl] = useState('');
  const [vialAmountMg, setVialAmountMg] = useState('');
  const [bacWaterMl, setBacWaterMl] = useState('');
  const [unitsPerMl, setUnitsPerMl] = useState('100');
  const [logUnit, setLogUnit] = useState('mcg');
  const [schedule, setSchedule] = useState('morning');
  const [daysOfWeek, setDaysOfWeek] = useState(ALL_DAYS);
  const [isBlend, setIsBlend] = useState(false);
  const [blendComponents, setBlendComponents] = useState(blankBlendComponents());
  const [priorUsedMg, setPriorUsedMg] = useState('');
  const [reconstitutedDate, setReconstitutedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const conc = vialAmountMg && bacWaterMl ? (Number(vialAmountMg) / Number(bacWaterMl)).toFixed(2) : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const filteredBlend = blendComponents.filter((c) => c.name.trim() && c.mg !== '');
      await addPeptide(user.uid, {
        name, source, reorderUrl, vialAmountMg, bacWaterMl, unitsPerMl, logUnit, schedule, daysOfWeek,
        isBlend, blendComponents: filteredBlend, priorUsedMg, reconstitutedDate, notes,
      });
      reset();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setName(''); setSource(''); setReorderUrl(''); setVialAmountMg(''); setBacWaterMl(''); setNotes('');
    setIsBlend(false); setBlendComponents(blankBlendComponents()); setPriorUsedMg('');
  }

  return html`
    <${Modal} open=${open} onClose=${onClose} title="Add reconstituted vial">
      <form onSubmit=${handleSubmit} className="space-y-3">
        <${Field} label="Name">
          <input required value=${name} onChange=${(e) => setName(e.target.value)} placeholder="e.g. BPC-157" className="input" />
        <//>

        <${Field} label="Source (optional)">
          <input value=${source} onChange=${(e) => setSource(e.target.value)} placeholder="Where you got it" className="input" />
        <//>

        <${Field} label="Reorder link (optional)">
          <input type="url" value=${reorderUrl} onChange=${(e) => setReorderUrl(e.target.value)} placeholder="https://..." className="input" />
        <//>

        <div className="flex gap-3">
          <${Field} label="Vial amount (mg)" className="flex-1">
            <input required type="number" step="any" inputMode="decimal" value=${vialAmountMg}
              onChange=${(e) => setVialAmountMg(e.target.value)} placeholder="30" className="input font-mono" />
          <//>
          <${Field} label="BAC water (mL)" className="flex-1">
            <input required type="number" step="any" inputMode="decimal" value=${bacWaterMl}
              onChange=${(e) => setBacWaterMl(e.target.value)} placeholder="3" className="input font-mono" />
          <//>
        </div>

        ${conc && html`<p className="text-sm text-amber-bright font-mono">→ ${conc} mg/mL</p>`}

        <${Field} label="Vial composition">
          <${BlendEditor} isBlend=${isBlend} setIsBlend=${setIsBlend} components=${blendComponents} setComponents=${setBlendComponents} />
        <//>

        <${Field} label="Already used (mg) — if this vial isn't fresh">
          <input type="number" step="any" inputMode="decimal" value=${priorUsedMg}
            onChange=${(e) => setPriorUsedMg(e.target.value)} placeholder="0" className="input font-mono" />
        <//>

        <div className="flex gap-3">
          <${Field} label="Log dose in" className="flex-1">
            <select value=${logUnit} onChange=${(e) => setLogUnit(e.target.value)} className="input">
              ${LOG_UNITS.map((u) => html`<option key=${u} value=${u}>${u}</option>`)}
            </select>
          <//>
          ${logUnit === 'units' && html`
            <${Field} label="Units per mL (syringe)" className="flex-1">
              <input type="number" value=${unitsPerMl} onChange=${(e) => setUnitsPerMl(e.target.value)} placeholder="100" className="input font-mono" />
            <//>
          `}
        </div>

        <${Field} label="Schedule">
          <div className="flex bg-ink-soft border border-ink-line rounded-lg p-1">
            ${[['morning', 'Morning'], ['evening', 'Evening'], ['both', 'Both']].map(([val, lbl]) => html`
              <button key=${val} type="button" onClick=${() => setSchedule(val)}
                className=${`flex-1 py-1.5 rounded-md text-sm font-medium ${schedule === val ? 'bg-amber text-ink' : 'text-paper-dim'}`}>
                ${lbl}
              </button>
            `)}
          </div>
        <//>

        <${Field} label="Days of the week">
          <${DaySelector} value=${daysOfWeek} onChange=${setDaysOfWeek} />
        <//>

        <${Field} label="Reconstituted on">
          <input type="date" value=${reconstitutedDate} onChange=${(e) => setReconstitutedDate(e.target.value)} className="input font-mono" />
        <//>

        <${Field} label="Notes (optional)">
          <input value=${notes} onChange=${(e) => setNotes(e.target.value)} placeholder="Storage, dilution notes, etc." className="input" />
        <//>

        <${Button} type="submit" disabled=${busy} className="w-full mt-2">Add vial<//>
      </form>
    <//>
  `;
}

/* ===================== Supplements screen (inventory) ===================== */

function SupplementRow({ supplement: s, logs, uid, expanded, onToggleExpand }) {
  const [editSchedule, setEditSchedule] = useState(s.schedule || 'morning');
  const [editDays, setEditDays] = useState(s.daysOfWeek && s.daysOfWeek.length ? s.daysOfWeek : ALL_DAYS);
  const [savedFlash, setSavedFlash] = useState(false);
  const [editContainerAmount, setEditContainerAmount] = useState(s.containerAmount != null ? String(s.containerAmount) : '');
  const [editPriorUsed, setEditPriorUsed] = useState(String(s.priorUsedAmount || 0));
  const [containerSavedFlash, setContainerSavedFlash] = useState(false);

  const remaining = remainingSupplementAmount(s, (logs || []).filter((l) => l.supplementId === s.id));
  const pct = remaining != null && s.containerAmount ? remaining / s.containerAmount : null;
  const low = pct != null && pct < 0.15;

  async function saveSchedule() {
    await updateSupplement(uid, s.id, { schedule: editSchedule, daysOfWeek: editDays });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }

  async function saveContainer() {
    await updateSupplement(uid, s.id, {
      containerAmount: editContainerAmount === '' ? null : Number(editContainerAmount),
      priorUsedAmount: Number(editPriorUsed) || 0,
    });
    setContainerSavedFlash(true);
    setTimeout(() => setContainerSavedFlash(false), 1200);
  }

  return html`
    <${Card} className="mb-2.5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">${s.name}</p>
            <span className="text-[10px] uppercase tracking-wide text-paper-faint border border-ink-line rounded px-1.5 py-0.5 shrink-0">
              ${scheduleBadge(s.schedule)} · ${dayShortSummary(s.daysOfWeek)}
            </span>
          </div>
          <p className="text-xs text-paper-dim mt-1 font-mono">
            ${s.dosage}${s.unit === 'capsule' ? ' capsule' : s.unit}
            ${s.notes ? ` · ${s.notes}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="text-xs text-paper-faint" onClick=${onToggleExpand}>
            ${expanded ? 'Hide' : 'Edit'}
          </button>
          <button
            className="text-xs text-paper-faint"
            onClick=${() => updateSupplement(uid, s.id, { active: s.active === false })}
          >
            ${s.active === false ? 'Reactivate' : 'Pause'}
          </button>
          <button className="text-xs text-coral" onClick=${() => deleteSupplement(uid, s.id)}>
            Delete
          </button>
        </div>
      </div>

      ${remaining != null && html`
        <div className="mt-2.5">
          <div className="h-1.5 bg-ink-line rounded-full overflow-hidden mb-1.5">
            <div
              className=${`h-full rounded-full ${low ? 'bg-coral' : 'bg-teal'}`}
              style=${{ width: `${Math.max(2, pct * 100)}%` }}
            />
          </div>
          <span className=${`text-xs font-mono ${low ? 'text-coral' : 'text-paper-dim'}`}>
            ${remaining}${s.unit === 'capsule' ? ' capsules' : s.unit} left of ${s.containerAmount}${s.unit === 'capsule' ? ' capsules' : s.unit}
          </span>
        </div>
      `}

      ${expanded && html`
        <div className="mt-3 pt-3 border-t border-ink-line">
          <p className="text-xs text-paper-dim uppercase tracking-wide mb-1.5">Edit schedule</p>
          <div className="flex bg-ink-soft border border-ink-line rounded-lg p-1 mb-2">
            ${[['morning', 'Morning'], ['evening', 'Evening'], ['both', 'Both']].map(([val, lbl]) => html`
              <button key=${val} type="button" onClick=${() => setEditSchedule(val)}
                className=${`flex-1 py-1.5 rounded-md text-xs font-medium ${editSchedule === val ? 'bg-teal text-ink' : 'text-paper-dim'}`}>
                ${lbl}
              </button>
            `)}
          </div>
          <${DaySelector} value=${editDays} onChange=${setEditDays} />
          <${Button} variant="tealPrimary" className="w-full mt-2" onClick=${saveSchedule}>
            ${savedFlash ? 'Saved ✓' : 'Save schedule'}
          <//>

          <div className="pt-3 mt-3 border-t border-ink-line">
            <p className="text-xs text-paper-dim uppercase tracking-wide mb-1.5">Container tracking (optional)</p>
            <div className="flex gap-2 mb-2">
              <label className="flex-1">
                <span className="block text-[11px] text-paper-faint mb-1">Container size</span>
                <input type="number" step="any" inputMode="decimal" value=${editContainerAmount}
                  onChange=${(e) => setEditContainerAmount(e.target.value)} placeholder="e.g. 120" className="input font-mono" />
              </label>
              <label className="flex-1">
                <span className="block text-[11px] text-paper-faint mb-1">Already used</span>
                <input type="number" step="any" inputMode="decimal" value=${editPriorUsed}
                  onChange=${(e) => setEditPriorUsed(e.target.value)} placeholder="0" className="input font-mono" />
              </label>
            </div>
            <${Button} variant="tealPrimary" className="w-full" onClick=${saveContainer}>
              ${containerSavedFlash ? 'Saved ✓' : 'Save container info'}
            <//>
            <p className="text-xs text-paper-faint mt-1.5">Leave container size blank to stop tracking remaining amount for this one.</p>
          </div>
        </div>
      `}
    <//>
  `;
}

export function SupplementsScreen() {
  const { user } = useAuth();
  const [supplements, setSupplements] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!user) return;
    const u1 = listenSupplements(user.uid, setSupplements);
    const u2 = listenRecentSupplementLogs(user.uid, setLogs, 500);
    return () => { u1(); u2(); };
  }, [user]);

  return html`
    <div className="px-4 pt-4 pb-28 max-w-md mx-auto safe-top">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Supplements</h1>
        <${Button} variant="tealPrimary" onClick=${() => setShowAdd(true)}>+ Add<//>
      </div>

      ${supplements.length === 0 && html`
        <p className="text-paper-faint text-sm py-3">No supplements yet. Add your daily stack.</p>
      `}

      ${supplements.map((s) => html`
        <${SupplementRow}
          key=${s.id}
          supplement=${s}
          logs=${logs}
          uid=${user.uid}
          expanded=${expanded === s.id}
          onToggleExpand=${() => setExpanded(expanded === s.id ? null : s.id)}
        />
      `)}

      <${AddSupplementModal} open=${showAdd} onClose=${() => setShowAdd(false)} />
    </div>
  `;
}

const SUPPLEMENT_UNITS = ['mg', 'mcg', 'g', 'IU', 'capsule'];

function AddSupplementModal({ open, onClose }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('mg');
  const [schedule, setSchedule] = useState('morning');
  const [daysOfWeek, setDaysOfWeek] = useState(ALL_DAYS);
  const [reorderUrl, setReorderUrl] = useState('');
  const [containerAmount, setContainerAmount] = useState('');
  const [priorUsedAmount, setPriorUsedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await addSupplement(user.uid, { name, dosage, unit, schedule, daysOfWeek, reorderUrl, containerAmount, priorUsedAmount, notes });
      setName(''); setDosage(''); setReorderUrl(''); setNotes(''); setContainerAmount(''); setPriorUsedAmount('');
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return html`
    <${Modal} open=${open} onClose=${onClose} title="Add supplement">
      <form onSubmit=${handleSubmit} className="space-y-3">
        <label className="block">
          <span className="block text-xs text-paper-dim mb-1">Name</span>
          <input required value=${name} onChange=${(e) => setName(e.target.value)} placeholder="e.g. Magnesium glycinate" className="input" />
        </label>

        <div className="flex gap-3">
          <label className="block flex-1">
            <span className="block text-xs text-paper-dim mb-1">Dosage</span>
            <input required type="number" step="any" inputMode="decimal" value=${dosage}
              onChange=${(e) => setDosage(e.target.value)} placeholder="400" className="input font-mono" />
          </label>
          <label className="block w-32">
            <span className="block text-xs text-paper-dim mb-1">Unit</span>
            <select value=${unit} onChange=${(e) => setUnit(e.target.value)} className="input">
              ${SUPPLEMENT_UNITS.map((u) => html`<option key=${u} value=${u}>${u}</option>`)}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="block text-xs text-paper-dim mb-1">Schedule</span>
          <div className="flex bg-ink-soft border border-ink-line rounded-lg p-1">
            ${[['morning', 'Morning'], ['evening', 'Evening'], ['both', 'Both']].map(([val, lbl]) => html`
              <button key=${val} type="button" onClick=${() => setSchedule(val)}
                className=${`flex-1 py-1.5 rounded-md text-sm font-medium ${schedule === val ? 'bg-teal text-ink' : 'text-paper-dim'}`}>
                ${lbl}
              </button>
            `)}
          </div>
        </label>

        <label className="block">
          <span className="block text-xs text-paper-dim mb-1">Days of the week</span>
          <${DaySelector} value=${daysOfWeek} onChange=${setDaysOfWeek} />
        </label>

        <label className="block">
          <span className="block text-xs text-paper-dim mb-1">Reorder link (optional)</span>
          <input type="url" value=${reorderUrl} onChange=${(e) => setReorderUrl(e.target.value)} placeholder="https://..." className="input" />
        </label>

        <div className="flex gap-3">
          <label className="block flex-1">
            <span className="block text-xs text-paper-dim mb-1">Container size (optional)</span>
            <input type="number" step="any" inputMode="decimal" value=${containerAmount}
              onChange=${(e) => setContainerAmount(e.target.value)} placeholder=${`e.g. total ${unit}s in the bottle`} className="input font-mono" />
          </label>
          <label className="block flex-1">
            <span className="block text-xs text-paper-dim mb-1">Already used</span>
            <input type="number" step="any" inputMode="decimal" value=${priorUsedAmount}
              onChange=${(e) => setPriorUsedAmount(e.target.value)} placeholder="0" className="input font-mono" />
          </label>
        </div>
        <p className="text-xs text-paper-faint -mt-1.5">Leave container size blank if you don't want to track remaining amount for this one.</p>

        <label className="block">
          <span className="block text-xs text-paper-dim mb-1">Notes (optional)</span>
          <input value=${notes} onChange=${(e) => setNotes(e.target.value)} placeholder="With food, brand, etc." className="input" />
        </label>

        <${Button} variant="tealPrimary" type="submit" disabled=${busy} className="w-full mt-2">Add supplement<//>
      </form>
    <//>
  `;
}

/* ===================== Item detail modal (used by both log lists) ===================== */

const HISTORY_DAYS = 7;

function DetailRow({ label, value }) {
  return html`
    <div className="flex justify-between gap-3">
      <span className="text-paper-dim shrink-0">${label}</span>
      <span className="font-mono text-right">${value}</span>
    </div>
  `;
}

function ItemDetailModal({ open, onClose, item, kind }) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user || !item || !open) return;
    const listener = kind === 'peptide' ? listenPeptideHistory : listenSupplementHistory;
    return listener(user.uid, item.id, setHistory, 30);
  }, [user, item, open, kind]);

  if (!open || !item) return null;

  const recent = history.filter((h) => h.taken).slice(0, HISTORY_DAYS);

  return html`
    <${Modal} open=${open} onClose=${onClose} title=${item.name}>
      <div className="space-y-4">
        <div className="space-y-2 text-sm">
          ${kind === 'peptide' ? html`
            <${DetailRow} label="Source" value=${item.source || '—'} />
            <${DetailRow} label="Vial amount" value=${`${item.vialAmountMg} mg`} />
            <${DetailRow} label="BAC water" value=${`${item.bacWaterMl} mL`} />
            <${DetailRow} label="Concentration" value=${`${concentration(item).toFixed(2)} mg/mL`} />
            <${DetailRow} label=${`mcg per unit (U-${item.unitsPerMl || 100})`} value=${`${mcgPerUnit(item).toFixed(1)} mcg`} />
            <${DetailRow} label="Schedule" value=${scheduleFull(item.schedule)} />
            ${item.isBlend && Array.isArray(item.blendComponents) && item.blendComponents.length > 0 && html`
              <div className="pt-1">
                <p className="text-xs text-paper-dim uppercase tracking-wide mb-1.5">Blend — per component</p>
                <div className="space-y-1.5">
                  ${item.blendComponents.map((c, i) => html`
                    <div key=${i}>
                      <p className="text-sm font-medium">${c.name}</p>
                      <p className="text-xs text-paper-dim font-mono">
                        ${c.mg}mg · ${componentConcentration(item, Number(c.mg)).toFixed(2)}mg/mL · ${componentMcgPerUnit(item, Number(c.mg)).toFixed(1)}mcg/unit
                      </p>
                    </div>
                  `)}
                </div>
              </div>
            `}
            ${item.notes && html`<${DetailRow} label="Notes" value=${item.notes} />`}
          ` : html`
            <${DetailRow} label="Dosage" value=${`${item.dosage} ${item.unit}`} />
            <${DetailRow} label="Schedule" value=${scheduleFull(item.schedule)} />
            ${item.notes && html`<${DetailRow} label="Notes" value=${item.notes} />`}
          `}
          ${item.reorderUrl && html`
            <a
              href=${item.reorderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className=${`inline-flex items-center gap-1.5 text-sm font-medium mt-1 ${kind === 'peptide' ? 'text-amber-bright' : 'text-teal-bright'}`}
            >
              Reorder ↗
            </a>
          `}
        </div>

        <div className="pt-3 border-t border-ink-line">
          <p className="text-xs text-paper-dim uppercase tracking-wide mb-2">Last ${HISTORY_DAYS} days taken</p>
          ${recent.length === 0 && html`<p className="text-sm text-paper-faint">No entries logged yet.</p>`}
          <div className="space-y-1.5">
            ${recent.map((h) => html`
              <div key=${h.id} className="flex items-center justify-between text-sm">
                <span className="text-paper-dim">
                  ${formatFriendlyDate(h.dateKey)} · <span className="capitalize">${h.period}</span>
                </span>
                <${LabelChip} tone=${kind === 'peptide' ? 'amber' : 'teal'} text=${h.amount != null ? `${h.amount} ${h.unit}` : '—'} />
              </div>
            `)}
          </div>
        </div>
      </div>
    <//>
  `;
}

/* ===================== History screen ===================== */

function HistoryRow({ event: e, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return html`
      <${Card} className="flex items-center justify-between">
        <p className="text-xs text-coral font-medium">Remove this entry?</p>
        <div className="flex gap-3">
          <button className="text-xs text-paper-faint" onClick=${() => setConfirming(false)}>Cancel</button>
          <button className="text-xs text-coral font-semibold" onClick=${onDelete}>Remove</button>
        </div>
      <//>
    `;
  }

  return html`
    <${Card} className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">
          ${e.kind === 'peptide' ? e.data.peptideName : e.kind === 'supplement' ? e.data.supplementName : 'Body weight'}
        </p>
        <p className="text-xs text-paper-faint capitalize">${e.data.period}</p>
      </div>
      <div className="flex items-center gap-2">
        <${LabelChip}
          tone=${e.kind === 'peptide' ? 'amber' : e.kind === 'weight' ? 'coral' : 'teal'}
          text=${
            e.kind === 'weight'
              ? `${e.data.weight} ${e.data.unit}`
              : e.data.amount != null
                ? `${e.data.amount} ${e.data.unit}`
                : 'taken'
          }
        />
        <button className="text-paper-faint text-sm px-1" onClick=${() => setConfirming(true)} aria-label="Remove entry">✕</button>
      </div>
    <//>
  `;
}

export function HistoryScreen() {
  const { user } = useAuth();
  const [doses, setDoses] = useState([]);
  const [supplementLogs, setSupplementLogs] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);

  useEffect(() => {
    if (!user) return;
    const u1 = listenRecentPeptideDoses(user.uid, setDoses, 400);
    const u2 = listenRecentSupplementLogs(user.uid, setSupplementLogs, 400);
    const u3 = listenRecentWeightLogs(user.uid, setWeightLogs, 120);
    return () => { u1(); u2(); u3(); };
  }, [user]);

  const events = [
    ...doses.map((d) => ({ kind: 'peptide', dateKey: d.dateKey, data: d })),
    ...supplementLogs.map((l) => ({ kind: 'supplement', dateKey: l.dateKey, data: l })),
    ...weightLogs.map((w) => ({ kind: 'weight', dateKey: w.dateKey, data: w })),
  ];

  const grouped = {};
  for (const e of events) {
    grouped[e.dateKey] ??= [];
    grouped[e.dateKey].push(e);
  }
  for (const dk in grouped) {
    grouped[dk].sort((a, b) => (a.data.period === b.data.period ? 0 : a.data.period === 'morning' ? -1 : 1));
  }
  const dateKeys = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  function rowsFor(dk) {
    return grouped[dk].map((e) => {
      if (e.kind === 'peptide') return [dk, e.data.period, 'Peptide', e.data.peptideName, e.data.amount ?? '', e.data.unit ?? ''];
      if (e.kind === 'supplement') return [dk, e.data.period, 'Supplement', e.data.supplementName, e.data.amount ?? '', e.data.unit ?? ''];
      return [dk, e.data.period, 'Weight', 'Body weight', e.data.weight ?? '', e.data.unit ?? ''];
    });
  }

  function exportDay(dk) {
    downloadCsv(`dose-log-${dk}.csv`, [['Date', 'Period', 'Category', 'Item', 'Amount', 'Unit'], ...rowsFor(dk)]);
  }

  function exportAll() {
    const all = dateKeys.flatMap((dk) => rowsFor(dk));
    downloadCsv(`dose-log-all.csv`, [['Date', 'Period', 'Category', 'Item', 'Amount', 'Unit'], ...all]);
  }

  async function deleteEntry(e) {
    if (e.kind === 'peptide') await deletePeptideDoseEntry(user.uid, e.data.id);
    else if (e.kind === 'supplement') await deleteSupplementLogEntry(user.uid, e.data.id);
    else await deleteWeightLogEntry(user.uid, e.data.id);
  }

  return html`
    <div className="px-4 pt-4 pb-28 max-w-md mx-auto safe-top">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">History</h1>
        ${dateKeys.length > 0 && html`<${Button} variant="ghost" onClick=${exportAll}>Export all<//>`}
      </div>

      ${dateKeys.length === 0 && html`<p className="text-paper-faint text-sm py-3">Nothing saved yet.</p>`}

      ${dateKeys.map((dk) => html`
        <div key=${dk} className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-paper-dim text-xs font-semibold uppercase tracking-wide">
              ${formatFriendlyDate(dk)}
            </h2>
            <button className="text-xs text-paper-faint underline" onClick=${() => exportDay(dk)}>
              Export day
            </button>
          </div>
          <div className="space-y-2">
            ${grouped[dk].map((e) => html`
              <${HistoryRow} key=${e.data.id} event=${e} onDelete=${() => deleteEntry(e)} />
            `)}
          </div>
        </div>
      `)}
    </div>
  `;
}

/* ===================== Settings screen ===================== */

function AppUrlModal({ open, onClose }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}${window.location.pathname}`;
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API blocked in some contexts - URL is still visible/selectable below.
    }
  }

  async function share() {
    try {
      await navigator.share({ title: 'Dose', url });
    } catch {
      // Person cancelled the share sheet.
    }
  }

  return html`
    <${Modal} open=${open} onClose=${onClose} title="App link">
      <div className="space-y-4">
        <p className="text-sm text-paper-dim">
          This is the address this app is running from. Use it to open Dose
          on another device, or send it to yourself.
        </p>

        <div className="bg-ink border border-ink-line rounded-lg px-3.5 py-3 font-mono text-sm break-all">
          ${url}
        </div>

        <div className="flex gap-3">
          <${Button} variant="ghost" className="flex-1" onClick=${copy}>
            ${copied ? 'Copied ✓' : 'Copy link'}
          <//>
          ${canShare && html`
            <${Button} className="flex-1" onClick=${share}>
              Share…
            <//>
          `}
        </div>
      </div>
    <//>
  `;
}

function Section({ title, subtitle, children }) {
  return html`
    <div className="mb-7">
      <h2 className="text-paper-dim text-xs font-semibold uppercase tracking-wide mb-1">${title}</h2>
      ${subtitle && html`<p className="text-paper-faint text-xs mb-2.5">${subtitle}</p>`}
      <div className=${subtitle ? 'mt-2.5' : ''}>${children}</div>
    </div>
  `;
}

function ReorderRow({ item, tone, onSave }) {
  const [value, setValue] = useState(item.reorderUrl || '');
  const [savedFlash, setSavedFlash] = useState(false);

  async function save() {
    await onSave(value);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }

  const dirty = value !== (item.reorderUrl || '');

  return html`
    <${Card} className="mb-2.5">
      <p className="font-medium mb-2 truncate">${item.name}</p>
      <div className="flex items-center gap-2">
        <input
          type="url"
          value=${value}
          onChange=${(e) => setValue(e.target.value)}
          placeholder="https://..."
          className="input flex-1"
        />
        <${Button}
          variant=${tone === 'amber' ? 'primary' : 'tealPrimary'}
          disabled=${!dirty}
          onClick=${save}
          className="shrink-0"
        >
          ${savedFlash ? 'Saved ✓' : 'Save'}
        <//>
      </div>
      ${item.reorderUrl && !dirty && html`
        <a
          href=${item.reorderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className=${`inline-flex items-center gap-1 text-xs font-medium mt-2 ${tone === 'amber' ? 'text-amber-bright' : 'text-teal-bright'}`}
        >
          Open link ↗
        </a>
      `}
    <//>
  `;
}

function WipeDataCard({ uid }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function wipe() {
    setBusy(true);
    try {
      await wipeAllData(uid);
      setDone(true);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return html`
      <${Card}>
        <p className="text-sm text-teal-bright font-medium">All data wiped.</p>
        <p className="text-xs text-paper-faint mt-1">Reload the app to start fresh.</p>
      <//>
    `;
  }

  const unlocked = confirmText.trim().toUpperCase() === 'WIPE';

  return html`
    <${Card}>
      <p className="text-sm font-medium">Wipe all data</p>
      <p className="text-xs text-paper-faint mt-1 mb-3">
        Permanently deletes every peptide, supplement, dose, and weight entry on this account. This cannot be undone.
      </p>
      ${!confirming
        ? html`<${Button} variant="danger" onClick=${() => setConfirming(true)}>Wipe all data<//>`
        : html`
            <div className="space-y-2">
              <p className="text-xs text-coral font-medium">Type WIPE below to confirm — this can't be undone.</p>
              <input
                value=${confirmText}
                onChange=${(e) => setConfirmText(e.target.value)}
                placeholder="Type WIPE"
                className="input font-mono"
                autoFocus
              />
              <div className="flex gap-2">
                <${Button} variant="ghost" className="flex-1" onClick=${() => { setConfirming(false); setConfirmText(''); }} disabled=${busy}>Cancel<//>
                <${Button} variant="danger" className="flex-1" onClick=${wipe} disabled=${busy || !unlocked}>
                  ${busy ? 'Wiping…' : 'Yes, wipe everything'}
                <//>
              </div>
            </div>
          `}
    <//>
  `;
}

function DangerZoneModal({ open, onClose, uid }) {
  return html`
    <${Modal} open=${open} onClose=${onClose} title="Danger zone">
      <div className="space-y-3">
        <${WipeDataCard} uid=${uid} />
      </div>
    <//>
  `;
}

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const [peptides, setPeptides] = useState([]);
  const [supplements, setSupplements] = useState([]);
  const [showUrl, setShowUrl] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  useEffect(() => {
    if (!user) return;
    const u1 = listenPeptides(user.uid, setPeptides);
    const u2 = listenSupplements(user.uid, setSupplements);
    return () => { u1(); u2(); };
  }, [user]);

  return html`
    <div className="px-4 pt-4 pb-28 max-w-md mx-auto safe-top">
      <h1 className="font-display text-2xl font-semibold mb-6">Settings</h1>

      <${Section} title="Account">
        <${Card} className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">${user?.email}</p>
            <p className="text-xs text-paper-faint">Signed in</p>
          </div>
          <${Button} variant="danger" onClick=${logout}>Log out<//>
        <//>
      <//>

      <${Section} title="App">
        <${Card} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">App link</p>
            <p className="text-xs text-paper-faint">View or share the URL this app is running from</p>
          </div>
          <${Button} variant="ghost" onClick=${() => setShowUrl(true)}>Show<//>
        <//>
      <//>

      <${Section} title="Reorder links" subtitle="Set a link for each item so you can jump straight to reordering it.">
        ${peptides.length === 0 && supplements.length === 0 && html`
          <p className="text-paper-faint text-sm py-2">Add peptides or supplements first, then their reorder links will show up here.</p>
        `}
        ${peptides.map((p) => html`
          <${ReorderRow} key=${p.id} item=${p} tone="amber" onSave=${(url) => updatePeptide(user.uid, p.id, { reorderUrl: url })} />
        `)}
        ${supplements.map((s) => html`
          <${ReorderRow} key=${s.id} item=${s} tone="teal" onSave=${(url) => updateSupplement(user.uid, s.id, { reorderUrl: url })} />
        `)}
      <//>

      <${Section} title="Danger zone">
        <${Card} onClick=${() => setShowDangerZone(true)} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-coral">Wipe data & more</p>
            <p className="text-xs text-paper-faint">Destructive actions live behind this, on purpose</p>
          </div>
          <span className="text-paper-faint text-lg">›</span>
        <//>
      <//>

      <${AppUrlModal} open=${showUrl} onClose=${() => setShowUrl(false)} />
      <${DangerZoneModal} open=${showDangerZone} onClose=${() => setShowDangerZone(false)} uid=${user.uid} />
    </div>
  `;
}
