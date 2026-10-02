import { useEffect, useState } from 'react';
import quotes from '../data/quotes';

// Reuse existing portfolio quotes; exclude the current item on every change.
export default function QuoteRotator() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * quotes.length));
  const [playing, setPlaying] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [announcement, setAnnouncement] = useState('');
  const nextIndex = current => (current + 1 + Math.floor(Math.random() * (quotes.length - 1))) % quotes.length;
  useEffect(() => {
    const visibility = () => setVisible(!document.hidden);
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const reduce = () => { if (preference.matches) setPlaying(false); };
    document.addEventListener('visibilitychange', visibility);
    preference.addEventListener('change', reduce);
    return () => { document.removeEventListener('visibilitychange', visibility); preference.removeEventListener('change', reduce); };
  }, []);
  useEffect(() => {
    if (!playing || !visible) return;
    const timer = setTimeout(() => setIndex(nextIndex), 8000);
    return () => clearTimeout(timer);
  }, [playing, visible, index]);
  const next = () => {
    const selected = nextIndex(index);
    setIndex(selected);
    setAnnouncement(`${quotes[selected].q} — ${quotes[selected].a}`);
  };
  return <div className="quote-rotator">
    <span className="eyebrow">A LITTLE PERSPECTIVE</span>
    <blockquote><p className="quote-text">“{quotes[index].q}”</p><cite>— {quotes[index].a}</cite></blockquote>
    <div className="quote-controls"><span>{playing ? 'A new thought every 8 seconds' : 'Take your time'}</span>
      <button onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause quotes' : 'Play quotes'}>{playing ? 'Pause' : 'Play'}</button>
      <button onClick={next} aria-label="Next quote">Next quote <span aria-hidden="true">↻</span></button>
    </div>
    <span className="sr-only" aria-live="polite">{announcement}</span>
  </div>;
}
