export function authErrorMessage(failure) {
  const messages = {
    'EMAIL_EXISTS': 'This email is already registered. Sign in with your existing account.',
    'WEAK_PASSWORD': 'Choose a stronger password that meets the account password policy.',
    'INVALID_INPUT': 'Check your email and password and try again.',
    'INVALID_CREDENTIALS': 'The email or password is incorrect. Try again or reset your password.',
    'RATE_LIMITED': 'Too many attempts. Please wait a moment before trying again.',
    'AUTH_UNAVAILABLE': 'Email/password authentication is unavailable. Try Google or contact the site administrator.',
    'AUTH_PROVIDER_ERROR': 'The authentication service is temporarily unavailable. Please try again later.',
    'UNAUTHORIZED': 'Your session has expired. Sign in again.',
    'auth/email-already-in-use': 'This email is already registered. Sign in with your existing account.',
    'auth/weak-password': 'Choose a stronger password that meets the account password policy.',
    'auth/invalid-credential': 'The email or password is incorrect. Try again, reset your password, or use Google if that is how you signed up.',
    'auth/invalid-login-credentials': 'The email or password is incorrect. Try again or reset your password.',
    'auth/wrong-password': 'The email or password is incorrect. Try again or reset your password.',
    'auth/user-not-found': 'The email or password is incorrect. Try again or reset your password.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/user-disabled': 'This account is disabled. Contact the site administrator.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment before trying again.',
    'auth/network-request-failed': 'Check your internet connection and try again.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow popups and try again.',
    'auth/popup-closed-by-user': 'The sign-in window was closed. You can try again when ready.',
    'auth/cancelled-popup-request': 'Another sign-in window is already open. Complete it or try again.',
    'auth/unauthorized-domain': 'Sign-in is not configured for this website yet. Contact the site administrator.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled yet. Try another method or contact the site administrator.',
    'auth/account-exists-with-different-credential': 'Use the sign-in method you originally used for this account.',
  };
  return messages[failure.code] || (failure.code?.startsWith('auth/') ? 'We could not complete sign-in. Please try again.' : failure.message || 'Something went wrong. Please try again.');
}
