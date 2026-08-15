import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, ScreenTitle } from '../../src/components/Screen';
import { Button, Card, LabelChip, SectionHeading } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import {
  deletePeptideDoseEntry,
  deleteSupplementLogEntry,
  deleteWeightLogEntry,
  listenRecentPeptideDoses,
  listenRecentSupplementLogs,
  listenRecentWeightLogs,
} from '../../src/lib/data';
import { formatFriendlyDate } from '../../src/lib/dates';
import { shareCsv } from '../../src/lib/csv';
import { colors } from '../../src/theme';

// Bare text links have no surface of their own, so they take Android's
// borderless ripple — the bounded one would draw a box where there is no
// button.
const linkRipple = { color: 'rgba(244,239,233,0.16)', borderless: true, radius: 20 };

const CSV_HEADER = ['Date', 'Period', 'Category', 'Item', 'Amount', 'Unit'];

function HistoryRow({ event: e, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <Card style={styles.row}>
        <View style={styles.rowBetween}>
          <Text style={styles.confirmText}>Remove this entry?</Text>
          <View style={styles.confirmActions}>
            <Pressable onPress={() => setConfirming(false)} android_ripple={linkRipple} hitSlop={8}>
              <Text style={styles.linkFaint}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onDelete} android_ripple={linkRipple} hitSlop={8}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      </Card>
    );
  }

  const title =
    e.kind === 'peptide'
      ? e.data.peptideName
      : e.kind === 'supplement'
        ? e.data.supplementName
        : 'Body weight';

  const chipText =
    e.kind === 'weight'
      ? `${e.data.weight} ${e.data.unit}`
      : e.data.amount != null
        ? `${e.data.amount} ${e.data.unit}`
        : 'taken';

  return (
    <Card style={styles.row}>
      <View style={styles.rowBetween}>
        <View style={styles.grow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.period}>{e.data.period}</Text>
        </View>
        <View style={styles.rowRight}>
          <LabelChip
            tone={e.kind === 'peptide' ? 'amber' : e.kind === 'weight' ? 'coral' : 'teal'}
            text={chipText}
          />
          <Pressable
            onPress={() => setConfirming(true)}
            android_ripple={linkRipple}
            hitSlop={10}
            accessibilityLabel="Remove entry"
          >
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const [doses, setDoses] = useState([]);
  const [supplementLogs, setSupplementLogs] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);

  useEffect(() => {
    if (!user) return;
    const u1 = listenRecentPeptideDoses(user.uid, setDoses, 400);
    const u2 = listenRecentSupplementLogs(user.uid, setSupplementLogs, 400);
    const u3 = listenRecentWeightLogs(user.uid, setWeightLogs, 120);
    return () => {
      u1();
      u2();
      u3();
    };
  }, [user]);

  if (!user) return null;

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
    grouped[dk].sort((a, b) =>
      a.data.period === b.data.period ? 0 : a.data.period === 'morning' ? -1 : 1
    );
  }
  const dateKeys = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  function rowsFor(dk) {
    return grouped[dk].map((e) => {
      if (e.kind === 'peptide')
        return [dk, e.data.period, 'Peptide', e.data.peptideName, e.data.amount ?? '', e.data.unit ?? ''];
      if (e.kind === 'supplement')
        return [dk, e.data.period, 'Supplement', e.data.supplementName, e.data.amount ?? '', e.data.unit ?? ''];
      return [dk, e.data.period, 'Weight', 'Body weight', e.data.weight ?? '', e.data.unit ?? ''];
    });
  }

  async function exportRows(filename, rows) {
    try {
      await shareCsv(filename, [CSV_HEADER, ...rows]);
    } catch (err) {
      Alert.alert('Export failed', String(err?.message ?? err));
    }
  }

  async function deleteEntry(e) {
    if (e.kind === 'peptide') await deletePeptideDoseEntry(user.uid, e.data.id);
    else if (e.kind === 'supplement') await deleteSupplementLogEntry(user.uid, e.data.id);
    else await deleteWeightLogEntry(user.uid, e.data.id);
  }

  return (
    <Screen>
      <ScreenTitle
        right={
          dateKeys.length > 0 ? (
            <Button
              variant="ghost"
              onPress={() => exportRows('dose-log-all.csv', dateKeys.flatMap(rowsFor))}
            >
              Export all
            </Button>
          ) : null
        }
      >
        History
      </ScreenTitle>

      {dateKeys.length === 0 && <Text style={styles.empty}>Nothing saved yet.</Text>}

      {dateKeys.map((dk) => (
        <View key={dk} style={styles.dayBlock}>
          <View style={styles.dayHeader}>
            <SectionHeading>{formatFriendlyDate(dk)}</SectionHeading>
            <Pressable
              onPress={() => exportRows(`dose-log-${dk}.csv`, rowsFor(dk))}
              android_ripple={linkRipple}
              hitSlop={8}
            >
              <Text style={styles.exportDay}>Export day</Text>
            </Pressable>
          </View>
          <View style={styles.dayRows}>
            {grouped[dk].map((e) => (
              <HistoryRow key={e.data.id} event={e} onDelete={() => deleteEntry(e)} />
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  row: { paddingVertical: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.paper, fontSize: 14, fontWeight: '500' },
  period: { color: colors.paperFaint, fontSize: 12, textTransform: 'capitalize' },
  close: { color: colors.paperFaint, fontSize: 15, paddingHorizontal: 4 },

  confirmText: { color: colors.coral, fontSize: 12, fontWeight: '500' },
  confirmActions: { flexDirection: 'row', gap: 12 },
  linkFaint: { color: colors.paperFaint, fontSize: 12 },
  removeText: { color: colors.coral, fontSize: 12, fontWeight: '600' },

  empty: { color: colors.paperFaint, fontSize: 14, paddingVertical: 12 },
  dayBlock: { marginBottom: 24 },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  exportDay: { color: colors.paperFaint, fontSize: 12, textDecorationLine: 'underline' },
  dayRows: { gap: 8 },
});
