import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from '@babel/parser';
import { profile, projects, experience, capabilities, achievements } from '../src/site/content.js';
import quotes from '../src/data/quotes.js';
const en=JSON.parse(fs.readFileSync('src/i18n/locales/en/portfolio.json','utf8')).messages;
const vi=JSON.parse(fs.readFileSync('src/i18n/locales/vi/portfolio.json','utf8')).messages;
assert.deepEqual(Object.keys(en).sort(),Object.keys(vi).sort());
for(const key of Object.keys(en)) {assert.equal(en[key],key);assert.ok(vi[key]);}
const expected=[profile.positioning,profile.introduction,profile.about,...achievements,...quotes.map(quote=>quote.q)];
for(const project of projects) expected.push(...['category','role','summary','problem','built','challenge','outcome'].map(key=>project[key]),...project.layers,...(project.team?[project.team]:[]));
for(const job of experience) expected.push(job.dates,job.role,job.description,...job.details);
for(const capability of capabilities) expected.push(capability.title,capability.description,capability.items);
for(const key of expected) assert.ok(Object.hasOwn(vi,key),`Missing content: ${key}`);
for(const filename of ['Portfolio.jsx','LayerStory.jsx','QuoteRotator.jsx','ProductPreview.jsx']){
 const ast=parse(fs.readFileSync(`src/site/${filename}`,'utf8'),{sourceType:'module',plugins:['jsx']});
 const visit=node=>{
  if(!node || typeof node!=='object') return;
  if(node.type==='CallExpression' && node.callee.name==='t' && node.arguments[0]?.type==='StringLiteral') assert.ok(Object.hasOwn(vi,node.arguments[0].value),`Missing static: ${node.arguments[0].value}`);
  for(const value of Object.values(node)) if(Array.isArray(value))value.forEach(visit);else if(value && typeof value==='object')visit(value);
 };
 visit(ast);
}
assert.match(fs.readFileSync('src/site/Portfolio.jsx','utf8'),/job\.dates\.endsWith\('Present'\)/);
assert.match(fs.readFileSync('src/site/QuoteRotator.jsx','utf8'),/useMemo\(.*quotes\[index\].*\[index, language, t\]/);
console.log(`Verified ${Object.keys(en).length} bilingual entries, all 50 quotes, all source prose and every literal translation call.`);

