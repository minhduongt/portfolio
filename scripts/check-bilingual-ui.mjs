import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { mockVisitorTracking } from './mock-visitor-tracking.mjs';

const base = process.env.SITE_URL || 'http://127.0.0.1:4177/portfolio/';
const vi = Object.assign({}, ...['common', 'account', 'portfolio', 'tools'].map(name => JSON.parse(readFileSync(new URL(`../src/i18n/locales/vi/${name}.json`, import.meta.url), 'utf8')).messages));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];
async function setup(context) {
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await mockVisitorTracking(page);
  await context.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const article = { slug: 'authored', title: 'Authored title', excerpt: 'Original excerpt', contentHtml: '<p>Original authored content</p>', tags: ['React', 'Original tag'], visibility: 'public', createdAt: '2026-10-07T08:00:00Z' };
    if (path.endsWith('/blogs/missing')) return route.fulfill({ status: 503, body: 'Unavailable', contentType: 'text/plain' });
    const data = path.endsWith('/blogs/authored') ? article : path.endsWith('/blogs') ? [article] : path.endsWith('/tools') ? [{ slug: 'url', name: 'URL Encoder / Decoder', component: 'url-encoder-decoder', visibility: 'public' }, { slug: 'email', name: 'HTML Email Builder', component: 'html-email-builder', visibility: 'public' }] : {};
    return route.fulfill({ json: { success: true, data } });
  });
  return page;
}
const switchTo = async (page, language) => {
  const button = page.locator(`.language-switcher button[lang="${language}"]`);
  await button.focus(); await button.press('Enter');
  await page.waitForFunction(lang => document.documentElement.lang === lang, language);
  assert.equal(await button.getAttribute('aria-pressed'), 'true');
};
try {
  const context = await browser.newContext({ locale: 'vi-VN', reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
  const page = await setup(context);
  await page.goto(base);
  await page.locator('.language-switcher').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en', 'English is default even for a Vietnamese browser');
  await page.evaluate(() => { window.languageTestDocument = true; window.languageTestCanvases = [...document.querySelectorAll('canvas')]; });
  await switchTo(page, 'vi');
  assert(await page.getByRole('link', { name: 'Giới thiệu', exact: true }).count());
  await page.waitForFunction(() => document.querySelector('meta[name="description"]').content.includes('kinh nghiệm'));
  assert(await page.evaluate(() => window.languageTestDocument && window.languageTestCanvases.every(node => node.isConnected)), 'Switching does not reload or remove existing canvas nodes');
  for (const language of ['en', 'vi']) for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 }); await switchTo(page, language);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${language} portfolio fits ${width}px`);
    assert(await page.locator('.language-switcher').isVisible());
  }
  mkdirSync('.tmp/screenshots', { recursive: true });
  await page.setViewportSize({ width: 390, height: 950 });
  await page.screenshot({ path: '.tmp/screenshots/bilingual-vi-mobile.png' });
  await page.reload(); await page.locator('.language-switcher').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'vi');
  await page.goto(base + 'blogs');
  await page.getByRole('link', { name: /Authored title/ }).waitFor();
  assert((await page.locator('.blog-card').innerText()).includes('Original tag'));
  assert((await page.locator('.blog-card').innerText()).includes('Tạo ngày'));
  await page.getByRole('link', { name: /Authored title/ }).click();
  await page.getByText('Original authored content', { exact: true }).waitFor();
  await switchTo(page, 'en'); await switchTo(page, 'vi');
  assert.equal(await page.title(), 'Authored title — Minh Duong');
  assert(await page.getByText('Original authored content', { exact: true }).isVisible());
  await page.goto(base + 'blogs/missing');
  await page.getByRole('alert').waitFor();
  assert.match(await page.getByRole('alert').innerText(), /Dịch vụ nội dung gặp lỗi \(503\)/u);
  assert.equal(await page.title(), 'Chưa thể tải nội dung. — Minh Duong');
  await switchTo(page, 'en'); await page.goto(base + 'tools');
  await page.getByLabel('URL input', { exact: true }).fill('Xin chào / original text');
  await page.getByRole('button', { name: 'Encode', exact: true }).click();
  const output = await page.locator('textarea[readonly]').inputValue();
  await switchTo(page, 'vi');
  assert.equal(await page.locator('.tool-editor-grid textarea:not([readonly])').inputValue(), 'Xin chào / original text');
  assert((await page.locator('.tool-editor-grid').innerText()).includes(vi['URL input']), 'Tool label switches to Vietnamese');
  assert.equal(await page.locator('textarea[readonly]').inputValue(), output);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Vietnamese tool fits ${width}px`);
  }
  await page.getByRole('button', { name: 'HTML Email Builder', exact: true }).click();
  await page.getByRole('button', { name: vi['HTML editor'], exact: true }).click();
  const source = page.locator('.email-source');
  assert((await source.inputValue()).includes('<html lang="vi">'), 'Vietnamese starter email has Vietnamese document language');
  await source.fill('<html lang="vi"><body>Original email draft</body></html>');
  await switchTo(page, 'en');
  assert((await source.inputValue()).includes('Original email draft'), 'Switching preserves custom email HTML');
  await page.goto(base);
  await page.locator('.contact-form').waitFor();
  await page.locator('.contact-form input[name="name"]').fill('Original contact name');
  await switchTo(page, 'vi');
  assert.equal(await page.locator('.contact-form input[name="name"]').inputValue(), 'Original contact name');
  await page.locator('.contact-form button[type="submit"]').click();
  assert.equal(await page.locator('.contact-form input[name="email"]').evaluate(node => node.validationMessage), 'Vui lòng điền thông tin này.');
  await page.goto(base + 'login');
  await page.getByLabel(vi.Email, { exact: true }).fill('original@example.com');
  await switchTo(page, 'en');
  assert.equal(await page.getByLabel('Email', { exact: true }).inputValue(), 'original@example.com');
  await switchTo(page, 'vi');
  await page.locator('form button.auth-submit').click();
  assert.equal(await page.locator('input[autocomplete="current-password"]').evaluate(node => node.validationMessage), 'Vui lòng điền thông tin này.');
  await page.goto(base + 'design-preview.html?frame=1&concept=mix&page=portfolio');
  await page.locator('.language-switcher').waitFor(); await switchTo(page, 'vi');
  await context.close();
  const blocked = await browser.newContext({ reducedMotion: 'reduce' });
  await blocked.addInitScript(() => {
    const read = Storage.prototype.getItem, write = Storage.prototype.setItem;
    Storage.prototype.getItem = function(key) { if (key === 'portfolio.language') throw new Error('blocked'); return read.call(this, key); };
    Storage.prototype.setItem = function(key, value) { if (key === 'portfolio.language') throw new Error('blocked'); return write.call(this, key, value); };
  });
  const blockedPage = await setup(blocked); await blockedPage.goto(base);
  await blockedPage.locator('.language-switcher').waitFor();
  assert.equal(await blockedPage.locator('html').getAttribute('lang'), 'en');
  await switchTo(blockedPage, 'vi'); await blockedPage.reload();
  await blockedPage.locator('.language-switcher').waitFor();
  assert.equal(await blockedPage.locator('html').getAttribute('lang'), 'en');
  assert.deepEqual(errors, []);
  console.log('PASS: English default, keyboard switching, persistence, metadata, authored content, tool/form state, mobile layouts, preview and blocked storage.');
} finally { await browser.close(); }
