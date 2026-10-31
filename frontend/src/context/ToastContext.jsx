import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

const ICONS = {
  success: <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />,
  error:   <XCircle     size={20} className="text-red-500 flex-shrink-0" />,
  info:    <Info        size={20} className="text-blue-500 flex-shrink-0" />,
};

const BG = {
  success: 'border-green-200 bg-green-50',
  error:   'border-red-200 bg-red-50',
  info:    'border-blue-200 bg-blue-50',
};

const TEXT = {
  success: 'text-green-800',
  error:   'text-red-800',
  info:    'text-blue-800',
};

let nextId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {}
      <div className="fixed top-4 right-4 z-[9999999] flex flex-col gap-3 pointer-events-none"
        style={{ maxWidth: '360px' }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="alert"
            className={`
              flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-xl
              backdrop-blur-sm pointer-events-auto
              animate-in slide-in-from-right-4 fade-in duration-300
              ${BG[toast.type] || BG.info}
            `}
          >
            {ICONS[toast.type] || ICONS.info}
            <p className={`text-sm font-medium flex-1 leading-relaxed ${TEXT[toast.type] || TEXT.info}`}>
              {toast.message}
            </p>
            <button
              onClick={() => remove(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
