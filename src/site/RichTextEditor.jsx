import { useLanguage } from '../i18n/LanguageProvider';
import { useEffect, useId, useRef, useState } from 'react';
import { sanitizeContent, isHtmlDocumentSource } from './SafeHtml';

const commands = [['bold', 'Bold'], ['italic', 'Italic'], ['underline', 'Underline'], ['insertUnorderedList', 'Bulleted list'], ['insertOrderedList', 'Numbered list']];

export default function RichTextEditor({ value, onChange, disabled = false }) {
  const { t } = useLanguage();
  const id = useId(), editor = useRef(null), selection = useRef(null);
  const [sourceMode, setSourceMode] = useState(false), [format, setFormat] = useState({});
  const [linkOpen, setLinkOpen] = useState(false), [link, setLink] = useState(''), [error, setError] = useState('');
  useEffect(() => {
    if (!sourceMode && editor.current) {
      const safe = sanitizeContent(value);
      if (editor.current.innerHTML !== safe) editor.current.innerHTML = safe;
    }
  }, [value, sourceMode]);
  useEffect(() => {
    const remember = () => {
      const current = window.getSelection();
      if (!current?.rangeCount || !editor.current?.contains(current.anchorNode) || !editor.current.contains(current.focusNode)) return;
      selection.current = current.getRangeAt(0).cloneRange();
      setFormat(Object.fromEntries(commands.map(([command]) => [command, document.queryCommandState(command)])));
    };
    document.addEventListener('selectionchange', remember);
    return () => document.removeEventListener('selectionchange', remember);
  }, []);
  const sync = () => onChange(editor.current.textContent.trim() ? sanitizeContent(editor.current.innerHTML) : '');
  const run = (command, argument = null) => {
    if (disabled) return;
    editor.current.focus();
    const current = window.getSelection();
    if (selection.current && editor.current.contains(selection.current.commonAncestorContainer)) {
      current.removeAllRanges(); current.addRange(selection.current);
    }
    // Native editing keeps typing and formatting in the browser's undo history.
    document.execCommand('styleWithCSS', false, false);
    document.execCommand(command, false, argument);
    sync();
  };
  const insertLink = () => {
    let url;
    try {
      url = new URL(link);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
    } catch { setError('Enter an absolute HTTP or HTTPS link without credentials.'); return; }
    if (!selection.current || selection.current.collapsed) { setError('Select the text to link first.'); return; }
    run('createLink', url.href); setLinkOpen(false); setError('');
  };
  const paste = event => {
    event.preventDefault();
    if (disabled) return;
    const data = event.clipboardData || event.dataTransfer;
    const html = data.getData('text/html');
    const text = data.getData('text/plain');
    const inCode = window.getSelection()?.anchorNode?.parentElement?.closest('pre, code');
    const source = inCode ? '' : isHtmlDocumentSource(text) ? text : html;
    run(source ? 'insertHTML' : 'insertText', source ? sanitizeContent(source) : text);
  };
  return <div className="blog-content-editor">
    <span id={`${id}-label`} className="utility-caption">{t("Blog Content")}</span>
    <div className="rich-text-toolbar" role="group" aria-label={t("Blog content editor")} onMouseDown={event => { if (event.target.closest('button')) event.preventDefault(); }}>
      <button type="button" disabled={disabled} aria-pressed={!sourceMode} onClick={() => { setSourceMode(false); setLinkOpen(false); setError(''); selection.current = null; onChange(sanitizeContent(value)); }}>{t("Rich text")}</button>
      <button type="button" disabled={disabled} aria-pressed={sourceMode} onClick={() => { setSourceMode(true); setLinkOpen(false); setError(''); selection.current = null; }}>{t("HTML source")}</button>
      {!sourceMode && <>
        <select aria-label={t("Text style")} disabled={disabled} defaultValue="" onChange={event => { run('formatBlock', event.target.value); event.target.value = ''; }}>
          <option value="" disabled>{t("Text style")}</option><option value="p">{t("Paragraph")}</option><option value="h2">{t("Heading 2")}</option><option value="h3">{t("Heading 3")}</option><option value="blockquote">{t("Quote")}</option><option value="pre">{t("Code block")}</option>
        </select>
        {commands.map(([command, label]) => <button key={command} type="button" disabled={disabled} aria-pressed={!!format[command]} onClick={() => run(command)}>{t(label)}</button>)}
        <button type="button" disabled={disabled} onClick={() => { setLinkOpen(!linkOpen); setLink(''); setError(''); }}>{t("Add link")}</button>
        <button type="button" disabled={disabled} onClick={() => run('unlink')}>{t("Remove link")}</button>
      </>}
    </div>
    {linkOpen && <div className="rich-text-link workspace-actions"><label className="utility-field">{t("Link URL")}<input type="url" value={link} disabled={disabled} onChange={event => setLink(event.target.value)} placeholder="https://example.com" onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); insertLink(); } }} /></label><button type="button" disabled={disabled} onClick={insertLink}>{t("Insert link")}</button><button type="button" disabled={disabled} onClick={() => { setLinkOpen(false); setError(''); }}>{t("Cancel link")}</button></div>}
    {error && <p className="tool-error" role="alert">{t(error)}</p>}
    {sourceMode ? <textarea className="rich-text-source" aria-labelledby={`${id}-label`} value={value} disabled={disabled} onChange={event => onChange(event.target.value)} /> : <div ref={editor} className="rich-text-content managed-html" role="textbox" aria-labelledby={`${id}-label`} aria-multiline="true" aria-disabled={disabled} contentEditable={!disabled} suppressContentEditableWarning onInput={sync} onPaste={paste} onDrop={paste} onFocus={() => document.execCommand('defaultParagraphSeparator', false, 'p')} />}
  </div>;
}
