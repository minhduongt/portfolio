import { useLanguage } from '../i18n/LanguageProvider';
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import useSectionMotion from './useSectionMotion';
import useGalaxyCamera from './useGalaxyCamera';
import ContactForm from './ContactForm';
import { achievements, capabilities, education, experience, profile, projects } from './content';
import SiteNavigation, { SiteFooter } from './SiteNavigation';
import QuoteRotator from './QuoteRotator';
import LayerStory from './LayerStory';
import ProductPreview from './ProductPreview';
import { useTheme } from './ThemeProvider';
import { useAgentPage } from './agent/AgentBridge';
import { projectId } from './agent/protocol';
const ThreeScene = lazy(() => import('./ThreeScene'));

function SectionHeading({ number, eyebrow, title }) {
  const { t } = useLanguage();
  return <div className="section-heading"><span className="eyebrow">{number} / {t(eyebrow)}</span><h2>{t(title)}</h2></div>;
}

function ProjectVisual({ project, index }) {
  const { t } = useLanguage();
  return <div className={`project-visual visual-${project.accent}`} aria-label={t('{{name}} — functional overview, not a screenshot', { name: project.name })}>
    <span className="visual-label">{String(index + 1).padStart(2, '0')} / {t('FUNCTIONAL OVERVIEW')}</span>
    <div className="diagram">{project.layers.map((layer, i) => <React.Fragment key={layer}>
      {i > 0 && <span className="diagram-connector" aria-hidden="true">↓</span>}<span className="diagram-layer">{t(layer)}</span>
    </React.Fragment>)}</div>
    <span className="visual-caption">{project.name} <span aria-hidden="true">↗</span></span>
  </div>;
}

function ProjectDetail({ project }) {
  const { t } = useLanguage();
  return <div className="project-details"><dl>
    <div><dt>{t("Problem")}</dt><dd>{t(project.problem)}</dd></div>
    <div><dt>{t("What I built")}</dt><dd>{t(project.built)}</dd></div>
    <div><dt>{t("Technical challenge")}</dt><dd>{t(project.challenge)}</dd></div>
    <div><dt>{t("Delivery")}</dt><dd>{t(project.outcome)}</dd></div>
  </dl>{project.team && <p className="team-note">{t(project.team)}</p>}</div>;
}

export default function Portfolio({ concept = "mix" }) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const rootRef = useRef(null);
  useSectionMotion(rootRef);
  useGalaxyCamera(rootRef, theme);
  const [activeSection, setActiveSection] = useState('home');
  const [previewProject, setPreviewProject] = useState(null);
  useAgentPage({ page: 'portfolio', context: { route: '/', sectionId: activeSection, ...(previewProject ? { projectId: projectId(previewProject) } : {}) }, execute(action, beforeApply) {
    if (action.type === 'open_project') {
      const project = projects.find(item => projectId(item) === action.projectId);
      if (!project?.url) return false;
      beforeApply?.();
      setPreviewProject(project); return true;
    }
    const section = document.getElementById(action.sectionId);
    if (!section) return false;
    beforeApply?.();
    section.setAttribute('tabindex', '-1'); section.focus({ preventScroll: true }); section.scrollIntoView(); return true;
  } });
  useEffect(() => {
    const visibleSections = new Map();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visibleSections.set(entry.target.id, entry);
        else visibleSections.delete(entry.target.id);
      });
      const entry = [...visibleSections.values()].sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (entry) setActiveSection(entry.target.id);
    }, { rootMargin: '-15% 0px -45% 0px', threshold: [0, 0.2, 0.5] });
    document.querySelectorAll('[data-section]').forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    document.title = t('{{name}} — Fullstack Developer', { name: profile.name });
  }, [concept, language, t]);
  return <div ref={rootRef} className={`portfolio galaxy-portfolio ${concept === 'mix' ? 'concept-b concept-mix' : `concept-${concept}`}`}>
    <a className="skip-link" href="#main-content">{t("Skip to content")}</a>
    {concept === 'c' && <Suspense fallback={<div className="scene-fallback immersive-scene" aria-hidden="true" />}><ThreeScene concept={concept} section={activeSection} /></Suspense>}
    <SiteNavigation concept={concept} activeSection={activeSection} />
    <main id="main-content" tabIndex={-1}>
      <section className="hero content-width" id="home" data-section>
        <div className="hero-copy">
          <span className="eyebrow"><span className="status-dot" />{t("SOFTWARE DEVELOPER / PORTFOLIO")}</span>
          <h1>{profile.name}</h1>
          <p className="hero-statement">{t(profile.positioning)}</p>
          <p className="hero-description">{t(profile.introduction)}</p>
          <div className="hero-actions"><a className="button-primary" href="#work">{t("View my work")} <span aria-hidden="true">↗</span></a><a className="button-secondary" href="#contact">{t("Contact me")} <span aria-hidden="true">→</span></a></div>
          <p className="hero-stack">Power Platform / React / TypeScript / .NET</p>
        </div>
        {concept !== 'c' && <div className={concept === 'mix' ? 'mixed-hero-visual' : 'hero-visual'}><div className={concept === 'mix' ? 'hero-visual' : 'scene-container'}>
          <Suspense fallback={<div className="scene-fallback" aria-hidden="true" />}><ThreeScene concept={concept === 'mix' ? 'a' : concept} section={activeSection} /></Suspense>
          <div className="scene-caption"><span>{concept === 'a' || concept === 'mix' ? t('A LITTLE SPACE TO THINK.') : t('INTERFACE → LOGIC → DATA')}</span><span>{concept === 'a' || concept === 'mix' ? `${t(theme === 'light' ? 'SOLAR' : 'LUNAR')} / 01` : `${t('LAYERS')} / 02`}</span></div>
        </div>{concept === 'mix' && <QuoteRotator />}</div>}
        <div className="hero-bottom"><span>{t("Frontend craft. Fullstack perspective.")}</span><a href="#about">{t("Explore the portfolio")} <span aria-hidden="true">↓</span></a></div>
      </section>
      <section className="about-section content-width" id="about" data-section>
        <SectionHeading number="01" eyebrow="About" title="Built with care. Always learning." />
        <div className="about-body"><p className="about-intro">{t(profile.about)}</p><div className="about-facts"><p><span>{t("Focus")}</span>{t("Web applications · Product interfaces")}</p><p><span>{t("Education")}</span>{t(education.school)}<br />{t(education.description)}</p><p><span>{t("Communication")}</span>{t("English · Upper Intermediate")}</p></div></div>
      </section>
      {concept === 'mix' && <LayerStory />}
      <section className="work-section content-width" id="work" data-section>
        <SectionHeading number={concept === 'mix' ? '03' : '02'} eyebrow="Selected work" title="Real problems. Useful products." />
        <div className="projects-list">{projects.map((project, index) => <article className="project" key={project.name}>
          <ProjectVisual project={project} index={index} />
          <div className="project-copy"><span className="eyebrow">{t(project.category)}</span><h3>{project.name}</h3><p className="project-summary">{t(project.summary)}</p>
            {project.role && <p className="project-role">{t(project.role)}</p>}
            <ul className="tech-list" aria-label={t("Technologies")}>{project.technologies.map(tech => <li key={tech}>{tech}</li>)}</ul>
            {project.url && <div className="project-actions"><button className="button-primary" onClick={() => setPreviewProject(project)}>{t("Preview here")} <span aria-hidden="true">↗</span></button><a className="button-secondary" href={project.url} target="_blank" rel="noopener noreferrer">{t("Open in new tab")} <span aria-hidden="true">↗</span></a></div>}
            {concept === 'b' || concept === 'mix' ? <ProjectDetail project={project} /> : <details><summary>{t("Explore the project")} <span aria-hidden="true">+</span></summary><ProjectDetail project={project} /></details>}
          </div>
        </article>)}</div>
        <div className="work-note"><p>{t("Explore the live products here or open them in a new tab. Functional diagrams shown above; project descriptions are based on reviewed source.")}</p><a href={`${profile.github}?tab=repositories`} target="_blank" rel="noreferrer">{t("Explore my GitHub")} <span aria-hidden="true">↗</span></a></div>
      </section>
      <section className="experience-section content-width" id="experience" data-section>
        <SectionHeading number={concept === 'mix' ? '04' : '03'} eyebrow="Experience" title="The work behind the craft." />
        <ol className="experience-list" aria-label={t("Career timeline")}>{experience.map(job => {
          const current = job.dates.endsWith('Present');
          return <li className={`experience-item${current ? ' experience-item--current' : ''}`} key={job.company}>
            <p className="experience-date">{t(job.dates)}</p>
            <span className="timeline-marker" aria-hidden="true"><span /></span>
            <article className="experience-card">
              <div className="experience-card-heading"><h3>{job.company}</h3>{current && <span className="experience-current">{t("Current role")}</span>}</div>
              <p className="experience-role">{t(job.role)}</p><p>{t(job.description)}</p>
              <ul>{job.details.map(detail => <li key={detail}>{t(detail)}</li>)}</ul>
              <p className="experience-tech">{job.technologies}</p>
            </article>
          </li>;
        })}</ol>
        <div className="recognition"><span className="eyebrow">{t("Selected recognition")}</span>{achievements.map(award => <p key={award}>{t(award)}</p>)}</div>
      </section>
      {concept !== 'mix' && <section className="capabilities-section content-width" id="capabilities" data-section>
        <SectionHeading number="04" eyebrow="Capabilities" title="From interface to infrastructure." />
        <div className="capability-grid">{capabilities.map((capability, index) => <article key={capability.title}><span className="capability-index">0{index + 1}</span><h3>{t(capability.title)}</h3><p>{t(capability.description)}</p><p className="capability-items">{t(capability.items)}</p></article>)}</div>
      </section>}
      <section className="contact-section content-width" id="contact" data-section>
        <div className="contact-layout"><div className="contact-copy">
        <span className="eyebrow">{t("05 / Contact")}</span><h2>{t('Let’s build')}<br />{t('something useful')}<span>.</span></h2><p>{t("Have a project, an opportunity or an idea? Let’s talk.")}</p>
        <a className="button-primary" href={`mailto:${profile.email}`}>{t("Get in touch")} <span aria-hidden="true">↗</span></a>
        <div className="contact-links"><span>{profile.email}</span><a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a><a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a><a href={`tel:${profile.phone}`}>+84 764 420 250</a></div>
        </div><ContactForm /></div>
      </section>
    </main>
    <SiteFooter />
    <ProductPreview project={previewProject} onClose={() => setPreviewProject(null)} />
  </div>;
}
