'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToastStore } from '@/lib/toast-store';
import { useStore } from '@/lib/store';
import { UserPlus, ShieldAlert } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const syncCartWithServer = useStore((state) => state.syncCartWithServer);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await res.json();

      if (res.ok && resData.success) {
        addToast(resData.message || 'Account created successfully!', 'success');
        
        // Sync guest cart with database
        if (resData.user?.id) {
          await syncCartWithServer(resData.user.id);
        }

        router.push('/account/profile');
        router.refresh();
      } else {
        setErrorMsg(resData.message || 'Failed to create account.');
      }
    } catch {
      setErrorMsg('Network error. Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-brand-white border border-brand-black/5 p-8 clip-angled-lg space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black uppercase tracking-tight text-brand-black">
          Create An Account
        </h1>
        <p className="text-xs text-brand-dark-gray font-semibold leading-relaxed">
          Sign up to track shipments, save multiple addresses, and checkout faster.
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
          <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Full Name</label>
          <input
            type="text"
            {...register('name')}
            className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
          />
          {errors.name && <p className="text-[10px] font-bold text-red-500">{errors.name.message}</p>}
        </div>

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
          <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Mobile Number</label>
          <input
            type="text"
            placeholder="e.g. 03001234567"
            {...register('phone')}
            className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
          />
          {errors.phone && <p className="text-[10px] font-bold text-red-500">{errors.phone.message}</p>}
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

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Confirm Password</label>
          <input
            type="password"
            {...register('confirmPassword')}
            className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
          />
          {errors.confirmPassword && <p className="text-[10px] font-bold text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-extrabold uppercase py-3.5 px-6 flex items-center justify-center gap-1.5 transition-colors clip-angled border border-brand-black disabled:opacity-50"
        >
          <UserPlus className="w-4 h-4" />
          <span>{loading ? 'Registering...' : 'Create Account'}</span>
        </button>
      </form>

      <div className="text-center text-xs font-semibold text-brand-dark-gray pt-2">
        Already have an account?{' '}
        <Link href="/account/login" className="text-brand-black font-bold hover:underline">
          Log In Here
        </Link>
      </div>
    </div>
  );
}
