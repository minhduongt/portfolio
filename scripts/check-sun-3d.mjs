import assert from 'node:assert/strict';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { mockVisitorTracking } from './mock-visitor-tracking.mjs';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ colorScheme: 'light', viewport: { width: 1440, height: 950 } });
  await mockVisitorTracking(context);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4177/');
  const scene = page.locator('.mixed-hero-visual .three-scene');
  await scene.locator('canvas').waitFor({ timeout: 5000 });
  await page.waitForTimeout(900);
  assert.equal(await scene.locator('canvas').count(), 1);
  assert.equal(await scene.locator('.hero-sun').isVisible(), false);
  const before = await scene.screenshot();
  const bounds = await scene.boundingBox();
  await page.mouse.move(bounds.x + bounds.width * .9, bounds.y + bounds.height * .1);
  await page.waitForTimeout(700);
  assert.notDeepEqual(await scene.screenshot(), before, 'Pointer movement must change the rendered 3D sun');
  await page.screenshot({ path: '.tmp/screenshots/sun-3d-desktop.png' });
  await scene.locator('canvas').dispatchEvent('webglcontextlost');
  await scene.locator('.hero-sun img').waitFor();
  await scene.locator('canvas').dispatchEvent('webglcontextrestored');
  await scene.locator('canvas').waitFor();
  for (let index = 0; index < 3; index++) {
    await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
    await scene.locator('canvas').waitFor();
    assert.equal(await scene.locator('canvas').count(), 1);
    await page.getByRole('button', { name: 'Switch to light theme', exact: true }).click();
    await scene.locator('canvas').waitFor();
    assert.equal(await scene.locator('canvas').count(), 1);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(700);
  const still = await scene.screenshot();
  await page.mouse.move(bounds.x + 30, bounds.y + 30);
  await page.waitForTimeout(300);
  assert.deepEqual(await scene.screenshot(), still, 'Reduced-motion sun should remain still');
  assert.deepEqual(errors, []);
  await context.close();
  const fallback = await browser.newContext({ colorScheme: 'light' });
  await mockVisitorTracking(fallback);
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.includes('webgl') ? null : original.call(this, type, ...args); };
  });
  const fallbackPage = await fallback.newPage();
  await fallbackPage.goto('http://127.0.0.1:4177/');
  await fallbackPage.locator('.mixed-hero-visual .hero-sun img').waitFor();
  assert.equal(await fallbackPage.locator('.mixed-hero-visual canvas').count(), 0);
  await fallback.close();
  console.log('PASS: rendered 3D sun, pointer interaction, context-loss fallback/recovery, theme cleanup, reduced motion and missing-WebGL fallback.');
} finally { await browser.close(); }
