import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (text: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [anchorTop, setAnchorTop] = useState<number | null>(null);
  const [anchorLeft, setAnchorLeft] = useState<number | null>(null);
  const [anchorWidth, setAnchorWidth] = useState<number | null>(null);

  const updateAnchor = () => {
    const anchor = document.querySelector('.toast-anchor');
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      setAnchorTop(rect.top - 8); // 8px above the anchor element
      setAnchorLeft(rect.left);
      setAnchorWidth(rect.width);
    } else {
      setAnchorTop(null);
      setAnchorLeft(null);
      setAnchorWidth(null);
    }
  };

  const showToast = useCallback((text: string, type: ToastType = 'info') => {
    updateAnchor();
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* top-centered banner style matching screenshot */}
      <div
        className="absolute box-border flex items-start justify-start flex-col gap-2 z-50 pointer-events-none"
        style={
          anchorTop != null && anchorLeft != null
            ? { top: anchorTop, left: anchorLeft, width: anchorWidth || undefined }
            : undefined
        }
      >
        {toasts.map((t) => {
          let bgClass = 'bg-blue-500 text-white';
          if (t.type === 'success') bgClass = 'bg-green-500 text-white';
          else if (t.type === 'error' || t.type === 'warning') bgClass = 'bg-yellow-100 text-yellow-800';
          else if (t.type === 'info') bgClass = 'bg-blue-500 text-white';
          return (
            <div
              key={t.id}
              className={`w-full px-6 py-3 rounded shadow font-semibold transition-opacity duration-300 wrap-break-word ${bgClass}`}
            >
              {t.text}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
