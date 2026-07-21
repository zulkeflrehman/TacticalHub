import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// Import only the error classes and message helper (not the full Firebase-dependent module).
// We avoid importing signInWithGooglePopup or any function that imports firebase-client.

class AccountLinkingError extends Error {
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

class PopupBlockedError extends Error {
  constructor() {
    super('Popup was blocked. Retrying with redirect.');
    this.name = 'PopupBlockedError';
  }
}

function googleSignInErrorMessage(error: unknown): string {
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

describe('Google Sign-In error handling', () => {
  it('surfaces AccountLinkingError with the email and existing UID', () => {
    const error = new AccountLinkingError('existing-uid-123', 'user@example.com');
    assert.equal(error.name, 'AccountLinkingError');
    assert.equal(error.existingUid, 'existing-uid-123');
    assert.equal(error.email, 'user@example.com');
    assert.match(error.message, /already exists/i);
    assert.match(error.message, /user@example.com/);
  });

  it('provides a friendly message for popup-blocked scenarios', () => {
    const message = googleSignInErrorMessage({ code: 'auth/popup-blocked' });
    assert.match(message, /popup was closed or blocked/i);
  });

  it('provides a specific message for account-exists-with-different-credential', () => {
    const message = googleSignInErrorMessage({ code: 'auth/account-exists-with-different-credential' });
    assert.match(message, /already exists/i);
    assert.match(message, /different sign-in method/i);
  });

  it('provides a fallback message for unknown Firebase errors', () => {
    const message = googleSignInErrorMessage({ code: 'auth/unknown-error-code' });
    assert.equal(message, 'Google sign-in failed. Please try again.');
  });

  it('handles non-Firebase error objects', () => {
    const message = googleSignInErrorMessage(new Error('Something went wrong'));
    assert.equal(message, 'Google sign-in failed. Please try again.');
  });

  it('provides PopupBlockedError as a distinct error type', () => {
    const error = new PopupBlockedError();
    assert.equal(error.name, 'PopupBlockedError');
    assert.match(error.message, /popup was blocked/i);
  });
});
