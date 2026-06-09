// src/screens/main/MoreScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, typography, fontWeight } from '../../theme';
import { getInitials } from '../../utils/formatters';

const MENU = [
  { icon: '📝', label: 'Tasks', screen: 'Tasks', desc: 'Todo list & priority tasks' },
  { icon: '📅', label: 'Calendar', screen: 'Calendar', desc: 'Events & schedule' },
  { icon: '💤', label: 'Sleep Logs', screen: 'Sleep', desc: 'Track sleep quality' },
  { icon: '📓', label: 'Notes', screen: 'Notes', desc: 'Rich text notes & quick capture' },
  { icon: '🧠', label: 'Placement Tracker', screen: 'Placement', desc: 'DSA, OOPS, DBMS, topics' },
  { icon: '⏱', label: 'Pomodoro', screen: 'Pomodoro', desc: 'Focus sessions & break timers' },
  { icon: '🔥', label: 'Habits', screen: 'Habits', desc: 'Daily habits & streaks' },
  { icon: '👤', label: 'Profile', screen: 'Profile', desc: 'Edit budget, currency, settings' },
];

export default function MoreScreen({ navigation }) {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Mini profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name || 'U')}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Menu items */}
        <Text style={styles.sectionLabel}>Tools</Text>
        {MENU.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => {
              // Check if it's a tab or a stack screen
              if (['Tasks'].includes(item.screen)) {
                navigation.navigate(item.screen);
              } else {
                navigation.navigate(item.screen);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuEmoji}>{item.icon}</Text>
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },

  profileCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, gap: spacing.md,
  },
  avatar: {
    width: 52, height: 52, borderRadius: radius.full,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: typography.xl, color: colors.white, fontWeight: fontWeight.bold },
  profileInfo: { flex: 1 },
  profileName: { fontSize: typography.lg, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  profileEmail: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  editBtn: { borderWidth: 1, borderColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 6 },
  editBtnText: { fontSize: typography.sm, color: colors.accent, fontWeight: fontWeight.medium },

  sectionLabel: { fontSize: typography.xs, color: colors.textMuted, fontWeight: fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },

  menuItem: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, gap: spacing.md,
  },
  menuIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
  },
  menuEmoji: { fontSize: 22 },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: typography.md, color: colors.textPrimary, fontWeight: fontWeight.medium },
  menuDesc: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: typography.xl, color: colors.textMuted },
});
