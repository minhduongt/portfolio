import { useLanguage } from './LanguageProvider';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  return <div className="language-switcher" role="group" aria-label={t('Language')}>
    <button type="button" lang="en" aria-label="English" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
    <button type="button" lang="vi" aria-label="Tiếng Việt" aria-pressed={language === 'vi'} onClick={() => setLanguage('vi')}>VI</button>
  </div>;
}
