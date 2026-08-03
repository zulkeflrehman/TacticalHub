'use client';

import { useToastStore } from '@/lib/toast-store';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 border border-[#33506B] bg-[#1F3346] text-[#FFFFFF] shadow-2xl animate-slide-left rounded-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.type === 'success' && <CheckCircle className="w-4.5 h-4.5 text-[#10B981] shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4.5 h-4.5 text-[#E55353] shrink-0" />}
            {toast.type === 'info' && <Info className="w-4.5 h-4.5 text-[#FFFFFF] shrink-0" />}
            
            <p className="text-xs font-mono font-bold truncate">{toast.message}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {toast.message.toLowerCase().includes('cart') && (
              <Link
                href="/cart"
                className="text-[10px] font-mono font-bold text-[#FFFFFF] hover:underline uppercase bg-[#142230] px-2 py-1 border border-[#33506B] rounded-none"
              >
                VIEW CART
              </Link>
            )}
            
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#A0B1C5] hover:text-[#FFFFFF] p-1 active:scale-[0.98] rounded-none"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
