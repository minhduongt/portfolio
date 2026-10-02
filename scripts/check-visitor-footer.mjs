import assert from 'node:assert/strict';
import {chromium} from '../.tmp/tooling/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const context=await browser.newContext();const beats=[];let statsCalls=0,mode='ready';
 await context.route('**/api/v1/visitors/**',async route=>{
 const request=route.request();assert.equal(request.headers().authorization,undefined);
 if(request.url().includes('/heartbeat')){const body=request.postDataJSON();assert.deepEqual(Object.keys(body),['visitorId']);beats.push(body.visitorId);return route.fulfill({json:{success:true,data:{countedVisit:beats.length===1}}})}
 statsCalls++;return route.fulfill({status:mode==='error'?500:200,json:mode==='error'?{success:false,message:'Fixture failure'}:{success:true,data:mode==='invalid'?{activeVisitors:-1,totalVisits:'wrong'}:{activeVisitors:3,totalVisits:1234}}});
 });
 const page=await context.newPage();await page.clock.install();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4177/');await page.locator('.visitor-stats.is-live').waitFor();assert.equal(beats.length,1);assert.equal(statsCalls,1);assert.match(await page.locator('.visitor-stats').innerText(),/1,234/);const id=beats[0];assert.match(id,/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/);
 await page.clock.fastForward(60000);await page.waitForFunction(()=>document.querySelector('.visitor-stats.is-live'));
 await page.waitForTimeout(100);assert.equal(beats.length,2);assert.equal(statsCalls,2);
 await page.goto('http://127.0.0.1:4177/#/login');await page.getByLabel('Email',{exact:true}).waitFor();await page.locator('.visitor-stats.is-live').waitFor();assert.equal(beats.at(-1),id);
 const hide=async hidden=>page.evaluate(hidden=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>hidden?'hidden':'visible'});document.dispatchEvent(new Event('visibilitychange'));},hidden);
 await hide(true);const hiddenBeats=beats.length;await page.clock.fastForward(180000);assert.equal(beats.length,hiddenBeats);
 mode='error';await hide(false);await page.locator('.visitor-stats-note').filter({hasText:'Last known counts'}).waitFor();assert.match(await page.locator('.visitor-stats').innerText(),/1,234/);
 mode='ready';await page.clock.fastForward(60000);await page.locator('.visitor-stats.is-live').waitFor();
 await page.setViewportSize({width:390,height:844});await page.locator('.site-footer').scrollIntoViewIfNeeded();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'.tmp/screenshots/visitor-footer-mobile.png'});
 await page.reload();await page.locator('.visitor-stats.is-live').waitFor();assert.equal(beats.at(-1),id);
 const second=await context.newPage();await second.goto('http://127.0.0.1:4177/');await second.locator('.visitor-stats.is-live').waitFor();assert.equal(beats.at(-1),id);await second.close();
 await page.evaluate(()=>localStorage.setItem('portfolio.visitorId','bad-id'));await page.reload();await page.locator('.visitor-stats.is-live').waitFor();assert.notEqual(beats.at(-1),id);assert.match(beats.at(-1),/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/);
 assert.deepEqual(errors,[]);await context.close();
 const denied=await browser.newContext();await denied.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked')};Storage.prototype.setItem=()=>{throw Error('blocked')}});let fallbackId;
 await denied.route('**/api/v1/visitors/**',r=>{if(r.request().url().includes('heartbeat'))fallbackId=r.request().postDataJSON().visitorId;return r.fulfill({json:{success:true,data:r.request().url().includes('stats')?{activeVisitors:0,totalVisits:0}:{countedVisit:true}}})});const fallback=await denied.newPage();await fallback.goto('http://127.0.0.1:4177/');await fallback.locator('.visitor-stats.is-live').waitFor();assert(fallbackId);assert.match(await fallback.locator('.visitor-stats').innerText(),/0/);await denied.close();
 console.log('PASS: immediate/60-second heartbeats, stored ID reload/tab reuse, visibility pause/resume, stale/recovery UI, mobile footer, invalid ID repair, blocked storage and zero counts; no live visits recorded.');
}finally{await browser.close()}
