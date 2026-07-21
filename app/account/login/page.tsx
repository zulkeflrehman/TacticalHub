'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToastStore } from '@/lib/toast-store';
import { auth } from '@/lib/firebase-client';
import { sendPasswordResetEmail, signInWithEmailAndPassword, reload, getIdToken } from 'firebase/auth';
import { LogIn, ShieldAlert, Link2 } from 'lucide-react';
import { safeAccountRedirect } from '@/lib/email-verification';
import GoogleSignInButton, { checkGoogleRedirectResult } from '@/components/auth/GoogleSignInButton';
import { linkPendingGoogleCredential, hasPendingCredential, clearPendingCredential } from '@/lib/google-auth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToastStore((state) => state.addToast);

  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [linking, setLinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingLinkEmail, setPendingLinkEmail] = useState('');
  const [pendingProviders, setPendingProviders] = useState<string[]>([]);

  const requestedRedirect = searchParams.get('redirect');
  const redirectUrl = safeAccountRedirect(requestedRedirect);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Pick up any pending Google redirect result on mount.
  useEffect(() => {
    checkGoogleRedirectResult({
      onSuccess: () => {
        addToast('Signed in with Google.', 'success');
        router.push(redirectUrl);
      },
      onError: (message) => setErrorMsg(message),
      onAccountLinkingRequired: (email, providers) => {
        setPendingLinkEmail(email);
        setPendingProviders(providers);
        setValue('email', email);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleSuccess = () => {
    addToast('Signed in with Google.', 'success');
    router.push(redirectUrl);
  };

  const handleGoogleError = (message: string) => {
    setErrorMsg(message);
  };

  const handleAccountLinkingRequired = (email: string, providers: string[]) => {
    setPendingLinkEmail(email);
    setPendingProviders(providers);
    setValue('email', email);
    setErrorMsg('');
  };

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
    const hasPending = hasPendingCredential();

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        data.email.trim().toLowerCase(),
        data.password,
      );

      // If there's a pending Google credential from an earlier account-linking
      // attempt, link it now that the user has authenticated with their existing method.
      if (hasPending) {
        setLinking(true);
        try {
          await linkPendingGoogleCredential();
          // Force-refresh the token to pick up the new provider
          await reload(credential.user);
          await getIdToken(credential.user, true);
          addToast('Google account linked successfully.', 'success');
        } catch (linkError) {
          // Linking failed but sign-in succeeded — not a blocker, just inform user
          const code =
            typeof linkError === 'object' && linkError && 'code' in linkError
              ? String((linkError as { code: unknown }).code)
              : '';
          if (code === 'auth/credential-already-in-use') {
            addToast('This Google account is already linked to another account.', 'error');
          } else {
            addToast('Sign-in succeeded but Google linking failed. Try again later.', 'error');
          }
          clearPendingCredential();
        } finally {
          setLinking(false);
        }
      } else {
        addToast('Logged in successfully.', 'success');
      }

      router.push(
        credential.user.emailVerified
          ? redirectUrl
          : `/account/verify-email?redirect=${encodeURIComponent(redirectUrl)}`,
      );
    } catch (error) {
      const code =
        typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      setErrorMsg(
        code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : 'Unable to log in. Please try again.',
      );
    } finally {
      setLoading(false);
      setLinking(false);
    }
  };

  const hasPending = pendingLinkEmail !== '';

  return (
    <div className="max-w-[95%] sm:max-w-md mx-auto bg-brand-white border border-brand-black/5 p-4 sm:p-8 clip-angled-lg space-y-6">
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

      {hasPending && (
        <div className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold p-4 clip-angled-sm space-y-2">
          <p className="font-bold flex items-center gap-1.5">
            <Link2 className="w-4 h-4 shrink-0" />
            Link Google to your existing account
          </p>
          <p>
            An account for <span className="font-black">{pendingLinkEmail}</span> already exists
            using{' '}
            {pendingProviders
              .map((p) => (p === 'password' ? 'email/password' : p))
              .join(' and ')}
            .
          </p>
          <p>
            Enter your password below to sign in. Google will then be linked to your existing
            account so you can use either method. Your order history and profile are preserved.
          </p>
        </div>
      )}

      {/* Google Sign-In — hidden once a linking flow is in progress */}
      {!hasPending && (
        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          onAccountLinkingRequired={handleAccountLinkingRequired}
        />
      )}

      <div
        role="separator"
        aria-label="Or continue with email"
        data-testid="email-divider"
        className="flex items-center gap-3"
      >
        <div className="flex-1 border-t border-brand-black/10" aria-hidden="true" />
        <span className="text-[10px] font-bold uppercase text-brand-dark-gray">
          or continue with email
        </span>
        <div className="flex-1 border-t border-brand-black/10" aria-hidden="true" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="login-email" className="text-[10px] font-black uppercase text-brand-dark-gray block">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
          />
          {errors.email && (
            <p className="text-[10px] font-bold text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="login-password" className="text-[10px] font-black uppercase text-brand-dark-gray block">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
          />
          {errors.password && (
            <p className="text-[10px] font-bold text-red-500">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || linking}
          className="w-full bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-extrabold uppercase py-3.5 px-6 flex items-center justify-center gap-1.5 transition-colors clip-angled border border-brand-black disabled:opacity-50"
        >
          <LogIn className="w-4 h-4" />
          <span>
            {linking ? 'Linking Google…' : loading ? 'Logging In...' : hasPending ? 'Log In and Link Google' : 'Log In'}
          </span>
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
        <Link
          href={`/account/register?redirect=${encodeURIComponent(redirectUrl)}`}
          className="text-brand-black font-bold hover:underline"
        >
          Register Here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto bg-brand-white border border-brand-black/5 p-12 text-center clip-angled-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-dark-gray animate-pulse">
            Loading secure portal...
          </p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
