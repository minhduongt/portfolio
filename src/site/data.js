// Layout samples, not published posts or claims of additional projects.
export const posts = [
  { slug: 'pwa', topic: 'Frontend', title: 'Making a PWA feel useful.', excerpt: 'A draft space for practical notes on responsive interfaces and web push notifications.', sections: [
    ['Start with the workflow', 'This sample article previews the reading layout. The PhuongNamCompany project combines a responsive React frontend with PWA features and web push notifications.'],
    ['Keep the interface clear', 'A real article can explain an implementation decision, show a small code example and discuss what changed for the user. These are editorial placeholders, not a published case study.'],
    ['What comes next', 'Replace this sample with a finished article before publication. The layout supports section headings, a reading outline and related notes.'],
  ] },
  { slug: 'interfaces', topic: 'Frontend', title: 'Interfaces that explain themselves.', excerpt: 'A sample draft about clarity, reusable components and the small details of a product.', sections: [
    ['A clear starting point', 'This is sample editorial content for the Blogs mockup. It shows how an introduction and a short section can read without competing with decorative effects.'],
    ['Space for a real example', 'A finished article can include the problem, an interface example and the reasoning behind a component decision. No additional project or achievement is implied here.'],
  ] },
  { slug: 'delivery', topic: 'Delivery', title: 'From a local build to a deployed product.', excerpt: 'A draft layout for lessons from a fullstack project and its deployment workflow.', sections: [
    ['The delivery layer', 'PhuongNamCompany includes deployment on Ubuntu with CI/CD workflows, using GitHub Actions, Docker and Nginx. This sample uses those CV topics to demonstrate an article page.'],
    ['Write the lessons down', 'The final post can document actual implementation choices, checks and lessons learned. This prototype intentionally leaves room for that original material.'],
  ] },
];

export const tools = [
  { id: 'json', name: 'JSON Formatter', category: 'Data', icon: '{ }', description: 'Make JSON easier to read. Validate, format and inspect a payload.' },
  { id: 'url', name: 'URL Encoder / Decoder', category: 'Web', icon: '%', description: 'Encode or decode a URL component without leaving your browser.' },
  { id: 'words', name: 'Word Counter', category: 'Writing', icon: 'Aa', description: 'A quick count of words, characters and lines as you write.' },
  { id: 'image', name: 'Image Converter', category: 'Images', icon: '▧', description: 'Convert and resize PNG, JPEG and WebP images locally.' },
  { id: 'powerfx', name: 'Power Fx Formatter', category: 'Power Apps', icon: 'fx', description: 'Give Power Apps formulas a readable layout while preserving their tokens.' },
  { id: 'color', name: 'Color Picker', category: 'Design', icon: '◒', description: 'Choose a color and copy its HEX, RGB or HSL value.' },
  { id: 'markdown', name: 'Markdown Editor', category: 'Writing', icon: 'M↓', description: 'Write Markdown, review a sanitized live preview and download your notes.' },
  { id: 'credentials', name: 'Password / UUID Generator', category: 'Generators', icon: '✳', description: 'Generate secure random passwords and version 4 UUIDs locally.' },
  { id: 'lorem', name: 'Lorem Ipsum Generator', category: 'Writing', icon: 'Aa', description: 'Create placeholder paragraphs or an exact number of words.' },
  { id: 'timestamp', name: 'UNIX Timestamp Converter', category: 'Date & time', icon: '↔', description: 'Convert UNIX seconds or milliseconds to dates and back with explicit timezones.' },
  { id: 'hash', name: 'Hash Generator', category: 'Developer', icon: '#', description: 'Generate SHA-1, SHA-256, SHA-384 or SHA-512 hashes from UTF-8 text.' },
  { id: 'jwt', name: 'JWT Encode / Decode', category: 'Developer', icon: 'JWT', description: 'Inspect JWT headers and payloads or create HS256 and unsigned tokens.' },
  { id: 'cron', name: 'Cron Expression Parser', category: 'Date & time', icon: '◷', description: 'Parse a five-field cron expression and preview its next five runs in a timezone.' },
  { id: 'html-email', name: 'HTML Preview / Email Builder', category: 'HTML & email', icon: '</>', description: 'Build HTML emails from templates, edit the markup and preview desktop or mobile layouts.' },
];
