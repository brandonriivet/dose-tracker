import { toCsv } from './csv.shared';

export { toCsv };

// The native builds write the CSV into the app's cache and hand it to the
// system share sheet. A browser has neither, and doesn't need them: this is
// the web app's original downloadCsv() — a blob and a synthetic click,
// which is what "export" has always meant on the web.
//
// The object URL is revoked on the next tick rather than immediately;
// Safari has historically cancelled the download if the URL dies in the
// same frame as the click.
export async function shareCsv(filename, rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
