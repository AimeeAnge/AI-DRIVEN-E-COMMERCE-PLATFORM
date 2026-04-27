import React, { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function dismissToast(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(message, type = "success") {
    if (!message) return;
    const id = crypto.randomUUID();
    setToasts((current) => [...current.slice(-2), { id, message, type }]);
    window.setTimeout(() => dismissToast(id), 3600);
  }

  const value = useMemo(() => ({ showToast, dismissToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <span>{toast.message}</span>
            <button type="button" aria-label="Dismiss message" onClick={() => dismissToast(toast.id)}>
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext) || { showToast: () => {}, dismissToast: () => {} };
}
