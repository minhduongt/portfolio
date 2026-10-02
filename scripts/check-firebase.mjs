import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

assert(existsSync('src/firebase.js'), 'Firebase integration is missing');
const { firebaseApp, initializeAnalytics } = await import('../src/firebase.js');
assert.equal(firebaseApp.options.projectId, 'dtminh-dev');
assert.equal(firebaseApp.options.authDomain, 'dtminh-dev.firebaseapp.com');
assert.equal(firebaseApp.options.appId, '1:530923894025:web:75613a2e2301b921c84fd8');
assert.equal(firebaseApp.options.measurementId, 'G-9RFSNEZEWY');
assert.equal(firebaseApp.options.storageBucket, 'dtminh-dev.firebasestorage.app');
assert.equal(await initializeAnalytics(), null, 'Analytics must skip a non-browser environment');
console.log('PASS: Firebase project configuration and non-browser Analytics guard.');
