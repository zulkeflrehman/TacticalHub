'use client';

import { useEffect, useState } from 'react';
import { getIdToken, reload, sendEmailVerification, type User } from 'firebase/auth';
import { CheckCircle2, MailCheck, RefreshCw, Send } from 'lucide-react';
import {
  markVerificationEmailSent,
  verificationCooldownRemaining,
  verificationErrorMessage,
} from '@/lib/email-verification';

interface EmailVerificationPanelProps {
  user: User;
  redirectTo: string;
  onVerified: () => void;
}

export default function EmailVerificationPanel({ user, redirectTo, onVerified }: EmailVerificationPanelProps) {
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user.emailVerified) {
      onVerified();
      return;
    }
    const updateCooldown = () => setCooldown(verificationCooldownRemaining(user.uid));
    updateCooldown();
    const timer = window.setInterval(updateCooldown, 1000);
    return () => window.clearInterval(timer);
  }, [onVerified, user]);

  const resend = async () => {
    const remaining = verificationCooldownRemaining(user.uid);
    if (remaining > 0) {
      setCooldown(remaining);
      return;
    }
    setSending(true);
    setError('');
    setMessage('');
    try {
      const continueUrl = new URL('/account/verify-email', window.location.origin);
      continueUrl.searchParams.set('redirect', redirectTo);
      await sendEmailVerification(user, { url: continueUrl.toString(), handleCodeInApp: false });
      markVerificationEmailSent(user.uid);
      setCooldown(60);
      setMessage('A new Firebase verification email has been sent.');
    } catch (sendError) {
      setError(verificationErrorMessage(sendError));
    } finally {
      setSending(false);
    }
  };

  const refreshVerification = async () => {
    setRefreshing(true);
    setError('');
    setMessage('');
    try {
      await reload(user);
      await getIdToken(user, true);
      if (user.emailVerified) {
        setMessage('Email verified. Returning you to checkout...');
        onVerified();
      } else {
        setMessage('Firebase still reports this email as unverified. Open the newest email link, then try again.');
      }
    } catch (refreshError) {
      setError(verificationErrorMessage(refreshError));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl space-y-5 border border-brand-black/5 bg-brand-white p-6 sm:p-8 clip-angled-lg">
      <div className="flex items-start gap-3">
        <MailCheck className="h-7 w-7 shrink-0 text-brand-accent" />
        <div>
          <h2 className="text-lg font-black uppercase">Verify your email</h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-brand-dark-gray">
            Firebase sent a standard address-verification email to <strong className="text-brand-black">{user.email}</strong>.
            Your password account remains active; this is not passwordless email-link sign-in.
          </p>
        </div>
      </div>

      <div className="space-y-2 bg-brand-light-gray p-4 text-xs font-semibold leading-relaxed text-brand-dark-gray">
        <p>Open the newest Firebase email and click its verification link.</p>
        <p>Check Spam, Junk, Promotions, and filtered folders if it is not in your inbox.</p>
        <p>If Firebase says the link expired or is invalid, request a fresh email below and use only the newest link.</p>
      </div>

      {message && <p className="border border-green-200 bg-green-50 p-3 text-xs font-bold text-green-800">{message}</p>}
      {error && <p className="border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={refreshVerification}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 bg-brand-black px-4 py-3 text-xs font-black uppercase text-brand-white disabled:opacity-50"
        >
          {refreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-brand-accent" />}
          I have verified my email
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={sending || cooldown > 0}
          className="flex items-center justify-center gap-2 border border-brand-black bg-brand-white px-4 py-3 text-xs font-black uppercase disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {sending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
        </button>
      </div>
    </section>
  );
}
