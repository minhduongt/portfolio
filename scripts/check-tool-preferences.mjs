import assert from 'node:assert/strict';
import { pinnedToolsKey, readPinnedTools, readToolStar } from '../src/site/toolPreferences.js';
assert.deepEqual(readPinnedTools({ getItem: () => '["json-formatter","json-formatter","../bad",null,"url"]' }), ['json-formatter', 'url']);
assert.deepEqual(readPinnedTools({ getItem: () => '{broken' }), []);
assert.deepEqual(readPinnedTools({ getItem() { throw new Error('Storage blocked'); } }), []);
assert.deepEqual(readPinnedTools({ getItem: key => key === pinnedToolsKey ? '[]' : null }), []);
assert.deepEqual(readToolStar({ slug: 'json-formatter', starred: true, starCount: 4 }, 'json-formatter'), { starred: true, starCount: 4 });
for (const data of [{ slug: 'another', starred: true, starCount: 1 }, { slug: 'json-formatter', starred: 'true', starCount: 1 }, { slug: 'json-formatter', starred: true, starCount: -1 }, { slug: 'json-formatter', starred: true, starCount: Number.MAX_SAFE_INTEGER + 1 }]) assert.throws(() => readToolStar(data, 'json-formatter'));
console.log('Tool preferences: bounded local pins, corrupt/blocked storage and authoritative star response validation passed.');
