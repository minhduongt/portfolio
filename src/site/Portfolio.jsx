import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import useSectionMotion from './useSectionMotion';
import useGalaxyCamera from './useGalaxyCamera';
import ContactForm from './ContactForm';
import { achievements, capabilities, experience, profile, projects } from './content';
import SiteNavigation, { SiteFooter } from './SiteNavigation';
import QuoteRotator from './QuoteRotator';
import LayerStory from './LayerStory';
import ProductPreview from './ProductPreview';
import { useTheme } from './ThemeProvider';
const ThreeScene = lazy(() => import('./ThreeScene'));

function SectionHeading({ number, eyebrow, title }) {
  return <div className="section-heading"><span className="eyebrow">{number} / {eyebrow}</span><h2>{title}</h2></div>;
}

function ProjectVisual({ project, index }) {
  return <div className={`project-visual visual-${project.accent}`} aria-label={`${project.name} — functional overview, not a screenshot`}>
    <span className="visual-label">{String(index + 1).padStart(2, '0')} / FUNCTIONAL OVERVIEW</span>
    <div className="diagram">{project.layers.map((layer, i) => <React.Fragment key={layer}>
      {i > 0 && <span className="diagram-connector" aria-hidden="true">↓</span>}<span className="diagram-layer">{layer}</span>
    </React.Fragment>)}</div>
    <span className="visual-caption">{project.name} <span aria-hidden="true">↗</span></span>
  </div>;
}

function ProjectDetail({ project }) {
  return <div className="project-details"><dl>
    <div><dt>Problem</dt><dd>{project.problem}</dd></div>
    <div><dt>What I built</dt><dd>{project.built}</dd></div>
    <div><dt>Technical challenge</dt><dd>{project.challenge}</dd></div>
    <div><dt>Delivery</dt><dd>{project.outcome}</dd></div>
  </dl>{project.team && <p className="team-note">{project.team}</p>}</div>;
}

export default function Portfolio({ concept = "mix" }) {
  const { theme } = useTheme();
  const rootRef = useRef(null);
  useSectionMotion(rootRef);
  useGalaxyCamera(rootRef, theme);
  const [activeSection, setActiveSection] = useState('home');
  const [previewProject, setPreviewProject] = useState(null);
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
    document.title = `${profile.name} — Fullstack Developer`;
  }, [concept]);
  return <div ref={rootRef} className={`portfolio galaxy-portfolio ${concept === 'mix' ? 'concept-b concept-mix' : `concept-${concept}`}`}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    {concept === 'c' && <Suspense fallback={<div className="scene-fallback immersive-scene" aria-hidden="true" />}><ThreeScene concept={concept} section={activeSection} /></Suspense>}
    <SiteNavigation concept={concept} activeSection={activeSection} />
    <main id="main-content" tabIndex={-1}>
      <section className="hero content-width" id="home" data-section>
        <div className="hero-copy">
          <span className="eyebrow"><span className="status-dot" /> SOFTWARE DEVELOPER / PORTFOLIO</span>
          <h1>{profile.name}</h1>
          <p className="hero-statement">{profile.positioning}</p>
          <p className="hero-description">{profile.introduction}</p>
          <div className="hero-actions"><a className="button-primary" href="#work">View my work <span aria-hidden="true">↗</span></a><a className="button-secondary" href="#contact">Contact me <span aria-hidden="true">→</span></a></div>
          <p className="hero-stack">Power Platform / React / TypeScript / .NET</p>
        </div>
        {concept !== 'c' && <div className={concept === 'mix' ? 'mixed-hero-visual' : 'hero-visual'}><div className={concept === 'mix' ? 'hero-visual' : 'scene-container'}>
          <Suspense fallback={<div className="scene-fallback" aria-hidden="true" />}><ThreeScene concept={concept === 'mix' ? 'a' : concept} section={activeSection} /></Suspense>
          <div className="scene-caption"><span>{concept === 'a' || concept === 'mix' ? 'A LITTLE SPACE TO THINK.' : 'INTERFACE → LOGIC → DATA'}</span><span>{concept === 'a' || concept === 'mix' ? `${theme === 'light' ? 'SOLAR' : 'LUNAR'} / 01` : 'LAYERS / 02'}</span></div>
        </div>{concept === 'mix' && <QuoteRotator />}</div>}
        <div className="hero-bottom"><span>Frontend craft. Fullstack perspective.</span><a href="#about">Explore the portfolio <span aria-hidden="true">↓</span></a></div>
      </section>
      <section className="about-section content-width" id="about" data-section>
        <SectionHeading number="01" eyebrow="About" title="Built with care. Always learning." />
        <div className="about-body"><p className="about-intro">{profile.about}</p><div className="about-facts"><p><span>Focus</span>Web applications · Product interfaces</p><p><span>Education</span>FPT University — HCM City<br />Software Engineering · 2019–2023</p><p><span>Communication</span>English · Upper Intermediate</p></div></div>
      </section>
      {concept === 'mix' && <LayerStory />}
      <section className="work-section content-width" id="work" data-section>
        <SectionHeading number={concept === 'mix' ? '03' : '02'} eyebrow="Selected work" title="Real problems. Useful products." />
        <div className="projects-list">{projects.map((project, index) => <article className="project" key={project.name}>
          <ProjectVisual project={project} index={index} />
          <div className="project-copy"><span className="eyebrow">{project.category}</span><h3>{project.name}</h3><p className="project-summary">{project.summary}</p>
            {project.role && <p className="project-role">{project.role}</p>}
            <ul className="tech-list" aria-label="Technologies">{project.technologies.map(tech => <li key={tech}>{tech}</li>)}</ul>
            {project.url && <div className="project-actions"><button className="button-primary" onClick={() => setPreviewProject(project)}>Preview here <span aria-hidden="true">↗</span></button><a className="button-secondary" href={project.url} target="_blank" rel="noopener noreferrer">Open in new tab <span aria-hidden="true">↗</span></a></div>}
            {concept === 'b' || concept === 'mix' ? <ProjectDetail project={project} /> : <details><summary>Explore the project <span aria-hidden="true">+</span></summary><ProjectDetail project={project} /></details>}
          </div>
        </article>)}</div>
        <div className="work-note"><p>Explore the live products here or open them in a new tab. Functional diagrams shown above; project descriptions are based on reviewed source.</p><a href={`${profile.github}?tab=repositories`} target="_blank" rel="noreferrer">Explore my GitHub <span aria-hidden="true">↗</span></a></div>
      </section>
      <section className="experience-section content-width" id="experience" data-section>
        <SectionHeading number={concept === 'mix' ? '04' : '03'} eyebrow="Experience" title="The work behind the craft." />
        <ol className="experience-list" aria-label="Career timeline">{experience.map(job => {
          const current = job.dates.endsWith('Present');
          return <li className={`experience-item${current ? ' experience-item--current' : ''}`} key={job.company}>
            <p className="experience-date">{job.dates}</p>
            <span className="timeline-marker" aria-hidden="true"><span /></span>
            <article className="experience-card">
              <div className="experience-card-heading"><h3>{job.company}</h3>{current && <span className="experience-current">Current role</span>}</div>
              <p className="experience-role">{job.role}</p><p>{job.description}</p>
              <ul>{job.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
              <p className="experience-tech">{job.technologies}</p>
            </article>
          </li>;
        })}</ol>
        <div className="recognition"><span className="eyebrow">Selected recognition</span>{achievements.map(award => <p key={award}>{award}</p>)}</div>
      </section>
      {concept !== 'mix' && <section className="capabilities-section content-width" id="capabilities" data-section>
        <SectionHeading number="04" eyebrow="Capabilities" title="From interface to infrastructure." />
        <div className="capability-grid">{capabilities.map((capability, index) => <article key={capability.title}><span className="capability-index">0{index + 1}</span><h3>{capability.title}</h3><p>{capability.description}</p><p className="capability-items">{capability.items}</p></article>)}</div>
      </section>}
      <section className="contact-section content-width" id="contact" data-section>
        <div className="contact-layout"><div className="contact-copy">
        <span className="eyebrow">05 / Contact</span><h2>Let’s build<br />something useful<span>.</span></h2><p>Have a project, an opportunity or an idea? Let’s talk.</p>
        <a className="button-primary" href={`mailto:${profile.email}`}>Get in touch <span aria-hidden="true">↗</span></a>
        <div className="contact-links"><span>{profile.email}</span><a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a><a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a><a href={`tel:${profile.phone}`}>+84 764 420 250</a></div>
        </div><ContactForm /></div>
      </section>
    </main>
    <SiteFooter />
    <ProductPreview project={previewProject} onClose={() => setPreviewProject(null)} />
  </div>;
}
