import { profile, projects } from '../content.js';

export const sectionIds = ['home', 'about', 'work', 'experience', 'contact', 'layers'];
export const projectId = project => project.name.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
const slug = value => typeof value === 'string' && value.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value);
const fields = (action, allowed) => Object.keys(action).every(key => allowed.includes(key));

export function validateAction(action, { blogs = [] } = {}) {
  if (!action || typeof action !== 'object' || Array.isArray(action)) return null;
  switch (action.type) {
    case 'navigate':
      if (!fields(action, ['type', 'path', 'sectionId'])) return null;
      if (sectionIds.includes(action.sectionId) && action.path === `/#${action.sectionId}`) return action;
      if (!action.sectionId && blogs.some(id => slug(id) && action.path === `/blogs/${id}`)) return action;
      return null;
    case 'open_project':
      return fields(action, ['type', 'path', 'projectId']) && action.path === '/#work' && projects.some(project => project.url && projectId(project) === action.projectId) ? action : null;
    case 'open_tool':
      return fields(action, ['type', 'path', 'slug']) && action.path === '/tools' && slug(action.slug) ? action : null;
    case 'change_language':
      return fields(action, ['type', 'language']) && ['en', 'vi'].includes(action.language) ? action : null;
    case 'open_external_link':
      return fields(action, ['type', 'linkId', 'url', 'requiresConfirmation']) && ['github', 'linkedin'].includes(action.linkId) && action.requiresConfirmation === true && action.url === new URL(profile[action.linkId]).href ? action : null;
    default: return null;
  }
}

export function boundedHistory(messages, message) {
  const pairs = [];
  let remaining = 12000 - message.length;
  for (let index = messages.length - 2; index >= 0 && pairs.length < 5; index -= 2) {
    const user = messages[index], assistant = messages[index + 1];
    if (user.role !== 'user' || assistant.role !== 'assistant') continue;
    const pair = [user, assistant].map(item => ({ role: item.role, content: item.content.slice(0, 2000) }));
    const size = pair[0].content.length + pair[1].content.length;
    if (size > remaining) break;
    remaining -= size; pairs.unshift(pair);
  }
  return pairs.flat();
}

export function readReply(data, registry) {
  if (typeof data?.reply !== 'string' || !data.reply.trim() || data.reply.length > 16000) throw new Error('Invalid agent response');
  const actions = (Array.isArray(data.actions) ? data.actions : []).slice(0, 6).map(action => validateAction(action, registry)).filter(Boolean);
  return { content: data.reply, role: 'assistant', actions };
}

export function sessionId() {
  try {
    const stored = sessionStorage.getItem('portfolio.agent.session');
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(stored || '')) return stored;
    const id = crypto.randomUUID(); sessionStorage.setItem('portfolio.agent.session', id); return id;
  } catch { return crypto.randomUUID(); }
}
