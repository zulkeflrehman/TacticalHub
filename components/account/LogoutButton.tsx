'use client';

import { useRouter } from 'next/navigation';
import { useToastStore } from '@/lib/toast-store';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        addToast('Logged out successfully.', 'info');
        router.push('/');
        router.refresh();
      }
    } catch {
      addToast('Error logging out.', 'error');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold uppercase transition-colors clip-angled"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>Log Out</span>
    </button>
  );
}
