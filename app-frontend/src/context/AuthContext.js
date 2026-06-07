// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authAPI, saveTokens, clearTokens, getAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true on first mount while checking token

  // On mount: if a token exists, fetch the current user
  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          const { data } = await authAPI.me();
          setUser(data.data?.user || data.user || data.data || null);
        }
      } catch {
        await clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    const payload = data.data || data;
    await saveTokens(payload.accessToken, payload.refreshToken);
    setUser(payload.user);
    return payload.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    const payload = data.data || data;
    await saveTokens(payload.accessToken, payload.refreshToken);
    setUser(payload.user);
    return payload.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    await clearTokens();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
