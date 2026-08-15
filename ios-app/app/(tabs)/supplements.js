import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, ScreenTitle } from '../../src/components/Screen';
import { DaySelector } from '../../src/components/DaySelector';
import {
  Button,
  Card,
  Field,
  Input,
  Modal,
  SectionHeading,
  SegmentedControl,
} from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import {
  addSupplement,
  deleteSupplement,
  listenSupplements,
  updateSupplement,
} from '../../src/lib/data';
import { ALL_DAYS, dayShortSummary } from '../../src/lib/dates';
import { colors, fonts, radius } from '../../src/theme';

const SCHEDULE_OPTIONS = [
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
  { value: 'both', label: 'Both' },
];

const SUPPLEMENT_UNITS = ['mg', 'mcg', 'g', 'IU', 'capsule'];

function scheduleBadge(s) {
  if (s === 'both') return 'AM & PM';
  if (s === 'evening') return 'PM';
  return 'AM';
}

function SupplementRow({ supplement: s, uid, expanded, onToggleExpand }) {
  const [editSchedule, setEditSchedule] = useState(s.schedule || 'morning');
  const [editDays, setEditDays] = useState(
    s.daysOfWeek && s.daysOfWeek.length ? s.daysOfWeek : ALL_DAYS
  );
  const [savedFlash, setSavedFlash] = useState(false);

  async function saveSchedule() {
    await updateSupplement(uid, s.id, { schedule: editSchedule, daysOfWeek: editDays });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }

  return (
    <Card style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {s.name}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {scheduleBadge(s.schedule)} · {dayShortSummary(s.daysOfWeek)}
              </Text>
            </View>
          </View>
          <Text style={styles.dosage}>
            {s.dosage}
            {s.unit === 'capsule' ? ' capsule' : s.unit}
            {s.notes ? ` · ${s.notes}` : ''}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onToggleExpand} hitSlop={8}>
            <Text style={styles.linkFaint}>{expanded ? 'Hide' : 'Edit'}</Text>
          </Pressable>
          <Pressable
            onPress={() => updateSupplement(uid, s.id, { active: s.active === false })}
            hitSlop={8}
          >
            <Text style={styles.linkFaint}>{s.active === false ? 'Reactivate' : 'Pause'}</Text>
          </Pressable>
          <Pressable onPress={() => deleteSupplement(uid, s.id)} hitSlop={8}>
            <Text style={styles.linkDanger}>Delete</Text>
          </Pressable>
        </View>
      </View>

      {expanded && (
        <View style={styles.expanded}>
          <SectionHeading style={styles.editHeading}>Edit schedule</SectionHeading>
          <SegmentedControl
            options={SCHEDULE_OPTIONS}
            value={editSchedule}
            onChange={setEditSchedule}
            tone="teal"
            compact
          />
          <View style={styles.daySpacer}>
            <DaySelector value={editDays} onChange={setEditDays} tone="teal" />
          </View>
          <Button variant="tealPrimary" onPress={saveSchedule} style={styles.fullWidthButton}>
            {savedFlash ? 'Saved ✓' : 'Save schedule'}
          </Button>
        </View>
      )}
    </Card>
  );
}

function AddSupplementModal({ open, onClose }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('mg');
  const [schedule, setSchedule] = useState('morning');
  const [daysOfWeek, setDaysOfWeek] = useState(ALL_DAYS);
  const [reorderUrl, setReorderUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!name.trim() || !dosage) {
      setError('Name and dosage are required.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await addSupplement(user.uid, {
        name: name.trim(),
        dosage,
        unit,
        schedule,
        daysOfWeek,
        reorderUrl,
        notes,
      });
      setName('');
      setDosage('');
      setReorderUrl('');
      setNotes('');
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add supplement">
      <View style={styles.form}>
        <Field label="Name">
          <Input value={name} onChangeText={setName} placeholder="e.g. Magnesium glycinate" />
        </Field>

        <Field label="Dosage">
          <Input
            value={dosage}
            onChangeText={setDosage}
            placeholder="400"
            keyboardType="decimal-pad"
            style={styles.mono}
          />
        </Field>

        <Field label="Unit">
          <SegmentedControl
            options={SUPPLEMENT_UNITS.map((u) => ({ value: u, label: u === 'capsule' ? 'caps' : u }))}
            value={unit}
            onChange={setUnit}
            tone="teal"
            compact
          />
        </Field>

        <Field label="Schedule">
          <SegmentedControl
            options={SCHEDULE_OPTIONS}
            value={schedule}
            onChange={setSchedule}
            tone="teal"
          />
        </Field>

        <Field label="Days of the week">
          <DaySelector value={daysOfWeek} onChange={setDaysOfWeek} tone="teal" />
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

        <Field label="Notes (optional)">
          <Input value={notes} onChangeText={setNotes} placeholder="With food, brand, etc." />
        </Field>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Button
          variant="tealPrimary"
          onPress={handleSubmit}
          disabled={busy}
          style={styles.fullWidthButton}
        >
          Add supplement
        </Button>
      </View>
    </Modal>
  );
}

export default function SupplementsScreen() {
  const { user } = useAuth();
  const [supplements, setSupplements] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!user) return;
    return listenSupplements(user.uid, setSupplements);
  }, [user]);

  if (!user) return null;

  return (
    <Screen>
      <ScreenTitle
        right={
          <Button variant="tealPrimary" onPress={() => setShowAdd(true)}>
            + Add
          </Button>
        }
      >
        Supplements
      </ScreenTitle>

      {supplements.length === 0 && (
        <Text style={styles.empty}>No supplements yet. Add your daily stack.</Text>
      )}

      {supplements.map((s) => (
        <SupplementRow
          key={s.id}
          supplement={s}
          uid={user.uid}
          expanded={expanded === s.id}
          onToggleExpand={() => setExpanded(expanded === s.id ? null : s.id)}
        />
      ))}

      <AddSupplementModal open={showAdd} onClose={() => setShowAdd(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  info: { flexShrink: 1, flexGrow: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  dosage: { color: colors.paperDim, fontFamily: fonts.mono, fontSize: 12, marginTop: 4 },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 },
  linkFaint: { color: colors.paperFaint, fontSize: 12 },
  linkDanger: { color: colors.coral, fontSize: 12 },

  expanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.inkLine },
  editHeading: { marginBottom: 6 },
  daySpacer: { marginTop: 8 },
  fullWidthButton: { marginTop: 8 },

  form: { gap: 12 },
  mono: { fontFamily: fonts.mono },
  error: { color: colors.coral, fontSize: 13 },
  empty: { color: colors.paperFaint, fontSize: 14, paddingVertical: 12 },
});
