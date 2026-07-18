'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToastStore } from '@/lib/toast-store';
import { useStore } from '@/lib/store';
import { LogIn, ShieldAlert } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToastStore((state) => state.addToast);
  const syncCartWithServer = useStore((state) => state.syncCartWithServer);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const redirectUrl = searchParams.get('redirect') || '/account/profile';

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await res.json();

      if (res.ok && resData.success) {
        addToast(resData.message || 'Logged in successfully.', 'success');
        
        // Sync guest cart with database
        if (resData.user?.id) {
          await syncCartWithServer(resData.user.id);
        }

        router.push(redirectUrl);
        router.refresh();
      } else {
        setErrorMsg(resData.message || 'Invalid email or password.');
      }
    } catch {
      setErrorMsg('Network error. Failed to log in.');
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

      {/* Demo Credentials Tip */}
      <div className="bg-brand-light-gray border border-brand-black/5 p-3.5 text-[10px] font-semibold text-brand-dark-gray leading-normal">
        <p className="font-bold text-brand-black uppercase">Demo Sandbox Credentials:</p>
        <p className="mt-1">
          • Admin: <strong className="text-brand-black">admin@tecticalhub.com</strong> / password: <strong className="text-brand-black">admin_password_123</strong>
        </p>
        <p>
          • Customer: <strong className="text-brand-black">user@tecticalhub.com</strong> / password: <strong className="text-brand-black">user_password_123</strong>
        </p>
      </div>

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
