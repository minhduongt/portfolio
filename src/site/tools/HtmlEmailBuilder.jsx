import { useDeferredValue, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { CopyButton, ToolFrame } from './AdditionalTools';
import { buildEmail, emailTemplates, templateFields } from './emailTemplates';

// Dedicated instance: preview rules must not affect blog/Markdown sanitization.
const previewPurifier = DOMPurify();
previewPurifier.addHook('uponSanitizeAttribute', (node, attribute) => {
  if (attribute.attrName === 'src' && !(node.nodeName === 'IMG' && /^data:image\//iu.test(attribute.attrValue))) attribute.keepAttr = false;
});
export function emailPreviewDocument(source) {
  const html = previewPurifier.sanitize(source, {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ['style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'link', 'meta', 'base', 'svg', 'math', 'video', 'audio'],
    FORBID_ATTR: ['href', 'srcset', 'ping'],
  });
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none';"><meta charset="utf-8">`;
  return html.replace(/<head(?:\s[^>]*)?>/iu, match => match + policy);
}
export default function HtmlEmailBuilder({ tool }) {
  const [template, setTemplate] = useState('welcome'), [fields, setFields] = useState(() => templateFields());
  const [source, setSource] = useState(() => buildEmail('welcome', templateFields()));
  const [viewport, setViewport] = useState('desktop'), [error, setError] = useState('');
  const deferredSource = useDeferredValue(source);
  const preview = useMemo(() => emailPreviewDocument(deferredSource), [deferredSource]);
  const field = (key, label, type = 'text') => <label className="utility-field">{label}<input type={type} value={fields[key]} maxLength={1000} onChange={event => { setFields({ ...fields, [key]: event.target.value }); setError(''); }} /></label>;
  const apply = () => { try { setSource(buildEmail(template, fields)); setError(''); } catch (failure) { setError(failure.message); } };
  const download = () => { const url = URL.createObjectURL(new Blob([source], { type: 'text/html;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${template}-email.html`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  return <ToolFrame tool={tool}>
    <div className="email-template-controls"><label className="utility-field">Starter template<select value={template} onChange={event => { setTemplate(event.target.value); setFields(templateFields(event.target.value)); setError(''); }}>{Object.entries(emailTemplates).map(([key, value]) => <option value={key} key={key}>{value.label}</option>)}</select></label><button className="button-primary" onClick={apply}>Apply template</button></div>
    <details className="email-template-fields"><summary>Customize template content</summary><div className="developer-controls">{field('brand', 'Brand name')}{field('subject', 'Email subject / document title')}{field('heading', 'Heading')}{field('accent', 'Accent color', 'color')}</div>
      <label className="utility-field">Message<textarea aria-label="Message" value={fields.message} maxLength={5000} onChange={event => setFields({ ...fields, message: event.target.value })} /></label>
      <div className="developer-controls">{field('buttonText', 'Button text')}{field('link', 'Button URL', 'url')}{template === 'receipt' && <>{field('reference', 'Order reference')}{field('item', 'Item description')}{field('total', 'Total')}</>}</div>{field('footer', 'Footer text')}
      <p className="mock-note">Click Apply template to update the HTML below. Applying replaces your current HTML edits.</p>
    </details>
    {error && <p className="tool-error" role="alert">{error}</p>}
    <div className="email-editor-layout"><label className="utility-field">HTML source<textarea aria-label="HTML source" className="email-source" spellCheck="false" maxLength={150000} value={source} onChange={event => setSource(event.target.value)} /></label>
      <div className="email-preview-pane"><div className="email-preview-toolbar"><span className="utility-caption">Live preview</span><div role="group" aria-label="Preview width"><button aria-pressed={viewport === 'desktop'} onClick={() => setViewport('desktop')}>Desktop · 600px</button><button aria-pressed={viewport === 'mobile'} onClick={() => setViewport('mobile')}>Mobile · 375px</button></div></div>
        <div className="email-preview-stage"><iframe title="HTML email preview" sandbox="" referrerPolicy="no-referrer" srcDoc={preview} style={{ width: viewport === 'mobile' ? 375 : 600 }} /></div>
      </div></div>
    <div className="workspace-actions"><CopyButton value={source} /><button className="copy-button" disabled={!source} onClick={download}>Download HTML</button><button onClick={() => setSource('')}>Clear HTML</button></div>
    <p className="mock-note">Preview blocks scripts, navigation and external assets. Inline CSS and embedded data images are supported. Export preserves your HTML. Email clients may render it differently. This tool does not send emails. Source limit: 150,000 characters.</p>
  </ToolFrame>;
}
