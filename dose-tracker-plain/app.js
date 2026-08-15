import { html } from './react-setup.js';
import { AuthProvider, useAuth } from './lib.js';
import { Login, NavBar, LogScreen, PeptidesScreen, SupplementsScreen, HistoryScreen, SettingsScreen } from './screens.js';

const { useState } = React;

function App() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState('log');

  if (loading) {
    return html`<div className="min-h-screen flex items-center justify-center text-paper-dim">Loading…</div>`;
  }

  if (!user) return html`<${Login} />`;

  return html`
    <div className="min-h-screen">
      ${tab === 'log' && html`<${LogScreen} />`}
      ${tab === 'peptides' && html`<${PeptidesScreen} />`}
      ${tab === 'supplements' && html`<${SupplementsScreen} />`}
      ${tab === 'history' && html`<${HistoryScreen} />`}
      ${tab === 'settings' && html`<${SettingsScreen} />`}
      <${NavBar} active=${tab} onChange=${setTab} />
    </div>
  `;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  html`
    <${React.StrictMode}>
      <${AuthProvider}>
        <${App} />
      <//>
    <//>
  `
);

if ('serviceWorker' in navigator) {
  // When a new service worker takes over (see skipWaiting/clients.claim in
  // service-worker.js), reload once so this page picks up the fresh JS
  // instead of running old code until you manually close and reopen.
  let reloadedForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadedForUpdate) return;
    reloadedForUpdate = true;
    window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
