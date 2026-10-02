import { useEffect, useRef, useState } from 'react';
import { colorValues, formatPowerFx } from './toolLogic';

function CopyButton({ value }) {
  const [status, setStatus] = useState('');
  useEffect(() => setStatus(''), [value]);
  return <><button className="copy-button" disabled={!value} onClick={async () => {
    try { await navigator.clipboard.writeText(value); setStatus('Copied'); }
    catch { setStatus('Select the value and copy it manually.'); }
  }}>{status === 'Copied' ? 'Copied' : 'Copy output'}</button><span className="copy-status" role="status">{status}</span></>;
}

function PowerFx() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [locale, setLocale] = useState('dot');
  const [error, setError] = useState('');
  const reset = () => { setOutput(''); setError(''); };
  return <>
    <div className="workspace-actions"><button onClick={() => { setInput(locale === 'dot' ? 'If(IsBlank(TextInput1.Text),Notify("Enter a name",NotificationType.Error),Patch(Contacts,Defaults(Contacts),{Name:TextInput1.Text}));Reset(TextInput1)' : 'Set(amount;1,25);;Notify("Saved")'); reset(); }}>Load sample</button><button onClick={() => { setInput(''); reset(); }}>Clear</button></div>
    <label className="utility-field">Formula separators<select value={locale} onChange={event => { setLocale(event.target.value); reset(); }}><option value="dot">Decimal dot · arguments , · chaining ;</option><option value="comma">Decimal comma · arguments ; · chaining ;;</option></select></label>
    <div className="tool-editor-grid"><label><span>Power Fx input</span><textarea spellCheck="false" value={input} onChange={event => { setInput(event.target.value); reset(); }} placeholder="Paste a Power Apps formula…" /></label><label><span>Formatted Power Fx</span><textarea spellCheck="false" value={output} readOnly placeholder="Your formatted formula…" /></label></div>
    <div className="tool-run-actions"><button className="button-primary" onClick={() => { try { setOutput(formatPowerFx(input, locale)); setError(''); } catch (failure) { setOutput(''); setError(failure.message); } }}>Format Power Fx</button><CopyButton value={output} /></div>
    {error && <p className="tool-error" role="alert">{error}</p>}
    <p className="mock-note">Layout formatting only; formulas are not evaluated or semantically validated. Strings, quoted names and comments are preserved. Interpolated strings ($"…") are currently unsupported. Choose your formula’s existing separators.</p>
  </>;
}

function ColorPicker() {
  const [input, setInput] = useState('#A6CBB6');
  const [values, setValues] = useState(() => colorValues('#A6CBB6'));
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const abort = useRef(null);
  useEffect(() => () => abort.current?.abort(), []);
  const change = value => {
    setInput(value);
    try { setValues(colorValues(value)); setError(''); }
    catch (failure) { setError(failure.message); }
  };
  return <>
    <div className="color-controls"><label className="utility-field">Choose color<input type="color" value={values.hex} onChange={event => change(event.target.value)} /></label><label className="utility-field">HEX color<input type="text" spellCheck="false" value={input} onChange={event => change(event.target.value)} /></label>
      {typeof window.EyeDropper === 'function' && <button className="copy-button" disabled={picking} onClick={async () => {
        abort.current = new AbortController(); setPicking(true);
        try { const selected = await new window.EyeDropper().open({ signal: abort.current.signal }); change(selected.sRGBHex); }
        catch (failure) { if (failure.name !== 'AbortError') setError('Screen color sampling is unavailable. Use the color picker.'); }
        finally { if (!abort.current.signal.aborted) setPicking(false); }
      }}>{picking ? 'Choose on screen…' : 'Pick from screen'}</button>}
    </div>
    <div className="color-swatch" style={{ backgroundColor: values.hex }} aria-label={`Color preview ${values.hex}`} />
    <div className="color-values">{Object.entries(values).map(([format, value]) => <div key={format}><label className="utility-field">{format.toUpperCase()} value<input value={value} readOnly /></label><CopyButton value={value} /></div>)}</div>
    {error && <p className="tool-error" role="alert">{error}</p>}
    <p className="mock-note">HEX accepts 3 or 6 digits. RGB and HSL use the selected opaque sRGB color. Screen sampling appears when supported by your browser.</p>
  </>;
}

function ImageConverter() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('image/webp');
  const [width, setWidth] = useState('1920');
  const [height, setHeight] = useState('1920');
  const [quality, setQuality] = useState('85');
  const [background, setBackground] = useState('#ffffff');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  const invalidate = () => { generation.current++; setResult(null); setBusy(false); setError(''); };
  const convert = async () => {
    invalidate(); const task = generation.current;
    if (!file) { setError('Choose a PNG, JPEG or WebP image first.'); return; }
    setBusy(true);
    let bitmap;
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('Choose an image under 20 MiB.');
      const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      const ascii = new TextDecoder().decode(signature);
      const supported = (signature[0] === 137 && ascii.slice(1, 4) === 'PNG') || (signature[0] === 255 && signature[1] === 216) || (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP');
      if (!supported) throw new Error('Cannot decode this image. Choose a valid PNG, JPEG or WebP file.');
      const maxWidth = Number(width), maxHeight = Number(height);
      if (![maxWidth, maxHeight].every(value => Number.isInteger(value) && value >= 1 && value <= 8192)) throw new Error('Width and height must be whole numbers between 1 and 8192.');
      bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > 24000000) throw new Error('Choose an image with at most 24 million pixels.');
      if (task !== generation.current) return;
      const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image conversion is unavailable in this browser.');
      if (format === 'image/jpeg') { context.fillStyle = background; context.fillRect(0, 0, canvas.width, canvas.height); }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, format, Number(quality) / 100));
      if (task !== generation.current) return;
      if (!blob || blob.type !== format) throw new Error('Your browser cannot export this format. Try PNG or JPEG.');
      const extension = format === 'image/jpeg' ? 'jpg' : format.split('/')[1];
      setResult({ url: URL.createObjectURL(blob), name: `${file.name.replace(/\.[^.]+$/u, '') || 'image'}-converted.${extension}`, size: blob.size, width: canvas.width, height: canvas.height });
    } catch (failure) {
      if (task === generation.current) setError(failure instanceof Error && failure.message ? (failure.name === 'InvalidStateError' ? 'Cannot decode this image. Choose a valid PNG, JPEG or WebP file.' : failure.message) : 'Image conversion failed. Try a smaller image.');
    } finally {
      bitmap?.close(); if (task === generation.current) setBusy(false);
    }
  };
  return <>
    <label className="utility-field image-upload">Image file<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { invalidate(); setFile(event.target.files?.[0] || null); }} /></label>
    {file && <p className="file-summary">{file.name} · {(file.size / 1024).toFixed(1)} KiB</p>}
    <div className="image-options"><label className="utility-field">Output format<select value={format} onChange={event => { invalidate(); setFormat(event.target.value); }}><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label>
      <label className="utility-field">Maximum width<input type="number" min="1" max="8192" value={width} onChange={event => { invalidate(); setWidth(event.target.value); }} /></label>
      <label className="utility-field">Maximum height<input type="number" min="1" max="8192" value={height} onChange={event => { invalidate(); setHeight(event.target.value); }} /></label>
      {format !== 'image/png' && <label className="utility-field">Quality · {quality}%<input type="range" min="1" max="100" value={quality} onChange={event => { invalidate(); setQuality(event.target.value); }} /></label>}
      {format === 'image/jpeg' && <label className="utility-field">JPEG background<input type="color" value={background} onChange={event => { invalidate(); setBackground(event.target.value); }} /></label>}
    </div>
    <div className="tool-run-actions"><button className="button-primary" disabled={busy} onClick={convert}>{busy ? 'Converting…' : 'Convert image'}</button>{result && <a className="button-secondary" href={result.url} download={result.name}>Download converted image</a>}</div>
    <div role="status">{result && <p className="file-summary">{result.width} × {result.height} px · {(result.size / 1024).toFixed(1)} KiB</p>}</div>
    {result && <img className="converted-image" src={result.url} alt="Converted image preview" />}
    {error && <p className="tool-error" role="alert">{error}</p>}
    <p className="mock-note">PNG, JPEG and WebP input only. Files stay in your browser. Resize preserves proportions without enlarging. Limit: 20 MiB / 24 million pixels. Output is a static image; animation and original metadata are not retained. JPEG uses the selected background for transparency.</p>
  </>;
}

export default function AdditionalTools({ tool }) {
  return <section className="tool-workspace" aria-label={`${tool.name} workspace`}><div className="workspace-heading"><div><span className="eyebrow">{tool.category} / LOCAL UTILITY</span><h2>{tool.name}</h2><p>{tool.description}</p></div><span className="tool-symbol" aria-hidden="true">{tool.icon}</span></div>{tool.id === 'image' ? <ImageConverter /> : tool.id === 'powerfx' ? <PowerFx /> : <ColorPicker />}</section>;
}
