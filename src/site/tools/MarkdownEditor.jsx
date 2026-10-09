import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import { useLanguage } from '../../i18n/LanguageProvider';
import SafeHtml from '../SafeHtml';
import { CopyButton } from './AdditionalTools';
import { formatMarkdown } from './markdownFormatting';

const formats = ['heading', 'bold', 'italic', 'bullets', 'numbers', 'quote', 'link', 'code', 'codeblock', 'divider'];
const symbols = { heading: 'H₂', bold: 'B', italic: 'I', bullets: '•', numbers: '1.', quote: '❝', link: '↗', code: '</>', codeblock: '{ }', divider: '―' };

export default function MarkdownEditor() {
  const { t } = useLanguage();
  const id = useId();
  const source = useRef(null), selection = useRef(null);
  const [input, setInput] = useState(() => t('# A little space to write\n\nPreview **Markdown** as you edit.\n\n- Ideas\n- Notes\n- Useful things\n\n```js\nconst hello = "world";\n```'));
  const [error, setError] = useState('');
  useLayoutEffect(() => {
    if (!selection.current || !source.current) return;
    source.current.focus({ preventScroll: true });
    source.current.setSelectionRange(selection.current.start, selection.current.end);
    selection.current = null;
  }, [input]);
  const preview = useMemo(() => { try { return { html: marked.parse(input, { async: false, gfm: true }) }; } catch { return { error: 'This Markdown could not be rendered.' }; } }, [input]);
  const format = kind => {
    const area = source.current;
    const result = formatMarkdown(input, area.selectionStart, area.selectionEnd, kind, kind === 'divider' ? '' : t(`markdown.placeholder.${kind}`));
    if (result.value.length > 50000) { setError(t('markdown.limit')); return; }
    selection.current = result;
    setError(''); setInput(result.value);
  };
  const download = () => { const url = URL.createObjectURL(new Blob([input], { type: 'text/markdown;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'notes.md'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const examples = [
    ['heading', `## ${t('markdown.placeholder.heading')}`], ['bold', `**${t('markdown.placeholder.bold')}**`], ['italic', `*${t('markdown.placeholder.italic')}*`],
    ['bullets', `- ${t('markdown.placeholder.bullets')}`], ['numbers', `1. ${t('markdown.placeholder.numbers')}`], ['quote', `> ${t('markdown.placeholder.quote')}`],
    ['link', `[${t('markdown.placeholder.link')}](https://example.com)`], ['code', '`const hello = "world";`'], ['codeblock', '```js\nconst hello = "world";\n```'], ['divider', '---'],
  ];
  return <>
    <p className="markdown-help">{t('markdown.help')}</p>
    <div className="rich-text-toolbar markdown-toolbar" role="group" aria-label={t('markdown.toolbar')}>{formats.map(kind => <button type="button" key={kind} title={t(`markdown.${kind}`)} onMouseDown={event => event.preventDefault()} onClick={() => format(kind)}><span className={`markdown-format-icon markdown-format-${kind}`} aria-hidden="true">{symbols[kind]}</span><span>{t(`markdown.${kind}`)}</span></button>)}</div>
    {error && <p className="tool-error" role="alert">{error}</p>}
    <div className="tool-editor-grid markdown-editor"><label className="utility-field"><span id={`${id}-source`}>{t('Markdown source')}</span><textarea ref={source} aria-labelledby={`${id}-source`} value={input} maxLength={50000} spellCheck="false" onChange={event => { setInput(event.target.value); setError(''); }} /></label><div><span className="utility-caption">{t('Live preview')}</span><div className="markdown-preview">{preview.error ? <p role="alert">{t(preview.error)}</p> : <SafeHtml html={preview.html} markdown />}</div></div></div>
    <details className="markdown-guide"><summary>{t('markdown.guide')}</summary><p>{t('markdown.guideHelp')}</p><div className="markdown-guide-scroll"><table><thead><tr><th>{t('markdown.format')}</th><th>{t('markdown.example')}</th></tr></thead><tbody>{examples.map(([kind, example]) => <tr key={kind}><th scope="row">{t(`markdown.${kind}`)}</th><td><code>{example}</code></td></tr>)}</tbody></table></div></details>
    <div className="workspace-actions"><CopyButton value={input} /><button className="copy-button" onClick={download} disabled={!input}>{t('Download .md')}</button><button onClick={() => { setInput(''); setError(''); source.current?.focus(); }}>{t('Clear')}</button></div>
    <p className="mock-note">{t('Preview is sanitized. Images are not fetched and scripts are not executed. Limit: 50,000 characters.')}</p>
  </>;
}
