# Contact form and navigation grouping

Follow-up: login-only content is now a separate `limited` visibility level. See [content visibility](./content-visibility.md) for the new backend-enforced three-level policy. The access policy described below reflects the earlier two-level implementation.

Portfolio section links (About, Work, Experience, Contact) are grouped separately from Blogs, Tools and account access. Desktop uses a divider; mobile uses Portfolio/Explore labels and a scrollable menu for short screens.

Signed-in readers now see “You have limited access to blogs and tools” and direct links to both. A failed profile lookup displays an access-unavailable message rather than incorrectly asserting the user's role. Existing backend rules already restrict readers to active public content and keep private content and management protected; no permission changes were made.

The portfolio contact section now contains a name, email, optional phone and message form. It calls the existing public `POST /api/v1/send-email` endpoint without an authentication token. The form validates inputs, prevents repeat submissions while pending, retains values on failure and clears them after success. A direct-email link remains available.

In `portfolio-be`, email/storage failures now propagate to the controller instead of being logged and hidden. Email HTML escapes visitor text. Both repositories need deployment before the production form can use this corrected behavior. The backend needs working Firestore access, `FROM_USER`, `USER_PASSWORD` for its Gmail transport, and a CORS allowlist containing the frontend origin. No live email was sent during testing.

Validation: backend 74/74 tests; isolated service checks for failed delivery/storage and HTML escaping; mocked browser contact submit/failure/retry/reset checks across six widths; navbar and login browser checks; Firebase build and hosting checks. Browser scripts: `scripts/check-contact-ui.mjs`, `scripts/check-contact-backend.mjs`, `scripts/check-navigation-motion.mjs`, `scripts/check-login-ui.mjs`.
