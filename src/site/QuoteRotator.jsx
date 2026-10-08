import { useLanguage } from '../i18n/LanguageProvider';
import { useEffect, useMemo, useState } from 'react';
import quotes from '../data/quotes';

function TypedQuote({ quote }) {
  const [text, setText] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches ? quote.q : '');
  const [typing, setTyping] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches && quote.q.length > 0);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const characters = typeof Intl.Segmenter === 'function'
      ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(quote.q)].map(part => part.segment)
      : Array.from(quote.q);
    let timer, position = 0;
    const complete = () => { clearInterval(timer); setText(quote.q); setTyping(false); };
    if (!preference.matches && characters.length) {
      setText(''); setTyping(true);
      timer = setInterval(() => {
        position++; setText(characters.slice(0, position).join(''));
        if (position === characters.length) complete();
      }, Math.min(32, 2400 / characters.length));
    } else complete();
    const reduce = () => { if (preference.matches) complete(); };
    preference.addEventListener('change', reduce);
    return () => { clearInterval(timer); preference.removeEventListener('change', reduce); };
  }, [quote]);
  return <blockquote aria-label={quote.q} className={typing ? 'is-typing' : ''}>
    <p className="quote-text" aria-hidden="true">“{text}{!typing && '”'}{typing && <span className="quote-caret" />}</p>
    <cite style={{ visibility: typing ? 'hidden' : 'visible' }}>— {quote.a}</cite>
  </blockquote>;
}

// Reuse existing portfolio quotes; exclude the current item on every change.
export default function QuoteRotator() {
  const { t, language } = useLanguage();
  const [index, setIndex] = useState(() => Math.floor(Math.random() * quotes.length));
  const [playing, setPlaying] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [announcedIndex, setAnnouncedIndex] = useState(null);
  const quote = useMemo(() => ({ ...quotes[index], q: t(quotes[index].q), a: t(quotes[index].a) }), [index, language, t]);
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
    const timer = setTimeout(() => setIndex(nextIndex), 15000);
    return () => clearTimeout(timer);
  }, [playing, visible, index]);
  const next = () => {
    const selected = nextIndex(index);
    setIndex(selected);
    setAnnouncedIndex(selected);
  };
  return <div className="quote-rotator">
    <span className="eyebrow">{t("A LITTLE PERSPECTIVE")}</span>
    <TypedQuote key={index} quote={quote} />
    <div className="quote-controls"><span>{t(playing ? 'A new thought every 15 seconds' : 'Take your time')}</span>
      <button onClick={() => setPlaying(!playing)} aria-label={t(playing ? 'Pause quotes' : 'Play quotes')}>{t(playing ? 'Pause' : 'Play')}</button>
      <button onClick={next} aria-label={t("Next quote")}>{t("Next quote")} <span aria-hidden="true">↻</span></button>
    </div>
    <span className="sr-only" aria-live="polite">{announcedIndex !== null && `${t(quotes[announcedIndex].q)} — ${t(quotes[announcedIndex].a)}`} </span>
  </div>;
}
