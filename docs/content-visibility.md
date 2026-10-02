# Blog and tool visibility

Both content types support the same three stored `visibility` values:

| Value | Who can read active content |
| --- | --- |
| `public` | Everyone, including guests |
| `limited` | Any user with a valid Firebase ID token, including admins |
| `private` | Verified-email admins with a current backend admin profile |

Visibility is enforced by the backend on collection lists and direct slug reads. Login-only access is derived from the verified token, never request body/query parameters. Invalid supplied tokens return 401. Inaccessible details return 404 without revealing whether a restricted record exists. Ordinary signed-in users do not need verified email to read limited content; verified email remains required for administrator permissions. Archived content stays hidden from non-admins.

The admin editor provides all three visibility choices for creation and updates. Public/private records retain their previous meaning and need no migration. To make a record available after login, change its visibility to `limited`. The frontend displays visibility badges, a guest sign-in prompt, and reader access guidance. Logout clears previously fetched restricted content through the existing owner-bound request state.

Backend files updated: `src/services/contentValidation.js`, `src/services/contentService.js`, `src/controllers/contentController.js` in `portfolio-be`. Reads pass `isAuthenticated` derived from the verified request identity. No role or write permissions were broadened.

Verified: the existing backend suite passes 74/74; `scripts/check-content-permissions.mjs` checks both resources through actual backend routes/controllers with a fake Firestore and test identities. It covers anonymous/reader/unverified-admin/verified-admin lists and direct reads, archive restrictions, invalid tokens, spoofed query parameters, limited creation/update and reader write rejection. `scripts/check-visibility-ui.mjs` verifies guest, reader and admin browser states, logout cleanup and saving limited content for blogs/tools with mocked identity/API responses. No live records or accounts were changed.

Deploy the backend before deploying the frontend. The previous backend rejects `limited` writes and does not return limited records to readers. These changes are local and have not been deployed.
