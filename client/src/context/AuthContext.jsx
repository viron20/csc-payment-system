import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getProfile } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('csc_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await getProfile();
      setUser(data);
    } catch {
      localStorage.removeItem('csc_token');
      localStorage.removeItem('csc_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = (token, userData) => {
    localStorage.setItem('csc_token', token);
    localStorage.setItem('csc_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('csc_token');
    localStorage.removeItem('csc_user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await getProfile();
      setUser(data);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
