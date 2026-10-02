# API connectivity diagnosis — 2026-10-02

Two independent failures were reproduced:

1. The deployed frontend requested `http://portfolio-be-minhdt.vercel.app/api/v1/blogs` from HTTPS Firebase Hosting. The frontend configuration has been corrected to `https://portfolio-be-minhdt.vercel.app/api/v1` to remove mixed-content blocking. Vite embeds this value during the build; editing `.env` alone does not update an existing deployment.
2. HTTPS requests to `/blogs`, `/tools` and an OPTIONS preflight returned HTTP 500. The response header `x-vercel-error: FUNCTION_INVOCATION_FAILED` identifies a failing Vercel function. These responses lack CORS headers; this does not yet establish that the Express CORS allowlist is wrong, because the function is failing before normal responses can be served.

The exact backend exception requires Vercel function logs. In `portfolio-be/src/config/firebaseConfig.js`, initialization explicitly throws if `FIREBASE_SERVICE_ACCOUNT_JSON` is missing, invalid JSON, or belongs to a project other than `dtminh-dev`. Check this server-side environment variable in the Vercel Production environment and inspect function logs before changing backend code. Never put this service-account value in a frontend `VITE_*` variable or commit it.

The backend also needs `CORS_ORIGINS` to include `https://dtminh-dev.web.app` and, if used, `https://dtminh-dev.firebaseapp.com`. After resolving the logged startup error, redeploy the backend and verify GET `/api/v1/blogs`, GET `/api/v1/tools`, and OPTIONS `/api/v1/auth/me` from the Hosting origin. GET endpoints should return the normal JSON envelope; preflight should allow the origin and Authorization header.

No backend credentials were read and no backend records were modified during diagnosis. The current workspace does not provide authenticated Vercel access, so the server-side environment and logs could not be checked here.

The corrected frontend was built and deployed to Firebase Hosting. Live browser verification confirmed that Blogs requests HTTPS and no longer sends HTTP API requests. The remaining content error is caused by the backend failure above. Hosting checks and content-contract checks passed.
