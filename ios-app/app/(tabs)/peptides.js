import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Screen, ScreenTitle } from '../../src/components/Screen';
import { DaySelector } from '../../src/components/DaySelector';
import {
  Button,
  Card,
  Field,
  Input,
  LabelChip,
  Modal,
  SectionHeading,
  SegmentedControl,
} from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import {
  addPeptide,
  concentration,
  deletePeptide,
  listenPeptides,
  listenRecentPeptideDoses,
  mcgPerUnit,
  remainingMg,
  updatePeptide,
} from '../../src/lib/data';
import {
  ALL_DAYS,
  dayShortSummary,
  formatDateKeyFromDate,
  parseDateKey,
} from '../../src/lib/dates';
import { colors, fonts, radius } from '../../src/theme';

const SCHEDULE_OPTIONS = [
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
  { value: 'both', label: 'Both' },
];

const LOG_UNITS = ['mcg', 'mg', 'units'];

function scheduleBadge(s) {
  if (s === 'both') return 'AM & PM';
  if (s === 'evening') return 'PM';
  return 'AM';
}

function SimpleRow({ label, value }) {
  return (
    <View style={styles.simpleRow}>
      <Text style={styles.simpleLabel}>{label}</Text>
      <Text style={styles.simpleValue}>{value}</Text>
    </View>
  );
}

function PeptideCard({ peptide: p, doses, uid, expanded, onToggleExpand }) {
  const [editSchedule, setEditSchedule] = useState(p.schedule || 'morning');
  const [editDays, setEditDays] = useState(
    p.daysOfWeek && p.daysOfWeek.length ? p.daysOfWeek : ALL_DAYS
  );
  const [savedFlash, setSavedFlash] = useState(false);

  const left = remainingMg(p, doses.filter((d) => d.peptideId === p.id));
  const pct = p.vialAmountMg ? left / p.vialAmountMg : 0;
  const low = pct < 0.15;

  async function saveSchedule() {
    await updatePeptide(uid, p.id, { schedule: editSchedule, daysOfWeek: editDays });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }

  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.name} numberOfLines={1}>
            {p.name}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {scheduleBadge(p.schedule)} · {dayShortSummary(p.daysOfWeek)}
            </Text>
          </View>
        </View>
        <LabelChip tone="amber" text={`${concentration(p).toFixed(2)} mg/mL`} />
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.max(2, pct * 100)}%`, backgroundColor: low ? colors.coral : colors.amber },
          ]}
        />
      </View>

      <View style={styles.cardFooter}>
        <Text style={[styles.remaining, { color: low ? colors.coral : colors.paperDim }]}>
          {left.toFixed(1)} mg left of {p.vialAmountMg} mg
        </Text>
        <Pressable onPress={onToggleExpand} hitSlop={8}>
          <Text style={styles.linkFaint}>{expanded ? 'Hide' : 'Details'}</Text>
        </Pressable>
      </View>

      {expanded && (
        <View style={styles.expanded}>
          <SimpleRow label="Source" value={p.source || '—'} />
          <SimpleRow
            label="Reconstituted"
            value={p.reconstitutedDate?.toDate?.().toLocaleDateString() ?? '—'}
          />
          <SimpleRow label="BAC water" value={`${p.bacWaterMl} mL`} />
          <SimpleRow
            label={`mcg / unit (U-${p.unitsPerMl || 100})`}
            value={`${mcgPerUnit(p).toFixed(1)} mcg`}
          />
          {!!p.notes && <SimpleRow label="Notes" value={p.notes} />}

          <View style={styles.editBlock}>
            <SectionHeading style={styles.editHeading}>Edit schedule</SectionHeading>
            <SegmentedControl
              options={SCHEDULE_OPTIONS}
              value={editSchedule}
              onChange={setEditSchedule}
              tone="amber"
              compact
            />
            <View style={styles.daySpacer}>
              <DaySelector value={editDays} onChange={setEditDays} tone="amber" />
            </View>
            <Button onPress={saveSchedule} style={styles.fullWidthButton}>
              {savedFlash ? 'Saved ✓' : 'Save schedule'}
            </Button>
          </View>

          <View style={styles.dangerRow}>
            <Button
              variant="ghost"
              style={styles.grow}
              onPress={() => updatePeptide(uid, p.id, { status: 'finished' })}
            >
              Mark finished
            </Button>
            <Button variant="danger" style={styles.grow} onPress={() => deletePeptide(uid, p.id)}>
              Delete
            </Button>
          </View>
        </View>
      )}
    </Card>
  );
}

function AddPeptideModal({ open, onClose }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [reorderUrl, setReorderUrl] = useState('');
  const [vialAmountMg, setVialAmountMg] = useState('');
  const [bacWaterMl, setBacWaterMl] = useState('');
  const [unitsPerMl, setUnitsPerMl] = useState('100');
  const [logUnit, setLogUnit] = useState('mcg');
  const [schedule, setSchedule] = useState('morning');
  const [daysOfWeek, setDaysOfWeek] = useState(ALL_DAYS);
  const [reconstitutedDate, setReconstitutedDate] = useState(() =>
    formatDateKeyFromDate(new Date())
  );
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const conc =
    vialAmountMg && bacWaterMl ? (Number(vialAmountMg) / Number(bacWaterMl)).toFixed(2) : null;

  async function handleSubmit() {
    if (!name.trim() || !vialAmountMg || !bacWaterMl) {
      setError('Name, vial amount, and BAC water are required.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await addPeptide(user.uid, {
        name: name.trim(),
        source,
        reorderUrl,
        vialAmountMg,
        bacWaterMl,
        unitsPerMl,
        logUnit,
        schedule,
        daysOfWeek,
        reconstitutedDate,
        notes,
      });
      setName('');
      setSource('');
      setReorderUrl('');
      setVialAmountMg('');
      setBacWaterMl('');
      setNotes('');
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add reconstituted vial">
      <View style={styles.form}>
        <Field label="Name">
          <Input value={name} onChangeText={setName} placeholder="e.g. BPC-157" />
        </Field>

        <Field label="Source (optional)">
          <Input value={source} onChangeText={setSource} placeholder="Where you got it" />
        </Field>

        <Field label="Reorder link (optional)">
          <Input
            value={reorderUrl}
            onChangeText={setReorderUrl}
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
          />
        </Field>

        <View style={styles.formRow}>
          <Field label="Vial amount (mg)" style={styles.grow}>
            <Input
              value={vialAmountMg}
              onChangeText={setVialAmountMg}
              placeholder="30"
              keyboardType="decimal-pad"
              style={styles.mono}
            />
          </Field>
          <Field label="BAC water (mL)" style={styles.grow}>
            <Input
              value={bacWaterMl}
              onChangeText={setBacWaterMl}
              placeholder="3"
              keyboardType="decimal-pad"
              style={styles.mono}
            />
          </Field>
        </View>

        {!!conc && <Text style={styles.concentration}>→ {conc} mg/mL</Text>}

        <Field label="Log dose in">
          <SegmentedControl
            options={LOG_UNITS.map((u) => ({ value: u, label: u }))}
            value={logUnit}
            onChange={setLogUnit}
            tone="amber"
            compact
          />
        </Field>

        {logUnit === 'units' && (
          <Field label="Units per mL (syringe)">
            <Input
              value={unitsPerMl}
              onChangeText={setUnitsPerMl}
              placeholder="100"
              keyboardType="number-pad"
              style={styles.mono}
            />
          </Field>
        )}

        <Field label="Schedule">
          <SegmentedControl
            options={SCHEDULE_OPTIONS}
            value={schedule}
            onChange={setSchedule}
            tone="amber"
          />
        </Field>

        <Field label="Days of the week">
          <DaySelector value={daysOfWeek} onChange={setDaysOfWeek} tone="amber" />
        </Field>

        <Field label="Reconstituted on">
          {/* The web form used <input type="date">; the native equivalent
              is the system picker, which also removes any chance of
              typing a date the parser won't accept. */}
          <View style={styles.datePicker}>
            <DateTimePicker
              value={parseDateKey(reconstitutedDate)}
              mode="date"
              display="compact"
              themeVariant="dark"
              accentColor={colors.amber}
              onChange={(_event, date) => {
                if (date) setReconstitutedDate(formatDateKeyFromDate(date));
              }}
            />
          </View>
        </Field>

        <Field label="Notes (optional)">
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder="Storage, dilution notes, etc."
          />
        </Field>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Button onPress={handleSubmit} disabled={busy} style={styles.fullWidthButton}>
          Add vial
        </Button>
      </View>
    </Modal>
  );
}

export default function PeptidesScreen() {
  const { user } = useAuth();
  const [peptides, setPeptides] = useState([]);
  const [doses, setDoses] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!user) return;
    const u1 = listenPeptides(user.uid, setPeptides);
    const u2 = listenRecentPeptideDoses(user.uid, setDoses, 500);
    return () => {
      u1();
      u2();
    };
  }, [user]);

  if (!user) return null;

  const active = peptides.filter((p) => p.status !== 'finished');
  const finished = peptides.filter((p) => p.status === 'finished');

  return (
    <Screen>
      <ScreenTitle right={<Button onPress={() => setShowAdd(true)}>+ Add vial</Button>}>
        Peptides
      </ScreenTitle>

      {active.length === 0 && (
        <Text style={styles.empty}>
          No reconstituted vials yet. Add one to start tracking doses against it.
        </Text>
      )}

      {active.map((p) => (
        <PeptideCard
          key={p.id}
          peptide={p}
          doses={doses}
          uid={user.uid}
          expanded={expanded === p.id}
          onToggleExpand={() => setExpanded(expanded === p.id ? null : p.id)}
        />
      ))}

      {finished.length > 0 && (
        <>
          <SectionHeading style={styles.finishedHeading}>Finished</SectionHeading>
          {finished.map((p) => (
            <Card key={p.id} style={styles.finishedCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.name}>{p.name}</Text>
                <Pressable onPress={() => deletePeptide(user.uid, p.id)} hitSlop={8}>
                  <Text style={styles.linkFaint}>Remove</Text>
                </Pressable>
              </View>
            </Card>
          ))}
        </>
      )}

      <AddPeptideModal open={showAdd} onClose={() => setShowAdd(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  card: { marginBottom: 12 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  name: { color: colors.paper, fontSize: 15, fontWeight: '500', flexShrink: 1 },
  badge: {
    borderWidth: 1,
    borderColor: colors.inkLine,
    borderRadius: radius.md,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.paperFaint,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  progressTrack: {
    height: 6,
    backgroundColor: colors.inkLine,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: radius.full },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  remaining: { fontFamily: fonts.mono, fontSize: 12 },
  linkFaint: { color: colors.paperFaint, fontSize: 12 },

  expanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.inkLine,
    gap: 8,
  },
  simpleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  simpleLabel: { color: colors.paperDim, fontSize: 14 },
  simpleValue: { color: colors.paper, fontFamily: fonts.mono, fontSize: 13, flexShrink: 1, textAlign: 'right' },

  editBlock: { paddingTop: 12 },
  editHeading: { marginBottom: 6 },
  daySpacer: { marginTop: 8 },
  fullWidthButton: { marginTop: 8 },
  dangerRow: { flexDirection: 'row', gap: 8, paddingTop: 12 },

  form: { gap: 12 },
  formRow: { flexDirection: 'row', gap: 12 },
  mono: { fontFamily: fonts.mono },
  concentration: { color: colors.amberBright, fontFamily: fonts.mono, fontSize: 14 },
  datePicker: { alignItems: 'flex-start' },
  error: { color: colors.coral, fontSize: 13 },

  empty: { color: colors.paperFaint, fontSize: 14, paddingVertical: 12 },
  finishedHeading: { marginTop: 24, marginBottom: 10 },
  finishedCard: { marginBottom: 8, opacity: 0.6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});
