export const pinnedToolsKey = 'portfolio.pinned-tools.v1';
export function readPinnedTools(storage) {
  try {
    const data = JSON.parse(storage.getItem(pinnedToolsKey) || '[]');
    return Array.isArray(data) ? [...new Set(data.filter(value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value)))].slice(0, 100) : [];
  } catch { return []; }
}
export function readToolStar(data, slug) {
  if (data?.slug !== slug || typeof data.starred !== 'boolean' || !Number.isSafeInteger(data.starCount) || data.starCount < 0) throw new Error('Invalid tool star response');
  return { starred: data.starred, starCount: data.starCount };
}
