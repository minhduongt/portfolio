import { mockVisitorTracking } from './mock-visitor-tracking.mjs';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { posts, tools } from '../src/site/data.js';
import { componentKeys } from '../src/site/api.js';
const base = process.env.SITE_URL || 'http://127.0.0.1:5173/portfolio/';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
mkdirSync('.tmp/screenshots', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
 await mockVisitorTracking(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Production API fixtures. Build with VITE_API_BASE_URL=http://localhost:3000/api/v1.
  await page.route('http://localhost:3000/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const blogs = posts.map(post => ({ ...post, tags: [post.topic], visibility: 'public', contentHtml: '<p>Published fixture for browser checks.</p>' }));
    const metadata = tools.map(tool => ({ ...tool, slug: tool.id, component: Object.keys(componentKeys).find(key => componentKeys[key] === tool.id), visibility: 'public' }));
    const data = path.endsWith('/tools') ? metadata : path.endsWith('/blogs') ? blogs : blogs.find(post => path.endsWith(`/${post.slug}`));
    await route.fulfill({ json: { success: true, data }, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'Authorization, Content-Type' } });
  });
  await page.goto(base);
  await page.getByRole('heading', { name: 'Duong Tan Minh', exact: true }).waitFor();
  assert.equal(await page.locator('.quote-text').count(), 1, 'Production must render the approved Mixed design');
  await page.getByRole('heading', { name: 'Mi-Jack Vietnam', exact: true }).waitFor();
  assert.equal(await page.locator('#bg').count(), 0, 'Legacy canvas is removed');
  await page.screenshot({ path: '.tmp/screenshots/production-portfolio.png', fullPage: true });
  await page.getByRole('link', { name: 'Blogs', exact: true }).click();
  assert.equal(new URL(page.url()).hash, '#/blogs');
  await page.getByRole('link', { name: /Making a PWA feel useful/ }).click();
  await page.reload();
  await page.getByRole('link', { name: 'Back to all posts', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Back to top ↑', exact: true }).click();
  assert.equal(new URL(page.url()).hash, '#/blogs/pwa', 'Footer stays on the current page');
  await page.getByRole('link', { name: 'Skip to content', exact: true }).focus();
  await page.keyboard.press('Enter');
  assert.equal(new URL(page.url()).hash, '#/blogs/pwa', 'Skip link keeps the article route');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content', 'Skip link focuses the current main content');
  await page.getByRole('link', { name: 'Tools', exact: true }).click();
  assert(!await page.title().then(title => title.includes('Preview')), 'Production title has no preview label');
  await page.getByRole('link', { name: 'Back to top ↑', exact: true }).click();
  assert.equal(new URL(page.url()).hash, '#/tools', 'Tools footer keeps the tool page');
  await page.getByRole('button', { name: 'Power Fx Formatter', exact: true }).click();
  await page.getByLabel('Power Fx input').fill('If(true,Notify("a,b"),Set(x,1))');
  await page.getByRole('button', { name: 'Format Power Fx', exact: true }).click();
  assert((await page.getByLabel('Formatted Power Fx').inputValue()).includes('"a,b"'));
  await page.getByLabel('Power Fx input').fill('If(true]');
  await page.getByRole('button', { name: 'Format Power Fx', exact: true }).click();
  await page.getByRole('alert').waitFor();
  assert.equal(await page.getByLabel('Formatted Power Fx').inputValue(), '');
  await page.getByRole('button', { name: 'Color Picker', exact: true }).click();
  await page.getByLabel('HEX color').fill('#ff0000');
  await page.getByLabel('HEX color').blur();
  assert.equal(await page.getByLabel('RGB value').inputValue(), 'rgb(255, 0, 0)');
  assert.equal(await page.getByLabel('HSL value').inputValue(), 'hsl(0, 100%, 50%)');
  await page.getByRole('button', { name: 'Image Converter', exact: true }).click();
  await page.getByRole('button', { name: 'Convert image', exact: true }).click();
  assert.match(await page.getByRole('alert').textContent(), /choose.*image first/i);
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 8; canvas.height = 4;
    canvas.getContext('2d').fillRect(0, 0, 8, 4); return canvas.toDataURL().split(',')[1];
  });
  await page.getByLabel('Image file').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await page.getByLabel('Maximum width').fill('0');
  await page.getByRole('button', { name: 'Convert image', exact: true }).click();
  assert.match(await page.getByRole('alert').textContent(), /between 1 and 8192/i);
  await page.getByLabel('Maximum width').fill('4');
  await page.getByLabel('Output format').selectOption('image/jpeg');
  await page.getByRole('button', { name: 'Convert image', exact: true }).click();
  const downloadLink = page.getByRole('link', { name: 'Download converted image', exact: true });
  await downloadLink.waitFor();
  const details = await downloadLink.evaluate(async link => {
    const blob = await (await fetch(link.href)).blob(); const bitmap = await createImageBitmap(blob);
    const result = { type: blob.type, width: bitmap.width, height: bitmap.height }; bitmap.close(); return result;
  });
  assert.deepEqual(details, { type: 'image/jpeg', width: 4, height: 2 });
  await page.getByLabel('Output format').selectOption('image/png');
  assert.equal(await downloadLink.count(), 0, 'Settings changes invalidate download');
  await page.evaluate(() => {
    window.originalEncoder = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (...args) { setTimeout(() => window.originalEncoder.apply(this, args), 300); };
  });
  await page.getByRole('button', { name: 'Convert image', exact: true }).click();
  await page.getByLabel('Maximum width').fill('3');
  await page.waitForTimeout(400);
  assert.equal(await downloadLink.count(), 0, 'Stale conversion cannot restore an outdated download');
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = function (callback) { window.originalEncoder.call(this, callback, 'image/png'); };
  });
  await page.getByLabel('Output format').selectOption('image/webp');
  await page.getByRole('button', { name: 'Convert image', exact: true }).click();
  assert.match(await page.getByRole('alert').textContent(), /cannot export this format/i);
  assert.equal(await downloadLink.count(), 0, 'Encoder fallback must not download a mislabeled file');
  await page.evaluate(() => { HTMLCanvasElement.prototype.toBlob = window.originalEncoder; });
  await page.getByLabel('Image file').setInputFiles({ name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('invalid') });
  await page.getByRole('button', { name: 'Convert image', exact: true }).click();
  await page.getByRole('alert').waitFor();
  assert.equal(await downloadLink.count(), 0);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    for (const route of ['', '#/blogs', '#/tools']) {
      await page.goto(`${base}${route}`); await page.locator('h1').waitFor();
      if (route === '#/tools') {
        for (const tool of ['JSON Formatter', 'URL Encoder / Decoder', 'Word Counter', 'Image Converter', 'Power Fx Formatter', 'Color Picker']) {
          await page.getByRole('button', { name: tool, exact: true }).click();
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tool} overflows at ${width}`);
        }
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} overflows at ${width}`);
    }
  }
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto(`${base}#/tools`); await page.reload();
  await page.getByRole('heading', { name: 'Small tools. Less friction.', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Portfolio', exact: true }).click();
  await page.getByRole('heading', { name: 'Duong Tan Minh', exact: true }).waitFor();
  await page.goBack(); await page.getByRole('button', { name: 'Image Converter', exact: true }).waitFor();
  const resume = await page.getByRole('link', { name: 'Resume', exact: true }).getAttribute('href');
  const response = await page.request.get(new URL(resume, base).href);
  assert.equal((await response.body()).subarray(0, 4).toString(), '%PDF');
  await page.screenshot({ path: '.tmp/screenshots/production-tools.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS: production routes/refresh/Back, six responsive tools, conversion MIME/dimensions, errors and PDF.');
} finally { await browser.close(); }
