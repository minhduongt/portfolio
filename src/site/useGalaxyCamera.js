import { useEffect } from 'react';

export default function useGalaxyCamera(rootRef, theme) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || theme !== 'dark') return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      frame = 0;
      if (reduced.matches) { root.style.removeProperty('--galaxy-camera'); return; }
      const bounds = root.getBoundingClientRect();
      const distance = Math.max(1, bounds.height - innerHeight);
      const progress = Math.max(0, Math.min(1, -bounds.top / distance));
      root.style.setProperty('--galaxy-camera', `translate3d(${(-16 + progress * 32).toFixed(3)}vw, 0, 0) scale(1.5)`);
    };
    const schedule = () => { if (!document.hidden && !frame) frame = requestAnimationFrame(update); };
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else schedule();
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reduced.addEventListener('change', schedule);
    document.addEventListener('visibilitychange', visibility);
    update();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      reduced.removeEventListener('change', schedule);
      document.removeEventListener('visibilitychange', visibility);
      root.style.removeProperty('--galaxy-camera');
    };
  }, [rootRef, theme]);
}
