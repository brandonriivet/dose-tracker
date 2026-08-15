import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

// The web app wraps every screen in
// `px-4 pt-4 pb-28 max-w-md mx-auto safe-top`. This is that, with the
// bottom padding coming from the real tab bar height instead of a guess.
export function Screen({ children, contentStyle }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}

export function ScreenTitle({ children, right }) {
  return (
    <View style={styles.titleRow}>
      <Text style={styles.title}>{children}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  inner: { width: '100%', maxWidth: 448, alignSelf: 'center' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  title: { color: colors.paper, fontFamily: fonts.display, fontSize: 24, fontWeight: '600' },
});
