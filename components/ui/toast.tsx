'use client';

import { useToastStore } from '@/lib/toast-store';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 p-4 rounded-none border shadow-md animate-slide-in clip-angled-sm transition-standard bg-brand-white ${
            toast.type === 'success'
              ? 'border-success text-brand-black'
              : toast.type === 'error'
              ? 'border-error text-brand-black'
              : 'border-brand-black text-brand-black'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-success shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-error shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-info shrink-0" />}
          
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="text-brand-dark-gray hover:text-brand-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
