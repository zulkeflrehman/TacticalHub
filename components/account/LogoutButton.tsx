'use client';

import { useRouter } from 'next/navigation';
import { useToastStore } from '@/lib/toast-store';
import { LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

export default function LogoutButton() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      addToast('Logged out successfully.', 'info');
      router.push('/');
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
