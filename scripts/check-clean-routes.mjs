import assert from 'node:assert/strict';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { mockVisitorTracking } from './mock-visitor-tracking.mjs';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const base = process.env.SITE_URL || 'http://127.0.0.1:4177/';
try {
  const page = await browser.newPage();
  await page.route('**/api/v1/**', route => {
    const path = new URL(route.request().url()).pathname;
    const data = path === '/api/v1/blogs/hello-world'
      ? { slug: 'hello-world', title: 'Routing test article', visibility: 'public', contentHtml: '<p>Article body</p>' }
      : path === '/api/v1/blogs'
        ? [{ slug: 'hello-world', title: 'Routing test article', visibility: 'public', tags: [] }]
        : [];
    return route.fulfill({ json: { success: true, data } });
  });
  await mockVisitorTracking(page);
  await page.goto(base);
  await page.locator('.site-nav a').filter({ hasText: /^Blogs$/ }).click();
  assert.equal(page.url(), new URL('blogs', base).href);
  await page.getByRole('heading', { name: 'Notes from the build.' }).waitFor();
  await page.getByRole('link', { name: /Routing test article/ }).click();
  assert.equal(page.url(), new URL('blogs/hello-world', base).href);
  await page.getByRole('heading', { name: 'Routing test article' }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'Routing test article' }).waitFor();
  await page.goBack();
  await page.getByRole('heading', { name: 'Notes from the build.' }).waitFor();
  await page.goForward();
  await page.getByRole('heading', { name: 'Routing test article' }).waitFor();
  await page.locator('.site-nav a').filter({ hasText: /^Tools$/ }).click();
  assert.equal(page.url(), new URL('tools', base).href);
  await page.reload();
  await page.locator('.site-nav a[aria-current="page"]').filter({ hasText: /^Tools$/ }).waitFor();
  await page.goto(new URL('admin', base).href);
  await page.locator('.site-nav').waitFor();
  assert.equal(page.url(), new URL('admin', base).href);
  await page.goto(new URL('#/login', base).href);
  await page.getByLabel('Email', { exact: true }).waitFor();
  assert.equal(page.url(), new URL('login', base).href);
  await page.goto(new URL('#/blogs/hello-world', base).href);
  await page.getByRole('heading', { name: 'Routing test article' }).waitFor();
  assert.equal(page.url(), new URL('blogs/hello-world', base).href);
  await page.locator('.site-nav a').filter({ hasText: /^Portfolio$/ }).click();
  await page.locator('#about').waitFor();
  await page.locator('.site-nav a').filter({ hasText: /^About$/ }).click();
  assert.equal(page.url(), base);
  await page.waitForFunction(() => Math.abs(document.getElementById('about').getBoundingClientRect().top) < 250);
  console.log('PASS: clean navigation, direct routes, refresh, back/forward, blog detail, legacy bookmarks and section scrolling.');
} finally { await browser.close(); }
