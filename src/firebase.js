import { getApp, getApps, initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyCNO7Gk6TSfxtYOIV-gj6WjLEc5TAaoWA0',
  authDomain: 'dtminh-dev.firebaseapp.com',
  projectId: 'dtminh-dev',
  storageBucket: 'dtminh-dev.firebasestorage.app',
  messagingSenderId: '530923894025',
  appId: '1:530923894025:web:75613a2e2301b921c84fd8',
  measurementId: 'G-9RFSNEZEWY',
};

export const firebaseApp = getApps().some(app => app.name === '[DEFAULT]') ? getApp() : initializeApp(firebaseConfig);

let analyticsPromise;
export function initializeAnalytics() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  analyticsPromise ??= import('firebase/analytics')
    .then(async ({ getAnalytics, isSupported }) => await isSupported() ? getAnalytics(firebaseApp) : null)
    .catch(error => {
      console.warn('Firebase Analytics is unavailable:', error.code || error.name);
      return null;
    });
  return analyticsPromise;
}
