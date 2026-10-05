import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from '../.tmp/tooling/node_modules/playwright/index.mjs';
import { mockVisitorTracking } from './mock-visitor-tracking.mjs';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  await page.route('**/api/v1/tools', route => route.fulfill({ json: { success: true, data: [{ slug: 'powerfx', name: 'Power Fx Formatter', component: 'powerfx-formatter', visibility: 'public', description: 'Format a formula', category: 'Development' }] } }));
  await mockVisitorTracking(page);
  await page.goto(new URL('tools', process.env.SITE_URL || 'http://127.0.0.1:4177/').href);
  await page.getByRole('button', { name: 'Power Fx Formatter', exact: true }).click();
  const input = page.getByLabel('Power Fx input'), output = page.getByLabel('Formatted Power Fx');
  await input.fill(readFileSync(new URL('./fixtures/powerfx-menu.fx', import.meta.url), 'utf8'));
  await page.getByRole('button', { name: 'Format Power Fx', exact: true }).click();
  const result = await output.inputValue();
  assert(result.startsWith('Set(varMachineType, ThisItem.Name);\nSet(LoadingSpinnerImage, true);'));
  assert(result.includes('"Travelift", \'record type\'.Travelift,'));
  assert(result.includes('{Label: "Home", Screen: sc_LandingHome}'));
  assert(result.includes('Screen:\n                Switch('));
  await input.fill(result);
  await page.getByRole('button', { name: 'Format Power Fx', exact: true }).click();
  assert.equal(await output.inputValue(), result);
  await page.getByLabel('Formula separators').selectOption('comma');
  assert.equal(await output.inputValue(), '');
  await input.fill('Set(amount;1,25);;Notify("Saved")');
  await page.getByRole('button', { name: 'Format Power Fx', exact: true }).click();
  assert.equal(await output.inputValue(), 'Set(amount; 1,25);;\nNotify("Saved")');
  await input.fill('If(true,1]');
  await page.getByRole('button', { name: 'Format Power Fx', exact: true }).click();
  assert.equal(await output.inputValue(), '');
  assert.match(await page.getByRole('alert').textContent(), /Unmatched delimiter/u);
  console.log('PASS: supplied Power Fx formula, compact records, Switch layout, repeat formatting, comma locale and invalid input in the browser.');
} finally { await browser.close(); }
