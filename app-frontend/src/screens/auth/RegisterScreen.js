// src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, typography, fontWeight } from '../../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Validation', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>P</Text>
            </View>
            <Text style={styles.appName}>Personal OS</Text>
            <Text style={styles.tagline}>Start your journey.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>It's free, always.</Text>

            {[
              { label: 'Full Name', value: name, setter: setName, placeholder: 'Raghav Bagdi', caps: 'words' },
              { label: 'Email', value: email, setter: setEmail, placeholder: 'you@example.com', caps: 'none', keyboard: 'email-address' },
              { label: 'Password', value: password, setter: setPassword, placeholder: '••••••••', secure: true },
              { label: 'Confirm Password', value: confirm, setter: setConfirm, placeholder: '••••••••', secure: true },
            ].map(({ label, value, setter, placeholder, caps = 'sentences', keyboard, secure }) => (
              <View key={label} style={styles.field}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor={colors.textMuted}
                  value={value}
                  onChangeText={setter}
                  autoCapitalize={caps}
                  keyboardType={keyboard}
                  secureTextEntry={secure}
                  autoCorrect={false}
                />
              </View>
            ))}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  brand: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: {
    width: 72, height: 72, borderRadius: radius.full,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: { fontSize: typography.xxxl, color: colors.white, fontWeight: fontWeight.bold },
  appName: { fontSize: typography.xxl, color: colors.textPrimary, fontWeight: fontWeight.bold },
  tagline: { fontSize: typography.md, color: colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  title: { fontSize: typography.xl, color: colors.textPrimary, fontWeight: fontWeight.bold, marginBottom: 4 },
  subtitle: { fontSize: typography.md, color: colors.textSecondary, marginBottom: spacing.lg },
  field: { marginBottom: spacing.md },
  label: { fontSize: typography.sm, color: colors.textSecondary, marginBottom: 6, fontWeight: fontWeight.medium },
  input: {
    backgroundColor: colors.surfaceElevated, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    color: colors.textPrimary, fontSize: typography.md,
  },
  btn: {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: 16, alignItems: 'center', marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontSize: typography.md, fontWeight: fontWeight.semibold },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { color: colors.textSecondary, fontSize: typography.md },
  footerLink: { color: colors.accent, fontSize: typography.md, fontWeight: fontWeight.semibold },
});
