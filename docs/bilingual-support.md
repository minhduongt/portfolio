# English and Vietnamese support

English is the default on a first visit, regardless of browser language. The navigation's EN/VI buttons switch the current page immediately and save an explicit preference under `portfolio.language`. Saved Vietnamese is applied before the initial loading screen renders. If storage is blocked, switching still works for the current visit.

## Architecture and files

The existing React/Vite application uses a small language Context, alongside its existing theme and authentication providers. No dependency or routing migration was needed.

- `src/i18n/LanguageProvider.jsx`: language state, persistence, `html.lang`, locale and translation access.
- `src/i18n/translation.js`: English fallback, nested keys, interpolation, and localization of formatted service errors.
- `src/i18n/resources.js`: local JSON catalog loading.
- `src/i18n/LanguageSwitcher.jsx`: keyboard-accessible EN/VI controls with pressed state and explicit language labels.
- `src/i18n/formValidation.js`: translated native validation messages while retaining browser focus and constraints.
- `src/i18n/locales/{en,vi}/{common,portfolio,tools,account}.json`: curated UI and portfolio copy.
- `src/main.jsx`, `src/preview/main.jsx`, and `index.html`: provider integration and initial saved-language handling.
- `src/site/App.jsx`, navigation, theme/loading components and `site.css`: translated metadata, shared controls and responsive styling.
- Portfolio, project preview, layer explanation and quote components: translated descriptive content and all 50 existing quotes.
- Pages, managed blog content and blog metadata: translated navigation, filters, dates, status and empty states.
- Contact, login, admin, rich text editor and visitor components: translated forms, validation, notifications, analytics labels and dates.
- Tool components and email template/design helpers: translated labels, feedback, starter content and locale-aware generated dates.

Catalogs use source-English keys for existing messages and nested keys for metadata. Components call `t(key, values)`. Missing Vietnamese entries fall back to English; unknown remote messages remain readable. Tests reject catalog drift, inconsistent duplicates, blank entries and mismatched interpolation placeholders. To add UI copy, add matching entries to the appropriate English and Vietnamese catalogs and translate at rendering time. Store message keys in state rather than translated notifications.

## Writing decisions

Vietnamese is written for developers and recruiters: “Giới thiệu”, “Xem dự án”, “Tải CV”, “Bài toán”, and “Công nghệ” replace literal English constructions. The hero reads “Giao diện chỉn chu. Phần mềm thiết thực.” Descriptions focus on the work actually performed, without adding achievements or claims. Familiar terms such as Frontend, Fullstack, API, React, Power Platform and .NET remain recognizable.

Project/company names, CV facts, email addresses, code, executable identifiers and URLs retain their original values. Authored blog titles, body content and tags are preserved. Built-in tool samples and email starter text use the selected language when created; subsequent switching preserves entered text, output, drafts, selected tools, authentication and active Three.js nodes. An email document retains the language of the draft that created it.

## Verification

- `node scripts/check-i18n.mjs`: defaults, invalid/blocked preferences, fallback, nesting, interpolation, service errors, catalog parity and duplicates.
- `node scripts/check-portfolio-locales.mjs`: existing portfolio prose, all quotes and current-role detection.
- `node scripts/check-bilingual-ui.mjs`: keyboard switching, persistence, metadata, authored posts, form/tool/email state, validation, preview, blocked storage and widths of 320/390/768/1440px.
- Existing content contract, blog date, tool logic, developer tool, email design and browser workflow checks.
- `npm.cmd run build` and `git diff --check`.

Browser checks use local fixtures and mock visitor tracking. They do not submit live messages or modify production content.

## Limits

This remains a client-rendered SPA with shared URLs. Page titles, descriptions, Open Graph metadata and document language update in the browser; crawlers that do not execute JavaScript receive the default English metadata. Separate indexed language URLs and prerendered metadata would require a future routing/rendering change.

Authored API content, arbitrary server error text, external project previews and the downloadable CV are not automatically translated. The API currently provides a creation timestamp rather than a publication timestamp, so blog cards accurately label it “Created” / “Tạo ngày”. Development-only design-study notes and legacy pages outside the current app are outside the localized production interface.
