import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, Copy, Scissors, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'copy' | 'cut';
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

const ICONS: Record<Toast['type'], React.ReactNode> = {
  success: <CheckCircle2 size={14} className="text-emerald-400" />,
  error: <AlertCircle size={14} className="text-red-400" />,
  info: <Info size={14} className="text-sky-400" />,
  copy: <Copy size={14} className="text-violet-400" />,
  cut: <Scissors size={14} className="text-amber-400" />,
};

const COLORS: Record<Toast['type'], string> = {
  success: 'border-emerald-500/30 bg-emerald-500/5',
  error: 'border-red-500/30 bg-red-500/5',
  info: 'border-sky-500/30 bg-sky-500/5',
  copy: 'border-violet-500/30 bg-violet-500/5',
  cut: 'border-amber-500/30 bg-amber-500/5',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 2000) => {
    const id = `toast-${++counterRef.current}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — bottom-center */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col-reverse gap-2 items-center pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-md shadow-xl animate-in ${COLORS[toast.type]}`}
          >
            {ICONS[toast.type]}
            <span className="text-xs text-neutral-200 font-medium">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-1 text-neutral-500 hover:text-neutral-300 transition-colors"
              title="Cerrar"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
