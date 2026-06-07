import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/api/auth.api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }

    authApi.getMe()
      .then(({ data }) => setUser(data.data.user))
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [logout]);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
