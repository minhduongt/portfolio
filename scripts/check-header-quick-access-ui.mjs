import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { pinnedToolsKey } from '../src/site/toolPreferences.js';
const base = process.env.SITE_URL || 'http://127.0.0.1:4177/portfolio/';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const page = await context.newPage(), errors = [];
const records = [
  { slug: 'custom-json', component: 'json-formatter', name: 'JSON Formatter', category: 'Data', visibility: 'public' },
  { slug: 'url-encoder', component: 'url-encoder-decoder', name: 'URL Encoder / Decoder', category: 'Web', visibility: 'public' },
  { slug: 'member-tool', name: 'Members tool', category: 'Writing', visibility: 'limited', locked: true },
];
let unavailable = false;
page.on('pageerror', error => errors.push(error.message));
await context.route('**/api/v1/**', async route => {
  const path = new URL(route.request().url()).pathname;
  const data = path.endsWith('/tools') ? records : path.includes('/visitors/') ? { activeVisitors: 1, totalVisits: 1 } : [];
  return route.fulfill({ status: path.endsWith('/tools') && unavailable ? 503 : 200, json: { success: !unavailable || !path.endsWith('/tools'), data } });
});
await context.addInitScript(key => { if (!localStorage.getItem(key)) localStorage.setItem(key, '["hidden-private"]'); }, pinnedToolsKey);
const bar = page.locator('.header-quick-access');
const open = name => bar.getByRole('link', { name: `Open ${name}`, exact: true });
try {
  await page.goto(base + 'tools'); await page.getByRole('button', { name: 'JSON Formatter', exact: true }).waitFor();
  await bar.waitFor({ state: 'hidden' }); assert.equal(await page.getByText('hidden-private').count(), 0, 'Hidden pins are not restored as accessible tools');
  await page.getByRole('button', { name: 'Pin URL Encoder / Decoder', exact: true }).click(); await open('URL Encoder / Decoder').waitFor();
  assert.equal(new URL(await open('URL Encoder / Decoder').getAttribute('href'), base).searchParams.get('tool'), 'url-encoder');
  await page.evaluate(() => { window.quickAccessDocument = 'same document'; });
  await open('URL Encoder / Decoder').click(); await page.getByRole('heading', { name: 'URL Encoder / Decoder', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.quickAccessDocument), 'same document', 'Shortcut navigates without reloading');
  assert.equal(new URL(page.url()).searchParams.get('tool'), 'url-encoder');
  await page.waitForFunction(() => document.querySelector('.tool-workspace-slot') === document.activeElement);
  assert(await page.evaluate(() => document.querySelector('.tool-workspace-slot').getBoundingClientRect().top >= document.querySelector('.site-nav').getBoundingClientRect().bottom - 1), 'Workspace is visible below the expanded sticky header');
  await page.getByRole('button', { name: 'JSON Formatter', exact: true }).click(); await page.getByRole('heading', { name: 'JSON Formatter', exact: true }).waitFor();
  await open('URL Encoder / Decoder').click(); await page.getByRole('heading', { name: 'URL Encoder / Decoder', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.quickAccessDocument), 'same document', 'Repeated shortcut selects its tool even when the URL is unchanged');
  await page.getByRole('button', { name: 'Pin Members tool', exact: true }).click(); await open('Members tool').click(); await page.locator('.tool-access-lock').waitFor();
  assert.equal(await page.locator('textarea').count(), 0, 'Member shortcut preserves the sign-in lock');
  await page.goBack(); await page.getByRole('heading', { name: 'URL Encoder / Decoder', exact: true }).waitFor();
  await page.goForward(); await page.locator('.tool-access-lock').waitFor();
  await page.getByRole('button', { name: 'Pin JSON Formatter', exact: true }).click(); await open('JSON Formatter').waitFor();
  await page.locator('.wordmark').click(); await page.locator('.quote-text').waitFor(); await open('URL Encoder / Decoder').waitFor();
  assert.equal(await bar.locator('a').count(), 3, 'Pinned shortcuts stay available on the portfolio page');
  await page.locator('.menu-button').click(); await page.getByRole('link', { name: 'About', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#about').getBoundingClientRect().top <= document.querySelector('.site-nav').getBoundingClientRect().bottom + 48);
  assert(await page.locator('#about').evaluate(node => node.getBoundingClientRect().top >= document.querySelector('.site-nav').getBoundingClientRect().bottom - 1), 'Section navigation accounts for the quick bar after dismissing the mobile menu');
  await open('URL Encoder / Decoder').click(); await page.getByRole('heading', { name: 'URL Encoder / Decoder', exact: true }).waitFor();
  await page.reload(); await page.getByRole('heading', { name: 'URL Encoder / Decoder', exact: true }).waitFor(); await open('URL Encoder / Decoder').waitFor();
  await page.getByRole('button', { name: 'Unpin URL Encoder / Decoder', exact: true }).click(); assert.equal(await open('URL Encoder / Decoder').count(), 0, 'Unpin updates the header immediately');
  const other = await context.newPage(); await other.goto(base + 'blogs'); await other.evaluate(key => localStorage.setItem(key, '["custom-json"]'), pinnedToolsKey);
  await page.waitForFunction(() => document.querySelectorAll('.header-quick-access a').length === 1); assert(await open('JSON Formatter').isVisible(), 'Storage changes synchronize across tabs'); await other.close();
  await page.locator('.language-switcher button[lang="vi"]').click(); assert.equal(await page.locator('.header-quick-access__label').innerText(), 'Đã ghim'); await page.locator('.language-switcher button[lang="en"]').click();
  await page.getByRole('button', { name: 'Pin URL Encoder / Decoder', exact: true }).click(); await page.getByRole('button', { name: 'Pin Members tool', exact: true }).click();
  for (const width of [320, 390, 768, 1440]) { await page.setViewportSize({ width, height: 950 }); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Header fits ${width}`); }
  await page.setViewportSize({ width: 320, height: 844 }); assert(await page.locator('.header-quick-access__list').evaluate(node => node.scrollWidth > node.clientWidth), 'Multiple pins scroll inside the compact bar');
  await page.getByRole('button', { name: 'Unpin URL Encoder / Decoder', exact: true }).click(); await page.getByRole('button', { name: 'Unpin Members tool', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 }); await page.locator('.menu-button').click(); await open('JSON Formatter').click(); assert.equal(await page.locator('.menu-button').getAttribute('aria-expanded'), 'false');
  await page.getByRole('heading', { name: 'JSON Formatter', exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelector('.tool-workspace-slot').getBoundingClientRect().top <= document.querySelector('.site-nav').getBoundingClientRect().bottom + 48);
  mkdirSync('.tmp/screenshots', { recursive: true }); await page.screenshot({ path: '.tmp/screenshots/header-quick-access-mobile.png' });
  await page.getByRole('button', { name: 'Unpin JSON Formatter', exact: true }).click(); await bar.waitFor({ state: 'hidden' });
  assert.equal(await page.locator('.header-quick-access').count(), 0, 'No bar when nothing is pinned');
  unavailable = true; await page.getByRole('button', { name: 'Pin JSON Formatter', exact: true }).click(); await page.getByRole('button', { name: 'Pinned tools unavailable. Retry', exact: true }).waitFor();
  unavailable = false; await page.getByRole('button', { name: 'Pinned tools unavailable. Retry', exact: true }).click(); await open('JSON Formatter').waitFor();
  assert.deepEqual(errors, []);
  console.log('Header quick access passed: live pin/unpin, exact slug selection, SPA/deep links, member lock, hidden pins, cross-page/tab persistence, Vietnamese, focus/scroll and four widths.');
} finally { await browser.close(); }
