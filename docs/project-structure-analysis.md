# Project structure analysis

Date: 2 October 2026. Updated after approval and promotion of Mixed.

Latest update: production now includes Firebase Login, a backend-profile session provider, guarded Admin and API-backed Blogs/Tools. New modules in `src/site`: `AuthProvider.jsx`, `api.js`, `LoginPage.jsx`, `AdminPage.jsx`, `ManagedContent.jsx`, `SafeHtml.jsx`. Configure `VITE_API_BASE_URL` including `/api/v1`. DOMPurify is added for safe blog rendering. Development comparison still uses samples. See [backend integration](./backend-integration.md) for the current architecture, endpoints, setup and verification; the original promotion map below predates this integration.

## Current architecture

React 18 / Vite 4 portfolio with raw Three.js. Production and the development design shell share components and data in src/site. Firebase project `dtminh-dev` is initialized through `src/firebase.js`, with optional production Analytics. There is no application backend, content API, database workflow or authentication layer in this portfolio. See [Firebase setup](./firebase-setup.md).

| Concern | Current implementation |
| --- | --- |
| Entry | index.html -> src/main.jsx -> src/site/App.jsx |
| Portfolio | Portfolio.jsx, shared content.js |
| Pages | Lazy Pages.jsx: sample Blogs and six working Tools |
| Routing | Hash page routes for static hosting; portfolio section anchors |
| UI | Semantic React and site.css; no production Chakra provider |
| 3D | Lazy ThreeScene.jsx with finite rendering, visibility pause and capped DPR |
| Data | Local curated CV/project content and unpublished sample blog posts |
| Deployment | Vite build/ output and existing gh-pages script; not deployed |
| Dependencies | package.json and yarn.lock; Firebase SDK added for the requested project connection |

## Directory map

~~~text
portfolio/
  index.html                  Production metadata and React entry
  design-preview.html         Development design shell
  legacy-preview.html         Development Original comparison
  vite.config.js              /portfolio/ base, build/ output, dev alias
  public/favicon.svg          Personal favicon
  src/
    main.jsx                  Production React mount
    firebase.js               Firebase app and guarded production Analytics
    legacy-main.jsx           Original mount and Chakra provider
    App.jsx, App.css          Retained original page
    index.css, three.js       Retained original globals/background
    components/, theme/       Retained original UI
    images/moon.jpg           Shared moon texture
    data/quotes.js            Shared quote collection
    docs/DuongTanMinh_CV.pdf   Downloadable CV
    preview/main.jsx          Design controls and isolated iframes
    site/
      App.jsx                 Production hash routing
      Portfolio.jsx           Hero, projects, experience, contact
      content.js              Shared facts and concept notes
      SiteNavigation.jsx      Links, resume and footer
      QuoteRotator.jsx        Timed/manual random quotes
      LayerStory.jsx          Scroll capability chapters
      ThreeScene.jsx          WebGL ownership and cleanup
      Pages.jsx               Blogs and local text tools
      data.js                 Sample posts and six tool definitions
      site.css                Site and development comparison styles
      tools/
        AdditionalTools.jsx   Image Converter, Power Fx, Color Picker
        toolLogic.js          Formatter and color conversion
  scripts/
    check-tool-logic.mjs
    check-production.mjs
    check-preview.mjs
    check-mixed-preview.mjs
  docs/
    portfolio-design-audit.md
    project-structure-analysis.md
    cv-and-projects-update.md
    mixed-production-and-tools.md
    superpowers/plans/2026-10-02-mixed-production.md
~~~

Generated node_modules/, build/ and .tmp/ are ignored. Temporary browser/PDF tooling and screenshots live in .tmp/.

## Rendering, state and content

App observes hash changes and renders Portfolio or lazy Pages under React StrictMode. Portfolio uses the approved moon scene, quotes and layer story. ThreeScene owns resource disposal, observers, event cleanup, mobile/reduced-motion behavior and WebGL fallback. HTML content is independent of WebGL.

Pages owns local search/filter and tool state; new utilities load separately. Image conversion owns transient object URLs and discards stale asynchronous results after file/settings changes or unmount. Inputs are neither persisted nor sent to an API. Clipboard and optional EyeDropper use browser capabilities.

Original comparison loads legacy-preview.html in an iframe, keeping original globals and its continuously rendering scene separate from production. A/B/C/Mixed share the current site components. The PDF is imported as a Vite asset, not parsed or regenerated at runtime.

content.js includes Mi-Jack (May 2026-present), Scavi ending April 2026, DevDirect and BeanOi. User edits are preserved: RE:SEARCH display name and Outsourcing project categories. See [CV and projects update](./cv-and-projects-update.md). The PDF still contains the old Scavi Now label.

Blogs remain unpublished samples. Tools are working local utilities: JSON, URL, Word Counter, Image Converter, Power Fx Formatter and Color Picker. See [implementation limits and frontend/backend decisions](./mixed-production-and-tools.md).

## URLs and build boundary

| URL | Behavior |
| --- | --- |
| /portfolio/ | Approved Mixed portfolio |
| /portfolio/#work | Work section |
| /portfolio/#/blogs | Sample blog list |
| /portfolio/#/blogs/pwa | Sample article |
| /portfolio/#/tools | Six utilities |
| /portfolio/design-preview/portfolio | Development design shell |
| /portfolio/legacy-preview.html | Development Original |

Hash routes support refresh and Back on GitHub Pages without rewrites. Article/skip/footer links keep the current page while scrolling. Only index.html is built; development HTML entries are excluded. Production now emits the approved site, lazy pages/tools/Three.js and CV asset. vite preview serves the production build.

## Development and checks

~~~powershell
npm.cmd run dev
node scripts/check-tool-logic.mjs
node scripts/check-preview.mjs
node scripts/check-mixed-preview.mjs
node scripts/check-production.mjs
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173
$env:SITE_URL = 'http://127.0.0.1:4173/portfolio/'
node scripts/check-production.mjs
~~~

Browser checks require Microsoft Edge and Playwright in ignored .tmp/tooling. No package-level test/lint script or CI workflow exists. See mixed-production-and-tools.md for verification coverage.

## Remaining decisions

- Replace sample articles with finished content and later integrate the blog backend.
- Keep tools local until persistence, sharing, batch processing or semantic formula validation is required.
- Export an updated CV PDF.
- Standardize the package manager and browser-check setup before CI.
- Remove retained legacy source/dependencies when Original comparison is no longer needed.
- Real article indexing/social metadata needs a publishing/URL decision; the current site is client-rendered with hash page routes.
