// Rows -> CSV text. Identical in both apps already; only the delivery
// differs (a browser download on the web, the share sheet on a phone),
// which stays in each app's own csv module.
export function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '');
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',')
    )
    .join('\n');
}
