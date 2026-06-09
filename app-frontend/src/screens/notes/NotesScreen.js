// src/screens/notes/NotesScreen.js
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

export default function NotesScreen() {
  const [notesList, setNotesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const fetchNotes = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await axios.get(`${BASE_URL}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data?.notes || res.data?.data || res.data || [];
      setNotesList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch notes error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    try {
      const token = await getAccessToken();
      const payload = { title, content };
      if (editingNote) {
        await axios.patch(`${BASE_URL}/notes/${editingNote._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${BASE_URL}/notes`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setModalVisible(false);
      resetForm();
      fetchNotes();
    } catch (err) {
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getAccessToken();
            await axios.delete(`${BASE_URL}/notes/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotes();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete note');
          }
        }
      }
    ]);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setEditingNote(null);
  };

  const openEdit = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content || '');
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.noteItem} onPress={() => openEdit(item)}>
      <View style={styles.noteContentWrapper}>
        <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.noteSnippet} numberOfLines={2}>{item.content}</Text>
        <Text style={styles.noteDate}>{new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Text style={styles.addBtnText}>+ New Note</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notesList}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No notes yet</Text>
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
              <Text style={styles.modalTitle}>{editingNote ? 'Edit Note' : 'New Note'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Note title"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Start writing..."
                placeholderTextColor={colors.textMuted}
                value={content}
                onChangeText={setContent}
                multiline
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>{editingNote ? 'Update Note' : 'Save Note'}</Text>
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
  noteItem: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md
  },
  noteContentWrapper: { flex: 1 },
  noteTitle: { fontSize: typography.md, color: colors.textPrimary, fontWeight: fontWeight.bold },
  noteSnippet: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 4 },
  noteDate: { fontSize: 10, color: colors.textMuted, marginTop: 8 },
  deleteBtn: { padding: spacing.sm, justifyContent: 'flex-start' },
  deleteIcon: { color: colors.textMuted, fontSize: 18 },

  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: typography.md },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl, padding: spacing.lg, height: '90%'
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
  textArea: { flex: 1, minHeight: 200, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg
  },
  submitBtnText: { color: colors.white, fontSize: typography.md, fontWeight: fontWeight.bold },
});
