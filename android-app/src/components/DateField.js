import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { ripple } from './ui';
import { formatDateKeyFromDate, formatFriendlyDate, parseDateKey } from '../lib/dates';
import { colors, fonts, radius } from '../theme';

// The web form used <input type="date">. On iOS the equivalent is an inline
// wheel you can drop straight into the layout; Android's picker is a modal
// dialog you *open*, so the field itself has to be something tappable that
// shows the current value.
//
// DateTimePickerAndroid.open() is the imperative half of the same library
// the iOS build renders as a component. Rendering <DateTimePicker> on
// Android technically works, but it shows the dialog the moment it mounts
// and re-shows it on every re-render, which is not what a form field should
// do.
export function DateField({ value, onChange, tone = 'amber', maximumDate }) {
  const accent = tone === 'teal' ? colors.tealBright : colors.amberBright;

  function open(design = 'material') {
    const material = design === 'material';
    DateTimePickerAndroid.open({
      value: parseDateKey(value),
      mode: 'date',
      // Material 3 dialog, so it matches the rest of the system rather than
      // the older AppCompat calendar.
      design,
      // `title` is a Material-3-only prop — passing it to the default
      // picker only earns a console warning.
      title: material ? 'Reconstituted on' : undefined,
      maximumDate,
      // The Material dialog is a separate native module from the default
      // one. It ships in the same package, so this shouldn't fire, but a
      // host app built without it would otherwise just do nothing when you
      // tap the field — falling back leaves you with a working picker.
      onError: material ? () => open('default') : undefined,
      onChange: (event, date) => {
        // Android reports the cancel button and the tap-outside dismissal
        // through the same callback the confirm goes through — 'set' is the
        // only action that means the user actually picked something.
        if (event.type === 'set' && date) onChange(formatDateKeyFromDate(date));
      },
    });
  }

  return (
    <Pressable
      onPress={() => open()}
      android_ripple={ripple}
      accessibilityRole="button"
      accessibilityLabel={`Date: ${formatFriendlyDate(value)}. Tap to change.`}
      style={styles.field}
    >
      <View style={styles.row}>
        <Text style={styles.value}>{formatFriendlyDate(value)}</Text>
        <Text style={[styles.action, { color: accent }]}>Change</Text>
      </View>
    </Pressable>
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
