import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi.js';
import { mockEngine } from '../api/mockEngine.js';
import { getUseMock, setUseMock } from '../api/config.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('safeops_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isMockMode, setIsMockModeState] = useState(getUseMock());
  const { showAccountDisabledAlert } = useToast();

  const toggleMockMode = () => {
    const next = !isMockMode;
    setUseMock(next);
    setIsMockModeState(next);
  };

  useEffect(() => {
    const handleMockChanged = () => {
      setIsMockModeState(getUseMock());
    };
    window.addEventListener('mock_mode_changed', handleMockChanged);
    return () => window.removeEventListener('mock_mode_changed', handleMockChanged);
  }, []);

  const refreshUser = async () => {
    try {
      if (getUseMock()) {
        setUser(mockEngine.getCurrentUser());
        return;
      }
      if (!token) {
        setUser(null);
        return;
      }
      const res = await authApi.getMe();
      setUser(res.user);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.data?.error === 'Account is disabled') {
        showAccountDisabledAlert();
        logout();
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      if (getUseMock()) {
        setUser(mockEngine.getCurrentUser());
      } else if (token) {
        await refreshUser();
      } else {
        setIsMockModeState(true);
        setUseMock(true);
        setUser(mockEngine.getCurrentUser());
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, pass) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, pass);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('safeops_token', res.token);
    } catch (err) {
      if (err?.response?.status === 401 && err?.response?.data?.error === 'Account is disabled') {
        showAccountDisabledAlert();
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('safeops_token');
  };

  const switchRoleDemo = (role) => {
    mockEngine.setSimulatedRole(role);
    setUser(mockEngine.getCurrentUser());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isMockMode,
        toggleMockMode,
        login,
        logout,
        switchRoleDemo,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
