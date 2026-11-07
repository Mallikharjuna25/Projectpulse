import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/authApi.js';
import { setAccessToken } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Initialize session on mount via silent refresh
  const initAuth = useCallback(async () => {
    try {
      const res = await authApi.refresh();
      if (res?.data?.accessToken) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
      }
    } catch {
      // User is not logged in or session expired
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    const handleSessionExpired = () => {
      setUser(null);
      setSessionExpired(true);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [initAuth]);

  const login = async (email, password, rememberMe = false) => {
    const res = await authApi.login({ email, password, rememberMe });
    if (res?.data) {
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      setSessionExpired(false);
    }
    return res.data;
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    return res.data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res?.data?.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Failed to reload user profile:', err);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    sessionExpired,
    setSessionExpired,
    login,
    register,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

