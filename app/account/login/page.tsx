'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToastStore } from '@/lib/toast-store';
import { auth } from '@/lib/firebase-client';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { LogIn, ShieldAlert } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72)
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToastStore((state) => state.addToast);

  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const requestedRedirect = searchParams.get('redirect');
  const redirectUrl = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//')
    ? requestedRedirect
    : '/account/profile';

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const resetPassword = async () => {
    const email = getValues('email')?.trim();
    if (!email || !z.string().email().safeParse(email).success) {
      setErrorMsg('Enter your account email first.');
      return;
    }
    setResetting(true);
    setErrorMsg('');
    try {
      await sendPasswordResetEmail(auth, email);
      addToast('If that account exists, Firebase has sent password-reset instructions.', 'success');
    } catch {
      setErrorMsg('Unable to request a password reset. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithEmailAndPassword(auth, data.email.trim().toLowerCase(), data.password);
      addToast('Logged in successfully.', 'success');
      router.push(redirectUrl);
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      setErrorMsg(
        code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : 'Unable to log in. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-brand-white border border-brand-black/5 p-8 clip-angled-lg space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black uppercase tracking-tight text-brand-black">
          Access Your Account
        </h1>
        <p className="text-xs text-brand-dark-gray font-semibold leading-relaxed">
          Log in to check order status, update shipping details, and access your profile history.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 border border-red-200 text-xs font-semibold p-3 clip-angled-sm flex gap-2 items-center">
          <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Email Address</label>
          <input
            type="email"
            {...register('email')}
            className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
          />
          {errors.email && <p className="text-[10px] font-bold text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Password</label>
          <input
            type="password"
            {...register('password')}
            className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
          />
          {errors.password && <p className="text-[10px] font-bold text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-extrabold uppercase py-3.5 px-6 flex items-center justify-center gap-1.5 transition-colors clip-angled border border-brand-black disabled:opacity-50"
        >
          <LogIn className="w-4 h-4" />
          <span>{loading ? 'Logging In...' : 'Log In'}</span>
        </button>
        <button
          type="button"
          disabled={resetting}
          onClick={resetPassword}
          className="w-full text-[11px] font-bold text-brand-dark-gray hover:text-brand-black disabled:opacity-50"
        >
          {resetting ? 'Requesting reset...' : 'Forgot your password?'}
        </button>
      </form>

      <div className="text-center text-xs font-semibold text-brand-dark-gray pt-2">
        Don&apos;t have an account?{' '}
        <Link href="/account/register" className="text-brand-black font-bold hover:underline">
          Register Here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto bg-brand-white border border-brand-black/5 p-12 text-center clip-angled-lg">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-dark-gray animate-pulse">Loading secure portal...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
