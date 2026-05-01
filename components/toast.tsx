"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastContextValue = {
  push: (message: string) => void;
  toasts: { id: number; message: string }[];
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function PrototypeStoreToastProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

  const push = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2400);
  }, []);

  const value = useMemo(() => ({ push, toasts }), [push, toasts]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const value = useContext(ToastContext);

  if (!value) {
    throw new Error("useToast must be used inside PrototypeStoreToastProvider");
  }

  return value;
}

export function ToastViewport() {
  const value = useContext(ToastContext);

  if (!value) {
    return null;
  }

  return (
    <div className="toast-viewport" aria-live="polite">
      {value.toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>
  );
}
