import { createContext, useContext, useEffect, useState } from 'react';
import { apiBase, requestApi } from './api';

const Visitors = createContext({ status: 'disabled' });
export const useVisitors = () => useContext(Visitors);
const storageKey = 'portfolio.visitorId';
const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu;
let memoryId;
function visitorId() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved && uuidPattern.test(saved)) return memoryId = saved.toLowerCase();
  } catch { /* Storage may be unavailable; reuse the in-memory ID. */ }
  memoryId ||= crypto.randomUUID();
  try { localStorage.setItem(storageKey, memoryId); } catch { /* Current-page tracking still works. */ }
  return memoryId;
}
export default function VisitorProvider({ children }) {
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    if (location.pathname.includes('design-preview')) { setState({ status: 'disabled' }); return; }
    if (!apiBase) { setState({ status: 'unavailable' }); return; }
    let id;
    try { id = visitorId(); } catch { /* Read aggregate counts even without local UUID support. */ }
    let referrer = '';
    try {
      const source = new URL(document.referrer);
      if (['http:', 'https:'].includes(source.protocol) && source.origin.length <= 2048) referrer = source.origin;
    } catch { /* Direct visits have no referring site. */ }
    const landingPage = location.pathname.length <= 2048 ? location.pathname : '';
    let timer, pending, disposed = false;
    const refresh = async () => {
      if (disposed || pending || document.visibilityState !== 'visible') return;
      const controller = new AbortController(); pending = controller;
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        if (id) {
          try { await requestApi('/visitors/heartbeat', { method: 'POST', body: { visitorId: id, referrer, landingPage }, signal: controller.signal, cache: 'no-store' }); }
          catch (error) { if (controller.signal.aborted) throw error; }
        }
        const stats = await requestApi('/visitors/stats', { signal: controller.signal, cache: 'no-store' });
        if (!stats || ![stats.activeVisitors, stats.totalVisits].every(value => Number.isSafeInteger(value) && value >= 0)) throw new Error('Invalid visitor counters.');
        if (!disposed && pending === controller) setState({ status: 'ready', activeVisitors: stats.activeVisitors, totalVisits: stats.totalVisits });
      } catch {
        if (!disposed && pending === controller) setState(previous => ({ ...previous, status: previous.totalVisits === undefined ? 'unavailable' : 'stale' }));
      } finally {
        clearTimeout(timeout); if (pending === controller) pending = null;
      }
    };
    const stop = () => { clearInterval(timer); pending?.abort(); pending = null; };
    const visibility = () => {
      stop();
      if (!disposed && document.visibilityState === 'visible') { void refresh(); timer = setInterval(refresh, 60000); }
    };
    visibility(); document.addEventListener('visibilitychange', visibility);
    return () => { disposed = true; stop(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return <Visitors.Provider value={state}>{children}</Visitors.Provider>;
}
