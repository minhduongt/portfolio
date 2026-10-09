# Language Enhancer

The writing tool uses the existing authenticated backend endpoint
`POST /api/v1/language-enhancer`. The browser sends a Firebase ID token through
`requestApi`; it never receives a Gemini API key. The backend contract is in
`../portfolio-be/docs/api/language-enhancer-api.md`.

Sentence mode returns 3–5 rewrites with explanations and usage contexts. Vocabulary
mode returns meaning, part of speech, synonyms, antonyms, examples and usage notes.
Writing and explanation languages can independently be English or Vietnamese.
Writing defaults to English; explanation defaults to the current interface language.
Changing writing language can translate the input. Sentence tone can be natural,
professional, casual or academic; keyword requests omit tone.

Guests see the catalogue entry and sign-in prompt. Signed-in users can submit
2,000 characters in sentence mode, 100 in vocabulary mode, and an optional context
of up to 500 characters. Text and context go to Google Gemini; they are not saved
by this tool. Responses render as plain text, with copy controls. Invalid structured
responses are rejected. Cancelling preserves input and ignores late responses;
429 errors disable submission until the backend's Retry-After interval expires.

## Catalogue and release

The `dtminh-dev` Firestore catalogue now contains the active members-only
`language-enhancer` entry defined in [language-enhancer-tool.json](language-enhancer-tool.json).
Existing catalogue entries were preserved. The backend knowledge snapshot was
regenerated with the 15 registered components; public knowledge still filters
out tools that are not public.

Deploy the updated frontend to render this component. The production endpoint is
already live: an unauthenticated POST returned `401 UNAUTHORIZED` with the correct
portfolio CORS origin. The public catalogue returns the new entry with
`visibility: limited`, `locked: true`, and no executable component field.
These checks did not call Gemini or consume inference quota; live signed-in
generation still depends on the backend's Gemini configuration. No new browser
environment variable or dependency is required.
For another Firebase project, create a tool in Admin using the supplied metadata
and `Members` visibility; never publish it as a public utility.

## Verification

- `node scripts/check-language-enhancer.mjs`: input limits and response schemas.
- `node scripts/check-language-enhancer-ui.mjs`: mocked authentication and inference,
  both modes, guest access, safe output, preserved drafts, Vietnamese, four viewport
  widths, cancellation, invalid output, availability errors and Retry-After.
- `node scripts/check-content-contract.mjs`, `node scripts/check-i18n.mjs` and
  `npm.cmd run build`: existing integration and production bundle checks.
- Backend `npm.cmd test`: endpoint, structured provider responses, authentication,
  quota, concurrency, cancellation and existing API tests.

Browser fixtures use `SITE_URL` or default to
`http://127.0.0.1:4177/portfolio/`; they do not call live Gemini inference.
