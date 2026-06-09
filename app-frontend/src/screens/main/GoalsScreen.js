// src/screens/main/GoalsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, ScrollView, Alert, ActivityIndicator,
  RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goalAPI } from '../../api/client';
import { colors, spacing, radius, typography, fontWeight } from '../../theme';
import { formatINR, formatDate, getPercent } from '../../utils/formatters';

const GOAL_COLORS = ['#6c63ff', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6'];
const GOAL_TYPES = ['savings', 'purchase', 'travel', 'emergency', 'investment', 'other'];

function ProgressBar({ percent, color }) {
  return (
    <View style={styles.barBg}>
      <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: color }]} />
    </View>
  );
}

function GoalCard({ item, onContribute, onEdit }) {
  const percent = getPercent(item.savedAmount || 0, item.targetAmount || 1);
  const color = item.color || colors.accent;
  const isComplete = item.isCompleted || percent >= 100;

  return (
    <TouchableOpacity style={[styles.goalCard, { borderLeftColor: color, borderLeftWidth: 3 }]} onPress={() => onEdit(item)}>
      <View style={styles.goalHeader}>
        <View style={styles.goalLeft}>
          <Text style={styles.goalTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.goalType}>{item.type || 'savings'}</Text>
        </View>
        {isComplete ? (
          <View style={styles.completedBadge}><Text style={styles.completedText}>✓ Done</Text></View>
        ) : (
          <TouchableOpacity style={[styles.contributeBtn, { borderColor: color }]} onPress={() => onContribute(item)}>
            <Text style={[styles.contributeBtnText, { color }]}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <ProgressBar percent={percent} color={color} />

      <View style={styles.goalAmounts}>
        <Text style={styles.savedAmount}>{formatINR(item.savedAmount || 0)}</Text>
        <Text style={styles.targetAmount}>of {formatINR(item.targetAmount)}</Text>
        <Text style={[styles.percent, { color }]}>{percent}%</Text>
      </View>

      {item.deadline && (
        <Text style={styles.deadline}>🗓 Due {formatDate(item.deadline)}</Text>
      )}
    </TouchableOpacity>
  );
}

function AddGoalModal({ visible, onClose, onSuccess, initialData }) {
  const empty = { title: '', targetAmount: '', type: 'savings', deadline: '', color: colors.accent };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        targetAmount: initialData.targetAmount.toString(),
        deadline: initialData.deadline ? initialData.deadline.split('T')[0] : '',
      });
    } else {
      setForm(empty);
    }
  }, [initialData, visible]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.targetAmount) {
      Alert.alert('Validation', 'Title and target amount are required.');
      return;
    }
    const parsed = parseFloat(form.targetAmount);
    if (isNaN(parsed) || parsed <= 0) { Alert.alert('Validation', 'Enter a valid amount.'); return; }
    setSaving(true);
    try {
      if (initialData) {
        await goalAPI.update(initialData._id, { ...form, targetAmount: parsed });
      } else {
        await goalAPI.create({ ...form, targetAmount: parsed, savedAmount: 0 });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save goal.');
    } finally { setSaving(false); }
  };

  const handleDelete = () => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await goalAPI.remove(initialData._id);
            onSuccess?.();
            onClose();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>{initialData ? 'Edit' : 'New'} Goal</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.accent} /> : <Text style={styles.modalSave}>Save</Text>}
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Goal Title</Text>
            <TextInput style={styles.input} value={form.title} onChangeText={(v) => set('title', v)}
              placeholder="e.g. Emergency Fund" placeholderTextColor={colors.textMuted} />

            <Text style={styles.fieldLabel}>Target Amount (₹)</Text>
            <TextInput style={styles.input} value={form.targetAmount} onChangeText={(v) => set('targetAmount', v)}
              placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" />

            <Text style={styles.fieldLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: spacing.sm }}>
              {GOAL_TYPES.map((t) => (
                <TouchableOpacity key={t} style={[styles.pill, form.type === t && styles.pillActive]} onPress={() => set('type', t)}>
                  <Text style={[styles.pillText, form.type === t && styles.pillTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Deadline (optional, YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={form.deadline} onChangeText={(v) => set('deadline', v)}
              placeholder="2025-12-31" placeholderTextColor={colors.textMuted} />

            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.colorRow}>
              {GOAL_COLORS.map((c) => (
                <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, form.color === c && styles.colorDotActive]}
                  onPress={() => set('color', c)} />
              ))}
            </View>

            {initialData && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>Delete Goal</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>
  );
}

function ContributeModal({ visible, goal, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) { Alert.alert('Validation', 'Enter a valid amount.'); return; }
    setSaving(true);
    try {
      await goalAPI.addContribution(goal._id, { amount: parsed });
      setAmount('');
      onSuccess?.();
      onClose();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not add contribution.');
    } finally { anonymizedSaving = false; }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Add to "{goal?.title}"</Text>
            <Text style={styles.fieldLabel}>Amount (₹)</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount}
              placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" autoFocus />
            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Add</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function GoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [contributeGoal, setContributeGoal] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await goalAPI.getAll();
      const data = res.data?.data || res.data || [];
      setGoals(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowAdd(true);
  };

  const handleClose = () => {
    setShowAdd(false);
    setEditingGoal(null);
  };

  const totalSaved = goals.reduce((s, g) => s + (g.savedAmount || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + (g.targetAmount || 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
      ) : (
        <FlatList
          data={goals}
          keyExtractor={(g) => g._id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
          ListHeaderComponent={
            goals.length > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Saved</Text>
                <Text style={styles.summaryAmount}>{formatINR(totalSaved)}</Text>
                <Text style={styles.summaryOf}>of {formatINR(totalTarget)} target</Text>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${getPercent(totalSaved, totalTarget)}%`, backgroundColor: colors.accent }]} />
                </View>
              </View>
            )
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={styles.emptyText}>No goals yet. Create your first!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <GoalCard item={item} onContribute={setContributeGoal} onEdit={handleEdit} />
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddGoalModal visible={showAdd} onClose={handleClose} onSuccess={load} initialData={editingGoal} />
      {contributeGoal && (
        <ContributeModal
          visible={!!contributeGoal}
          goal={contributeGoal}
          onClose={() => setContributeGoal(null)}
          onSuccess={load}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: typography.md, color: colors.textSecondary, textAlign: 'center' },

  summaryCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  summaryLabel: { fontSize: typography.sm, color: colors.textSecondary, marginBottom: 4 },
  summaryAmount: { fontSize: typography.xxxl, color: colors.textPrimary, fontWeight: fontWeight.bold },
  summaryOf: { fontSize: typography.sm, color: colors.textSecondary, marginBottom: spacing.sm },

  goalCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  goalLeft: { flex: 1 },
  goalTitle: { fontSize: typography.md, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  goalType: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  completedBadge: { backgroundColor: colors.success + '22', borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  completedText: { fontSize: typography.xs, color: colors.success, fontWeight: fontWeight.medium },
  contributeBtn: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  contributeBtnText: { fontSize: typography.xs, fontWeight: fontWeight.semibold },

  barBg: { height: 8, backgroundColor: colors.surfaceElevated, borderRadius: radius.full, overflow: 'hidden', marginBottom: spacing.sm },
  barFill: { height: '100%', borderRadius: radius.full },
  goalAmounts: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  savedAmount: { fontSize: typography.md, color: colors.textPrimary, fontWeight: fontWeight.bold },
  targetAmount: { fontSize: typography.sm, color: colors.textSecondary, flex: 1 },
  percent: { fontSize: typography.sm, fontWeight: fontWeight.bold },
  deadline: { fontSize: typography.xs, color: colors.textMuted, marginTop: spacing.xs },

  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.xl,
    width: 56, height: 56, borderRadius: radius.full,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabText: { fontSize: typography.xxl, color: colors.white, lineHeight: 28, marginTop: -2 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderColor: colors.border },
  modalCancel: { fontSize: typography.md, color: colors.textSecondary },
  modalTitle: { fontSize: typography.lg, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  modalSave: { fontSize: typography.md, color: colors.accent, fontWeight: fontWeight.semibold },
  modalBody: { padding: spacing.md, paddingBottom: 40 },
  fieldLabel: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: fontWeight.medium, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 14, color: colors.textPrimary, fontSize: typography.md,
  },
  pill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, marginRight: spacing.xs, backgroundColor: colors.surface },
  pillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText: { fontSize: typography.sm, color: colors.textSecondary },
  pillTextActive: { color: colors.white, fontWeight: fontWeight.medium },
  colorRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: radius.full },
  colorDotActive: { borderWidth: 3, borderColor: colors.white },

  // Contribute sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: 40 },
  sheetTitle: { fontSize: typography.lg, color: colors.textPrimary, fontWeight: fontWeight.semibold, marginBottom: spacing.md },
  sheetBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: { flex: 1, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontSize: typography.md },
  saveBtn: { flex: 1, padding: 14, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontSize: typography.md, fontWeight: fontWeight.semibold },
  deleteBtn: { marginTop: spacing.xxl, backgroundColor: colors.error + '11', padding: spacing.md, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.error + '33' },
  deleteBtnText: { color: colors.error, fontWeight: fontWeight.bold },
});
