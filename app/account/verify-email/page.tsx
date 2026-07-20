'use client';

import { Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthGate from '@/components/auth/AuthGate';
import EmailVerificationPanel from '@/components/auth/EmailVerificationPanel';
import { safeAccountRedirect } from '@/lib/email-verification';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeAccountRedirect(searchParams.get('redirect'));
  const finish = useCallback(() => router.replace(redirectTo), [redirectTo, router]);

  return (
    <AuthGate>
      {(user) => <EmailVerificationPanel user={user} redirectTo={redirectTo} onVerified={finish} />}
    </AuthGate>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-xs font-bold uppercase">Loading verification...</p>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
