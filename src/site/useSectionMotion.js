import { useEffect } from 'react';

export default function useSectionMotion(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const targets = [...root.querySelectorAll('.hero-copy > *, .mixed-hero-visual, .hero-bottom, .section-heading, .about-body, .project, .experience-item, .recognition, .contact-section > *')];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) { target.classList.add('has-entered'); observer.unobserve(target); }
      });
    }, { rootMargin: '0px 0px -30px 0px', threshold: 0 });
    targets.forEach((target, index) => {
      target.style.setProperty('--entry-delay', `${target.parentElement.classList.contains('hero-copy') ? index * 65 : 0}ms`);
      target.classList.add('motion-entry');
      if (media.matches) target.classList.add('has-entered');
      else observer.observe(target);
    });
    const show = () => targets.forEach(target => target.classList.add('has-entered'));
    const focus = event => event.target.closest('.motion-entry')?.classList.add('has-entered');
    media.addEventListener('change', show); root.addEventListener('focusin', focus);
    return () => { observer.disconnect(); media.removeEventListener('change', show); root.removeEventListener('focusin', focus); targets.forEach(target => { target.classList.remove('motion-entry', 'has-entered'); target.style.removeProperty('--entry-delay'); }); };
  }, [rootRef]);
}
