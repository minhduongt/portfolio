import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
assert(existsSync('src/site/tools/toolLogic.js'), 'Browser tool logic has not been implemented');
const { formatPowerFx, colorValues } = await import('../src/site/tools/toolLogic.js');
const cases = [
  ['If(true,Notify("a,b;()"),Set(x,{Name:"O""Brien",Value:1.25}));Reset(TextInput1)', 'dot'],
  ['Set(x;1,25);;Notify("ok")', 'comma'],
  ["Patch('Order Items',Defaults('Order Items'),{Title:\"It's fine\"})", 'dot'],
  ['If(true, // keep this comment\n Notify("yes"), /* block , ) */ Notify("no"))', 'dot'],
  ['With({n:1e-3},n + 2)', 'dot'],
];
for (const [input, locale] of cases) {
  const formatted = formatPowerFx(input, locale);
  assert(formatted.includes('\n'), 'Nested formula gets readable line breaks');
  assert.equal(formatPowerFx(formatted, locale), formatted, 'Formatting is idempotent');
  const literals = input.match(/"(?:[^"]|"")*"|'(?:[^']|'')*'/g) || [];
  for (const literal of literals) assert(formatted.includes(literal), 'Literal remains unchanged');
}
assert(formatPowerFx('Set(x;1,25)', 'comma').includes('1,25'));
assert(formatPowerFx('Set(x,1.25)', 'dot').includes('1.25'));
for (const bad of ['If(true,1]', '"unterminated', '/* unfinished', '$"Hello {User().FullName}"']) {
  assert.throws(() => formatPowerFx(bad), /delimiter|string|comment|interpolat/i);
}
assert.equal(formatPowerFx(''), '');
assert.throws(() => formatPowerFx('('.repeat(129) + '1' + ')'.repeat(129)), /nesting/i);
assert.deepEqual(colorValues('#ff0000'), { hex: '#FF0000', rgb: 'rgb(255, 0, 0)', hsl: 'hsl(0, 100%, 50%)' });
assert.equal(colorValues('#abc').hex, '#AABBCC');
assert.equal(colorValues('#808080').hsl, 'hsl(0, 0%, 50%)');
assert.throws(() => colorValues('not-a-color'), /hex/i);
console.log('PASS: Power Fx literals/comments/locales/idempotence and color conversion.');
