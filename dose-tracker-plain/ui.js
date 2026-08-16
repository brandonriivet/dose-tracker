import { html } from './react-setup.js';

export function Card({ children, className = '', onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return html`
    <${Tag}
      onClick=${onClick}
      className=${`w-full text-left bg-ink-soft border border-ink-line rounded-xl2 shadow-card p-4 ${className}`}
    >
      ${children}
    </${Tag}>
  `;
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-amber text-ink font-semibold hover:bg-amber-bright',
    tealPrimary: 'bg-teal text-ink font-semibold hover:bg-teal-bright',
    ghost: 'bg-transparent text-paper border border-ink-line hover:bg-ink-raised',
    danger: 'bg-transparent text-coral border border-coral/40 hover:bg-coral-soft',
  };
  return html`
    <button
      className=${`rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${className}`}
      ...${props}
    >
      ${children}
    </button>
  `;
}

export function Toggle({ checked, onChange, tone = 'teal' }) {
  const bgOn = tone === 'teal' ? 'bg-teal' : 'bg-amber';
  return html`
    <button
      type="button"
      role="switch"
      aria-checked=${checked}
      onClick=${() => onChange(!checked)}
      className=${`relative w-12 h-7 rounded-full transition-colors shrink-0 ${checked ? bgOn : 'bg-ink-line'}`}
    >
      <span
        className=${`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-ink transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  `;
}

export function LabelChip({ text, tone = 'amber' }) {
  const tones = {
    amber: 'bg-amber-soft text-amber-bright border-amber/30',
    teal: 'bg-teal-soft text-teal-bright border-teal/30',
    coral: 'bg-coral-soft text-coral border-coral/30',
  };
  return html`
    <span
      className=${`relative inline-flex items-center gap-1.5 pl-3 pr-2.5 py-1 rounded-md border font-mono text-[13px] leading-none ${tones[tone]}`}
    >
      <span
        aria-hidden
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-ink"
      />
      ${text}
    </span>
  `;
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return html`
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick=${onClose} />
      <div className="relative w-full max-w-md bg-ink-raised border-t border-ink-line rounded-t-2xl p-5 pb-8 safe-bottom max-h-[85vh] overflow-y-auto animate-[slideup_0.2s_ease-out]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg">${title}</h2>
          <button onClick=${onClose} className="text-paper-dim text-2xl leading-none px-2">
            ×
          </button>
        </div>
        ${children}
      </div>
    </div>
  `;
}
