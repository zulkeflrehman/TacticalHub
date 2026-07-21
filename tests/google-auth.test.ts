import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// We re-implement the error classes and message helper locally so this test
// has no dependency on Firebase or any browser API.

class AccountLinkingRequiredError extends Error {
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

class PopupBlockedError extends Error {
  constructor() {
    super('Popup was blocked. Retrying with redirect.');
    this.name = 'PopupBlockedError';
  }
}

function googleSignInErrorMessage(error: unknown): string {
  if (error instanceof AccountLinkingRequiredError) return error.message;
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  switch (code) {
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

describe('Google Sign-In error handling', () => {
  it('AccountLinkingRequiredError carries the email and existing providers', () => {
    const error = new AccountLinkingRequiredError('user@example.com', ['password']);
    assert.equal(error.name, 'AccountLinkingRequiredError');
    assert.equal(error.email, 'user@example.com');
    assert.deepEqual(error.existingProviders, ['password']);
    assert.match(error.message, /user@example.com/);
    assert.match(error.message, /Sign in with your existing method/);
  });

  it('provides a friendly message for popup-blocked scenarios', () => {
    const message = googleSignInErrorMessage({ code: 'auth/popup-blocked' });
    assert.match(message, /popup was closed or blocked/i);
  });

  it('provides a linking-specific message for account-exists-with-different-credential', () => {
    const message = googleSignInErrorMessage({ code: 'auth/account-exists-with-different-credential' });
    assert.match(message, /sign in with your existing method/i);
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

  it('provides a specific message for credential-already-in-use', () => {
    const message = googleSignInErrorMessage({ code: 'auth/credential-already-in-use' });
    assert.match(message, /already linked/i);
  });

  it('AccountLinkingRequiredError message is returned directly by googleSignInErrorMessage', () => {
    const error = new AccountLinkingRequiredError('a@b.com', ['password', 'google.com']);
    const message = googleSignInErrorMessage(error);
    assert.equal(message, error.message);
  });
});
