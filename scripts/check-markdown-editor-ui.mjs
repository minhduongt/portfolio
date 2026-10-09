import assert from 'node:assert/strict';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { mockVisitorTracking } from './mock-visitor-tracking.mjs';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = []; page.on('pageerror', error => errors.push(error.message));
await mockVisitorTracking(page);
await page.route('**/api/v1/**', route => route.fulfill({ json: { success: true, data: route.request().url().includes('/visitors/') ? { activeVisitors: 1, totalVisits: 1 } : [{ slug: 'markdown', name: 'Markdown Editor', component: 'markdown-editor', visibility: 'public' }] } }));
try {
  await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4177/portfolio/tools');
  const source = page.getByLabel('Markdown source', { exact: true });
  await source.waitFor({ timeout: 10000 });
  await source.fill('A useful idea'); await source.evaluate(area => { area.focus(); area.setSelectionRange(2, 8); });
  await page.locator('.markdown-toolbar').getByRole('button', { name: 'Bold', exact: true }).click();
  assert.equal(await source.inputValue(), 'A **useful** idea');
  await page.locator('.markdown-preview strong').waitFor();
  assert.equal(await source.evaluate(area => area === document.activeElement && area.value.slice(area.selectionStart, area.selectionEnd)), 'useful');
  await source.fill('one\ntwo'); await source.evaluate(area => { area.focus(); area.setSelectionRange(0, 7); });
  await page.getByRole('button', { name: 'Numbered list', exact: true }).click();
  assert.equal(await source.inputValue(), '1. one\n2. two');
  assert.equal(await page.locator('.markdown-preview ol li').count(), 2);
  await source.fill(''); await page.getByRole('button', { name: 'Heading', exact: true }).focus(); await page.keyboard.press('Enter');
  assert.equal(await source.inputValue(), '## Your heading');
  assert.equal(await source.evaluate(area => area.value.slice(area.selectionStart, area.selectionEnd)), 'Your heading');
  await page.keyboard.type('My note'); assert.equal(await source.inputValue(), '## My note');
  await source.fill('Read more'); await source.evaluate(area => { area.focus(); area.setSelectionRange(0, 9); });
  await page.getByRole('button', { name: 'Link', exact: true }).click();
  assert.equal(await source.evaluate(area => area.value.slice(area.selectionStart, area.selectionEnd)), 'https://example.com');
  await page.keyboard.type('https://example.org/docs');
  assert.equal(await page.locator('.markdown-preview a').getAttribute('href'), 'https://example.org/docs');
  await page.locator('.markdown-guide summary').click(); assert(await page.locator('.markdown-guide table').isVisible());
  const original = await source.inputValue(); await page.locator('.language-switcher button[lang="vi"]').click();
  assert.equal(await page.locator('.markdown-editor textarea').inputValue(), original, 'Language switching preserves authored text');
  assert(await page.getByRole('button', { name: 'In đậm', exact: true }).isVisible());
  assert(await page.getByText('Hướng dẫn nhanh Markdown', { exact: true }).isVisible());
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No editor overflow at ${width}`);
    assert(await page.locator('.markdown-toolbar button').evaluateAll(buttons => buttons.every(button => button.getBoundingClientRect().height >= 44)), 'Formatting targets are at least 44px high');
  }
  await page.setViewportSize({ width: 390, height: 900 }); await page.locator('.markdown-toolbar').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.tmp/screenshots/markdown-toolbar-mobile.png' });
  const area = page.locator('.markdown-editor textarea'); await area.fill('a'.repeat(50000)); await area.evaluate(element => { element.focus(); element.setSelectionRange(0, 1); });
  await page.getByRole('button', { name: 'In đậm', exact: true }).click(); await page.getByRole('alert').waitFor();
  assert.equal((await area.inputValue()).length, 50000, 'Toolbar respects the input limit');
  assert.deepEqual(errors, []);
  console.log('Markdown toolbar: selection, keyboard use, list preview, editable links, guide, bilingual drafts, limits and four widths passed.');
} catch (error) { console.error(errors, await page.locator('body').innerText()); throw error; }
finally { await browser.close(); }
