import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs, usePathname, router, Href } from 'expo-router';
import { Home, Shapes, TrendingUp, Wallet, User } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { colors, radius, spacing } from '../../src/constants';

const TABS: { name: string; title: string; icon: typeof Home; href: Href }[] = [
  { name: 'home', title: 'Home', icon: Home, href: '/(tabs)/home' as Href },
  { name: 'syndicate', title: 'Syndicate', icon: Shapes, href: '/(tabs)/syndicate' as Href },
  { name: 'earn', title: 'Earn', icon: TrendingUp, href: '/(tabs)/earn' as Href },
  { name: 'wallet', title: 'Wallet', icon: Wallet, href: '/(tabs)/wallet' as Href },
  { name: 'profile', title: 'Profile', icon: User, href: '/(tabs)/profile' as Href },
];

function TabIcon({ icon: Icon, focused }: { icon: typeof Home; focused: boolean }) {
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1 : 0.85, { damping: 14 }) }],
  }));

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0.5, { duration: 200 }),
  }));

  return (
    <Animated.View style={scaleStyle}>
      <Animated.View style={[styles.iconContainer, focused && styles.iconActive, opacityStyle]}>
        <Icon size={22} color={focused ? colors.text : colors.tabInactive} />
      </Animated.View>
    </Animated.View>
  );
}

function TabIndicator({ focused }: { focused: boolean }) {
  const animStyle = useAnimatedStyle(() => ({
    width: withSpring(focused ? 24 : 0, { damping: 12 }),
    opacity: withTiming(focused ? 1 : 0, { duration: 150 }),
  }));

  return <Animated.View style={[styles.indicator, animStyle]} />;
}

function CustomTabBar() {
  const pathname = usePathname();
  const currentTab = TABS.find((t) => pathname.includes(t.name))?.name || 'home';

  const tabBarContent = (
    <View style={styles.tabBar}>
      <View style={styles.tabBarInner}>
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
              <TabIndicator focused={focused} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,10,26,0.85)' }]} />
        {tabBarContent}
      </BlurView>
    );
  }

  return tabBarContent;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  tabBarInner: {
    flexDirection: 'row',
    backgroundColor: colors.tabBar + 'F2',
    borderTopWidth: 1,
    borderTopColor: colors.tabBorder + '80',
    paddingTop: spacing.sm,
    paddingBottom: 20,
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  iconContainer: {
    width: 40,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: {
    backgroundColor: colors.primary + '25',
  },
  indicator: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.tabInactive,
    marginTop: 1,
  },
  tabLabelActive: {
    color: colors.tabActive,
    fontWeight: '700',
  },
});
