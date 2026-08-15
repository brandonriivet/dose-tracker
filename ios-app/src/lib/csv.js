import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// The web app's downloadCsv() triggered a browser download. On iOS there's
// no downloads folder to drop a file into, so the equivalent is: write it
// into the app's cache directory and hand it to the system share sheet,
// which is where "Save to Files", AirDrop, and Mail all live.
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

export async function shareCsv(filename, rows) {
  const file = new File(Paths.cache, filename);
  // overwrite, so re-exporting the same day twice in one session doesn't
  // throw on an already-existing file.
  file.create({ overwrite: true });
  file.write(toCsv(rows));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: filename,
  });
}
