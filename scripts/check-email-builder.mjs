import { mockVisitorTracking } from './mock-visitor-tracking.mjs';
﻿import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from '../.tmp/tooling/node_modules/playwright/index.mjs';
import {buildEmail,templateFields,emailTemplates} from '../src/site/tools/emailTemplates.js';
for(const key of Object.keys(emailTemplates)){const html=buildEmail(key,templateFields(key));assert(html.startsWith('<!doctype html>'));assert(html.includes('role="presentation"'));}
assert(!buildEmail('welcome',{...templateFields(),heading:'<img src=x>',brand:'A & B'}).includes('<img'));assert(buildEmail('welcome',{...templateFields(),heading:'<img src=x>'}).includes('&lt;img'));
assert.throws(()=>buildEmail('welcome',{...templateFields(),link:'javascript:alert(1)'}),/HTTP/);assert.throws(()=>buildEmail('welcome',{...templateFields(),accent:'red'}),/HEX/);
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:950},colorScheme:'dark'});
 await mockVisitorTracking(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));const requests=[];const failures=new Map();const externalResponses=[];page.on('request',r=>requests.push(r.url()));page.on('requestfailed',r=>failures.set(r.url(),r.failure()?.errorText));page.on('response',r=>{if(r.url().includes('blocked-assets'))externalResponses.push(r.url())});
 await page.route('**/api/v1/tools',r=>r.fulfill({json:{success:true,data:[{slug:'html-email-builder',component:'html-email-builder',name:'HTML Preview / Email Builder',description:'Build an email locally.',category:'HTML & email',visibility:'public'}]}}));
 await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4177/#/tools');
 await page.getByRole('button',{name:'HTML editor',exact:true}).click();
 await page.getByLabel('HTML source',{exact:true}).waitFor();
 const iframe=page.locator('iframe[title="HTML email preview"]'),frame=page.frameLocator('iframe[title="HTML email preview"]');
 await frame.getByRole('heading',{name:'A little space for something new.'}).waitFor();assert.equal(await iframe.getAttribute('sandbox'),'allow-popups allow-popups-to-escape-sandbox');assert((await iframe.getAttribute('srcdoc')).includes('Content-Security-Policy'));
 await page.getByText('Customize template content',{exact:true}).click();await page.getByLabel('Heading',{exact:true}).fill('Hello from Minh');await page.getByRole('button',{name:'Apply template',exact:true}).click();await frame.getByRole('heading',{name:'Hello from Minh'}).waitFor();
 for(const key of ['newsletter','receipt']){await page.getByLabel('Starter template').selectOption(key);await page.getByRole('button',{name:'Apply template',exact:true}).click();await frame.getByRole('heading',{name:emailTemplates[key].heading}).waitFor();if(key==='receipt')await frame.getByText('ORDER-001',{exact:true}).waitFor();}
 await page.getByLabel('Button URL',{exact:true}).fill('javascript:alert(1)');await page.getByRole('button',{name:'Apply template',exact:true}).click();await page.getByRole('alert').waitFor();
 await page.getByRole('button',{name:'Mobile',exact:false}).click();assert.equal(await iframe.evaluate(e=>e.getBoundingClientRect().width),375);await page.getByRole('button',{name:'Desktop',exact:false}).click();assert.equal(await iframe.evaluate(e=>e.getBoundingClientRect().width),600);
 const hostile='<html><head><style>body{background:rgb(240,240,240)} .remote{background:url(https://blocked-assets.invalid/bg)}</style><meta http-equiv="refresh" content="0;url=https://blocked-assets.invalid/redirect"></head><body><h1>Isolated preview</h1><script>parent.injected=true</script><img src="https://blocked-assets.invalid/image" onerror="parent.injected=true"><a href="javascript:alert(1)">Click test</a><iframe src="https://blocked-assets.invalid/frame"></iframe><form action="https://blocked-assets.invalid/form"><input value="bad"></form><div class="remote">Preview styles</div></body></html>';
 await page.getByLabel('HTML source',{exact:true}).fill(hostile);await frame.getByRole('heading',{name:'Isolated preview'}).waitFor();await frame.getByText('Click test',{exact:true}).click();assert.equal(await frame.locator('script, form, input, iframe, meta[http-equiv="refresh"]').count(),0);assert.equal(await frame.locator('a').getAttribute('href'),null);assert.equal(await page.evaluate(()=>window.injected),undefined);
 assert.equal(await page.locator('.portfolio').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(16, 23, 22)');await page.waitForTimeout(300);assert.equal(await frame.locator('img[src]').count(),0);assert.deepEqual(externalResponses,[]);assert(requests.filter(url=>url.includes('blocked-assets')).every(url=>failures.get(url)==='csp'));
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download HTML',exact:true}).click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'receipt-email.html');assert.equal(readFileSync(await download.path(),'utf8'),hostile);
 const unsafeUrls=['javascript:alert(1)','data:text/html,bad','https://user:password@example.com','/relative','mailto:test@example.com'];
 await page.getByLabel('HTML source',{exact:true}).fill('<html><body><h1>Link validation</h1>'+unsafeUrls.map((url,index)=>`<a href="${url}" onclick="parent.injected=true">Unsafe ${index}</a>`).join('')+'<a href="https://example.org/safe" target="_top" rel="opener">Safe link</a></body></html>');
 await frame.getByRole('heading',{name:'Link validation'}).waitFor();
 assert.equal(await frame.locator('a[href]').count(),1);
 assert.equal(await frame.locator('[onclick]').count(),0);
 const safeLink=frame.getByRole('link',{name:'Safe link'});
 assert.equal(await safeLink.getAttribute('target'),'_blank');
 assert.equal(await safeLink.getAttribute('rel'),'noopener noreferrer');
 for(const width of [320,390,700,1024,1440]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`)}
 await page.getByLabel('Button URL',{exact:true}).fill('https://example.com');await page.getByRole('button',{name:'Apply template',exact:true}).click();await frame.getByRole('heading',{name:emailTemplates.receipt.heading}).waitFor();await page.getByText('Customize template content',{exact:true}).click();await page.locator('.email-preview-pane').scrollIntoViewIfNeeded();await page.screenshot({path:'.tmp/screenshots/html-email-builder.png'});
 assert.deepEqual(errors,[]);console.log('PASS: 3 templates, content customization, validation, sandbox/CSP, no script execution or external requests, preserved HTML export, exact preview widths and 5 responsive sizes.');
}finally{await browser.close()}
