import { useLanguage } from '../../i18n/LanguageProvider';
import { useDeferredValue, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { CopyButton, ToolFrame } from './AdditionalTools';
import { buildEmail, emailTemplates, templateFields } from './emailTemplates';
import { createEmailDesign, renderEmailDesign } from './emailDesign';
import VisualEmailEditor from './VisualEmailEditor';

// Dedicated instance: preview rules must not affect blog/Markdown sanitization.
function createPreviewPurifier(remoteImages) {
  const purifier = DOMPurify();
  purifier.addHook('uponSanitizeAttribute', (node, attribute) => {
    if (attribute.attrName === 'href') {
      try {
        const url = new URL(attribute.attrValue);
        if (node.nodeName !== 'A' || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) attribute.keepAttr = false;
      } catch { attribute.keepAttr = false; }
    }
    if (attribute.attrName === 'src' && !(node.nodeName === 'IMG' && (/^data:image\//iu.test(attribute.attrValue) || (remoteImages && /^https?:\/\//iu.test(attribute.attrValue))))) attribute.keepAttr = false;
  });
  purifier.addHook('afterSanitizeAttributes', node => {
    if (node.nodeName === 'A' && node.hasAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
  return purifier;
}
const previewPurifiers = [createPreviewPurifier(false), createPreviewPurifier(true)];
export function emailPreviewDocument(source, remoteImages = false) {
  const html = previewPurifiers[remoteImages ? 1 : 0].sanitize(source, {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ['style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'link', 'meta', 'base', 'svg', 'math', 'video', 'audio'],
    FORBID_ATTR: ['srcset', 'ping'],
  });
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:${remoteImages ? ' https: http:' : ''}; base-uri 'none'; form-action 'none';"><meta charset="utf-8">`;
  return html.replace(/<head(?:\s[^>]*)?>/iu, match => match + policy);
}
export default function HtmlEmailBuilder({ tool }) {
  const { t, language } = useLanguage();
  const [template, setTemplate] = useState('welcome'), [fields, setFields] = useState(() => templateFields('welcome', t, language));
  const [htmlSource, setHtmlSource] = useState(() => buildEmail('welcome', templateFields('welcome', t, language), t));
  const [mode, setMode] = useState('visual'), [htmlDirty, setHtmlDirty] = useState(false), [remoteImages, setRemoteImages] = useState(false);
  const [history, setHistory] = useState(() => ({ past: [], present: createEmailDesign('welcome', templateFields('welcome', t, language), t), future: [] }));
  const [viewport, setViewport] = useState('desktop'), [error, setError] = useState('');
  const visual = useMemo(() => {
    try { return { source: renderEmailDesign(history.present) }; } catch (failure) { return { source: '', error: failure.message }; }
  }, [history.present]);
  const source = mode === 'html' ? htmlSource : visual.source;
  const changeDesign = next => setHistory(previous => {
    const present = typeof next === 'function' ? next(previous.present) : next;
    return present === previous.present ? previous : { past: [...previous.past.slice(-49), previous.present], present, future: [] };
  });
  const deferredSource = useDeferredValue(source);
  const preview = useMemo(() => emailPreviewDocument(deferredSource, remoteImages), [deferredSource, remoteImages]);
  const field = (key, label, type = 'text') => <label className="utility-field">{t(label)}<input type={type} value={fields[key]} maxLength={1000} onChange={event => { setFields({ ...fields, [key]: event.target.value }); setError(''); }} /></label>;
  const apply = () => { try { const html = buildEmail(template, fields, t); const design = createEmailDesign(template, fields, t); renderEmailDesign(design); setHtmlSource(html); setHtmlDirty(false); changeDesign(design); setError(''); } catch (failure) { setError(failure.message); } };
  const download = () => { const url = URL.createObjectURL(new Blob([source], { type: 'text/html;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${template}-email.html`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  return <ToolFrame tool={tool}>
    <div className="email-template-controls"><label className="utility-field">{t("Starter template")}<select aria-label={t("Starter template")} value={template} onChange={event => { setTemplate(event.target.value); setFields(templateFields(event.target.value, t, language)); setError(''); }}>{Object.entries(emailTemplates).map(([key, value]) => <option value={key} key={key}>{t(value.label)}</option>)}</select></label><button className="button-primary" onClick={apply}>{t("Apply template")}</button></div>
    <details className="email-template-fields"><summary>{t("Customize template content")}</summary><div className="developer-controls">{field('brand', 'Brand name')}{field('subject', 'Email subject / document title')}{field('heading', 'Heading')}{field('accent', 'Accent color', 'color')}</div>
      <label className="utility-field">{t("Message")}<textarea aria-label={t("Message")} value={fields.message} maxLength={5000} onChange={event => setFields({ ...fields, message: event.target.value })} /></label>
      <div className="developer-controls">{field('buttonText', 'Button text')}{field('link', 'Button URL', 'url')}{template === 'receipt' && <>{field('reference', 'Order reference')}{field('item', 'Item description')}{field('total', 'Total')}</>}</div>{field('footer', 'Footer text')}
      <p className="mock-note">{t("Apply template replaces the visual design and HTML draft. You can undo the visual change.")}</p>
    </details>
    {(error || (mode === 'visual' && visual.error)) && <p className="tool-error" role="alert">{t(error || visual.error)}</p>}
    <div className="email-builder-toolbar"><div role="group" aria-label={t("Editing mode")}><button className="copy-button" aria-pressed={mode === 'visual'} onClick={() => setMode('visual')}>{t("Visual editor")}</button><button className="copy-button" aria-pressed={mode === 'html'} onClick={() => { if (!htmlDirty && visual.source) setHtmlSource(visual.source); setMode('html'); }}>{t("HTML editor")}</button></div>
      {mode === 'visual' && <div className="email-history-controls"><button className="copy-button" disabled={!history.past.length} onClick={() => setHistory(previous => ({ past: previous.past.slice(0, -1), present: previous.past.at(-1), future: [previous.present, ...previous.future] }))}>{t("Undo")}</button><button className="copy-button" disabled={!history.future.length} onClick={() => setHistory(previous => ({ past: [...previous.past, previous.present], present: previous.future[0], future: previous.future.slice(1) }))}>{t("Redo")}</button><span>{history.present.blocks.length} {t("/ 100 blocks")}</span></div>}
      <label className="email-checkbox"><input type="checkbox" checked={remoteImages} onChange={event => setRemoteImages(event.target.checked)} />{t("Load external images")}</label>
    </div>
    {mode === 'visual' ? <VisualEmailEditor design={history.present} onChange={changeDesign} viewport={viewport} remoteImages={remoteImages} /> : <><p className="mock-note">{t("Custom HTML is kept separately from the visual design. Export uses the active editor. Arbitrary HTML is not converted into blocks.")}</p><button className="copy-button" disabled={!visual.source} onClick={() => { setHtmlSource(visual.source); setHtmlDirty(false); }}>{t("Use visual design as HTML")}</button></>}
    <div className={`email-editor-layout${mode === 'visual' ? ' email-editor-layout--visual' : ''}`}>{mode === 'html' && <label className="utility-field">{t("HTML source")}<textarea aria-label={t("HTML source")} className="email-source" spellCheck="false" maxLength={150000} value={htmlSource} onChange={event => { setHtmlSource(event.target.value); setHtmlDirty(true); }} /></label>}
      <div className="email-preview-pane"><div className="email-preview-toolbar"><span className="utility-caption">{t("Email preview")}</span><div role="group" aria-label={t("Preview width")}><button aria-pressed={viewport === 'desktop'} onClick={() => setViewport('desktop')}>{t("Desktop · 600px")}</button><button aria-pressed={viewport === 'mobile'} onClick={() => setViewport('mobile')}>{t("Mobile · 375px")}</button></div></div>
        <div className="email-preview-stage"><iframe title={t("HTML email preview")} sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" srcDoc={preview} style={{ width: viewport === 'mobile' ? 375 : 600 }} /></div>
      </div></div>
    <div className="workspace-actions"><CopyButton value={source} /><button className="copy-button" disabled={!source} onClick={download}>{t("Download HTML")}</button><button onClick={() => { if (mode === 'visual') changeDesign(previous => ({ ...previous, blocks: [] })); else { setHtmlSource(''); setHtmlDirty(true); } }}>{t(mode === 'visual' ? 'Clear design' : 'Clear HTML')}</button></div>
    <p className="mock-note">{t("Preview links open in a new tab. Scripts are blocked; external images load only when enabled. Export uses email tables and inline styles in visual mode, or preserves your custom HTML in HTML mode. Email clients may render it differently. This tool does not send emails. Source limit: 150,000 characters.")}</p>
  </ToolFrame>;
}
