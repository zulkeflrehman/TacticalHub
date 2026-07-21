'use client';

import { useState } from 'react';
import {
  AccountLinkingError,
  getGoogleRedirectResult,
  googleSignInErrorMessage,
  PopupBlockedError,
  signInWithGooglePopup,
  signInWithGoogleRedirect,
} from '@/lib/google-auth';

interface GoogleSignInButtonProps {
  /** Called after a successful sign-in so the parent can navigate/refresh. */
  onSuccess: () => void;
  /** Optional – called when an error message should be surfaced to the user. */
  onError?: (message: string) => void;
  /** Optional – called specifically when an account-linking collision is detected. */
  onAccountLinkingConflict?: (email: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * A standalone "Continue with Google" button that handles both the popup and
 * redirect flows transparently.  Import and drop it onto any auth page.
 *
 * Flow:
 *  1. Click → attempt popup
 *  2. Popup blocked → automatic fallback to full-page redirect
 *  3. On page load this component also checks for a pending redirect result
 *     (via getGoogleRedirectResult) so the redirect flow completes seamlessly.
 */
export default function GoogleSignInButton({
  onSuccess,
  onError,
  onAccountLinkingConflict,
  label = 'Continue with Google — no verification email required',
  className = '',
  disabled = false,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  // Check for a pending redirect result on mount.
  // We do this in a one-time effect equivalent: a module-level promise
  // is too fragile; instead we rely on the parent pages to call this
  // via the useGoogleRedirectResult hook (see below) rather than here,
  // because React effects inside buttons would fire on every render.
  // The parent pages import useGoogleRedirectResult for this purpose.

  const handleClick = async () => {
    if (loading || disabled) return;
    setLoading(true);

    try {
      await signInWithGooglePopup();
      onSuccess();
    } catch (popupError) {
      if (popupError instanceof PopupBlockedError) {
        // Popup was blocked — fall back to redirect (page will reload).
        try {
          await signInWithGoogleRedirect();
          // signInWithGoogleRedirect navigates away; no further action needed here.
        } catch (redirectError) {
          const message = googleSignInErrorMessage(redirectError);
          onError?.(message);
          setLoading(false);
        }
        return;
      }

      if (popupError instanceof AccountLinkingError) {
        onAccountLinkingConflict?.(popupError.email);
        onError?.(popupError.message);
        setLoading(false);
        return;
      }

      const message = googleSignInErrorMessage(popupError);
      onError?.(message);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      aria-label={label}
      className={[
        'w-full flex items-center justify-center gap-3',
        'bg-brand-white border border-brand-black/20 hover:border-brand-black',
        'text-xs font-extrabold uppercase text-brand-black',
        'py-3.5 px-6 transition-colors clip-angled',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Google "G" SVG logo */}
      {loading ? (
        <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin shrink-0" aria-hidden="true" />
      ) : (
        <GoogleIcon />
      )}
      <span>{loading ? 'Connecting to Google…' : label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="16"
      height="16"
      viewBox="0 0 48 48"
      className="shrink-0"
    >
      <path
        fill="#4285F4"
        d="M47.5 24.5c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.3z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.9-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.1 0-11.2-4.1-13.1-9.6H2.8v6.2C6.7 42.6 14.8 48 24 48z"
      />
      <path
        fill="#FBBC05"
        d="M10.9 28.9c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4v-6.2H2.8C1 17.2 0 20.5 0 24s1 6.8 2.8 9.1l8.1-4.2z"
      />
      <path
        fill="#EA4335"
        d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.7-6.7C35.9 2.4 30.4 0 24 0 14.8 0 6.7 5.4 2.8 13.3l8.1 6.2C12.8 13.6 17.9 9.5 24 9.5z"
      />
    </svg>
  );
}

// ─── Hook for pages to pick up a pending redirect result on mount ─────────────

/**
 * Processes any pending Google redirect result exactly once per page load.
 * Call this at the top level of a page component to handle the redirect flow.
 *
 * This is not a React Hook — it runs synchronously at module evaluation time
 * when called. Use it in a useEffect(() => { checkGoogleRedirectResult(...) }, []).
 */
export function checkGoogleRedirectResult({
  onSuccess,
  onError,
  onAccountLinkingConflict,
}: {
  onSuccess: () => void;
  onError?: (message: string) => void;
  onAccountLinkingConflict?: (email: string) => void;
}): void {
  // We use a module-level flag so this runs at most once per page load, even
  // in React Strict Mode where effects fire twice.
  if (typeof window === 'undefined') return;

  const FLAG = '__thGoogleRedirectChecked';
  const win = window as unknown as Record<string, unknown>;
  if (win[FLAG]) return;
  win[FLAG] = true;

  getGoogleRedirectResult()
    .then((result) => {
      if (result) onSuccess();
    })
    .catch((error) => {
      if (error instanceof AccountLinkingError) {
        onAccountLinkingConflict?.(error.email);
        onError?.(error.message);
        return;
      }
      onError?.(googleSignInErrorMessage(error));
    });
}
