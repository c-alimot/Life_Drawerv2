import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@styles/theme';
import type { MainTabsParamList } from '../types/navigation';

// Placeholder components - will be replaced with actual screens
const PlaceholderScreen = ({ title }: { title: string }) => {
  const theme = useTheme();
  return (
    <Text style={[theme.typography.h2, { color: theme.colors.text, padding: 20 }]}>
      {title}
    </Text>
  );
};

const Tab = createBottomTabNavigator<MainTabsParamList>();
const Stack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={() => <PlaceholderScreen title="Home" />}
      />
      <Stack.Screen
        name="EntryDetail"
        component={() => <PlaceholderScreen title="Entry Detail" />}
      />
    </Stack.Navigator>
  );
}

function DrawersStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Drawers"
        component={() => <PlaceholderScreen title="Drawers" />}
      />
      <Stack.Screen
        name="DrawerDetail"
        component={() => <PlaceholderScreen title="Drawer Detail" />}
      />
    </Stack.Navigator>
  );
}

export function MainStack() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Drawers"
        component={DrawersStackNavigator}
        options={{
          title: 'Drawers',
          tabBarLabel: 'Drawers',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📦</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={() => <PlaceholderScreen title="Search" />}
        options={{
          title: 'Search',
          tabBarLabel: 'Search',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🔍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Insights"
        component={() => <PlaceholderScreen title="Insights" />}
        options={{
          title: 'Insights',
          tabBarLabel: 'Insights',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📊</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}