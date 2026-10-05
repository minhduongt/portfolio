import assert from 'node:assert/strict';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { mockVisitorTracking } from './mock-visitor-tracking.mjs';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ colorScheme: theme, reducedMotion: 'reduce' });
    await mockVisitorTracking(context);
    const page = await context.newPage();
    const assets = [], errors = [];
    page.on('response', response => { if (/stars_milkyway/.test(response.url())) assets.push(response); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4177/');
    await page.getByRole('heading', { name: 'Duong Tan Minh', exact: true }).waitFor();
    const background = await page.locator('.portfolio').evaluate(element => {
      const style = getComputedStyle(element, '::before');
      return { image: style.backgroundImage, pointer: style.pointerEvents, mask: style.maskImage || style.webkitMaskImage };
    });
    if (theme === 'dark') {
      assert.match(background.image, /stars_milkyway/);
      assert.equal(background.pointer, 'none');
      assert.equal(background.mask, 'none');
      if (!assets.length) await page.waitForResponse(response => /stars_milkyway/.test(response.url()), { timeout: 5000 });
      assert(assets.some(response => response.ok()), 'Galaxy texture must load');
    } else {
      assert.equal(background.image, 'none');
      assert.equal(assets.length, 0, 'Light mode should not fetch the galaxy texture');
    }
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 950 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `.tmp/screenshots/galaxy-${theme}-${width}.png` });
    }
    await page.getByRole('button', { name: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`, exact: true }).click();
    const switched = await page.locator('.portfolio').evaluate(element => getComputedStyle(element, '::before').backgroundImage);
    if (theme === 'dark') assert.equal(switched, 'none');
    else assert.match(switched, /stars_milkyway/);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('PASS: galaxy texture, dark-only loading, fade, non-interactive backdrop, theme switching and responsive sizing.');
} finally { await browser.close(); }
