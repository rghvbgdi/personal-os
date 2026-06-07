// src/screens/main/HabitsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
  RefreshControl, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { habitAPI } from '../../api/client';
import { colors, spacing, radius, typography, fontWeight } from '../../theme';

const FREQUENCIES = ['daily', 'weekly'];

function HabitCard({ item, onToggle, toggling }) {
  const today = new Date().toISOString().split('T')[0];
  const completions = item.completions || [];
  const isDone = completions.some(
    (c) => new Date(c.date || c).toISOString().split('T')[0] === today
  );
  const streak = item.currentStreak || 0;

  return (
    <View style={[styles.card, isDone && styles.cardDone]}>
      <TouchableOpacity
        style={[styles.checkbox, isDone && styles.checkboxDone]}
        onPress={() => !isDone && onToggle(item._id)}
        disabled={isDone || toggling === item._id}
        activeOpacity={0.7}
      >
        {toggling === item._id ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : isDone ? (
          <Text style={styles.checkmark}>✓</Text>
        ) : null}
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={[styles.habitName, isDone && styles.habitNameDone]}>{item.name || item.title}</Text>
        <View style={styles.meta}>
          <Text style={styles.freq}>{item.frequency || 'daily'}</Text>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streak} day streak</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function AddHabitModal({ visible, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Validation', 'Habit name is required.'); return; }
    setSaving(true);
    try {
      await habitAPI.create({ name: name.trim(), frequency, startDate: new Date().toISOString() });
      setName('');
      setFrequency('daily');
      onSuccess?.();
      onClose();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not create habit.');
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>New Habit</Text>

            <Text style={styles.fieldLabel}>Habit Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName}
              placeholder="e.g. Morning run" placeholderTextColor={colors.textMuted} autoFocus />

            <Text style={styles.fieldLabel}>Frequency</Text>
            <View style={styles.freqRow}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.freqBtn, frequency === f && styles.freqBtnActive]}
                  onPress={() => setFrequency(f)}
                >
                  <Text style={[styles.freqBtnText, frequency === f && styles.freqBtnTextActive]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function HabitsScreen() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await habitAPI.getAll();
      const data = res.data?.data || res.data || [];
      setHabits(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id) => {
    setToggling(id);
    try {
      await habitAPI.markComplete(id, { date: new Date().toISOString() });
      await load();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not mark complete.');
    } finally { setToggling(null); }
  };

  const today = new Date().toISOString().split('T')[0];
  const doneCount = habits.filter((h) =>
    (h.completions || []).some((c) => new Date(c.date || c).toISOString().split('T')[0] === today)
  ).length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress header */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>
          {doneCount}/{habits.length} done today
        </Text>
        <View style={styles.barBg}>
          <View style={[styles.barFill, {
            width: habits.length > 0 ? `${Math.round((doneCount / habits.length) * 100)}%` : '0%'
          }]} />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(h) => h._id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyText}>No habits yet. Build your first streak!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <HabitCard item={item} onToggle={handleToggle} toggling={toggling} />
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddHabitModal visible={showAdd} onClose={() => setShowAdd(false)} onSuccess={load} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: typography.md, color: colors.textSecondary, textAlign: 'center' },

  progressHeader: { padding: spacing.md, borderBottomWidth: 1, borderColor: colors.border, gap: spacing.sm },
  progressText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  barBg: { height: 6, backgroundColor: colors.surfaceElevated, borderRadius: radius.full, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.full },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  cardDone: { opacity: 0.7, borderColor: colors.success + '44' },
  checkbox: {
    width: 28, height: 28, borderRadius: radius.sm,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkmark: { color: colors.white, fontSize: typography.md, fontWeight: fontWeight.bold },

  info: { flex: 1 },
  habitName: { fontSize: typography.md, color: colors.textPrimary, fontWeight: fontWeight.medium },
  habitNameDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  freq: { fontSize: typography.xs, color: colors.textMuted, textTransform: 'capitalize' },
  streakBadge: { backgroundColor: colors.warning + '22', borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  streakText: { fontSize: typography.xs, color: colors.warning, fontWeight: fontWeight.medium },

  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.xl,
    width: 56, height: 56, borderRadius: radius.full,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabText: { fontSize: typography.xxl, color: colors.white, lineHeight: 28, marginTop: -2 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: 40 },
  sheetTitle: { fontSize: typography.lg, color: colors.textPrimary, fontWeight: fontWeight.semibold, marginBottom: spacing.md },
  fieldLabel: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: fontWeight.medium, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surfaceElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 14, color: colors.textPrimary, fontSize: typography.md,
  },
  freqRow: { flexDirection: 'row', gap: spacing.sm },
  freqBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  freqBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  freqBtnText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  freqBtnTextActive: { color: colors.white },
  sheetBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: { flex: 1, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontSize: typography.md },
  saveBtn: { flex: 1, padding: 14, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontSize: typography.md, fontWeight: fontWeight.semibold },
});
