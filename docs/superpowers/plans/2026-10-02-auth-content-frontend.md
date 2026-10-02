# Auth and managed-content frontend implementation

User request: inspect portfolio-be, add login and admin management, and load/manage blogs and tool definitions. Rechecked backend implements this contract; 74 backend tests pass. Backend source is read-only for this task.

## Design

Firebase client email/password and Google login; API verifies ID tokens. Profile and role come from GET /auth/me. Admin UI requires role admin and verified email; backend remains the authorization authority. No user-list or role-edit UI because the backend deliberately has no such endpoints. Default users are promoted through Firestore Console.

Production Blogs/Tools fetch API content, with loading, retry, empty, missing and error states. Development design previews retain labelled samples. Safe fixed tool component keys map server metadata to existing local implementations; unknown keys show unavailable. Tool config is edited as JSON but not executed or passed into utilities until there is a supported schema.

Admin can create/edit content, change public/private visibility, soft archive and restore. Slugs are immutable on edits. Blog editor accepts HTML and offers a sanitized preview; public HTML is also sanitized. Auth and content requests are invalidated on session changes; private content is cleared on sign-out. Passwords/tokens stay with Firebase and are never saved by custom frontend storage.

API base: VITE_API_BASE_URL including /api/v1. Local default is http://localhost:3000/api/v1; production reports missing configuration rather than calling localhost. No credential-backed writes or deployment are performed in verification.

## Tasks

- [x] Contract tests: response envelopes/errors, bearer tokens, no password logging, immutable slug payloads, tool registry and JSON validation.
- [x] API module, Firebase Auth provider, login/password reset/verification/sign-out and guarded admin route.
- [x] Blog/tool list/detail reads and safe HTML rendering; retain design samples only in preview.
- [x] Admin blog/tool editors and archive/restore with pending/error/success states.
- [x] Browser tests with API/Firebase protocol fixtures, build, existing utility/preview regressions, independent review and updated docs.

Review focus: logout during pending private fetch; profile retry and role revocation; HTML safety; duplicate submissions; archived/private visibility; expired tokens; unknown component keys. Fixtures test integration behavior, not real Firebase provider/domain setup or a deployed backend.

Completed: backend 74/74, contract/Firebase/tool logic, managed-content browser integration, all preview regressions and built production checks PASS. Independent review passed; cover-clearing feedback fixed with RED/GREEN regression. Live API URL/provider configuration remains an environment setup step documented in docs/backend-integration.md. No backend writes or deployment.
