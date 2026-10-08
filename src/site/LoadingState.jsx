import { useLanguage } from '../i18n/LanguageProvider';
export default function LoadingState({ label = 'Preparing your next view', detail = 'A little space for what comes next.', skeleton = false, compact = false, fullPage = false }) {
  const { t } = useLanguage();
  return <div className={`loading-state${compact ? ' loading-state--compact' : ''}${fullPage ? ' loading-state--page' : ''}`} role="status" aria-live="polite" aria-busy="true">
    <div className="loading-state__intro">
      <div className="loading-moon" aria-hidden="true"><span className="loading-moon__orbit" /><span className="loading-moon__crescent" /></div>
      <div><span className="loading-state__eyebrow" aria-hidden="true">{t("IN ORBIT")}</span><p className="loading-state__label">{t(label)}<span aria-hidden="true">…</span></p>{!compact && <p className="loading-state__detail">{t(detail)}</p>}</div>
    </div>
    {skeleton && <div className="loading-skeleton" aria-hidden="true">{[0, 1, 2].map(index => <div className="loading-skeleton__row" key={index}><span /><span /><span /></div>)}</div>}
  </div>;
}
