// Temporary browser tooling is outside the application dependencies.
// npm.cmd install --prefix .tmp/tooling --no-save --package-lock=false playwright@1.51.1
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5173/portfolio/';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
mkdirSync('.tmp/screenshots', { recursive: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto(`${base}design-preview.html?frame=1&concept=b`);
  await page.getByRole('heading', { name: 'Duong Tan Minh', exact: true }).waitFor();
  for (const y of [900, 1200, 1500, 1800]) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
    await page.waitForTimeout(150);
  }
  assert.equal(await page.locator('nav a[aria-current="location"]').textContent(), 'Work', 'Active section follows visible work, not departing About');
  await page.goto(`${base}design-preview/portfolio`);
  await page.getByRole('button', { name: 'Concept A', exact: true }).waitFor();
  for (const width of [1920, 1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    for (const concept of ['a', 'b', 'c']) {
      await page.goto(`${base}design-preview.html?frame=1&concept=${concept}`);
      await page.getByRole('heading', { name: 'Duong Tan Minh', exact: true }).waitFor();
      assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1);
      assert.equal(await page.locator('a[href="mailto:dtminh.dev@gmail.com"]').count(), 1);
      assert.equal(await page.getByText('DevDirect', { exact: true }).count(), 1);
      assert.equal(await page.getByRole('heading', { name: 'Mi-Jack Vietnam', exact: true }).count(), 1);
      assert.equal(await page.getByText('Apr 2025 — Apr 2026', { exact: true }).count(), 1);
      assert.equal(await page.getByRole('heading', { name: 'Acupressure Map', exact: true }).count(), 1);
      assert.equal(await page.getByRole('heading', { name: 'RE:SEARCH', exact: true }).count(), 1);
      assert.equal(await page.getByText('FINE Delivery', { exact: true }).count(), 0);
      assert.equal(await page.getByText('PhuongNamCompany', { exact: true }).count(), 1);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow: ${concept} at ${width}`);
      await page.locator('canvas').waitFor();
      if (width === 390) {
        await page.getByRole('button', { name: 'Menu', exact: true }).click();
        await page.getByRole('link', { name: 'Contact', exact: true }).click();
        assert.equal(new URL(page.url()).hash, '#contact');
        assert.equal(await page.getByRole('button', { name: 'Menu', exact: true }).getAttribute('aria-expanded'), 'false');
        await page.getByRole('link', { name: 'Back to top ↑', exact: true }).click();
        await page.waitForTimeout(350);
      }
      if ([1440, 390].includes(width)) await page.screenshot({ path: `.tmp/screenshots/${concept}-${width}.png`, fullPage: true });
    }
  }
  await page.goto(`${base}design-preview/portfolio`);
  for (const concept of ['A', 'B', 'C']) {
    await page.getByRole('button', { name: `Concept ${concept}`, exact: true }).click();
    await page.frameLocator('iframe').getByRole('heading', { name: 'Duong Tan Minh', exact: true }).waitFor();
  }
  await page.getByRole('button', { name: 'Original', exact: true }).click();
  await page.frameLocator('iframe').getByRole('heading', { name: 'Duong Tan Minh', exact: true }).waitFor();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${base}design-preview.html?frame=1&concept=c`);
  await page.getByRole('heading', { name: 'Duong Tan Minh', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('link', { name: 'Work', exact: true }).click();
  assert.equal(new URL(page.url()).hash, '#work');
  const resume = await page.getByRole('link', { name: 'Resume', exact: true }).getAttribute('href');
  const cvResponse = await page.request.get(new URL(resume, base).href);
  assert.equal(cvResponse.status(), 200);
  assert.equal((await cvResponse.body()).subarray(0, 4).toString(), '%PDF');
  const noWebGL = await browser.newContext();
  await noWebGL.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.includes('webgl') ? null : getContext.call(this, type, ...args);
    };
  });
  const fallback = await noWebGL.newPage();
  await fallback.goto(`${base}design-preview.html?frame=1&concept=b`);
  await fallback.locator('.scene-unavailable').waitFor();
  await fallback.getByRole('link', { name: 'Get in touch', exact: true }).waitFor();
  assert.equal(await fallback.getByText('PhuongNamCompany', { exact: true }).count(), 1);
  await noWebGL.close();
  assert.deepEqual(errors, [], 'Uncaught browser errors');
  console.log('PASS: 3 concepts × 6 widths, switching, Original, CV content, anchors, reduced motion and WebGL fallback.');
} finally {
  await browser.close();
}
