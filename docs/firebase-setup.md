# Firebase project — dtminh-dev

Follow-up: Firebase Auth is now used by the login/account pages; `/auth/me` supplies the backend profile/role. Configure providers, authorized domains, API URL and CORS as described in [backend integration](./backend-integration.md). The initial Analytics-only setup below is retained as history.

The app now initializes the user-provided Firebase web app through `src/firebase.js`. It exports `firebaseApp` for future Firebase services and `initializeAnalytics()` for optional browser Analytics. The Firebase SDK is installed through Yarn and recorded in `yarn.lock`.

Production initializes Analytics once, after a lazy import and Firebase's browser support check. Unsupported browsers or initialization failures do not prevent the portfolio from rendering. Development and design previews do not initialize Analytics. The setup follows [Firebase web initialization](https://firebase.google.com/docs/web/setup) and the [Analytics support API](https://firebase.google.com/docs/reference/js/analytics#issupported).

This connects the client app to project `dtminh-dev`, app ID `1:530923894025:web:75613a2e2301b921c84fd8` and measurement ID `G-9RFSNEZEWY`. It does not create collections, change security rules or enable authentication/storage workflows. Blogs remain local samples and tools remain local browser utilities; their input is not logged.

The existing GitHub Pages deployment and `/portfolio/` base remain unchanged. No Firebase Hosting deployment has been performed. If Hosting is selected, its static-root asset paths need a dedicated build base rather than publishing the GitHub Pages build unchanged.

Checks:

```powershell
node scripts/check-firebase.mjs
npm.cmd run build
```

The local configuration check verifies the project identifiers and safe non-browser initialization. A build verifies SDK imports and code splitting. These checks do not prove that production Analytics events have arrived in the Firebase console.

Verified: Firebase configuration check, tool logic checks, production build and production browser regression all PASS. The installed SDK is Firebase 12.19.0. Yarn used the repository's existing lockfile, restoring locked Vite 4.1.1 locally; no Vite dependency declaration was changed. Yarn reported existing Chakra icon/system peer warnings. Analytics is emitted in a separate lazy chunk.
