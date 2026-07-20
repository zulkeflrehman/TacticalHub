'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { getUserProfile } from '@/lib/client-services';
import type { StoreUserDto } from '@/lib/catalog-types';

export default function AuthGate({
  children,
  admin = false,
}: {
  children: (user: User, profile: StoreUserDto) => React.ReactNode;
  admin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<{ user: User; profile: StoreUserDto } | null>(null);
  const [message, setMessage] = useState('Checking access...');

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) {
      router.replace(`/account/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    try {
      const profile = await getUserProfile(user);
      if (!profile || (admin && profile.role !== 'ADMIN')) {
        setMessage(admin ? 'This account does not have administrator access.' : 'Your account profile is unavailable.');
        if (admin) window.setTimeout(() => router.replace('/account/profile'), 1200);
        return;
      }
      setState({ user, profile });
    } catch {
      setMessage('Unable to verify access. Check your connection and try again.');
    }
  }), [admin, pathname, router]);

  if (!state) {
    return <div className="p-12 text-center text-xs font-bold uppercase text-brand-dark-gray">{message}</div>;
  }
  return <>{children(state.user, state.profile)}</>;
}
