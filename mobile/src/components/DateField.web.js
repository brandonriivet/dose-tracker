import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DateCalendarModal } from './DateCalendarModal';
import { ripple } from './ui';
import { formatFriendlyDate } from '../lib/dates';
import { colors, fonts, radius } from '../theme';

// The web build has no system date picker to call — react-native-web's
// TextInput can't become an <input type="date">, and reaching into the DOM
// for one would be the only piece of this app that does.
//
// So web reuses DateCalendarModal, the calendar already written in React
// Native for the Log screen's date navigation. Same component, same look on
// every target, and nothing platform-specific to maintain. The trigger row
// below is deliberately identical to DateField.android.js so the two read
// the same; only what happens on press differs.
export function DateField({ value, onChange, tone = 'amber', maximumDate }) {
  const [open, setOpen] = useState(false);
  const accent = tone === 'teal' ? colors.tealBright : colors.amberBright;

  function handleSelect(dateKey) {
    setOpen(false);
    // The calendar has no concept of a ceiling, so enforce maximumDate here
    // rather than let it hand back a date the caller rejected anyway.
    if (maximumDate && new Date(`${dateKey}T00:00:00`) > maximumDate) return;
    onChange(dateKey);
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        android_ripple={ripple}
        accessibilityRole="button"
        accessibilityLabel={`Date: ${formatFriendlyDate(value)}. Activate to change.`}
        style={styles.field}
      >
        <View style={styles.row}>
          <Text style={styles.value}>{formatFriendlyDate(value)}</Text>
          <Text style={[styles.action, { color: accent }]}>Change</Text>
        </View>
      </Pressable>

      <DateCalendarModal
        open={open}
        onClose={() => setOpen(false)}
        selectedDateKey={value}
        onSelect={handleSelect}
      />
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    width: '100%',
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.inkLine,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  value: { color: colors.paper, fontFamily: fonts.mono, fontSize: 14 },
  action: { fontSize: 12, fontWeight: '600' },
});
