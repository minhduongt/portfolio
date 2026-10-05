# Portfolio audit & design preview — 02 October 2026

## Scope and review gate

Latest content integration: Firebase Login and a verified-admin dashboard now manage blogs/tools through `portfolio-be`; production reads API content while design previews retain samples. See [backend recheck and frontend integration](./backend-integration.md).

The user has approved Mixed and requested implementation. Production now uses the moon hero, timed/manual quotes, three scroll layers, updated CV/project content, sample Blogs and six working browser Tools. This audit retains the original observations and comparison history. See [Mixed production and tools](./mixed-production-and-tools.md) for the current implementation.

Preview: run `npm.cmd run dev`, open `http://localhost:5173/portfolio/design-preview/portfolio` (use the port Vite prints if 5173 is occupied). Mixed preview opens by default; Original and A/B/C remain available. The Page selector opens Portfolio, Blogs or Tools. The viewport selector supports fit, 1920, 1440, 1280, 768 and 390 pixels. Fixed viewport sizes intentionally scroll horizontally when larger than the available preview area. Each concept lives in an iframe so original global styles and its WebGL loop cannot affect the concepts.

`design-preview.html` is a separate development entry, not a production build entry. The friendly route is provided by a Vite `apply: 'serve'` plugin. Production `vite build` builds the approved site through `index.html`; development HTML entries are excluded. Preview metadata uses `noindex,nofollow`.

## Existing implementation

- React 18 + Vite 4; Chakra UI / Emotion for components.
- Existing Framer Motion handles project-card hover. No new application dependency added.
- Raw Three.js 0.149, loaded independently by an HTML module script. No React Three Fiber migration.
- `src/App.jsx` owns presentation, content arrays and quote pagination. Five small UI components, one Chakra theme and global CSS files support it.
- Global design styles compete: system fonts, an external Typekit import and a Chakra Cabin family without a matching font asset; `--spacing: 350px` drives unusually large gaps.
- The background scene creates 200 individual sphere meshes, each with its own geometry/material. Textures include space, moon and a 933 kB normal map. DPR is uncapped; animation renders continually, including a torus that is never added to the scene. No resize handling, visibility pause, reduced-motion adaptation or WebGL fallback.

## Audit and priorities

| Area | Evidence | Classification and next action |
| --- | --- | --- |
| Identity | Name and Web Developer role exist, but welcome copy does not explain value or offer a CTA | **REFINE** — real CV role, short positioning, Work / Contact CTA |
| Three.js | Memorable space identity; full-page stars and camera translation compete with content | **KEEP** raw Three.js and a signature visual; **REDESIGN** its scale, interaction and lifecycle |
| Typography | Large display text and quotes dominate; several font systems compete | **REDESIGN** — a single clean sans stack, restrained monospace metadata, consistent heading levels |
| Color | Space image, yellow quotes, translucent blocks and component colors lack one hierarchy | **REFINE** — neutral background, readable surfaces, muted text and one accent |
| Layout | Absolute main wrapper, 12-column layout, fixed padding and 350px section gaps | **REDESIGN** — bounded content width, responsive flow and purposeful whitespace |
| Navigation | Desktop links are clickable `Text` elements rather than anchors; mobile calls `onScroll(link.id)` instead of the scroll function | **REDESIGN** — semantic anchors, functional mobile menu, visible focus and resume |
| Projects | Three names with short descriptions share the same stock photo; no project actions on cards | **REDESIGN** — real CV projects, problem / contribution / role / challenge / delivery; no fabricated URLs |
| Experience | Reso / BeanOi / Now stepper omits dates, actual responsibilities and DevDirect | **REDESIGN** — CV-based dated experience and concise responsibilities |
| Capabilities | Flat lists precede project evidence | **REFINE** — group by Frontend, Backend & data, Delivery; put projects first |
| Contact | No contact section, email CTA, LinkedIn or resume | **REDESIGN** — CV email, phone and LinkedIn; retain existing GitHub |
| Motion | 10% card scale, scroll-driven camera shifts and endless background rendering | **REFINE** — small interaction, native scrolling, finite on-demand renders |
| Distractions | Infinite motivational quotes extend the page without helping evaluate the developer | **REMOVE** from concepts; original remains intact for comparison |
| Mobile | Browser observation: at 390px viewport the document is 745px wide | **REDESIGN** — stacked layouts, reachable menu/CTAs, static 3D on mobile |
| Accessibility | Generic project image has no alt; nav lacks link semantics; no reduced-motion support | **REDESIGN** — semantic HTML, focus, skip link, native details, decorative canvas, motion preference |
| SEO | Misspelled title; default Vite favicon; no description, social metadata or canonical; initial HTML contains only a React root | **REDESIGN later** — real title, description, canonical for deployed URL, OG/Twitter, personal favicon; consider static rendering for crawlable initial HTML |

Initial review deferred SEO; promotion now adds title, description, basic Open Graph metadata and a personal favicon. Preview content uses DOM headings and text rather than canvas text, but is client-rendered and is deliberately not an SEO deliverable. These observations are a source/browser audit, not Lighthouse scores or real-device GPU measurements.

## CV reconciliation

Current source of truth: `src/docs/DuongTanMinh_CV.pdf`, both pages, extracted with PDF.js for local inspection. The user replaced the original dated PDF during the mixed-preview work; the download and current content now reference this new file.

- Identity: Duong Tan Minh, Software Developer; email `dtminh.dev@gmail.com`; phone `+84 764 420 250`; LinkedIn `/in/minhdt1105`.
- Employment: user-confirmed correction takes precedence over the PDF's Scavi “Now”: Mi-Jack Vietnam, Fullstack Developer, May 2026–Present, Power Platform / Power Apps / Power Automate / React / .NET; Scavi, Fullstack Developer, Apr 2025–Apr 2026, SCAF/ISCAF, C#/.NET, WinForms, Power Platform, Node.js/Express and MSSQL; DevDirect, Front-end Developer, Apr 2024–Apr 2025; BeanOi Company, Front-end Developer, Apr 2022–Jul 2023.
- Featured work: source-reviewed Acupressure Map and RE:SEARCH v2 replace FINE Delivery. PhuongNamCompany ERP remains based on the current CV. Kyansunitour has been removed from Selected Work at the user's request. Each of the three products now has a public link and an iframe preview dialog. Detailed evidence and ready-to-copy CV additions are in [CV and projects update](./cv-and-projects-update.md).
- Skills and tooling come from the CV, user-confirmed current work and reviewed source, grouped around capability. No proficiency percentages or inferred employment/availability. The downloadable PDF itself has not been edited and still needs the employment correction.
- Education: FPT University — HCM City, Software Engineering, 2019–2023. English: Upper Intermediate.
- Recognition: First Prize Tiki Hacking Trail Jul 2022; Third Prize FPT Entrepreneurial Hackathon Oct 2022; Most Promising Prize FPT Entrepreneurial Hackathon Feb 2023.
- GitHub is retained from existing source. CV download references the actual PDF in `src/docs`.
- The CV provides no project screenshots or individual project URLs. Visuals are explicitly labelled functional diagrams, not screenshots. Public source actions are limited to the existing GitHub profile. Project metrics are not invented; the 300-student figure belongs only to BeanOi.

## Concept comparison

| | A — Clean Evolution | B — Modern Developer | C — Immersive Minimal |
| --- | --- | --- | --- |
| Composition | Familiar split hero; conventional three-column project cards | Editorial split hero; large alternating project spreads | Centered, oversized hero; ambient scene; compact project rows |
| Three.js role | Moon and restrained orbit in hero, reusing current moon texture | Three geometric layers express interface → logic → data | Single wireframe structure, restrained section-based orientation and color |
| Navigation | Conventional sans navigation and resume action | Calm sans navigation and resume action | Compact monospace accents; same accessible destinations |
| Typography | Smaller display scale, familiar identity | Larger display hierarchy and whitespace | Largest hero scale with quiet surrounding text |
| Project density | Summaries + native expandable case studies | Full case-study text immediately visible | Compact rows + native expandable case studies |
| Motion | Small pointer response, no automatic rotation | Small pointer response on layer assembly | Small pointer/section response, no scroll hijacking |
| Strength | Closest to the existing portfolio | Strong project discoverability and direct reading | Strongest immersive signature |
| Trade-off | Space identity remains less tied to product engineering | Less immersive than C | Requires careful contrast and opening project detail |
| Performance | One textured sphere + one thin orbit | Three boxes and edge lines, no textures | Two modest geometries; no textures |
| Mobile | Stacked content, small static hero scene | Content/CTA first, small static scene | Scene becomes static hero-only enhancement |
| Change level | Low–medium | Medium | Medium–high |

All concepts include Hero, About, Selected work, Experience, Capabilities, Contact and Footer. Concept notes in the preview explain direction, Three.js role, strengths, trade-offs, performance, mobile behavior and affected components. The user can mix hero, navigation, project treatment, typography and motion from different concepts. The user subsequently approved Mixed, which has now been promoted to production.

## Preview implementation

- Shared verified content: `src/site/content.js`.
- Preview controls and semantic content components: `src/preview/main.jsx`.
- Isolated styles and responsive concept compositions: `src/site/site.css`.
- Lazy-loaded raw Three.js scene: `src/site/ThreeScene.jsx`.
- DPR capped at 1.5; no shadows, post-processing or particle cloud. Render only when invalidated; interpolation stops once settled. Pause outside visibility / hidden document; dispose resources and remove listeners on unmount.
- Mobile and `prefers-reduced-motion` suppress pointer movement and interpolated rotation. CSS smooth scrolling and transitions are disabled for reduced motion.
- Renderer creation failures and context loss expose a decorative CSS fallback; content and links remain available independently.
- No additional fonts, image services, animation libraries or app dependencies.

## Verification

Run `node scripts/check-preview.mjs` with Vite running. Local browser tooling is installed separately in ignored `.tmp/tooling`, using the installed Microsoft Edge. The script checks three concepts at 1920, 1440, 1280, 768, 390 and 320 pixels; CV facts, canvas, horizontal overflow, switching/Original, mobile navigation, anchor destinations, PDF delivery, reduced motion and WebGL failure fallback. Screenshots are written to ignored `.tmp/screenshots`.

Run `npm.cmd run build` to verify production. Existing Chakra `use client` warnings and the existing large JS chunk warning remain; they are outside the preview scope. Preview isolation is also checked by inspecting the emitted files for preview entry/content/CV assets. Desktop browser viewport emulation is not a real-device performance measurement.

Verified in this session: browser checks **PASS** for 3 concepts × 6 widths, switching/Original, CV content, mobile anchors, PDF response, reduced motion and WebGL fallback. The active-section regression was reproduced before the fix and passed afterward. Build exited 0; emitted output inspection confirmed preview HTML, preview content and the CV are absent. Independent code review found two issues (section tracking and Vietnamese language attributes); both were fixed and rechecked. `git diff --check` passed.

## User review

Mixed is approved and promoted. The development comparison remains available. Backend integration and finished articles remain later tasks.

## Mixed preview — moon, layers, notebook and workbench

This section describes the initial mockup. Mixed is now the production design; see [production implementation and six browser tools](./mixed-production-and-tools.md) for the latest build boundary, routes and verification.

- **Hero:** moon texture and restrained orbit from A; editorial layout from B. Existing source quotes rotate randomly every eight seconds and exclude the currently displayed quote. Next quote changes immediately; Pause/Play controls rotation. Automatic rotation pauses in a hidden document and defaults off with reduced motion. Manual changes are announced politely; automatic changes do not repeatedly interrupt a screen reader.
- **Three connected layers:** a dedicated natural-scroll section replaces the duplicated capabilities grid. The three geometric layers separate gradually, with capability details in HTML alongside them. Buttons jump to Frontend, Backend & data or Delivery. Rendering settles after scroll changes. Mobile and reduced motion use fully expanded static geometry with all details in normal flow; no content requires WebGL.
- **Blogs:** topic filters, search, no-results state, sample article pages, reading outline and back links. Drafts are explicitly marked sample/unpublished; no fabricated publishing dates or readership metrics. Mock content is in `src/site/data.js`.
- **Tools:** the user confirmed JSON Formatter, URL Encoder/Decoder and Word Counter. The mock workspaces run locally, including sample input, clear, output and error states. JSON rejects unsafe integers/nonfinite numbers and explains JavaScript decimal precision; URL encoding uses URL-component semantics. Input is not sent to a backend. Copy output handles unavailable clipboard access.
- **Navigation:** portfolio, Blogs and Tools use shared navigation; URLs support refreshing and browser Back. The preview shell has a page selector. These are preview URLs, not production routes.
- **Future backend:** replace sample posts and tool metadata with real content after the UI is approved. No API client, authentication, database, persistence or speculative backend abstraction has been added.

Mixed checks: `node scripts/check-mixed-preview.mjs` **PASS** for quote timing/manual/pause, actual rendered canvas changes after scrolling, short desktop viewport controls, blog search/detail, tools results/error cases and 320/390/768/1440 widths. The A/B/C regression suite also passes. Production build exits 0 with the same existing Chakra/chunk-size warnings; inspection confirms mixed mockup, Blogs, Tools and CV are absent from its emitted assets. Independent review verified the numeric-precision guard and short-height layout fixes.
