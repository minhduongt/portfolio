# Z Agent frontend implementation plan

**Goal:** Integrate the existing backend Z Agent into the bilingual portfolio.

**Architecture:** Use the existing public `/agent` and `/agent/chat` endpoints. Keep a lazy chat panel mounted across route changes, memory-only exchanges, and a small React action bridge to existing portfolio previews and public utilities. Validate every suggestion locally and require a click before executing it.

**Tech stack:** React 18, Vite, existing LanguageProvider and requestApi. No browser AI SDK or new dependency.

**Spec:** User's attached Gemini portfolio brief and `../portfolio-be/docs/api/z-agent-api.md`.

## Constraints and review focus

- English default; native professional Vietnamese UI; model replies rendered as text.
- No secrets, authentication identifiers, private articles or tool input sent to AI.
- Bound history to five completed pairs and 12,000 total characters including the current question.
- Treat arbitrary actions, stale tools, unavailable routes and extra fields as invalid.
- Cancel requests on close/reset; prevent duplicate submits; preserve drafts and completed exchanges on minimize/navigation.
- Respect keyboard focus, mobile keyboard/safe areas, light/dark themes and reduced motion.

## Tasks

- [x] Write and run failing pure tests for action validation and bounded history; implement `src/site/agent/protocol.js`.
- [x] Add `AgentBridge.jsx`, existing page registrations and router integration. Use real local project IDs and loaded public tools; fetch public blog records before navigating.
- [x] Add lazy `AgentWidget.jsx` / `AgentPanel.jsx`, localized UI and scoped CSS, using the existing API envelope and server deadlines.
- [x] Add fixture browser verification for follow-ups, navigation, project/tool actions, language switching, errors, hostile output/actions, cancellation and mobile layout.
- [x] Run catalog checks, build and relevant existing tests; inspect the backend knowledge snapshot for current source parity; document configuration and remaining live-provider verification.

Review corrections: cancellation now covers pending actions as well as chats; close the native dialog before section focus/project preview; preserve section hashes in cross-page routing. Browser regression checks cover all three. Backend knowledge now includes shared education and public control descriptions; its 159 tests pass. Existing management UI verification needed to wait for the post-save list reload before asserting visibility.

Execution: proceed inline within the user's requested scope; preserve all existing workspace work. No commit or deployment requested.
