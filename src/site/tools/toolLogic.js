// Layout formatter, not a Power Fx evaluator or semantic validator.
// ponytail: reject interpolated strings; use Microsoft's parser if full language validation is needed.
export function formatPowerFx(input, locale = 'dot') {
  if (input.length > 100000) throw new Error('Use a formula under 100,000 characters.');
  const tokens = [];
  const decimal = locale === 'comma' ? ',' : '\\.';
  const numberPattern = new RegExp(`^(?:[0-9]+(?:${decimal}[0-9]+)?|${decimal}[0-9]+)(?:[eE][+-]?[0-9]+)?`);
  let i = 0;
  let gap = false;
  while (i < input.length) {
    const start = i;
    if (/\s/u.test(input[i])) { gap = true; i++; continue; }
    let type = 'text';
    if (input.startsWith('$"', i)) throw new Error('Interpolated strings are not supported yet. Keep their original formatting.');
    if (input.startsWith('//', i)) {
      type = 'line';
      while (i < input.length && !/[\r\n]/u.test(input[i])) i++;
    } else if (input.startsWith('/*', i)) {
      const end = input.indexOf('*/', i + 2);
      if (end < 0) throw new Error('Unterminated block comment.');
      i = end + 2;
    } else if (input[i] === '"' || input[i] === "'") {
      const quote = input[i++];
      let closed = false;
      while (i < input.length) {
        if (input[i++] === quote) {
          if (input[i] === quote) i++;
          else { closed = true; break; }
        }
      }
      if (!closed) throw new Error('Unterminated string or quoted identifier.');
    } else {
      const number = input.slice(i).match(numberPattern);
      if (number) i += number[0].length;
      else if ('(){}[],;'.includes(input[i])) {
        type = 'structural';
        i += input.startsWith(';;', i) ? 2 : 1;
      } else {
        i++;
        while (i < input.length && !/[\s(){}\[\],;"']/u.test(input[i]) && !input.startsWith('//', i) && !input.startsWith('/*', i) && !input.startsWith('$"', i)) i++;
      }
    }
    tokens.push({ text: input.slice(start, i), type, gap }); gap = false;
  }
  const stack = [];
  const pairs = { ')': '(', '}': '{', ']': '[' };
  let result = '';
  const newline = () => { result = result.replace(/[ \t]+$/u, ''); if (result && !result.endsWith('\n')) result += '\n'; };
  const append = (text, space = false) => {
    if (result.endsWith('\n')) result += '  '.repeat(stack.length);
    else if (space && result && !/\s$/u.test(result)) result += ' ';
    result += text;
  };
  tokens.forEach((token, index) => {
    const { text, type, gap: separated } = token;
    if (type === 'structural' && '({['.includes(text)) {
      append(text, separated); stack.push(text);
      if (stack.length > 128) throw new Error('Formula nesting exceeds 128 levels. Use a smaller formula.');
      if (tokens[index + 1]?.text !== ({ '(': ')', '{': '}', '[': ']' })[text]) newline();
    } else if (type === 'structural' && Object.hasOwn(pairs, text)) {
      if (stack.pop() !== pairs[text]) throw new Error('Unmatched delimiter. Check parentheses, brackets and braces.');
      if (tokens[index - 1]?.text !== pairs[text]) newline();
      append(text);
    } else if (type === 'structural' && [locale === 'comma' ? ';' : ',', locale === 'comma' ? ';;' : ';'].includes(text)) {
      append(text); newline();
    } else {
      append(text, separated);
      if (type === 'line') newline();
    }
  });
  if (stack.length) throw new Error('Unmatched delimiter. Check parentheses, brackets and braces.');
  return result.trim();
}

export function colorValues(value) {
  let hex = value.trim().replace(/^#/u, '');
  if (/^[\da-f]{3}$/iu.test(hex)) hex = [...hex].map(char => char + char).join('');
  if (!/^[\da-f]{6}$/iu.test(hex)) throw new Error('Enter a HEX color with 3 or 6 digits.');
  const channels = [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
  const [r, g, b] = channels.map(channel => channel / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  const light = (max + min) / 2;
  let hue = 0;
  if (delta) hue = (max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60;
  const saturation = delta ? delta / (1 - Math.abs(2 * light - 1)) : 0;
  return { hex: `#${hex.toUpperCase()}`, rgb: `rgb(${channels.join(', ')})`, hsl: `hsl(${Math.round(hue) % 360}, ${Math.round(saturation * 100)}%, ${Math.round(light * 100)}%)` };
}
