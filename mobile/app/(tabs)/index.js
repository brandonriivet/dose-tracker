import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { DateCalendarModal } from '../../src/components/DateCalendarModal';
import { CalendarIcon, ChevronIcon } from '../../src/components/icons';
import { SegmentedControl, ripple } from '../../src/components/ui';
import {
  PeptideLogList,
  SupplementLogList,
  WeightLogList,
} from '../../src/components/logLists';
import { quoteOfTheDay } from '../../src/lib/quotes';
import {
  formatFriendlyDate,
  formatHeaderDate,
  shiftDateKey,
  todayKey,
} from '../../src/lib/dates';
import { colors, fonts, radius } from '../../src/theme';

// Bare icons and text links get the borderless ripple Android uses for
// toolbar buttons — a bounded one would draw a box where there's no button.
const iconRipple = { color: 'rgba(244,239,233,0.16)', borderless: true, radius: 22 };

const PERIODS = [
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
];

const CATEGORIES = [
  { id: 'supplements', label: 'Supplements' },
  { id: 'peptides', label: 'Peptides' },
  { id: 'weight', label: 'Daily Weight' },
];

export default function LogScreen() {
  const [period, setPeriod] = useState('morning');
  const [category, setCategory] = useState('supplements');
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey());
  const [showCalendar, setShowCalendar] = useState(false);

  const todayDk = todayKey();
  const isToday = selectedDateKey === todayDk;
  const isFuture = selectedDateKey > todayDk;

  // Remounting on any of these resets the draft the same way the web app's
  // `key=` prop does, so switching day or period never carries a half-typed
  // amount across.
  const listKey = `${period}-${selectedDateKey}`;

  function handleCalendarSelect(dk) {
    setSelectedDateKey(dk);
    setShowCalendar(false);
  }

  return (
    <Screen>
      <Text style={styles.headerDate}>{formatHeaderDate()}</Text>
      <Text style={styles.quote}>{quoteOfTheDay()}</Text>

      <View style={styles.dateNav}>
        <Pressable
          onPress={() => setSelectedDateKey(shiftDateKey(selectedDateKey, -1))}
          android_ripple={ripple}
          style={styles.navButton}
          accessibilityLabel="Previous day"
        >
          <ChevronIcon color={colors.paperDim} direction="left" />
        </Pressable>

        <Pressable
          onPress={() => setShowCalendar(true)}
          android_ripple={ripple}
          style={[
            styles.dateButton,
            isToday ? styles.dateToday : isFuture ? styles.dateFuture : styles.datePast,
          ]}
        >
          <Text
            style={[
              styles.dateButtonText,
              isToday
                ? styles.dateTextToday
                : isFuture
                  ? styles.dateTextFuture
                  : styles.dateTextPast,
            ]}
          >
            {formatFriendlyDate(selectedDateKey)}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedDateKey(shiftDateKey(selectedDateKey, 1))}
          android_ripple={ripple}
          style={styles.navButton}
          accessibilityLabel="Next day"
        >
          <ChevronIcon color={colors.paperDim} direction="right" />
        </Pressable>

        <Pressable
          onPress={() => setShowCalendar(true)}
          android_ripple={ripple}
          style={styles.navButton}
          accessibilityLabel="Open calendar"
        >
          <CalendarIcon color={colors.paperDim} />
        </Pressable>
      </View>

      {!isToday && (
        <View style={[styles.banner, isFuture ? styles.bannerFuture : styles.bannerPast]}>
          <Text
            style={[
              styles.bannerText,
              isFuture ? styles.dateTextFuture : styles.dateTextPast,
            ]}
          >
            {isFuture
              ? `Previewing ${formatFriendlyDate(selectedDateKey)} — view only`
              : `Logging for ${formatFriendlyDate(selectedDateKey)} — not today`}
          </Text>
          <Pressable onPress={() => setSelectedDateKey(todayDk)} android_ripple={iconRipple} hitSlop={8}>
            <Text style={styles.backToToday}>Back to today</Text>
          </Pressable>
        </View>
      )}

      <SegmentedControl
        options={PERIODS}
        value={period}
        onChange={setPeriod}
        tone="amber"
      />

      <View style={styles.categoryTabs}>
        {CATEGORIES.map((c) => {
          const active = category === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => setCategory(c.id)}
              android_ripple={ripple}
              style={[styles.categoryTab, active && styles.categoryTabActive]}
            >
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {category === 'supplements' && (
        <SupplementLogList
          key={`sup-${listKey}`}
          period={period}
          dateKey={selectedDateKey}
          readOnly={isFuture}
        />
      )}
      {category === 'peptides' && (
        <PeptideLogList
          key={`pep-${listKey}`}
          period={period}
          dateKey={selectedDateKey}
          readOnly={isFuture}
        />
      )}
      {category === 'weight' && (
        <WeightLogList
          key={`wt-${listKey}`}
          period={period}
          dateKey={selectedDateKey}
          readOnly={isFuture}
        />
      )}

      <DateCalendarModal
        open={showCalendar}
        onClose={() => setShowCalendar(false)}
        selectedDateKey={selectedDateKey}
        onSelect={handleCalendarSelect}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerDate: { color: colors.paperDim, fontSize: 14, fontWeight: '500', marginBottom: 2 },
  quote: { color: colors.paperFaint, fontSize: 11, fontStyle: 'italic', marginBottom: 16 },

  dateNav: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
  },
  dateButtonText: { fontSize: 14, fontWeight: '500' },
  dateToday: { backgroundColor: colors.inkSoft, borderColor: colors.inkLine },
  dateFuture: { backgroundColor: colors.tealSoft, borderColor: 'rgba(194,90,15,0.4)' },
  datePast: { backgroundColor: colors.coralSoft, borderColor: 'rgba(229,67,44,0.4)' },
  dateTextToday: { color: colors.paper },
  dateTextFuture: { color: colors.tealBright },
  dateTextPast: { color: colors.coral },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  bannerFuture: { backgroundColor: colors.tealSoft, borderColor: 'rgba(194,90,15,0.3)' },
  bannerPast: { backgroundColor: colors.coralSoft, borderColor: 'rgba(229,67,44,0.3)' },
  bannerText: { flex: 1, fontSize: 12, fontWeight: '500' },
  backToToday: { color: colors.paperFaint, fontSize: 12, textDecorationLine: 'underline' },

  categoryTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.inkLine,
    marginTop: 12,
    marginBottom: 20,
  },
  categoryTab: {
    flex: 1,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
    alignItems: 'center',
  },
  categoryTabActive: { borderBottomColor: colors.amber },
  categoryText: { color: colors.paperFaint, fontSize: 14, fontWeight: '500', fontFamily: fonts.body },
  categoryTextActive: { color: colors.paper },
});
