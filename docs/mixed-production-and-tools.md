# Mixed production and browser tools — 2 October 2026

The user approved the Mixed design for production. `src/main.jsx` now mounts `src/site/App.jsx`; the site shares its content/components with the development design shell. The approved moon hero, eight-second/manual quotes, three layers expanding on scroll, source-reviewed projects and corrected employment dates are included.

## URLs and build

| Development URL | Page |
| --- | --- |
| `/portfolio/` | Approved portfolio |
| `/portfolio/#/blogs` | Sample blog list |
| `/portfolio/#/blogs/pwa` | Sample article |
| `/portfolio/#/tools` | Six working utilities |
| `/portfolio/design-preview/portfolio` | Development design comparison |
| `/portfolio/legacy-preview.html` | Development-only original portfolio |

Hash routing supports static GitHub Pages hosting, refresh and browser Back without server rewrite rules. Article outlines, skip links and Back to top scroll within the current page and keep its route. Blogs remain explicitly labelled unpublished samples until real content is supplied.

The production entry imports no legacy global CSS, Chakra provider or standalone background script. Original comparison uses `src/legacy-main.jsx`. Legacy source/dependencies remain available for that comparison. Only `index.html` is a build input, so neither preview HTML entry is emitted. Production includes the actual downloadable PDF; its text still needs the employment edits described in `cv-and-projects-update.md`.

Pages, additional utilities and Three.js load separately. The scene retains visibility pause, capped DPR, finite rendering, reduced motion, mobile static behavior and WebGL fallback. No new application dependency was added.

## Frontend or backend?

Implement all six tools **in the frontend**. Their current inputs and outputs are local; sending them to a server would add upload latency, operating cost and data handling without enabling a required feature. A backend can be introduced for saved/shared results, a remote content source, large batch conversion, or server-side formula validation when those become requirements.

| Tool | Implementation and limits |
| --- | --- |
| JSON Formatter | Native JSON parsing/formatting; rejects unsafe integers/nonfinite values and explains decimal precision |
| URL Encoder / Decoder | Native URL-component encoding/decoding; errors for malformed sequences |
| Word Counter | Live whitespace-separated word, Unicode code-point character and line counts |
| Image Converter | Local PNG/JPEG/WebP decoding and canvas encoding; proportional resize without enlargement, lossy quality, JPEG background, preview/download; 20 MiB input and 24 million decoded pixels; configured dimension range 1–8192. Static output, no animation/metadata preservation. Unsupported export MIME is rejected rather than downloading a mislabeled file. Object URLs are revoked; stale async results are discarded when settings/file change or the tool unmounts. |
| Power Fx Formatter | Conservative layout formatter for nested calls/records/tables, two separator locales, escaped strings/quoted identifiers and comments. No evaluation or semantic validation. Unmatched delimiters/literals, interpolated strings, >100,000 characters and >128 nesting levels produce an error. Original input remains available. |
| Color Picker | Native color input and editable 3/6-digit HEX, HEX/RGB/HSL output and copy. Optional EyeDropper when supported; native picker remains available. Opaque sRGB colors only. |

Power Fx separators depend on the author's language; the selected mode preserves existing separators rather than translating them. See [Microsoft Power Fx global support](https://learn.microsoft.com/en-us/power-platform/power-fx/global) and [expression grammar](https://learn.microsoft.com/en-us/power-platform/power-fx/expression-grammar). Canvas export supports PNG and may support JPEG/WebP; checking the actual blob MIME prevents browser fallback from mislabeling output. See [MDN toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob).

## Verification

Run with the dev server active:

```powershell
node scripts/check-tool-logic.mjs
node scripts/check-preview.mjs
node scripts/check-mixed-preview.mjs
node scripts/check-production.mjs
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173
$env:SITE_URL = 'http://127.0.0.1:4173/portfolio/'
node scripts/check-production.mjs
```

Browser checks use the existing ignored `.tmp/tooling` Playwright installation and Microsoft Edge. They cover production routes, refresh/Back, route-preserving article/skip/footer links, PDF, six tools at 320/390/768/1440 widths, conversion MIME/dimensions, invalid files, stale results and encoder fallback. Existing suites cover A/B/C, Original, Mixed quote controls, actual rendered scroll layers, reduced motion and WebGL failure. Unit checks cover formatter literals/comments/locales/idempotence/nesting and color conversion.

Independent review reproduced the hash-anchor collision; a failing browser regression was added before fixing it. The production page-title preview suffix was also removed. Build and tests are local verification, not deployment or real-device GPU measurements.

Final results: all four check scripts PASS, including production checks against the built site on port 4173. `npm.cmd run build` exits 0 without the prior Chakra/chunk-size warnings. Emitted assets include the 133.93 kB CV, a 178.03 kB main JS entry, separate Pages/AdditionalTools modules and a 424.58 kB lazy ThreeScene module (sizes before gzip). Both development HTML entries and legacy background/UI bundles are absent. `git diff --check` passes. Desktop hero and Image Converter screenshots were visually inspected; viewport emulation is not a real-device test.
