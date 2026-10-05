import { useEffect, useRef, useState } from 'react';
import { createEmailBlock, emailAssetUrl, emailBlockTypes, emailFonts, moveEmailBlock } from './emailDesign';

function BlockContent({ block, remoteImages }) {
  if (block.type === 'heading') return <h1 style={{ margin: 0, fontSize: Number(block.fontSize) || 30, fontWeight: block.bold ? 'bold' : 'normal', lineHeight: 1.3 }}>{block.text || 'Heading'}</h1>;
  if (block.type === 'text') return <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{block.text || 'Your text goes here.'}</p>;
  if (block.type === 'button') return <span className="email-canvas-button" style={{ background: block.buttonColor, borderRadius: Number(block.radius) || 0 }}>{block.text || 'Button'}</span>;
  if (block.type === 'divider') return <div style={{ height: Number(block.thickness) || 1, background: block.lineColor }} />;
  if (block.type === 'spacer') return <div className="email-canvas-spacer" style={{ height: Number(block.height) || 32 }}><span>{block.height}px spacer</span></div>;
  if (block.type === 'image') {
    let src;
    try { if (block.src) src = emailAssetUrl(block.src, true); } catch { /* Properties report invalid URLs; never load them. */ }
    return src && (src.startsWith('data:') || remoteImages) ? <img src={src} alt={block.alt} style={{ width: `${Number(block.width) || 100}%`, maxWidth: '100%', height: 'auto' }} draggable={false} /> : <div className="email-canvas-image"><span aria-hidden="true">▧</span><strong>{block.alt || 'Image block'}</strong><small>{src ? 'Enable external images to load this image.' : 'Add an image URL or upload an image in Properties.'}</small></div>;
  }
  if (block.type === 'table') return <table className="email-canvas-table"><tbody>{block.rows.map((row, index) => <tr key={index}><td>{row.label}</td><td>{row.value}</td></tr>)}</tbody></table>;
  if (block.type === 'columns') return <div className="email-canvas-columns">{[['leftTitle', 'leftText'], ['rightTitle', 'rightText']].map(([title, text]) => <div key={title}><strong>{block[title]}</strong><p style={{ whiteSpace: 'pre-wrap' }}>{block[text]}</p></div>)}</div>;
  return null;
}

export default function VisualEmailEditor({ design, onChange, viewport, remoteImages }) {
  const [selectedId, setSelectedId] = useState(design.blocks[0]?.id);
  const [dropAt, setDropAt] = useState(null), [notice, setNotice] = useState(''), [uploadError, setUploadError] = useState('');
  const uploadVersion = useRef(0);
  const endDrag = () => setDropAt(null);
  const beginDrag = (event, payload, effect) => {
    event.dataTransfer.setData('application/x-email-block', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = effect;
  };
  useEffect(() => {
    // Instant editor scrolling keeps the intended block under the pointer before dragstart.
    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    return () => { document.documentElement.style.scrollBehavior = previous; };
  }, []);
  const selected = design.blocks.find(block => block.id === selectedId) || design.blocks[0];
  const update = (id, changes) => onChange(previous => ({ ...previous, blocks: previous.blocks.map(block => block.id === id ? { ...block, ...changes } : block) }));
  const add = (type, index = design.blocks.length) => {
    if (design.blocks.length >= 100) { setNotice('The design already contains 100 blocks.'); return; }
    const block = createEmailBlock(type);
    onChange(previous => ({ ...previous, blocks: [...previous.blocks.slice(0, index), block, ...previous.blocks.slice(index)] }));
    setSelectedId(block.id); setNotice(`${emailBlockTypes[type].label} block added.`);
  };
  const move = (block, target) => { onChange(previous => ({ ...previous, blocks: moveEmailBlock(previous.blocks, block.id, target) })); setNotice(`${emailBlockTypes[block.type].label} block moved.`); };
  const drop = (event, index) => {
    event.preventDefault(); event.stopPropagation(); endDrag();
    try {
      const payload = JSON.parse(event.dataTransfer.getData('application/x-email-block'));
      if (payload.kind === 'add' && Object.hasOwn(emailBlockTypes, payload.type)) add(payload.type, index);
      if (payload.kind === 'move') {
        const origin = design.blocks.findIndex(block => block.id === payload.id);
        if (origin >= 0) move(design.blocks[origin], origin < index ? index - 1 : index);
      }
    } catch { /* Only our own block payloads are accepted. */ }
  };
  const dropZone = index => <div key={`drop-${index}`} className={`email-drop-zone${dropAt === index ? ' is-over' : ''}`} aria-hidden="true" onDragOver={event => {
    if (Array.from(event.dataTransfer.types).includes('application/x-email-block')) { event.preventDefault(); setDropAt(index); }
  }} onDragLeave={() => setDropAt(null)} onDrop={event => drop(event, index)}><span>Drop block here</span></div>;
  const property = (key, label, type = 'text', minimum, maximum) => <label className="utility-field" key={key}>{label}<input aria-label={label} type={type} min={minimum} max={maximum} maxLength={key === 'src' ? 110000 : 1000} value={selected[key] ?? ''} onChange={event => { if (key === 'src') uploadVersion.current++; update(selected.id, { [key]: event.target.value }); }} /></label>;
  const paragraph = (key, label) => <label className="utility-field" key={key}>{label}<textarea aria-label={label} maxLength={10000} value={selected[key] || ''} onChange={event => update(selected.id, { [key]: event.target.value })} /></label>;
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    const job = ++uploadVersion.current, id = selected.id;
    setUploadError('');
    try {
      if (file.size > 80000) throw new Error('Use an image under 80 KB to keep the email HTML compact.');
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mime = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 ? 'image/png'
        : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? 'image/jpeg'
          : String.fromCharCode(...bytes.slice(0, 6)).match(/^GIF8[79]a$/u) ? 'image/gif'
            : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP' ? 'image/webp' : null;
      if (!mime) throw new Error('Choose a PNG, JPEG, GIF or WebP image.');
      const reader = new FileReader();
      const src = await new Promise((resolve, reject) => { reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Could not read this image.')); reader.readAsDataURL(new Blob([bytes], { type: mime })); });
      if (job === uploadVersion.current) onChange(previous => previous.blocks.some(block => block.id === id) ? { ...previous, blocks: previous.blocks.map(block => block.id === id ? { ...block, src } : block) } : previous);
    } catch (error) { if (job === uploadVersion.current) setUploadError(error.message); }
  };
  return <div className="email-visual-builder"><div className="email-visual-layout">
    <aside className="email-block-library" aria-label="Email components"><span className="eyebrow">BUILDING BLOCKS</span><h3>Components</h3><p>Drag to the canvas or click to add.</p><div className="email-block-palette">{Object.entries(emailBlockTypes).map(([type, item]) => <button className="email-palette-block" key={type} draggable onClick={() => add(type)} onDragStart={event => beginDrag(event, { kind: 'add', type }, 'copy')} onDragEnd={endDrag} aria-label={`Add ${item.label} block`}><span aria-hidden="true">{item.icon}</span><strong>{item.label}</strong><small>{item.description}</small></button>)}</div></aside>
    <div className="email-canvas-stage" style={{ background: design.background }} onDragOver={event => { if (Array.from(event.dataTransfer.types).includes('application/x-email-block')) event.preventDefault(); }} onDrop={event => drop(event, design.blocks.length)}><div className="email-design-canvas" aria-label="Email design canvas" style={{ width: viewport === 'mobile' ? 375 : 600, fontFamily: `${design.font}, ${design.font === 'Georgia' ? 'serif' : 'sans-serif'}` }}>
      {dropZone(0)}{!design.blocks.length && <div className="email-empty-canvas"><h3>A blank canvas.</h3><p>Add a component to start your email.</p></div>}
      {design.blocks.map((block, index) => <div key={block.id} className={`email-block-wrapper${selected?.id === block.id ? ' is-selected' : ''}`} onDragOver={event => {
        if (!Array.from(event.dataTransfer.types).includes('application/x-email-block') || event.target.closest('.email-drop-zone')) return;
        event.preventDefault(); event.stopPropagation();
        const bounds = event.currentTarget.getBoundingClientRect();
        setDropAt(event.clientY < bounds.top + bounds.height / 2 ? index : index + 1);
      }} onDrop={event => { const bounds = event.currentTarget.getBoundingClientRect(); drop(event, event.clientY < bounds.top + bounds.height / 2 ? index : index + 1); }}>
        {selected?.id === block.id && <div className="email-block-actions"><span>{emailBlockTypes[block.type].label}</span><button disabled={index === 0} aria-label="Move block up" onClick={() => move(block, index - 1)}>↑</button><button disabled={index === design.blocks.length - 1} aria-label="Move block down" onClick={() => move(block, index + 1)}>↓</button><button aria-label="Duplicate block" disabled={design.blocks.length >= 100} onClick={() => { const copy = { ...block, id: crypto.randomUUID(), ...(block.rows ? { rows: block.rows.map(row => ({ ...row })) } : {}) }; onChange(previous => ({ ...previous, blocks: [...previous.blocks.slice(0, index + 1), copy, ...previous.blocks.slice(index + 1)] })); setSelectedId(copy.id); setNotice('Block duplicated.'); }}>⧉</button><button aria-label="Remove block" onClick={() => { onChange(previous => ({ ...previous, blocks: previous.blocks.filter(item => item.id !== block.id) })); setSelectedId(design.blocks[index + 1]?.id || design.blocks[index - 1]?.id); setNotice('Block removed.'); }}>×</button></div>}
        <div className="email-design-block" role="button" tabIndex={0} aria-label={`Select ${emailBlockTypes[block.type].label} block ${index + 1}`} aria-pressed={selected?.id === block.id} draggable onClick={() => { setSelectedId(block.id); setUploadError(''); }} onKeyDown={event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); setSelectedId(block.id); setUploadError(''); } }} onDragStart={event => beginDrag(event, { kind: 'move', id: block.id }, 'move')} onDragEnd={endDrag} style={{ padding: Math.max(0, Number(block.padding) || 0), background: block.background, color: block.color, textAlign: block.align, fontSize: Number(block.fontSize) || 16, fontWeight: block.bold ? 'bold' : 'normal', lineHeight: 1.6 }}><BlockContent block={block} remoteImages={remoteImages} /></div>
        {dropZone(index + 1)}
      </div>)}
    </div></div>
    <aside className="email-properties" aria-label="Email properties"><span className="eyebrow">MAKE IT YOURS</span><h3>Properties</h3><details className="email-document-settings"><summary>Email settings</summary><label className="utility-field">Document title<input maxLength={1000} value={design.subject} onChange={event => onChange(previous => ({ ...previous, subject: event.target.value }))} /></label><label className="utility-field">Email background<input type="color" value={design.background} onChange={event => onChange(previous => ({ ...previous, background: event.target.value }))} /></label><label className="utility-field">Email font<select value={design.font} onChange={event => onChange(previous => ({ ...previous, font: event.target.value }))}>{emailFonts.map(font => <option key={font}>{font}</option>)}</select></label></details>
      {!selected ? <p>Select a block to customize it.</p> : <><h4>{emailBlockTypes[selected.type].label} properties</h4>
        {['heading', 'text', 'button'].includes(selected.type) && paragraph('text', selected.type === 'button' ? 'Button label' : 'Text content')}
        {selected.type === 'button' && <>{property('url', 'Button link')}{property('buttonColor', 'Button background', 'color')}{property('radius', 'Corner radius (px)', 'number', 0, 32)}</>}
        {selected.type === 'image' && <>{property('src', 'Image URL')}{property('alt', 'Image description')}{property('width', 'Image width (%)', 'number', 10, 100)}<label className="utility-field">Upload image<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={upload} /></label><p className="mock-note">PNG, JPEG, GIF or WebP · up to 80 KB. Uploaded images are embedded in the HTML.</p>{uploadError && <p className="tool-error" role="alert">{uploadError}</p>}</>}
        {selected.type === 'divider' && <>{property('lineColor', 'Line color', 'color')}{property('thickness', 'Line thickness (px)', 'number', 1, 8)}</>}
        {selected.type === 'spacer' && property('height', 'Spacer height (px)', 'number', 8, 200)}
        {selected.type === 'columns' && <>{property('leftTitle', 'Left column heading')}{paragraph('leftText', 'Left column text')}{property('rightTitle', 'Right column heading')}{paragraph('rightText', 'Right column text')}</>}
        {selected.type === 'table' && <div className="email-row-properties">{selected.rows.map((row, index) => <div key={index}><label className="utility-field">Row {index + 1} label<input maxLength={1000} value={row.label} onChange={event => update(selected.id, { rows: selected.rows.map((item, i) => i === index ? { ...item, label: event.target.value } : item) })} /></label><label className="utility-field">Row {index + 1} value<input maxLength={1000} value={row.value} onChange={event => update(selected.id, { rows: selected.rows.map((item, i) => i === index ? { ...item, value: event.target.value } : item) })} /></label><button className="copy-button" disabled={selected.rows.length === 1} onClick={() => update(selected.id, { rows: selected.rows.filter((_item, i) => i !== index) })}>Remove row {index + 1}</button></div>)}<button className="copy-button" disabled={selected.rows.length >= 20} onClick={() => update(selected.id, { rows: [...selected.rows, { label: 'Item', value: 'Details' }] })}>Add table row</button></div>}
        <div className="email-property-divider" />
        {property('background', 'Section background', 'color')}{property('padding', 'Section padding (px)', 'number', 0, 64)}
        <label className="utility-field">Alignment<select aria-label="Alignment" value={selected.align} onChange={event => update(selected.id, { align: event.target.value })}>{['left', 'center', 'right'].map(value => <option key={value}>{value}</option>)}</select></label>
        {!['image', 'divider', 'spacer'].includes(selected.type) && <>{property('color', 'Text color', 'color')}{property('fontSize', 'Font size (px)', 'number', 10, 64)}<label className="email-checkbox"><input type="checkbox" checked={selected.bold} onChange={event => update(selected.id, { bold: event.target.checked })} />Bold text</label></>}
      </>}
    </aside>
  </div><p className="email-editor-status" role="status">{notice || 'Select a block to edit. Use the arrow buttons to reorder without dragging.'}</p></div>;
}
