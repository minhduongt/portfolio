import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function TypingReply({ content, open, log }) {
  const [length, setLength] = useState(0);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const finished = useRef(false);
  const characters = Array.from(content);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!open || reduced) { finished.current = true; setLength(characters.length); return; }
    if (finished.current) return;
    const start = performance.now(), duration = Math.min(4000, characters.length * 18);
    const timer = setInterval(() => {
      const next = Math.min(characters.length, Math.ceil((performance.now() - start) / Math.max(1, duration) * characters.length));
      setLength(next);
      if (next === characters.length) { finished.current = true; clearInterval(timer); }
    }, 24);
    return () => clearInterval(timer);
  }, [content, open, reduced]);
  const complete = !open || reduced || length >= characters.length;
  useLayoutEffect(() => {
    const container = log.current;
    if (open && container && container.scrollHeight - container.clientHeight - container.scrollTop < 80) container.scrollTop = container.scrollHeight;
  }, [length, open, log]);
  // Announce the complete reply once, never each animated fragment.
  return <><span className="sr-only">{content}</span><p className={complete ? undefined : 'agent-reply--typing'} aria-hidden="true">{complete ? content : characters.slice(0, length).join('')}</p></>;
}
