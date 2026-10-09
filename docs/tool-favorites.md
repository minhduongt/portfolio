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

The tools list sits inside a bordered panel with a keyboard-accessible collapse/expand
control. Collapsing removes the sidebar column on desktop and hides the list on mobile;
the workspace fills the available width. Search, filters, star state and current tool
drafts survive toggling. Pinned shortcuts remain available above the workspace.

Pinned tools appear only on the Tools page, directly below its title and introduction.
The bar uses the page's permitted catalogue, updates immediately, scrolls horizontally
on mobile, and disappears when there are no accessible pins. Hidden/private/archived
entries are never reconstructed from stored IDs. The shared pin store preserves this
visit's pins across pages even when localStorage writes are blocked.

Shortcuts use `/tools?tool=<catalogue-slug>` and open that exact workspace without
reloading the document. Deep links, refresh and history preserve the requested tool.
Repeated clicks reopen the tool even if a different workspace was selected since
the URL was set. Selection clears picker filters and transfers keyboard focus to
the workspace. The sticky header height is included in scrolling offsets; member
shortcuts retain the sign-in lock.

The backend already implements transactional stars; see
`../portfolio-be/docs/api/tool-stars-api.md`. Production GET checks confirmed
the star state endpoint, list fields, `no-store` caching and portfolio CORS origin.
Verification did not mutate production stars. Deploy the updated frontend to
publish these controls; no new backend route or environment variable is required.

Checks: `node scripts/check-tool-preferences.mjs`,
`node scripts/check-tool-favorites-ui.mjs`,
`node scripts/check-header-quick-access-ui.mjs`, existing tool/access/agent browser
checks, `node scripts/check-i18n.mjs`, `npm.cmd run build`, and backend
`npm.cmd test`. Browser tests use mocked account and star endpoints.
