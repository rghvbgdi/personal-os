// src/screens/main/ProfileScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/client';
import { colors, spacing, radius, typography, fontWeight } from '../../theme';
import { getInitials, formatINR } from '../../utils/formatters';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    monthlyBudget: String(user?.monthlyBudget || ''),
    currency: user?.currency || 'INR',
    timezone: user?.timezone || 'Asia/Kolkata',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        monthlyBudget: parseFloat(form.monthlyBudget) || 0,
        currency: form.currency,
        timezone: form.timezone,
      };
      const res = await authAPI.updateProfile(payload);
      const updated = res.data?.data?.user || res.data?.data || payload;
      updateUser(updated);
      setEditing(false);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not update profile.');
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const initial = getInitials(user?.name || 'U');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatINR(user?.monthlyBudget || 0)}</Text>
            <Text style={styles.statLabel}>Monthly Budget</Text>
          </View>
          <View style={[styles.stat, styles.statBorder]}>
            <Text style={styles.statValue}>{user?.currency || 'INR'}</Text>
            <Text style={styles.statLabel}>Currency</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>IST</Text>
            <Text style={styles.statLabel}>Timezone</Text>
          </View>
        </View>

        {/* Edit form */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Settings</Text>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={form.name}
              onChangeText={(v) => set('name', v)}
              editable={editing}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Monthly Budget (₹)</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={form.monthlyBudget}
              onChangeText={(v) => set('monthlyBudget', v)}
              keyboardType="numeric"
              editable={editing}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Currency</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={form.currency}
              editable={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Timezone</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={form.timezone}
              editable={false}
            />
          </View>

          {editing && (
            <View style={styles.btns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Personal OS v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 60 },

  avatarSection: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: {
    width: 80, height: 80, borderRadius: radius.full,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: typography.xxxl, color: colors.white, fontWeight: fontWeight.bold },
  userName: { fontSize: typography.xl, color: colors.textPrimary, fontWeight: fontWeight.bold },
  userEmail: { fontSize: typography.md, color: colors.textSecondary, marginTop: 4 },

  statsRow: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md, overflow: 'hidden',
  },
  stat: { flex: 1, alignItems: 'center', padding: spacing.md },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  statValue: { fontSize: typography.md, color: colors.textPrimary, fontWeight: fontWeight.bold },
  statLabel: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 4 },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { fontSize: typography.md, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  editLink: { fontSize: typography.md, color: colors.accent },

  field: { marginBottom: spacing.md },
  fieldLabel: { fontSize: typography.sm, color: colors.textSecondary, marginBottom: 6, fontWeight: fontWeight.medium },
  input: {
    backgroundColor: colors.surfaceElevated, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    color: colors.textPrimary, fontSize: typography.md,
  },
  inputDisabled: { opacity: 0.5 },

  btns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: { flex: 1, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontSize: typography.md },
  saveBtn: { flex: 1, padding: 14, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontSize: typography.md, fontWeight: fontWeight.semibold },

  logoutBtn: {
    backgroundColor: colors.error + '22', borderRadius: radius.lg,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.error + '44',
    marginBottom: spacing.md,
  },
  logoutText: { color: colors.error, fontSize: typography.md, fontWeight: fontWeight.semibold },

  version: { textAlign: 'center', color: colors.textMuted, fontSize: typography.xs },
});
