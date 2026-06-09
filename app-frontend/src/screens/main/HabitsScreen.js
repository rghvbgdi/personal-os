// src/screens/main/HabitsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, RefreshControl,
  ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { habitAPI } from '../../api/client';
import { colors, spacing, radius, typography, fontWeight } from '../../theme';

const HABIT_ICONS = ['🔥', '💧', '🥗', '🏃', '📚', '🧘', '💻', '🎸', '🧹', '😴'];

function HabitItem({ item, onToggle, onEdit }) {
  const today = new Date().toISOString().split('T')[0];
  const isDoneToday = Array.isArray(item.completions) && item.completions.some(c => (c.date || c).split('T')[0] === today);

  return (
    <TouchableOpacity style={styles.habitCard} onPress={() => onEdit(item)}>
      <View style={styles.habitIconBg}>
        <Text style={styles.habitIcon}>{item.icon || '🔥'}</Text>
      </View>
      <View style={styles.habitInfo}>
        <Text style={styles.habitName}>{item.name}</Text>
        <Text style={styles.habitStreak}>🔥 {item.currentStreak || 0} day streak</Text>
      </View>
      <TouchableOpacity
        style={[styles.checkBtn, isDoneToday && styles.checkBtnDone]}
        onPress={() => onToggle(item._id)}
      >
        <Text style={[styles.checkBtnText, isDoneToday && styles.checkBtnTextDone]}>
          {isDoneToday ? '✓' : ''}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function AddHabitModal({ visible, onClose, onSuccess, initialData }) {
  const empty = { name: '', icon: '🔥', frequency: 'daily' };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm(empty);
  }, [initialData, visible]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (initialData) {
        await habitAPI.update(initialData._id, form);
      } else {
        await habitAPI.create(form);
      }
      onSuccess();
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Could not save habit');
    } finally { setSaving(false); }
  };

  const handleDelete = () => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await habitAPI.remove(initialData._id);
          onSuccess();
          onClose();
        } catch (err) { Alert.alert('Error', 'Failed to delete'); }
      }}
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>{initialData ? 'Edit' : 'New'} Habit</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.accent} /> : <Text style={styles.modalSave}>Save</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalBody}>
          <Text style={styles.fieldLabel}>Habit Name</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => setForm(f => ({ ...f, name: v }))}
            placeholder="e.g. Read for 30 mins"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.fieldLabel}>Icon</Text>
          <View style={styles.iconRow}>
            {HABIT_ICONS.map(i => (
              <TouchableOpacity
                key={i}
                style={[styles.iconBtn, form.icon === i && styles.iconBtnActive]}
                onPress={() => setForm(f => ({ ...f, icon: i }))}
              >
                <Text style={styles.iconBtnText}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {initialData && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Delete Habit</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function HabitsScreen() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await habitAPI.getAll();
      setHabits(Array.isArray(res.data?.data) ? res.data.data : res.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id) => {
    try {
      await habitAPI.markComplete(id, { date: new Date().toISOString() });
      load();
    } catch (err) {
      Alert.alert('Error', 'Failed to update habit');
    }
  };

  const handleEdit = (habit) => {
    setEditingHabit(habit);
    setShowAdd(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={h => h._id}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>✨</Text>
              <Text style={styles.emptyText}>Build some new habits!</Text>
            </View>
          }
          renderItem={({ item }) => <HabitItem item={item} onToggle={handleToggle} onEdit={handleEdit} />}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => { setEditingHabit(null); setShowAdd(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AddHabitModal visible={showAdd} onClose={() => setShowAdd(false)} onSuccess={load} initialData={editingHabit} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: typography.md, color: colors.textSecondary },

  habitCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border
  },
  habitIconBg: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  habitIcon: { fontSize: 24 },
  habitInfo: { flex: 1, marginLeft: spacing.md },
  habitName: { fontSize: typography.md, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  habitStreak: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
  checkBtn: { width: 32, height: 32, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  checkBtnDone: { backgroundColor: colors.accent },
  checkBtnText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },

  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.xl, width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  fabText: { fontSize: typography.xxl, color: colors.white },

  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderColor: colors.border },
  modalCancel: { fontSize: typography.md, color: colors.textSecondary },
  modalTitle: { fontSize: typography.lg, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  modalSave: { fontSize: typography.md, color: colors.accent, fontWeight: fontWeight.semibold },
  modalBody: { padding: spacing.md },
  fieldLabel: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: fontWeight.medium, marginTop: spacing.md, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, color: colors.textPrimary },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  iconBtn: { width: 50, height: 50, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  iconBtnActive: { borderColor: colors.accent, backgroundColor: colors.accent + '22' },
  iconBtnText: { fontSize: 24 },
  deleteBtn: { marginTop: spacing.xxl, backgroundColor: colors.error + '11', padding: spacing.md, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.error + '33' },
  deleteBtnText: { color: colors.error, fontWeight: fontWeight.bold },
});
