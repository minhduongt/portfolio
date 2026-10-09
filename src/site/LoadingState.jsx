import { useLanguage } from '../i18n/LanguageProvider';
export function LoadingIndicator({ label = 'Working…' }) {
  const { t } = useLanguage();
  return <span className="loading-indicator" role="status" aria-busy="true"><span className="loading-indicator__spinner" aria-hidden="true" /><span className="sr-only">{t(label)}</span></span>;
}
export default function LoadingState({ label = 'Preparing your next view', skeleton = false, compact = false, fullPage = false }) {
  const { t } = useLanguage();
  return <div className={`loading-state${compact ? ' loading-state--compact' : ''}${fullPage ? ' loading-state--page' : ''}`} role="status" aria-live="polite" aria-busy="true">
    <div className="loading-state__intro">
      <div className="loading-moon" aria-hidden="true"><span className="loading-moon__orbit" /><span className="loading-moon__crescent" /></div>
      <span className="sr-only">{t(label)}</span>
    </div>
    {skeleton && <div className="loading-skeleton" aria-hidden="true">{[0, 1, 2].map(index => <div className="loading-skeleton__row" key={index}><span /><span /><span /></div>)}</div>}
  </div>;
}
