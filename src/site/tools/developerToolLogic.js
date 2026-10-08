import { CronExpressionParser } from 'cron-parser';

export function boundedInteger(value, min, max, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new Error(`${label} must be an integer from ${min} to ${max}.`);
  return number;
}
function randomIndex(size) {
  const data = new Uint32Array(1), limit = 2 ** 32 - (2 ** 32 % size);
  do { crypto.getRandomValues(data); } while (data[0] >= limit);
  return data[0] % size;
}
export function generatePassword(length, groups) {
  length = boundedInteger(length, 8, 128, 'Password length');
  const alphabets = { lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', digits: '0123456789', symbols: '!@#$%^&*()-_=+[]{}:,.?' };
  const selected = Object.entries(alphabets).filter(([key]) => groups[key]).map(([, alphabet]) => alphabet);
  if (!selected.length) throw new Error('Select at least one character group.');
  const alphabet = selected.join('');
  const result = selected.map(group => group[randomIndex(group.length)]);
  while (result.length < length) result.push(alphabet[randomIndex(alphabet.length)]);
  for (let i = result.length - 1; i > 0; i--) { const j = randomIndex(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result.join('');
}
export function generateUuids(count) {
  return Array.from({ length: boundedInteger(count, 1, 100, 'UUID count') }, () => crypto.randomUUID()).join('\n');
}
const loremWords = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip commodo consequat duis aute irure reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');
export function generateLorem(mode, count) {
  count = boundedInteger(count, 1, mode === 'words' ? 2000 : 50, mode === 'words' ? 'Word count' : 'Paragraph count');
  const words = size => Array.from({ length: size }, (_, i) => loremWords[i < 8 ? i : randomIndex(loremWords.length)]).join(' ');
  if (mode === 'words') return words(count);
  if (mode !== 'paragraphs') throw new Error('Choose paragraphs or words.');
  return Array.from({ length: count }, () => Array.from({ length: 4 }, () => { const sentence = words(12 + randomIndex(9)); return sentence[0].toUpperCase() + sentence.slice(1) + '.'; }).join(' ')).join('\n\n');
}
export function parseIsoDate(value) {
  value = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value.trim())) throw new Error('Use an ISO date with an explicit timezone, e.g. 2026-10-02T12:00:00Z.');
  const date = new Date(value.trim());
  if (!Number.isFinite(date.getTime())) throw new Error('Enter a valid date.');
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  if (month < 1 || month > 12 || day < 1 || day > days) throw new Error('Enter a valid calendar date.');
  const time = value.trim().slice(11).match(/^(\d{2}):(\d{2})(?::(\d{2}))?/u);
  if (Number(time[1]) > 23 || Number(time[2]) > 59 || Number(time[3] || 0) > 59) throw new Error('Enter a valid clock time.');
  return date;
}
export function timestampDate(value, unit) {
  if (!['seconds', 'milliseconds'].includes(unit)) throw new Error('Choose seconds or milliseconds.');
  if (!/^[+-]?\d+(?:\.\d{1,3})?$/u.test(String(value).trim())) throw new Error('Enter a numeric UNIX timestamp.');
  const number = Number(value), ms = unit === 'seconds' ? Math.round(number * 1000) : number;
  if (!Number.isSafeInteger(ms) || Math.abs(ms) > 8.64e15) throw new Error('Timestamp is outside the supported date range or millisecond precision.');
  return new Date(ms);
}
export function describeDate(date, locale, t = value => value) {
  return `UTC: ${date.toISOString()}\n${t('Local')}: ${date.toLocaleString(locale)}\n${t('UNIX seconds')}: ${Math.floor(date.getTime() / 1000)}\n${t('UNIX milliseconds')}: ${date.getTime()}`;
}
export async function hashText(input, algorithm) {
  if (!['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].includes(algorithm)) throw new Error('Choose a supported SHA algorithm.');
  const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
function base64url(bytes) {
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}
function decodeSegment(segment) {
  if (!/^[A-Za-z0-9_-]+$/u.test(segment)) throw new Error('Invalid JWT base64url segment.');
  const bytes = Uint8Array.from(atob(segment.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - segment.length % 4) % 4)), char => char.charCodeAt(0));
  if (base64url(bytes) !== segment) throw new Error('JWT segment is not canonical base64url.');
  return bytes;
}
function jsonObject(text, label) {
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('Enter valid JSON for the JWT header or payload.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be a JSON object.`);
  return value;
}
export function decodeJwt(token) {
  if (token.length > 100000) throw new Error('JWT exceeds the 100,000-character limit.');
  const parts = token.trim().split('.');
  if (parts.length !== 3) throw new Error('A JWT must contain three dot-separated segments.');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const header = jsonObject(decoder.decode(decodeSegment(parts[0])), 'Header');
  const payload = jsonObject(decoder.decode(decodeSegment(parts[1])), 'Payload');
  if (parts[2]) decodeSegment(parts[2]);
  return { header, payload, signature: parts[2] || '(empty)', signatureVerified: false };
}
export async function encodeJwt(payloadText, secret, algorithm = 'HS256') {
  if (!['HS256', 'none'].includes(algorithm)) throw new Error('Only HS256 and explicitly unsigned tokens are supported.');
  if (payloadText.length > 50000) throw new Error('Payload exceeds the 50,000-character limit.');
  const payload = jsonObject(payloadText, 'Payload'), encoder = new TextEncoder();
  const header = { alg: algorithm, typ: 'JWT' };
  const body = `${base64url(encoder.encode(JSON.stringify(header)))}.${base64url(encoder.encode(JSON.stringify(payload)))}`;
  if (algorithm === 'none') return `${body}.`;
  if (!secret) throw new Error('Enter a secret to sign with HS256.');
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `${body}.${base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(body))))}`;
}
export function parseCron(expression, timezone, start, locale = 'en-GB') {
  const fields = expression.trim().split(/\s+/u);
  if (fields.length !== 5) throw new Error('Use five fields: minute, hour, day of month, month, day of week.');
  if (expression.length > 200 || /\bH\b/u.test(expression)) throw new Error('Use a standard expression without hashed H fields.');
  try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format(new Date()); } catch { throw new Error('Choose a valid IANA timezone.'); }
  const date = parseIsoDate(start);
  let schedule;
  try { schedule = CronExpressionParser.parse(expression, { tz: timezone, currentDate: date }); } catch { throw new Error('Enter a valid five-field cron expression.'); }
  const formatter = new Intl.DateTimeFormat(locale, { timeZone: timezone, dateStyle: 'medium', timeStyle: 'long' });
  return { fields, timezone, runs: Array.from({ length: 5 }, () => { const next = schedule.next().toDate(); return { utc: next.toISOString(), zoned: formatter.format(next) }; }) };
}
