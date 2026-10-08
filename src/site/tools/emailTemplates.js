export const emailButtonStyles = '<style>.email-button{cursor:pointer;background:inherit;border-radius:inherit}.email-button:hover,.email-button:focus-visible{filter:brightness(.92)}</style>';
export const emailTemplates = {
  welcome: { label: 'Welcome', subject: 'Welcome aboard', heading: 'A little space for something new.', message: 'Thanks for joining us. We are glad you are here. Explore your workspace and make yourself at home.', buttonText: 'Explore the workspace' },
  newsletter: { label: 'Newsletter', subject: 'Notes from this month', heading: 'Fresh ideas. Useful things.', message: 'Here is what we have been building this month. Discover practical tips, new projects and a few ideas worth sharing.', buttonText: 'Read the latest notes' },
  receipt: { label: 'Receipt', subject: 'Your receipt', heading: 'Thank you for your order.', message: 'Your payment has been received. Here is a summary of your order for your records.', buttonText: 'View your order' },
};
export function templateFields(template = 'welcome', t = value => value, language = 'en') {
  const fields = { brand: 'Minh’s workspace', ...emailTemplates[template], link: 'https://example.com', accent: '#B8CEB9', footer: 'You received this email because you connected with us.', reference: 'ORDER-001', item: 'Workspace subscription', total: '$49.00' };
  for (const key of ['brand', 'subject', 'heading', 'message', 'buttonText', 'footer', 'item']) fields[key] = t(fields[key]);
  return { ...fields, language: language === 'vi' ? 'vi' : 'en' };
}
const escape = value => String(value).replace(/[&<>"']/gu, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
export function buildEmail(template, fields, t = value => value) {
  if (!emailTemplates[template]) throw new Error('Choose a valid template.');
  if (!/^#[\da-f]{6}$/iu.test(fields.accent)) throw new Error('Use a six-digit HEX accent color.');
  let url;
  try { url = new URL(fields.link); } catch { throw new Error('Enter an absolute HTTP or HTTPS button link.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Button links must use HTTP or HTTPS.');
  const content = template === 'receipt' ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="12" style="border-collapse:collapse;margin:24px 0;background:#f4f7f4;color:#26382c;font-size:14px;"><tr><td>${escape(t('Order'))}</td><td align="right">${escape(fields.reference)}</td></tr><tr><td>${escape(fields.item)}</td><td align="right">${escape(fields.total)}</td></tr></table>` : template === 'newsletter' ? `<p style="font-size:12px;letter-spacing:2px;color:#738778;margin:24px 0;">${escape(t('THE NOTEBOOK / MONTHLY EDITION'))}</p>` : '';
  return `<!doctype html>
<html lang="${fields.language === 'vi' ? 'vi' : 'en'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(fields.subject)}</title>${emailButtonStyles}</head>
<body style="margin:0;padding:0;background:#edf2ed;font-family:Arial,sans-serif;color:#26382c;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#edf2ed;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dbe4db;">
<tr><td style="padding:24px 32px;background:#17231e;color:${fields.accent};font-size:15px;font-weight:bold;">${escape(fields.brand)}</td></tr>
<tr><td style="padding:36px 32px;">
<h1 style="margin:0 0 20px;font-size:30px;line-height:1.3;font-weight:normal;color:#17231e;">${escape(fields.heading)}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#526458;">${escape(fields.message).replaceAll('\n', '<br>')}</p>
${content}
<table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="background:${fields.accent};border-radius:4px;"><a class="email-button" href="${escape(url.href)}" style="display:inline-block;padding:14px 24px;color:#17231e;font-size:14px;font-weight:bold;text-decoration:none;">${escape(fields.buttonText)}</a></td></tr></table>
</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid #e1e8e1;color:#738778;font-size:12px;line-height:1.7;">${escape(fields.footer)}</td></tr>
</table></td></tr></table>
</body></html>`;
}
