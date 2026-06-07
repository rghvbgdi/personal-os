// src/screens/main/DashboardScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { expenseAPI, habitAPI } from '../../api/client';
import { colors, spacing, radius, typography, fontWeight } from '../../theme';
import { formatINR, formatRelativeDate, getPercent } from '../../utils/formatters';

function StatCard({ label, amount, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statAmount}>{formatINR(amount)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ExpenseRow({ item }) {
  const typeColor =
    item.type === 'income'
      ? colors.income
      : item.type === 'investment'
      ? colors.investment
      : colors.expense;

  return (
    <View style={styles.expenseRow}>
      <View style={styles.expenseLeft}>
        <Text style={styles.expenseTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.expenseDate}>{formatRelativeDate(item.date)}</Text>
      </View>
      <Text style={[styles.expenseAmount, { color: typeColor }]}>
        {item.type === 'income' ? '+' : '-'}{formatINR(item.amount)}
      </Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ income: 0, expense: 0, investment: 0 });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [activeHabits, setActiveHabits] = useState(0);

  const load = useCallback(async () => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [expRes, habitRes] = await Promise.allSettled([
        expenseAPI.getSummary({ month, year }),
        habitAPI.getAll(),
      ]);

      if (expRes.status === 'fulfilled') {
        const d = expRes.value.data?.data || expRes.value.data || {};
        setSummary({
          income: d.totalIncome || d.income || 0,
          expense: d.totalExpense || d.expense || 0,
          investment: d.totalInvestment || d.investment || 0,
        });
      }

      // Fetch last 5 expenses separately
      try {
        const listRes = await expenseAPI.getAll({ limit: 5, sort: '-date' });
        const items = listRes.data?.data?.expenses || listRes.data?.data || listRes.data || [];
        setRecentExpenses(Array.isArray(items) ? items.slice(0, 5) : []);
      } catch { /* ignore */ }

      if (habitRes.status === 'fulfilled') {
        const habits = habitRes.value.data?.data || habitRes.value.data || [];
        const today = new Date().toISOString().split('T')[0];
        const active = Array.isArray(habits)
          ? habits.filter((h) => {
              const completions = h.completions || [];
              return !completions.some((c) =>
                new Date(c.date || c).toISOString().split('T')[0] === today
              );
            }).length
          : 0;
        setActiveHabits(active);
      }
    } catch { /* silent fail */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';
  const monthlyBudget = user?.monthlyBudget || 0;
  const totalSpent = summary.expense;
  const budgetPercent = getPercent(totalSpent, monthlyBudget);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate('More', { screen: 'Profile' })}
          >
            <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Budget bar */}
        {monthlyBudget > 0 && (
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetLabel}>Monthly Budget</Text>
              <Text style={styles.budgetPercent}>{budgetPercent}% used</Text>
            </View>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${budgetPercent}%`,
                    backgroundColor: budgetPercent > 90 ? colors.error : budgetPercent > 70 ? colors.warning : colors.accent,
                  },
                ]}
              />
            </View>
            <View style={styles.budgetAmounts}>
              <Text style={styles.budgetSpent}>{formatINR(totalSpent)} spent</Text>
              <Text style={styles.budgetTotal}>of {formatINR(monthlyBudget)}</Text>
            </View>
          </View>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard label="Income" amount={summary.income} color={colors.income} />
          <StatCard label="Expense" amount={summary.expense} color={colors.expense} />
          <StatCard label="Invested" amount={summary.investment} color={colors.investment} />
        </View>

        {/* Habits badge */}
        <TouchableOpacity
          style={styles.habitBadge}
          onPress={() => navigation.navigate('Habits')}
          activeOpacity={0.8}
        >
          <Text style={styles.habitEmoji}>🔥</Text>
          <Text style={styles.habitText}>
            {activeHabits > 0
              ? `${activeHabits} habit${activeHabits > 1 ? 's' : ''} pending today`
              : 'All habits done for today! 🎉'}
          </Text>
          <Text style={styles.habitChevron}>›</Text>
        </TouchableOpacity>

        {/* Recent expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {recentExpenses.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💸</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            recentExpenses.map((item) => <ExpenseRow key={item._id} item={item} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { fontSize: typography.md, color: colors.textSecondary },
  name: { fontSize: typography.xxl, color: colors.textPrimary, fontWeight: fontWeight.bold },
  avatar: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: typography.lg, color: colors.white, fontWeight: fontWeight.bold },

  budgetCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  budgetLabel: { fontSize: typography.md, color: colors.textSecondary, fontWeight: fontWeight.medium },
  budgetPercent: { fontSize: typography.sm, color: colors.textSecondary },
  barBg: { height: 8, backgroundColor: colors.surfaceElevated, borderRadius: radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.full },
  budgetAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  budgetSpent: { fontSize: typography.sm, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  budgetTotal: { fontSize: typography.sm, color: colors.textSecondary },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    borderTopWidth: 3,
  },
  statAmount: { fontSize: typography.sm, color: colors.textPrimary, fontWeight: fontWeight.bold, marginBottom: 4 },
  statLabel: { fontSize: typography.xs, color: colors.textSecondary },

  habitBadge: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, gap: spacing.sm,
  },
  habitEmoji: { fontSize: 20 },
  habitText: { flex: 1, fontSize: typography.sm, color: colors.textPrimary, fontWeight: fontWeight.medium },
  habitChevron: { fontSize: typography.xl, color: colors.textSecondary },

  section: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: typography.md, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  seeAll: { fontSize: typography.sm, color: colors.accent },

  expenseRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  expenseLeft: { flex: 1, marginRight: spacing.md },
  expenseTitle: { fontSize: typography.md, color: colors.textPrimary, fontWeight: fontWeight.medium },
  expenseDate: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
  expenseAmount: { fontSize: typography.md, fontWeight: fontWeight.semibold },

  empty: { alignItems: 'center', padding: spacing.xl },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.md, color: colors.textSecondary },
});
