import { useState } from 'react';
import resume from '../docs/DuongTanMinh_CV.pdf?url';
import { useSession } from './AuthProvider';

export function siteLink(page = 'portfolio', post) {
  if (!location.pathname.includes('design-preview')) {
    return `${import.meta.env.BASE_URL}${page === 'portfolio' ? '#home' : `#/${page}${post ? `/${encodeURIComponent(post)}` : ''}`}`;
  }
  const params = new URLSearchParams({ frame: '1', concept: 'mix', page });
  if (post) params.set('post', post);
  return `${import.meta.env.BASE_URL}design-preview.html?${params}`;
}

export default function SiteNavigation({ concept, page = 'portfolio', activeSection }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const session = useSession();
  const mixed = concept === 'mix';
  return <nav className="site-nav" aria-label="Main navigation">
    <a className="wordmark" href={page === 'portfolio' ? '#home' : siteLink()}>
      md<span className="wordmark-dot">.</span><span className="wordmark-name">Minh Duong</span>
    </a>
    <button className="menu-button" aria-expanded={menuOpen} aria-controls="site-links" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close' : 'Menu'}</button>
    <div id="site-links" className={`site-links ${menuOpen ? 'is-open' : ''}`}>
      {(page === 'portfolio' ? [['about', 'About'], ['work', 'Work'], ['experience', 'Experience'], ['contact', 'Contact']] : [['home', 'Portfolio']]).map(([id, label]) =>
        <a key={id} href={page === 'portfolio' ? `#${id}` : siteLink()} aria-current={activeSection === id ? 'location' : undefined} onClick={() => setMenuOpen(false)}>{label}</a>)}
      {mixed && ['blogs', 'tools'].map(destination => <a key={destination} href={siteLink(destination)} aria-current={page === destination ? 'page' : undefined} onClick={() => setMenuOpen(false)}>{destination === 'blogs' ? 'Blogs' : 'Tools'}</a>)}
      {mixed && !location.pathname.includes('design-preview') && <a href={siteLink(session.isAdmin ? 'admin' : 'login')} onClick={() => setMenuOpen(false)}>{session.isAdmin ? 'Admin' : session.user ? 'Account' : 'Sign in'}</a>}
    </div>
    <a className="resume-link" href={resume} download="DuongTanMinh_CV.pdf">Resume <span aria-hidden="true">↓</span></a>
  </nav>;
}

export function SiteFooter() {
  return <footer className="site-footer content-width"><span>© 2026 Duong Tan Minh</span><span>Built with React + Three.js</span><a href="#home">Back to top ↑</a></footer>;
}
