import { mockVisitorTracking } from './mock-visitor-tracking.mjs';
﻿import assert from 'node:assert/strict';
import {chromium} from '../.tmp/tooling/node_modules/playwright/index.mjs';
import {componentKeys} from '../src/site/api.js';
const base=process.env.SITE_URL || 'http://127.0.0.1:4177/';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 for(const role of ['reader','admin']){
  const context=await browser.newContext();const page=await context.newPage();
 await mockVisitorTracking(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));const writes=[];let allTools=false;
  await context.route('https://identitytoolkit.googleapis.com/**',async route=>{const now=Math.floor(Date.now()/1000);const token=`${Buffer.from(JSON.stringify({alg:'none'})).toString('base64url')}.${Buffer.from(JSON.stringify({aud:'dtminh-dev',iss:'https://securetoken.google.com/dtminh-dev',sub:role,user_id:role,email:`${role}@example.com`,email_verified:true,auth_time:now,iat:now,exp:now+3600,firebase:{sign_in_provider:'password',identities:{email:[`${role}@example.com`]}}})).toString('base64url')}.fixture`;await route.fulfill({json:route.request().url().includes('accounts:lookup')?{users:[{localId:role,email:`${role}@example.com`,emailVerified:true,providerUserInfo:[{providerId:'password',email:`${role}@example.com`}]}]}:{localId:role,email:`${role}@example.com`,idToken:token,refreshToken:'fixture-refresh',expiresIn:'3600'}})});
  await context.route('**/api/v1/**',async route=>{
   const req=route.request(),url=new URL(req.url()),signedIn=!!req.headers().authorization;
   if(url.pathname.endsWith('/auth/me'))return route.fulfill({json:{success:true,data:{uid:role,role:role==='admin'?'admin':'user'}}});
   if(req.method()==='POST'){writes.push(req.postDataJSON());return route.fulfill({status:201,json:{success:true,data:req.postDataJSON()}})}
   const items=['public','limited','private'].filter(v=>v==='public'||signedIn&&(v==='limited'||role==='admin')).map(visibility=>({slug:visibility,visibility,title:visibility+' article',name:visibility+' tool',excerpt:'Example',description:'Example',contentHtml:'<p>Example</p>',component:'json-formatter',tags:[]}));
   if(url.pathname.endsWith('/tools') && url.searchParams.has('includeArchived')){
    if(allTools)return route.fulfill({json:{success:true,data:Object.keys(componentKeys).map(component=>({slug:component,name:component,component,visibility:'public'}))}});
    items.push({slug:'archived-url',name:'Archived URL tool',component:'url-encoder-decoder',visibility:'private',archivedAt:'2026-01-01'});
   }
   return route.fulfill({json:{success:true,data:items}});
  });
  await page.goto(base+'#/blogs');await page.getByRole('link',{name:'public article',exact:false}).waitFor();assert.equal(await page.getByRole('link',{name:'limited article',exact:false}).count(),0);assert(await page.locator('.content-access-note').isVisible());
  assert.equal(await page.locator('.visibility-badge').count(),0,'Guests do not see visibility badges');
  await page.goto(base+'#/login');await page.getByLabel('Email',{exact:true}).fill(`${role}@example.com`);await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Sign out',exact:true}).waitFor();
  await page.goto(base+'#/blogs');await page.getByRole('link',{name:'limited article',exact:false}).waitFor();assert.equal(await page.getByRole('link',{name:'private article',exact:false}).count(),role==='admin'?1:0);assert.equal(await page.locator('.content-access-note').count(),0);
  assert.equal(await page.locator('.visibility-badge').count(),role==='admin'?3:0,'Only administrators see blog visibility badges');
  await page.goto(base+'#/tools');await page.getByRole('button',{name:'limited tool',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'private tool',exact:true}).count(),role==='admin'?1:0);
  assert.equal(await page.locator('.visibility-badge').count(),role==='admin'?3:0,'Only administrators see tool visibility badges');
  if(role==='admin'){
   await page.goto(base+'#/admin');
   for(const kind of ['blog','tool']){
    if(kind==='tool'){
     await page.getByRole('button',{name:'Tools management',exact:true}).click();
     await page.getByRole('button',{name:'Edit public article',exact:true}).click();
     const components=page.locator('.admin-editor').getByLabel('Tool component');
     assert.equal(await components.inputValue(),'json-formatter');
     assert(!(await components.locator('option').evaluateAll(items=>items.map(e=>e.value))).includes('url-encoder-decoder'));
     await page.getByRole('button',{name:'Cancel editing',exact:true}).click();
    }
    await page.getByRole('button',{name:'New '+kind,exact:true}).click();const editor=page.locator('.admin-editor');
    await editor.getByLabel('Visibility').waitFor();assert.deepEqual(await editor.getByLabel('Visibility').locator('option').evaluateAll(items=>items.map(e=>e.value)),['public','limited','private']);
    if(kind==='tool'){
     const components=editor.getByLabel('Tool component');
     const options=await components.locator('option').evaluateAll(items=>items.map(e=>e.value));
     assert(!options.includes('json-formatter'));assert(!options.includes('url-encoder-decoder'));
     assert.equal(await components.inputValue(),'word-counter');
    }
    await editor.getByLabel('Slug',{exact:true}).fill('members-'+kind);await editor.getByLabel(kind==='blog'?'Title':'Tool name',{exact:true}).fill('Members content');await editor.getByLabel(kind==='blog'?'Blog HTML':'Description',{exact:true}).fill(kind==='blog'?'<p>Members content</p>':'Members content');await editor.getByLabel('Visibility').selectOption('limited');await editor.getByRole('button',{name:'Save content',exact:true}).click();await page.getByRole('status').filter({hasText:'Changes saved'}).waitFor();
   }assert.equal(writes.length,2);assert(writes.every(body=>body.visibility==='limited'));assert.equal(writes[1].component,'word-counter');
   allTools=true;await page.getByRole('button',{name:'Reload list',exact:true}).click();
   await page.getByText('All tool components already exist.',{exact:false}).waitFor();
   assert(await page.getByRole('button',{name:'New tool',exact:true}).isDisabled());
  }else{
   await page.goto(base+'#/login');await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByLabel('Email',{exact:true}).waitFor();await page.goto(base+'#/blogs');await page.getByRole('link',{name:'public article',exact:false}).waitFor();assert.equal(await page.getByRole('link',{name:'limited article',exact:false}).count(),0);
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS: guest/reader/admin blog and tool UI, badges, sign-in prompt, logout cleanup and admin limited-visibility saves for both content types.');
}finally{await browser.close()}
