import assert from 'node:assert/strict';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const base = process.env.SITE_URL || 'http://127.0.0.1:4177/';
try {
  for (const role of ['reader', 'admin']) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const requests = [], heartbeats = [], errors = [];
    let mode = 'ready';
    page.on('pageerror', error => errors.push(error.message));
    await context.route('https://identitytoolkit.googleapis.com/**', route => {
      const now = Math.floor(Date.now() / 1000), email = `${role}@example.com`;
      const token = `${Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')}.${Buffer.from(JSON.stringify({ aud: 'dtminh-dev', iss: 'https://securetoken.google.com/dtminh-dev', sub: role, user_id: role, email, email_verified: true, auth_time: now, iat: now, exp: now + 3600, firebase: { sign_in_provider: 'password', identities: { email: [email] } } })).toString('base64url')}.fixture`;
      return route.fulfill({ json: route.request().url().includes('accounts:lookup') ? { users: [{ localId: role, email, emailVerified: true, providerUserInfo: [{ providerId: 'password', email }] }] } : { localId: role, email, idToken: token, refreshToken: 'fixture-refresh', expiresIn: '3600' } });
    });
    await context.route('**/api/v1/**', route => {
      const request = route.request(), url = new URL(request.url()), params = Object.fromEntries(url.searchParams);
      if (url.pathname.endsWith('/heartbeat')) { heartbeats.push(request.postDataJSON()); return route.fulfill({ json: { success: true, data: { countedVisit: false } } }); }
      if (url.pathname.endsWith('/stats')) return route.fulfill({ json: { success: true, data: { activeVisitors: 2, totalVisits: 123 } } });
      if (url.pathname.endsWith('/auth/me')) return route.fulfill({ json: { success: true, data: { uid: role, role: role === 'admin' ? 'admin' : 'user' } } });
      if (!/\/visitors\/(analytics|visits)$/u.test(url.pathname)) return route.fulfill({ json: { success: true, data: [] } });
      requests.push({ endpoint: url.pathname, ...params });
      assert.match(request.headers().authorization, /^Bearer /u);
      assert.equal(role, 'admin', 'Non-admins must never request private visitor data');
      if (mode === 'missing') return route.fulfill({ status: 404, contentType: 'text/html', body: '<html>Cannot GET this endpoint</html>' });
      if (mode === 'error') return route.fulfill({ status: 422, json: { success: false, code: 'ANALYTICS_RANGE_TOO_LARGE', message: 'Too many visits in this range; select a shorter date range' } });
      if (mode === 'denied') return route.fulfill({ status: 403, json: { success: false, message: 'Administrator access required' } });
      if (url.pathname.endsWith('/analytics')) return route.fulfill({ json: { success: true, data: { ...params, timezone: 'UTC', activeVisitors: 2, totalVisits: 123, visitsInRange: mode === 'empty' ? 0 : 3, uniqueVisitors: mode === 'empty' ? 0 : 2, dailyVisits: [{ date: params.startDate, visits: mode === 'empty' ? 0 : 1 }, { date: params.endDate, visits: mode === 'empty' ? 0 : 2 }], ...Object.fromEntries(['referrers', 'devices', 'browsers', 'operatingSystems', 'landingPages'].map(key => [key, mode === 'empty' ? [] : [{ label: { referrers: 'https://www.google.com', devices: 'mobile', browsers: 'Chrome', operatingSystems: 'Android', landingPages: '/blogs/hello' }[key], visits: 3 }]])) } } });
      const second = params.cursor;
      return route.fulfill({ json: { success: true, data: { startDate: params.startDate, endDate: params.endDate, visits: mode === 'empty' ? [] : [{ id: second ? 'older' : 'latest', visitorId: 'fixture-id', startedAt: '2026-10-05T10:00:00.000Z', ip: second ? '203.0.113.8' : '203.0.113.7', referrer: 'https://www.google.com', landingPage: '/blogs/hello', device: 'mobile', browser: 'Chrome', os: 'Android' }], nextCursor: !second && mode !== 'empty' ? 'fixture-next-cursor' : null } } });
    });
    await page.goto(new URL('blogs?campaign=test', base).href, { referer: 'https://www.google.com/search?q=portfolio' });
    await page.locator('.visitor-stats.is-live').waitFor();
    assert.equal(heartbeats[0].referrer, 'https://www.google.com');
    assert.equal(heartbeats[0].landingPage, '/blogs');
    await page.goto(new URL('admin', base).href);
    assert.equal(requests.length, 0);
    await page.goto(new URL('login', base).href);
    await page.getByLabel('Email', { exact: true }).fill(`${role}@example.com`);
    await page.getByLabel('Password', { exact: true }).fill('fixture-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByRole('button', { name: 'Sign out', exact: true }).waitFor();
    await page.goto(new URL('admin', base).href);
    if (role === 'reader') {
      await page.getByText('Verified administrator access is required.').waitFor();
      assert.equal(await page.getByRole('button', { name: 'Visitors', exact: true }).count(), 0);
      assert.equal(requests.length, 0);
    } else {
      await page.getByRole('button', { name: 'Visitors', exact: true }).click();
      await page.getByRole('cell', { name: '203.0.113.7', exact: true }).waitFor();
      assert(await page.getByRole('heading', { name: 'Visits over time', exact: true }).isVisible());
      const initialRange = { startDate: requests[0].startDate, endDate: requests[0].endDate };
      await page.getByRole('button', { name: 'Next page', exact: true }).click();
      await page.getByRole('cell', { name: '203.0.113.8', exact: true }).waitFor();
      assert.equal(requests.at(-1).cursor, 'fixture-next-cursor');
      assert.equal(requests.at(-1).startDate, initialRange.startDate);
      assert.equal(requests.at(-1).endDate, initialRange.endDate);
      assert(await page.getByRole('button', { name: 'Next page', exact: true }).isDisabled());
      await page.getByRole('button', { name: 'Previous page', exact: true }).click();
      await page.getByRole('cell', { name: '203.0.113.7', exact: true }).waitFor();
      await page.getByLabel('Start date', { exact: true }).fill('2026-10-01');
      await page.getByLabel('End date', { exact: true }).fill('2026-10-05');
      await page.getByRole('button', { name: 'Apply dates', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.visitor-date-range')?.textContent.includes('2026-10-01'));
      await page.getByRole('cell', { name: '203.0.113.7', exact: true }).waitFor();
      assert.equal(requests.at(-1).startDate, '2026-10-01');
      assert.equal(requests.at(-1).cursor, undefined);
      await page.getByLabel('Rows per page').selectOption('50');
      await page.getByRole('cell', { name: '203.0.113.7', exact: true }).waitFor();
      assert.equal(requests.at(-1).limit, '50');
      assert.equal(requests.at(-1).cursor, undefined);
      await page.getByLabel('Start date', { exact: true }).fill('2026-01-01');
      const before = requests.length;
      await page.getByRole('button', { name: 'Apply dates', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: '90 days' }).waitFor();
      assert.equal(requests.length, before);
      mode = 'error';
      await page.getByRole('button', { name: 'Refresh analytics', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'shorter date range' }).first().waitFor();
      mode = 'missing';
      await page.getByRole('button', { name: 'Refresh analytics', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'API endpoint /visitors/analytics was not found (404)' }).waitFor();
      await page.getByRole('alert').filter({ hasText: 'API endpoint /visitors/visits was not found (404)' }).waitFor();
      mode = 'empty';
      await page.getByRole('button', { name: 'Refresh analytics', exact: true }).click();
      await page.getByText('No visit sessions in this range.').waitFor();
      await page.setViewportSize({ width: 390, height: 844 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      mode = 'ready';
      await page.getByRole('button', { name: 'Refresh analytics', exact: true }).click();
      await page.getByRole('cell', { name: '203.0.113.7', exact: true }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.equal(await page.locator('.visitor-chart').first().evaluate(element => getComputedStyle(element).paddingTop), '18px');
      await page.screenshot({ path: '.tmp/screenshots/visitor-analytics-mobile.png', fullPage: true });
      mode = 'denied';
      await page.getByRole('button', { name: 'Refresh analytics', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'Administrator access required' }).first().waitFor();
      await page.getByRole('button', { name: 'Sign out', exact: true }).click();
      await page.getByText('Sign in to manage content.').waitFor();
      assert.equal(await page.locator('.visitor-analytics').count(), 0);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('PASS: heartbeat attribution, admin-only analytics, authenticated reads, fixed-date cursor paging, date validation, errors, empty data, mobile layout and logout cleanup; no live visitor records created.');
} finally { await browser.close(); }
