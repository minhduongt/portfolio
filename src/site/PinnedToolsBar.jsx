import { useLanguage } from '../i18n/LanguageProvider';
import { useSession } from './AuthProvider';
import { siteLink } from './SiteNavigation';
import usePinnedTools from './usePinnedTools';

export default function PinnedToolsBar({ items }) {
  const { t } = useLanguage(), { user, isAdmin } = useSession();
  const [pins] = usePinnedTools();
  const pinned = items.filter(tool => pins.includes(tool.slug || tool.id) && tool.archivedAt == null && !tool.isArchived && (['public', 'limited'].includes(tool.visibility || 'public') || (isAdmin && tool.visibility === 'private')));
  if (!pinned.length) return null;
  return <div className="pinned-tools-bar" role="group" aria-label={t('toolFavorites.quickAccess')}>
    <span className="pinned-tools-bar__label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m16 3 5 5-4 1-4 4v4l-3-3-6 6 6-6-3-3h4l4-4Z" /></svg>{t('toolFavorites.pinned')}</span>
    <div className="pinned-tools-bar__list">{pinned.map(tool => {
      const url = new URL(siteLink('tools'), location.origin); url.searchParams.set('tool', tool.slug || tool.id);
      return <a key={tool.slug || tool.id} href={`${url.pathname}${url.search}`} title={t(tool.name)} aria-label={t('toolFavorites.openName', { name: t(tool.name) })}><span className="pinned-tools-bar__icon" aria-hidden="true">{tool.locked || (tool.visibility === 'limited' && !user) ? '🔒' : tool.icon}</span><span>{t(tool.name)}</span></a>;
    })}</div>
  </div>;
}
