// src/screens/todo/SleepScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput,
  ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import Constants from 'expo-constants';
import { colors, spacing, radius, typography, fontWeight } from '../../theme';
import { getAccessToken } from '../../api/client';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000/api/v1';

export default function SleepScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  // Form state
  const [sleepTime, setSleepTime] = useState(new Date().toISOString());
  const [wakeTime, setWakeTime] = useState(new Date().toISOString());
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await axios.get(`${BASE_URL}/sleep`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data?.logs || res.data?.data || res.data || [];
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch sleep logs error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const handleSubmit = async () => {
    try {
      const token = await getAccessToken();
      const payload = { sleepTime, wakeTime, quality, notes };
      if (editingLog) {
        await axios.patch(`${BASE_URL}/sleep/${editingLog._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${BASE_URL}/sleep`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setModalVisible(false);
      resetForm();
      fetchLogs();
    } catch (err) {
      Alert.alert('Error', 'Failed to save sleep log');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Log', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getAccessToken();
            await axios.delete(`${BASE_URL}/sleep/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            fetchLogs();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete sleep log');
          }
        }
      }
    ]);
  };

  const resetForm = () => {
    setSleepTime(new Date().toISOString());
    setWakeTime(new Date().toISOString());
    setQuality(3);
    setNotes('');
    setEditingLog(null);
  };

  const openEdit = (log) => {
    setEditingLog(log);
    setSleepTime(log.sleepTime);
    setWakeTime(log.wakeTime);
    setQuality(log.quality);
    setNotes(log.notes || '');
    setModalVisible(true);
  };

  const renderItem = ({ item }) => {
    const sleep = new Date(item.sleepTime);
    const wake = new Date(item.wakeTime);
    const duration = Math.round((wake - sleep) / (1000 * 60 * 60) * 10) / 10;

    return (
      <View style={styles.logItem}>
        <TouchableOpacity style={styles.logContent} onPress={() => openEdit(item)}>
          <View style={styles.logHeader}>
            <Text style={styles.logDate}>{new Date(item.date || item.wakeTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>{'★'.repeat(item.quality)}</Text>
            </View>
          </View>
          <Text style={styles.logDuration}>{duration} hours of sleep</Text>
          <Text style={styles.logTimes}>
            {sleep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {wake.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {item.notes ? <Text style={styles.logNotes}>{item.notes}</Text> : null}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sleep Logs</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Text style={styles.addBtnText}>+ Log Sleep</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No sleep logs found</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingLog ? 'Edit Sleep Log' : 'Log Sleep'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Quality (1-5)</Text>
              <View style={styles.qualityRow}>
                {[1, 2, 3, 4, 5].map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[styles.qBtn, quality === q && styles.qBtnActive]}
                    onPress={() => setQuality(q)}
                  >
                    <Text style={[styles.qBtnText, quality === q && styles.qBtnTextActive]}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="How did you sleep?"
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>{editingLog ? 'Update Log' : 'Save Log'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border
  },
  headerTitle: { fontSize: typography.xxl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  addBtn: { backgroundColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  addBtnText: { color: colors.white, fontWeight: fontWeight.semibold },

  list: { padding: spacing.md },
  logItem: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border
  },
  logContent: { flex: 1, padding: spacing.md },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  logDate: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  qualityBadge: { backgroundColor: colors.surfaceElevated, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  qualityText: { fontSize: 10, color: colors.warning },
  logDuration: { fontSize: typography.lg, color: colors.textPrimary, fontWeight: fontWeight.bold },
  logTimes: { fontSize: typography.sm, color: colors.accent, marginTop: 2 },
  logNotes: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' },
  deleteBtn: { padding: spacing.md, justifyContent: 'center' },
  deleteIcon: { color: colors.textMuted, fontSize: 18 },

  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: typography.md },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '80%'
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  modalTitle: { fontSize: typography.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  closeText: { color: colors.error, fontSize: typography.md },
  label: { color: colors.textSecondary, fontSize: typography.sm, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surfaceElevated, color: colors.textPrimary,
    borderRadius: radius.md, padding: spacing.md, fontSize: typography.md,
    borderWidth: 1, borderColor: colors.border
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  qualityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  qBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border
  },
  qBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  qBtnText: { color: colors.textPrimary, fontWeight: fontWeight.bold },
  qBtnTextActive: { color: colors.white },
  submitBtn: {
    backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg
  },
  submitBtnText: { color: colors.white, fontSize: typography.md, fontWeight: fontWeight.bold },
});
