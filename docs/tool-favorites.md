# Tool stars and local pins

The tools picker provides two independent controls:

- **Pin:** available to everyone. Pinned tools move to the top, keep their catalogue
  order within that group, and appear in the Pinned filter. Pins are saved under
  `portfolio.pinned-tools.v1` in this browser's localStorage; they remain when
  signing in or switching accounts. No pin data goes to the backend. Storage
  failures keep pins for this visit and show a notice. Other tabs receive storage
  updates. Missing/private/archived tools are never restored from stored pins.
- **Star:** one per signed-in user and tool. The public total and current user's
  state come from `GET /tools`. Star and unstar use `PUT` and `DELETE` on
  `/tools/:slug/star`, with the Firebase ID token and no body. Use the actual
  catalogue slug, which may differ from the component key. Guests get a sign-in
  link. State changes only after a valid authoritative response; failures leave
  the displayed count unchanged. Requests time out after 12 seconds and are
  aborted when changing accounts or leaving the picker. Previous-account responses
  cannot update the new user's view.

Stars do not unlock member or private tools. Pin and star buttons are separate
from the workspace selection button and have accessible labels and pressed states.
Interface labels are available in English and Vietnamese.

The backend already implements transactional stars; see
`../portfolio-be/docs/api/tool-stars-api.md`. Production GET checks confirmed
the star state endpoint, list fields, `no-store` caching and portfolio CORS origin.
Verification did not mutate production stars. Deploy the updated frontend to
publish these controls; no new backend route or environment variable is required.

Checks: `node scripts/check-tool-preferences.mjs`,
`node scripts/check-tool-favorites-ui.mjs`, existing tool/access/agent browser
checks, `node scripts/check-i18n.mjs`, `npm.cmd run build`, and backend
`npm.cmd test`. Browser tests use mocked account and star endpoints.
