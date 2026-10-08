import { useLanguage } from '../i18n/LanguageProvider';
import { lazy, Suspense, useEffect, useState } from 'react';
import LoadingState from './LoadingState';
import VisibilityBadge from './VisibilityBadge';
import SiteNavigation, { siteLink, SiteFooter } from './SiteNavigation';
import { posts, tools } from './data';

const AdditionalTools = lazy(() => import('./tools/AdditionalTools'));
const DeveloperTools = lazy(() => import('./tools/DeveloperTools'));
const HtmlEmailBuilder = lazy(() => import('./tools/HtmlEmailBuilder'));
const ManagedContent = lazy(() => import('./ManagedContent'));

function Blogs() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('All');
  const filtered = posts.filter(post => (topic === 'All' || post.topic === topic) && `${post.title} ${post.excerpt}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="page-heading"><span className="eyebrow">{t("THE NOTEBOOK / SAMPLE DRAFTS")}</span><h1>{t("Notes from the build")}<span>.</span></h1><p>{t("Ideas, decisions and lessons from making useful software.")}</p></div>
    <div className="blog-controls"><div className="filter-buttons" role="group" aria-label={t("Article topic")}>{['All', 'Frontend', 'Delivery'].map(item => <button key={item} aria-pressed={topic === item} onClick={() => setTopic(item)}>{t(item)}</button>)}</div>
      <label className="search-field"><span className="sr-only">{t("Search articles")}</span><input type="search" placeholder={t("Search the notebook…")} value={search} onChange={event => setSearch(event.target.value)} /></label>
    </div>
    <p className="mock-note">{t("Sample drafts for layout review. These articles have not been published.")}</p>
    <div className="blog-list">{filtered.map((post, index) => <article className="blog-card" key={post.slug}>
      <div className={`blog-art art-${post.slug}`} aria-hidden="true"><span>{t(post.topic === 'Delivery' ? 'BUILD → SHIP' : index === 0 ? 'OFFLINE / ONLINE' : 'LESS, BUT CLEARER.')}</span><div className="art-lines"><i /><i /><i /></div></div>
      <div className="blog-card-body"><span className="eyebrow">{t(post.topic)} {t("/ SAMPLE DRAFT")}</span><h2><a href={siteLink('blogs', post.slug)}>{post.title}<span aria-hidden="true"> ↗</span></a></h2><p>{post.excerpt}</p></div>
    </article>)}</div>
    {filtered.length === 0 && <div className="empty-state"><h2>{t("No matching notes.")}</h2><p>{t("Try a different topic or search term.")}</p><button onClick={() => { setSearch(''); setTopic('All'); }}>{t("Reset filters")}</button></div>}
    <div className="notebook-footer"><span className="eyebrow">{t("MORE NOTES, AS THEY TAKE SHAPE.")}</span><a href={siteLink()}>{t("Back to the portfolio →")}</a></div>
  </>;
}

function BlogDetail({ post }) {
  const { t } = useLanguage();
  return <div className="article-page"><a className="back-link" href={siteLink('blogs')}><span aria-hidden="true">← </span><span>{t("Back to all posts")}</span></a>
    <div className="page-heading"><span className="eyebrow">{t(post.topic)} {t("/ SAMPLE DRAFT")}</span><h1>{post.title}</h1><p>{post.excerpt}</p></div>
    <p className="mock-note">{t("Article mockup · sample copy for review, not a published post.")}</p>
    <div className="reading-layout"><aside className="reading-outline"><span className="eyebrow">{t("ON THIS PAGE")}</span>{post.sections.map(([title], index) => <a key={title} href={`#part-${index}`}>{title}</a>)}</aside>
      <article className="article-body">{post.sections.map(([title, body], index) => <section id={`part-${index}`} key={title}><h2>{title}</h2><p>{body}</p></section>)}<a className="button-secondary" href={siteLink('blogs')}>{t("All notes")} <span aria-hidden="true">←</span></a></article>
    </div>
  </div>;
}

function ToolWorkspace({ tool }) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const run = mode => {
    setError(''); setCopied(false);
    try {
      const parsed = tool.id === 'json' ? JSON.parse(input, (_key, value) => {
        if (typeof value === 'number' && (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value)))) throw new RangeError('Unsafe JSON number');
        return value;
      }) : null;
      setOutput(tool.id === 'json' ? JSON.stringify(parsed, null, 2) : mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input));
    } catch (failure) {
      setOutput('');
      setError(tool.id === 'json' ? (failure instanceof RangeError ? 'A number exceeds JavaScript precision. Use a string for large IDs.' : 'Enter valid JSON to format it.') : 'This value contains an invalid encoded sequence.');
    }
  };
  const sample = () => {
    setInput(tool.id === 'json' ? '{"name":"Minh Duong","focus":["Frontend","Backend","Delivery"]}' : tool.id === 'url' ? 'hello moon / a useful product' : t('Thoughtful interfaces.\nPractical software.'));
    setOutput(''); setError(''); setCopied(false);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(output); setCopied(true); }
    catch { setError('Copy is unavailable. Select the output and copy it manually.'); }
  };
  const wordCount = input.trim() ? input.trim().split(/\s+/u).length : 0;
  return <section className="tool-workspace" aria-label={t('{{name}} workspace', { name: t(tool.name) })}>
    <div className="workspace-heading"><div><span className="eyebrow">{t(tool.category)} {t("/ LOCAL UTILITY")}</span><h2>{t(tool.name)}</h2><p>{t(tool.description)}</p></div><span className="tool-symbol" aria-hidden="true">{tool.icon}</span></div>
    <div className="workspace-actions"><button onClick={sample}>{t("Load sample")}</button><button onClick={() => { setInput(''); setOutput(''); setError(''); setCopied(false); }}>{t("Clear")}</button><span>{t("Runs locally in your browser")}</span></div>
    <div className={`tool-editor-grid ${tool.id === 'words' ? 'single-editor' : ''}`}>
      <label><span>{t(tool.id === 'json' ? 'JSON input' : tool.id === 'url' ? 'URL input' : 'Text to count')}</span><textarea spellCheck="false" value={input} placeholder={t(tool.id === 'words' ? 'Write or paste your text…' : 'Paste a value here…')} onChange={event => { setInput(event.target.value); setError(''); setOutput(''); setCopied(false); }} /></label>
      {tool.id !== 'words' && <label><span>{t(tool.id === 'json' ? 'Formatted JSON' : 'URL output')}</span><textarea spellCheck="false" value={output} readOnly placeholder={t("Your result will appear here…")} /></label>}
    </div>
    {tool.id === 'words' ? <div className="word-stats" aria-live="polite">{[['words', wordCount], ['characters', [...input].length], ['lines', input ? input.split(/\r\n|\r|\n/u).length : 0]].map(([name, count]) => <div key={name}><strong data-count={name}>{count}</strong><span>{t(name)}</span></div>)}</div>
      : <div className="tool-run-actions">{tool.id === 'json' ? <button className="button-primary" onClick={() => run('format')}>{t("Format JSON")}</button> : <><button className="button-primary" onClick={() => run('encode')}>{t("Encode")}</button><button className="button-secondary" onClick={() => run('decode')}>{t("Decode")}</button></>}
        <button className="copy-button" disabled={!output} onClick={copy}>{t(copied ? 'Copied' : 'Copy output')}</button></div>}
    {error && <p className="tool-error" role="alert">{t(error)}</p>}
    {tool.id === 'json' && <p className="mock-note">{t("Numbers use JavaScript precision. For exact IDs or decimal values, use strings.")}</p>}
    <span className="sr-only" aria-live="polite">{copied ? t('Output copied to clipboard.') : ''}</span>
  </section>;
}

export function Tools({ items = tools }) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const filtered = items.filter(item => `${item.name} ${item.category} ${t(item.name)} ${t(item.category)}`.toLowerCase().includes(search.toLowerCase()));
  const key = item => item.slug || item.id;
  const tool = items.find(item => key(item) === selected) || items[0];
  return <>
    <div className="page-heading"><span className="eyebrow">{t("THE WORKBENCH / BROWSER UTILITIES")}</span><h1>{t("Small tools.")}<br />{t("Less friction")}<span>.</span></h1><p>{t("A few useful utilities for the little things between builds.")}</p></div>
    {!tool ? <p>{t("No tools are available yet.")}</p> : <div className="tools-layout"><div className="tool-picker" role="group" aria-label={t("Choose a tool")}><label className="utility-field tool-search">{t("Find a tool")}<input type="search" placeholder={t("Search tools")} value={search} onChange={event => setSearch(event.target.value)} /></label><div className="tool-picker-list">{filtered.map(item => <button key={key(item)} aria-pressed={key(tool) === key(item)} onClick={() => setSelected(key(item))} aria-label={t(item.name)}><span className="picker-icon" aria-hidden="true">{item.icon}</span><span><strong>{t(item.name)}</strong><small>{t(item.category)}</small><VisibilityBadge visibility={item.visibility} /></span><span aria-hidden="true">↗</span></button>)}{!filtered.length && <p className="mock-note">{t("No matching tools.")}</p>}</div><p className="mock-note">{t("Your input stays in your browser.")}</p></div>
      {!tool.id ? <p role="status">{t("This tool is unavailable in this version of the portfolio.")}</p> : tool.id === 'html-email' ? <Suspense fallback={<LoadingState label={t("Preparing your builder")} compact />}><HtmlEmailBuilder key={key(tool)} tool={tool} /></Suspense> : ['image', 'powerfx', 'color'].includes(tool.id) ? <Suspense fallback={<LoadingState label={t("Preparing your tool")} compact />}><AdditionalTools key={key(tool)} tool={tool} /></Suspense> : ['markdown', 'credentials', 'lorem', 'timestamp', 'hash', 'jwt', 'cron'].includes(tool.id) ? <Suspense fallback={<LoadingState label={t("Preparing your tool")} compact />}><DeveloperTools key={key(tool)} tool={tool} /></Suspense> : <ToolWorkspace key={key(tool)} tool={tool} />}</div>}
  </>;
}

export default function Pages({ page, postSlug }) {
  const { t } = useLanguage();
  const post = posts.find(item => item.slug === postSlug);
  useEffect(() => {
    if (page === 'blogs' && postSlug && !location.pathname.includes('design-preview')) return;
    document.title = `${page === 'blogs' ? t(post?.title || 'Blogs') : t('Tools')} — Minh Duong`;
  }, [page, post, postSlug, t]);
  const localAnchor = event => {
    const link = event.target.closest('a');
    const href = link?.getAttribute('href');
    if (!href?.startsWith('#') || href.startsWith('#/')) return;
    const target = document.getElementById(href.slice(1));
    if (target) { event.preventDefault(); target.focus({ preventScroll: true }); target.scrollIntoView(); }
  };
  return <div className="portfolio concept-b concept-mix mock-page" onClick={localAnchor}><a className="skip-link" href="#main-content">{t("Skip to content")}</a><SiteNavigation concept="mix" page={page} />
    <main id="main-content" className="content-width" tabIndex={-1}><div id="home" />{!location.pathname.includes('design-preview') ? <Suspense fallback={<LoadingState label={t(page === 'blogs' ? 'Opening the notebook' : 'Preparing the workbench')} skeleton />}><ManagedContent page={page} postSlug={postSlug} /></Suspense> : page === 'blogs' ? (post ? <BlogDetail post={post} /> : <Blogs />) : <Tools />}</main><SiteFooter />
  </div>;
}
