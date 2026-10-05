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
    if (attribute.attrName === 'src' && !(node.nodeName === 'IMG' && (/^data:image\//iu.test(attribute.attrValue) || (remoteImages && /^https?:\/\//iu.test(attribute.attrValue))))) attribute.keepAttr = false;
  });
  return purifier;
}
const previewPurifiers = [createPreviewPurifier(false), createPreviewPurifier(true)];
export function emailPreviewDocument(source, remoteImages = false) {
  const html = previewPurifiers[remoteImages ? 1 : 0].sanitize(source, {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ['style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'link', 'meta', 'base', 'svg', 'math', 'video', 'audio'],
    FORBID_ATTR: ['href', 'srcset', 'ping'],
  });
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:${remoteImages ? ' https: http:' : ''}; base-uri 'none'; form-action 'none';"><meta charset="utf-8">`;
  return html.replace(/<head(?:\s[^>]*)?>/iu, match => match + policy);
}
export default function HtmlEmailBuilder({ tool }) {
  const [template, setTemplate] = useState('welcome'), [fields, setFields] = useState(() => templateFields());
  const [htmlSource, setHtmlSource] = useState(() => buildEmail('welcome', templateFields()));
  const [mode, setMode] = useState('visual'), [htmlDirty, setHtmlDirty] = useState(false), [remoteImages, setRemoteImages] = useState(false);
  const [history, setHistory] = useState(() => ({ past: [], present: createEmailDesign('welcome', templateFields()), future: [] }));
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
  const field = (key, label, type = 'text') => <label className="utility-field">{label}<input type={type} value={fields[key]} maxLength={1000} onChange={event => { setFields({ ...fields, [key]: event.target.value }); setError(''); }} /></label>;
  const apply = () => { try { const html = buildEmail(template, fields); const design = createEmailDesign(template, fields); renderEmailDesign(design); setHtmlSource(html); setHtmlDirty(false); changeDesign(design); setError(''); } catch (failure) { setError(failure.message); } };
  const download = () => { const url = URL.createObjectURL(new Blob([source], { type: 'text/html;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${template}-email.html`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  return <ToolFrame tool={tool}>
    <div className="email-template-controls"><label className="utility-field">Starter template<select aria-label="Starter template" value={template} onChange={event => { setTemplate(event.target.value); setFields(templateFields(event.target.value)); setError(''); }}>{Object.entries(emailTemplates).map(([key, value]) => <option value={key} key={key}>{value.label}</option>)}</select></label><button className="button-primary" onClick={apply}>Apply template</button></div>
    <details className="email-template-fields"><summary>Customize template content</summary><div className="developer-controls">{field('brand', 'Brand name')}{field('subject', 'Email subject / document title')}{field('heading', 'Heading')}{field('accent', 'Accent color', 'color')}</div>
      <label className="utility-field">Message<textarea aria-label="Message" value={fields.message} maxLength={5000} onChange={event => setFields({ ...fields, message: event.target.value })} /></label>
      <div className="developer-controls">{field('buttonText', 'Button text')}{field('link', 'Button URL', 'url')}{template === 'receipt' && <>{field('reference', 'Order reference')}{field('item', 'Item description')}{field('total', 'Total')}</>}</div>{field('footer', 'Footer text')}
      <p className="mock-note">Apply template replaces the visual design and HTML draft. You can undo the visual change.</p>
    </details>
    {(error || (mode === 'visual' && visual.error)) && <p className="tool-error" role="alert">{error || visual.error}</p>}
    <div className="email-builder-toolbar"><div role="group" aria-label="Editing mode"><button className="copy-button" aria-pressed={mode === 'visual'} onClick={() => setMode('visual')}>Visual editor</button><button className="copy-button" aria-pressed={mode === 'html'} onClick={() => { if (!htmlDirty && visual.source) setHtmlSource(visual.source); setMode('html'); }}>HTML editor</button></div>
      {mode === 'visual' && <div className="email-history-controls"><button className="copy-button" disabled={!history.past.length} onClick={() => setHistory(previous => ({ past: previous.past.slice(0, -1), present: previous.past.at(-1), future: [previous.present, ...previous.future] }))}>Undo</button><button className="copy-button" disabled={!history.future.length} onClick={() => setHistory(previous => ({ past: [...previous.past, previous.present], present: previous.future[0], future: previous.future.slice(1) }))}>Redo</button><span>{history.present.blocks.length} / 100 blocks</span></div>}
      <label className="email-checkbox"><input type="checkbox" checked={remoteImages} onChange={event => setRemoteImages(event.target.checked)} />Load external images</label>
    </div>
    {mode === 'visual' ? <VisualEmailEditor design={history.present} onChange={changeDesign} viewport={viewport} remoteImages={remoteImages} /> : <><p className="mock-note">Custom HTML is kept separately from the visual design. Export uses the active editor. Arbitrary HTML is not converted into blocks.</p><button className="copy-button" disabled={!visual.source} onClick={() => { setHtmlSource(visual.source); setHtmlDirty(false); }}>Use visual design as HTML</button></>}
    <div className={`email-editor-layout${mode === 'visual' ? ' email-editor-layout--visual' : ''}`}>{mode === 'html' && <label className="utility-field">HTML source<textarea aria-label="HTML source" className="email-source" spellCheck="false" maxLength={150000} value={htmlSource} onChange={event => { setHtmlSource(event.target.value); setHtmlDirty(true); }} /></label>}
      <div className="email-preview-pane"><div className="email-preview-toolbar"><span className="utility-caption">Email preview</span><div role="group" aria-label="Preview width"><button aria-pressed={viewport === 'desktop'} onClick={() => setViewport('desktop')}>Desktop · 600px</button><button aria-pressed={viewport === 'mobile'} onClick={() => setViewport('mobile')}>Mobile · 375px</button></div></div>
        <div className="email-preview-stage"><iframe title="HTML email preview" sandbox="" referrerPolicy="no-referrer" srcDoc={preview} style={{ width: viewport === 'mobile' ? 375 : 600 }} /></div>
      </div></div>
    <div className="workspace-actions"><CopyButton value={source} /><button className="copy-button" disabled={!source} onClick={download}>Download HTML</button><button onClick={() => { if (mode === 'visual') changeDesign(previous => ({ ...previous, blocks: [] })); else { setHtmlSource(''); setHtmlDirty(true); } }}>{mode === 'visual' ? 'Clear design' : 'Clear HTML'}</button></div>
    <p className="mock-note">Everything stays in your browser. Preview blocks scripts and navigation; external images load only when enabled. Export uses email tables and inline styles in visual mode, or preserves your custom HTML in HTML mode. Email clients may render it differently. This tool does not send emails. Source limit: 150,000 characters.</p>
  </ToolFrame>;
}
