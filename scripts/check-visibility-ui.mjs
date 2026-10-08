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
     assert.equal(await page.locator('.admin-list').count(),0,'Editing replaces the management list');
     const components=page.locator('.admin-editor').getByLabel('Tool component');
     assert.equal(await components.inputValue(),'json-formatter');
     assert(!(await components.locator('option').evaluateAll(items=>items.map(e=>e.value))).includes('url-encoder-decoder'));
     await page.getByRole('button',{name:'Cancel editing',exact:true}).click();
     assert(await page.locator('.admin-list').isVisible(),'Cancel restores the management list');
    }
    assert.equal(await page.locator('.admin-editor').count(),0,'Management initially shows only the list');
    await page.getByRole('button',{name:'New '+kind,exact:true}).click();const editor=page.locator('.admin-editor');
    assert.equal(await page.locator('.admin-list').count(),0,'Creating replaces the management list');
    assert.equal(await page.getByRole('button',{name:'New '+kind,exact:true}).count(),0,'List actions are hidden while creating');
    await page.getByRole('button',{name:'Cancel editing',exact:true}).click();
    assert.equal(await editor.count(),0,'Cancel closes the create form');
    assert(await page.locator('.admin-list').isVisible(),'Cancel creating restores the management list');
    await page.getByRole('button',{name:'New '+kind,exact:true}).click();
    await editor.getByLabel('Visibility').waitFor();assert.deepEqual(await editor.getByLabel('Visibility').locator('option').evaluateAll(items=>items.map(e=>e.value)),['public','limited','private']);
    if(kind==='blog'){
     const content=editor.getByRole('textbox',{name:'Blog Content',exact:true});
     assert.equal(await content.getAttribute('contenteditable'),'true','Blogs use a rich text editor');
     await content.fill('Formatted content');
     await content.press('Control+a');
     await editor.getByRole('button',{name:'Bold',exact:true}).click();
     assert.equal(await content.locator('b, strong').innerText(),'Formatted content','Toolbar formats selected text');
     await content.press('Control+z');
     assert.equal(await content.locator('b, strong').count(),0,'Native undo reverses toolbar formatting');
     await content.press('Control+a');
     await editor.getByRole('button',{name:'Bold',exact:true}).click();
     await editor.getByRole('button',{name:'Italic',exact:true}).click();
     assert.equal(await content.locator('i, em').innerText(),'Formatted content');
     await editor.getByRole('button',{name:'Add link',exact:true}).click();
     await editor.getByLabel('Link URL',{exact:true}).fill('javascript:alert(1)');
     await editor.getByRole('button',{name:'Insert link',exact:true}).click();
     await editor.getByRole('alert').filter({hasText:'HTTP'}).waitFor();
     await editor.getByLabel('Link URL',{exact:true}).fill('https://example.org/article');
     await editor.getByRole('button',{name:'Insert link',exact:true}).click();
     assert.equal(await content.locator('a').getAttribute('href'),'https://example.org/article');
     await content.focus();await content.press('Control+a');
     await editor.getByRole('button',{name:'Remove link',exact:true}).click();
     assert.equal(await content.locator('a').count(),0);
     await editor.getByRole('button',{name:'Bulleted list',exact:true}).click();
     assert.equal(await content.locator('ul li').innerText(),'Formatted content');
     await editor.getByRole('button',{name:'Numbered list',exact:true}).click();
     assert.equal(await content.locator('ol li').innerText(),'Formatted content');
     await editor.getByRole('button',{name:'Numbered list',exact:true}).click();
     await editor.getByLabel('Text style',{exact:true}).selectOption('h2');
     assert.equal(await content.locator('h2').innerText(),'Formatted content');
     await content.focus();await content.press('Control+a');
     await content.evaluate(element=>{
      const data=new DataTransfer();data.setData('text/plain','<div><h2>Pasted HTML heading</h2><p><strong>Pasted bold</strong></p><script>window.injected=true</script></div>');
      element.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:data}));
     });
     assert.equal(await content.getByRole('heading',{name:'Pasted HTML heading',exact:true}).innerText(),'Pasted HTML heading','Plain-text HTML source pastes as formatted content');
     assert.equal(await content.locator('strong').innerText(),'Pasted bold');
     assert.equal(await page.evaluate(()=>window.injected),undefined);
     await content.focus();await content.press('Control+a');
     await content.evaluate(element=>{
      const data=new DataTransfer();data.setData('text/html','<p><strong>Formatted content</strong></p><img src=x onerror="window.injected=true"><script>window.injected=true</script>');
      element.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:data}));
     });
     assert.equal(await content.locator('strong').innerText(),'Formatted content','Rich paste preserves safe formatting');
     assert.equal(await content.locator('img, script').count(),0,'Pasted HTML is sanitized before insertion');
     assert.equal(await page.evaluate(()=>window.injected),undefined);
     await editor.getByRole('button',{name:'HTML source',exact:true}).click();
     const source=editor.getByRole('textbox',{name:'Blog Content',exact:true});
     assert((await source.inputValue()).includes('Formatted content'),'HTML source contains rich formatting');
     await source.fill('<h2>Members content</h2><p><strong>Saved bold</strong></p><ul><li>First item</li></ul><img src=x onerror="window.injected=true"><script>window.injected=true</script>');
     await editor.getByRole('button',{name:'Rich text',exact:true}).click();
     assert.equal(await content.locator('h2').innerText(),'Members content');
     assert.equal(await content.locator('script, img').count(),0,'Unsafe source never enters the editable DOM');
     assert.equal(await page.evaluate(()=>window.injected),undefined);
     await editor.getByLabel('Title',{exact:true}).fill('Original bilingual draft');
     await page.locator('.language-switcher button[lang="vi"]').click();
     assert.equal(await editor.locator('input').nth(1).inputValue(),'Original bilingual draft','Language change preserves admin fields');
     assert((await editor.locator('[contenteditable]').innerText()).includes('Saved bold'),'Language change preserves rich text');
     assert((await editor.innerText()).includes('Lưu nội dung'),'Admin editor is localized');
     await page.locator('.language-switcher button[lang="en"]').click();
     for(const width of [320,390,1440]){
      await page.setViewportSize({width,height:950});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Rich text toolbar fits mobile widths');
     }
    }
    if(kind==='tool'){
     const components=editor.getByLabel('Tool component');
     const options=await components.locator('option').evaluateAll(items=>items.map(e=>e.value));
     assert(!options.includes('json-formatter'));assert(!options.includes('url-encoder-decoder'));
     assert.equal(await components.inputValue(),'word-counter');
    }
    await editor.getByLabel('Slug',{exact:true}).fill('members-'+kind);await editor.getByLabel(kind==='blog'?'Title':'Tool name',{exact:true}).fill('Members content');if(kind==='tool')await editor.getByLabel('Description',{exact:true}).fill('Members content');await editor.getByLabel('Visibility').selectOption('limited');await editor.getByRole('button',{name:'Save content',exact:true}).click();await page.getByRole('status').filter({hasText:'Changes saved'}).waitFor();
    assert.equal(await editor.count(),0,'Saving closes the editor');
    assert(await page.locator('.admin-list').isVisible(),'Saving restores the management list');
   }assert.equal(writes.length,2);assert(writes.every(body=>body.visibility==='limited'));assert.equal(writes[1].component,'word-counter');
   assert(writes[0].contentHtml.includes('<h2>Members content</h2>'),'Saving preserves formatted HTML');
   assert(writes[0].contentHtml.includes('<strong>Saved bold</strong>'));
   assert(!writes[0].contentHtml.includes('<script>'));
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
