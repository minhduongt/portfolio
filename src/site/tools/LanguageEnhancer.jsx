import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider';
import { useSession } from '../AuthProvider';
import { requestApi } from '../api';
import { LoadingIndicator } from '../LoadingState';
import { siteLink } from '../SiteNavigation';
import { CopyButton, ToolFrame } from './AdditionalTools';
import { enhancementPayload, readEnhancement } from './languageEnhancerLogic';

const failures = { UNAUTHORIZED: 'signInError', INVALID_INPUT: 'invalid', LANGUAGE_CONTENT_BLOCKED: 'blocked', LANGUAGE_RATE_LIMITED: 'rateLimited', LANGUAGE_BUSY: 'rateLimited', LANGUAGE_INVALID_RESPONSE: 'invalidResponse', LANGUAGE_UNAVAILABLE: 'unavailable', LANGUAGE_TIMEOUT: 'timeout' };
function Example({ entry, outputLanguage, explanationLanguage }) {
  return <article className="language-result-card"><p lang={outputLanguage} className="language-result-text">{entry.text}</p><p lang={explanationLanguage}>{entry.explanation}</p><p lang={explanationLanguage} className="language-result-context">{entry.context}</p><CopyButton value={entry.text} /></article>;
}
function Results({ result, mode, outputLanguage, explanationLanguage }) {
  const { t } = useLanguage();
  return <section className="language-results" aria-label={t('languageTool.results')}><h3>{t(mode === 'sentence' ? 'languageTool.alternatives' : 'languageTool.vocabulary')}</h3>{mode === 'sentence'
    ? <div className="language-result-grid">{result.alternatives.map((entry, index) => <Example key={index} entry={entry} outputLanguage={outputLanguage} explanationLanguage={explanationLanguage} />)}</div>
    : <><div className="language-word-meaning" lang={explanationLanguage}><p>{result.meaning}</p><p className="language-result-context">{result.partOfSpeech}</p></div>{['synonyms', 'antonyms'].map(kind => <div key={kind}><h4>{t(`languageTool.${kind}`)}</h4>{result[kind].length ? <div className="language-result-grid">{result[kind].map((entry, index) => <article key={index} className="language-result-card"><h5 lang={outputLanguage}>{entry.word}</h5><p lang={explanationLanguage}>{entry.meaning}</p><p className="language-result-text" lang={outputLanguage}>{entry.example}</p><p className="language-result-context" lang={explanationLanguage}>{entry.context}</p><CopyButton value={entry.word} /></article>)}</div> : <p className="mock-note">{t(`languageTool.no${kind}`)}</p>}</div>)}<h4>{t('languageTool.examples')}</h4><div className="language-result-grid">{result.examples.map((entry, index) => <Example key={index} entry={entry} outputLanguage={outputLanguage} explanationLanguage={explanationLanguage} />)}</div><h4>{t('languageTool.notes')}</h4><p lang={explanationLanguage}>{result.notes}</p></>}</section>;
}

export default function LanguageEnhancer({ tool }) {
  const { t, language: uiLanguage } = useLanguage(), { user } = useSession();
  const active = useRef(null);
  const [mode, setMode] = useState('sentence'), [texts, setTexts] = useState({ sentence: '', keyword: '' });
  const [language, setLanguage] = useState('en'), [explanationLanguage, setExplanationLanguage] = useState(uiLanguage), [tone, setTone] = useState('natural'), [context, setContext] = useState('');
  const [result, setResult] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [until, setUntil] = useState(0), [now, setNow] = useState(Date.now());
  useEffect(() => () => { active.current?.abort(); active.current = null; }, [user?.uid]);
  useEffect(() => { if (until <= Date.now()) return; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [until]);
  const change = update => { update(); setResult(null); setError(''); setNotice(''); };
  const cancel = () => { active.current?.abort(); active.current = null; setBusy(false); setNotice('languageTool.cancelled'); };
  const run = async event => {
    event.preventDefault();
    if (!user || active.current || until > Date.now()) return;
    let body;
    try { body = enhancementPayload({ mode, text: texts[mode], language, explanationLanguage, tone, context }); }
    catch (error) { setError(error.localizationKey); return; }
    const controller = new AbortController(); active.current = controller;
    const timer = setTimeout(() => controller.abort(), 30000);
    setBusy(true); setResult(null); setError(''); setNotice('');
    try {
      const data = await requestApi('/language-enhancer', { user, method: 'POST', body, signal: controller.signal, cache: 'no-store' });
      const next = readEnhancement(data, body);
      if (active.current === controller && !controller.signal.aborted) setResult(next);
    } catch (error) {
      if (active.current !== controller) return;
      setError(error.localizationKey || (error.name === 'AbortError' ? 'languageTool.timeout' : `languageTool.${failures[error.code] || (error.status === 401 ? 'signInError' : error.status === 429 ? 'rateLimited' : 'unavailable')}`));
      if (error.status === 429) { setUntil(Date.now() + Math.max(60, error.retryAfter || 60) * 1000); setNow(Date.now()); }
    } finally { clearTimeout(timer); if (active.current === controller) { active.current = null; setBusy(false); } }
  };
  if (!user) return <ToolFrame tool={tool}><p>{t('languageTool.signInError')}</p><a className="button-primary" href={siteLink('login')}>{t('Sign in')}</a></ToolFrame>;
  const max = mode === 'sentence' ? 2000 : 100;
  return <ToolFrame tool={tool}><p className="language-tool-privacy">{t('languageTool.privacy')}</p><form className="language-enhancer-form" onSubmit={run}><fieldset disabled={busy}><legend className="sr-only">{t('languageTool.settings')}</legend>
    <div className="filter-buttons" role="group" aria-label={t('languageTool.mode')}>{['sentence', 'keyword'].map(value => <button type="button" key={value} aria-pressed={mode === value} onClick={() => change(() => setMode(value))}>{t(`languageTool.${value}`)}</button>)}</div>
    <p className="mock-note">{t(`languageTool.${mode}Help`)}</p>
    <label className="utility-field"><span>{t(mode === 'sentence' ? 'languageTool.sentenceInput' : 'languageTool.keywordInput')}</span><textarea value={texts[mode]} maxLength={max} rows={mode === 'sentence' ? 5 : 2} onChange={event => change(() => setTexts({ ...texts, [mode]: event.target.value }))} placeholder={t(`languageTool.${mode}Placeholder`)} /><small>{texts[mode].length} / {max}</small></label>
    <div className="developer-controls">{[['languageTool.outputLanguage', language, setLanguage], ['languageTool.explanationLanguage', explanationLanguage, setExplanationLanguage]].map(([label, value, update]) => <label className="utility-field" key={label}><span>{t(label)}</span><select value={value} onChange={event => change(() => update(event.target.value))}><option value="en">English</option><option value="vi">Tiếng Việt</option></select></label>)}{mode === 'sentence' && <label className="utility-field"><span>{t('languageTool.tone')}</span><select value={tone} onChange={event => change(() => setTone(event.target.value))}>{['natural', 'professional', 'casual', 'academic'].map(value => <option key={value} value={value}>{t(`languageTool.${value}`)}</option>)}</select></label>}</div>
    <p className="mock-note">{t('languageTool.languageHelp')}</p>
    <label className="utility-field"><span>{t('languageTool.context')}</span><input value={context} maxLength={500} placeholder={t('languageTool.contextPlaceholder')} onChange={event => change(() => setContext(event.target.value))} /></label>
    <div className="tool-run-actions"><button className="button-primary" disabled={!texts[mode].trim() || until > now}>{t(mode === 'sentence' ? 'languageTool.enhance' : 'languageTool.explore')}</button><button type="button" className="button-secondary" onClick={() => change(() => setTexts({ ...texts, [mode]: '' }))}>{t('Clear')}</button></div>
  </fieldset>{busy && <div className="workspace-actions"><LoadingIndicator label={t('languageTool.working')} /><button type="button" className="copy-button" onClick={cancel}>{t('languageTool.cancel')}</button></div>}</form>
  {error && <p className="tool-error" role="alert">{t(error)}</p>}{notice && <p role="status">{t(notice)}</p>}{until > now && <p role="status">{t('languageTool.wait', { seconds: Math.ceil((until - now) / 1000) })}</p>}
  {result && <Results result={result} mode={mode} outputLanguage={language} explanationLanguage={explanationLanguage} />}
  </ToolFrame>;
}
