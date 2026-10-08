import assert from 'node:assert/strict';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { mockVisitorTracking } from './mock-visitor-tracking.mjs';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  await mockVisitorTracking(page);
  await page.goto('http://127.0.0.1:4177/portfolio/');
  const planet = page.locator('.mixed-hero-visual .three-scene');
  await planet.locator('canvas').waitFor();
  const capture = () => planet.screenshot({ animations: 'allow' });
  for (const theme of ['light', 'dark']) {
    if (await page.locator('html').getAttribute('data-theme') !== theme) await page.getByRole('button', { name: `Switch to ${theme} theme`, exact: true }).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(1200);
    const first = await capture(); await page.waitForTimeout(900);
    assert(!first.equals(await capture()), `${theme}: planet rotates without pointer movement`);
    await planet.hover(); await page.waitForTimeout(200);
    const paused = await capture(); await page.waitForTimeout(600);
    assert(paused.equals(await capture()), `${theme}: hover freezes the current view`);
    const bounds = await planet.boundingBox(); await page.mouse.move(bounds.x + bounds.width * .7, bounds.y + bounds.height * .4);
    await page.waitForTimeout(250);
    assert(paused.equals(await capture()), `${theme}: pointer movement while hovered does not alter the pose`);
    await page.mouse.move(0, 0); await page.waitForTimeout(900);
    assert(!paused.equals(await capture()), `${theme}: leaving resumes rotation`);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(300);
  const still = await capture(); await page.waitForTimeout(700);
  assert(still.equals(await capture()), 'Reduced-motion preference stops rotation');
  console.log('PASS: sun/moon rotate, freeze on hover, resume on leave, and respect reduced motion.');
} finally { await browser.close(); }
