const VERIFICATION_SENT_KEY = 'tecticalhub-verification-email-sent';
export const VERIFICATION_RESEND_SECONDS = 60;

function storageKey(uid: string): string {
  return `${VERIFICATION_SENT_KEY}:${uid}`;
}

export function markVerificationEmailSent(uid: string): void {
  try {
    window.localStorage.setItem(storageKey(uid), String(Date.now()));
  } catch {
    // A blocked storage API should not prevent Firebase from sending the email.
  }
}

export function verificationCooldownRemaining(uid: string): number {
  try {
    const sentAt = Number(window.localStorage.getItem(storageKey(uid)) || 0);
    if (!Number.isFinite(sentAt)) return 0;
    return Math.max(0, Math.ceil((sentAt + VERIFICATION_RESEND_SECONDS * 1000 - Date.now()) / 1000));
  } catch {
    return 0;
  }
}

export function safeAccountRedirect(value: string | null, fallback = '/account/profile'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001F\u007F]/.test(value)) {
    return fallback;
  }
  try {
    let decoded = value;
    for (let index = 0; index < 3; index += 1) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
      if (decoded.startsWith('//') || /[\\\u0000-\u001F\u007F]/.test(decoded)) return fallback;
    }
    const origin = 'https://tecticalhub.invalid';
    return new URL(value, origin).origin === origin ? value : fallback;
  } catch {
    return fallback;
  }
}

export function verificationErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === 'auth/too-many-requests') {
    return 'Firebase has temporarily rate-limited verification emails. Wait a few minutes before trying again.';
  }
  if (code === 'auth/expired-action-code') {
    return 'That verification link has expired. Request a new verification email below.';
  }
  if (code === 'auth/invalid-action-code') {
    return 'That verification link is invalid or was already used. Refresh your verification status or request a new email.';
  }
  if (code === 'auth/user-token-expired' || code === 'auth/invalid-user-token' || code === 'auth/user-disabled') {
    return 'Your session is no longer valid. Sign in again before requesting another verification email.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Firebase could not be reached. Check your connection and try again.';
  }
  return 'Firebase could not send the verification email. Please try again shortly.';
}
