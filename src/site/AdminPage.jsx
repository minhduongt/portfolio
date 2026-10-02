import { useEffect, useState } from 'react';
import LoadingState from './LoadingState';
import { useSession } from './AuthProvider';
import { componentKeys, contentPayload, requestApi } from './api';
import SiteNavigation, { siteLink, SiteFooter } from './SiteNavigation';
import SafeHtml from './SafeHtml';

const blank = { slug: '', title: '', excerpt: '', contentHtml: '', tags: '', coverImageUrl: '', name: '', description: '', component: 'json-formatter', category: '', config: '{}', sortOrder: '0', visibility: 'private' };
function Management({ kind, onDenied }) {
  const { user } = useSession();
  const [rows, setRows] = useState(null), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0), [busy, setBusy] = useState(false), [editing, setEditing] = useState(null), [form, setForm] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  useEffect(() => {
    const controller = new AbortController(); setRows(null); setError('');
    requestApi(`/${kind}?includeArchived=true`, { user, signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) { if (!Array.isArray(data)) throw new Error('Invalid management list.'); setRows(data); }
    }).catch(failure => { if (!controller.signal.aborted) { setError(failure.message); if ([401, 403].includes(failure.status)) onDenied(); } });
    return () => controller.abort();
  }, [kind, user?.uid, reload]);
  const run = async task => {
    setBusy(true); setError(''); setNotice('');
    try { await task(); setNotice('Changes saved.'); setReload(value => value + 1); }
    catch (failure) { setError(failure.message); if ([401, 403].includes(failure.status)) onDenied(); }
    finally { setBusy(false); }
  };
  const edit = row => { setEditing(row); setForm(row ? { ...blank, ...row, tags: (row.tags || []).join(', '), config: JSON.stringify(row.config || {}, null, 2), sortOrder: String(row.sortOrder || 0) } : { ...blank }); setNotice(''); setError(''); };
  const field = (name, label, multiline = false) => <label className="utility-field">{label}{multiline ? <textarea value={form[name]} onChange={event => setForm({ ...form, [name]: event.target.value })} /> : <input value={form[name]} disabled={name === 'slug' && !!editing} onChange={event => setForm({ ...form, [name]: event.target.value })} />}</label>;
  return <>
    <div className="workspace-actions"><button disabled={busy} onClick={() => edit(null)}>New {kind === 'blogs' ? 'blog' : 'tool'}</button><button disabled={busy} onClick={() => setReload(value => value + 1)}>Reload list</button></div>
    {rows === null && !error && <LoadingState label={`Gathering your ${kind}`} skeleton />}
    {rows?.length === 0 && <p>No {kind} yet. Create the first entry.</p>}
    <div className="admin-list">{rows?.map(row => <article key={row.slug}><div><h2>{row.title || row.name}</h2><p>{row.slug} · {row.visibility} · {row.archivedAt ? 'Archived' : 'Active'}</p></div><div className="workspace-actions"><button disabled={busy} onClick={() => edit(row)}>Edit {row.title || row.name}</button>{row.archivedAt ? <button disabled={busy} onClick={() => run(() => requestApi(`/${kind}/${row.slug}/restore`, { user, method: 'PATCH' }))}>Restore {row.title || row.name}</button> : <button disabled={busy} onClick={() => setArchiveTarget(row)}>Archive {row.title || row.name}</button>}</div></article>)}</div>
    {archiveTarget && <div className="archive-confirm"><p>Archive “{archiveTarget.title || archiveTarget.name}”? You can restore it later.</p><button className="copy-button" disabled={busy} onClick={() => run(async () => { await requestApi(`/${kind}/${archiveTarget.slug}`, { user, method: 'DELETE' }); setArchiveTarget(null); })}>Confirm archive</button><button className="copy-button" disabled={busy} onClick={() => setArchiveTarget(null)}>Cancel archive</button></div>}
    {form && <form className="admin-editor" onSubmit={event => { event.preventDefault(); run(async () => { const body = contentPayload(kind, form, editing || false); await requestApi(`/${kind}${editing ? `/${editing.slug}` : ''}`, { user, method: editing ? 'PATCH' : 'POST', body }); setForm(null); setEditing(null); }); }}>
      <h2>{editing ? 'Edit' : 'Create'} {kind === 'blogs' ? 'blog' : 'tool'}</h2><fieldset disabled={busy}>
      {field('slug', 'Slug')}{kind === 'blogs' ? <>{field('title', 'Title')}{field('excerpt', 'Excerpt', true)}{field('tags', 'Tags (comma separated)')}{field('coverImageUrl', 'Cover image HTTPS URL')}{field('contentHtml', 'Blog HTML', true)}<details><summary>Preview HTML</summary><SafeHtml html={form.contentHtml} /></details></> : <>{field('name', 'Tool name')}{field('description', 'Description', true)}<label className="utility-field">Tool component<select value={form.component} onChange={event => setForm({ ...form, component: event.target.value })}>{Object.keys(componentKeys).map(key => <option key={key}>{key}</option>)}</select></label>{field('category', 'Category')}{field('sortOrder', 'Sort order')}{field('config', 'Config JSON', true)}<p className="mock-note">Config is saved as metadata. Utilities currently use their built-in controls.</p></>}
      <label className="utility-field">Visibility<select value={form.visibility} onChange={event => setForm({ ...form, visibility: event.target.value })}><option value="public">Public · everyone</option><option value="limited">Limited · signed-in users</option><option value="private">Private · admins only</option></select></label><div className="workspace-actions"><button className="button-primary">{busy ? 'Saving…' : 'Save content'}</button><button type="button" onClick={() => setForm(null)}>Cancel editing</button></div></fieldset>
    </form>}
    {error && <p className="tool-error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
  </>;
}

export default function AdminPage() {
  const session = useSession();
  const [kind, setKind] = useState('blogs'), [error, setError] = useState('');
  useEffect(() => { document.title = 'Administration — Minh Duong'; }, []);
  return <div className="portfolio concept-b concept-mix"><SiteNavigation concept="mix" page="admin" /><main className="content-width admin-page"><span className="eyebrow">ADMINISTRATION</span><h1>Manage your content<span>.</span></h1>
    {session.loading ? <LoadingState label="Checking administrator access" compact /> : !session.user ? <><p>Sign in to manage content.</p><a className="button-primary" href={siteLink('login')}>Sign in</a></> : !session.isAdmin ? <><p>Verified administrator access is required.</p><a className="button-secondary" href={siteLink('login')}>Open account</a><button className="copy-button" onClick={() => session.refresh().catch(failure => setError(failure.message))}>Refresh access</button></> : <>
      <div className="workspace-actions"><span>{session.user.email}</span><button onClick={() => session.logout().catch(failure => setError(failure.message))}>Sign out</button></div><div className="filter-buttons" role="group" aria-label="Manage content type">{['blogs', 'tools'].map(value => <button key={value} aria-pressed={kind === value} onClick={() => setKind(value)}>{value === 'blogs' ? 'Blogs management' : 'Tools management'}</button>)}</div>
      <Management key={`${kind}:${session.user.uid}`} kind={kind} onDenied={() => session.refresh().catch(failure => setError(failure.message))} />
    </>}{(error || session.error) && <p className="tool-error" role="alert">{error || session.error}</p>}</main><SiteFooter /></div>;
}
