// Uses the real sibling backend controllers with its in-memory test store.
// Firebase identity protocol responses are fixtures; no live account or data is changed.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
const require = createRequire(new URL('../../portfolio-be/package.json', import.meta.url));
const { createFakeFirestore } = require('./test/helpers/fakeFirestore');
const { createUserService } = require('./src/services/userService');
const { createContentService } = require('./src/services/contentService');
const { createContentController } = require('./src/controllers/contentController');
const { createAuthController } = require('./src/controllers/authController');
const { createAuthenticate } = require('./src/middlewares/authenticate');
const { createRequireAdmin } = require('./src/middlewares/requireAdmin');
const { createApiRouter } = require('./src/routes/apis');
const createApp = require('./src/createApp');
const errors = [];
const fake = createFakeFirestore({
  'users/admin': { uid: 'admin', role: 'admin', email: 'admin@example.com' },
  'users/unverified': { uid: 'unverified', role: 'admin', email: 'unverified@example.com' },
  'blogs/first-post': { slug: 'first-post', title: 'First post', excerpt: 'API content', contentHtml: '<p><strong>Real article</strong></p><img src=x onerror="window.injected=true"><script>window.injected=true</script>', tags: ['Frontend'], visibility: 'public', archivedAt: null },
  'blogs/secret': { slug: 'secret', title: 'Private notes', contentHtml: '<p>Private</p>', visibility: 'private', archivedAt: null },
  'tools/json': { slug: 'json', name: 'JSON Formatter', description: 'Format JSON', component: 'json-formatter', visibility: 'public', archivedAt: null },
  'tools/unknown': { slug: 'unknown', name: 'Unsupported tool', description: 'Unavailable', component: 'unknown', visibility: 'public', archivedAt: null },
});
const users = createUserService(fake);
const noop = (_req, res) => res.json({ success: true });
const controllers = { authController: createAuthController({ userService: users }), emailController: { sendEmail: noop, sendCustomEmail: noop }, imageController: { uploadImage: noop } };
for (const [resource, kind] of [['blogs', 'blog'], ['tools', 'tool']]) controllers[`${kind}Controller`] = createContentController({ service: createContentService({ collectionRef: fake.db.collection(resource), kind, fieldValue: fake.fieldValue }), getUser: users.getUser });
const verifyIdToken = async token => {
  const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
  return { uid: decoded.user_id, email: decoded.email, email_verified: decoded.email_verified };
};
const app = createApp({ apiRouter: createApiRouter({ controllers, authenticate: createAuthenticate({ verifyIdToken }), optionalAuthenticate: createAuthenticate({ verifyIdToken, optional: true }), requireAdmin: createRequireAdmin({ getUser: users.getUser }) }), allowedOrigins: 'http://127.0.0.1:5173,http://localhost:5173' });
app.use(require('./src/middlewares/error'));
const server = app.listen(3000, '127.0.0.1');
await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const base = 'http://127.0.0.1:5173/portfolio/';
try {
  const context = await browser.newContext();
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  let identity = 'admin';
  await context.route('https://identitytoolkit.googleapis.com/**', async route => {
    const now = Math.floor(Date.now() / 1000);
    const verified = identity !== 'unverified';
    const token = `${Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')}.${Buffer.from(JSON.stringify({ aud: 'dtminh-dev', iss: 'https://securetoken.google.com/dtminh-dev', sub: identity, user_id: identity, email: `${identity}@example.com`, email_verified: verified, auth_time: now, iat: now, exp: now + 3600, firebase: { sign_in_provider: 'password', identities: { email: [`${identity}@example.com`] } } })).toString('base64url')}.fixture`;
    const data = route.request().url().includes('accounts:lookup') ? { users: [{ localId: identity, email: `${identity}@example.com`, emailVerified: verified, providerUserInfo: [{ providerId: 'password', email: `${identity}@example.com` }] }] } : { localId: identity, email: `${identity}@example.com`, idToken: token, refreshToken: 'fixture-refresh', expiresIn: '3600' };
    await route.fulfill({ json: data, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.goto(`${base}#/blogs`);
  await page.getByRole('link', { name: 'First post ↗', exact: true }).waitFor();
  assert.equal(await page.getByText('Private notes', { exact: true }).count(), 0);
  await page.getByRole('link', { name: 'First post ↗', exact: true }).click();
  await page.getByText('Real article', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.injected), undefined);
  assert.equal(await page.locator('.managed-html script, .managed-html img').count(), 0);
  await page.goto(`${base}#/admin`); await page.getByText('Sign in to manage content.').waitFor();
  await page.getByRole('link', { name: 'Sign in', exact: true }).last().click();
  await page.getByLabel('Email', { exact: true }).fill('admin@example.com');
  await page.getByLabel('Password', { exact: true }).fill('fixture-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('link', { name: 'Open administration', exact: true }).click();
  await page.getByRole('button', { name: 'New blog', exact: true }).click();
  await page.getByLabel('Slug', { exact: true }).fill('new-post'); await page.getByLabel('Title', { exact: true }).fill('New post');
  await page.getByLabel('Blog HTML', { exact: true }).fill('<p>Saved article</p>');
  assert.notEqual(await page.getByRole('button', { name: 'Save content', exact: true }).evaluate(button => getComputedStyle(button).backgroundColor), 'rgba(0, 0, 0, 0)', 'Primary save action has a visible background');
  await page.screenshot({ path: '.tmp/screenshots/admin-editor.png', fullPage: true });
  await page.getByRole('button', { name: 'Save content', exact: true }).click();
  await page.getByRole('button', { name: 'Edit New post', exact: true }).click();
  assert(await page.getByLabel('Slug', { exact: true }).isDisabled());
  await page.getByLabel('Visibility').selectOption('public');
  await page.getByRole('button', { name: 'Save content', exact: true }).click();
  await page.getByRole('button', { name: 'Archive New post', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm archive', exact: true }).click();
  await page.getByRole('button', { name: 'Restore New post', exact: true }).click();
  await page.getByRole('button', { name: 'Archive New post', exact: true }).waitFor();
  assert.equal(fake.documents.get('blogs/new-post').archivedAt, null);
  await page.getByRole('button', { name: 'Tools management', exact: true }).click();
  await page.getByRole('button', { name: 'New tool', exact: true }).click();
  await page.getByLabel('Slug', { exact: true }).fill('color'); await page.getByLabel('Tool name', { exact: true }).fill('Color Picker');
  await page.getByLabel('Description', { exact: true }).fill('Pick a color');
  await page.getByLabel('Tool component').selectOption('color-picker');
  await page.getByLabel('Visibility').selectOption('public');
  await page.getByRole('button', { name: 'Save content', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Color Picker', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Tools', exact: true }).click();
  await page.getByRole('button', { name: 'Color Picker', exact: true }).click();
  await page.getByLabel('HEX color').fill('#ff0000'); assert.equal(await page.getByLabel('RGB value').inputValue(), 'rgb(255, 0, 0)');
  await page.getByRole('button', { name: 'Unsupported tool', exact: true }).click();
  await page.getByText('This tool is unavailable in this version of the portfolio.').waitFor();
  await page.goto(`${base}#/blogs`); await page.getByRole('link', { name: 'Private notes ↗', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Admin', exact: true }).click(); await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.goto(`${base}#/blogs`); await page.getByRole('link', { name: 'First post ↗', exact: true }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Private notes ↗', exact: true }).count(), 0);
  identity = 'reader'; await page.goto(`${base}#/login`);
  await page.getByLabel('Email', { exact: true }).fill('reader@example.com'); await page.getByLabel('Password', { exact: true }).fill('fixture-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByText('Signed in. This account does not have administrator access.').waitFor();
  await page.goto(`${base}#/admin`); await page.getByText('Verified administrator access is required.').waitFor();
  assert.equal(await page.getByRole('button', { name: 'New blog', exact: true }).count(), 0);
  await page.goto(`${base}#/login`); await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  identity = 'unverified';
  await page.getByLabel('Email', { exact: true }).fill('unverified@example.com'); await page.getByLabel('Password', { exact: true }).fill('fixture-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByText('Verify your email to manage content.').waitFor();
  await page.goto(`${base}#/admin`); await page.getByText('Verified administrator access is required.').waitFor();
  assert.equal(await page.getByRole('button', { name: 'New blog', exact: true }).count(), 0);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    for (const route of ['login', 'admin', 'blogs', 'tools']) { await page.goto(`${base}#/${route}`); await page.locator('h1').waitFor(); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} overflows at ${width}`); }
  }
  assert.deepEqual(errors, []); console.log('PASS: actual backend contract, login/admin/user guards, blogs/tools CRUD, archive/restore, HTML safety, logout and responsive pages.');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
