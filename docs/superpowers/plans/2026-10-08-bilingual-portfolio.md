# Bilingual Portfolio Implementation Plan

**Goal:** Add professional English/Vietnamese UI and portfolio copy, keeping English as the first-visit default and preserving the existing design and functionality.

**Architecture:** A React language context loads curated local JSON catalogs for common, portfolio, tools and account UI. Source-English message keys allow gradual extraction without changing content IDs or API payloads. Semantic nested keys and interpolation are supported. Missing Vietnamese entries fall back to English. No additional dependencies or routing migration.

**Tech stack:** React 18, Vite 4, existing Context providers, localStorage, Intl and local UTF-8 JSON catalogs.

**Spec:** User attachment `Pasted text.txt`, plus the instruction to write Vietnamese for native developer/recruiter readers.

## Constraints

- Preserve official names, CV facts, user-authored blogs, tool input, Three.js resources and animations.
- English is the default regardless of browser language; restore only explicit saved preferences.
- Keep language changes on the current route without remounting tools or 3D scenes.
- Translate visible text, form feedback, accessibility labels, titles and metadata.
- Keep API and executable component identifiers unchanged.

## Tasks and verification

- [x] Implement translation lookup, fallback, interpolation, language persistence and context; test unknown/missing keys, unsupported preferences and blocked storage.
- [x] Add keyboard-accessible EN/VI navigation control; test desktop/mobile, reload and navigation persistence.
- [x] Curate portfolio, project, experience, skills and quote translations; preserve factual claims and current-role detection.
- [x] Localize tool UI, feedback and sample layout content; preserve entered data across language changes.
- [x] Localize contact, login, admin and visitor UI; preserve authentication and permissions.
- [x] Localize blog chrome/dates, theme controls and metadata; leave authored post content unchanged.
- [x] Verify language parity, rendered content, Vietnamese accents, responsive layout, keyboard operation, no scene remounts, existing workflows and production build.

## Review focus

- Missing/duplicate message keys, invalid interpolation and accidental translation of protocol IDs.
- Storage disabled or invalid, language preference restored before rendering.
- Language changes while editing, previewing a project, or running a tool.
- Vietnamese long labels at 320px, 390px, tablet and desktop widths.
- Existing unlocalized remote content and raw server errors must remain readable without claiming automatic translation.
