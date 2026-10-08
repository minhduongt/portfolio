import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider';
import { requestApi } from '../api';
import { validateAction } from './protocol';

const Context = createContext(null);

export function AgentBridge({ children, navigate, page }) {
  const { setLanguage } = useLanguage();
  const handler = useRef(null), waiting = useRef(new Set());
  const pageRef = useRef(page); pageRef.current = page;
  const value = useMemo(() => ({
    register(view) {
      handler.current = view;
      waiting.current.forEach(check => check());
      return () => { if (handler.current === view) handler.current = null; };
    },
    context: () => ['admin', 'login'].includes(pageRef.current) ? {} : handler.current?.page === pageRef.current ? handler.current.context : pageRef.current === 'portfolio' ? { route: '/' } : { route: `/${pageRef.current}` },
    async execute(candidate, { signal, beforeApply } = {}) {
      signal?.throwIfAborted();
      let blogs = [];
      if (candidate.type === 'navigate' && candidate.path?.startsWith('/blogs/')) {
        const id = candidate.path.slice(7);
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id)) throw new Error('Unsupported action');
        const post = await requestApi(`/blogs/${id}`, { cache: 'no-store', signal });
        if (post?.visibility === 'public' && post.archivedAt == null && !post.isArchived) blogs = [id];
      }
      const action = validateAction(candidate, { blogs });
      signal?.throwIfAborted();
      if (!action) throw new Error('Unsupported action');
      if (action.type === 'change_language') { setLanguage(action.language); return; }
      // External destinations are rendered as explicit confirmation links by the panel.
      if (action.type === 'open_external_link') throw new Error('Confirmation required');
      const targetPage = action.path.startsWith('/tools') ? 'tools' : action.path.startsWith('/blogs') ? 'blogs' : 'portfolio';
      if (action.type === 'navigate' && targetPage === 'blogs') { beforeApply?.(); navigate(action.path); return; }
      if (pageRef.current !== targetPage) navigate(action.path);
      const view = await new Promise((resolve, reject) => {
        const clean = () => { clearTimeout(timer); waiting.current.delete(check); signal?.removeEventListener('abort', abort); };
        const abort = () => { clean(); reject(new DOMException('Cancelled action', 'AbortError')); };
        const check = () => { if (handler.current?.page === targetPage) { clean(); resolve(handler.current); } };
        const timer = setTimeout(() => { clean(); reject(new Error('View unavailable')); }, 8000);
        signal?.addEventListener('abort', abort, { once: true });
        waiting.current.add(check); check();
      });
      signal?.throwIfAborted();
      if (!await view.execute(action, beforeApply)) throw new Error('Action unavailable');
    },
  }), [navigate, setLanguage]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useAgentBridge = () => useContext(Context);

export function useAgentPage(view) {
  const bridge = useAgentBridge();
  useEffect(() => view ? bridge?.register(view) : undefined, [bridge, view]);
}
