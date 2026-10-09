import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { pinnedToolsKey } from '../src/site/toolPreferences.js';
const base = process.env.SITE_URL || 'http://127.0.0.1:4177/portfolio/';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await context.newPage(), writes = [], errors = [], memberships = new Map();
let delay = 450, status = 200, malformed = false;
const records = [
  { slug: 'custom-json', component: 'json-formatter', name: 'JSON Formatter', category: 'Data', visibility: 'public', starCount: 3 },
  { slug: 'url-encoder', component: 'url-encoder-decoder', name: 'URL Encoder / Decoder', category: 'Web', visibility: 'public', starCount: 2 },
  { slug: 'member-tool', component: 'word-counter', name: 'Members tool', category: 'Writing', visibility: 'limited', starCount: 5 },
];
async function fixtures(target) {
  await target.route('https://identitytoolkit.googleapis.com/**', async route => {
    const body = route.request().postDataJSON(), lookup = route.request().url().includes('accounts:lookup');
    const uid = lookup ? JSON.parse(Buffer.from(body.idToken.split('.')[1], 'base64url')).user_id : body.email.split('@')[0];
    const now = Math.floor(Date.now() / 1000), email = `${uid}@example.com`;
    const token = `${Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')}.${Buffer.from(JSON.stringify({ aud: 'dtminh-dev', iss: 'https://securetoken.google.com/dtminh-dev', sub: uid, user_id: uid, email, email_verified: true, auth_time: now, iat: now, exp: now + 3600, firebase: { sign_in_provider: 'password', identities: { email: [email] } } })).toString('base64url')}.fixture`;
    await route.fulfill({ json: lookup ? { users: [{ localId: uid, email, emailVerified: true, providerUserInfo: [{ providerId: 'password', email }] }] } : { localId: uid, email, idToken: token, refreshToken: 'fixture-refresh', expiresIn: '3600' } });
  });
  await target.route('**/api/v1/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname, authorization = request.headers().authorization;
    const uid = authorization ? JSON.parse(Buffer.from(authorization.split(' ')[1].split('.')[1], 'base64url')).user_id : null;
    const stars = memberships.get(uid) || new Set();
    if (path.endsWith('/star')) {
      writes.push({ method: request.method(), path, authorization: Boolean(authorization), body: request.postData(), uid });
      const record = records.find(item => path.endsWith(`/tools/${item.slug}/star`)); assert(record, 'Use the Firestore slug rather than component key');
      await new Promise(resolve => setTimeout(resolve, delay));
      if (status !== 200) return route.fulfill({ status, json: { success: false, code: 'STAR_UNAVAILABLE', message: 'PRIVATE storage details' } });
      if (malformed) return route.fulfill({ json: { success: true, data: { slug: 'wrong-tool', starred: true, starCount: 100 } } });
      const next = request.method() === 'PUT';
      if (next !== stars.has(record.slug)) { record.starCount += next ? 1 : -1; if (next) stars.add(record.slug); else stars.delete(record.slug); memberships.set(uid, stars); }
      return route.fulfill({ json: { success: true, data: { slug: record.slug, starred: next, starCount: record.starCount } } });
    }
    const data = path.endsWith('/tools') ? records.map(item => !uid && item.visibility === 'limited' ? { slug: item.slug, name: item.name, category: item.category, visibility: item.visibility, locked: true, starCount: item.starCount, starred: false } : { ...item, starred: stars.has(item.slug) }) : path.endsWith('/auth/me') ? { uid, role: 'user' } : path.includes('/visitors/') ? { activeVisitors: 1, totalVisits: 1 } : {};
    return route.fulfill({ json: { success: true, data } });
  });
}
await fixtures(context); page.on('pageerror', error => errors.push(error.message));
const row = name => page.locator('.tool-picker-item').filter({ has: page.getByRole('button', { name, exact: true }) });
const login = async uid => { await page.goto(base + 'login'); await page.getByLabel('Email', { exact: true }).fill(`${uid}@example.com`); await page.getByLabel('Password', { exact: true }).fill('fixture-password'); await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await page.getByRole('button', { name: 'Sign out', exact: true }).waitFor(); await page.goto(base + 'tools'); await page.locator('.tool-picker-item').first().waitFor(); };
try {
  await page.goto(base + 'tools'); await page.locator('.tool-picker-item').first().waitFor();
  assert.equal(await row('JSON Formatter').locator('.tool-star-button').innerText(), '3');
  assert(await page.getByRole('link', { name: 'Sign in to star JSON Formatter', exact: true }).isVisible()); assert.equal(writes.length, 0);
  await page.getByRole('button', { name: 'Pin URL Encoder / Decoder', exact: true }).click();
  assert.equal(await page.locator('.tool-picker-select').first().getAttribute('aria-label'), 'URL Encoder / Decoder');
  assert(await page.getByRole('heading', { name: 'JSON Formatter', exact: true }).isVisible(), 'Pinning does not select a different workspace');
  assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), pinnedToolsKey), ['url-encoder']);
  await page.reload(); await page.getByRole('button', { name: 'Unpin URL Encoder / Decoder', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Pinned 1', exact: true }).click(); assert.equal(await page.locator('.tool-picker-select').count(), 1);
  await page.getByRole('button', { name: 'Unpin URL Encoder / Decoder', exact: true }).click(); await page.getByText('No pinned tools match. Pin a favorite or view all tools.').waitFor();
  await page.getByRole('button', { name: 'All', exact: true }).click(); await page.getByRole('button', { name: 'Pin URL Encoder / Decoder', exact: true }).click();
  await page.getByRole('button', { name: 'Members tool', exact: true }).click(); await page.locator('.tool-access-lock').waitFor();
  await login('reader');
  const give = page.getByRole('button', { name: 'Give JSON Formatter a star', exact: true }); await give.click();
  assert(await give.isDisabled()); assert.equal(await row('JSON Formatter').locator('.tool-star-button > span').innerText(), '3', 'No optimistic count increment');
  assert(await row('JSON Formatter').locator('.loading-indicator__label').isVisible());
  await page.getByRole('button', { name: 'Remove your star from JSON Formatter', exact: true }).waitFor();
  assert.equal(writes.length, 1); assert.equal(writes[0].method, 'PUT'); assert(writes[0].authorization); assert.equal(writes[0].body, null); assert.equal(await row('JSON Formatter').locator('.tool-star-button > span').innerText(), '4');
  await page.getByRole('button', { name: 'Pinned 1', exact: true }).click(); await page.getByRole('button', { name: 'All', exact: true }).click();
  assert(await page.getByRole('button', { name: 'Remove your star from JSON Formatter', exact: true }).isVisible(), 'Filtering preserves authoritative star results');
  await page.reload(); await page.getByRole('button', { name: 'Remove your star from JSON Formatter', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Remove your star from JSON Formatter', exact: true }).click(); await give.waitFor(); assert.equal(writes[1].method, 'DELETE'); assert.equal(await row('JSON Formatter').locator('.tool-star-button > span').innerText(), '3');
  status = 503; await give.click(); await page.getByRole('alert').waitFor(); assert(!(await page.getByRole('alert').innerText()).includes('PRIVATE')); assert.equal(await row('JSON Formatter').locator('.tool-star-button > span').innerText(), '3'); status = 200;
  malformed = true; await give.click(); await page.getByRole('alert').waitFor(); await page.waitForFunction(() => !document.querySelector('.tool-star-button:disabled')); assert.equal(await row('JSON Formatter').locator('.tool-star-button > span').innerText(), '3'); malformed = false;
  await page.locator('.language-switcher button[lang="vi"]').click(); assert((await page.locator('.tool-favorites-help').innerText()).includes('trình duyệt')); await page.locator('.language-switcher button[lang="en"]').click();
  mkdirSync('.tmp/screenshots', { recursive: true });
  for (const width of [320, 390, 768, 1440]) { await page.setViewportSize({ width, height: 950 }); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Tool favorites fit ${width}`); }
  await page.setViewportSize({ width: 390, height: 950 }); await page.locator('.tool-picker').scrollIntoViewIfNeeded(); await page.screenshot({ path: '.tmp/screenshots/tool-favorites-mobile.png' });
  delay = 1000; await give.click(); await page.goto(base + 'login'); await page.getByRole('button', { name: 'Sign out', exact: true }).click(); await page.getByLabel('Email', { exact: true }).waitFor();
  await login('second'); assert(await give.isVisible(), 'Another account does not inherit the previous account star'); assert(await page.getByRole('button', { name: 'Unpin URL Encoder / Decoder', exact: true }).isVisible(), 'Local pins survive account changes');
  const blocked = await browser.newContext(); await fixtures(blocked);
  await blocked.addInitScript(key => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(name, value) { if (name === key) throw new Error('Blocked'); return original.call(this, name, value); }; }, pinnedToolsKey);
  const blockedPage = await blocked.newPage(); await blockedPage.goto(base + 'tools'); await blockedPage.getByRole('button', { name: 'Pin JSON Formatter', exact: true }).click(); await blockedPage.getByText('Browser storage is unavailable. These pins will last for this visit only.').waitFor(); assert(await blockedPage.getByRole('button', { name: 'Unpin JSON Formatter', exact: true }).isVisible()); await blocked.close();
  assert.deepEqual(errors, []);
  console.log('Tool favorites passed: guest pins, persistence/order/filter, locked tools, authenticated slug-based stars, PUT/DELETE, authoritative counts, failure/malformed results, account change, Vietnamese, blocked storage and mobile.');
} finally { await browser.close(); }
