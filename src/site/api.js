import { tools } from './data.js';

export const apiBase = import.meta.env?.VITE_API_BASE_URL?.trim().replace(/\/$/u, '') || (import.meta.env?.DEV ? 'http://localhost:3000/api/v1' : '');
export async function requestApi(path, { user, method = 'GET', body, signal, cache, base = apiBase } = {}) {
  if (!base) throw new Error('Content service is not configured. Set VITE_API_BASE_URL before building.');
  const send = async refresh => {
    const headers = { Accept: 'application/json' };
    if (user) headers.Authorization = `Bearer ${await user.getIdToken(refresh)}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    let response;
    try { response = await fetch(`${base.replace(/\/$/u, '')}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal, cache }); }
    catch (error) { if (error.name === 'AbortError') throw error; throw new Error('Cannot reach the content service. Check the connection and try again.'); }
    if (response.status === 401 && user && !refresh) return send(true);
    let result;
    try { result = await response.json(); } catch { throw new Error('The content service did not return valid JSON. Check the API address.'); }
    if (!response.ok || result.success !== true) {
      const error = new Error(result.message || `Request failed (${response.status}).`);
      error.status = response.status; error.code = result.code; throw error;
    }
    return result.data;
  };
  return send(false);
}

export const componentKeys = { 'json-formatter': 'json', 'url-encoder-decoder': 'url', 'word-counter': 'words', 'image-converter': 'image', 'powerfx-formatter': 'powerfx', 'color-picker': 'color', 'markdown-editor': 'markdown', 'password-uuid-generator': 'credentials', 'lorem-ipsum-generator': 'lorem', 'unix-timestamp-converter': 'timestamp', 'hash-generator': 'hash', 'jwt-encoder-decoder': 'jwt', 'cron-parser': 'cron', 'html-email-builder': 'html-email' };
export function toolDefinition(record) {
  const id = Object.hasOwn(componentKeys, record.component) ? componentKeys[record.component] : null;
  const local = tools.find(tool => tool.id === id);
  // Only metadata is consumed. Remote config/code never controls executable utilities.
  return { ...record, id, icon: local?.icon || '?', category: record.category || 'Utility' };
}
export function contentPayload(kind, form, editing = false) {
  if (!['public', 'limited', 'private'].includes(form.visibility)) throw new Error('Choose public, limited or private visibility.');
  const data = { visibility: form.visibility };
  if (!editing) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(form.slug)) throw new Error('Use lowercase words separated by single hyphens for the slug.');
    data.slug = form.slug;
  }
  if (kind === 'blogs') {
    if (editing?.coverImageUrl && !form.coverImageUrl) throw new Error('The current API cannot remove an existing cover image. Replace it with another HTTPS URL.');
    Object.assign(data, { title: form.title.trim(), contentHtml: form.contentHtml, excerpt: form.excerpt || '', tags: (form.tags || '').split(',').map(tag => tag.trim()).filter(Boolean) });
    if (!data.title || !data.contentHtml.trim()) throw new Error('Title and blog content are required.');
    if (form.coverImageUrl) { if (new URL(form.coverImageUrl).protocol !== 'https:') throw new Error('Cover image must use HTTPS.'); data.coverImageUrl = form.coverImageUrl; }
  } else {
    const config = JSON.parse(form.config || '{}', (_key, value) => {
      if (typeof value === 'number' && (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value)))) throw new Error('Config numbers exceed JavaScript precision.');
      return value;
    });
    if (!config || Array.isArray(config) || typeof config !== 'object') throw new Error('Tool config must be a JSON object.');
    Object.assign(data, { name: form.name.trim(), description: form.description.trim(), component: form.component, category: form.category || '', sortOrder: Number(form.sortOrder || 0), config });
    if (!data.name || !data.description) throw new Error('Tool name and description are required.');
    if (!Object.hasOwn(componentKeys, data.component)) throw new Error('Choose a supported tool component.');
    if (!Number.isFinite(data.sortOrder)) throw new Error('Sort order must be a finite number.');
  }
  return data;
}
