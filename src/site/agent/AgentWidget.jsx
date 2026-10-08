import { lazy, Suspense, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider';
import './agent.css';

const AgentPanel = lazy(() => import('./AgentPanel'));
export default function AgentWidget() {
  const { t } = useLanguage();
  const [opened, setOpened] = useState(false), [loaded, setLoaded] = useState(false);
  const trigger = useRef(null);
  const close = () => { setOpened(false); };
  return <div className="z-agent">
    <button ref={trigger} className="agent-trigger" aria-label={t('agent.open')} aria-haspopup="dialog" aria-expanded={opened} onClick={() => { setLoaded(true); setOpened(true); }}><span className="agent-orbit" aria-hidden="true">Z<span /></span><span>{t('agent.name')}</span><span className="agent-trigger-arrow" aria-hidden="true">↗</span></button>
    {loaded && <Suspense fallback={opened ? <div className="agent-loading" role="status">{t('agent.loading')}</div> : null}><AgentPanel open={opened} onClose={close} /></Suspense>}
  </div>;
}
