import { blogCreatedDate } from './blogDates';
import { useLanguage } from '../i18n/LanguageProvider';

export default function BlogMetadata({ post }) {
  const { locale, t } = useLanguage();
  const dateFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const date = blogCreatedDate(post.createdAt);
  return <div className="blog-metadata">
    {date && <time dateTime={date.toISOString()} title={date.toLocaleString(locale, { timeZoneName: 'short' })}>{t('Created {{date}}', { date: dateFormat.format(date) })}</time>}
    {!!post.tags?.length && <ul className="blog-tags" aria-label={t('Tags')}>{[...new Set(post.tags)].map(tag => <li key={tag}>{tag}</li>)}</ul>}
  </div>;
}
