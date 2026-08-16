import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { ClockIcon, GearIcon, LeafIcon, SunIcon, VialIcon } from '../../src/components/icons';
import { colors, radius } from '../../src/theme';

// Android marks the selected tab with a Material "you are here" pill; iOS
// marks it with tint alone. Keeping that split is the point of the port —
// each platform's tab bar should look like its own.
//
// Not `tabBarVariant: 'material'`, despite the name: that is the tablet
// *sidebar* layout and it throws outright unless tabBarPosition is left or
// right. So the pill is built by hand. The navigator paints
// activeBackgroundColor on the inner pressable with borderRadius 0 and
// applies tabBarItemStyle to the wrapper around it, so the rounding comes
// from the wrapper clipping its child — hence overflow: 'hidden' rather
// than a radius on the colour itself.
//
// Inset horizontally only: the bar is 49dp tall and already spends 15 on
// padding, so a vertical margin would come straight out of the ~34dp the
// icon and label share and clip the text.
const activePill = Platform.select({
  android: {
    tabBarActiveBackgroundColor: colors.amberSoft,
    tabBarItemStyle: {
      borderRadius: radius.lg,
      overflow: 'hidden',
      marginHorizontal: 4,
    },
  },
  default: {},
});

// Same five tabs, same order as the web app's bottom NavBar.
const TABS = [
  { name: 'index', title: 'Log', Icon: SunIcon },
  { name: 'peptides', title: 'Peptides', Icon: VialIcon },
  { name: 'supplements', title: 'Supplements', Icon: LeafIcon },
  { name: 'history', title: 'History', Icon: ClockIcon },
  { name: 'settings', title: 'Settings', Icon: GearIcon },
];

export default function TabsLayout() {
  return (
    <Tabs
      // Android's back button should walk back to the first tab before it
      // leaves the app — the platform convention, and what stops back from
      // dropping you to the launcher out of the middle of the app. iOS has
      // no hardware back, so this is simply inert there.
      backBehavior="firstRoute"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.paperFaint,
        ...activePill,
        tabBarStyle: {
          backgroundColor: colors.inkSoft,
          borderTopColor: colors.inkLine,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        sceneStyle: { backgroundColor: colors.ink },
      }}
    >
      {TABS.map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => <Icon color={color} active={focused} />,
          }}
        />
      ))}
    </Tabs>
  );
}