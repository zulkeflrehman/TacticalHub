'use client';

/**
 * Google Sign-In orchestration for TacticalHub.
 *
 * ─── Two sign-in scenarios ───────────────────────────────────────────────────
 *
 * Scenario A — Trusted-provider (Gmail) automatic resolution:
 *   Firebase may resolve a Google sign-in for a Gmail address that was
 *   previously registered with email/password WITHOUT throwing
 *   auth/account-exists-with-different-credential.  In this case Firebase
 *   returns a UserCredential whose UID may differ from the existing
 *   email/password UID.  After sign-in:
 *   - postSignInSetup reloads the user and force-refreshes the ID token.
 *   - createGoogleCustomerProfileIfNew is called:
 *       · If users/{uid} already exists → no-op, all data preserved.
 *       · If users/{uid} does not exist → new CUSTOMER profile created.
 *   - Because we no longer perform a Firestore email scan, we cannot detect
 *     a cross-UID collision server-side in the browser.  The Firebase
 *     Firestore rule enforces !exists() atomically, so a second profile
 *     can only be created when one does not exist yet.
 *   - If a customer believes they have a duplicate account they should
 *     contact support.  This limitation is documented in PHASE 4 of the
 *     implementation notes.
 *
 * Scenario B — Provider-conflict (non-Gmail or project setting):
 *   Firebase throws auth/account-exists-with-different-credential.
 *   The pending Google credential is stored in sessionStorage (not
 *   localStorage) so it expires when the tab is closed.
 *   The user signs in with their existing method (email/password).
 *   linkPendingGoogleCredential() calls linkWithCredential() which adds
 *   Google as a second provider on the EXISTING Firebase user.
 *   The UID is never changed.  All orders remain under the original UID.
 *   The pending credential is cleared after success, failure, or expiry.
 *   No credentials or tokens are logged.
 *
 * ─── After every successful sign-in ─────────────────────────────────────────
 *   reload(user) and getIdToken(user, true) are called to ensure:
 *   - user.emailVerified reflects the current server state.
 *   - The ID token used for subsequent Firestore writes is fresh.
 */

import {
  getRedirectResult,
  getIdToken,
  reload,
  signInWithPopup,
  signInWithRedirect,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  type UserCredential,
  type AuthCredential,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase-client';
import { createGoogleCustomerProfileIfNew } from './client-services';

// ─── Session storage keys ──────────────────────────────────────────────────────

const PENDING_CREDENTIAL_KEY = '__thPendingGoogleCredential';
const PENDING_EMAIL_KEY = '__thPendingGoogleEmail';

// ─── Custom error types ────────────────────────────────────────────────────────

/**
 * Thrown when Firebase explicitly reports that the email already exists under a
 * different sign-in provider (auth/account-exists-with-different-credential).
 * The pending Google credential has been saved to sessionStorage.
 * The UI should prompt the user to sign in with their existing method, after
 * which linkPendingGoogleCredential() can be called.
 *
 * NOTE: Firebase does NOT always throw this error for Gmail addresses.
 * When the project uses "one account per email" enforcement AND the provider
 * is Google (trusted), Firebase may silently complete sign-in with a new UID.
 * See Scenario A in the module comment for how that case is handled.
 */
export class AccountLinkingRequiredError extends Error {
  constructor(
    public readonly email: string,
    public readonly existingProviders: string[],
  ) {
    super(
      `An account for ${email} exists with ${existingProviders.join(', ')}. ` +
        'Sign in with your existing method to link Google.'
    );
    this.name = 'AccountLinkingRequiredError';
  }
}

/**
 * Thrown when a popup is blocked and the caller should fall back to redirect.
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
  const code = errorCode(error);
  return POPUP_BLOCKED_CODES.has(code);
}

function isAccountExistsError(error: unknown): boolean {
  return errorCode(error) === 'auth/account-exists-with-different-credential';
}

function errorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : '';
}

export function googleSignInErrorMessage(error: unknown): string {
  if (error instanceof AccountLinkingRequiredError) return error.message;
  switch (errorCode(error)) {
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists for this email. Please sign in with your existing method first.';
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
    case 'auth/credential-already-in-use':
      return 'This Google account is already linked to another Firebase account.';
    default:
      return 'Google sign-in failed. Please try again.';
  }
}

// ─── Pending credential management (sessionStorage) ───────────────────────────

/**
 * Serialise a Google OAuthCredential into sessionStorage.
 * sessionStorage is same-origin only and is cleared when the tab closes —
 * appropriate for a short-lived pending credential.
 * Only the token fields required to reconstruct the credential are stored;
 * no Firebase ID tokens are persisted here.
 */
function storePendingCredential(credential: AuthCredential, email: string): void {
  if (typeof window === 'undefined') return;
  try {
    const cred = credential as unknown as Record<string, unknown>;
    const serialisable = {
      idToken: cred['idToken'] ?? null,
      accessToken: cred['accessToken'] ?? null,
    };
    sessionStorage.setItem(PENDING_CREDENTIAL_KEY, JSON.stringify(serialisable));
    sessionStorage.setItem(PENDING_EMAIL_KEY, email);
  } catch {
    // Storage may be unavailable (private-browsing restriction) — fail silently.
  }
}

export function getPendingCredential(): { credential: AuthCredential; email: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PENDING_CREDENTIAL_KEY);
    const email = sessionStorage.getItem(PENDING_EMAIL_KEY);
    if (!raw || !email) return null;

    const data = JSON.parse(raw) as { idToken: string | null; accessToken: string | null };
    const credential = GoogleAuthProvider.credential(data.idToken, data.accessToken);
    return { credential, email };
  } catch {
    clearPendingCredential();
    return null;
  }
}

export function clearPendingCredential(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(PENDING_CREDENTIAL_KEY);
    sessionStorage.removeItem(PENDING_EMAIL_KEY);
  } catch {
    // Ignore storage errors.
  }
}

// ─── Account linking (Scenario B) ─────────────────────────────────────────────

/**
 * Link the pending Google credential to the currently signed-in user.
 *
 * Pre-condition: the user has just signed in with their existing
 * email/password and auth.currentUser is that user.
 *
 * The pending credential stored in sessionStorage is consumed exactly once.
 * If linking fails the credential is discarded to prevent re-use.
 */
export async function linkPendingGoogleCredential(): Promise<UserCredential> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in before linking Google.');

  const pending = getPendingCredential();
  if (!pending) throw new Error('No pending Google credential found.');

  try {
    const result = await linkWithCredential(user, pending.credential);
    clearPendingCredential();
    return result;
  } catch (error) {
    clearPendingCredential();
    throw error;
  }
}

/** Returns true when a pending Google credential is waiting to be linked. */
export function hasPendingCredential(): boolean {
  return getPendingCredential() !== null;
}

// ─── Core sign-in functions ───────────────────────────────────────────────────

export interface GoogleSignInResult {
  credential: UserCredential;
  /** 'EXISTING' when the Firestore profile was already present; 'CUSTOMER' when newly created. */
  profileStatus: 'EXISTING' | 'CUSTOMER';
  /** True only when this call completed a linkWithCredential() operation. */
  wasLinked: boolean;
}

/**
 * Sign in with Google using a popup.
 *
 * Throws PopupBlockedError  → caller should fall back to signInWithGoogleRedirect().
 * Throws AccountLinkingRequiredError → caller should surface the linking UI
 *   (only when Firebase explicitly reports a provider conflict).
 */
export async function signInWithGooglePopup(): Promise<GoogleSignInResult> {
  let credential: UserCredential;
  try {
    credential = await signInWithPopup(auth, googleProvider);
  } catch (error) {
    if (isPopupError(error)) throw new PopupBlockedError();
    if (isAccountExistsError(error)) throw await buildAccountLinkingError(error);
    throw error;
  }
  return postSignInSetup(credential, false);
}

/**
 * Initiate a full-page Google redirect sign-in.
 * After the page reloads call getGoogleRedirectResult() to complete the flow.
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Retrieve the result of a previously-initiated signInWithRedirect flow.
 * Returns null when no redirect result is pending (normal on first load).
 */
export async function getGoogleRedirectResult(): Promise<GoogleSignInResult | null> {
  let credential: UserCredential | null;
  try {
    credential = await getRedirectResult(auth);
  } catch (error) {
    if (isAccountExistsError(error)) throw await buildAccountLinkingError(error);
    throw error;
  }
  if (!credential) return null;
  return postSignInSetup(credential, false);
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Build an AccountLinkingRequiredError from a Firebase
 * auth/account-exists-with-different-credential error object.
 * Stores the embedded Google credential in sessionStorage before throwing.
 */
async function buildAccountLinkingError(error: unknown): Promise<AccountLinkingRequiredError> {
  const customData = (error as { customData?: { email?: string } }).customData;
  const email = String(customData?.email ?? '').trim();
  if (!email) throw new Error('Provider conflict detected but email could not be determined.');

  const cred = (error as { credential?: AuthCredential }).credential;
  if (cred) storePendingCredential(cred, email);

  let methods: string[] = [];
  try {
    methods = await fetchSignInMethodsForEmail(auth, email);
  } catch {
    // fetchSignInMethodsForEmail failure is non-fatal; surface what we know.
  }
  return new AccountLinkingRequiredError(email, methods);
}

/**
 * Called after every successful Firebase sign-in (popup or redirect).
 *
 * 1. Reloads the Firebase user so client-side state (emailVerified, providers)
 *    matches the server.
 * 2. Force-refreshes the ID token so subsequent Firestore writes use a fresh token.
 * 3. Calls createGoogleCustomerProfileIfNew — a no-op for existing users.
 */
async function postSignInSetup(
  credential: UserCredential,
  wasLinked: boolean,
): Promise<GoogleSignInResult> {
  const { user } = credential;

  // Ensure client-side user state and ID token are current.
  await reload(user);
  await getIdToken(user, true);

  const displayName = String(user.displayName || user.email || '').trim();
  const profileStatus = await createGoogleCustomerProfileIfNew(user, displayName);

  return { credential, profileStatus, wasLinked };
}
