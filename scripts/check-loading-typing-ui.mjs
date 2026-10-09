import assert from 'node:assert/strict';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { mockVisitorTracking } from './mock-visitor-tracking.mjs';
const base = process.env.SITE_URL || 'http://127.0.0.1:4177/portfolio/';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
const page = await context.newPage(), errors = [];
const reply = ('Xin chào 👋. ' + 'Đây là phản hồi tiếng Việt với ví dụ và ngữ cảnh rõ ràng. '.repeat(12)).trim();
page.on('pageerror', error => errors.push(error.message));
await mockVisitorTracking(page);
await context.route('**/api/v1/**', async route => {
  const path = new URL(route.request().url()).pathname;
  if (path.endsWith('/agent/chat')) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return route.fulfill({ json: { success: true, data: { reply, actions: [] } } });
  }
  if (path.endsWith('/tools')) {
    await new Promise(resolve => setTimeout(resolve, 650));
    return route.fulfill({ json: { success: true, data: [] } });
  }
  return route.fulfill({ json: { success: true, data: path.endsWith('/agent') ? { available: true, greeting: 'Ready.', suggestedQuestions: [] } : {} } });
});
const send = async () => {
  await page.locator('#agent-question').fill('Tell me about your work');
  await page.locator('.agent-composer button[type=submit]').click();
  await page.locator('.agent-thinking .loading-indicator__spinner').waitFor();
  assert.equal(await page.locator('.agent-thinking .sr-only').evaluate(node => getComputedStyle(node).position), 'absolute', 'Waiting label is screen-reader-only');
};
try {
  await page.goto(base + 'tools');
  await page.locator('.loading-state .loading-moon').first().waitFor();
  assert.equal(await page.locator('.loading-state .sr-only').first().evaluate(node => getComputedStyle(node).position), 'absolute', 'Page loader hides loading prose visually');
  await page.locator('.agent-trigger').click();
  await page.locator('.agent-panel[open]').waitFor();
  await page.locator('#agent-question').fill('Tell me about your work');
  await page.waitForFunction(() => !document.querySelector('.agent-composer button')?.disabled);
  await send();
  assert.equal(await page.locator('.agent-thinking .loading-indicator__spinner').evaluate(node => getComputedStyle(node).animationName), 'loading-orbit');
  const text = page.locator('.agent-message--assistant p');
  await text.waitFor();
  const initial = await text.innerText();
  assert(initial.length < reply.length, 'Reply starts partially revealed');
  assert.equal(await page.locator('.agent-message--assistant > .sr-only').innerText(), reply, 'Accessible full reply is available immediately');
  await page.waitForFunction(length => document.querySelector('.agent-message--assistant p')?.textContent.length > length, initial.length);
  await page.waitForFunction(reply => document.querySelector('.agent-message--assistant p')?.textContent === reply, reply);
  assert.equal(await page.locator('.agent-reply--typing').count(), 0);
  assert(await page.locator('.agent-log').evaluate(node => node.scrollHeight - node.clientHeight - node.scrollTop < 5), 'Typing follows the bottom of the chat');
  await page.keyboard.press('Escape'); await page.locator('.agent-trigger').click();
  assert.equal(await text.innerText(), reply, 'Reopening does not replay old replies');
  await page.getByRole('button', { name: 'New conversation', exact: true }).click();
  await send(); await text.waitFor(); await page.keyboard.press('Escape'); await page.locator('.agent-trigger').click();
  assert.equal(await text.innerText(), reply, 'Closing during typing reveals the complete reply on reopen');
  await page.getByRole('button', { name: 'New conversation', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await send();
  assert.equal(await page.locator('.agent-thinking .loading-indicator__spinner').evaluate(node => getComputedStyle(node).animationName), 'none');
  await text.waitFor(); assert.equal(await text.innerText(), reply, 'Reduced motion receives the full reply immediately');
  assert.equal(await page.locator('.agent-reply--typing').count(), 0);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  console.log('Animated loaders and Unicode reply reveal passed: accessibility, bounded completion, scroll, close/reopen, mobile and reduced motion.');
} finally { await browser.close(); }
