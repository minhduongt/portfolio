import assert from 'node:assert/strict';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5173/portfolio/';
const url = page => `${base}design-preview.html?frame=1&concept=mix&page=${page}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}design-preview/portfolio`);
  await page.getByRole('button', { name: 'Mixed preview', exact: true }).waitFor();
  await page.clock.install();
  await page.goto(url('portfolio'));
  const quote = page.locator('.quote-text');
  const first = await quote.textContent();
  await page.getByRole('button', { name: 'Next quote', exact: true }).click();
  assert.notEqual(await quote.textContent(), first, 'Manual change avoids the current quote');
  const manual = await quote.textContent();
  await page.clock.fastForward(8100);
  assert.notEqual(await quote.textContent(), manual, 'Automatic rotation after 8 seconds');
  await page.getByRole('button', { name: 'Pause quotes', exact: true }).click();
  const paused = await quote.textContent();
  await page.clock.fastForward(16000);
  assert.equal(await quote.textContent(), paused);
  await page.clock.resume();
  const story = page.locator('.layer-story');
  await story.scrollIntoViewIfNeeded();
  const start = await story.evaluate(element => element.getBoundingClientRect().top + scrollY);
  await page.evaluate(y => scrollTo({ top: y + 20, behavior: 'instant' }), start);
  await page.waitForTimeout(350);
  await page.locator('.layer-scene canvas').waitFor();
  const compact = await page.locator('.layer-scene canvas').screenshot();
  await page.evaluate(y => scrollTo({ top: y + 700, behavior: 'instant' }), start);
  await page.waitForTimeout(350);
  const expanded = await page.locator('.layer-scene canvas').screenshot();
  assert(!expanded.equals(compact), 'Scroll changes rendered 3D layers');
  await page.setViewportSize({ width: 1440, height: 600 });
  await page.evaluate(y => scrollTo({ top: y + 300, behavior: 'instant' }), start);
  await page.waitForTimeout(250);
  assert(await page.locator('.layer-selectors').evaluate(element => element.getBoundingClientRect().bottom <= innerHeight), 'Layer buttons fit a short desktop viewport');
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.getByRole('link', { name: 'Blogs', exact: true }).click();
  await page.getByRole('heading', { name: 'Notes from the build.', exact: true }).waitFor();
  await page.getByLabel('Search articles').fill('PWA');
  assert.equal(await page.locator('.blog-card').count(), 1);
  await page.getByRole('link', { name: /Making a PWA feel useful/ }).click();
  await page.getByRole('link', { name: 'Back to all posts', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Tools', exact: true }).click();
  await page.getByRole('button', { name: 'JSON Formatter', exact: true }).click();
  await page.getByLabel('JSON input').fill('{"hello":"moon","items":[1,2]}');
  await page.getByRole('button', { name: 'Format JSON', exact: true }).click();
  assert.deepEqual(JSON.parse(await page.getByLabel('Formatted JSON').inputValue()), { hello: 'moon', items: [1, 2] });
  await page.getByLabel('JSON input').fill('{bad');
  await page.getByRole('button', { name: 'Format JSON', exact: true }).click();
  assert.match(await page.getByRole('alert').textContent(), /valid JSON/i);
  for (const invalidNumber of ['{"id":9007199254740993}', '{"number":1e400}']) {
    await page.getByLabel('JSON input').fill(invalidNumber);
    await page.getByRole('button', { name: 'Format JSON', exact: true }).click();
    assert.match(await page.getByRole('alert').textContent(), /precision/i);
    assert.equal(await page.getByLabel('Formatted JSON').inputValue(), '');
  }
  await page.getByRole('button', { name: 'URL Encoder / Decoder', exact: true }).click();
  await page.getByLabel('URL input').fill('hello moon /');
  await page.getByRole('button', { name: 'Encode', exact: true }).click();
  assert.equal(await page.getByLabel('URL output').inputValue(), 'hello%20moon%20%2F');
  await page.getByLabel('URL input').fill('hello%20moon%20%2F');
  await page.getByRole('button', { name: 'Decode', exact: true }).click();
  assert.equal(await page.getByLabel('URL output').inputValue(), 'hello moon /');
  await page.getByRole('button', { name: 'Word Counter', exact: true }).click();
  await page.getByLabel('Text to count').fill('Hello moon.\nBuild useful things.');
  assert.equal(await page.locator('[data-count="words"]').textContent(), '5');
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    for (const name of ['portfolio', 'blogs', 'tools']) {
      await page.goto(url(name));
      await page.locator('h1').waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} overflows at ${width}`);
      if ([1440, 390].includes(width)) await page.screenshot({ path: `.tmp/screenshots/mix-${name}-${width}.png`, fullPage: true });
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url('portfolio'));
  assert.equal(await page.getByRole('button', { name: 'Play quotes', exact: true }).count(), 1);
  assert.equal(await page.locator('.layer-step').count(), 3);
  const stillQuote = await page.locator('.quote-text').textContent();
  await page.getByRole('button', { name: 'Next quote', exact: true }).click();
  assert.notEqual(await page.locator('.quote-text').textContent(), stillQuote);
  assert.deepEqual(errors, []);
  console.log('PASS: mixed preview, random/timed/paused quotes, rendered scroll layers, blog search/article, tools and responsive pages.');
} finally { await browser.close(); }
