# Additional browser tools

Follow-up: [HTML Preview / Email Builder](./html-email-builder.md) is also implemented. The catalog now includes eight new utility payloads; the original seven are described below.

Seven utilities are implemented in the existing theme. Utility inputs are processed locally and are not saved to backend records. Only the tool catalog, visibility and descriptions come from the API. The searchable, scrollable picker supports the expanded catalog. New utility code and parser dependencies are lazy-loaded.

| Tool | Backend `component` key | Behavior |
| --- | --- | --- |
| Markdown Editor | `markdown-editor` | Live sanitized preview, tables, fenced code, copy and `.md` download |
| Password / UUID Generator | `password-uuid-generator` | 8–128 character passwords with selected character groups; 1–100 UUID v4 values |
| Lorem Ipsum Generator | `lorem-ipsum-generator` | Exact word count or placeholder paragraphs |
| UNIX Timestamp Converter | `unix-timestamp-converter` | Explicit seconds/milliseconds; ISO dates with timezone; UTC/local output |
| Hash Generator | `hash-generator` | SHA-1/256/384/512 over exact UTF-8 text using Web Crypto |
| JWT Encode / Decode | `jwt-encoder-decoder` | Decode header/payload; encode HS256 or explicitly unsigned tokens |
| Cron Expression Parser | `cron-parser` | Standard five-field expressions, IANA timezone, next five runs including DST |

Markdown uses [Marked](https://marked.js.org/) and existing DOMPurify with an explicit tag/attribute allowlist. Scripts, event handlers and images are removed; remote preview images are not fetched. Preview is limited to 50,000 characters. Cron scheduling uses [cron-parser](https://github.com/harrisiirak/cron-parser), including day-of-month/day-of-week OR semantics. Hashed H expressions and six-field schedules are excluded from this UI.

Passwords use cryptographic randomness with rejection sampling, include every selected group, and are shuffled. UUIDs use native `crypto.randomUUID`. JWT secrets stay in component memory and clear when the signing mode changes or the tool unmounts. Decoding does not verify a signature or grant access. HS256 is the signing algorithm; unsigned tokens explicitly use `alg: none` and an empty signature. JWTs are not encryption. SHA-1 is provided for compatibility; default hashing is SHA-256.

Output is invalidated when inputs change. Async operations use a generation counter so stale hash/signing results cannot replace a newer result. Malformed input is reported in the workspace.

## Catalog and publication

The backend already accepts stable component keys as tool metadata, so no API schema change is required. The frontend registry and admin component selector now include all seven keys. [new-tools-catalog.json](./new-tools-catalog.json) contains ready-to-use POST `/api/v1/tools` payloads, defaulting to private for admin review. Create records via the existing admin editor, then choose public, limited or private visibility. Existing permission rules apply unchanged. The frontend does not fall back to hardcoded production records if the API is unavailable.

Local mock/design previews include the new catalog automatically. Production requires these API records; none were created in a live backend. No deployment was performed.

## Verification

`node scripts/check-developer-tools.mjs` checks generator constraints, exact lorem counts, date validation, hash vectors, JWT Unicode/HMAC/malformed input and timezone-aware cron behavior. `node scripts/check-developer-tools-ui.mjs` runs against the built root preview at port 4177 (override `SITE_URL`) with mocked catalog data. It checks all seven workflows, safe Markdown, `.md` contents, input/output reset, search and five viewport widths. Existing content-contract, visibility, Power Fx/color and Hosting checks pass. Firebase production build succeeds with a separate developer-tools chunk.
