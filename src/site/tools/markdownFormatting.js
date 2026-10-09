export function formatMarkdown(input, start, end, kind, placeholder) {
  const selected = input.slice(start, end) || placeholder;
  let replacement, from = start, to = end, offset = 0, length = selected.length;
  const ticks = text => '`'.repeat(Math.max(0, ...(text.match(/`+/gu) || []).map(run => run.length)) + 1);
  if (['heading', 'bullets', 'numbers', 'quote'].includes(kind)) {
    from = start === 0 ? 0 : input.lastIndexOf('\n', start - 1) + 1;
    const last = end > start && input[end - 1] === '\n' ? end - 1 : end;
    const next = input.indexOf('\n', last);
    to = next < 0 ? input.length : next;
    const lines = (input.slice(from, to) || placeholder).split('\n');
    replacement = lines.map((line, index) => `${kind === 'heading' ? '## ' : kind === 'bullets' ? '- ' : kind === 'numbers' ? `${index + 1}. ` : '> '}${line}`).join('\n');
    length = replacement.length;
    if (lines.length === 1) { offset = replacement.length - lines[0].length; length = lines[0].length; }
  } else if (kind === 'bold' || kind === 'italic' || kind === 'code') {
    const delimiter = kind === 'bold' ? '**' : kind === 'italic' ? '*' : ticks(selected);
    const pad = kind === 'code' && /(^`|`$)/u.test(selected) ? ' ' : '';
    replacement = `${delimiter}${pad}${selected}${pad}${delimiter}`; offset = delimiter.length + pad.length;
  } else if (kind === 'link') {
    const label = selected.replace(/[\\[\]]/gu, '\\$&');
    replacement = `[${label}](https://example.com)`; offset = label.length + 3; length = 'https://example.com'.length;
  } else if (kind === 'codeblock' || kind === 'divider') {
    const leading = from === 0 || input.slice(0, from).endsWith('\n\n') ? '' : input[from - 1] === '\n' ? '\n' : '\n\n';
    const trailing = to < input.length && input[to] !== '\n' ? '\n\n' : '\n';
    const fence = '`'.repeat(Math.max(3, ticks(selected).length));
    replacement = kind === 'codeblock' ? `${leading}${fence}\n${selected}\n${fence}${trailing}` : `${leading}---${trailing}`;
    offset = kind === 'codeblock' ? leading.length + fence.length + 1 : replacement.length;
    if (kind === 'divider') length = 0;
  } else throw new Error('Unknown Markdown format');
  return { value: input.slice(0, from) + replacement + input.slice(to), start: from + offset, end: from + offset + length };
}
