# Language Enhancer integration

**Goal:** Add a bilingual authenticated AI writing and vocabulary tool using the existing backend.
**Contract:** `../portfolio-be/docs/api/language-enhancer-api.md`.
**Architecture:** Dedicated lazy tool component; existing Firebase session and requestApi; plain-text structured results. No browser Gemini SDK, provider key or new dependency.

- [x] Test input/result validation against both backend modes, limits and malformed responses.
- [x] Register the local tool, component mapping, lazy renderer and admin selection; enforce member access even if catalogue metadata is misconfigured.
- [x] Build bilingual sentence/keyword forms, language/tone/context controls, copyable results, privacy notice, cancellation and quota handling.
- [x] Run fixture browser tests for authentication, mode payloads, response safety, empty vocabulary lists, drafts, cancellation, errors and mobile layouts.
- [x] Check catalogue availability, synchronize backend knowledge, document registration/deployment and run build plus required regressions.

Keep the tool's configured catalogue visibility limited. Public agent knowledge must not advertise member-only access. Preserve all other workspace changes. Use mocked inference in automated tests.
