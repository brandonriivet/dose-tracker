import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Modal } from './ui';
import { ChevronIcon } from './icons';
import { MONTH_NAMES, WEEKDAY_HEADERS, parseDateKey, todayKey } from '../lib/dates';
import { colors, radius } from '../theme';

export function DateCalendarModal({ open, onClose, selectedDateKey, onSelect }) {
  const seed = parseDateKey(selectedDateKey);
  const [viewYear, setViewYear] = useState(seed.getFullYear());
  const [viewMonth, setViewMonth] = useState(seed.getMonth());

  if (!open) return null;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const todayDk = todayKey();

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  return (
    <Modal open={open} onClose={onClose} title={`${MONTH_NAMES[viewMonth]} ${viewYear}`}>
      <View style={styles.nav}>
        <Pressable onPress={goPrevMonth} hitSlop={10} style={styles.navButton}>
          <ChevronIcon color={colors.paperDim} direction="left" />
        </Pressable>
        <Pressable onPress={() => onSelect(todayDk)} hitSlop={10}>
          <Text style={styles.jumpToday}>Jump to today</Text>
        </Pressable>
        <Pressable onPress={goNextMonth} hitSlop={10} style={styles.navButton}>
          <ChevronIcon color={colors.paperDim} direction="right" />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {WEEKDAY_HEADERS.map((w, i) => (
          <View key={`h${i}`} style={styles.headerCell}>
            <Text style={styles.weekdayHeader}>{w}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day == null) return <View key={`empty${i}`} style={styles.cell} />;
          const dk = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = dk === selectedDateKey;
          const isToday = dk === todayDk;
          return (
            <View key={dk} style={styles.cell}>
              <Pressable
                onPress={() => onSelect(dk)}
                style={[
                  styles.day,
                  isSelected && styles.daySelected,
                  !isSelected && isToday && styles.dayToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    !isSelected && isToday && styles.dayTextToday,
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: { paddingHorizontal: 12, paddingVertical: 4 },
  jumpToday: { color: colors.amberBright, fontSize: 12, textDecorationLine: 'underline' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  // Seven columns. Percentage widths keep it square-ish on every device
  // width without measuring the container.
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  headerCell: { width: `${100 / 7}%`, paddingBottom: 6 },
  weekdayHeader: { color: colors.paperFaint, fontSize: 11, textAlign: 'center' },

  day: { flex: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: colors.amber },
  dayToday: { borderWidth: 1, borderColor: colors.amber },
  dayText: { color: colors.paper, fontSize: 14 },
  dayTextSelected: { color: colors.ink, fontWeight: '600' },
  dayTextToday: { color: colors.amberBright },
});
