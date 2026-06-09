// src/navigation/MainNavigator.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, typography, fontWeight, radius, spacing } from '../theme';

// Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import ExpensesScreen from '../screens/main/ExpensesScreen';
import TasksScreen from '../screens/todo/TasksScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

import GoalsScreen from '../screens/main/GoalsScreen';
import HabitsScreen from '../screens/main/HabitsScreen';
import CalendarScreen from '../screens/todo/CalendarScreen';
import SleepScreen from '../screens/todo/SleepScreen';
import PomodoroScreen from '../screens/pomodoro/PomodoroScreen';
import PlacementScreen from '../screens/placement/PlacementScreen';
import NotesScreen from '../screens/notes/NotesScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const MODULES = [
  { name: 'Expenses', icon: '💸', color: '#10b981', route: 'Expenses' },
  { name: 'To-Do', icon: '📝', color: '#3b82f6', route: 'Tasks' },
  { name: 'Placement', icon: '🧠', color: '#8b5cf6', route: 'Placement' },
  { name: 'Pomodoro', icon: '⏱', color: '#ef4444', route: 'Pomodoro' },
  { name: 'Goals', icon: '◎', color: '#06b6d4', route: 'Goals' },
  { name: 'Habits', icon: '🔥', color: '#f59e0b', route: 'Habits' },
  { name: 'Sleep Logs', icon: '💤', color: '#6366f1', route: 'Sleep' },
  { name: 'Calendar', icon: '📅', color: '#ec4899', route: 'Calendar' },
  { name: 'Notes', icon: '📓', color: '#eab308', route: 'Notes' },
];

function CustomTabBar({ state, descriptors, navigation }) {
  const [showSwitcher, setShowSwitcher] = useState(false);

  const activeRoute = state.routes[state.index].name;

  const navigateTo = (routeName) => {
    setShowSwitcher(false);
    navigation.navigate(routeName);
  };

  const getTabColor = (route) => activeRoute === route ? colors.accent : colors.textMuted;

  return (
    <View style={styles.tabContainer}>
      {/* Module Switcher Modal */}
      <Modal visible={showSwitcher} transparent animationType="fade" onRequestClose={() => setShowSwitcher(false)}>
        <TouchableOpacity style={styles.switcherOverlay} activeOpacity={1} onPress={() => setShowSwitcher(false)}>
          <View style={styles.switcherContent}>
            <View style={styles.switcherHandle} />
            <Text style={styles.switcherTitle}>Apps & Modules</Text>
            <View style={styles.grid}>
              {MODULES.map(m => (
                <TouchableOpacity key={m.route} style={styles.gridItem} onPress={() => navigateTo(m.route)}>
                  <View style={[styles.gridIconBg, { backgroundColor: m.color + '22' }]}>
                    <Text style={styles.gridIcon}>{m.icon}</Text>
                  </View>
                  <Text style={styles.gridText}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setShowSwitcher(true)}>
          <Text style={[styles.tabIcon, { color: colors.textPrimary }]}>⊞</Text>
          <Text style={styles.tabLabel}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('Dashboard')}>
          <Text style={[styles.tabIcon, { color: getTabColor('Dashboard') }]}>⌂</Text>
          <Text style={[styles.tabLabel, { color: getTabColor('Dashboard') }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('Expenses')}>
          <Text style={[styles.tabIcon, { color: getTabColor('Expenses') }]}>◈</Text>
          <Text style={[styles.tabLabel, { color: getTabColor('Expenses') }]}>Expenses</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('Tasks')}>
          <Text style={[styles.tabIcon, { color: getTabColor('Tasks') }]}>📝</Text>
          <Text style={[styles.tabLabel, { color: getTabColor('Tasks') }]}>Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('Profile')}>
          <Text style={[styles.tabIcon, { color: getTabColor('Profile') }]}>👤</Text>
          <Text style={[styles.tabLabel, { color: getTabColor('Profile') }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const headerStyle = { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, elevation: 0, shadowOpacity: 0 };
const headerTitleStyle = { color: colors.textPrimary, fontSize: typography.lg, fontWeight: fontWeight.semibold };

export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerStyle, headerTitleStyle, headerTintColor: colors.accent }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      
      {/* Hidden from tab bar but accessible universally */}
      <Tab.Screen name="Placement" component={PlacementScreen} />
      <Tab.Screen name="Pomodoro" component={PomodoroScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="Sleep" component={SleepScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Habits" component={HabitsScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    backgroundColor: colors.surface,
  },
  tabBar: {
    flexDirection: 'row',
    height: 85,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: 30,
    paddingTop: 10,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },

  switcherOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  switcherContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 50,
  },
  switcherHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  switcherTitle: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 48) / 3 - 10, 
    alignItems: 'center',
    marginBottom: 20,
  },
  gridIconBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridIcon: {
    fontSize: 28,
  },
  gridText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
});

