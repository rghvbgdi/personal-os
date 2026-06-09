// src/screens/main/ExpensesScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, ScrollView, Alert, ActivityIndicator,
  RefreshControl, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { expenseAPI } from '../../api/client';
import { colors, spacing, radius, typography, fontWeight } from '../../theme';
import { formatINR, formatRelativeDate } from '../../utils/formatters';

const TYPES = ['all', 'expense', 'income', 'investment'];
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Salary', 'Freelance', 'Investment', 'Other'];
const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Net Banking', 'Wallet', 'Other'];

const TYPE_COLORS = {
  income: colors.income,
  expense: colors.expense,
  investment: colors.investment,
};
const TYPE_ICONS = {
  income: '↑', expense: '↓', investment: '◈',
};

function FilterChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </Text>
    </TouchableOpacity>
  );
}

function ExpenseItem({ item, onPress }) {
  const color = TYPE_COLORS[item.type] || colors.textSecondary;
  const icon = TYPE_ICONS[item.type] || '•';
  return (
    <TouchableOpacity style={styles.item} onPress={() => onPress(item)}>
      <View style={[styles.itemIcon, { backgroundColor: color + '22' }]}>
        <Text style={[styles.itemIconText, { color }]}>{icon}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.itemMeta}>
          <View style={styles.badge}><Text style={styles.badgeText}>{item.category}</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>{item.paymentMethod}</Text></View>
          <Text style={styles.itemDate}>{formatRelativeDate(item.date)}</Text>
        </View>
      </View>
      <Text style={[styles.itemAmount, { color }]}>
        {item.type === 'income' ? '+' : '-'}{formatINR(item.amount)}
      </Text>
    </TouchableOpacity>
  );
}

function AddModal({ visible, onClose, onSuccess, initialData }) {
  const empty = {
    title: '', amount: '', type: 'expense', category: 'Other',
    paymentMethod: 'UPI', notes: '', isRecurring: false,
  };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        amount: initialData.amount.toString(),
      });
    } else {
      setForm(empty);
    }
  }, [initialData, visible]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.amount) {
      Alert.alert('Validation', 'Title and amount are required.');
      return;
    }
    const parsed = parseFloat(form.amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Validation', 'Enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      if (initialData) {
        await expenseAPI.update(initialData._id, { ...form, amount: parsed });
      } else {
        await expenseAPI.create({ ...form, amount: parsed, date: new Date().toISOString() });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save expense.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await expenseAPI.remove(initialData._id);
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>{initialData ? 'Edit' : 'Add'} Transaction</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.accent} /> : <Text style={styles.modalSave}>Save</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {['expense', 'income', 'investment'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, form.type === t && { backgroundColor: TYPE_COLORS[t] + '33', borderColor: TYPE_COLORS[t] }]}
                  onPress={() => set('type', t)}
                >
                  <Text style={[styles.typeBtnText, form.type === t && { color: TYPE_COLORS[t] }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput style={styles.input} value={form.title} onChangeText={(v) => set('title', v)}
              placeholder="e.g. Swiggy order" placeholderTextColor={colors.textMuted} />

            <Text style={styles.fieldLabel}>Amount (₹)</Text>
            <TextInput style={styles.input} value={form.amount} onChangeText={(v) => set('amount', v)}
              placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" />

            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizScroll}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} style={[styles.pill, form.category === c && styles.pillActive]} onPress={() => set('category', c)}>
                  <Text style={[styles.pillText, form.category === c && styles.pillTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizScroll}>
              {PAYMENT_METHODS.map((m) => (
                <TouchableOpacity key={m} style={[styles.pill, form.paymentMethod === m && styles.pillActive]} onPress={() => set('paymentMethod', m)}>
                  <Text style={[styles.pillText, form.paymentMethod === m && styles.pillTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={form.notes} onChangeText={(v) => set('notes', v)}
              placeholder="Any notes..." placeholderTextColor={colors.textMuted} multiline />

            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Recurring</Text>
              <Switch value={form.isRecurring} onValueChange={(v) => set('isRecurring', v)}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.white} />
            </View>

            {initialData && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>Delete Transaction</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = filter !== 'all' ? { type: filter } : {};
      const res = await expenseAPI.getAll({ ...params, sort: '-date', limit: 100 });
      const data = res.data?.data?.expenses || res.data?.data || res.data || [];
      setExpenses(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const handleEdit = (item) => {
    setEditingExpense(item);
    setShowAdd(true);
  };

  const handleClose = () => {
    setShowAdd(false);
    setEditingExpense(null);
  };

  // Group by date
  const grouped = expenses.reduce((acc, item) => {
    const key = formatRelativeDate(item.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const sections = Object.entries(grouped).map(([date, items]) => ({ date, items }));

  return (
    <SafeAreaView style={styles.safe}>
      {/* Filter bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {TYPES.map((t) => (
          <FilterChip key={t} label={t} active={filter === t} onPress={() => setFilter(t)} />
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.date}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}><Text style={styles.emptyEmoji}>💸</Text><Text style={styles.emptyText}>No transactions</Text></View>
          }
          renderItem={({ item: section }) => (
            <View style={styles.group}>
              <Text style={styles.groupDate}>{section.date}</Text>
              <View style={styles.groupCard}>
                {section.items.map((e, i) => (
                  <View key={e._id}>
                    <ExpenseItem item={e} onPress={handleEdit} />
                    {i < section.items.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddModal visible={showAdd} onClose={handleClose} onSuccess={load} initialData={editingExpense} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: typography.md, color: colors.textSecondary },

  filterBar: { flexGrow: 0, borderBottomWidth: 1, borderColor: colors.border },
  filterContent: { padding: spacing.sm, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  chipTextActive: { color: colors.white },

  group: { marginBottom: spacing.md },
  groupDate: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: fontWeight.semibold, marginBottom: spacing.xs, marginLeft: 4 },
  groupCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },

  item: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  itemIcon: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  itemIconText: { fontSize: typography.lg, fontWeight: fontWeight.bold },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: typography.md, color: colors.textPrimary, fontWeight: fontWeight.medium },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4, flexWrap: 'wrap' },
  badge: { backgroundColor: colors.surfaceElevated, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: typography.xs, color: colors.textSecondary },
  itemDate: { fontSize: typography.xs, color: colors.textMuted },
  itemAmount: { fontSize: typography.md, fontWeight: fontWeight.bold },

  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.xl,
    width: 56, height: 56, borderRadius: radius.full,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
    elevation: 8,
  },
  fabText: { fontSize: typography.xxl, color: colors.white, lineHeight: 28, marginTop: -2 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderBottomWidth: 1, borderColor: colors.border,
  },
  modalCancel: { fontSize: typography.md, color: colors.textSecondary },
  modalTitle: { fontSize: typography.lg, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  modalSave: { fontSize: typography.md, color: colors.accent, fontWeight: fontWeight.semibold },
  modalBody: { padding: spacing.md, paddingBottom: 40 },

  fieldLabel: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: fontWeight.medium, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 14, color: colors.textPrimary, fontSize: typography.md,
  },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  typeBtnText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },

  horizScroll: { flexGrow: 0 },
  pill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
    marginRight: spacing.xs, backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText: { fontSize: typography.sm, color: colors.textSecondary },
  pillTextActive: { color: colors.white, fontWeight: fontWeight.medium },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  deleteBtn: { marginTop: spacing.xxl, backgroundColor: colors.error + '11', padding: spacing.md, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.error + '33' },
  deleteBtnText: { color: colors.error, fontWeight: fontWeight.bold },
});
