import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(undefined);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', title) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const showForbiddenAlert = useCallback(() => {
    addToast(
      'You do not have permission to perform this action. (403 Forbidden)',
      'error',
      'Access Denied'
    );
  }, [addToast]);

  const showAccountDisabledAlert = useCallback(() => {
    addToast(
      'Your account has been deactivated. Please contact your administrator.',
      'error',
      'Account Disabled'
    );
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, showForbiddenAlert, showAccountDisabledAlert }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
