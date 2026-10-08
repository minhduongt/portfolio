// CV facts, latest employment corrections supplied by the user, and locally reviewed project source.
// Evidence and CV additions: docs/cv-and-projects-update.md.
// GitHub is retained from the existing portfolio. Project diagrams are not screenshots.
export const profile = {
  name: "Duong Tan Minh",
  role: "Software Developer",
  email: "dtminh.dev@gmail.com",
  phone: "+84764420250",
  linkedin: "https://www.linkedin.com/in/minhdt1105",
  github: "https://github.com/minhduongt",
  positioning: "Thoughtful interfaces. Practical software.",
  introduction: "I build practical products with Power Platform, React and .NET — connecting thoughtful interfaces to the applications, data and automation behind them.",
  about: "A fullstack developer at Mi-Jack Vietnam, focused on Power Platform, Power Apps, Power Automate, React and .NET. My experience spans ERP systems, web builders and company workflows, alongside personal projects for interactive learning and study communities. I enjoy turning complex requirements into dependable, understandable products.",
};

export const education = { school: 'FPT University — HCM City', description: 'Software Engineering · 2019–2023' };

export const projects = [
  {
    name: "RE:SEARCH",
    url: "https://re-search-platform.web.app/",
    category: "Study community · Outsourcing project",
    role: "Developer",
    team: null,
    summary: "A shared space to ask, study and exchange resources.",
    problem: "Bring discussion, focused study and shared learning resources into one study-community application.",
    built: "Built a React and TypeScript application with realtime forum posts and responses, rich-text editing, profiles, a document-link library, a Pomodoro study lounge and timed quizzes with stored attempts and leaderboards.",
    challenge: "Coordinated Firestore subscriptions across discussion and study presence, sanitized rendered rich text, and organized the rebuild into feature modules alongside the retained legacy application.",
    outcome: "The current source connects community and study workflows to Firebase Auth and Firestore. It remains an MVP; quiz scoring and some permission checks are client-side.",
    technologies: ["React", "TypeScript", "Firebase", "Firestore", "React Router", "TailwindCSS"],
    layers: ["Forum · Rich-text responses", "Pomodoro · Study presence", "Documents · Quizzes · Leaderboards", "Firebase Auth · Firestore"],
    accent: "research",
  },
  {
    name: "PhuongNamCompany",
    url: "https://phuongnam.net.vn/",
    category: "ERP · Outsourcing project",
    role: "Fullstack Developer",
    team: "2 members · 1 fullstack developer, 1 BA",
    summary: "A connected workspace for company operations.",
    problem: "Manage company workflows, tasks, warehouse inventory and materials through an internal ERP system and landing page.",
    built: "Built the frontend, backend and deployment from scratch: authentication, authorization, notifications, task operations, warehouse and material management, business forms, PDF export and Excel import/export.",
    challenge: "Connected a responsive PWA to RESTful APIs and implemented web push notifications between frontend and backend.",
    outcome: "Deployed on Ubuntu with CI/CD workflows.",
    technologies: ["React", "TypeScript", "ShadcnUI", "Strapi", "PostgreSQL", "Docker"],
    layers: ["React + PWA", "REST APIs · Strapi", "PostgreSQL", "GitHub Actions · Ubuntu · Nginx"],
    accent: "erp",
  },
  {
    name: "Acupressure Map",
    url: "https://acupunture-map.vercel.app/",
    category: "Interactive atlas · Outsourcing project",
    role: "Developer",
    team: null,
    summary: "Explore an anatomical map. Learn one point at a time.",
    problem: "Connect acupoint reference material with visual navigation and a practical flashcard learning workflow.",
    built: "Built a four-view anatomical map with region filtering, zoom, pan and touch gestures; Vietnamese fuzzy search; flashcards with learned/unlearned modes and per-user progress stored in Firestore.",
    challenge: "Kept point coordinates aligned while zooming and dragging markers, normalized Vietnamese search, and separated learner access from administrator content editing and image uploads.",
    outcome: "The current source includes atlas and flashcard workflows, Firebase authentication and content management, plus PWA configuration and automated component/data tests.",
    technologies: ["React", "TypeScript", "Firebase", "Firestore", "TailwindCSS", "Fuse.js"],
    layers: ["Anatomical map · 4 views", "Vietnamese search · Flashcards", "Firebase Auth · Firestore · Storage", "PWA · Learning progress"],
    accent: "atlas",
  },
];

export const experience = [
  {
    company: "Mi-Jack Vietnam", dates: "May 2026 — Present", role: "Fullstack Developer",
    description: "Fullstack development focused on Microsoft Power Platform, with React and .NET.",
    details: ["Develop applications with Power Apps and workflow automation with Power Automate.", "Work across React interfaces and .NET development alongside Power Platform solutions.", "Collaborate with US stakeholders."],
    technologies: "Power Platform · Power Apps · Power Automate · React · .NET",
  },
  {
    company: "Scavi", dates: "Apr 2025 — Apr 2026", role: "Fullstack Developer",
    description: "Development for SCAF (ERP) and ISCAF (Mobile App), spanning desktop ERP, Power Platform and backend API services.",
    details: ["Developed and maintained a WinForms ERP application with SAP and Centric integration, Power Apps, Power Automate and Power BI reports.", "Implemented performance optimizations for applications serving more than 10,000 users.", "Worked with end users, colleagues and the product manager to turn requirements and wireframes into functional interfaces."],
    technologies: "C# / .NET · WinForms · Power Platform · Node.js / Express · TypeScript · MSSQL",
  },
  {
    company: "DevDirect", dates: "Apr 2024 — Apr 2025", role: "Front-end Developer",
    description: "Frontend development for Metaflyer (Web Builder / CRM) and KNOU (Korea National Open University / CMS).",
    details: ["Developed, optimized and maintained micro-frontend web applications.", "Worked on builder history, inline updates, forms, embedded elements and dynamic components.", "Participated in pair programming and code reviews; troubleshot stability and performance issues."],
    technologies: "React · Next.js · Vue · Nuxt · Ant Design · SASS",
  },
  {
    company: "BeanOi Company", dates: "Apr 2022 — Jul 2023", role: "Front-end Developer",
    description: "Web, mobile and Tiki Tini applications for food ordering, customer, staff and administration management.",
    details: ["Developed and maintained landing, blog and ordering pages, plus administration CMS.", "Developed the Tini app on Tiki.", "The BeanOi application served over 300 students at rush hours."],
    technologies: "React · Next.js · TypeScript · Flutter · Firebase · Material UI · Ant Design",
  },
];

export const capabilities = [
  { title: "Frontend", description: "Responsive interfaces and reusable components.", items: "JavaScript / TypeScript · React / Next.js · Vue / Nuxt · HTML / CSS / SASS · Context API / Redux / Zustand · Web Components" },
  { title: "Backend & data", description: "APIs and data behind useful workflows.", items: "C# / .NET · Node.js / Express · Strapi · PostgreSQL / MSSQL · Firebase / Firestore · REST APIs · Data modelling" },
  { title: "Delivery", description: "Automation and deployment behind working products.", items: "Power Platform · Power Apps / Power Automate · GitHub Actions · Docker · Ubuntu · Nginx · PWA / web push" },
];

export const achievements = [
  "First Prize · Tiki Hacking Trail · Jul 2022 · BeanOi Tini App",
  "Third Prize · FPT Entrepreneurial Hackathon · Oct 2022 · Co-Order",
  "Most Promising Prize · FPT Entrepreneurial Hackathon · Feb 2023 · Campus Map",
];

export const concepts = {
  mix: { name: "Moon & Layers", direction: "Hero mặt trăng A, projects editorial B, ba lớp bung dần theo scroll.", scene: "Mặt trăng trong hero; section riêng cho Frontend / Backend & data / Delivery với ba lớp 3D tách dần.", strength: "Giữ nhận diện cá nhân và giải thích được năng lực sản phẩm.", tradeoff: "Thêm một section kể chuyện; có nút chọn từng lớp để xem ngay.", performance: "DPR giới hạn, render khi cần; pause quote; nội dung HTML luôn đọc được.", mobile: "Các lớp gọn, chi tiết xếp dọc; reduced motion bỏ chuyển động và tự đổi quote.", change: "Mixed mockup", components: "Moon hero, QuoteRotator, LayerStory, Blogs, BlogDetail, Tools" },
  a: { name: "Clean Evolution", direction: "Giữ DNA không gian, làm rõ nội dung.", scene: "Mặt trăng 3D riêng trong hero, ánh sáng nhẹ; không bay qua nội dung.", strength: "Quen thuộc với bản cũ, bố cục dễ tiếp cận.", tradeoff: "Chất editorial ít hơn B; dấu ấn vẫn thiên về không gian.", performance: "Một sphere dùng texture moon có sẵn, DPR giới hạn; chỉ render khi có thay đổi.", mobile: "Hero xếp dọc, scene nhỏ và tĩnh, dự án thành một cột.", change: "Thấp → vừa", components: "Navigation, Hero, ProjectCard, Experience, Contact, ThreeScene" },
  b: { name: "Modern Developer", direction: "Typography lớn, bố cục editorial, dự án là trung tâm.", scene: "Các lớp 3D tượng trưng cho frontend, API và data; chỉ ở hero.", strength: "Đọc nhanh, project presentation rõ, phù hợp recruiter/client.", tradeoff: "Ít cảm giác immersive hơn C; thay đổi nhiều nhận diện cũ.", performance: "Không texture, không shadow/post-processing; scene lazy load và dừng ngoài viewport.", mobile: "Text và CTA trước scene; project visual và nội dung xếp dọc.", change: "Vừa", components: "Layout, Navigation, Hero, Projects / ProjectDetail, Experience, Capabilities, Contact, ThreeScene" },
  c: { name: "Immersive Minimal", direction: "Scene xuyên suốt, nội dung gọn, cuộn tự nhiên.", scene: "Một cấu trúc cầu wireframe đổi góc và ánh sáng nhẹ theo section.", strength: "Nhận diện 3D mạnh, trình bày tối giản và đáng nhớ.", tradeoff: "Cần kiểm soát contrast; phần dự án thu gọn cần mở để đọc chi tiết.", performance: "Geometry nhẹ, không texture; render theo scroll/pointer, không loop chạy liên tục.", mobile: "Scene chuyển thành hero tĩnh để giảm tải GPU; nội dung vẫn đầy đủ.", change: "Vừa → cao", components: "Layout, Navigation, Hero, Projects / ProjectDetail, Section tracking, ThreeScene, Contact" },
};
