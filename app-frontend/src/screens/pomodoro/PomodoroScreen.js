// src/screens/pomodoro/PomodoroScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert, FlatList, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import Constants from 'expo-constants';
import { colors, spacing, radius, typography, fontWeight } from '../../theme';
import { getAccessToken } from '../../api/client';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000/api/v1';

export default function PomodoroScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('focus'); // focus, short-break, long-break

  const fetchSessions = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await axios.get(`${BASE_URL}/pomodoro`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data?.sessions || res.data?.data || res.data || [];
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch sessions error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleTimerComplete = async () => {
    setIsActive(false);
    Alert.alert('Timer Complete!', `Your ${mode} session has ended.`);
    try {
      const token = await getAccessToken();
      await axios.post(`${BASE_URL}/pomodoro`, {
        type: mode,
        duration: getModeDuration(mode),
        wasCompleted: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSessions();
    } catch (err) {
      console.error('Log session error:', err);
    }
    // Switch mode automatically? Or stay?
  };

  const getModeDuration = (m) => {
    switch (m) {
      case 'focus': return 25;
      case 'short-break': return 5;
      case 'long-break': return 15;
      default: return 25;
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(getModeDuration(mode) * 60);
  };

  const changeMode = (m) => {
    setMode(m);
    setIsActive(false);
    setTimeLeft(getModeDuration(m) * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderItem = ({ item }) => (
    <View style={styles.sessionItem}>
      <Text style={styles.sessionType}>{item.type?.toUpperCase()}</Text>
      <Text style={styles.sessionDuration}>{item.duration} min</Text>
      <Text style={styles.sessionDate}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.timerCard}>
          <View style={styles.modeRow}>
            {['focus', 'short-break', 'long-break'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                onPress={() => changeMode(m)}
              >
                <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                  {m.replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>

          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={resetTimer}>
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.startBtn} onPress={toggleTimer}>
              <Text style={styles.startBtnText}>{isActive ? 'PAUSE' : 'START'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Today's Sessions</Text>
          <FlatList
            data={sessions}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No sessions today</Text>
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },

  timerCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.lg
  },
  modeRow: { flexDirection: 'row', backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, padding: 4, marginBottom: spacing.xl },
  modeBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  modeBtnActive: { backgroundColor: colors.accent },
  modeBtnText: { color: colors.textSecondary, fontWeight: fontWeight.bold, fontSize: typography.xs, textTransform: 'uppercase' },
  modeBtnTextActive: { color: colors.white },

  timerText: { fontSize: 80, fontWeight: 'bold', color: colors.textPrimary, marginVertical: spacing.lg },

  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  startBtn: {
    backgroundColor: colors.white, paddingHorizontal: 40, paddingVertical: spacing.md,
    borderRadius: radius.lg, elevation: 4, shadowColor: colors.white, shadowOpacity: 0.2, shadowRadius: 10
  },
  startBtnText: { color: colors.black, fontWeight: fontWeight.bold, fontSize: typography.lg },
  resetBtn: { padding: spacing.md },
  resetBtnText: { color: colors.textSecondary, fontWeight: fontWeight.medium },

  historySection: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: typography.md, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  sessionItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  sessionType: { fontSize: typography.sm, color: colors.textPrimary, fontWeight: fontWeight.medium },
  sessionDuration: { fontSize: typography.sm, color: colors.accent },
  sessionDate: { fontSize: typography.xs, color: colors.textMuted },
  emptyText: { color: colors.textMuted, textAlign: 'center', padding: spacing.md },
});
