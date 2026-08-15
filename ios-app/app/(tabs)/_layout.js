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
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.paperFaint,
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
