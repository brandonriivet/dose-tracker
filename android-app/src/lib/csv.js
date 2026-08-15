import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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

// The web app's downloadCsv() triggered a browser download. The Android
// equivalent is: write the file into the app's own cache directory, then
// hand it to the system share sheet — which on Android is also where
// "Save to Files"/Drive/Gmail live, so it covers both sharing it and
// keeping it.
//
// Cache, specifically, and not the Downloads folder: writing outside the
// app's sandbox means either the WRITE_EXTERNAL_STORAGE permission (gone
// from Android 10 on) or a Storage Access Framework folder prompt, and
// neither is worth it when the share sheet already offers "save" as one of
// its targets. expo-sharing puts the file behind a FileProvider content://
// URI and grants read permission to whichever app you pick, so the
// receiving app can read it without any storage permission at all.
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
    // Android's chooser title. (The iOS build also passes a UTI here;
    // Android has no equivalent — the MIME type is what apps filter on.)
    dialogTitle: filename,
  });
}
