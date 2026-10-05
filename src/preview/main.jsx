import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { concepts } from '../site/content';
import Portfolio from '../site/Portfolio';
import Pages from '../site/Pages';
import '../site/site.css';
import '../site/theme.css';
import ThemeProvider from '../site/ThemeProvider';
const base = import.meta.env.BASE_URL;

function Preview() {
  const [concept, setConcept] = useState("mix");
  const [page, setPage] = useState('portfolio');
  const [width, setWidth] = useState("fluid");
  const [showNotes, setShowNotes] = useState(true);
  const notes = concepts[concept];
  return <div className="preview-shell">
    <div className="preview-toolbar">
      <div className="preview-brand"><strong>PORTFOLIO / DESIGN STUDY</strong><span>CV · 02.10.2026</span></div>
      <div className="preview-switch" role="group" aria-label="Design concept">
        {[['original', 'Original'], ['a', 'Concept A'], ['b', 'Concept B'], ['c', 'Concept C'], ['mix', 'Mixed preview']].map(([key, label]) =>
          <button key={key} aria-pressed={concept === key} onClick={() => setConcept(key)}>{label}</button>)}
      </div>
      {concept === 'mix' && <label className="viewport-control">Page <select value={page} onChange={event => setPage(event.target.value)}><option value="portfolio">Portfolio</option><option value="blogs">Blogs</option><option value="tools">Tools</option></select></label>}
      <label className="viewport-control">Viewport <select value={width} onChange={event => setWidth(event.target.value)}>
        <option value="fluid">Fit window</option><option value="1920">1920px</option><option value="1440">1440px</option>
        <option value="1280">1280px</option><option value="768">Tablet · 768px</option><option value="390">Mobile · 390px</option>
      </select></label>
      <button className="notes-toggle" lang="vi" aria-expanded={showNotes} onClick={() => setShowNotes(!showNotes)}>{showNotes ? 'Ẩn' : 'Xem'} ghi chú</button>
    </div>
    {showNotes && <aside className="preview-notes" lang="vi" aria-live="polite">
      {notes ? <><div><strong>{concept.toUpperCase()} / {notes.name}</strong><p>{notes.direction}</p></div>
        <div><b>Three.js</b><p>{notes.scene}</p><b>Mobile</b><p>{notes.mobile}</p></div>
        <div><b>Điểm mạnh / trade-off</b><p>{notes.strength} {notes.tradeoff}</p></div>
        <div><b>Performance · thay đổi {notes.change}</b><p>{notes.performance}</p><small>Components: {notes.components}</small></div></>
        : <><div><strong>Original / Trước redesign</strong><p>Giữ giao diện cũ để so sánh.</p></div><p>Mixed đã được áp dụng vào portfolio chính. A/B/C và bản cũ vẫn được giữ ở đây để tham khảo trong development.</p></>}
    </aside>}
    <div className="preview-stage">
      <iframe key={`${concept}-${page}`} title={`Portfolio preview — ${notes?.name || 'Original'}`} style={{ width: width === 'fluid' ? '100%' : `${width}px` }}
        src={concept === 'original' ? `${base}legacy-preview.html` : `${base}design-preview.html?frame=1&concept=${concept}&page=${page}`} />
    </div>
  </div>;
}

const params = new URLSearchParams(location.search);
const concept = Object.hasOwn(concepts, params.get('concept')) ? params.get('concept') : 'mix';
const page = concept === 'mix' && ['blogs', 'tools'].includes(params.get('page')) ? params.get('page') : 'portfolio';
createRoot(document.getElementById('root')).render(<React.StrictMode><ThemeProvider>{params.get('frame') === '1' ? (page === 'portfolio' ? <Portfolio concept={concept} /> : <Pages page={page} postSlug={params.get('post')} />) : <Preview />}</ThemeProvider></React.StrictMode>);
