// Turning rows into CSV text is the same everywhere; only the delivery
// differs, so that half lives in csv.js (native) and csv.web.js.
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
