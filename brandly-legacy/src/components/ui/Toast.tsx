import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  duration = 3000,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const styles = {
    success: {
      bg: 'bg-emerald-950/90 border-emerald-700/50',
      icon: <CheckCircle size={18} className="text-emerald-400 shrink-0" />,
      text: 'text-emerald-200'
    },
    error: {
      bg: 'bg-rose-950/90 border-rose-700/50',
      icon: <AlertCircle size={18} className="text-rose-400 shrink-0" />,
      text: 'text-rose-200'
    },
    info: {
      bg: 'bg-violet-950/90 border-violet-700/50',
      icon: <Info size={18} className="text-violet-400 shrink-0" />,
      text: 'text-violet-200'
    }
  };

  const style = styles[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-300 ${style.bg} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {style.icon}
      <span className={`text-sm font-medium ${style.text}`}>{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300);
        }}
        title="Cerrar notificación"
        className="text-neutral-500 hover:text-white p-0.5 rounded transition-colors ml-2"
      >
        <X size={14} />
      </button>
    </div>
  );
};
