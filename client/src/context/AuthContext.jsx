import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Silent token refresh — called on every cold start.
 * Tries localStorage first; if access token expired, calls /auth/refresh
 * using the refresh token stored in localStorage.
 * Only redirects to login if refresh token is also expired/missing.
 */
async function silentRefresh() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await axios.post(
      `${API}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const { accessToken, refreshToken: newRefresh } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
    return accessToken;
  } catch {
    // Refresh token expired or invalid — clear everything
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await axios.post(`${API}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  // ── Boot: restore session on every cold start ─────────────────────────────
  useEffect(() => {
    (async () => {
      let token = localStorage.getItem('accessToken');

      // Try to fetch /me with existing token
      if (token) {
        try {
          const res = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data.data.user);
          setLoading(false);
          return;
        } catch (err) {
          // Access token expired (401) → try silent refresh
          if (err.response?.status !== 401) {
            setLoading(false);
            return;
          }
        }
      }

      // Token missing or expired — try silent refresh
      token = await silentRefresh();
      if (token) {
        try {
          const res = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data.data.user);
        } catch {}
      }

      setLoading(false);
    })();
  }, []);

  // Listen for forced logout events from axios interceptor
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [logout]);

  const login = useCallback(async (credentials) => {
    const res = await axios.post(`${API}/auth/login`, credentials);
    const { accessToken, refreshToken, user: u } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await axios.post(`${API}/auth/register`, payload);
    const { accessToken, refreshToken, user: u } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    setUser(u);
    return u;
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
