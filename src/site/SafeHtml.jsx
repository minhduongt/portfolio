import DOMPurify from 'dompurify';
export function isHtmlDocumentSource(text) {
  return /^(?:<!doctype\s+html[^>]*>\s*)?<(div|article|section|main|html|body)\b[\s\S]*<\/\1>\s*$/iu.test(text.trim());
}
function recoverHtmlSource(html) {
  if (!html.includes('&lt;')) return html;
  // Rich-text paste can wrap escaped source in paragraphs. Recover only a whole
  // document/section, never inline examples or an explicit standalone code block.
  const fragment = DOMPurify.sanitize(html, { RETURN_DOM: true, ALLOWED_TAGS: ['p', 'br', 'div', 'span', 'pre', 'code'], ALLOWED_ATTR: [] });
  if (fragment.querySelector('pre, code') && !fragment.querySelector('p')) return html;
  const source = fragment.textContent.trim();
  return isHtmlDocumentSource(source) ? source : html;
}
export function sanitizeContent(html, markdown = false) {
  const tags = ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a'];
  const source = markdown ? html || '' : recoverHtmlSource(html || '');
  return DOMPurify.sanitize(source, { ALLOWED_TAGS: markdown ? [...tags, 'h5', 'h6', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'del'] : tags, ALLOWED_ATTR: ['href', 'title'] });
}
export default function SafeHtml({ html, markdown = false }) {
  const safe = sanitizeContent(html, markdown);
  return <div className="article-body managed-html" dangerouslySetInnerHTML={{ __html: safe }} />;
}
