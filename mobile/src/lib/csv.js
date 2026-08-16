import { Platform } from 'react-native';
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

// The web app's downloadCsv() triggered a browser download. On a phone the
// equivalent is: write the file into the app's own cache directory, then
// hand it to the system share sheet — which is where "Save to Files",
// AirDrop, Drive and Mail all live, so it covers both sharing the export
// and keeping it.
//
// Cache specifically, on both platforms. iOS has no downloads folder to
// drop a file into at all; on Android, writing outside the app's sandbox
// means either the WRITE_EXTERNAL_STORAGE permission (gone from Android 10
// on) or a Storage Access Framework folder prompt, and neither is worth it
// when the share sheet already offers "save" as one of its targets.
// expo-sharing hands the receiving app a readable URI either way — a
// FileProvider content:// URI on Android — with no storage permission.
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
    dialogTitle: filename,
    // iOS filters share targets by UTI; Android has no equivalent and goes
    // on the MIME type above.
    ...(Platform.OS === 'ios' && { UTI: 'public.comma-separated-values-text' }),
  });
}
