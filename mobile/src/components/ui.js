// The reusable pieces from the web app's ui.js, rebuilt on React Native
// primitives. Same names, same props, same look.
import { useEffect, useState } from 'react';
import {
  Animated,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { cardShadow, colors, fonts, radius } from '../theme';

// Ticking an item off is the single most-repeated action in the app, so it
// gets the feedback a native toggle would have. Failures are ignored — an
// emulator with no vibrator, or a phone with system haptics switched off,
// shouldn't break the tap.
function tap(style = Haptics.ImpactFeedbackStyle.Light) {
  Haptics.impactAsync(style).catch(() => {});
}

// The two platforms answer a touch differently: Android spreads a ripple
// from the finger, iOS dims the whole control. So both are wired up and
// each one is inert on the other platform — `android_ripple` is ignored on
// iOS outright, and the dim is gated below so it doesn't muddy the ripple.
//
// Everything tappable here is a rounded surface, so the ripple is bounded,
// which needs `overflow: 'hidden'` on the same view or it paints square
// corners over the radius. That property is harmless on iOS.
export const ripple = { color: 'rgba(244,239,233,0.12)', foreground: true };
const DIM_ON_PRESS = Platform.OS === 'ios';

export function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={ripple}
        style={({ pressed }) => [
          styles.card,
          DIM_ON_PRESS && pressed && styles.cardPressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

// Each variant carries its own ripple: a light one reads on the dark ghost
// and danger buttons, but would be invisible washing over amber, so the
// filled variants ripple dark instead.
const buttonVariants = {
  primary: {
    bg: colors.amber, border: colors.amber, text: colors.ink, weight: '600',
    ripple: 'rgba(10,9,8,0.22)',
  },
  tealPrimary: {
    bg: colors.teal, border: colors.teal, text: colors.ink, weight: '600',
    ripple: 'rgba(10,9,8,0.22)',
  },
  ghost: {
    bg: 'transparent', border: colors.inkLine, text: colors.paper, weight: '500',
    ripple: 'rgba(244,239,233,0.12)',
  },
  danger: {
    bg: 'transparent', border: 'rgba(229,67,44,0.4)', text: colors.coral, weight: '500',
    ripple: 'rgba(229,67,44,0.20)',
  },
};

export function Button({ children, variant = 'primary', disabled, onPress, style }) {
  const v = buttonVariants[variant] ?? buttonVariants.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={disabled ? null : { ...ripple, color: v.ripple }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border },
        disabled && styles.disabled,
        DIM_ON_PRESS && pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: v.text, fontWeight: v.weight }]} numberOfLines={1}>
        {children}
      </Text>
    </Pressable>
  );
}

export function Toggle({ checked, onChange, tone = 'teal' }) {
  // Lazy useState rather than useRef: the interpolations below are read
  // during render, which a ref isn't allowed to be.
  const [anim] = useState(() => new Animated.Value(checked ? 1 : 0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: checked ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [checked, anim]);

  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.inkLine, tone === 'teal' ? colors.teal : colors.amber],
  });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      onPress={() => {
        tap();
        onChange(!checked);
      }}
      android_ripple={{ ...ripple, borderless: true, radius: 24, foreground: false }}
      hitSlop={8}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const chipTones = {
  amber: { bg: colors.amberSoft, fg: colors.amberBright, border: 'rgba(242,118,14,0.3)' },
  teal: { bg: colors.tealSoft, fg: colors.tealBright, border: 'rgba(194,90,15,0.3)' },
  coral: { bg: colors.coralSoft, fg: colors.coral, border: 'rgba(229,67,44,0.3)' },
};

export function LabelChip({ text, tone = 'amber' }) {
  const t = chipTones[tone] ?? chipTones.amber;
  return (
    <View style={[styles.chip, { backgroundColor: t.bg, borderColor: t.border }]}>
      <View style={styles.chipDot} />
      <Text style={[styles.chipText, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

// The web app's Modal is a bottom sheet. RNModal with a slide animation is
// the native shape of the same thing. onRequestClose is what wires the
// Android back button and back gesture to it — without that prop, back
// closes the whole app instead of the sheet — and it costs nothing on iOS,
// where the sheet is dismissed by the scrim or the × instead.
export function Modal({ open, onClose, title, children }) {
  const insets = useSafeAreaInsets();
  return (
    <RNModal
      visible={!!open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      // Android draws edge-to-edge, so the sheet's dark scrim has to reach
      // under both system bars too — otherwise they stay lit at the app's
      // own background colour while everything behind them dims. Both props
      // are Android-only and ignored on iOS.
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalScrim} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              android_ripple={{ ...ripple, borderless: true, radius: 20, foreground: false }}
              hitSlop={12}
            >
              <Text style={styles.sheetClose}>×</Text>
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetBody}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
}

// Equivalent of the web app's `.input` CSS class.
export function Input({ style, ...props }) {
  return (
    <TextInput
      placeholderTextColor={colors.paperFaint}
      selectionColor={colors.amber}
      style={[styles.input, style]}
      {...props}
    />
  );
}

export function Field({ label, children, style }) {
  return (
    <View style={style}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// The segmented Morning / Evening / Both control that shows up on nearly
// every screen in the web app.
export function SegmentedControl({ options, value, onChange, tone = 'amber', compact }) {
  const activeBg = tone === 'teal' ? colors.teal : colors.amber;
  return (
    <View style={styles.segment}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              if (!active) tap(Haptics.ImpactFeedbackStyle.Soft);
              onChange(opt.value);
            }}
            android_ripple={ripple}
            style={[
              styles.segmentItem,
              compact && styles.segmentItemCompact,
              active && { backgroundColor: activeBg },
            ]}
          >
            <Text
              style={[
                compact ? styles.segmentTextCompact : styles.segmentText,
                { color: active ? colors.ink : colors.paperDim },
                active && { fontWeight: '600' },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({ text }) {
  return <Text style={styles.emptyState}>{text}</Text>;
}

export function SectionHeading({ children, style }) {
  return <Text style={[styles.sectionHeading, style]}>{children}</Text>;
}

export const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.inkLine,
    borderRadius: radius.xl2,
    padding: 16,
    // Keeps the ripple inside the rounded corners instead of painting a
    // square over them.
    overflow: 'hidden',
    ...cardShadow,
  },
  cardPressed: { opacity: 0.75 },

  button: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonText: { fontSize: 14, fontFamily: fonts.body },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },

  track: { width: 48, height: 28, borderRadius: radius.full, justifyContent: 'center' },
  knob: { width: 24, height: 24, borderRadius: radius.full, backgroundColor: colors.ink },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 4,
  },
  chipDot: {
    position: 'absolute',
    left: -3,
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
  },
  chipText: { fontFamily: fonts.mono, fontSize: 13 },

  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.inkRaised,
    borderTopWidth: 1,
    borderColor: colors.inkLine,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  sheetTitle: { flex: 1, color: colors.paper, fontFamily: fonts.display, fontSize: 18, fontWeight: '600' },
  sheetClose: { color: colors.paperDim, fontSize: 28, lineHeight: 30, paddingHorizontal: 8 },
  sheetBody: { paddingBottom: 8 },

  input: {
    width: '100%',
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.inkLine,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.paper,
  },
  fieldLabel: { color: colors.paperDim, fontSize: 12, marginBottom: 4 },

  segment: {
    flexDirection: 'row',
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.inkLine,
    borderRadius: radius.lg,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: 'center',
    overflow: 'hidden',
  },
  segmentItemCompact: { paddingVertical: 6 },
  segmentText: { fontSize: 14, fontFamily: fonts.display, fontWeight: '600' },
  segmentTextCompact: { fontSize: 12, fontWeight: '500' },

  emptyState: { color: colors.paperFaint, fontSize: 14, paddingVertical: 12 },
  sectionHeading: {
    color: colors.paperDim,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
