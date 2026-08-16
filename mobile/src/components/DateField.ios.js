import { StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateKeyFromDate, parseDateKey } from '../lib/dates';
import { colors } from '../theme';

// The web form used <input type="date">. iOS can drop the system picker
// straight into the layout as a compact inline control, so the field is the
// picker — no dialog to open. Android's picker is modal and can't be
// inlined, which is why DateField.android.js is a separate implementation
// behind the same props rather than one file with a Platform branch.
export function DateField({ value, onChange, tone = 'amber', maximumDate }) {
  return (
    <View style={styles.field}>
      <DateTimePicker
        value={parseDateKey(value)}
        mode="date"
        display="compact"
        themeVariant="dark"
        accentColor={tone === 'teal' ? colors.teal : colors.amber}
        maximumDate={maximumDate}
        onChange={(_event, date) => {
          if (date) onChange(formatDateKeyFromDate(date));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { alignItems: 'flex-start' },
});
