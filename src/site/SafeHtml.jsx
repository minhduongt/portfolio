import DOMPurify from 'dompurify';
export default function SafeHtml({ html, markdown = false }) {
  const tags = ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a'];
  const safe = DOMPurify.sanitize(html || '', { ALLOWED_TAGS: markdown ? [...tags, 'h5', 'h6', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'del'] : tags, ALLOWED_ATTR: ['href', 'title'] });
  return <div className="article-body managed-html" dangerouslySetInnerHTML={{ __html: safe }} />;
}
