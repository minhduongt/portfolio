import { mockVisitorTracking } from './mock-visitor-tracking.mjs';
﻿import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from '../.tmp/tooling/node_modules/playwright/index.mjs';
import {tools} from '../src/site/data.js';
const keys={url:'url-encoder-decoder',markdown:'markdown-editor',credentials:'password-uuid-generator',lorem:'lorem-ipsum-generator',timestamp:'unix-timestamp-converter',hash:'hash-generator',jwt:'jwt-encoder-decoder',cron:'cron-parser'};
const records=tools.filter(tool=>keys[tool.id]).map(tool=>({...tool,slug:keys[tool.id],component:keys[tool.id],visibility:'public'}));
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 await mockVisitorTracking(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.route('**/api/v1/tools',r=>r.fulfill({json:{success:true,data:records}}));
 await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4177/#/tools');
 const select=async id=>{const tool=records.find(item=>item.id===id);await page.getByRole('button',{name:tool.name,exact:true}).click();await page.getByRole('heading',{name:tool.name,exact:true}).waitFor()};
 await select('url');
 for (const width of [1440, 390]) {
  await page.setViewportSize({width,height:950});
  const padding=await page.getByRole('button',{name:'Decode',exact:true}).evaluate(element=>{const style=getComputedStyle(element);return [parseFloat(style.paddingLeft),parseFloat(style.paddingRight)]});
  assert(padding.every(value=>value>=14),'Secondary action buttons have horizontal padding at desktop and mobile widths');
 }
 await page.setViewportSize({width:1440,height:950});
 await select('markdown');const markdown='# Test preview\n\n**Bold**\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n<script>window.injected=true</script>\n<img src="https://should-not-load.invalid/pixel" onerror="window.injected=true">\n[unsafe](javascript:alert(1))';
 await page.getByLabel('Markdown source').fill(markdown);await page.locator('.markdown-preview h1').waitFor();assert.equal(await page.locator('.markdown-preview table').count(),1);assert.equal(await page.locator('.markdown-preview script, .markdown-preview img, .markdown-preview a[href^="javascript:"]').count(),0);assert.equal(await page.evaluate(()=>window.injected),undefined);
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download .md',exact:true}).click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'notes.md');assert.equal(readFileSync(await download.path(),'utf8'),markdown);
 await select('credentials');await page.getByRole('button',{name:'Generate password',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.developer-output')?.value.length===20);await page.getByLabel('UUID count').fill('2');await page.getByRole('button',{name:'Generate UUIDs',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.developer-output')?.value.includes('\n'));assert.equal((await page.locator('.developer-output').inputValue()).split('\n').length,2);
 await select('lorem');await page.getByLabel('Generate',{exact:false}).selectOption('words');await page.getByLabel('Count',{exact:true}).fill('20');await page.getByRole('button',{name:'Generate lorem ipsum',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.developer-output')?.value.length>0);assert.equal((await page.locator('.developer-output').inputValue()).split(' ').length,20);
 await select('timestamp');await page.getByLabel('UNIX timestamp',{exact:true}).fill('0');await page.getByRole('button',{name:'Timestamp to date',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.developer-output')?.value.includes('1970-01-01'));
 await select('hash');await page.getByLabel('Text to hash').fill('abc');await page.getByRole('button',{name:'Generate hash',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.developer-output')?.value.length===64);assert.equal(await page.locator('.developer-output').inputValue(),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');await page.getByLabel('Text to hash').fill('changed');assert.equal(await page.locator('.developer-output').inputValue(),'');
 await select('jwt');await page.getByLabel('HS256 secret').fill('test-secret');await page.getByRole('button',{name:'Encode JWT',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.developer-output')?.value.split('.').length===3);const token=await page.locator('.developer-output').inputValue();await page.getByLabel('JWT to decode').fill(token);await page.getByRole('button',{name:'Decode JWT',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.developer-output')?.value.includes('signatureVerified'));assert.equal(JSON.parse(await page.locator('.developer-output').inputValue()).signatureVerified,false);
 await select('cron');await page.getByLabel('Start after').fill('2026-01-01T00:01:00Z');await page.getByRole('button',{name:'Parse cron',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.developer-output')?.value.includes('2026-01-01T00:15:00.000Z'));await page.getByLabel('Cron expression',{exact:true}).fill('bad');await page.getByRole('button',{name:'Parse cron',exact:true}).click();await page.getByRole('alert').waitFor();
 await page.getByLabel('Find a tool').fill('hash');assert.equal(await page.locator('.tool-picker-list button').count(),1);await page.getByLabel('Find a tool').fill('');
 for(const width of [320,390,700,1024,1440]){await page.setViewportSize({width,height:844});for(const id of Object.keys(keys)){await select(id);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${id} at ${width}`)}}
 await page.setViewportSize({width:1440,height:950});await select('markdown');await page.locator('.tools-layout').scrollIntoViewIfNeeded();await page.screenshot({path:'.tmp/screenshots/new-tools-markdown.png'});
 assert(!requests.some(url=>url.includes('should-not-load')));assert.deepEqual(errors,[]);console.log('PASS: all 7 tool workflows, Markdown sanitization/download, browser crypto, output reset, tool search and 5 widths; no utility inputs sent to backend.');
}finally{await browser.close()}
