export const emailBlockTypes = {
  heading: { label: 'Heading', icon: 'H', description: 'A clear title' },
  text: { label: 'Text', icon: '¶', description: 'A message or paragraph' },
  image: { label: 'Image', icon: '▧', description: 'A photo or logo' },
  button: { label: 'Button', icon: '↗', description: 'A call to action' },
  divider: { label: 'Divider', icon: '—', description: 'A visual separator' },
  spacer: { label: 'Spacer', icon: '↕', description: 'Room to breathe' },
  table: { label: 'Table', icon: '▤', description: 'Details in two columns' },
  columns: { label: 'Two columns', icon: '▥', description: 'Side-by-side content' },
};
export const emailFonts = ['Arial', 'Georgia', 'Verdana', 'Tahoma'];
export function createEmailBlock(type) {
  if (!Object.hasOwn(emailBlockTypes, type)) throw new Error('Choose a supported email block.');
  return { id: crypto.randomUUID(), type, padding: 24, background: '#FFFFFF', color: '#526458', align: 'left', fontSize: type === 'heading' ? 30 : 16, bold: false,
    ...(type === 'heading' ? { text: 'Your next big idea.', color: '#17231E' } : {}),
    ...(type === 'text' ? { text: 'Add a little context, share your news, or tell your story.' } : {}),
    ...(type === 'image' ? { src: '', alt: 'Describe your image', width: 100 } : {}),
    ...(type === 'button' ? { text: 'Explore more', url: 'https://example.com', buttonColor: '#B8CEB9', color: '#17231E', radius: 4, fontSize: 14, bold: true } : {}),
    ...(type === 'divider' ? { lineColor: '#DBE4DB', thickness: 1, padding: 16 } : {}),
    ...(type === 'spacer' ? { height: 32, padding: 0 } : {}),
    ...(type === 'table' ? { rows: [{ label: 'Item', value: 'Details' }, { label: 'Total', value: '$49.00' }], fontSize: 14 } : {}),
    ...(type === 'columns' ? { leftTitle: 'First story', leftText: 'Share something useful.', rightTitle: 'Second story', rightText: 'Give your readers another idea.', fontSize: 14 } : {}),
  };
}
export function createEmailDesign(template, fields) {
  const brand = { ...createEmailBlock('text'), text: fields.brand, color: fields.accent, background: '#17231E', fontSize: 15, bold: true };
  const heading = { ...createEmailBlock('heading'), text: fields.heading };
  const message = { ...createEmailBlock('text'), text: fields.message, padding: 20 };
  const extras = template === 'receipt' ? [{ ...createEmailBlock('table'), rows: [{ label: 'Order', value: fields.reference }, { label: fields.item, value: fields.total }] }]
    : template === 'newsletter' ? [{ ...createEmailBlock('text'), text: 'THE NOTEBOOK / MONTHLY EDITION', fontSize: 12, color: '#738778' }] : [];
  const button = { ...createEmailBlock('button'), text: fields.buttonText, url: fields.link, buttonColor: fields.accent };
  const footer = { ...createEmailBlock('text'), text: fields.footer, color: '#738778', fontSize: 12 };
  return { subject: fields.subject, background: '#EDF2ED', font: 'Arial', blocks: [brand, heading, message, ...extras, button, createEmailBlock('divider'), footer] };
}
export function moveEmailBlock(blocks, id, position) {
  const index = blocks.findIndex(block => block.id === id);
  if (index < 0) return blocks;
  const next = blocks.filter(block => block.id !== id);
  next.splice(Math.max(0, Math.min(next.length, position)), 0, blocks[index]);
  return next;
}
const escape = value => String(value ?? '').replace(/[&<>"']/gu, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const text = value => escape(value).replaceAll('\n', '<br>');
function color(value) {
  if (!/^#[\da-f]{6}$/iu.test(value)) throw new Error('Choose a six-digit HEX color.');
  return value;
}
function numeric(value, minimum, maximum, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  return number;
}
export function emailAssetUrl(value, image = false) {
  if (image && /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/u.test(value)) return value;
  let url;
  try { url = new URL(value); } catch { throw new Error(image ? 'Enter an absolute HTTP(S) image URL or upload an image.' : 'Enter an absolute HTTP or HTTPS button URL.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error(image ? 'Images must use HTTP(S) or embedded PNG, JPEG, GIF or WebP data.' : 'Button URLs must use HTTP or HTTPS without credentials.');
  return url.href;
}
export function renderEmailDesign(design) {
  if (!emailFonts.includes(design.font)) throw new Error('Choose a supported email font.');
  if (!Array.isArray(design.blocks) || design.blocks.length > 100) throw new Error('Use at most 100 email blocks.');
  const rows = design.blocks.map(block => {
    if (!Object.hasOwn(emailBlockTypes, block.type)) throw new Error('Unsupported email block.');
    if (!['left', 'center', 'right'].includes(block.align)) throw new Error('Choose a valid alignment.');
    const padding = numeric(block.padding, 0, 64, 'Block padding');
    const size = numeric(block.fontSize, 10, 64, 'Font size');
    const background = color(block.background), foreground = color(block.color);
    const style = `padding:${padding}px;background:${background};color:${foreground};text-align:${block.align};font-size:${size}px;line-height:1.6;font-weight:${block.bold ? 'bold' : 'normal'};`;
    let content = '';
    if (block.type === 'heading') content = `<h1 style="margin:0;font-size:${size}px;line-height:1.3;font-weight:${block.bold ? 'bold' : 'normal'};color:${foreground};">${text(block.text)}</h1>`;
    if (block.type === 'text') content = `<p style="margin:0;">${text(block.text)}</p>`;
    if (block.type === 'image' && block.src) {
      const width = numeric(block.width, 10, 100, 'Image width');
      content = `<img src="${escape(emailAssetUrl(block.src, true))}" alt="${escape(block.alt)}" width="${Math.round((600 - 2 * padding) * width / 100)}" style="display:inline-block;width:${width}%;max-width:100%;height:auto;border:0;">`;
    }
    if (block.type === 'button') content = `<table role="presentation" cellspacing="0" cellpadding="0" align="${block.align}"><tr><td style="background:${color(block.buttonColor)};border-radius:${numeric(block.radius, 0, 32, 'Button radius')}px;"><a href="${escape(emailAssetUrl(block.url))}" style="display:inline-block;padding:14px 24px;color:${foreground};font-size:${size}px;font-weight:${block.bold ? 'bold' : 'normal'};text-decoration:none;">${text(block.text)}</a></td></tr></table>`;
    if (block.type === 'divider') content = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td height="${numeric(block.thickness, 1, 8, 'Divider thickness')}" style="background:${color(block.lineColor)};font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
    if (block.type === 'spacer') {
      const height = numeric(block.height, 8, 200, 'Spacer height');
      content = `<div style="height:${height}px;line-height:${height}px;font-size:0;">&nbsp;</div>`;
    }
    if (block.type === 'table') {
      if (!Array.isArray(block.rows) || block.rows.length < 1 || block.rows.length > 20) throw new Error('Tables need 1–20 rows.');
      content = `<table role="presentation" width="100%" cellspacing="0" cellpadding="10" style="border-collapse:collapse;color:${foreground};font-size:${size}px;">${block.rows.map(row => `<tr><td style="border-bottom:1px solid #dbe4db;">${text(row.label)}</td><td align="right" style="border-bottom:1px solid #dbe4db;">${text(row.value)}</td></tr>`).join('')}</table>`;
    }
    if (block.type === 'columns') content = `<table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="color:${foreground};font-size:${size}px;"><tr>${[['leftTitle', 'leftText'], ['rightTitle', 'rightText']].map(([title, body]) => `<td width="50%" valign="top"><strong>${text(block[title])}</strong><p style="margin:12px 0 0;line-height:1.6;">${text(block[body])}</p></td>`).join('')}</tr></table>`;
    return `<tr><td align="${block.align}" style="${style}">${content}</td></tr>`;
  }).join('\n');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(design.subject)}</title></head>
<body style="margin:0;padding:0;background:${color(design.background)};font-family:${design.font},${design.font === 'Georgia' ? 'serif' : 'sans-serif'};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${design.background};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dbe4db;">
${rows}
</table></td></tr></table></body></html>`;
  if (html.length > 150000) throw new Error('Email HTML exceeds 150,000 characters. Reduce content or image size.');
  return html;
}
