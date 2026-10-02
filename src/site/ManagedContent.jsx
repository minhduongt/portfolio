import { useEffect, useState } from 'react';
import { requestApi, toolDefinition } from './api';
import { useSession } from './AuthProvider';
import { siteLink } from './SiteNavigation';
import { Tools } from './Pages';
import SafeHtml from './SafeHtml';

export default function ManagedContent({ page, postSlug }) {
  const { user, isAdmin, loading } = useSession();
  const [retry, setRetry] = useState(0), [state, setState] = useState({});
  const [search, setSearch] = useState(''), [tag, setTag] = useState('All');
  const path = `/${page}${page === 'blogs' && postSlug ? `/${encodeURIComponent(postSlug)}` : ''}`;
  const owner = `${user?.uid || 'anonymous'}:${isAdmin}:${path}`;
  useEffect(() => {
    const controller = new AbortController(); setState({});
    if (!loading) requestApi(path, { user, signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) {
        if ((!postSlug || page !== 'blogs') && !Array.isArray(data)) throw new Error('Invalid content list from the service.');
        setState({ data, owner });
      }
    }).catch(error => { if (!controller.signal.aborted) setState({ error, owner }); });
    return () => controller.abort();
  }, [owner, loading, retry]);
  useEffect(() => { if (state.data?.title) document.title = `${state.data.title} — Minh Duong`; }, [state.data]);
  if (loading || state.owner !== owner) return <p role="status">Loading {page}…</p>;
  if (state.error) return <div className="empty-state"><h1>{state.error.status === 404 ? 'Article not found.' : 'Content unavailable.'}</h1><p role="alert">{state.error.message}</p><button onClick={() => setRetry(value => value + 1)}>Try again</button></div>;
  if (page === 'tools') return <Tools items={state.data.map(toolDefinition)} />;
  if (postSlug) {
    const post = state.data;
    return <article><a className="back-link" href={siteLink('blogs')}>Back to all posts</a><div className="page-heading"><span className="eyebrow">{post.visibility === 'private' ? 'PRIVATE / ADMIN' : 'THE NOTEBOOK'}</span><h1>{post.title}</h1><p>{post.excerpt}</p></div>{post.coverImageUrl?.startsWith('https://') && <img className="blog-cover" src={post.coverImageUrl} alt="" />}<SafeHtml html={post.contentHtml} /></article>;
  }
  const tags = [...new Set(state.data.flatMap(post => post.tags || []))];
  const filtered = state.data.filter(post => (tag === 'All' || post.tags?.includes(tag)) && `${post.title} ${post.excerpt || ''}`.toLowerCase().includes(search.toLowerCase()));
  return <><div className="page-heading"><span className="eyebrow">THE NOTEBOOK</span><h1>Notes from the build<span>.</span></h1><p>Ideas, decisions and lessons from making useful software.</p></div>
    <div className="blog-controls"><div className="filter-buttons" role="group" aria-label="Article topic">{['All', ...tags].map(item => <button key={item} aria-pressed={tag === item} onClick={() => setTag(item)}>{item}</button>)}</div><label className="search-field"><span className="sr-only">Search articles</span><input type="search" value={search} placeholder="Search the notebook…" onChange={event => setSearch(event.target.value)} /></label></div>
    <div className="blog-list">{filtered.map(post => <article className="blog-card" key={post.slug}><div className="blog-card-body"><span className="eyebrow">{post.visibility === 'private' ? 'PRIVATE / ADMIN' : post.tags?.join(' / ') || 'ARTICLE'}</span><h2><a href={siteLink('blogs', post.slug)}>{post.title} ↗</a></h2><p>{post.excerpt}</p></div></article>)}</div>{!filtered.length && <p>{state.data.length ? 'No matching articles.' : 'No articles have been published yet.'}</p>}
  </>;
}
