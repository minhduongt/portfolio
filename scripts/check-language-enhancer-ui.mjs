import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage(), requests = [], errors = [];
let delay = 0, status = 200, malformed = false;
page.on('pageerror', error => errors.push(error.message));
await context.route('https://identitytoolkit.googleapis.com/**', async route => {
  const now = Math.floor(Date.now() / 1000), role = 'reader';
  const token = `${Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')}.${Buffer.from(JSON.stringify({ aud: 'dtminh-dev', iss: 'https://securetoken.google.com/dtminh-dev', sub: role, user_id: role, email: 'reader@example.com', email_verified: true, auth_time: now, iat: now, exp: now + 3600, firebase: { sign_in_provider: 'password', identities: { email: ['reader@example.com'] } } })).toString('base64url')}.fixture`;
  await route.fulfill({ json: route.request().url().includes('accounts:lookup') ? { users: [{ localId: role, email: 'reader@example.com', emailVerified: true, providerUserInfo: [{ providerId: 'password', email: 'reader@example.com' }] }] } : { localId: role, email: 'reader@example.com', idToken: token, refreshToken: 'fixture-refresh', expiresIn: '3600' } });
});
await context.route('**/api/v1/**', async route => {
  const request = route.request(), path = new URL(request.url()).pathname;
  if (path.endsWith('/language-enhancer')) {
    const body = request.postDataJSON(); requests.push({ body, auth: request.headers().authorization });
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    const result = body.mode === 'sentence' ? { alternatives: Array.from({ length: 3 }, (_, index) => ({ text: index === 0 ? '<script>window.injected=true</script> Improved sentence.' : 'Another improved sentence.', explanation: 'Natural wording.', context: 'Everyday conversation.' })) } : { meaning: 'Feeling pleased.', partOfSpeech: 'Adjective', synonyms: [{ word: 'glad', meaning: 'Pleased.', example: 'I am glad.', context: 'Conversation.' }], antonyms: [], examples: [{ text: 'I am happy.', explanation: 'Describes a feeling.', context: 'Everyday speech.' }], notes: 'Meaning depends on context.' };
    return route.fulfill({ status, headers: { 'Retry-After': '75', 'Access-Control-Expose-Headers': 'Retry-After' }, json: status !== 200 ? { success: false, code: status === 429 ? 'LANGUAGE_RATE_LIMITED' : 'LANGUAGE_UNAVAILABLE', message: 'PRIVATE provider details' } : { success: true, data: { ...body, result: malformed ? {} : result } } });
  }
  const data = path.includes('/visitors/') ? { activeVisitors: 1, totalVisits: 1 } : path.endsWith('/auth/me') ? { uid: 'reader', role: 'user' } : path.endsWith('/tools') ? [{ slug: 'language-enhancer', component: 'language-enhancer', name: 'Language Enhancer', description: 'Improve sentences or explore vocabulary with AI, in English or Vietnamese.', visibility: 'public', category: 'Writing' }] : {};
  return route.fulfill({ json: { success: true, data } });
});
const base = process.env.SITE_URL || 'http://127.0.0.1:4177/portfolio/';
try {
  await page.goto(base + 'tools'); await page.locator('.tool-access-lock').waitFor();
  assert.equal(await page.locator('.language-enhancer-form').count(), 0, 'Guest cannot mount AI even when metadata incorrectly says public');
  assert.equal(requests.length, 0);
  await page.goto(base + 'login'); await page.getByLabel('Email', { exact: true }).fill('reader@example.com'); await page.getByLabel('Password', { exact: true }).fill('fixture-password'); await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await page.getByRole('button', { name: 'Sign out', exact: true }).waitFor();
  await page.goto(base + 'tools'); await page.locator('.language-enhancer-form').waitFor();
  assert((await page.locator('.workspace-heading').innerText()).includes('AI WRITING TOOL'));
  const area = page.locator('.language-enhancer-form textarea');
  await area.fill('I very like English.'); await page.getByLabel('Explanation language').selectOption('vi'); await page.getByLabel('Tone').selectOption('professional');
  await page.getByLabel('Audience or situation').fill('An email to a recruiter');
  await page.getByRole('button', { name: 'Improve wording', exact: true }).click(); await page.locator('.language-results').waitFor();
  assert.match(requests[0].auth, /^Bearer /u); assert.equal(requests[0].body.tone, 'professional'); assert.equal(requests[0].body.explanationLanguage, 'vi');
  assert.equal(await page.locator('.language-result-card').count(), 3); assert.equal(await page.locator('.language-results script').count(), 0); assert.equal(await page.evaluate(() => window.injected), undefined);
  await page.getByRole('button', { name: 'Explore vocabulary', exact: true }).click(); await area.fill('happy'); await page.getByRole('button', { name: 'Explore word', exact: true }).click(); await page.getByText('Feeling pleased.', { exact: true }).waitFor();
  assert(!Object.hasOwn(requests[1].body, 'tone')); assert(await page.getByText('No meaningful opposite was found for this meaning.').isVisible());
  await page.locator('.language-switcher button[lang="vi"]').click(); assert.equal(await area.inputValue(), 'happy'); assert(await page.getByText('Từ đồng nghĩa', { exact: true }).isVisible());
  mkdirSync('.tmp/screenshots', { recursive: true });
  for (const width of [320, 390, 768, 1440]) { await page.setViewportSize({ width, height: 950 }); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Language tool fits ${width}`); }
  await page.setViewportSize({ width: 390, height: 950 }); await page.locator('.language-enhancer-form').scrollIntoViewIfNeeded(); await page.screenshot({ path: '.tmp/screenshots/language-enhancer-mobile.png' });
  await page.getByRole('button', { name: 'Trau chuốt câu văn', exact: true }).click(); assert.equal(await area.inputValue(), 'I very like English.', 'Modes preserve separate drafts');
  delay = 1200; await page.getByRole('button', { name: 'Gợi ý cách diễn đạt', exact: true }).click();
  await page.locator('.language-enhancer-form .loading-indicator__spinner').waitFor();
  assert.equal(await page.locator('.language-enhancer-form .loading-indicator__spinner').evaluate(node => getComputedStyle(node).animationName), 'loading-orbit');
  assert.equal(await page.locator('.language-enhancer-form .loading-indicator .sr-only').evaluate(node => getComputedStyle(node).position), 'absolute');
  await page.getByRole('button', { name: 'Hủy yêu cầu', exact: true }).click(); await new Promise(resolve => setTimeout(resolve, 1300)); delay = 0;
  assert.equal(await page.locator('.language-results').count(), 0); assert.equal(await area.inputValue(), 'I very like English.');
  malformed = true; await page.getByRole('button', { name: 'Gợi ý cách diễn đạt', exact: true }).click(); await page.getByRole('alert').waitFor(); assert((await page.getByRole('alert').innerText()).includes('chưa đầy đủ')); malformed = false;
  status = 503; await page.getByRole('button', { name: 'Gợi ý cách diễn đạt', exact: true }).click(); await page.waitForFunction(() => document.querySelector('.tool-error')?.textContent.includes('chưa thể phản hồi')); assert(!(await page.getByRole('alert').innerText()).includes('PRIVATE'));
  status = 429; await page.getByRole('button', { name: 'Gợi ý cách diễn đạt', exact: true }).click(); await page.waitForFunction(() => document.querySelector('.tool-error')?.textContent.includes('giới hạn')); assert(await page.getByRole('button', { name: 'Gợi ý cách diễn đạt', exact: true }).isDisabled());
  assert.deepEqual(errors, []); console.log('Language tool: authenticated payloads, guest lock, both modes, safe structured results, drafts, bilingual/mobile UI, cancel, malformed results and quota failures passed.');
} finally { await browser.close(); }
