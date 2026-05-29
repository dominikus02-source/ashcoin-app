import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, usePathname, router, Href } from 'expo-router';
import { Home, Shapes, TrendingUp, Wallet, User } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, radius, spacing } from '../../src/constants';

const TABS: { name: string; title: string; icon: typeof Home; href: Href }[] = [
  { name: 'home', title: 'Home', icon: Home, href: '/(tabs)/home' as Href },
  { name: 'syndicate', title: 'Syndicate', icon: Shapes, href: '/(tabs)/syndicate' as Href },
  { name: 'earn', title: 'Earn', icon: TrendingUp, href: '/(tabs)/earn' as Href },
  { name: 'wallet', title: 'Wallet', icon: Wallet, href: '/(tabs)/wallet' as Href },
  { name: 'profile', title: 'Profile', icon: User, href: '/(tabs)/profile' as Href },
];

function TabIcon({ icon: Icon, focused }: { icon: typeof Home; focused: boolean }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1.1 : 1, { damping: 12 }) }],
  }));

  return (
    <Animated.View style={[styles.iconContainer, focused && styles.iconActive, animatedStyle]}>
      <Icon size={22} color={focused ? colors.text : colors.tabInactive} />
    </Animated.View>
  );
}

function CustomTabBar() {
  const pathname = usePathname();
  const currentTab = TABS.find((t) => pathname.includes(t.name))?.name || 'home';

  return (
    <View style={styles.tabBar}>
      {TABS.map(({ name, title, icon: Icon, href }) => {
        const focused = currentTab === name;
        return (
          <TouchableOpacity
            key={name}
            onPress={() => router.replace(href)}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            <TabIcon icon={Icon} focused={focused} />
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{title}</Text>
            {focused && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={() => <CustomTabBar />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="syndicate" />
      <Tabs.Screen name="earn" />
      <Tabs.Screen name="wallet" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: colors.tabBorder,
    paddingTop: spacing.sm,
    paddingBottom: 20,
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconContainer: {
    width: 40,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: {
    backgroundColor: colors.primary + '20',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.tabInactive,
  },
  tabLabelActive: {
    color: colors.tabActive,
    fontWeight: '700',
  },
  activeIndicator: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});
