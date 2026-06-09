// src/screens/todo/CalendarScreen.js
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

export default function CalendarScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('meeting');
  const [startTime, setStartTime] = useState(new Date().toISOString());

  const fetchEvents = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await axios.get(`${BASE_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data?.events || res.data?.data || res.data || [];
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch events error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    try {
      const token = await getAccessToken();
      const payload = { title, description, type, startTime };
      if (editingEvent) {
        await axios.patch(`${BASE_URL}/events/${editingEvent._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${BASE_URL}/events`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setModalVisible(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      Alert.alert('Error', 'Failed to save event');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Event', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getAccessToken();
            await axios.delete(`${BASE_URL}/events/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            fetchEvents();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete event');
          }
        }
      }
    ]);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('meeting');
    setEditingEvent(null);
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || '');
    setType(event.type || 'meeting');
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.eventItem}>
      <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(item.type) }]} />
      <TouchableOpacity style={styles.eventContent} onPress={() => openEdit(item)}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventTime}>
          {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {item.description ? <Text style={styles.eventDesc}>{item.description}</Text> : null}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const getTypeColor = (t) => {
    switch (t) {
      case 'meeting': return colors.accent;
      case 'call': return colors.success;
      case 'deadline': return colors.error;
      case 'personal': return colors.warning;
      default: return colors.textMuted;
    }
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
        <Text style={styles.headerTitle}>Calendar</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Text style={styles.addBtnText}>+ Add Event</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No events scheduled</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingEvent ? 'Edit Event' : 'New Event'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Event title"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {['meeting', 'call', 'deadline', 'personal'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tBtn, type === t && { backgroundColor: getTypeColor(t) }]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.tBtnText, type === t && { color: colors.white }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Details (optional)"
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>{editingEvent ? 'Update Event' : 'Create Event'}</Text>
              </TouchableOpacity>
            </ScrollView>
        </View>
      </View>
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
  eventItem: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden'
  },
  typeIndicator: { width: 6 },
  eventContent: { flex: 1, padding: spacing.md },
  eventTitle: { fontSize: typography.md, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  eventTime: { fontSize: typography.sm, color: colors.accent, marginTop: 2, fontWeight: fontWeight.medium },
  eventDesc: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 4 },
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
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  tBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border
  },
  tBtnText: { color: colors.textSecondary, fontWeight: fontWeight.medium, textTransform: 'capitalize' },
  submitBtn: {
    backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg
  },
  submitBtnText: { color: colors.white, fontSize: typography.md, fontWeight: fontWeight.bold },
});
