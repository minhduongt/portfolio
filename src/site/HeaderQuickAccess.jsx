import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageProvider';
import { useSession } from './AuthProvider';
import { requestApi, toolDefinition } from './api';
import { tools } from './data';
import { LoadingIndicator } from './LoadingState';
import { siteLink } from './SiteNavigation';
import usePinnedTools from './usePinnedTools';

export default function HeaderQuickAccess({ onNavigate }) {
  const { t } = useLanguage(), { user, isAdmin, loading } = useSession();
  const [pins] = usePinnedTools(), [catalogue, setCatalogue] = useState(null), [retry, setRetry] = useState(0);
  const owner = `${user?.uid || 'guest'}:${isAdmin}`, hasPins = pins.length > 0;
  useEffect(() => {
    if (!hasPins || loading) return;
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
    setCatalogue(null);
    if (location.pathname.includes('design-preview')) {
      setCatalogue({ owner, items: tools.map(tool => ({ ...tool, slug: tool.id, visibility: tool.visibility || 'public' })) });
      clearTimeout(timer); return;
    }
    requestApi('/tools', { user, signal: controller.signal, cache: 'no-store' }).then(items => {
      if (!Array.isArray(items)) throw new Error('Invalid tool catalogue');
      if (!controller.signal.aborted) setCatalogue({ owner, items: items.map(toolDefinition) });
    }).catch(() => { if (!disposed) setCatalogue({ owner, error: true }); }).finally(() => clearTimeout(timer));
    let disposed = false;
    return () => { disposed = true; controller.abort(); clearTimeout(timer); };
  }, [hasPins, owner, loading, retry]);
  if (!hasPins || loading) return null;
  const current = catalogue?.owner === owner ? catalogue : null;
  const items = (current?.items || []).filter(tool => pins.includes(tool.slug) && tool.archivedAt == null && !tool.isArchived && (['public', 'limited'].includes(tool.visibility) || (isAdmin && tool.visibility === 'private')));
  if (current?.items && !items.length) return null;
  return <div className="header-quick-access" role="group" aria-label={t('toolFavorites.quickAccess')}>
    <span className="header-quick-access__label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m16 3 5 5-4 1-4 4v4l-3-3-6 6 6-6-3-3h4l4-4Z" /></svg>{t('toolFavorites.pinned')}</span>
    <div className="header-quick-access__list">{!current ? <LoadingIndicator label={t('toolFavorites.loadingPins')} /> : current.error ? <button className="copy-button" onClick={() => setRetry(value => value + 1)}>{t('toolFavorites.retryPins')}</button> : items.map(tool => {
      const url = new URL(siteLink('tools'), location.origin); url.searchParams.set('tool', tool.slug);
      return <a key={tool.slug} href={`${url.pathname}${url.search}`} title={t(tool.name)} aria-label={t('toolFavorites.openName', { name: t(tool.name) })} onClick={onNavigate}><span className="header-quick-access__icon" aria-hidden="true">{tool.locked || (tool.visibility === 'limited' && !user) ? '🔒' : tool.icon}</span><span>{t(tool.name)}</span></a>;
    })}</div>
  </div>;
}
