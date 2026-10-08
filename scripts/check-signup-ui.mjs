import assert from 'node:assert/strict';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { mockVisitorTracking } from './mock-visitor-tracking.mjs';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(); const errors = [], registrations = [], calls = [];
  let rejectSignup = false, verified = false;
  page.on('pageerror', error => errors.push(error.message));
  await mockVisitorTracking(page);
  await context.route('https://identitytoolkit.googleapis.com/**', async route => {
    const now = Math.floor(Date.now()/1000);
    const token = `${Buffer.from(JSON.stringify({alg:'none'})).toString('base64url')}.${Buffer.from(JSON.stringify({aud:'dtminh-dev',iss:'https://securetoken.google.com/dtminh-dev',sub:'new-user',user_id:'new-user',email:'new@example.com',email_verified:verified,auth_time:now,iat:now,exp:now+3600,firebase:{sign_in_provider:'password',identities:{email:['new@example.com']}}})).toString('base64url')}.fixture`;
    const lookup = route.request().url().includes('accounts:lookup');
    return route.fulfill({ json: lookup ? { users:[{localId:'new-user',email:'new@example.com',emailVerified:verified,providerUserInfo:[{providerId:'password',email:'new@example.com'}]}] } : {localId:'new-user',email:'new@example.com',idToken:token,refreshToken:'fixture-refresh',expiresIn:'3600'} });
  });
  await context.route('**/api/v1/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    calls.push(path);
    if (path.endsWith('/auth/signup')) {
      registrations.push(request.postDataJSON());
      assert.equal(request.headers().authorization, undefined);
      if (rejectSignup) return route.fulfill({ status:409,json:{success:false,code:'EMAIL_EXISTS',message:'This email is already registered; sign in instead'} });
      return route.fulfill({status:201,json:{success:true,data:{uid:'new-user',email:'new@example.com',emailVerified:false,idToken:'fixture',refreshToken:'fixture',expiresIn:3600,verificationEmailSent:false}}});
    }
    if (path.endsWith('/auth/resend-verification')) {
      assert(request.headers().authorization?.startsWith('Bearer '));
      return route.fulfill({json:{success:true,data:{verificationEmailSent:true}}});
    }
    return route.fulfill({json:{success:true,data:path.endsWith('/auth/me')?{uid:'new-user',role:'user',emailVerified:verified}:[]}});
  });
  await page.goto('http://127.0.0.1:4177/portfolio/login');
  await page.getByLabel('Email',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Sign up',exact:true}).count(),1,'Email registration is available');
  await page.getByRole('button',{name:'Sign up',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill(' new@example.com ');
  await page.getByLabel('Password',{exact:true}).fill('short');
  await page.getByLabel('Confirm password',{exact:true}).fill('short');
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'at least 6'}).waitFor();
  assert.equal(registrations.length,0);
  const password = '  valid password  ';
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByLabel('Confirm password',{exact:true}).fill('different');
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'Passwords do not match.'}).waitFor();
  assert.equal(registrations.length,0);
  await page.getByLabel('Confirm password',{exact:true}).fill(password);
  assert(await page.getByRole('button',{name:'Continue with Google',exact:true}).isVisible());
  for(const width of [320,390,768,1440]) { await page.setViewportSize({width,height:1000}); assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); }
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await page.getByRole('button',{name:'Sign out',exact:true}).waitFor();
  assert.deepEqual(registrations,[{email:'new@example.com',password}]);
  assert(calls.some(path=>path.endsWith('/auth/me')));
  await page.getByRole('status').filter({hasText:'verification email could not be sent'}).waitFor();
  await page.getByRole('button',{name:'Send verification email',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Verification email sent.'}).waitFor();
  await page.reload(); await page.getByRole('button',{name:'Sign out',exact:true}).waitFor();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await page.getByRole('button',{name:'Sign up',exact:true}).click();
  rejectSignup = true;
  await page.getByLabel('Email',{exact:true}).fill('new@example.com');
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByLabel('Confirm password',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'already registered'}).waitFor();
  assert.equal(await page.getByLabel('Password',{exact:true}).inputValue(),password,'Failed registration keeps input for correction');
  await page.locator('.language-switcher button[lang="vi"]').click();
  assert.match(await page.getByRole('alert').innerText(),/đã được đăng ký/u);
  assert.deepEqual(errors,[]);
  console.log('PASS: email signup, confirmation/length validation, backend payload, whitespace preservation, session persistence, resend, errors, Vietnamese and responsive layouts.');
} finally { await browser.close(); }
