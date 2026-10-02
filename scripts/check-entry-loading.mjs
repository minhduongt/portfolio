import { mockVisitorTracking } from './mock-visitor-tracking.mjs';
﻿import assert from 'node:assert/strict';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
const base=process.env.SITE_URL || 'http://127.0.0.1:4177/';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 await mockVisitorTracking(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let release;const gate=new Promise(resolve=>release=resolve);
 await page.route('**/assets/index-*.js',async route=>{await gate;await route.continue()});
 await page.goto(base,{waitUntil:'commit'});
 const loader=page.locator('#root > .entry-loader');await loader.waitFor();
 assert.equal(await loader.getAttribute('aria-busy'),'true');
 assert.equal(await page.locator('.entry-loader__ring').first().evaluate(e=>getComputedStyle(e).animationName),'entry-orbit');
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.entry-loader__ring').first().evaluate(e=>getComputedStyle(e).animationName),'none');
 release();await page.locator('.quote-text').waitFor();assert.equal(await loader.count(),0);assert.deepEqual(errors,[]);
 const fallback=await browser.newPage({javaScriptEnabled:false});await fallback.goto(base);
 assert.match(await fallback.locator('body').innerText(),/Please enable JavaScript/);
 assert(await fallback.locator('noscript .entry-loader').isVisible());assert(!(await fallback.locator('#root > .entry-loader').isVisible()));
 console.log('PASS: initial HTML loader, delayed JavaScript, mobile layout, reduced motion, React replacement and no-JavaScript fallback.');
} finally {await browser.close()}
