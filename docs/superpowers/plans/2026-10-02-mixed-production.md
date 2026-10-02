# Mixed portfolio and browser tools implementation plan

Goal: promote the approved Mixed design and provide six working browser utilities.

Design: keep the approved moon, quotes, scroll layers and source-reviewed CV content. Share portfolio components between production and the development design shell; preserve Original in a dev-only legacy entry. Use hash routes (`#/blogs`, `#/blogs/slug`, `#/tools`) so GitHub Pages supports refresh and Back without server rewrites. Blogs remain labelled sample drafts. No backend or application dependency is needed for utilities.

## Task 1 — Production promotion

- [x] Write and run a browser check proving Mixed is missing at the production entry.
- [x] Move shared components to `src/site`, export Portfolio, keep preview controls separate, replace production mount and remove the legacy background script from production HTML.
- [x] Add hash page routing, shared navigation, page titles, metadata and a personal SVG favicon. Preserve original comparison in `legacy-preview.html`.
- [x] Verify production navigation, refresh, Back, PDF, canvas and responsive layout.

## Task 2 — Three additional tools

- [x] Write and run formatter/color unit checks before implementation.
- [x] Add Image Converter: local PNG/JPEG/WebP raster input, max 20 MiB and 24 million pixels; proportional resizing up to original dimensions; quality, JPEG background, preview, download and decode/encoder errors. Revoke object URLs and discard stale async results. Reject animated GIF/SVG input explicitly by accepted formats.
- [x] Add Power Fx Formatter: layout only, two separator locales, preserve token spelling, strings, quoted identifiers and comments; reject unmatched delimiters/literals and interpolated strings with an explanatory error. No evaluation or semantic validation.
- [x] Add Color Picker: native picker, editable HEX, HEX/RGB/HSL, copy and optional EyeDropper with fallback.
- [x] Verify invalid inputs, switching while converting, MIME and resized dimensions, output reset and clipboard fallback.

## Task 3 — Verification and documentation

- [x] Run unit checks, A/B/C regression, Mixed regression and production browser checks against the built output.
- [x] Review changes independently and address material findings.
- [x] Update architecture/audit docs and report build evidence and remaining limitations. Do not deploy.

Review focus: Power Fx locale-sensitive decimals and comments; unsupported interpolated strings; stale conversion results on file/settings change; encoding fallback MIME; deep links on static hosting. Existing uncommitted user work stays in this workspace. No commits or deployment are required for this request.

Verification: all four check scripts pass; production checks also pass against the built static site. Build exits 0. Independent review found the local-anchor route collision; regression failed before fix and passed afterward. Formatter nesting rejection likewise verified RED then GREEN. No commit/deploy.
