const catalogs = import.meta.glob('./locales/*/*.json', { eager: true, import: 'default' });
export const resources = { en: {}, vi: {} };
for (const [path, catalog] of Object.entries(catalogs)) {
  const [, language, namespace] = path.match(/locales\/(en|vi)\/([^/]+)\.json$/u) || [];
  if (language) resources[language][namespace] = catalog;
}
