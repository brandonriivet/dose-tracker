import { Tabs } from 'expo-router';
import { ClockIcon, GearIcon, LeafIcon, SunIcon, VialIcon } from '../../src/components/icons';
import { colors, radius } from '../../src/theme';

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
      // dropping you to the launcher out of the middle of the app.
      backBehavior="firstRoute"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.paperFaint,
        // The Material 3 "you are here" pill behind the selected tab, built
        // by hand. Not `tabBarVariant: 'material'` — despite the name that
        // is the tablet *sidebar* layout, and it throws outright unless
        // tabBarPosition is left or right.
        //
        // The navigator paints activeBackgroundColor on the inner pressable
        // with borderRadius 0, and applies tabBarItemStyle to the wrapper
        // around it. So the rounding has to come from the wrapper clipping
        // its child — hence overflow: 'hidden' here rather than a radius on
        // the colour itself.
        //
        // Inset horizontally only. The bar is 49dp tall and already spends
        // 15 of that on padding, so a vertical margin would come straight
        // out of the ~34dp the icon and label share and clip the text.
        tabBarActiveBackgroundColor: colors.amberSoft,
        tabBarItemStyle: {
          borderRadius: radius.lg,
          overflow: 'hidden',
          marginHorizontal: 4,
        },
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