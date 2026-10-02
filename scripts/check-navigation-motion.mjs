import { mockVisitorTracking } from './mock-visitor-tracking.mjs';
﻿import assert from 'node:assert/strict';
import {chromium} from '../.tmp/tooling/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const base=process.env.SITE_URL || 'http://127.0.0.1:4177/';
try {
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 await mockVisitorTracking(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.locator('.quote-text').waitFor();
 await page.waitForTimeout(850);
 assert.equal(await page.locator('.hero-copy h1').evaluate(e=>getComputedStyle(e).opacity),'1');
 const work=page.locator('.site-links a[href="#work"]');await work.hover();await page.waitForTimeout(350);
 assert.equal(await work.evaluate(e=>getComputedStyle(e,'::after').transform),'matrix(1, 0, 0, 1, 0, 0)');
 await work.click();await page.waitForTimeout(1000);
 assert(await page.locator('.site-nav').evaluate(e=>e.classList.contains('is-scrolled')));
 assert(Math.abs(await page.locator('.site-nav').evaluate(e=>e.getBoundingClientRect().top))<2);
 await page.locator('.project').first().scrollIntoViewIfNeeded();await page.waitForTimeout(850);
 assert.equal(await page.locator('.project').first().evaluate(e=>getComputedStyle(e).opacity),'1');
 for(const width of [320,390,700,859,1024,1440]) {
  await page.setViewportSize({width,height:844});await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(150);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
  if(width<=900){
   const button=page.getByRole('button',{name:'Menu',exact:true});await button.click();await page.waitForTimeout(400);
   assert.equal(await page.locator('.nav-menu').getAttribute('inert'),null);
   assert(await page.locator('.site-links a').last().isVisible());
   await page.keyboard.press('Escape');assert.equal(await button.getAttribute('aria-expanded'),'false');assert(await button.evaluate(e=>e===document.activeElement));
   assert.equal(await page.locator('.nav-menu').getAttribute('inert'),'');
   await button.click();await page.locator('.site-links a[href="#about"]').click();assert.equal(await button.getAttribute('aria-expanded'),'false');
  }else{assert(await page.locator('.site-links a').last().isVisible());assert.equal(await page.locator('.nav-menu').getAttribute('inert'),null)}
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.getByRole('button',{name:'Menu',exact:true}).click();await page.waitForTimeout(400);
 await page.screenshot({path:'.tmp/screenshots/nav-mobile-motion.png'});
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('.project').last().evaluate(e=>getComputedStyle(e).opacity),'1');
 assert.equal(await page.locator('.motion-entry').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
 await page.goto(base+'#/login');await page.getByLabel('Email',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 console.log('PASS: desktop hover, sticky nav, section reveal, 6 widths, mobile expansion/close/Escape focus, resize visibility, reduced motion and login navigation.');
}finally{await browser.close()}
