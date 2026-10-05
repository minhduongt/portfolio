// Layout formatter, not a Power Fx evaluator or semantic validator.
// ponytail: reject interpolated strings; use Microsoft's parser if full language validation is needed.
export function formatPowerFx(input, locale = 'dot') {
  if (input.length > 100000) throw new Error('Use a formula under 100,000 characters.');
  const tokens = [];
  const decimal = locale === 'comma' ? ',' : '\\.';
  const numberPattern = new RegExp(`^(?:[0-9]+(?:${decimal}[0-9]*)?|${decimal}[0-9]+)(?:[eE][+-]?[0-9]+)?`);
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
      type = 'comment';
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
      if (number) { type = 'number'; i += number[0].length; }
      else if ('(){}[],;'.includes(input[i])) {
        type = 'structural';
        i += input.startsWith(';;', i) ? 2 : 1;
      } else if (/[.:+\-*/^%&=<>!@|]/u.test(input[i])) {
        type = 'operator';
        i += /^(?:<=|>=|<>|&&|\|\|)/u.test(input.slice(i)) ? 2 : 1;
      } else {
        i++;
        while (i < input.length && !/[\s(){}\[\],;"'.:+\-*/^%&=<>!@|]/u.test(input[i]) && !input.startsWith('$"', i)) i++;
      }
    }
    tokens.push({ text: input.slice(start, i), type, gap }); gap = false;
  }
  const root = { children: [] };
  const stack = [root];
  const pairs = { ')': '(', '}': '{', ']': '[' };
  for (const token of tokens) {
    const { text, type } = token;
    if (type === 'structural' && '({['.includes(text)) {
      if (stack.length > 128) throw new Error('Formula nesting exceeds 128 levels. Use a smaller formula.');
      const children = stack.at(-1).children;
      const group = { ...token, close: { '(': ')', '{': '}', '[': ']' }[text], children: [], name: children.at(-1)?.text };
      children.push(group); stack.push(group);
    } else if (type === 'structural' && Object.hasOwn(pairs, text)) {
      if (stack.length === 1 || stack.pop().text !== pairs[text]) throw new Error('Unmatched delimiter. Check parentheses, brackets and braces.');
    } else stack.at(-1).children.push(token);
  }
  if (stack.length !== 1) throw new Error('Unmatched delimiter. Check parentheses, brackets and braces.');

  const separator = locale === 'comma' ? ';' : ',';
  const chain = locale === 'comma' ? ';;' : ';';
  const indent = depth => '    '.repeat(depth);
  const split = (nodes, delimiter) => {
    const parts = [[]];
    for (const node of nodes) {
      if (!node.children && node.type === 'structural' && node.text === delimiter) parts.push([]);
      else parts.at(-1).push(node);
    }
    return parts;
  };
  const binary = node => node && !node.children && (['+', '-', '*', '/', '^', '&', '=', '<>', '<', '>', '<=', '>=', '&&', '||'].includes(node.text) || /^(And|Or|Not|As|in|exactin)$/iu.test(node.text));
  const unary = (node, previous) => ['+', '-'].includes(node.text) && (!previous || binary(previous) || [':', separator, chain, '@'].includes(previous.text));
  const join = (nodes, values) => {
    let result = '';
    nodes.forEach((node, index) => {
      const previous = nodes[index - 1];
      let space = !!previous;
      if (['.', '@', '%'].includes(node.text) || ['.', '@'].includes(previous?.text)) space = false;
      if (node.text === '!' || previous?.text === '!') space = node.text === '!' ? node.gap : previous.gap;
      if ([separator, chain, ':'].includes(node.text)) space = false;
      if (previous && unary(previous, nodes[index - 2])) space = false;
      if (node.children && ['[', '('].includes(node.text) && previous && (previous.children || previous.type === 'text' || previous.type === 'number') && !binary(previous)) space = false;
      result += (space && result && !result.endsWith('\n') ? ' ' : '') + values[index];
    });
    return result;
  };
  const inline = nodes => {
    const values = [];
    for (const node of nodes) {
      if (node.type === 'line' || node.text.includes('\n') || (!node.children && node.text === chain)) return null;
      if (node.children && node.text === '(' && ((/^Switch$/iu.test(node.name || '') && split(node.children, separator).length >= 4) || (/^Table$/iu.test(node.name || '') && node.children.some(child => child.text === '{' && child.children)))) return null;
      const value = node.children ? inline(node.children) : node.text;
      if (value === null) return null;
      values.push(node.children ? node.text + value + node.close : value);
    }
    return join(nodes, values);
  };
  const suffix = (value, punctuation, nodes, depth) => value + (punctuation && nodes.at(-1)?.type === 'line' ? '\n' + indent(depth) : '') + punctuation;
  const sequence = (nodes, depth) => {
    const parts = split(nodes, chain);
    if (parts.length > 1) {
      const values = parts.map(part => sequence(part, depth));
      return values.map((value, index) => suffix(value, index < values.length - 1 ? chain : '', parts[index], depth) +
        (index < values.length - 1 && values[index + 1] ? '\n' + (value.includes('\n') || values[index + 1].includes('\n') ? '\n' : '') + indent(depth) : '')).join('');
    }
    const colon = nodes.findIndex(node => !node.children && node.text === ':');
    if (colon >= 0 && inline(nodes.slice(colon + 1)) === null) {
      return sequence(nodes.slice(0, colon + 1), depth) + '\n' + indent(depth + 1) + sequence(nodes.slice(colon + 1), depth + 1);
    }
    const values = nodes.map(node => node.children ? group(node, depth) : node.text);
    // A line comment must end before the next token, even inside an argument.
    const segments = [[]];
    nodes.forEach((node, index) => {
      segments.at(-1).push(index);
      if (node.type === 'line' && index < nodes.length - 1) segments.push([]);
    });
    return segments.map(indices => join(indices.map(index => nodes[index]), indices.map(index => values[index]))).join('\n' + indent(depth));
  };
  const group = (node, depth) => {
    const args = split(node.children, separator);
    const compact = inline(node.children);
    const isSwitch = node.text === '(' && /^Switch$/iu.test(node.name || '') && args.length >= 4;
    const isTable = node.text === '(' && /^Table$/iu.test(node.name || '') && node.children.some(child => child.text === '{' && child.children);
    if (!isSwitch && !isTable && compact !== null && indent(depth).length + (node.name?.length || 0) + compact.length + 2 <= 100) return node.text + compact + node.close;
    const lines = [];
    for (let index = 0; index < args.length; index++) {
      const punctuation = index < args.length - 1 ? separator : '';
      if (isSwitch && index > 0 && index % 2 === 1 && index + 1 < args.length) {
        const left = inline(args[index]), right = inline(args[index + 1]);
        const pair = left !== null && right !== null ? left + separator + ' ' + right : null;
        const lastSuffix = index + 1 < args.length - 1 ? separator : '';
        if (pair !== null && indent(depth + 1).length + pair.length <= 100) lines.push(indent(depth + 1) + pair + lastSuffix);
        else {
          lines.push(indent(depth + 1) + suffix(sequence(args[index], depth + 1), separator, args[index], depth + 1));
          lines.push(indent(depth + 2) + suffix(sequence(args[index + 1], depth + 2), lastSuffix, args[index + 1], depth + 2));
        }
        index++;
      } else lines.push(indent(depth + 1) + suffix(sequence(args[index], depth + 1), punctuation, args[index], depth + 1));
    }
    return node.text + '\n' + lines.join('\n') + '\n' + indent(depth) + node.close;
  };
  return sequence(root.children, 0).trim();
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
