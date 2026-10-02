import { lazy, Suspense, useEffect, useState } from 'react';
import LoadingState from './LoadingState';
import Portfolio from './Portfolio';

const Pages = lazy(() => import('./Pages'));
const LoginPage = lazy(() => import('./LoginPage'));
const AdminPage = lazy(() => import('./AdminPage'));
function route() {
  const [page, postSlug] = location.hash.slice(2).split('/');
  return location.hash.startsWith('#/') && ['blogs', 'tools', 'login', 'admin'].includes(page)
    ? { page, postSlug } : { page: 'portfolio' };
}

export default function App() {
  const [current, setCurrent] = useState(route);
  useEffect(() => {
    const change = () => setCurrent(route());
    addEventListener('hashchange', change);
    return () => removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    if (current.page !== 'portfolio' || location.hash === '#home' || location.hash === '') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
    }
  }, [current.page, current.postSlug]);
  return current.page === 'portfolio' ? <Portfolio /> : <Suspense fallback={<LoadingState label="Preparing your next view" fullPage />}>{current.page === 'login' ? <LoginPage /> : current.page === 'admin' ? <AdminPage /> : <Pages page={current.page} postSlug={current.postSlug} />}</Suspense>;
}
