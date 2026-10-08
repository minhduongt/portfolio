import { useLanguage } from '../i18n/LanguageProvider';
import { useVisitors } from './VisitorProvider';

export default function VisitorStats() {
  const { t, locale } = useLanguage();
  const stats = useVisitors();
  if (stats.status === 'disabled') return null;
  const available = stats.totalVisits !== undefined;
  return <div className={`visitor-stats${stats.status === 'ready' ? ' is-live' : ''}`} role="group" aria-label={t("Visitor statistics")}>
    <span className="visitor-stat" title={t("Browsers active within the last two minutes")}><span className="visitor-live-dot" aria-hidden="true" /><strong>{available ? stats.activeVisitors.toLocaleString(locale) : '—'}</strong> {t("Active now")}</span>
    <span className="visitor-stat" title={t("Browser sessions; a new visit begins after 30 minutes of inactivity")}><strong>{available ? stats.totalVisits.toLocaleString(locale) : '—'}</strong> {t("Total visits")}</span>
    {stats.status !== 'ready' && <span className="visitor-stats-note">{stats.status === 'loading' ? t("Connecting…") : stats.status === 'stale' ? t("Last known counts") : t("Counts unavailable")}</span>}
  </div>;
}
