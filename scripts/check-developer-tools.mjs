import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {generatePassword,generateUuids,generateLorem,timestampDate,parseIsoDate,hashText,encodeJwt,decodeJwt,parseCron} from '../src/site/tools/developerToolLogic.js';
for(let i=0;i<40;i++){const password=generatePassword(20,{lower:true,upper:true,digits:true,symbols:true});assert.equal(password.length,20);for(const pattern of [/[a-z]/,/[A-Z]/,/\d/,/[^a-zA-Z0-9]/])assert(pattern.test(password));}
assert.throws(()=>generatePassword(20,{}),/Select/);assert.throws(()=>generatePassword(129,{lower:true}),/length/);
const uuids=generateUuids(10).split('\n');assert.equal(new Set(uuids).size,10);assert(uuids.every(uuid=>/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/.test(uuid)));
assert.equal(generateLorem('words',30).split(' ').length,30);assert.equal(generateLorem('paragraphs',3).split('\n\n').length,3);
assert.equal(timestampDate('0','seconds').toISOString(),'1970-01-01T00:00:00.000Z');assert.equal(timestampDate('-1','seconds').getTime(),-1000);assert.equal(timestampDate('1.25','seconds').getTime(),1250);
assert.equal(timestampDate('1000','milliseconds').getTime(),1000);assert.throws(()=>timestampDate('1.25','milliseconds'),/precision/);assert.throws(()=>timestampDate('NaN','seconds'));
assert.equal(parseIsoDate('2026-10-02T19:00:00+07:00').toISOString(),'2026-10-02T12:00:00.000Z');assert.throws(()=>parseIsoDate('2026-02-30T00:00:00Z'),/calendar/);assert.throws(()=>parseIsoDate('2026-10-02T24:00:00Z'),/clock/);assert.throws(()=>parseIsoDate('2026-10-02T12:00:00'),/timezone/);
assert.equal(await hashText('abc','SHA-256'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');assert.equal(await hashText('','SHA-1'),'da39a3ee5e6b4b0d3255bfef95601890afd80709');assert.equal((await hashText('abc','SHA-512')).length,128);
const token=await encodeJwt(JSON.stringify({sub:'test',name:'Minh \u0110\u01b0\u01a1ng'}),'test-secret');const parts=token.split('.');assert.equal(parts[2],createHmac('sha256','test-secret').update(parts.slice(0,2).join('.')).digest('base64url'));assert.equal(decodeJwt(token).payload.sub,'test');assert.equal(decodeJwt(token).signatureVerified,false);
assert((await encodeJwt('{}','','none')).endsWith('.'));await assert.rejects(encodeJwt('{}',''),/secret/);assert.throws(()=>decodeJwt('bad.token'));assert.throws(()=>decodeJwt('a.b.c'));await assert.rejects(encodeJwt('[]','test'),/object/);
const cron=parseCron('*/15 * * * *','Asia/Ho_Chi_Minh','2026-01-01T00:01:00Z');assert.equal(cron.runs[0].utc,'2026-01-01T00:15:00.000Z');assert.equal(cron.runs.length,5);
assert.equal(parseCron('0 0 1 * MON','UTC','2026-01-02T00:00:00Z').runs[0].utc,'2026-01-05T00:00:00.000Z');assert(parseCron('0 0 * * THU','UTC','2026-01-02T00:00:00Z'));
assert.throws(()=>parseCron('bad','UTC','2026-01-01T00:00:00Z'));assert.throws(()=>parseCron('* * * * *','bad/timezone','2026-01-01T00:00:00Z'));
console.log('PASS: secure generators, lorem counts, timestamp/date validation, hash vectors, JWT HMAC/Unicode/malformed input, cron runs/day OR/timezone validation.');
