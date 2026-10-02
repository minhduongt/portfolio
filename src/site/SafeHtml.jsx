import DOMPurify from 'dompurify';
export default function SafeHtml({ html }) {
  const safe = DOMPurify.sanitize(html || '', { ALLOWED_TAGS: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a'], ALLOWED_ATTR: ['href', 'title'] });
  return <div className="article-body managed-html" dangerouslySetInnerHTML={{ __html: safe }} />;
}
