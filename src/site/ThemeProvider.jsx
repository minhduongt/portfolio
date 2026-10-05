import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'dark', toggleTheme() {} });
const storageKey = 'portfolio.theme';
function savedTheme() {
  try { const value = localStorage.getItem(storageKey); return ['light', 'dark'].includes(value) ? value : null; }
  catch { return null; }
}
function systemTheme() { return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; }

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => savedTheme() || systemTheme());
  const [manual, setManual] = useState(() => Boolean(savedTheme()));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#faf7ef' : '#101716');
  }, [theme]);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: light)');
    const updateSystem = () => { if (!manual) setTheme(systemTheme()); };
    const updateStorage = event => {
      if (event.key !== storageKey && event.key !== null) return;
      const saved = savedTheme();
      setManual(Boolean(saved));
      setTheme(saved || systemTheme());
    };
    media.addEventListener('change', updateSystem);
    window.addEventListener('storage', updateStorage);
    return () => { media.removeEventListener('change', updateSystem); window.removeEventListener('storage', updateStorage); };
  }, [manual]);
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setManual(true);
    setTheme(next);
    try { localStorage.setItem(storageKey, next); } catch { /* Keep the choice for this tab when storage is unavailable. */ }
  };
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
export function useTheme() { return useContext(ThemeContext); }
