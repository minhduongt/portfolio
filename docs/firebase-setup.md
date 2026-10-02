# Firebase project — dtminh-dev

## Hosting deployment — 2026-10-02

Follow-up: the API URL was subsequently supplied in `.env`, corrected to HTTPS and deployed. The backend currently returns `FUNCTION_INVOCATION_FAILED`; see [API connectivity diagnosis](./api-connectivity-diagnosis.md). The missing-URL state described in the initial release below is historical.

The portfolio is deployed at [dtminh-dev.web.app](https://dtminh-dev.web.app). Hosting version `d22a7743e6af59ad` was released at 09:57 UTC. Only Firebase Hosting was deployed; the Express backend remains a separate service.

Root `.firebaserc` selects `dtminh-dev`. `firebase.json` publishes `build/`, rewrites client routes to `index.html`, revalidates HTML and caches hashed `/assets/` files. The Firebase Vite mode uses `/` as its asset base; the standard GitHub Pages build continues to use `/portfolio/`.

Deploy again from the repository root:

```powershell
npm.cmd run deploy:firebase
```

The production backend URL was unavailable for this release. Blogs and Tools display an explicit configuration error, and authenticated admin profiles cannot load until that service is connected. Before the next deployment, add its actual API URL to the ignored `.env.firebase.local`:

```dotenv
VITE_API_BASE_URL=https://YOUR-BACKEND-HOST/api/v1
```

Configure backend `CORS_ORIGINS` to allow `https://dtminh-dev.web.app` (and `https://dtminh-dev.firebaseapp.com` if used). Configure Firebase Auth providers and authorized domains as described in [backend integration](./backend-integration.md). Vite embeds the API URL at build time, so redeploy after changing it.

Verification: Firebase release completed successfully; live HTML matched the local release build. Browser checks passed for loaded assets, manual quote changes, the 3D canvas, the downloadable PDF, login refresh, mobile width, anonymous admin protection and the explicit missing-API state. These checks did not submit credentials or modify backend content. `node scripts/check-hosting.mjs` checks root assets and prevents publishing localhost API URLs.

## Earlier Firebase SDK setup

Follow-up: Firebase Auth is now used by the login/account pages; `/auth/me` supplies the backend profile/role. Configure providers, authorized domains, API URL and CORS as described in [backend integration](./backend-integration.md). The initial Analytics-only setup below is retained as history.

The app now initializes the user-provided Firebase web app through `src/firebase.js`. It exports `firebaseApp` for future Firebase services and `initializeAnalytics()` for optional browser Analytics. The Firebase SDK is installed through Yarn and recorded in `yarn.lock`.

Production initializes Analytics once, after a lazy import and Firebase's browser support check. Unsupported browsers or initialization failures do not prevent the portfolio from rendering. Development and design previews do not initialize Analytics. The setup follows [Firebase web initialization](https://firebase.google.com/docs/web/setup) and the [Analytics support API](https://firebase.google.com/docs/reference/js/analytics#issupported).

This connects the client app to project `dtminh-dev`, app ID `1:530923894025:web:75613a2e2301b921c84fd8` and measurement ID `G-9RFSNEZEWY`. It does not create collections, change security rules or enable authentication/storage workflows. Blogs remain local samples and tools remain local browser utilities; their input is not logged.

At the time of the initial SDK setup, only the GitHub Pages deployment existed. The Hosting deployment above now provides a dedicated build with root asset paths.

Checks:

```powershell
node scripts/check-firebase.mjs
npm.cmd run build
```

The local configuration check verifies the project identifiers and safe non-browser initialization. A build verifies SDK imports and code splitting. These checks do not prove that production Analytics events have arrived in the Firebase console.

Verified: Firebase configuration check, tool logic checks, production build and production browser regression all PASS. The installed SDK is Firebase 12.19.0. Yarn used the repository's existing lockfile, restoring locked Vite 4.1.1 locally; no Vite dependency declaration was changed. Yarn reported existing Chakra icon/system peer warnings. Analytics is emitted in a separate lazy chunk.
