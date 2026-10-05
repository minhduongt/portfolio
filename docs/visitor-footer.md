# Visitor tracking and footer counters

The updated backend exposes public `POST /api/v1/visitors/heartbeat` and `GET /api/v1/visitors/stats`. Its transaction counts a browser session once, or again after 30 minutes without a heartbeat. Active visitors are IDs seen within two minutes. Total visits means sessions, not page views or unique people.

`VisitorProvider` mounts once around the app, independently of the route and authentication state. It stores a generated UUID in `portfolio.visitorId` in localStorage, validates existing IDs and falls back to an in-memory ID when storage is blocked. Valid IDs are reused across tabs and reloads. Without persistent storage, reloads cannot be deduplicated. The server remains responsible for session deduplication.

Visible pages send an immediate heartbeat followed by a stats read, then repeat every 60 seconds. Hidden pages stop the timer and abort in-flight requests. Becoming visible refreshes immediately. Requests use no-store caching and a 12-second timeout; overlapping polls are prevented and timers/listeners are cleaned up on teardown. Requests contain no auth token, email, account ID or tool input. Design previews do not track activity.

Heartbeat requests now also send `referrer` (the HTTP(S) origin from `document.referrer`, or an empty string for direct traffic) and `landingPage` (the initial pathname). Queries and fragments are excluded before sending. These values remain stable during client-side navigation and repeat heartbeats; the backend only persists attribution when a new visit session is counted. IP and device/browser/OS classification are captured by the backend, not supplied by the frontend.

## Admin visitor analytics

Verified administrators can open **Admin → Visitors**. The tab reads `GET /api/v1/visitors/analytics` and `GET /api/v1/visitors/visits` with the existing Firebase Bearer token and no-store caching. Visitors and signed-in non-admin users never render the dashboard or request these private endpoints. Switching tabs, signing out or changing dates cancels pending requests and removes the previous view.

The dashboard shows active visitors, lifetime sessions, sessions within the date range and distinct browser IDs within that range. A daily traffic chart and referring-site, landing-page, device, browser and OS breakdowns use native SVG and CSS; exact daily counts are available in an expandable table. Date inputs and 7/30/90-day shortcuts use the backend's inclusive UTC dates and enforce its maximum 90-day range. Charts and the table load independently, so an analytics range-limit error does not prevent the visit list from loading.

The newest-first session table shows UTC timestamps, IP, referring site, landing page, approximate device/browser/OS and browser UUID. It offers 25/50/100 rows per page and Previous/Next controls. Cursor history allows backwards navigation, dates stay fixed while paging, and changing the date range, row limit or refreshing resets pagination. Missing metadata shows a dash. Empty data, rejected access, invalid responses and server/network errors have explicit states and retry controls. Backend authorization remains authoritative.

`node scripts/check-visitor-analytics.mjs` verifies attribution, token-bearing admin reads, guest/reader exclusion, fixed-date cursor pagination, row limits, date validation, range-limit errors, denied access, empty data, mobile sizing and sign-out cleanup using mocked Firebase and API responses. Existing footer and blog/tool management checks also pass. Tests do not send production heartbeats or read real visitor IPs.

The shared footer shows Active now and Total visits, including on Login and Admin. Loading/unavailable states show dashes rather than fabricated zeroes. Refresh failures preserve the last counts with a Last known counts label; successful requests restore the live appearance. A heartbeat failure does not prevent displaying successfully fetched aggregate counts.

The integration follows the updated backend source and `portfolio-be/docs/api/visitor-tracking-api.md`, including admin authentication, response shapes, UTC date limits and cursor pagination. Backend code was not changed for this integration. Earlier read-only verification of the public stats endpoint confirmed HTTP 200, the Hosting origin in `Access-Control-Allow-Origin` and `Cache-Control: no-store`; the new dashboard verification uses mocks rather than real visitor data.

Frontend verification: build, content contract and Hosting checks pass. `node scripts/check-visitor-footer.mjs` checks immediate and 60-second polling, shared ID reuse, hidden-tab pause/resume, stale/recovery UI, mobile width, invalid stored IDs, blocked storage and real zero values using mocked endpoints. Existing browser regression scripts now mock visitor endpoints too, preventing test visits from inflating production counts.

The frontend changes are local and need deployment to appear on Firebase Hosting. No backend changes were required for this integration.

## Deployment diagnosis (2026-10-05)

Read-only checks against `https://portfolio-be-minhdt.vercel.app/api/v1` confirmed that `/visitors/stats` returns JSON with HTTP 200, while `/visitors/analytics` and `/visitors/visits` return HTML `Cannot GET` responses with HTTP 404. The local backend registers both admin routes, and all 16 focused analytics route/service tests pass, including authentication and role checks. The deployed API does not expose the routes present in the local source. Deploy the latest `portfolio-be` source to the Vercel project serving this domain, including the currently uncommitted analytics routes, controller/service changes and new `visitorMetadata.js` module. A registered admin endpoint should return JSON HTTP 401 without authentication; an authenticated administrator should receive JSON HTTP 200.

The frontend now preserves HTTP status when an error response is HTML. Missing endpoints show their path and a backend deployment hint; server failures show their HTTP status. Successful HTTP responses containing invalid JSON retain the response-format warning. Contract and mocked browser checks cover the missing-route behavior for both dashboard requests. These changes do not deploy either application.
