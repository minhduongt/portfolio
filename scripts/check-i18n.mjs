import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { languagePreference, translate } from '../src/i18n/translation.js';

const resources = { en: { common: { messages: { 'Hello {{name}}': 'Hello {{name}}', 'Only English': 'Only English', 'Failed ({{status}}).': 'Failed ({{status}}).' }, nav: { about: 'About' } } }, vi: { common: { messages: { 'Hello {{name}}': 'Xin chào {{name}}', 'Failed ({{status}}).': 'Lỗi ({{status}}).' }, nav: { about: 'Giới thiệu' } } } };
assert.equal(languagePreference({ getItem: () => null }), 'en');
assert.equal(languagePreference({ getItem: () => 'vi' }), 'vi');
assert.equal(languagePreference({ getItem: () => 'fr' }), 'en');
assert.equal(languagePreference({ getItem: () => { throw new Error('blocked'); } }), 'en');
assert.equal(translate(resources, 'vi', 'Hello {{name}}', { name: 'Minh' }), 'Xin chào Minh');
assert.equal(translate(resources, 'vi', 'common.nav.about'), 'Giới thiệu');
assert.equal(translate(resources, 'vi', 'Only English'), 'Only English');
assert.equal(translate(resources, 'vi', 'Unlisted English text'), 'Unlisted English text');
assert.equal(translate(resources, 'unknown', 'common.nav.about'), 'About');
assert.equal(translate(resources, 'vi', 'Hello {{name}}'), 'Xin chào {{name}}');
assert.equal(translate(resources, 'vi', 'Failed (500).'), 'Lỗi (500).');
const catalogs = { en: {}, vi: {} };
for (const language of ['en', 'vi']) for (const file of readdirSync(new URL(`../src/i18n/locales/${language}/`, import.meta.url))) {
  catalogs[language][file.replace('.json', '')] = JSON.parse(readFileSync(new URL(`../src/i18n/locales/${language}/${file}`, import.meta.url), 'utf8'));
}
const flatten = (value, prefix = '') => Object.entries(value).flatMap(([key, entry]) => typeof entry === 'string' ? [[prefix + key, entry]] : flatten(entry, prefix + key + '.'));
for (const namespace of Object.keys(catalogs.en)) {
  const english = Object.fromEntries(flatten(catalogs.en[namespace])), vietnamese = Object.fromEntries(flatten(catalogs.vi[namespace]));
  assert.deepEqual(Object.keys(vietnamese).sort(), Object.keys(english).sort(), `${namespace}: language parity`);
  for (const [key, value] of Object.entries(english)) {
    assert(vietnamese[key].trim(), `${namespace}.${key}: empty Vietnamese entry`);
    assert.deepEqual(vietnamese[key].match(/\{\{\w+\}\}/gu)?.sort() || [], value.match(/\{\{\w+\}\}/gu)?.sort() || [], `${namespace}.${key}: placeholders`);
  }
}
for (const language of ['en', 'vi']) {
  const messages = new Map();
  for (const catalog of Object.values(catalogs[language])) for (const [key, value] of Object.entries(catalog.messages || {})) {
    if (messages.has(key)) assert.equal(value, messages.get(key), `${language}: conflicting duplicate ${key}`);
    messages.set(key, value);
  }
}
assert.match(translate(catalogs, 'vi', 'The content service returned an error (503). Please try again later.'), /503/u);
console.log('PASS: English default, saved/invalid/blocked preferences, nested keys, interpolation and English fallback.');
