# Visitor tracking and footer counters

The updated backend exposes public `POST /api/v1/visitors/heartbeat` and `GET /api/v1/visitors/stats`. Its transaction counts a browser session once, or again after 30 minutes without a heartbeat. Active visitors are IDs seen within two minutes. Total visits means sessions, not page views or unique people.

`VisitorProvider` mounts once around the app, independently of the route and authentication state. It stores a generated UUID in `portfolio.visitorId` in localStorage, validates existing IDs and falls back to an in-memory ID when storage is blocked. Valid IDs are reused across tabs and reloads. Without persistent storage, reloads cannot be deduplicated. The server remains responsible for session deduplication.

Visible pages send an immediate heartbeat followed by a stats read, then repeat every 60 seconds. Hidden pages stop the timer and abort in-flight requests. Becoming visible refreshes immediately. Requests use no-store caching and a 12-second timeout; overlapping polls are prevented and timers/listeners are cleaned up on teardown. Requests contain no auth token, email, account ID or tool input. Design previews do not track activity.

The shared footer shows Active now and Total visits, including on Login and Admin. Loading/unavailable states show dashes rather than fabricated zeroes. Refresh failures preserve the last counts with a Last known counts label; successful requests restore the live appearance. A heartbeat failure does not prevent displaying successfully fetched aggregate counts.

Backend review: all 87 tests pass, including visitor transaction, session boundaries, activity aggregation and route validation. A read-only request to the deployed stats endpoint returned HTTP 200, the Hosting origin in `Access-Control-Allow-Origin`, `Cache-Control: no-store` and zero counts. No production heartbeat was sent as part of verification.

Frontend verification: build, content contract and Hosting checks pass. `node scripts/check-visitor-footer.mjs` checks immediate and 60-second polling, shared ID reuse, hidden-tab pause/resume, stale/recovery UI, mobile width, invalid stored IDs, blocked storage and real zero values using mocked endpoints. Existing browser regression scripts now mock visitor endpoints too, preventing test visits from inflating production counts.

The frontend changes are local and need deployment to appear on Firebase Hosting. No backend changes were required for this integration.
