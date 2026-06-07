// src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, typography, fontWeight } from '../../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Validation', 'Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // Navigation resets automatically via RootNavigator
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed. Please try again.';
      Alert.alert('Login Failed', msg);
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
            <Text style={styles.tagline}>Your life, organised.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.btnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Sign Up</Text>
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
