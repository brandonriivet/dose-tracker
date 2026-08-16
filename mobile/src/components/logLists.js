// The three sub-tabs of the Log screen: Supplements, Peptides, Daily
// Weight. Each one owns its own draft state and Save button, exactly like
// the web app's SupplementLogList / PeptideLogList / WeightLogList.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Button, Card, EmptyState, Input, SectionHeading, Toggle, ripple } from './ui';
import { ItemDetailModal } from './ItemDetailModal';
import { WeightChart } from './WeightChart';
import { useAuth } from '../lib/auth';
import {
  listenPeptideLogForPeriod,
  listenPeptides,
  listenRecentWeightLogs,
  listenSupplementLogForPeriod,
  listenSupplements,
  listenWeightForPeriod,
  savePeptideLog,
  saveSupplementLog,
  saveWeightLog,
} from '../lib/data';
import { formatFriendlyDate, isScheduledOn, todayKey } from '../lib/dates';
import { colors, fonts, radius } from '../theme';

const SAVED_FLASH_MS = 1500;

function peptideUnitLabel(u) {
  const map = { mg: 'mg', mcg: 'mcg', units: 'units' };
  return map[u] || u || 'mcg';
}

function supplementUnitLabel(u) {
  const map = { mg: 'mg', mcg: 'mcg', g: 'g', IU: "IU's", capsule: 'caps' };
  return map[u] || u;
}

// Shared by both lists: the read-only "here's what's scheduled" card used
// when you're previewing a future day.
function PreviewRow({ item, subtitle, onPress }) {
  return (
    <Card style={styles.previewCard}>
      <View style={styles.rowBetween}>
        <Pressable onPress={onPress} android_ripple={ripple} style={styles.grow}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          {!!subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
        </Pressable>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Scheduled</Text>
        </View>
      </View>
    </Card>
  );
}

function SavedFlashButton({ flashing, onPress, variant, style, children }) {
  return (
    <Button variant={variant} onPress={onPress} style={style}>
      {flashing ? 'Saved ✓' : children}
    </Button>
  );
}

/* ===================== Peptides ===================== */

export function PeptideLogList({ period, dateKey, readOnly }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [savedRows, setSavedRows] = useState([]);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [draft, setDraft] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const dk = dateKey || todayKey();

  useEffect(() => {
    if (!user) return;
    const u1 = listenPeptides(user.uid, setItems);
    if (readOnly) return () => u1();
    const u2 = listenPeptideLogForPeriod(user.uid, dk, period, (rows) => {
      setSavedRows(rows);
      setLogsLoaded(true);
    });
    return () => {
      u1();
      u2();
    };
  }, [user, period, dk, readOnly]);

  const scoped = items.filter(
    (p) =>
      p.status !== 'finished' &&
      ((p.schedule || 'morning') === period || p.schedule === 'both') &&
      isScheduledOn(p.daysOfWeek, dk)
  );

  // Seed the draft from what's already saved, exactly once. Both listeners
  // have to have reported first, or whichever lands second gets ignored.
  // Seeding once (rather than on every snapshot) is what keeps a value
  // you're halfway through typing from being overwritten underneath you.
  // Setting state during render is React's supported way to derive state
  // from data that arrived after mount — an effect would cost a second
  // render pass with a visibly empty list in between.
  if (draft === null && items.length > 0 && (readOnly || logsLoaded)) {
    const next = {};
    for (const p of scoped) {
      const saved = savedRows.find((r) => r.peptideId === p.id);
      next[p.id] = {
        taken: saved?.taken ?? false,
        amount: saved?.amount != null ? String(saved.amount) : '',
      };
    }
    setDraft(next);
  }
  const draftRows = draft ?? {};

  function toggle(id, next) {
    setDraft((d) => ({ ...d, [id]: { ...d[id], taken: next } }));
  }

  function setAmount(id, value) {
    setDraft((d) => ({ ...d, [id]: { ...d[id], amount: value } }));
  }

  function clearAll() {
    const next = {};
    for (const p of scoped) next[p.id] = { taken: false, amount: '' };
    setDraft(next);
  }

  async function save() {
    const rows = scoped.map((p) => ({
      itemId: p.id,
      itemName: p.name,
      taken: draftRows[p.id]?.taken ?? false,
      amount: draftRows[p.id]?.amount ?? '',
      unit: p.logUnit || 'mcg',
    }));
    await savePeptideLog(user.uid, dk, period, rows);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), SAVED_FLASH_MS);
  }

  if (items.length > 0 && scoped.length === 0) {
    return (
      <EmptyState
        text={
          readOnly
            ? `Nothing scheduled for ${period} on this day.`
            : `No peptides scheduled for ${period}. Add or edit one from the Peptides tab.`
        }
      />
    );
  }
  if (items.length === 0) {
    return <EmptyState text="No reconstituted peptides yet. Add one from the Peptides tab." />;
  }

  if (readOnly) {
    return (
      <View>
        {scoped.map((p) => (
          <PreviewRow key={p.id} item={p} onPress={() => setDetailItem(p)} />
        ))}
        <Text style={styles.previewNote}>
          This is a preview — come back on this day to log it.
        </Text>
        <ItemDetailModal
          open={!!detailItem}
          onClose={() => setDetailItem(null)}
          item={detailItem}
          kind="peptide"
        />
      </View>
    );
  }

  return (
    <View>
      {scoped.map((p) => {
        const row = draftRows[p.id] || { taken: false, amount: '' };
        return (
          <Card key={p.id} style={styles.logCard}>
            <View style={styles.logRow}>
              <Pressable onPress={() => setDetailItem(p)} android_ripple={ripple} style={styles.grow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {p.name}
                </Text>
              </Pressable>
              <Toggle checked={row.taken} onChange={(next) => toggle(p.id, next)} tone="amber" />
              <AmountInput
                value={row.amount}
                editable={row.taken}
                onChangeText={(v) => setAmount(p.id, v)}
              />
              <Text style={styles.unit}>{peptideUnitLabel(p.logUnit)}</Text>
            </View>
          </Card>
        );
      })}

      <View style={styles.actions}>
        <Button variant="ghost" onPress={clearAll} style={styles.grow}>
          Clear all
        </Button>
        <SavedFlashButton flashing={savedFlash} onPress={save} style={styles.grow}>
          Save
        </SavedFlashButton>
      </View>

      <ItemDetailModal
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        kind="peptide"
      />
    </View>
  );
}

/* ===================== Supplements ===================== */

export function SupplementLogList({ period, dateKey, readOnly }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [savedRows, setSavedRows] = useState([]);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [draft, setDraft] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const dk = dateKey || todayKey();

  useEffect(() => {
    if (!user) return;
    const u1 = listenSupplements(user.uid, setItems);
    if (readOnly) return () => u1();
    const u2 = listenSupplementLogForPeriod(user.uid, dk, period, (rows) => {
      setSavedRows(rows);
      setLogsLoaded(true);
    });
    return () => {
      u1();
      u2();
    };
  }, [user, period, dk, readOnly]);

  const scoped = items.filter(
    (s) =>
      s.active !== false &&
      ((s.schedule || 'morning') === period || s.schedule === 'both') &&
      isScheduledOn(s.daysOfWeek, dk)
  );

  // Seeded once, for the same reasons as PeptideLogList above.
  if (draft === null && items.length > 0 && (readOnly || logsLoaded)) {
    const next = {};
    for (const s of scoped) {
      const saved = savedRows.find((r) => r.supplementId === s.id);
      next[s.id] = {
        taken: saved?.taken ?? false,
        amount: saved?.amount != null ? String(saved.amount) : String(s.dosage),
      };
    }
    setDraft(next);
  }
  const draftRows = draft ?? {};

  function toggle(id, next) {
    setDraft((d) => ({ ...d, [id]: { ...d[id], taken: next } }));
  }

  function setAmount(id, value) {
    setDraft((d) => ({ ...d, [id]: { ...d[id], amount: value } }));
  }

  function clearAll() {
    const next = {};
    for (const s of scoped) next[s.id] = { taken: false, amount: String(s.dosage) };
    setDraft(next);
  }

  async function save() {
    const rows = scoped.map((s) => ({
      itemId: s.id,
      itemName: s.name,
      taken: draftRows[s.id]?.taken ?? false,
      amount: draftRows[s.id]?.amount ?? '',
      unit: s.unit,
    }));
    await saveSupplementLog(user.uid, dk, period, rows);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), SAVED_FLASH_MS);
  }

  if (items.length > 0 && scoped.length === 0) {
    return (
      <EmptyState
        text={
          readOnly
            ? `Nothing scheduled for ${period} on this day.`
            : `No supplements scheduled for ${period}. Add or edit one from the Supplements tab.`
        }
      />
    );
  }
  if (items.length === 0) {
    return <EmptyState text="No supplements yet. Add your daily stack from the Supplements tab." />;
  }

  if (readOnly) {
    return (
      <View>
        {scoped.map((s) => (
          <PreviewRow
            key={s.id}
            item={s}
            subtitle={`${s.dosage}${s.unit === 'capsule' ? ' capsule' : s.unit}`}
            onPress={() => setDetailItem(s)}
          />
        ))}
        <Text style={styles.previewNote}>
          This is a preview — come back on this day to log it.
        </Text>
        <ItemDetailModal
          open={!!detailItem}
          onClose={() => setDetailItem(null)}
          item={detailItem}
          kind="supplement"
        />
      </View>
    );
  }

  return (
    <View>
      {scoped.map((s) => {
        const row = draftRows[s.id] || { taken: false, amount: '' };
        return (
          <Card key={s.id} style={styles.logCard}>
            <View style={styles.logRow}>
              <Pressable onPress={() => setDetailItem(s)} android_ripple={ripple} style={styles.grow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {s.name}
                </Text>
              </Pressable>
              <Toggle checked={row.taken} onChange={(next) => toggle(s.id, next)} tone="teal" />
              <AmountInput
                value={row.amount}
                editable={row.taken}
                onChangeText={(v) => setAmount(s.id, v)}
              />
              <Text style={styles.unit}>{supplementUnitLabel(s.unit)}</Text>
            </View>
          </Card>
        );
      })}

      <View style={styles.actions}>
        <Button variant="ghost" onPress={clearAll} style={styles.grow}>
          Clear all
        </Button>
        <SavedFlashButton
          flashing={savedFlash}
          onPress={save}
          variant="tealPrimary"
          style={styles.grow}
        >
          Save
        </SavedFlashButton>
      </View>

      <ItemDetailModal
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        kind="supplement"
      />
    </View>
  );
}

/* ===================== Daily weight ===================== */

export function WeightLogList({ period, dateKey, readOnly }) {
  const { user } = useAuth();
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('lb');
  const [saved, setSaved] = useState(null);
  const [recent, setRecent] = useState([]);
  const [savedFlash, setSavedFlash] = useState(false);

  const dk = dateKey || todayKey();

  useEffect(() => {
    if (!user) return;
    const u2 = listenRecentWeightLogs(user.uid, setRecent, 90);
    if (readOnly) return () => u2();
    const u1 = listenWeightForPeriod(user.uid, dk, period, (data) => {
      setSaved(data);
      if (data) {
        setWeight(String(data.weight));
        setUnit(data.unit);
      } else {
        setWeight('');
      }
    });
    return () => {
      u1();
      u2();
    };
  }, [user, period, dk, readOnly]);

  async function save() {
    if (!weight) return;
    await saveWeightLog(user.uid, dk, period, { weight, unit });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), SAVED_FLASH_MS);
  }

  const history = recent.filter((r) => r.dateKey !== dk).slice(0, 7);

  const dayMap = {};
  for (const r of recent) {
    (dayMap[r.dateKey] ??= []).push(r);
  }
  const chartEntries = Object.keys(dayMap)
    .sort()
    .slice(-30)
    .map((k) => {
      const rows = dayMap[k];
      return {
        dateKey: k,
        weight: rows.reduce((sum, r) => sum + r.weight, 0) / rows.length,
        unit: rows[rows.length - 1].unit,
      };
    });

  return (
    <View>
      {!readOnly && (
        <>
          <Card style={styles.weightCard}>
            <View style={styles.weightRow}>
              <Input
                value={weight}
                onChangeText={setWeight}
                placeholder="0.0"
                keyboardType="decimal-pad"
                style={styles.weightInput}
              />
              <View style={styles.unitSwitch}>
                {['lb', 'kg'].map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setUnit(u)}
                    android_ripple={ripple}
                    style={[styles.unitOption, unit === u && styles.unitOptionActive]}
                  >
                    <Text
                      style={[styles.unitOptionText, unit === u && styles.unitOptionTextActive]}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {!!saved && <Text style={styles.loggedNote}>Logged for {period} today</Text>}
          </Card>

          <View style={styles.weightActions}>
            <Button variant="ghost" onPress={() => setWeight('')} style={styles.grow}>
              Clear
            </Button>
            <SavedFlashButton
              flashing={savedFlash}
              onPress={save}
              disabled={!weight}
              style={styles.grow}
            >
              Save
            </SavedFlashButton>
          </View>
        </>
      )}

      {readOnly && (
        <Text style={styles.previewNote}>
          Weight can&apos;t be logged for a future day — come back when it arrives.
        </Text>
      )}

      <Card style={styles.chartCard}>
        <SectionHeading style={styles.chartHeading}>Last 30 days</SectionHeading>
        <WeightChart entries={chartEntries} />
      </Card>

      {history.length > 0 && (
        <View>
          <SectionHeading style={styles.recentHeading}>Recent</SectionHeading>
          <View style={styles.recentList}>
            {history.map((h) => (
              <View key={h.id} style={styles.recentRow}>
                <Text style={styles.recentDate}>
                  {formatFriendlyDate(h.dateKey)} · {h.period}
                </Text>
                <Text style={styles.recentValue}>
                  {h.weight} {h.unit}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

/* ===================== Shared row bits ===================== */

function AmountInput({ value, editable, onChangeText }) {
  return (
    <Input
      value={value}
      editable={editable}
      onChangeText={onChangeText}
      keyboardType="decimal-pad"
      style={[styles.amountInput, !editable && styles.amountDisabled]}
    />
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },

  logCard: { marginBottom: 10 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemName: { color: colors.paper, fontSize: 15, fontWeight: '500' },
  itemSubtitle: { color: colors.paperDim, fontSize: 12, fontFamily: fonts.mono, marginTop: 2 },
  unit: { color: colors.paperDim, fontSize: 12, width: 44 },

  amountInput: {
    width: 76,
    paddingVertical: 8,
    paddingHorizontal: 6,
    textAlign: 'center',
    fontFamily: fonts.mono,
  },
  amountDisabled: { opacity: 0.4 },

  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },

  previewCard: { marginBottom: 10, opacity: 0.8 },
  previewNote: { color: colors.paperFaint, fontSize: 12, textAlign: 'center', marginTop: 16 },
  badge: {
    borderWidth: 1,
    borderColor: colors.inkLine,
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.paperFaint,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  weightCard: { marginBottom: 20 },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weightInput: { flex: 1, fontFamily: fonts.mono, fontSize: 18, textAlign: 'center', paddingVertical: 12 },
  unitSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: colors.inkLine,
    borderRadius: radius.lg,
    padding: 4,
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  unitOptionActive: { backgroundColor: colors.amber },
  unitOptionText: { color: colors.paperDim, fontSize: 14 },
  unitOptionTextActive: { color: colors.ink, fontWeight: '600' },
  loggedNote: { color: colors.teal, fontSize: 12, marginTop: 8 },
  weightActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },

  chartCard: { marginBottom: 24 },
  chartHeading: { marginBottom: 12 },
  recentHeading: { marginBottom: 10 },
  recentList: { gap: 6 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  recentDate: { color: colors.paperDim, fontSize: 14, textTransform: 'capitalize' },
  recentValue: { color: colors.paper, fontFamily: fonts.mono, fontSize: 14 },
});
