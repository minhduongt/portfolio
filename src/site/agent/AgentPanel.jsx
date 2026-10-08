import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider';
import { requestApi } from '../api';
import { projects } from '../content';
import { siteLink } from '../SiteNavigation';
import { useAgentBridge } from './AgentBridge';
import { boundedHistory, projectId, readReply, sessionId, validateAction } from './protocol';

function Action({ action, open, onClose, onUnavailable }) {
  const { t } = useLanguage(), bridge = useAgentBridge();
  const [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const active = useRef(null);
  useEffect(() => { if (!open) { active.current?.abort(); setConfirm(false); } return () => active.current?.abort(); }, [open]);
  const label = action.type === 'navigate' ? t(action.sectionId ? 'agent.section' : 'agent.article', { name: t(action.sectionId === 'work' ? 'Selected work' : action.sectionId === 'layers' ? 'Capabilities' : action.sectionId === 'home' ? 'Home' : action.sectionId === 'about' ? 'About' : action.sectionId === 'experience' ? 'Experience' : 'Contact') }) : action.type === 'open_project' ? t('agent.project', { name: projects.find(item => projectId(item) === action.projectId)?.name }) : action.type === 'open_tool' ? t('agent.tool', { name: action.slug.replace(/-/gu, ' ') }) : action.type === 'change_language' ? t('agent.language', { name: action.language === 'vi' ? 'Tiếng Việt' : 'English' }) : t('agent.external', { name: action.linkId === 'github' ? 'GitHub' : 'LinkedIn' });
  const run = async () => {
    if (busy) return;
    const controller = new AbortController(); active.current = controller;
    const timer = setTimeout(() => { controller.abort(); setError(true); onUnavailable(); }, 10000);
    setBusy(true); setError(false);
    try { await bridge.execute(action, { signal: controller.signal, beforeApply: onClose }); }
    catch (error) { if (!controller.signal.aborted) { setError(true); onUnavailable(); } }
    finally { clearTimeout(timer); setBusy(false); if (active.current === controller) active.current = null; }
  };
  return <div className="agent-action">
    <button disabled={busy} onClick={() => action.type === 'open_external_link' ? setConfirm(!confirm) : run()}>{label}<span aria-hidden="true"> ↗</span></button>
    {confirm && validateAction(action) && <div className="agent-confirm"><p>{t('agent.confirmExternal', { host: new URL(action.url).hostname })}</p><a href={action.url} target="_blank" rel="noopener noreferrer" onClick={() => setConfirm(false)}>{t('agent.continue')} ↗</a><button onClick={() => setConfirm(false)}>{t('agent.cancel')}</button></div>}
    {error && <p role="alert">{t('agent.actionError')}</p>}
  </div>;
}

export default function AgentPanel({ open, onClose }) {
  const { t, language } = useLanguage(), bridge = useAgentBridge();
  const dialog = useRef(null), input = useRef(null), log = useRef(null), active = useRef(null), identity = useRef(null);
  const [metadata, setMetadata] = useState(null), [metadataRetry, setMetadataRetry] = useState(0);
  const [messages, setMessages] = useState([]), [draft, setDraft] = useState(''), [pending, setPending] = useState('');
  const [failure, setFailure] = useState(''), [cooldown, setCooldown] = useState(0), [tick, setTick] = useState(Date.now());
  const cancel = () => { active.current?.abort(); active.current = null; setPending(''); };
  useEffect(() => {
    if (open) { dialog.current.showModal(); input.current?.focus(); }
    else { cancel(); dialog.current?.close(); }
    return () => active.current?.abort();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
    setMetadata(null);
    requestApi(`/agent?language=${language}`, { signal: controller.signal, cache: 'no-store' }).then(data => {
      if (controller.signal.aborted) return;
      if (typeof data?.available !== 'boolean' || typeof data?.greeting !== 'string') throw new Error('Invalid metadata');
      setMetadata({ ...data, greeting: data.greeting.slice(0, 2000), suggestedQuestions: (Array.isArray(data.suggestedQuestions) ? data.suggestedQuestions : []).filter(item => typeof item === 'string' && item.length <= 2000).slice(0, 4) });
    }).catch(() => { if (open && !disposed) setMetadata({ available: false }); }).finally(() => clearTimeout(timer));
    let disposed = false;
    return () => { disposed = true; clearTimeout(timer); controller.abort(); };
  }, [open, language, metadataRetry]);
  useEffect(() => { if (open) log.current?.scrollTo({ top: log.current.scrollHeight }); }, [messages, pending, failure, open]);
  useEffect(() => {
    if (cooldown <= Date.now()) return;
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);
  // VisualViewport keeps the composer above the mobile software keyboard.
  useEffect(() => {
    if (!open || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const update = () => { dialog.current?.style.setProperty('--agent-height', `${viewport.height}px`); dialog.current?.style.setProperty('--agent-top', `${viewport.offsetTop}px`); };
    update(); viewport.addEventListener('resize', update); viewport.addEventListener('scroll', update);
    return () => { viewport.removeEventListener('resize', update); viewport.removeEventListener('scroll', update); };
  }, [open]);
  const blocked = pending || !metadata?.available || cooldown > tick;
  const send = async value => {
    const message = value.trim();
    if (active.current || blocked || !message || message.length > 2000) return;
    const controller = new AbortController(); active.current = controller;
    const timer = setTimeout(() => controller.abort(), 30000);
    setPending(message); setDraft(message); setFailure('');
    try {
      identity.current ||= sessionId();
      const data = await requestApi('/agent/chat', { method: 'POST', signal: controller.signal, cache: 'no-store', body: { sessionId: identity.current, message, language, history: boundedHistory(messages, message), context: bridge.context() } });
      // Public lookup allows article suggestions only if the guest listing contains them.
      let blogs = [];
      if (Array.isArray(data?.actions) && data.actions.some(action => action?.type === 'navigate' && action.path?.startsWith('/blogs/'))) {
        const list = await requestApi('/blogs', { signal: controller.signal, cache: 'no-store' });
        if (Array.isArray(list)) blogs = list.filter(post => post.visibility === 'public' && post.archivedAt == null && !post.isArchived).map(post => post.slug);
      }
      const reply = readReply(data, { blogs });
      if (controller.signal.aborted) return;
      setMessages(previous => [...previous, { role: 'user', content: message }, reply].slice(-40)); setDraft('');
    } catch (error) {
      if (active.current !== controller) return;
      setFailure(error.status === 429 ? 'agent.rateLimited' : error.code === 'AGENT_TIMEOUT' || error.name === 'AbortError' ? 'agent.timeout' : 'agent.unavailable');
      if (error.status === 429) { setCooldown(Date.now() + Math.max(60, error.retryAfter || 60) * 1000); setTick(Date.now()); }
    } finally {
      clearTimeout(timer);
      if (active.current === controller) { active.current = null; setPending(''); }
    }
  };
  const clear = () => { cancel(); setMessages([]); setDraft(''); setFailure(''); input.current?.focus(); };
  const applyClose = () => { dialog.current?.close(); onClose(); };
  return <dialog ref={dialog} className="agent-panel" aria-labelledby="agent-title" onCancel={event => { event.preventDefault(); onClose(); }} onClose={() => { if (open) onClose(); }}>
    <header className="agent-header"><span className="agent-orbit" aria-hidden="true">Z<span /></span><div><h2 id="agent-title">{t('agent.name')}</h2><p>{t('agent.subtitle')}</p></div><button className="agent-icon-button" onClick={clear} aria-label={t('agent.new')} title={t('agent.new')}>↺</button><button className="agent-icon-button" onClick={onClose} aria-label={t('agent.close')} title={t('agent.close')}>×</button></header>
    <div ref={log} className="agent-log" role="log" aria-live="polite" aria-relevant="additions" aria-label={t('agent.conversation')}>
      {!messages.length && !pending && <div className="agent-intro"><span className="agent-eyebrow">{t('agent.eyebrow')}</span><h3>{t('agent.title')}</h3><p>{metadata?.greeting || t('agent.description')}</p><div className="agent-suggestions">{(metadata?.suggestedQuestions || [t('agent.questionExperience'), t('agent.questionProjects'), t('agent.questionContact')]).map(question => <button key={question} disabled={Boolean(blocked)} onClick={() => send(question)}>{question}<span aria-hidden="true"> ↗</span></button>)}</div></div>}
      {messages.map((message, index) => <div className={`agent-message agent-message--${message.role}`} key={index}><span className="agent-message-label">{t(message.role === 'user' ? 'agent.you' : 'agent.name')}</span><p>{message.content}</p>{message.actions?.length > 0 && <div className="agent-actions">{message.actions.map((action, position) => <Action key={JSON.stringify(action) + position} action={action} open={open} onClose={applyClose} onUnavailable={() => setFailure('agent.actionError')} />)}</div>}</div>)}
      {pending && <><div className="agent-message agent-message--user"><span className="agent-message-label">{t('agent.you')}</span><p>{pending}</p></div><p className="agent-thinking" role="status"><span />{t('agent.thinking')}</p></>}
      {(failure || metadata?.available === false) && <div className="agent-error" role="alert"><p>{t(failure || 'agent.unavailable')}</p><a href={`${siteLink()}#contact`} onClick={onClose}>{t('agent.contact')} ↗</a>{metadata?.available === false && <button onClick={() => setMetadataRetry(value => value + 1)}>{t('agent.retry')}</button>}</div>}
    </div>
    <form className="agent-composer" onSubmit={event => { event.preventDefault(); send(draft); }}><label className="sr-only" htmlFor="agent-question">{t('agent.input')}</label><div className="agent-input-row"><textarea ref={input} id="agent-question" rows="2" maxLength={2000} placeholder={t('agent.placeholder')} value={draft} disabled={Boolean(pending)} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(draft); } }} /><button type="submit" disabled={Boolean(blocked) || !draft.trim()} aria-label={t('agent.send')}><span aria-hidden="true">↑</span></button></div><p className="agent-privacy">{cooldown > tick ? t('agent.wait', { seconds: Math.ceil((cooldown - tick) / 1000) }) : t('agent.privacy')}</p></form>
  </dialog>;
}
