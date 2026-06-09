// src/screens/placement/PlacementScreen.js
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

export default function PlacementScreen() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('dsa');
  const [difficulty, setDifficulty] = useState('medium');
  const [mastery, setMastery] = useState('learning');

  const fetchTopics = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await axios.get(`${BASE_URL}/placement`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data?.topics || res.data?.data || res.data || [];
      setTopics(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch topics error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTopics();
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    try {
      const token = await getAccessToken();
      const payload = { title, subject, difficulty, mastery };
      if (editingTopic) {
        await axios.patch(`${BASE_URL}/placement/${editingTopic._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${BASE_URL}/placement`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setModalVisible(false);
      resetForm();
      fetchTopics();
    } catch (err) {
      Alert.alert('Error', 'Failed to save topic');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Topic', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getAccessToken();
            await axios.delete(`${BASE_URL}/placement/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            fetchTopics();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete topic');
          }
        }
      }
    ]);
  };

  const resetForm = () => {
    setTitle('');
    setSubject('dsa');
    setDifficulty('medium');
    setMastery('learning');
    setEditingTopic(null);
  };

  const openEdit = (topic) => {
    setEditingTopic(topic);
    setTitle(topic.title);
    setSubject(topic.subject || 'dsa');
    setDifficulty(topic.difficulty || 'medium');
    setMastery(topic.mastery || 'learning');
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.topicItem} onPress={() => openEdit(item)}>
      <View style={styles.topicContent}>
        <View style={styles.topicHeader}>
          <Text style={styles.topicTitle}>{item.title}</Text>
          <View style={[styles.diffBadge, { backgroundColor: getDiffColor(item.difficulty) }]}>
            <Text style={styles.diffText}>{item.difficulty}</Text>
          </View>
        </View>
        <View style={styles.topicFooter}>
          <Text style={styles.subjectText}>{item.subject?.toUpperCase()}</Text>
          <Text style={[styles.masteryText, { color: getMasteryColor(item.mastery) }]}>{item.mastery}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const getDiffColor = (d) => {
    switch (d) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getMasteryColor = (m) => {
    switch (m) {
      case 'mastered': return colors.success;
      case 'confident': return colors.accent;
      case 'learning': return colors.warning;
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
        <Text style={styles.headerTitle}>Placement</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Text style={styles.addBtnText}>+ Add Topic</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={topics}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No topics tracked yet</Text>
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
              <Text style={styles.modalTitle}>{editingTopic ? 'Edit Topic' : 'Add Topic'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Topic name (e.g. Binary Search)"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Subject</Text>
              <View style={styles.choiceRow}>
                {['dsa', 'oops', 'dbms', 'cn', 'os'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.choiceBtn, subject === s && styles.choiceBtnActive]}
                    onPress={() => setSubject(s)}
                  >
                    <Text style={[styles.choiceBtnText, subject === s && styles.choiceBtnTextActive]}>{s.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.choiceRow}>
                {['easy', 'medium', 'hard'].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.choiceBtn, difficulty === d && { backgroundColor: getDiffColor(d), borderColor: getDiffColor(d) }]}
                    onPress={() => setDifficulty(d)}
                  >
                    <Text style={[styles.choiceBtnText, difficulty === d && { color: colors.white }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>{editingTopic ? 'Update Topic' : 'Add Topic'}</Text>
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
  topicItem: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md
  },
  topicContent: { flex: 1 },
  topicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topicTitle: { fontSize: typography.md, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  diffBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  diffText: { fontSize: 10, color: colors.white, fontWeight: fontWeight.bold, textTransform: 'capitalize' },
  topicFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  subjectText: { fontSize: 10, color: colors.textMuted, fontWeight: fontWeight.bold },
  masteryText: { fontSize: typography.xs, fontWeight: fontWeight.medium, textTransform: 'capitalize' },
  deleteBtn: { padding: spacing.sm, justifyContent: 'center' },
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
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  choiceBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border
  },
  choiceBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  choiceBtnText: { color: colors.textSecondary, fontWeight: fontWeight.medium, textTransform: 'capitalize' },
  choiceBtnTextActive: { color: colors.white },
  submitBtn: {
    backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg
  },
  submitBtnText: { color: colors.white, fontSize: typography.md, fontWeight: fontWeight.bold },
});
