'use client';

/**
 * Google Sign-In orchestration for TacticalHub.
 *
 * Strategy:
 * 1. Attempt a popup (fast, no page reload).
 * 2. If the environment blocks popups (mobile WebView, some browsers) fall back
 *    to a full-page redirect via signInWithRedirect.
 * 3. After sign-in, call createGoogleCustomerProfileIfNew so new users get a
 *    CUSTOMER profile while existing documents (including any ADMIN role) are
 *    left completely untouched.
 * 4. If the Google email is already present in Firestore under a different UID,
 *    surface an AccountLinkingError so the caller can show a warning UI.
 */

import {
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type UserCredential,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase-client';
import {
  createGoogleCustomerProfileIfNew,
  findConflictingUserByEmail,
} from './client-services';

// ─── Custom error types ────────────────────────────────────────────────────────

/**
 * Thrown when the Google email already exists in Firestore under a different
 * Firebase Auth UID (i.e. the user previously registered with email/password).
 */
export class AccountLinkingError extends Error {
  constructor(
    public readonly existingUid: string,
    public readonly email: string,
  ) {
    super(
      `An account for ${email} already exists under a different sign-in method. ` +
        'Log in with your email/password to access that account.',
    );
    this.name = 'AccountLinkingError';
  }
}

/**
 * Thrown when a popup is blocked or fails due to an environment restriction
 * and the caller should trigger a redirect instead.
 */
export class PopupBlockedError extends Error {
  constructor() {
    super('Popup was blocked. Retrying with redirect.');
    this.name = 'PopupBlockedError';
  }
}

// ─── Firebase error-code helpers ──────────────────────────────────────────────

const POPUP_BLOCKED_CODES = new Set([
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
]);

function isPopupError(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  return POPUP_BLOCKED_CODES.has(code);
}

export function googleSignInErrorMessage(error: unknown): string {
  if (error instanceof AccountLinkingError) return error.message;
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  switch (code) {
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists for this email under a different sign-in method. Please log in with email/password instead.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment before trying again.';
    case 'auth/popup-blocked':
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'The sign-in popup was closed or blocked. Redirecting to Google…';
    default:
      return 'Google sign-in failed. Please try again.';
  }
}

// ─── Core sign-in function ────────────────────────────────────────────────────

interface GoogleSignInResult {
  credential: UserCredential;
  profileStatus: 'EXISTING' | 'CUSTOMER';
}

/**
 * Sign in with Google using a popup.  If the popup is blocked, throws
 * PopupBlockedError so the caller can fall back to redirect.
 *
 * After a successful Firebase sign-in, this function:
 *   - Checks for an account-linking collision in Firestore.
 *   - Creates a CUSTOMER profile document for first-time users.
 *   - Never overwrites an existing document or demotes an ADMIN.
 */
export async function signInWithGooglePopup(): Promise<GoogleSignInResult> {
  let credential: UserCredential;
  try {
    credential = await signInWithPopup(auth, googleProvider);
  } catch (error) {
    if (isPopupError(error)) throw new PopupBlockedError();
    throw error;
  }

  return postSignInSetup(credential);
}

/**
 * Initiate a full-page Google redirect sign-in.
 * Call getGoogleRedirectResult() after the page reloads to complete the flow.
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Retrieve the result of a previously-initiated signInWithRedirect flow.
 * Returns null when no redirect result is present (normal on first page load).
 */
export async function getGoogleRedirectResult(): Promise<GoogleSignInResult | null> {
  const credential = await getRedirectResult(auth);
  if (!credential) return null;
  return postSignInSetup(credential);
}

// ─── Post sign-in helpers ─────────────────────────────────────────────────────

async function postSignInSetup(
  credential: UserCredential,
): Promise<GoogleSignInResult> {
  const { user } = credential;
  const email = String(user.email || '').trim().toLowerCase();

  // Detect account-linking collisions before writing anything.
  if (email) {
    const conflictUid = await findConflictingUserByEmail(email, user.uid);
    if (conflictUid) {
      // Sign the user back out to avoid leaving a dangling session.
      await auth.signOut().catch(() => undefined);
      console.warn(
        '[google-auth] Account linking scenario detected.',
        'Google UID:', user.uid,
        'Existing UID:', conflictUid,
        'Email:', email,
      );
      throw new AccountLinkingError(conflictUid, email);
    }
  }

  const displayName = String(user.displayName || user.email || '').trim();
  const profileStatus = await createGoogleCustomerProfileIfNew(user, displayName);

  return { credential, profileStatus };
}
