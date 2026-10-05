import assert from 'node:assert/strict';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { mockVisitorTracking } from './mock-visitor-tracking.mjs';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ colorScheme: 'dark' });
  await mockVisitorTracking(context);
  await context.route('**/api/v1/blogs', route => route.fulfill({ json: { success: true, data: [] } }));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4177/');
  await page.getByRole('button', { name: 'Switch to light theme', exact: true }).click({ timeout: 5000 });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.locator('.mixed-hero-visual .three-scene canvas').waitFor();
  assert.equal(await page.locator('.hero-sun img').evaluate(image => image.complete && image.naturalWidth > 0), true);
  assert.equal(await page.locator('.portfolio').evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(250, 247, 239)');
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'), '#faf7ef');
  await page.reload();
  await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).waitFor();
  await page.goto('http://127.0.0.1:4177/blogs');
  await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).waitFor();
  for (const width of [320, 390, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert(await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).isVisible());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
  }
  await page.goto('http://127.0.0.1:4177/');
  await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).waitFor();
  for (const width of [320, 390, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert(await page.locator('.site-nav').evaluate(nav => nav.scrollWidth <= nav.clientWidth), `Portfolio navbar overflow at ${width}`);
  }
  await page.screenshot({ path: '.tmp/screenshots/theme-light-desktop.png' });
  const secondTab = await context.newPage();
  await secondTab.goto('http://127.0.0.1:4177/login');
  await secondTab.getByRole('button', { name: 'Switch to dark theme', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).focus();
  await page.keyboard.press('Enter');
  await secondTab.getByRole('button', { name: 'Switch to light theme', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Switch to light theme', exact: true }).click();
  await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.reload();
  await page.getByRole('button', { name: 'Switch to light theme', exact: true }).waitFor();
  await context.close();
  const system = await browser.newContext({ colorScheme: 'light' });
  await mockVisitorTracking(system);
  const systemPage = await system.newPage();
  await systemPage.goto('http://127.0.0.1:4177/');
  await systemPage.getByRole('button', { name: 'Switch to dark theme', exact: true }).waitFor();
  await systemPage.emulateMedia({ colorScheme: 'dark' });
  await systemPage.getByRole('button', { name: 'Switch to light theme', exact: true }).waitFor();
  assert.deepEqual(errors, []);
  await system.close();
  const blocked = await browser.newContext({ colorScheme: 'light', reducedMotion: 'reduce' });
  await mockVisitorTracking(blocked);
  await blocked.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage blocked'); };
    Storage.prototype.setItem = () => { throw new Error('Storage blocked'); };
  });
  const blockedPage = await blocked.newPage();
  await blockedPage.goto('http://127.0.0.1:4177/');
  await blockedPage.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
  await blockedPage.emulateMedia({ colorScheme: 'light' });
  await blockedPage.getByRole('button', { name: 'Switch to light theme', exact: true }).waitFor();
  assert.equal(await blockedPage.locator('.theme-toggle-thumb').evaluate(element => getComputedStyle(element).transitionDuration), '0s');
  await blocked.close();
  const initial = await browser.newContext({ colorScheme: 'light' });
  await initial.route('**/*.js', route => route.abort());
  const initialPage = await initial.newPage();
  await initialPage.goto('http://127.0.0.1:4177/');
  assert.equal(await initialPage.locator('.entry-loader').evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(250, 247, 239)');
  await initial.close();
  console.log('PASS: keyboard theme toggle, sun asset, palette, persistence, cross-tab sync, route changes, system preference, blocked storage, reduced motion, initial loader and responsive navigation.');
} finally { await browser.close(); }
