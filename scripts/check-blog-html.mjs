import assert from 'node:assert/strict';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { mockVisitorTracking } from './mock-visitor-tracking.mjs';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  await mockVisitorTracking(page);
  const source = '<div style="color:red"><!-- Main header --><header><h1>Rendered heading</h1></header><p>Body <strong>bold</strong> &amp; symbols</p><script>window.injected=true</script><img src=x onerror="window.injected=true"></div>';
  const escaped = source.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  await page.route('**/api/v1/**', route => route.fulfill({ json: { success: true, data: { title: 'HTML article', slug: 'html', contentHtml: `<p>${escaped}</p>`, visibility: 'public' } } }));
  await page.goto('http://127.0.0.1:4177/portfolio/blogs/html');
  await page.locator('.managed-html').waitFor();
  assert.equal(await page.locator('.managed-html h1').innerText(), 'Rendered heading', 'Previously escaped HTML renders as elements');
  assert.equal(await page.locator('.managed-html strong').innerText(), 'bold');
  assert.equal(await page.locator('.managed-html script, .managed-html img, .managed-html [style]').count(), 0, 'Recovered HTML still passes sanitization');
  assert.equal(await page.evaluate(() => window.injected), undefined);
  const result = await page.evaluate(async ({ source, escaped }) => {
    const { sanitizeContent } = await import('/portfolio/src/site/SafeHtml.jsx');
    const code = `<pre><code>${escaped}</code></pre>`;
    return { raw: sanitizeContent(source), split: sanitizeContent(`<p>${escaped.slice(0, escaped.indexOf('&lt;p&gt;'))}</p><p>${escaped.slice(escaped.indexOf('&lt;p&gt;'))}</p>`), code: sanitizeContent(code), markdown: sanitizeContent(`<p>${escaped}</p>`, true), inline: sanitizeContent('<p>Write &lt;strong&gt;bold&lt;/strong&gt; here.</p>') };
  }, { source, escaped });
  assert(result.raw.includes('<h1>Rendered heading</h1>'));
  assert(result.split.includes('<h1>Rendered heading</h1>'));
  assert(result.code.includes('&lt;div'), 'Explicit code blocks remain escaped');
  assert(result.markdown.includes('&lt;div'), 'Markdown escaping remains unchanged');
  assert(result.inline.includes('&lt;strong&gt;'), 'Inline HTML examples remain text');
  console.log('PASS: escaped blog HTML and rich-text paragraph wrappers render safely; actual HTML, code examples and Markdown preserve their meaning.');
} finally { await browser.close(); }
