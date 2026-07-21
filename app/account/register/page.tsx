'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, deleteUser, sendEmailVerification, updateProfile } from 'firebase/auth';
import { ShieldAlert, UserPlus } from 'lucide-react';
import { useToastStore } from '@/lib/toast-store';
import { auth } from '@/lib/firebase-client';
import { createCustomerProfile } from '@/lib/client-services';
import {
  markVerificationEmailSent,
  safeAccountRedirect,
  verificationErrorMessage,
} from '@/lib/email-verification';
import GoogleSignInButton, { checkGoogleRedirectResult } from '@/components/auth/GoogleSignInButton';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(160),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  confirmPassword: z.string().min(8).max(72),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToastStore((state) => state.addToast);
  const redirectTo = safeAccountRedirect(searchParams.get('redirect'));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [linkingEmail, setLinkingEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  // Pick up any pending Google redirect result on mount.
  useEffect(() => {
    checkGoogleRedirectResult({
      onSuccess: () => {
        addToast('Account created with Google. No verification needed!', 'success');
        router.push(redirectTo);
      },
      onError: (message) => setErrorMsg(message),
      onAccountLinkingConflict: (email) => setLinkingEmail(email),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleSuccess = () => {
    addToast('Account created with Google. No verification needed!', 'success');
    router.push(redirectTo);
  };

  const handleGoogleError = (message: string) => {
    setErrorMsg(message);
  };

  const handleAccountLinkingConflict = (email: string) => {
    setLinkingEmail(email);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const credential = await createUserWithEmailAndPassword(auth, data.email.trim().toLowerCase(), data.password);
      try {
        await updateProfile(credential.user, { displayName: data.name.trim() });
        await createCustomerProfile(credential.user, data.name);
      } catch (profileError) {
        await deleteUser(credential.user).catch(() => undefined);
        throw profileError;
      }

      try {
        const continueUrl = new URL('/account/verify-email', window.location.origin);
        continueUrl.searchParams.set('redirect', redirectTo);
        await sendEmailVerification(credential.user, { url: continueUrl.toString(), handleCodeInApp: false });
        markVerificationEmailSent(credential.user.uid);
        addToast('Account created. Firebase sent your verification email.', 'success');
      } catch (verificationError) {
        addToast(verificationErrorMessage(verificationError), 'error');
      }
      router.push(`/account/verify-email?redirect=${encodeURIComponent(redirectTo)}`);
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      setErrorMsg(code === 'auth/email-already-in-use'
        ? 'An account already exists for this email.'
        : 'Unable to create the account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-brand-white border border-brand-black/5 p-8 clip-angled-lg space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black uppercase tracking-tight text-brand-black">Create An Account</h1>
        <p className="text-xs text-brand-dark-gray font-semibold leading-relaxed">
          Register with Google for instant access, or use email/password (verification required).
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 border border-red-200 text-xs font-semibold p-3 clip-angled-sm flex gap-2 items-center">
          <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {linkingEmail && (
        <div className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold p-3 clip-angled-sm space-y-1">
          <p className="font-bold">Account already exists for {linkingEmail}</p>
          <p>
            This email is registered with a different sign-in method. Log in with your
            email/password to access your existing account. Accounts are not merged
            automatically to protect your order history.
          </p>
        </div>
      )}

      {/* Google Sign-In */}
      <div className="space-y-3">
        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          onAccountLinkingConflict={handleAccountLinkingConflict}
        />
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-brand-black/10" />
          <span className="text-[10px] font-bold uppercase text-brand-dark-gray">or register with email</span>
          <div className="flex-1 border-t border-brand-black/10" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Full Name</label>
          <input type="text" autoComplete="name" {...register('name')} className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
          {errors.name && <p className="text-[10px] font-bold text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Email Address</label>
          <input type="email" autoComplete="email" {...register('email')} className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
          {errors.email && <p className="text-[10px] font-bold text-red-500">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Password</label>
          <input type="password" autoComplete="new-password" {...register('password')} className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
          {errors.password && <p className="text-[10px] font-bold text-red-500">{errors.password.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Confirm Password</label>
          <input type="password" autoComplete="new-password" {...register('confirmPassword')} className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
          {errors.confirmPassword && <p className="text-[10px] font-bold text-red-500">{errors.confirmPassword.message}</p>}
        </div>
        <button type="submit" disabled={loading} className="w-full bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-extrabold uppercase py-3.5 px-6 flex items-center justify-center gap-1.5 transition-colors clip-angled border border-brand-black disabled:opacity-50">
          <UserPlus className="w-4 h-4" />
          <span>{loading ? 'Registering...' : 'Create Account'}</span>
        </button>
      </form>

      <div className="text-center text-xs font-semibold text-brand-dark-gray pt-2">
        Already have an account?{' '}
        <Link href={`/account/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-brand-black font-bold hover:underline">Log In Here</Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-xs font-bold uppercase">Loading registration...</p>}>
      <RegisterContent />
    </Suspense>
  );
}
