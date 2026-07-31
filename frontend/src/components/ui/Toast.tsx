import { useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define toast types
interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: (id: string) => void;
}

// Component individual toast item
const ToastItem: React.FC<ToastProps> = ({ id, message, type, duration, onClose }) => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Auto-dismiss after duration (default 5000ms)
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => onClose(id), 300); // Wait for exit animation
      }, 300);
    }, duration || 5000);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
        fadeOut ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div
        className={`flex items-center px-4 py-3 rounded-lg shadow-lg max-w-sm ${
          type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : type === 'error'
            ? 'bg-red-50 text-red-800 border border-red-200'
            : type === 'info'
            ? 'bg-blue-50 text-blue-800 border border-blue-200'
            : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
        }`}
      >
        {/* Icon based on type */}
        <span className="mr-3">
          {type === 'success' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {type === 'error' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {type === 'info' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {type === 'warning' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L8.05 3.25C7.282 2.425 5.5 3.08 5.5 4.5v13.5c0 1.42 1.782 2.075 2.55 1.25z" />
            </svg>
          )}
        </span>
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
};

// Context provider for managing toasts
const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => {
    const id = uuidv4();
    setToasts(prev => [...prev, { id, message, type, duration, onClose: () => {} }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Render all toast items
  const renderedToasts = toasts.map(toast => (
    <ToastItem key={toast.id} {...toast} onClose={removeToast} />
  ));

  return (
    <>
      {children}
      <div className="pointer-events-none">
        {renderedToasts}
      </div>
    </>
  );
};

// Custom hook for using toast (simplified version)
export const useToast = () => {
  return {
    success: (_msg: string, _duration?: number) => {},
    error: (_msg: string, _duration?: number) => {},
    info: (_msg: string, _duration?: number) => {},
    warning: (_msg: string, _duration?: number) => {},
  };
};

// Global wrapper that adds the provider
export const ToastProviderWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Simplified wrapper - actual toast management handled by Providers component
  return (
    <>
      {children}
    </>
  );
};

// Simplified global toast functions that work without context initially
let toastQueue: Array<{ msg: string; type: 'success' | 'error' | 'info' | 'warning' }> = [];

const processNextToast = () => {
  if (toastQueue.length === 0) return;

  const { msg, type } = toastQueue.shift()!;

  // Create a temporary toast element (would normally use React component)
  console.log(`[Toast ${type}]`, msg);

  // In a full implementation, we'd render a React component into a portal
  // For now, this is a placeholder — in actual React app, use useToast hook
};

export const toast = {
  success: (msg: string, duration?: number) => {
    toastQueue.push({ msg, type: 'success' });
    if (toastQueue.length === 1) processNextToast();
  },
  error: (msg: string, duration?: number) => {
    toastQueue.push({ msg, type: 'error' });
    if (toastQueue.length === 1) processNextToast();
  },
  info: (msg: string, duration?: number) => {
    toastQueue.push({ msg, type: 'info' });
    if (toastQueue.length === 1) processNextToast();
  },
  warning: (msg: string, duration?: number) => {
    toastQueue.push({ msg, type: 'warning' });
    if (toastQueue.length === 1) processNextToast();
  },
};

export default toast;
