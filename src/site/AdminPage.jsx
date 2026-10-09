import { useLanguage } from '../i18n/LanguageProvider';
import { useEffect, useState } from 'react';
import LoadingState, { LoadingIndicator } from './LoadingState';
import { useSession } from './AuthProvider';
import { componentKeys, contentPayload, requestApi } from './api';
import SiteNavigation, { siteLink, SiteFooter } from './SiteNavigation';
import SafeHtml from './SafeHtml';
import VisitorAnalytics from './VisitorAnalytics';
import RichTextEditor from './RichTextEditor';

const blank = { slug: '', title: '', excerpt: '', contentHtml: '', tags: '', coverImageUrl: '', name: '', description: '', component: 'json-formatter', category: '', config: '{}', sortOrder: '0', visibility: 'private' };
function ActionIcon({ action }) {
  return <svg className="admin-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {action === 'edit' ? <><path d="m16 3 5 5-12 12-6 1 1-6Z" /><path d="m13 6 5 5" /></> : action === 'archive' ? <><rect x="3" y="3" width="18" height="5" rx="1" /><path d="M5 8v12h14V8M10 12h4" /></> : <><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6M12 7v5l3 2" /></>}
  </svg>;
}
function Management({ kind, onDenied }) {
  const { t } = useLanguage();
  const { user } = useSession();
  const [rows, setRows] = useState(null), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0), [busy, setBusy] = useState(false), [editing, setEditing] = useState(null), [form, setForm] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const unusedComponents = Object.keys(componentKeys).filter(component => !rows?.some(row => row.component === component));
  const availableComponents = Object.keys(componentKeys).filter(component => component === editing?.component || unusedComponents.includes(component));
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
  const edit = row => { setEditing(row); setForm(row ? { ...blank, ...row, tags: (row.tags || []).join(', '), config: JSON.stringify(row.config || {}, null, 2), sortOrder: String(row.sortOrder || 0) } : { ...blank, component: unusedComponents[0] || '' }); setNotice(''); setError(''); };
  const field = (name, label, multiline = false) => <label className="utility-field">{t(label)}{multiline ? <textarea value={form[name]} onChange={event => setForm({ ...form, [name]: event.target.value })} /> : <input value={form[name]} disabled={name === 'slug' && !!editing} onChange={event => setForm({ ...form, [name]: event.target.value })} />}</label>;
  return <>
    {!form && <>
    <div className="workspace-actions"><button disabled={busy || (kind === 'tools' && (rows === null || !unusedComponents.length))} onClick={() => edit(null)}>{t(kind === 'blogs' ? 'New blog' : 'New tool')}</button><button disabled={busy} onClick={() => setReload(value => value + 1)}>{t("Reload list")}</button></div>
    {kind === 'tools' && rows && !unusedComponents.length && <p>{t("All tool components already exist. Edit an existing tool or restore an archived one.")}</p>}
    {rows === null && !error && <LoadingState label={t(kind === 'blogs' ? 'Gathering your blogs' : 'Gathering your tools')} skeleton />}
    {rows?.length === 0 && <p>{t(kind === 'blogs' ? 'No blogs yet. Create the first entry.' : 'No tools yet. Create the first entry.')}</p>}
    <div className="admin-list">{rows?.map(row => <article key={row.slug}><div><h2>{row.title || row.name}</h2><p>{row.slug} · {t({ public: 'Public', limited: 'Members', private: 'Private' }[row.visibility] || row.visibility)} · {row.archivedAt ? t("Archived") : t("Active")}</p></div><div className="workspace-actions"><button disabled={busy} aria-label={t('Edit {{name}}', { name: row.title || row.name })} onClick={() => edit(row)}><ActionIcon action="edit" />{t('Edit')}</button>{row.archivedAt ? <button disabled={busy} aria-label={t('Restore {{name}}', { name: row.title || row.name })} onClick={() => run(() => requestApi(`/${kind}/${row.slug}/restore`, { user, method: 'PATCH' }))}><ActionIcon action="restore" />{t('Restore')}</button> : <button disabled={busy} aria-label={t('Archive {{name}}', { name: row.title || row.name })} onClick={() => setArchiveTarget(row)}><ActionIcon action="archive" />{t('Archive')}</button>}</div></article>)}</div>
    {archiveTarget && <div className="archive-confirm"><p>{t('Archive “{{name}}”? You can restore it later.', { name: archiveTarget.title || archiveTarget.name })}</p><button className="copy-button" disabled={busy} onClick={() => run(async () => { await requestApi(`/${kind}/${archiveTarget.slug}`, { user, method: 'DELETE' }); setArchiveTarget(null); })}>{t("Confirm archive")}</button><button className="copy-button" disabled={busy} onClick={() => setArchiveTarget(null)}>{t("Cancel archive")}</button></div>}
    </>}
    {form && <form className="admin-editor" onSubmit={event => { event.preventDefault(); run(async () => { if (kind === 'tools' && (rows === null || !availableComponents.includes(form.component))) throw new Error('This tool component already exists. Choose an available component or edit the existing tool.'); const body = contentPayload(kind, form, editing || false); await requestApi(`/${kind}${editing ? `/${editing.slug}` : ''}`, { user, method: editing ? 'PATCH' : 'POST', body }); setForm(null); setEditing(null); }); }}>
      <h2>{t(editing ? (kind === 'blogs' ? 'Edit blog' : 'Edit tool') : (kind === 'blogs' ? 'Create blog' : 'Create tool'))}</h2><fieldset disabled={busy || (kind === 'tools' && rows === null)}>
      {field('slug', 'Slug')}{kind === 'blogs' ? <>{field('title', 'Title')}{field('excerpt', 'Excerpt', true)}{field('tags', 'Tags (comma separated)')}{field('coverImageUrl', 'Cover image HTTPS URL')}<RichTextEditor value={form.contentHtml} onChange={contentHtml => setForm({ ...form, contentHtml })} disabled={busy} /><details><summary>{t("Preview content")}</summary><SafeHtml html={form.contentHtml} /></details></> : <>{field('name', 'Tool name')}{field('description', 'Description', true)}<label className="utility-field">{t("Tool component")}<select value={form.component} onChange={event => setForm({ ...form, component: event.target.value })}>{availableComponents.map(key => <option key={key}>{key}</option>)}</select></label>{field('category', 'Category')}{field('sortOrder', 'Sort order')}{field('config', 'Config JSON', true)}<p className="mock-note">{t("Config is saved as metadata. Utilities currently use their built-in controls.")}</p></>}
      <label className="utility-field">{t("Visibility")}<select value={form.visibility} onChange={event => setForm({ ...form, visibility: event.target.value })}><option value="public">{t("Public · everyone")}</option><option value="limited">{t("Limited · signed-in users")}</option><option value="private">{t("Private · admins only")}</option></select></label><div className="workspace-actions"><button className="button-primary" aria-busy={busy}>{t("Save content")}</button><button type="button" onClick={() => setForm(null)}>{t("Cancel editing")}</button></div></fieldset>
    </form>}
    {busy && <LoadingIndicator label={t("Saving…")} />}
    {error && <p className="tool-error" role="alert">{t(error)}</p>}{notice && <p role="status">{t(notice)}</p>}
  </>;
}

export default function AdminPage() {
  const { t } = useLanguage();
  const session = useSession();
  const [kind, setKind] = useState('blogs'), [error, setError] = useState('');
  useEffect(() => { document.title = t('Administration — Minh Duong'); }, [t]);
  return <div className="portfolio concept-b concept-mix"><SiteNavigation concept="mix" page="admin" /><main className="content-width admin-page"><span className="eyebrow">{t("ADMINISTRATION")}</span><h1>{t("Manage your content")}<span>.</span></h1>
    {session.loading ? <LoadingState label={t("Checking administrator access")} compact /> : !session.user ? <><p>{t("Sign in to manage content.")}</p><a className="button-primary" href={siteLink('login')}>{t("Sign in")}</a></> : !session.isAdmin ? <><p>{t("Verified administrator access is required.")}</p><a className="button-secondary" href={siteLink('login')}>{t("Open account")}</a><button className="copy-button" onClick={() => session.refresh().catch(failure => setError(failure.message))}>{t("Refresh access")}</button></> : <>
      <div className="workspace-actions"><span>{session.user.email}</span><button onClick={() => session.logout().catch(failure => setError(failure.message))}>{t("Sign out")}</button></div><div className="filter-buttons" role="group" aria-label={t("Manage content type")}>{['blogs', 'tools', 'visitors'].map(value => <button key={value} aria-pressed={kind === value} onClick={() => setKind(value)}>{value === 'blogs' ? t("Blogs management") : value === 'tools' ? t("Tools management") : t("Visitors")}</button>)}</div>
      {kind === 'visitors' ? <VisitorAnalytics key={session.user.uid} /> : <Management key={`${kind}:${session.user.uid}`} kind={kind} onDenied={() => session.refresh().catch(failure => setError(failure.message))} />}
    </>}{(error || session.error) && <p className="tool-error" role="alert">{t(error || session.error)}</p>}</main><SiteFooter /></div>;
}
