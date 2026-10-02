import { mockVisitorTracking } from './mock-visitor-tracking.mjs';
﻿import assert from 'node:assert/strict';
import {chromium} from '../.tmp/tooling/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 await mockVisitorTracking(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));let request;let success=false;
 await page.route('**/api/v1/send-email',async route=>{request=route.request().postDataJSON();await route.fulfill({status:success?200:400,json:success?{success:true}:{message:'Fixture failure'},headers:{'access-control-allow-origin':'*'}})});
 await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4177/');await page.locator('.quote-text').waitFor();
 assert.equal(await page.locator('.nav-group--portfolio a').count(),4);assert.equal(await page.locator('.nav-group--explore a').count(),3);
 const form=page.getByRole('form',{name:'Send Minh a message'});await form.scrollIntoViewIfNeeded();
 await form.getByLabel('Your name',{exact:true}).fill('Test visitor');await form.getByLabel('Your email',{exact:true}).fill('test@example.com');await form.getByLabel('Your message',{exact:true}).fill('A test message');
 await form.getByRole('button',{name:'Send message',exact:true}).click();await form.getByRole('alert').waitFor();assert.equal(await form.getByLabel('Your message',{exact:true}).inputValue(),'A test message');
 assert.deepEqual(request,{name:'Test visitor',email:'test@example.com',phone:'',message:'A test message'});
 success=true;await form.getByRole('button',{name:'Send message',exact:true}).click();await form.getByRole('status').waitFor();assert.equal(await form.getByLabel('Your name',{exact:true}).inputValue(),'');
 await page.screenshot({path:'.tmp/screenshots/contact-desktop.png'});
 for(const width of [320,390,700,859,1024,1440]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`)}
 await page.setViewportSize({width:390,height:844});await form.scrollIntoViewIfNeeded();await page.screenshot({path:'.tmp/screenshots/contact-mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: grouped navigation, contact failure/retry/success/reset, payload and 6 responsive widths; no real emails sent.');
}finally{await browser.close()}
