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

// Missing Screens
import TasksScreen from '../screens/todo/TasksScreen';
import CalendarScreen from '../screens/todo/CalendarScreen';
import SleepScreen from '../screens/todo/SleepScreen';
import PomodoroScreen from '../screens/pomodoro/PomodoroScreen';
import PlacementScreen from '../screens/placement/PlacementScreen';
import NotesScreen from '../screens/notes/NotesScreen';

const Tab = createBottomTabNavigator();
const MoreStack = createStackNavigator();

const TAB_ICONS = {
  Dashboard: { active: '⌂', inactive: '⌂' },
  Expenses: { active: '◈', inactive: '◈' },
  Tasks: { active: '📝', inactive: '📝' },
  Goals: { active: '◎', inactive: '◎' },
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
      <MoreStack.Screen name="Habits" component={HabitsScreen} options={{ title: 'Habits' }} />
      <MoreStack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendar' }} />
      <MoreStack.Screen name="Sleep" component={SleepScreen} options={{ title: 'Sleep' }} />
      <MoreStack.Screen name="Pomodoro" component={PomodoroScreen} options={{ title: 'Pomodoro' }} />
      <MoreStack.Screen name="Placement" component={PlacementScreen} options={{ title: 'Placement' }} />
      <MoreStack.Screen name="Notes" component={NotesScreen} options={{ title: 'Notes' }} />
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
        tabBarHideOnKeyboard: true,
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
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen
        name="More"
        component={MoreStackScreen}
        options={{ headerShown: false, title: 'More' }}
      />
    </Tab.Navigator>
  );
}
