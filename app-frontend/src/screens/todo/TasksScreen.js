// src/screens/todo/TasksScreen.js
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

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('P3');

  const fetchTasks = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await axios.get(`${BASE_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data?.tasks || res.data?.data || res.data || [];
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch tasks error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    try {
      const token = await getAccessToken();
      const payload = { title, description, priority };
      if (editingTask) {
        await axios.patch(`${BASE_URL}/tasks/${editingTask._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${BASE_URL}/tasks`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setModalVisible(false);
      setEditingTask(null);
      resetForm();
      fetchTasks();
    } catch (err) {
      Alert.alert('Error', 'Failed to save task');
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const token = await getAccessToken();
      await axios.patch(`${BASE_URL}/tasks/${task._id}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getAccessToken();
            await axios.delete(`${BASE_URL}/tasks/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            fetchTasks();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete task');
          }
        }
      }
    ]);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority || 'P3');
    setModalVisible(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('P3');
    setEditingTask(null);
  };

  const renderItem = ({ item }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity
        style={[styles.checkbox, item.isCompleted && styles.checkboxChecked]}
        onPress={() => handleToggleComplete(item)}
      >
        {item.isCompleted && <Text style={styles.checkIcon}>✓</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.taskContent} onPress={() => openEdit(item)}>
        <Text style={[styles.taskTitle, item.isCompleted && styles.textStrikethrough]}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={styles.taskDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
        <View style={styles.tagRow}>
          <View style={[styles.priorityTag, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>{item.priority}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const getPriorityColor = (p) => {
    switch (p) {
      case 'P1': return colors.error;
      case 'P2': return colors.warning;
      case 'P3': return colors.accent;
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
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { resetForm(); setModalVisible(true); }}
        >
          <Text style={styles.addBtnText}>+ Add Task</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tasks found</Text>
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
              <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'New Task'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="What needs to be done?"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

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

              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityRow}>
                {['P1', 'P2', 'P3', 'P4'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.pBtn, priority === p && { backgroundColor: getPriorityColor(p) }]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.pBtnText, priority === p && { color: colors.white }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>{editingTask ? 'Update Task' : 'Create Task'}</Text>
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
  taskItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    borderColor: colors.accent, marginRight: spacing.md,
    alignItems: 'center', justifyContent: 'center'
  },
  checkboxChecked: { backgroundColor: colors.accent },
  checkIcon: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: typography.md, color: colors.textPrimary, fontWeight: fontWeight.medium },
  taskDesc: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  textStrikethrough: { textDecorationLine: 'line-through', color: colors.textMuted },
  tagRow: { flexDirection: 'row', marginTop: spacing.xs },
  priorityTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priorityText: { fontSize: 10, color: colors.white, fontWeight: fontWeight.bold },
  deleteBtn: { padding: spacing.sm },
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
  priorityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  pBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm,
    marginHorizontal: 4, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border
  },
  pBtnText: { color: colors.textSecondary, fontWeight: fontWeight.bold },
  submitBtn: {
    backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg
  },
  submitBtnText: { color: colors.white, fontSize: typography.md, fontWeight: fontWeight.bold },
});
