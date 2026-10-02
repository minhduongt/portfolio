import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
assert(existsSync('src/site/api.js'), 'API integration is missing');
const { requestApi, toolDefinition, contentPayload } = await import('../src/site/api.js');
const originalFetch = globalThis.fetch;
try {
  let received;
  globalThis.fetch = async (url, options) => { received = { url, options }; return new Response(JSON.stringify({ success: true, data: [{ slug: 'example' }] }), { status: 200 }); };
  const user = { getIdToken: async () => 'test-id-token' };
  assert.deepEqual(await requestApi('/blogs', { base: 'https://api.example/api/v1/', user }), [{ slug: 'example' }]);
  assert.equal(received.url, 'https://api.example/api/v1/blogs');
  assert.equal(received.options.headers.Authorization, 'Bearer test-id-token');
  globalThis.fetch = async () => new Response(JSON.stringify({ success: false, message: 'Verified administrator access is required', code: 'FORBIDDEN' }), { status: 403 });
  await assert.rejects(() => requestApi('/tools', { base: 'https://api.example/api/v1' }), error => error.status === 403 && /administrator/.test(error.message));
  globalThis.fetch = async () => new Response('<html>Not an API</html>', { status: 200 });
  await assert.rejects(() => requestApi('/blogs', { base: 'https://api.example/api/v1' }), /valid JSON/);
} finally { globalThis.fetch = originalFetch; }
assert.equal(toolDefinition({ slug: 'json', component: 'json-formatter', name: 'JSON' }).id, 'json');
assert.equal(toolDefinition({ slug: 'unknown', component: 'https://evil.example/code.js' }).id, null);
const blog = contentPayload('blogs', { title: 'Hello', slug: 'first-post', contentHtml: '<p>Hello</p>', visibility: 'private', tags: 'react, web', excerpt: '', coverImageUrl: '' }, true);
assert(!Object.hasOwn(blog, 'slug'));
assert.deepEqual(blog.tags, ['react', 'web']);
assert.throws(() => contentPayload('blogs', { title: 'Hello', contentHtml: '<p>Hello</p>', visibility: 'public', coverImageUrl: '' }, { coverImageUrl: 'https://example.com/cover.png' }), /cannot.*remove/i);
assert.throws(() => contentPayload('tools', { name: 'Test', description: 'Test', slug: 'test', component: 'json-formatter', visibility: 'public', sortOrder: '0', config: '[]' }), /object/i);
console.log('PASS: content contract, bearer token, errors, tool registry and editor payloads.');
