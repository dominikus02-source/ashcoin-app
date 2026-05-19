// app/(main)/_layout.tsx
import { Tabs } from 'expo-router';
import { Pickaxe, TrendingUp, Wallet, Users, Globe } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fbbf24', // Gold
        tabBarInactiveTintColor: '#64748b', // Gray
        tabBarStyle: {
          backgroundColor: '#0f172a', // Dark Blue Background
          borderTopWidth: 1,
          borderTopColor: '#1e293b',
          height: 85,
          paddingTop: 10,
          paddingBottom: 20,
          shadowOpacity: 0, 
        },
        tabBarLabelStyle: { 
          fontSize: 11, 
          fontWeight: '700', 
          fontFamily: 'monospace', 
          marginTop: 4 
        },
      }}
    >
      {/* TAB 1: MINER */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'MINER',
          tabBarIcon: ({ color, size }) => (
            <Pickaxe size={size} color={color} />
          ),
        }}
      />

      {/* TAB 2: MARKET */}
      <Tabs.Screen
        name="market"
        options={{
          title: 'MARKET',
          tabBarIcon: ({ color, size }) => (
            <TrendingUp size={size} color={color} />
          ),
        }}
      />

      {/* TAB 3: WALLET */}
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'WALLET',
          tabBarIcon: ({ color, size }) => (
            <Wallet size={size} color={color} />
          ),
        }}
      />

      {/* TAB 4: TEAM */}
      <Tabs.Screen
        name="team"
        options={{
          title: 'TEAM',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />

      {/* TAB 5: COMMUNITY (Dulu Social) */}
      <Tabs.Screen
        name="social"
        options={{
          title: 'COMMUNITY',
          tabBarIcon: ({ color, size }) => (
            <Globe size={size} color={color} />
          ),
        }}
      />
      
      {/* Profile disembunyikan dari tab bar, tapi tetap bisa diakses via link */}
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}