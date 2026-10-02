import { mockVisitorTracking } from './mock-visitor-tracking.mjs';
﻿import assert from 'node:assert/strict';
import {chromium} from '../.tmp/tooling/node_modules/playwright/index.mjs';
import {authErrorMessage} from '../src/site/authMessages.js';
assert.match(authErrorMessage({code:'auth/invalid-credential'}),/email or password is incorrect/);
assert.equal(authErrorMessage({code:'auth/user-not-found'}),authErrorMessage({code:'auth/wrong-password'}));
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 await mockVisitorTracking(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));let attempts=0;
 await page.route('**/identitytoolkit.googleapis.com/**', async route=> {
 const url=route.request().url();
 if(url.includes('signInWithPassword')){attempts++;await route.fulfill({status:400,json:{error:{code:400,message:'INVALID_LOGIN_CREDENTIALS',errors:[{message:'INVALID_LOGIN_CREDENTIALS',domain:'global',reason:'invalid'}]}}});}
 else if(url.includes('sendOobCode'))await route.fulfill({json:{kind:'identitytoolkit#GetOobConfirmationCodeResponse',email:'test@example.com'}});
 else await route.continue();
 });
 await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4177/#/login');
 await page.getByLabel('Email',{exact:true}).fill('test@example.com');
 await page.getByLabel('Password',{exact:true}).fill('wrong-password');
 await page.getByRole('button',{name:'Show password',exact:true}).click();assert.equal(await page.getByLabel('Password',{exact:true}).getAttribute('type'),'text');
 await page.getByRole('button',{name:'Hide password',exact:true}).click();
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').textContent(),/email or password is incorrect/);assert(!(await page.getByRole('alert').textContent()).includes('auth/'));assert.equal(attempts,1);
 await page.screenshot({path:'.tmp/screenshots/login-redesign-desktop.png'});
 for(const width of [320,390,700,859,1024,1440]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.tmp/screenshots/login-redesign-mobile.png'});
 await page.getByRole('button',{name:'Reset password',exact:true}).click();await page.getByRole('status').filter({hasText:'If this email'}).waitFor();assert.equal(await page.getByRole('alert').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: credential error recovery, password visibility, mocked reset, 6 responsive widths, no JavaScript errors or live account writes.');
}finally{await browser.close()}
