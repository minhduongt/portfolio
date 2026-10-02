# Backend recheck and frontend integration — 2 October 2026

Rechecked `../portfolio-be`: the auth/content design is now implemented. **All 74 backend tests pass.** No backend source or live Firebase data was changed in this task. The contract is `../portfolio-be/docs/api/portfolio-content-api.md`.

Implemented APIs under `/api/v1`: `/auth/me`, blog/tool list/detail, create/edit, soft archive/restore; Firebase token verification, Firestore role plus verified-email admin checks, visibility filtering, immutable slugs, HTML sanitization and CORS allowlist.

One existing backend script issue remains: `npm run dev` points to `.src//bin/www`. Use `npm start` (`node ./src/bin/www`) for local startup until that path is corrected. The review did not change the sibling repository.

## Frontend

| Route | Behavior |
| --- | --- |
| `#/login` | Email/Password and Google sign-in, password reset, email verification, account state, refresh access and sign-out |
| `#/admin` | Verified-admin blog/tool management: create/edit, visibility, archive confirmation and restore |
| `#/blogs` and `#/blogs/slug` | API list/detail, tags/search, sanitized HTML and optional cover image |
| `#/tools` | API metadata mapped to existing local utilities; unknown keys show unavailable |

Roles come from `/auth/me`; Firebase supplies ID tokens in Authorization headers. One forced token refresh follows a 401. No custom password/token storage or email allowlist exists. Session changes clear private content and stale requests are discarded. The backend remains the authorization authority.

Blog editing uses an HTML textarea and sanitized preview. Slugs cannot change during edit. Tool config is validated JSON metadata and does not execute code or override local utility controls. Public pages have loading/empty/error/retry states; production never falls back to sample content. Development design comparisons retain labelled mocks.

Supported tool keys: `json-formatter`, `url-encoder-decoder`, `word-counter`, `image-converter`, `powerfx-formatter`, `color-picker`.

The backend deliberately has no user-directory/role-edit API; administrator promotion stays in Firestore Console. Cover images can be set/replaced by HTTPS URL. Removing an existing cover is unsupported by the current API; the editor reports that limitation. A media-upload UI is not included.

## Real environment setup

1. Copy `.env.example` to `.env.local`. Set `VITE_API_BASE_URL` to the full backend prefix, e.g. `https://your-backend.example/api/v1`, then rebuild. Development defaults to `http://localhost:3000/api/v1`; production with no value shows a configuration error.
2. Set backend `CORS_ORIGINS` to exact frontend origins, including localhost/127.0.0.1 as appropriate. Origins contain no path.
3. Enable Firebase Email/Password and Google providers in `dtminh-dev`; authorize frontend domains. See [Firebase users](https://firebase.google.com/docs/auth/web/manage-users) and [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin).
4. Sign in once to create `users/{uid}` through `/auth/me`; set the intended administrator's `role` to `admin` in Firestore Console. Verify the email and select Refresh access.
5. Supply `dtminh-dev` service-account credentials only to the backend. Create content through Admin; no live content was seeded during verification.

## Checks

- Backend: 74/74 PASS.
- `check-content-contract.mjs`: API envelope/error/token handling, fixed registry, immutable slugs, editor JSON and cover-removal feedback PASS.
- `check-managed-content.mjs`: PASS using the **real backend controllers/middleware** and its in-memory Firestore helper. Firebase identity protocol uses fixtures; no real account or data changes. Covers login, admin/user denial, public/private blogs, HTML safety, blog/tool CRUD, archive/restore, logout and 320–1440px layouts. Requires Vite on 5173, a free local port 3000, sibling backend dependencies and existing temporary Playwright.
- A/B/C/Original, Mixed, production six-tool, Firebase and pure tool-logic checks PASS. Production browser checks use read-only API fixtures; build with `VITE_API_BASE_URL=http://localhost:3000/api/v1` for that suite.
- Build PASS. Independent review found no material session/privacy/HTML issue; cover-removal feedback was verified RED then GREEN.
- Visual inspection caught a CSS override hiding the admin Save button background; a browser assertion reproduced it and passes after the contrast fix. Verified-email and unverified-admin cases both pass.

New modules: `api.js`, `AuthProvider.jsx`, `LoginPage.jsx`, `AdminPage.jsx`, `ManagedContent.jsx`, `SafeHtml.jsx` in `src/site`. DOMPurify is recorded in Yarn for HTML sanitization. Live credentials, provider setup, deployed CORS and delivery are not verified by fixtures. Nothing deployed.
