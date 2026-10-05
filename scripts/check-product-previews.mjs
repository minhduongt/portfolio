import assert from 'node:assert/strict';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { mockVisitorTracking } from './mock-visitor-tracking.mjs';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const products = [
  ['Acupressure Map', 'https://acupunture-map.vercel.app/'],
  ['RE:SEARCH', 'https://re-search-platform.web.app/'],
  ['PhuongNamCompany', 'https://phuongnam.net.vn/'],
];
try {
  const page = await browser.newPage();
  await mockVisitorTracking(page);
  for (const [, url] of products) await page.route(url + '**', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Product fixture</title><h1>Product preview</h1>' }));
  await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4177/');
  await page.locator('.project').first().waitFor();
  assert.equal(await page.locator('.project').count(), 3);
  assert.equal(await page.getByRole('heading', { name: 'Kyansunitour', exact: true }).count(), 0);
  for (const [name, url] of products) {
    const card = page.locator('.project').filter({ has: page.getByRole('heading', { name, exact: true }) });
    const external = card.getByRole('link', { name: 'Open in new tab', exact: true });
    assert.equal(await external.getAttribute('href'), url);
    assert.equal(await external.getAttribute('target'), '_blank');
    assert.match(await external.getAttribute('rel'), /noopener/u);
    assert.equal(await page.locator('.product-preview iframe').count(), 0, 'No external site loads before a preview is opened');
    const opener = card.getByRole('button', { name: 'Preview here', exact: true });
    await opener.click();
    const dialog = page.getByRole('dialog', { name: `${name} preview`, exact: true });
    await dialog.waitFor();
    assert.equal(await dialog.locator('iframe').getAttribute('src'), url);
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await opener.waitFor({ state: 'visible' });
    assert(await opener.evaluate(element => element === document.activeElement), 'Focus returns to the preview button');
    await opener.click();
    await dialog.getByRole('button', { name: 'Close preview', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.product-preview iframe').count(), 0, 'Closing unloads the external page');
    assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden');
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: 'Preview here', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  assert(await dialog.evaluate(element => element.getBoundingClientRect().width <= innerWidth));
  await page.keyboard.press('Escape');
  console.log('PASS: three product URLs, removed Kyansunitour, lazy iframe previews, close/Escape, focus restoration and mobile sizing.');
} finally { await browser.close(); }
