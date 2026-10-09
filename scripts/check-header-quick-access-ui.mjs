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
const bar = page.locator('.pinned-tools-bar');
const open = name => bar.getByRole('link', { name: `Open ${name}`, exact: true });
try {
  await page.goto(base + 'tools'); await page.getByRole('button', { name: 'JSON Formatter', exact: true }).waitFor();
  await page.getByLabel('JSON input', { exact: true }).fill('{"draft":true}');
  await page.getByPlaceholder('Search tools', { exact: true }).fill('JSON');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    const expanded = await page.locator('.tool-workspace-slot').boundingBox();
    const toggle = page.getByRole('button', { name: 'Collapse tool list', exact: true });
    assert.equal(await toggle.getAttribute('aria-controls'), 'tool-list-panel');
    await toggle.focus(); await page.keyboard.press('Enter');
    assert.equal(await page.getByRole('button', { name: 'Expand tool list', exact: true }).getAttribute('aria-expanded'), 'false');
    assert.equal(await page.getByRole('button', { name: 'JSON Formatter', exact: true }).count(), 0, 'Hidden list controls leave the accessibility tree');
    const collapsed = await page.locator('.tool-workspace-slot').boundingBox();
    if (width > 700) assert(collapsed.width > expanded.width + 200, 'Collapsing gives the workspace the sidebar width');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Collapsed panel fits ${width}`);
    assert.equal(await page.locator('.tool-workspace-slot textarea').first().inputValue(), '{"draft":true}', 'Draft survives collapse');
    await page.getByRole('button', { name: 'Expand tool list', exact: true }).click();
    assert.equal(await page.getByPlaceholder('Search tools', { exact: true }).inputValue(), 'JSON', 'Search survives expansion');
  }
  await page.locator('.language-switcher button[lang="vi"]').click();
  await page.getByRole('button', { name: 'Thu gọn danh sách công cụ', exact: true }).click();
  await page.getByRole('button', { name: 'Mở danh sách công cụ', exact: true }).click();
  await page.locator('.language-switcher button[lang="en"]').click();
  await page.getByPlaceholder('Search tools', { exact: true }).fill('');
  await page.setViewportSize({ width: 390, height: 844 });
  await bar.waitFor({ state: 'hidden' }); assert.equal(await page.getByText('hidden-private').count(), 0, 'Hidden pins are not restored as accessible tools');
  await page.getByRole('button', { name: 'Pin URL Encoder / Decoder', exact: true }).click(); await open('URL Encoder / Decoder').waitFor();
  assert.equal(new URL(await open('URL Encoder / Decoder').getAttribute('href'), base).searchParams.get('tool'), 'url-encoder');
  assert.equal(await page.locator('.site-nav .pinned-tools-bar').count(), 0, 'Bar is outside the header');
  assert(await bar.evaluate(node => node.previousElementSibling?.classList.contains('page-heading')), 'Pinned bar follows the Tools title');
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
  await page.locator('.wordmark').click(); await page.locator('.quote-text').waitFor();
  assert.equal(await bar.count(), 0, 'Pinned bar is absent on the portfolio page');
  await page.locator('.menu-button').click(); await page.getByRole('link', { name: 'About', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#about').getBoundingClientRect().top <= document.querySelector('.site-nav').getBoundingClientRect().bottom + 48);
  assert(await page.locator('#about').evaluate(node => node.getBoundingClientRect().top >= document.querySelector('.site-nav').getBoundingClientRect().bottom - 1), 'Section navigation accounts for the quick bar after dismissing the mobile menu');
  await page.goto(base + 'blogs'); await page.locator('.page-heading').waitFor(); assert.equal(await bar.count(), 0, 'Pinned bar is absent on the blogs page');
  await page.goto(base + 'tools'); await open('URL Encoder / Decoder').click(); await page.getByRole('heading', { name: 'URL Encoder / Decoder', exact: true }).waitFor();
  await page.reload(); await page.getByRole('heading', { name: 'URL Encoder / Decoder', exact: true }).waitFor(); await open('URL Encoder / Decoder').waitFor();
  await page.getByRole('button', { name: 'Unpin URL Encoder / Decoder', exact: true }).click(); assert.equal(await open('URL Encoder / Decoder').count(), 0, 'Unpin updates the header immediately');
  const other = await context.newPage(); await other.goto(base + 'blogs'); await other.evaluate(key => localStorage.setItem(key, '["custom-json"]'), pinnedToolsKey);
  await page.waitForFunction(() => document.querySelectorAll('.pinned-tools-bar a').length === 1); assert(await open('JSON Formatter').isVisible(), 'Storage changes synchronize across tabs'); await other.close();
  await page.locator('.language-switcher button[lang="vi"]').click(); assert.equal(await page.locator('.pinned-tools-bar__label').innerText(), 'Đã ghim'); await page.locator('.language-switcher button[lang="en"]').click();
  await page.getByRole('button', { name: 'Pin URL Encoder / Decoder', exact: true }).click(); await page.getByRole('button', { name: 'Pin Members tool', exact: true }).click();
  for (const width of [320, 390, 768, 1440]) { await page.setViewportSize({ width, height: 950 }); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Header fits ${width}`); }
  await page.setViewportSize({ width: 320, height: 844 }); assert(await page.locator('.pinned-tools-bar__list').evaluate(node => node.scrollWidth > node.clientWidth), 'Multiple pins scroll inside the compact bar');
  await page.getByRole('button', { name: 'Unpin URL Encoder / Decoder', exact: true }).click(); await page.getByRole('button', { name: 'Unpin Members tool', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 }); await open('JSON Formatter').click();
  await page.getByRole('heading', { name: 'JSON Formatter', exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelector('.tool-workspace-slot').getBoundingClientRect().top <= document.querySelector('.site-nav').getBoundingClientRect().bottom + 48);
  mkdirSync('.tmp/screenshots', { recursive: true }); await page.screenshot({ path: '.tmp/screenshots/pinned-tools-bar-mobile.png' });
  await page.getByRole('button', { name: 'Unpin JSON Formatter', exact: true }).click(); await bar.waitFor({ state: 'hidden' });
  assert.equal(await page.locator('.pinned-tools-bar').count(), 0, 'No bar when nothing is pinned');
  assert.deepEqual(errors, []);
  console.log('Tools page quick access passed: live pin/unpin, exact slug selection, SPA/deep links, member lock, hidden pins, Tools-only placement, cross-tab persistence, Vietnamese, focus/scroll and four widths.');
} finally { await browser.close(); }
