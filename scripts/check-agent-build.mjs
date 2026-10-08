import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
const files = readdirSync('build/assets').filter(name => name.endsWith('.js'));
assert(files.some(name => name.startsWith('AgentPanel-')), 'Chat interface remains a lazy chunk');
for (const file of files) assert.doesNotMatch(readFileSync(`build/assets/${file}`, 'utf8'), /GEMINI_API_KEY|@google\/genai|generativelanguage\.googleapis\.com/u, `Server-only AI integration in ${file}`);
console.log('Chat is lazy-loaded; browser assets contain no Gemini secret configuration, SDK or inference endpoint.');
