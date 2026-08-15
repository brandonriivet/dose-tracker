import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ALL_DAYS, DOW_KEYS, DOW_LABELS } from '../lib/dates';
import { colors, radius } from '../theme';

// Seven toggles for "which days is this item active". An empty selection
// means every day, which is how items created before day-of-week
// scheduling existed keep working.
export function DaySelector({ value, onChange, tone = 'amber' }) {
  const days = value && value.length ? value : ALL_DAYS;
  const activeBg = tone === 'teal' ? colors.teal : colors.amber;

  return (
    <View style={styles.row}>
      {DOW_KEYS.map((key, i) => {
        const active = days.includes(key);
        return (
          <Pressable
            key={key}
            onPress={() => onChange(active ? days.filter((k) => k !== key) : [...days, key])}
            style={[styles.day, active ? { backgroundColor: activeBg } : styles.dayInactive]}
          >
            <Text style={[styles.label, { color: active ? colors.ink : colors.paperFaint }]}>
              {DOW_LABELS[i]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, paddingVertical: 8, borderRadius: radius.md, alignItems: 'center' },
  dayInactive: { backgroundColor: colors.inkSoft, borderWidth: 1, borderColor: colors.inkLine },
  label: { fontSize: 12, fontWeight: '600' },
});
