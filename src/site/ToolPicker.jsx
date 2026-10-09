import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageProvider';
import { useSession } from './AuthProvider';
import { requestApi } from './api';
import { LoadingIndicator } from './LoadingState';
import { siteLink } from './SiteNavigation';
import VisibilityBadge from './VisibilityBadge';
import { pinnedToolsKey, readPinnedTools, readToolStar } from './toolPreferences';

export function ToolLockIcon() {
  return <svg className="tool-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>;
}
function PreferenceIcon({ pin = false, filled = false }) {
  return <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{pin ? <path d="m16 3 5 5-4 1-4 4v4l-3-3-6 6 6-6-3-3h4l4-4Z" /> : <path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.4l-5.6 3 1.1-6.3L3 9.6l6.2-.9Z" />}</svg>;
}
const key = tool => tool.slug || tool.id;
export default function ToolPicker({ items, tool, search, setSearch, selected, onSelect, pinnedOnly, setPinnedOnly }) {
  const { t, locale } = useLanguage(), { user } = useSession();
  const uid = user?.uid;
  const owner = useRef(uid), active = useRef(new Map()); owner.current = uid;
  const [pins, setPins] = useState(() => { try { return readPinnedTools(localStorage); } catch { return []; } });
  const [notice, setNotice] = useState(''), [pending, setPending] = useState([]), [errors, setErrors] = useState({});
  const [stars, setStars] = useState({ owner: uid, values: {} });
  useEffect(() => {
    const update = event => { if (event.key === pinnedToolsKey || event.key === null) { try { setPins(readPinnedTools(localStorage)); } catch { /* Keep this tab's pins if storage is blocked. */ } } };
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);
  useEffect(() => {
    setPending([]); setErrors({});
    return () => { active.current.forEach(controller => controller.abort()); active.current.clear(); };
  }, [uid]);
  const pin = item => {
    const id = key(item), next = pins.includes(id) ? pins.filter(value => value !== id) : [...pins, id];
    setPins(next); setNotice('');
    try { localStorage.setItem(pinnedToolsKey, JSON.stringify(next)); }
    catch { setNotice('toolFavorites.storageUnavailable'); }
  };
  const state = item => (stars.owner === uid && stars.values[key(item)]) || { starred: Boolean(user && item.starred), starCount: Number.isSafeInteger(item.starCount) && item.starCount >= 0 ? item.starCount : 0 };
  const star = async item => {
    if (!user || !item.slug || active.current.has(item.slug)) return;
    const slug = item.slug, controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
    active.current.set(slug, controller); setPending(previous => [...previous, slug]); setErrors(previous => ({ ...previous, [slug]: '' }));
    try {
      const data = await requestApi(`/tools/${encodeURIComponent(slug)}/star`, { user, method: state(item).starred ? 'DELETE' : 'PUT', signal: controller.signal, cache: 'no-store' });
      const next = readToolStar(data, slug);
      if (owner.current === uid && active.current.get(slug) === controller && !controller.signal.aborted) setStars(previous => ({ owner: uid, values: { ...(previous.owner === uid ? previous.values : {}), [slug]: next } }));
    } catch (error) {
      if (owner.current === uid && active.current.get(slug) === controller) setErrors(previous => ({ ...previous, [slug]: error.status === 401 ? 'toolFavorites.signInError' : error.status === 404 ? 'toolFavorites.notFound' : 'toolFavorites.starError' }));
    } finally {
      clearTimeout(timer);
      if (active.current.get(slug) === controller) { active.current.delete(slug); setPending(previous => previous.filter(value => value !== slug)); }
    }
  };
  const visiblePins = items.filter(item => pins.includes(key(item))).length;
  const filtered = items.filter(item => (!pinnedOnly || pins.includes(key(item))) && `${item.name} ${item.category} ${t(item.name)} ${t(item.category)}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Number(pins.includes(key(b))) - Number(pins.includes(key(a))));
  return <div className="tool-picker" role="group" aria-label={t('Choose a tool')}>
    <label className="utility-field tool-search">{t('Find a tool')}<input type="search" placeholder={t('Search tools')} value={search} onChange={event => setSearch(event.target.value)} /></label>
    <div className="tool-picker-filters" role="group" aria-label={t('toolFavorites.filter')}><button aria-pressed={!pinnedOnly} onClick={() => setPinnedOnly(false)}>{t('All')}</button><button aria-pressed={pinnedOnly} onClick={() => setPinnedOnly(true)}>{t('toolFavorites.pinned')} <span>{visiblePins}</span></button></div>
    <p className="tool-favorites-help">{t('toolFavorites.help')}</p>
    <div className="tool-picker-list">{filtered.map(item => {
      const id = key(item), pinned = pins.includes(id), locked = item.locked === true || (item.visibility === 'limited' && !user), current = state(item), busy = pending.includes(item.slug);
      return <div className="tool-picker-item" key={id} data-selected={selected === id}>
        <button className="tool-picker-select" aria-pressed={selected === id} onClick={() => onSelect(id)} aria-label={t(item.name)}><span className="picker-icon" aria-hidden="true">{locked ? <ToolLockIcon /> : item.icon}</span><span><strong>{t(item.name)}</strong><small>{t(item.category)}</small><VisibilityBadge visibility={item.visibility} showMembers /></span><span aria-hidden="true">↗</span></button>
        <div className="tool-picker-actions"><button aria-pressed={pinned} aria-label={t(pinned ? 'toolFavorites.unpinName' : 'toolFavorites.pinName', { name: t(item.name) })} onClick={() => pin(item)}><PreferenceIcon pin filled={pinned} /><span>{t(pinned ? 'toolFavorites.pinned' : 'toolFavorites.pin')}</span></button>
          {item.slug && (user ? <button className="tool-star-button" aria-pressed={current.starred} aria-label={t(current.starred ? 'toolFavorites.unstarName' : 'toolFavorites.starName', { name: t(item.name) })} title={t(current.starred ? 'toolFavorites.unstar' : 'toolFavorites.star')} disabled={busy} onClick={() => star(item)}><PreferenceIcon filled={current.starred} /><span>{current.starCount.toLocaleString(locale)}</span></button> : <a className="tool-star-button" href={siteLink('login')} aria-label={t('toolFavorites.signInName', { name: t(item.name) })} title={t('toolFavorites.signIn')}><PreferenceIcon /><span>{current.starCount.toLocaleString(locale)}</span></a>)}
        </div>{busy && <LoadingIndicator label={t('toolFavorites.saving')} />}{errors[id] && <p className="tool-error" role="alert">{t(errors[id])}</p>}
      </div>;
    })}{!filtered.length && <p className="mock-note">{t(pinnedOnly ? 'toolFavorites.noPinned' : 'No matching tools.')}</p>}</div>
    {notice && <p className="mock-note" role="status">{t(notice)}</p>}
    <p className="mock-note">{t(tool.remote ? 'languageTool.privacy' : 'Your input stays in your browser.')}</p>
  </div>;
}
