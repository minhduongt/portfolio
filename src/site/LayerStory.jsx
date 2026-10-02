import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { capabilities } from './content';

const ThreeScene = lazy(() => import('./ThreeScene'));

export default function LayerStory() {
  const root = useRef(null);
  const chapters = useRef([]);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const element = root.current;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const value = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)));
      setProgress(value);
      setActive(Math.min(2, Math.floor(value * 3)));
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    addEventListener('scroll', scroll, { passive: true });
    addEventListener('resize', scroll);
    update();
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', scroll); removeEventListener('resize', scroll); };
  }, []);
  const choose = index => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || innerWidth <= 700) {
      chapters.current[index].scrollIntoView({ behavior: 'auto', block: 'center' });
    } else {
      const rect = root.current.getBoundingClientRect();
      const span = Math.max(1, rect.height - innerHeight);
      window.scrollTo({ top: scrollY + rect.top + span * ((index + 0.4) / 3), behavior: 'smooth' });
    }
  };
  return <section className="layer-story content-width" id="layers" ref={root} data-section>
    <div className="layer-stage">
      <div className="section-heading"><span className="eyebrow">02 / HOW I BUILD</span><h2>One product.<br />Three connected layers.</h2><p className="layer-introduction">Scroll to unpack the craft — from the interface to deployment.</p></div>
      <div className="layer-scene"><Suspense fallback={<div className="scene-fallback" />}><ThreeScene concept="layers" progress={progress} /></Suspense>
        <span className="scene-caption">INTERFACE → LOGIC → DELIVERY</span>
      </div>
      <div className="layer-selectors" role="group" aria-label="Explore a product layer">{capabilities.map((item, index) =>
        <button key={item.title} onClick={() => choose(index)} aria-pressed={active === index}><span>0{index + 1}</span>{item.title}</button>)}</div>
    </div>
    <div className="layer-chapters">{capabilities.map((item, index) => <article className={`layer-step ${active === index ? 'is-active' : ''}`} ref={element => { chapters.current[index] = element; }} key={item.title}>
      <span className="eyebrow">LAYER 0{index + 1}</span><h3>{item.title}</h3><p className="layer-description">{item.description}</p><p>{item.items}</p>
      <div className="layer-example"><span className="eyebrow">IN PRACTICE / PHUONGNAMCOMPANY</span><p>{[
        'A responsive React and TypeScript interface with ShadcnUI, a PWA experience and web push notifications.',
        'Strapi REST APIs and PostgreSQL connect authentication, task operations, warehouse and material management.',
        'GitHub Actions, Docker, Ubuntu and Nginx take the application from development to deployment.',
      ][index]}</p></div>
    </article>)}</div>
  </section>;
}
