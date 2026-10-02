# Login UI and credential errors

The reported `auth/invalid-credential` comes from Firebase email/password sign-in, before the backend profile request. It does not identify whether the password is wrong or the account lacks email/password credentials. Firebase documents the generic failure under email enumeration protection in its [Auth API reference](https://firebase.google.com/docs/reference/js/auth.md).

Check Firebase Console → `dtminh-dev` → Authentication → Users for the account and its sign-in provider. An account belonging to the previous Firebase project is not automatically transferred when changing the frontend configuration. Use Google for an existing Google account, or reset the password for an account with password sign-in. Ensure Email/Password is enabled under Sign-in method. No real account credentials, password reset requests or user records were accessed during this change.

The login page now uses a responsive split card, moon artwork, full-width primary and Google actions, a password visibility toggle, and separate error/success panels. Known Firebase errors have plain-language messages; invalid-email/password cases preserve the generic account response. Backend profile failures appear separately as account-access errors after authentication. Desktop artwork is hidden on narrower screens to prioritize the form.

Validation: Firebase production build, browser fixtures for rejected credentials and password reset, password visibility, and six viewport widths. Run `node scripts/check-login-ui.mjs` against the built root preview at port 4177, or set `SITE_URL` to another local preview. Firebase sign-in/reset requests in this check are intercepted; it does not modify live accounts. These changes have not been deployed.
