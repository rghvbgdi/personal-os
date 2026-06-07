// src/navigation/MainNavigator.js
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { colors, typography, fontWeight } from '../theme';

// Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import ExpensesScreen from '../screens/main/ExpensesScreen';
import GoalsScreen from '../screens/main/GoalsScreen';
import HabitsScreen from '../screens/main/HabitsScreen';
import MoreScreen from '../screens/main/MoreScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();
const MoreStack = createStackNavigator();

const TAB_ICONS = {
  Dashboard: { active: '⌂', inactive: '⌂' },
  Expenses: { active: '◈', inactive: '◈' },
  Goals: { active: '◎', inactive: '◎' },
  Habits: { active: '✔', inactive: '✔' },
  More: { active: '⊞', inactive: '⊞' },
};

const headerStyle = {
  backgroundColor: colors.surface,
  borderBottomColor: colors.border,
  borderBottomWidth: 1,
  elevation: 0,
  shadowOpacity: 0,
};
const headerTitleStyle = {
  color: colors.textPrimary,
  fontSize: typography.lg,
  fontWeight: fontWeight.semibold,
};

function MoreStackScreen() {
  return (
    <MoreStack.Navigator
      screenOptions={{ headerStyle, headerTitleStyle, headerTintColor: colors.accent }}
    >
      <MoreStack.Screen name="MoreIndex" component={MoreScreen} options={{ title: 'More' }} />
      <MoreStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </MoreStack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <Text style={{ fontSize: 18, color }}>{TAB_ICONS[route.name]?.active}</Text>
        ),
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: typography.xs, fontWeight: fontWeight.medium },
        headerStyle,
        headerTitleStyle,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Habits" component={HabitsScreen} />
      <Tab.Screen
        name="More"
        component={MoreStackScreen}
        options={{ headerShown: false, title: 'More' }}
      />
    </Tab.Navigator>
  );
}
