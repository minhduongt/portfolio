import assert from 'node:assert/strict';
import {chromium} from '../.tmp/tooling/node_modules/playwright/index.mjs';
import {mockVisitorTracking} from './mock-visitor-tracking.mjs';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();await mockVisitorTracking(page);await page.clock.install();
 await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4177/');await page.locator('.quote-rotator .is-typing').waitFor();
 await page.getByRole('button',{name:'Next quote',exact:true}).click();
 const block=page.locator('.quote-rotator blockquote');const selected=await block.getAttribute('aria-label');
 await page.clock.runFor(100);const partial=await page.locator('.quote-text').textContent();assert(partial.length>1);assert(partial.length<selected.length+2);assert.equal(await block.locator('cite').evaluate(e=>getComputedStyle(e).visibility),'hidden');
 await page.clock.runFor(2600);assert.equal(await page.locator('.quote-text').textContent(),'\u201c'+selected+'\u201d');assert.equal(await block.locator('cite').evaluate(e=>getComputedStyle(e).visibility),'visible');
 await page.clock.fastForward(12100);assert.equal(await block.getAttribute('aria-label'),selected);
 await page.clock.runFor(300);assert.notEqual(await block.getAttribute('aria-label'),selected);assert.equal(await page.locator('.quote-caret').count(),1);
 await page.getByRole('button',{name:'Pause quotes',exact:true}).click();const paused=await block.getAttribute('aria-label');await page.clock.fastForward(31000);assert.equal(await block.getAttribute('aria-label'),paused);
 await page.getByRole('button',{name:'Next quote',exact:true}).click();assert.notEqual(await block.getAttribute('aria-label'),paused);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.quote-caret').waitFor({state:'detached'});assert.equal(await page.locator('.quote-caret').count(),0);assert.equal(await page.locator('.quote-text').textContent(),'\u201c'+await block.getAttribute('aria-label')+'\u201d');
 assert(await page.getByRole('button',{name:'Play quotes',exact:true}).isVisible());console.log('PASS: progressive typing, author reveal, automatic 15-second rotation, manual restart, pause and immediate reduced-motion output.');
}finally{await browser.close()}
