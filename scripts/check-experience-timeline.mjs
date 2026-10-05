import assert from 'node:assert/strict';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { mockVisitorTracking } from './mock-visitor-tracking.mjs';
import { experience } from '../src/site/content.js';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await mockVisitorTracking(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4177/');
  const timeline = page.getByRole('list', { name: 'Career timeline' });
  await timeline.waitFor({ timeout: 5000 });
  assert.equal(await timeline.locator(':scope > li').count(), experience.length);
  assert.equal(await timeline.getByText('Current role', { exact: true }).count(), 1);
  for (const [index, job] of experience.entries()) {
    const item = timeline.locator(':scope > li').nth(index);
    assert.equal(await item.locator('h3').textContent(), job.company);
    assert.equal(await item.locator('.experience-date').textContent(), job.dates);
    assert.equal(await item.locator('.experience-card li').count(), job.details.length);
  }
  for (const theme of ['dark', 'light']) {
    await page.emulateMedia({ colorScheme: theme });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await timeline.scrollIntoViewIfNeeded();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow: ${theme} ${width}`);
      const item = timeline.locator(':scope > li').first();
      const marker = await item.locator('.timeline-marker').boundingBox();
      const card = await item.locator('.experience-card').boundingBox();
      assert(marker.x + marker.width < card.x, 'Milestone must sit to the left of its card');
      assert.equal(await item.evaluate(element => getComputedStyle(element, '::before').width), '1px');
      await page.screenshot({ path: `.tmp/screenshots/timeline-${theme}-${width}.png` });
    }
  }
  assert.deepEqual(errors, []);
  console.log('PASS: chronological experience content, current-role marker, connected timeline and both themes at desktop/mobile widths.');
} finally { await browser.close(); }
