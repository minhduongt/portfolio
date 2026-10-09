const fail = key => { throw Object.assign(new Error(key), { localizationKey: key }); };
export function enhancementPayload(form) {
  if (!['sentence', 'keyword'].includes(form.mode) || !['en', 'vi'].includes(form.language) || !['en', 'vi'].includes(form.explanationLanguage)) fail('languageTool.invalid');
  if (typeof form.text !== 'string' || !form.text.trim()) fail('languageTool.required');
  if (form.text.length > (form.mode === 'sentence' ? 2000 : 100)) fail('languageTool.textLimit');
  if (typeof form.context !== 'string' || form.context.length > 500) fail('languageTool.contextLimit');
  if (form.mode === 'sentence' && !['natural', 'professional', 'casual', 'academic'].includes(form.tone)) fail('languageTool.invalid');
  return { mode: form.mode, text: form.text.trim(), language: form.language, explanationLanguage: form.explanationLanguage, ...(form.mode === 'sentence' ? { tone: form.tone } : {}), context: form.context.trim() };
}
const strings = (item, fields) => item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === Object.keys(fields).length && Object.entries(fields).every(([key, max]) => typeof item[key] === 'string' && item[key].trim() && item[key].length <= max);
const list = (items, min, max, fields) => Array.isArray(items) && items.length >= min && items.length <= max && items.every(item => strings(item, fields));
export function readEnhancement(data, request) {
  const result = data?.result;
  const explanation = { text: 3000, explanation: 1000, context: 500 };
  const valid = data?.mode === request.mode && data?.text === request.text && data?.language === request.language && data?.explanationLanguage === request.explanationLanguage && result && typeof result === 'object' && !Array.isArray(result) && (request.mode === 'sentence'
    ? data.tone === request.tone && Object.keys(result).length === 1 && list(result.alternatives, 3, 5, explanation)
    : Object.keys(result).length === 6 && strings({ meaning: result.meaning, partOfSpeech: result.partOfSpeech, notes: result.notes }, { meaning: 1000, partOfSpeech: 100, notes: 1000 }) && ['synonyms', 'antonyms'].every(key => list(result[key], 0, 5, { word: 200, meaning: 600, example: 1000, context: 500 })) && list(result.examples, 1, 3, { text: 1000, explanation: 600, context: 500 }));
  if (!valid) fail('languageTool.invalidResponse');
  return result;
}
