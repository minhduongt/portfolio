import { lazy, Suspense, useEffect, useState } from 'react';
import SiteNavigation, { siteLink, SiteFooter } from './SiteNavigation';
import { posts, tools } from './data';

const AdditionalTools = lazy(() => import('./tools/AdditionalTools'));
const ManagedContent = lazy(() => import('./ManagedContent'));

function Blogs() {
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('All');
  const filtered = posts.filter(post => (topic === 'All' || post.topic === topic) && `${post.title} ${post.excerpt}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="page-heading"><span className="eyebrow">THE NOTEBOOK / SAMPLE DRAFTS</span><h1>Notes from the build<span>.</span></h1><p>Ideas, decisions and lessons from making useful software.</p></div>
    <div className="blog-controls"><div className="filter-buttons" role="group" aria-label="Article topic">{['All', 'Frontend', 'Delivery'].map(item => <button key={item} aria-pressed={topic === item} onClick={() => setTopic(item)}>{item}</button>)}</div>
      <label className="search-field"><span className="sr-only">Search articles</span><input type="search" placeholder="Search the notebook…" value={search} onChange={event => setSearch(event.target.value)} /></label>
    </div>
    <p className="mock-note">Sample drafts for layout review. These articles have not been published.</p>
    <div className="blog-list">{filtered.map((post, index) => <article className="blog-card" key={post.slug}>
      <div className={`blog-art art-${post.slug}`} aria-hidden="true"><span>{post.topic === 'Delivery' ? 'BUILD → SHIP' : index === 0 ? 'OFFLINE / ONLINE' : 'LESS, BUT CLEARER.'}</span><div className="art-lines"><i /><i /><i /></div></div>
      <div className="blog-card-body"><span className="eyebrow">{post.topic} / SAMPLE DRAFT</span><h2><a href={siteLink('blogs', post.slug)}>{post.title}<span aria-hidden="true"> ↗</span></a></h2><p>{post.excerpt}</p></div>
    </article>)}</div>
    {filtered.length === 0 && <div className="empty-state"><h2>No matching notes.</h2><p>Try a different topic or search term.</p><button onClick={() => { setSearch(''); setTopic('All'); }}>Reset filters</button></div>}
    <div className="notebook-footer"><span className="eyebrow">MORE NOTES, AS THEY TAKE SHAPE.</span><a href={siteLink()}>Back to the portfolio →</a></div>
  </>;
}

function BlogDetail({ post }) {
  return <div className="article-page"><a className="back-link" href={siteLink('blogs')}><span aria-hidden="true">← </span><span>Back to all posts</span></a>
    <div className="page-heading"><span className="eyebrow">{post.topic} / SAMPLE DRAFT</span><h1>{post.title}</h1><p>{post.excerpt}</p></div>
    <p className="mock-note">Article mockup · sample copy for review, not a published post.</p>
    <div className="reading-layout"><aside className="reading-outline"><span className="eyebrow">ON THIS PAGE</span>{post.sections.map(([title], index) => <a key={title} href={`#part-${index}`}>{title}</a>)}</aside>
      <article className="article-body">{post.sections.map(([title, body], index) => <section id={`part-${index}`} key={title}><h2>{title}</h2><p>{body}</p></section>)}<a className="button-secondary" href={siteLink('blogs')}>All notes <span aria-hidden="true">←</span></a></article>
    </div>
  </div>;
}

function ToolWorkspace({ tool }) {
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
    setInput(tool.id === 'json' ? '{"name":"Minh Duong","focus":["Frontend","Backend","Delivery"]}' : tool.id === 'url' ? 'hello moon / a useful product' : 'Thoughtful interfaces.\nPractical software.');
    setOutput(''); setError(''); setCopied(false);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(output); setCopied(true); }
    catch { setError('Copy is unavailable. Select the output and copy it manually.'); }
  };
  const wordCount = input.trim() ? input.trim().split(/\s+/u).length : 0;
  return <section className="tool-workspace" aria-label={`${tool.name} workspace`}>
    <div className="workspace-heading"><div><span className="eyebrow">{tool.category} / LOCAL UTILITY</span><h2>{tool.name}</h2><p>{tool.description}</p></div><span className="tool-symbol" aria-hidden="true">{tool.icon}</span></div>
    <div className="workspace-actions"><button onClick={sample}>Load sample</button><button onClick={() => { setInput(''); setOutput(''); setError(''); setCopied(false); }}>Clear</button><span>Runs locally in your browser</span></div>
    <div className={`tool-editor-grid ${tool.id === 'words' ? 'single-editor' : ''}`}>
      <label><span>{tool.id === 'json' ? 'JSON input' : tool.id === 'url' ? 'URL input' : 'Text to count'}</span><textarea spellCheck="false" value={input} placeholder={tool.id === 'words' ? 'Write or paste your text…' : 'Paste a value here…'} onChange={event => { setInput(event.target.value); setError(''); setOutput(''); setCopied(false); }} /></label>
      {tool.id !== 'words' && <label><span>{tool.id === 'json' ? 'Formatted JSON' : 'URL output'}</span><textarea spellCheck="false" value={output} readOnly placeholder="Your result will appear here…" /></label>}
    </div>
    {tool.id === 'words' ? <div className="word-stats" aria-live="polite">{[['words', wordCount], ['characters', [...input].length], ['lines', input ? input.split(/\r\n|\r|\n/u).length : 0]].map(([name, count]) => <div key={name}><strong data-count={name}>{count}</strong><span>{name}</span></div>)}</div>
      : <div className="tool-run-actions">{tool.id === 'json' ? <button className="button-primary" onClick={() => run('format')}>Format JSON</button> : <><button className="button-primary" onClick={() => run('encode')}>Encode</button><button className="button-secondary" onClick={() => run('decode')}>Decode</button></>}
        <button className="copy-button" disabled={!output} onClick={copy}>{copied ? 'Copied' : 'Copy output'}</button></div>}
    {error && <p className="tool-error" role="alert">{error}</p>}
    {tool.id === 'json' && <p className="mock-note">Numbers use JavaScript precision. For exact IDs or decimal values, use strings.</p>}
    <span className="sr-only" aria-live="polite">{copied ? 'Output copied to clipboard.' : ''}</span>
  </section>;
}

export function Tools({ items = tools }) {
  const [selected, setSelected] = useState('');
  const key = item => item.slug || item.id;
  const tool = items.find(item => key(item) === selected) || items[0];
  return <>
    <div className="page-heading"><span className="eyebrow">THE WORKBENCH / BROWSER UTILITIES</span><h1>Small tools.<br />Less friction<span>.</span></h1><p>A few useful utilities for the little things between builds.</p></div>
    {!tool ? <p>No tools are available yet.</p> : <div className="tools-layout"><div className="tool-picker" role="group" aria-label="Choose a tool">{items.map(item => <button key={key(item)} aria-pressed={key(tool) === key(item)} onClick={() => setSelected(key(item))} aria-label={item.name}><span className="picker-icon" aria-hidden="true">{item.icon}</span><span><strong>{item.name}</strong><small>{item.category}</small></span><span aria-hidden="true">↗</span></button>)}<p className="mock-note">Your input stays in your browser.</p></div>
      {!tool.id ? <p role="status">This tool is unavailable in this version of the portfolio.</p> : ['image', 'powerfx', 'color'].includes(tool.id) ? <Suspense fallback={<p role="status">Loading tool…</p>}><AdditionalTools key={key(tool)} tool={tool} /></Suspense> : <ToolWorkspace key={key(tool)} tool={tool} />}</div>}
  </>;
}

export default function Pages({ page, postSlug }) {
  const post = posts.find(item => item.slug === postSlug);
  useEffect(() => { document.title = `${page === 'blogs' ? post?.title || 'Blogs' : 'Tools'} — Minh Duong`; }, [page, post]);
  const localAnchor = event => {
    const link = event.target.closest('a');
    const href = link?.getAttribute('href');
    if (!href?.startsWith('#') || href.startsWith('#/')) return;
    const target = document.getElementById(href.slice(1));
    if (target) { event.preventDefault(); target.focus({ preventScroll: true }); target.scrollIntoView(); }
  };
  return <div className="portfolio concept-b concept-mix mock-page" onClick={localAnchor}><a className="skip-link" href="#main-content">Skip to content</a><SiteNavigation concept="mix" page={page} />
    <main id="main-content" className="content-width" tabIndex={-1}><div id="home" />{!location.pathname.includes('design-preview') ? <Suspense fallback={<p role="status">Loading content…</p>}><ManagedContent page={page} postSlug={postSlug} /></Suspense> : page === 'blogs' ? (post ? <BlogDetail post={post} /> : <Blogs />) : <Tools />}</main><SiteFooter />
  </div>;
}
