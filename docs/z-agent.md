# Z Agent

The portfolio uses the existing backend described in `../portfolio-be/docs/api/z-agent-api.md`. `GET /agent?language=en|vi` loads availability, greeting and suggestions when the dialog opens. `POST /agent/chat` runs only on submission, using the existing `VITE_API_BASE_URL`. The backend owns Google Gemini, knowledge lookup, function calling, quotas and timeouts. The official SDK documents the configured `gemini-flash-latest` alias: https://googleapis.github.io/js-genai/.

## Frontend architecture

- `src/site/agent/AgentWidget.jsx`: floating trigger and lazy panel loading.
- `AgentPanel.jsx` / `agent.css`: native dialog, keyboard and focus handling, responsive viewport sizing, plain-text answers, pending/errors, new conversation and external-link confirmation.
- `protocol.js`: bounded paired history, response validation, allowlisted destinations and per-tab UUID. No Gemini SDK or credentials are loaded in the browser.
- `AgentBridge.jsx`: routes suggested actions through registered React page handlers. `Portfolio` opens existing project previews or focuses registered sections; `Tools` selects an actual loaded, active public utility. Public article destinations are checked anonymously before display and again before navigation.
- English/Vietnamese catalogs are in `src/i18n/locales/{en,vi}/agent.json`. English remains the default. The interface follows site language; backend instructions let replies follow a clearly identifiable question language without changing the site automatically.

Actions are proposals until a visitor clicks them. Unknown types, extra fields, invalid sections/project IDs, arbitrary URLs and unsupported utilities are rejected. GitHub/LinkedIn links must exactly match profile data and require a separate confirmation link. Replies are React text nodes, without HTML, automatic links or script evaluation. Actions do not bypass member/admin permissions.

Chat remains in memory while navigating or minimizing (maximum 40 displayed messages). New conversation clears exchanges and drafts; reload/tab close clears the transcript. Only a random UUID is retained in sessionStorage for the existing quota bucket. The request sends at most five completed pairs, 2,000 characters per historical message, and 12,000 total characters including the new question. No account identity, tool inputs, contact drafts or private article content is sent. The panel explains that messages are sent to Google Gemini and asks visitors to avoid sensitive details.

Sending immediately adds the outgoing bubble to the conversation and clears the composer; the loading indicator appears below the message. A response adds only the assistant bubble. Sent messages remain visible after errors or cancellation, and the question returns to the composer for retry. Only successfully completed exchanges enter the bounded model history.

Closing/resetting cancels local requests. Provider work may already have incurred usage. Duplicate submits are blocked. Client chat deadline is 30 seconds; backend deadline is 25 seconds. HTTP 429 imposes at least 60 seconds of backoff, honors numeric Retry-After, and explains that longer provider/session/global limits may apply. No automatic inference retries or streaming were added to the existing bounded JSON API.

## Knowledge and backend follow-up

Portfolio education now shares `src/site/content.js` between the visible About section and generated AI knowledge. Public control descriptions in `src/site/agent/knowledge.js` document implemented interactions, including hovering to pause the planet, chapter navigation, CV access, and the absence of project filters. Keep these descriptions current when controls change.

The backend importer and knowledge service now include education and those control descriptions. The generated snapshot also includes the current Mi-Jack US stakeholder experience. Backend CORS exposes Retry-After so the browser can read its backoff. Existing public-only content filtering, durable quotas and Gemini settings are retained.

After updating public facts or feature descriptions, run from the backend:

```powershell
npm.cmd run sync:agent-knowledge -- 'C:\Users\dminh\source\repos\portfolio'
```

## Deployment

1. Backend: configure server-only `GEMINI_API_KEY`; optionally `GEMINI_MODEL` (existing default `gemini-flash-latest`). Verify model access/quota with the deployment's own key. Configure frontend origin in `CORS_ORIGINS`, Firestore TTL on `agentRateLimits.expiresAt`, and a function duration over 25 seconds.
2. Deploy the updated backend, including its generated knowledge snapshot.
3. Frontend: point `VITE_API_BASE_URL` to that backend's `/api/v1`, then build/deploy through the existing hosting workflow. Do not put a Gemini key in a VITE variable.
4. Perform a live provider smoke test for EN/VI answers, documented experience/projects, unknown facts, Contact, and quota failures. Automated verification uses fixtures and does not establish provider availability or guarantee factual model output.

## Verification

`node scripts/check-agent-protocol.mjs` checks action allowlists, hostile/empty/oversized responses and paired history budgets. `node scripts/check-agent-ui.mjs` uses mocked APIs and analytics: follow-ups, navigation, project/tool/article actions, language switching, external confirmation, plain-text safety, cancellation, quotas, both themes and 320/390/768/1440px layouts. After building, `node scripts/check-agent-build.mjs` checks the lazy chunk and absence of server-only AI configuration/SDK/provider calls from browser assets. The backend suite tests knowledge filtering, function/input validation, provider errors, cancellation and durable rate limits; `agentSiteFacts.test.js` covers shared education, controls and US stakeholder experience. Run catalog checks and `npm.cmd run build` alongside these checks.

## Production 503 / 504 diagnosis

Public metadata and OPTIONS preflight were checked against the deployed API from `https://dtminh-dev.web.app`: responses were 200/204 with the correct allowed-origin header and `available: true`. One minimal live chat probe returned an application 503 in approximately 1.9 seconds, with the correct CORS header. This confirms ordinary CORS configuration is working; metadata availability checks key presence only. The screenshot also shows a separate gateway 504 with no allowed-origin header, which can surface as a browser CORS error.

The backend now logs `Z Agent dependency failed` with only an allowlisted stage (`provider`, `knowledge`, `rate_limit`), numeric status and numeric/allowlisted error code. It excludes SDK messages, stacks, URLs, credentials and transcripts. After redeploying, use this event in Vercel runtime logs to identify the failed dependency. A provider status 401/403 indicates authentication/access failure; 404 indicates a missing model; a `rate_limit` event means the Firestore quota transaction failed rather than a quota being exhausted. Knowledge-stage errors identify public-content loading failures. Do not assume the original 503 is fixed until the deployed dependency error has been identified and a live request succeeds.

`portfolio-be/vercel.json` explicitly sets `functions["api/index.js"].maxDuration` to 60 seconds, leaving room for the application's existing 25-second deadline and a normal error response. This prevents relying on an unknown deployment default; it does not repair a Gemini/Firestore failure or prove the previous gateway response's cause.
