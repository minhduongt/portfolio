import assert from 'node:assert/strict';
import { blogCreatedDate } from '../src/site/blogDates.js';

for (const value of ['2026-10-08T09:30:00.000Z', 1791451800000, { _seconds: 1791451800, _nanoseconds: 0 }, { seconds: 1791451800, nanoseconds: 0 }]) {
  assert.equal(blogCreatedDate(value)?.toISOString(), '2026-10-08T09:30:00.000Z');
}
for (const value of [null, undefined, '', 'invalid', {}, { seconds: 'invalid' }]) assert.equal(blogCreatedDate(value), null);
console.log('PASS: blog dates support serialized Firestore timestamps, ISO dates and milliseconds; missing or invalid dates are omitted.');
