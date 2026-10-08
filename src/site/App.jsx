import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import LoadingState from './LoadingState';
import Portfolio from './Portfolio';
import { useLanguage } from '../i18n/LanguageProvider';
import { AgentBridge } from './agent/AgentBridge';
import AgentWidget from './agent/AgentWidget';

const Pages = lazy(() => import('./Pages'));
const LoginPage = lazy(() => import('./LoginPage'));
const AdminPage = lazy(() => import('./AdminPage'));
function route() {
  // Keep existing bookmarks working after moving from hash routes to paths.
  if (location.hash.startsWith('#/')) {
    history.replaceState(null, '', `${import.meta.env.BASE_URL}${location.hash.slice(2)}`);
  }
  const path = location.pathname.slice(import.meta.env.BASE_URL.length);
  const [page, slug] = path.split('/');
  let postSlug;
  try { postSlug = slug ? decodeURIComponent(slug) : undefined; } catch { /* Invalid slug: show the list. */ }
  return ['blogs', 'tools', 'login', 'admin'].includes(page)
    ? { page, postSlug } : { page: 'portfolio' };
}

export default function App() {
  const { language, t } = useLanguage();
  const [current, setCurrent] = useState(route);
  const agentNavigate = useCallback(path => {
    history.pushState(null, '', `${import.meta.env.BASE_URL}${path.slice(1)}`);
    setCurrent(route());
  }, []);
  useEffect(() => {
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('common.metadata.description'));
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', t('common.metadata.social'));
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', language === 'vi' ? 'vi_VN' : 'en_US');
    const updateTitle = () => document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
    updateTitle();
    const observer = new MutationObserver(updateTitle);
    const title = document.querySelector('title');
    if (title) observer.observe(title, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language, t]);
  useEffect(() => {
    const change = () => setCurrent(route());
    const navigate = event => {
      const link = event.target.closest('a[href]');
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || !url.pathname.startsWith(import.meta.env.BASE_URL) || url.search || /\.html$/u.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.hash) {
        const target = document.getElementById(url.hash.slice(1));
        if (target) { event.preventDefault(); target.focus({ preventScroll: true }); target.scrollIntoView(); }
        return;
      }
      const path = url.pathname.slice(import.meta.env.BASE_URL.length).replace(/\/$/u, '');
      if (path && !/^(blogs(?:\/[^/]+)?|tools|login|admin)$/u.test(path)) return;
      event.preventDefault();
      history.pushState(null, '', `${url.pathname}${url.hash}`);
      change();
    };
    addEventListener('popstate', change);
    addEventListener('hashchange', change);
    document.addEventListener('click', navigate);
    return () => {
      removeEventListener('popstate', change);
      removeEventListener('hashchange', change);
      document.removeEventListener('click', navigate);
    };
  }, []);
  useEffect(() => {
    if (current.page !== 'portfolio' || location.hash === '#home' || location.hash === '') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
    }
    if (location.hash) history.replaceState(null, '', `${location.pathname}${location.search}`);
  }, [current.page, current.postSlug]);
  return <AgentBridge navigate={agentNavigate} page={current.page}>{current.page === 'portfolio' ? <Portfolio /> : <Suspense fallback={<LoadingState label={t('Preparing your next view')} fullPage />}>{current.page === 'login' ? <LoginPage /> : current.page === 'admin' ? <AdminPage /> : <Pages page={current.page} postSlug={current.postSlug} />}</Suspense>}<AgentWidget /></AgentBridge>;
}
