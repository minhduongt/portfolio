import assert from 'node:assert/strict';
import { createEmailDesign, createEmailBlock, renderEmailDesign, moveEmailBlock } from '../src/site/tools/emailDesign.js';
import { templateFields } from '../src/site/tools/emailTemplates.js';

for (const template of ['welcome', 'newsletter', 'receipt']) {
  const design = createEmailDesign(template, templateFields(template));
  const html = renderEmailDesign(design);
  assert(html.startsWith('<!doctype html>'));
  assert(html.includes('role="presentation"'));
  assert(html.includes(templateFields(template).heading));
  assert.equal(new Set(design.blocks.map(block => block.id)).size, design.blocks.length);
  if (template === 'receipt') assert(html.includes('ORDER-001'));
}
const design = createEmailDesign('welcome', templateFields());
for (const type of ['heading', 'text', 'image', 'button', 'divider', 'spacer', 'table', 'columns']) {
  const block = createEmailBlock(type);
  if (type === 'image') block.src = 'https://example.com/image.png';
  assert(renderEmailDesign({ ...design, blocks: [block] }).includes('<table'));
}
const heading = createEmailBlock('heading'); heading.text = '<img src=x> & "quoted"';
const output = renderEmailDesign({ ...design, blocks: [heading] });
assert(output.includes('&lt;img src=x&gt; &amp; &quot;quoted&quot;'));
assert(!output.includes('<img src=x>'));
const button = createEmailBlock('button'); button.url = 'javascript:alert(1)';
assert.throws(() => renderEmailDesign({ ...design, blocks: [button] }), /HTTP/);
const image = createEmailBlock('image'); image.src = 'data:image/svg+xml,<svg onload="alert(1)">';
assert.throws(() => renderEmailDesign({ ...design, blocks: [image] }), /image/i);
assert.throws(() => renderEmailDesign({ ...design, background: 'red;position:fixed' }), /color/i);
assert.throws(() => renderEmailDesign({ ...design, blocks: [{ ...heading, padding: -1 }] }), /padding/i);
assert.throws(() => renderEmailDesign({ ...design, blocks: [{ ...heading, align: 'bad' }] }), /align/i);
const a = createEmailBlock('text'), b = createEmailBlock('text'), c = createEmailBlock('text');
const original = [a, b, c];
assert.deepEqual(moveEmailBlock(original, a.id, 2).map(block => block.id), [b.id, c.id, a.id]);
assert.deepEqual(moveEmailBlock(original, c.id, 0).map(block => block.id), [c.id, a.id, b.id]);
assert.deepEqual(original, [a, b, c], 'Reordering does not mutate the previous design');
assert.equal(renderEmailDesign({ ...design, blocks: [] }).includes('<body'), true);
console.log('PASS: visual email templates, eight block types, escaped content, safe URLs/styles, immutable reordering and empty design.');
