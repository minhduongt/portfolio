export const languageStorageKey = 'portfolio.language';
export function languagePreference(storage) {
  try { return storage?.getItem(languageStorageKey) === 'vi' ? 'vi' : 'en'; }
  catch { return 'en'; }
}

function lookup(catalogs, key) {
  for (const catalog of Object.values(catalogs || {})) {
    if (Object.hasOwn(catalog.messages || {}, key)) return catalog.messages[key];
  }
  return key.split('.').reduce((value, segment) => value && Object.hasOwn(value, segment) ? value[segment] : undefined, catalogs);
}
export function translate(resources, language, key, values = {}) {
  if (typeof key !== 'string') return key;
  let translated = lookup(resources[language], key) ?? lookup(resources.en, key);
  if (translated == null) {
    const formatted = formattedMessage(resources[language], key) ?? formattedMessage(resources.en, key);
    translated = formatted?.text ?? key;
    values = { ...formatted?.values, ...values };
  }
  const text = typeof translated === 'string' ? translated : key;
  return text.replace(/\{\{(\w+)\}\}/gu, (placeholder, name) => Object.hasOwn(values, name) ? String(values[name] ?? '') : placeholder);
}

const templateCache = new WeakMap();
function formattedMessage(catalogs, key) {
  if (!catalogs) return null;
  if (!templateCache.has(catalogs)) {
    const patterns = [];
    for (const catalog of Object.values(catalogs)) for (const [source, text] of Object.entries(catalog.messages || {})) {
      if (!source.includes('{{')) continue;
      const names = [];
      const pattern = source.split(/(\{\{\w+\}\})/u).map(part => {
        if (part.startsWith('{{')) { names.push(part.slice(2, -2)); return '(.+?)'; }
        return part.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
      }).join('');
      patterns.push({ expression: new RegExp(`^${pattern}$`, 'u'), names, text });
    }
    templateCache.set(catalogs, patterns);
  }
  for (const { expression, names, text } of templateCache.get(catalogs)) {
    const match = key.match(expression);
    if (match) return { text, values: Object.fromEntries(names.map((name, index) => [name, match[index + 1]])) };
  }
  return null;
}
