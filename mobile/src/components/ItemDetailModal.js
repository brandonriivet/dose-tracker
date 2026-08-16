import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { LabelChip, Modal, SectionHeading, ripple } from './ui';
import { useAuth } from '../lib/auth';
import {
  concentration,
  listenPeptideHistory,
  listenSupplementHistory,
  mcgPerUnit,
} from '../lib/data';
import { formatFriendlyDate } from '../lib/dates';
import { colors, fonts } from '../theme';

const HISTORY_DAYS = 7;

export function scheduleFull(s) {
  if (s === 'both') return 'Morning & Evening';
  if (s === 'evening') return 'Evening';
  return 'Morning';
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function ItemDetailModal({ open, onClose, item, kind }) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user || !item || !open) return;
    const listener = kind === 'peptide' ? listenPeptideHistory : listenSupplementHistory;
    return listener(user.uid, item.id, setHistory, 30);
  }, [user, item, open, kind]);

  if (!open || !item) return null;

  const recent = history.filter((h) => h.taken).slice(0, HISTORY_DAYS);
  const accent = kind === 'peptide' ? colors.amberBright : colors.tealBright;

  return (
    <Modal open={open} onClose={onClose} title={item.name}>
      <View style={styles.section}>
        {kind === 'peptide' ? (
          <>
            <DetailRow label="Source" value={item.source || '—'} />
            <DetailRow label="Vial amount" value={`${item.vialAmountMg} mg`} />
            <DetailRow label="BAC water" value={`${item.bacWaterMl} mL`} />
            <DetailRow label="Concentration" value={`${concentration(item).toFixed(2)} mg/mL`} />
            <DetailRow
              label={`mcg per unit (U-${item.unitsPerMl || 100})`}
              value={`${mcgPerUnit(item).toFixed(1)} mcg`}
            />
            <DetailRow label="Schedule" value={scheduleFull(item.schedule)} />
            {!!item.notes && <DetailRow label="Notes" value={item.notes} />}
          </>
        ) : (
          <>
            <DetailRow label="Dosage" value={`${item.dosage} ${item.unit}`} />
            <DetailRow label="Schedule" value={scheduleFull(item.schedule)} />
            {!!item.notes && <DetailRow label="Notes" value={item.notes} />}
          </>
        )}

        {!!item.reorderUrl && (
          <Pressable
            onPress={() => Linking.openURL(item.reorderUrl).catch(() => {})}
            android_ripple={ripple}
            style={styles.reorder}
          >
            <Text style={[styles.reorderText, { color: accent }]}>Reorder ↗</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.historyBlock}>
        <SectionHeading style={styles.historyHeading}>
          Last {HISTORY_DAYS} days taken
        </SectionHeading>
        {recent.length === 0 && <Text style={styles.empty}>No entries logged yet.</Text>}
        <View style={styles.historyList}>
          {recent.map((h) => (
            <View key={h.id} style={styles.historyRow}>
              <Text style={styles.historyDate}>
                {formatFriendlyDate(h.dateKey)} · {h.period}
              </Text>
              <LabelChip
                tone={kind === 'peptide' ? 'amber' : 'teal'}
                text={h.amount != null ? `${h.amount} ${h.unit}` : '—'}
              />
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { color: colors.paperDim, fontSize: 14, flexShrink: 0 },
  rowValue: { color: colors.paper, fontFamily: fonts.mono, fontSize: 13, textAlign: 'right', flexShrink: 1 },
  reorder: { paddingTop: 4, paddingBottom: 4, borderRadius: 6, overflow: 'hidden' },
  reorderText: { fontSize: 14, fontWeight: '500' },
  historyBlock: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.inkLine },
  historyHeading: { marginBottom: 8 },
  historyList: { gap: 6 },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyDate: { color: colors.paperDim, fontSize: 14, textTransform: 'capitalize' },
  empty: { color: colors.paperFaint, fontSize: 14 },
});
