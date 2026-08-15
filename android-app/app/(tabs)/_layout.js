import { Tabs } from 'expo-router';
import { ClockIcon, GearIcon, LeafIcon, SunIcon, VialIcon } from '../../src/components/icons';
import { colors } from '../../src/theme';

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
        // The Material 3 shape instead of the UIKit one: a rounded
        // indicator behind the selected tab, which is what an Android user
        // reads as "you are here". Tinted from the palette rather than the
        // default 12%-alpha wash so it lands on the app's own amber.
        tabBarVariant: 'material',
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.paperFaint,
        tabBarActiveBackgroundColor: colors.amberSoft,
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
