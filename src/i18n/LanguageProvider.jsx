import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { resources } from './resources';
import { languagePreference, languageStorageKey, translate } from './translation';

const LanguageContext = createContext({ language: 'en', locale: 'en-GB', t: key => key, setLanguage() {} });
export default function LanguageProvider({ children }) {
  const [language, updateLanguage] = useState(() => {
    try { return languagePreference(window.localStorage); } catch { return 'en'; }
  });
  const setLanguage = useCallback(value => {
    if (!['en', 'vi'].includes(value)) return;
    updateLanguage(value);
    try { localStorage.setItem(languageStorageKey, value); } catch { /* The selection still works for this visit. */ }
  }, []);
  const t = useCallback((key, values) => translate(resources, language, key, values), [language]);
  useLayoutEffect(() => { document.documentElement.lang = language; }, [language]);
  const value = useMemo(() => ({ language, locale: language === 'vi' ? 'vi-VN' : 'en-GB', t, setLanguage }), [language, t, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
