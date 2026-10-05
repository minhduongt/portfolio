import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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
  assert.equal(formatPowerFx(formatted, locale), formatted, 'Formatting is idempotent');
  const literals = input.match(/"(?:[^"]|"")*"|'(?:[^']|'')*'/g) || [];
  for (const literal of literals) assert(formatted.includes(literal), 'Literal remains unchanged');
}
assert(formatPowerFx('Set(x;1,25)', 'comma').includes('1,25'));
assert(formatPowerFx('Set(x,1.25)', 'dot').includes('1.25'));
assert.equal(formatPowerFx('Set( varMachineType , ThisItem . Name );Set(LoadingSpinnerImage,true)'), 'Set(varMachineType, ThisItem.Name);\nSet(LoadingSpinnerImage, true)');
assert.equal(formatPowerFx('Filter(Items,Price>=10&&Discount<20)'), 'Filter(Items, Price >= 10 && Discount < 20)');
assert.equal(formatPowerFx('With({n:-1e-3},n+-2)'), 'With({n: -1e-3}, n + -2)');
assert.equal(formatPowerFx('Set(x;1,25);;Notify("ok")', 'comma'), 'Set(x; 1,25);;\nNotify("ok")');
const menu = 'Set(menuItems,Switch(varMachineType,"Travelift",Table({Label:"Home",Screen:sc_LandingHome},{Label:"Header",Screen:sc_Header}),"Taylor",Table({Label:"Home",Screen:sc_TaylorHeader})))';
const expectedMenu = `Set(
    menuItems,
    Switch(
        varMachineType,
        "Travelift",
            Table(
                {Label: "Home", Screen: sc_LandingHome},
                {Label: "Header", Screen: sc_Header}
            ),
        "Taylor",
            Table(
                {Label: "Home", Screen: sc_TaylorHeader}
            )
    )
)`;
assert.equal(formatPowerFx(menu), expectedMenu);
assert.equal(formatPowerFx(expectedMenu), expectedMenu);
assert.equal(formatPowerFx('Switch(machine,"Travelift",sc_Travelift,"Taylor",sc_Taylor)'), `Switch(
    machine,
    "Travelift", sc_Travelift,
    "Taylor", sc_Taylor
)`);
assert.equal(formatPowerFx('Set(x,1);// Keep , ()\nSet(y,2)'), 'Set(x, 1);\n\n// Keep , ()\nSet(y, 2)');
assert(formatPowerFx('If(true // comment\n,1,2)').includes('// comment\n    ,'));
assert.equal(formatPowerFx('Set(x,20%);Set(y,[@Value]);Set(z,Record!Name)'), 'Set(x, 20%);\nSet(y, [@Value]);\nSet(z, Record!Name)');
const reference = readFileSync(new URL('./fixtures/powerfx-menu.fx', import.meta.url), 'utf8');
const referenceOutput = formatPowerFx(reference);
const withoutLayout = value => value.replace(/("(?:[^"]|"")*"|'(?:[^']|'')*'|\/\/[^\r\n]*|\/\*[\s\S]*?\*\/)|\s+/gu, (_match, literal) => literal || '');
assert.equal(withoutLayout(referenceOutput), withoutLayout(reference), 'Full supplied formula preserves every literal, identifier and punctuation mark');
assert.equal(formatPowerFx(referenceOutput), referenceOutput);
assert(referenceOutput.includes('"Travelift", \'record type\'.Travelift,'));
assert(referenceOutput.includes('{Label: "Home", Screen: sc_LandingHome}'));
assert(referenceOutput.includes('Screen:\n                Switch('));
assert(referenceOutput.endsWith('Navigate(sc_PendingApproval);'));
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
