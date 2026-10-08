import { useEffect, useRef, useState } from 'react';
import resume from '../docs/DuongTanMinh_CV.pdf?url';
import { useSession } from './AuthProvider';
import VisitorStats from './VisitorStats';
import ThemeToggle from './ThemeToggle';
import { useLanguage } from '../i18n/LanguageProvider';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

export function siteLink(page = 'portfolio', post) {
  if (!location.pathname.includes('design-preview')) {
    return `${import.meta.env.BASE_URL}${page === 'portfolio' ? '' : `${page}${post ? `/${encodeURIComponent(post)}` : ''}`}`;
  }
  const params = new URLSearchParams({ frame: '1', concept: 'mix', page });
  if (post) params.set('post', post);
  return `${import.meta.env.BASE_URL}design-preview.html?${params}`;
}

function NavigationLabel({ children }) {
  return <><svg className="nav-orbit" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <ellipse className="nav-orbit-outline" cx="50" cy="20" rx="46" ry="15" pathLength="100" />
    <ellipse className="nav-orbit-trace" cx="50" cy="20" rx="46" ry="15" pathLength="100" />
  </svg><span className="nav-link-label">{children}</span></>;
}

export default function SiteNavigation({ concept, page = 'portfolio', activeSection }) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 900px)').matches);
  const navRef = useRef(null), menuRef = useRef(null);
  useEffect(() => {
    const media = matchMedia('(max-width: 900px)');
    const resize = () => { setMobile(media.matches); setMenuOpen(false); };
    const scroll = () => setScrolled(window.scrollY > 24);
    const dismiss = event => {
      if (menuOpen && event.type === 'keydown' && event.key === 'Escape') { setMenuOpen(false); menuRef.current?.focus(); }
      if (event.type === 'pointerdown' && !navRef.current?.contains(event.target)) setMenuOpen(false);
    };
    scroll(); media.addEventListener('change', resize);
    window.addEventListener('scroll', scroll, { passive: true });
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => { media.removeEventListener('change', resize); window.removeEventListener('scroll', scroll); document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', dismiss); };
  }, [menuOpen]);
  const session = useSession();
  const mixed = concept === 'mix';
  return <nav ref={navRef} className={`site-nav${scrolled ? ' is-scrolled' : ''}${menuOpen ? ' menu-is-open' : ''}`} aria-label={t('Main navigation')}>
    <a className="wordmark" href={page === 'portfolio' ? '#home' : siteLink()}>
      md<span className="wordmark-dot">.</span><span className="wordmark-name">Minh Duong</span>
    </a>
    <button ref={menuRef} className="menu-button" aria-expanded={menuOpen} aria-controls="site-links" onClick={() => setMenuOpen(!menuOpen)}><span className="menu-orbit" aria-hidden="true"><span /><span /></span>{t(menuOpen ? 'Close' : 'Menu')}</button>
    <div className={`nav-menu${menuOpen ? ' is-open' : ''}`} inert={mobile && !menuOpen ? '' : undefined}>
    <div id="site-links" className={`site-links ${menuOpen ? 'is-open' : ''}`}>
      <div className="nav-group nav-group--portfolio" role="group" aria-label={t('Portfolio')}><span className="nav-group-label" aria-hidden="true">{t('PORTFOLIO')}</span>
      {(page === 'portfolio' ? [['about', 'About'], ['work', 'Work'], ['experience', 'Experience'], ['contact', 'Contact']] : [['home', 'Portfolio']]).map(([id, label]) =>
        <a key={id} href={page === 'portfolio' ? `#${id}` : siteLink()} aria-current={activeSection === id ? 'location' : undefined} onClick={() => setMenuOpen(false)}><NavigationLabel>{t(label)}</NavigationLabel></a>)}
      </div>
      {mixed && <div className="nav-group nav-group--explore" role="group" aria-label={t('Explore')}><span className="nav-group-label" aria-hidden="true">{t('EXPLORE')}</span>{['blogs', 'tools'].map(destination => <a key={destination} href={siteLink(destination)} aria-current={page === destination ? 'page' : undefined} onClick={() => setMenuOpen(false)}><NavigationLabel>{t(destination === 'blogs' ? 'Blogs' : 'Tools')}</NavigationLabel></a>)}
      {mixed && !location.pathname.includes('design-preview') && <a href={siteLink(session.isAdmin ? 'admin' : 'login')} aria-current={['admin', 'login'].includes(page) ? 'page' : undefined} onClick={() => setMenuOpen(false)}><NavigationLabel>{t(session.isAdmin ? 'Admin' : session.user ? 'Account' : 'Sign in')}</NavigationLabel></a>}
      </div>}
    </div>
    </div>
    <div className="nav-actions"><LanguageSwitcher /><ThemeToggle /><a className="resume-link" href={resume} download="DuongTanMinh_CV.pdf" aria-label={t('Download CV')}>CV <span aria-hidden="true">↓</span></a></div>
  </nav>;
}

export function SiteFooter() {
  const { t } = useLanguage();
  return <footer className="site-footer content-width"><div className="footer-summary"><span>© 2026 Duong Tan Minh</span><span>{t('Built with React + Three.js')}</span></div><VisitorStats /><a href="#home">{t('Back to top ↑')}</a></footer>;
}
