import { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import SafeHtml from '../SafeHtml';
import { CopyButton, ToolFrame } from './AdditionalTools';
import { generatePassword, generateUuids, generateLorem, timestampDate, parseIsoDate, describeDate, hashText, encodeJwt, decodeJwt, parseCron } from './developerToolLogic';

function useAction() {
  const [state, setState] = useState({}), version = useRef(0);
  useEffect(() => () => { version.current++; }, []);
  const clear = () => { version.current++; setState({}); };
  const run = async task => {
    const current = ++version.current; setState({ pending: true });
    try { const output = await task(); if (current === version.current) setState({ output: String(output) }); }
    catch (error) { if (current === version.current) setState({ error: error.message || 'Unable to complete this action.' }); }
  };
  return { ...state, clear, run };
}
function Field({ label, children }) { return <label className="utility-field">{label}{children}</label>; }
function Output({ action, label = 'Output' }) {
  return <>{action.error && <p className="tool-error" role="alert">{action.error}</p>}<Field label={label}><textarea className="developer-output" readOnly spellCheck="false" value={action.output || ''} placeholder="Your result will appear here…" /></Field><div className="workspace-actions"><CopyButton value={action.output || ''} />{action.pending && <span role="status">Working…</span>}</div></>;
}
function Markdown() {
  const [input, setInput] = useState('# A little space to write\n\nPreview **Markdown** as you edit.\n\n- Ideas\n- Notes\n- Useful things\n\n```js\nconst hello = "world";\n```');
  const preview = useMemo(() => { try { return { html: marked.parse(input, { async: false, gfm: true }) }; } catch { return { error: 'This Markdown could not be rendered.' }; } }, [input]);
  const download = () => { const url = URL.createObjectURL(new Blob([input], { type: 'text/markdown;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'notes.md'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  return <><div className="tool-editor-grid markdown-editor"><Field label="Markdown source"><textarea value={input} maxLength={50000} spellCheck="false" onChange={event => setInput(event.target.value)} /></Field><div><span className="utility-caption">Live preview</span><div className="markdown-preview">{preview.error ? <p role="alert">{preview.error}</p> : <SafeHtml html={preview.html} markdown />}</div></div></div><div className="workspace-actions"><CopyButton value={input} /><button className="copy-button" onClick={download} disabled={!input}>Download .md</button><button onClick={() => setInput('')}>Clear</button></div><p className="mock-note">Preview is sanitized. Images are not fetched and scripts are not executed. Limit: 50,000 characters.</p></>;
}
function PasswordUuid() {
  const [length, setLength] = useState('20'), [count, setCount] = useState('1');
  const [groups, setGroups] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const action = useAction();
  return <><div className="developer-controls"><Field label="Password length"><input type="number" min="8" max="128" value={length} onChange={event => { setLength(event.target.value); action.clear(); }} /></Field><Field label="UUID count"><input type="number" min="1" max="100" value={count} onChange={event => { setCount(event.target.value); action.clear(); }} /></Field></div><fieldset className="character-groups"><legend>Password characters</legend>{Object.entries({ lower: 'Lowercase', upper: 'Uppercase', digits: 'Digits', symbols: 'Symbols' }).map(([key, label]) => <label key={key}><input type="checkbox" checked={groups[key]} onChange={event => { setGroups({ ...groups, [key]: event.target.checked }); action.clear(); }} />{label}</label>)}</fieldset><div className="tool-run-actions"><button className="button-primary" onClick={() => action.run(() => generatePassword(length, groups))}>Generate password</button><button className="button-secondary" onClick={() => action.run(() => generateUuids(count))}>Generate UUIDs</button></div><Output action={action} /><p className="mock-note">Uses browser cryptographic randomness. Passwords include every selected character group; UUIDs are version 4. Results are not stored.</p></>;
}
function Lorem() {
  const [mode, setMode] = useState('paragraphs'), [count, setCount] = useState('3'), action = useAction();
  return <><div className="developer-controls"><Field label="Generate"><select value={mode} onChange={event => { setMode(event.target.value); action.clear(); }}><option value="paragraphs">Paragraphs</option><option value="words">Words</option></select></Field><Field label="Count"><input type="number" min="1" max={mode === 'words' ? 2000 : 50} value={count} onChange={event => { setCount(event.target.value); action.clear(); }} /></Field></div><div className="tool-run-actions"><button className="button-primary" onClick={() => action.run(() => generateLorem(mode, count))}>Generate lorem ipsum</button></div><Output action={action} /></>;
}
function Timestamp() {
  const [timestamp, setTimestamp] = useState('0'), [unit, setUnit] = useState('seconds'), [date, setDate] = useState(() => new Date().toISOString()), action = useAction();
  return <><div className="developer-controls"><Field label="UNIX timestamp"><input value={timestamp} inputMode="decimal" onChange={event => { setTimestamp(event.target.value); action.clear(); }} /></Field><Field label="Timestamp unit"><select value={unit} onChange={event => { setUnit(event.target.value); action.clear(); }}><option value="seconds">Seconds</option><option value="milliseconds">Milliseconds</option></select></Field></div><div className="tool-run-actions"><button className="button-primary" onClick={() => action.run(() => describeDate(timestampDate(timestamp, unit)))}>Timestamp to date</button></div><Field label="ISO date with timezone"><input value={date} onChange={event => { setDate(event.target.value); action.clear(); }} placeholder="2026-10-02T12:00:00Z" /></Field><div className="tool-run-actions"><button className="button-primary" onClick={() => action.run(() => describeDate(parseIsoDate(date)))}>Date to timestamp</button><button className="button-secondary" onClick={() => { const now = new Date(); setDate(now.toISOString()); setTimestamp(String(unit === 'seconds' ? Math.floor(now.getTime() / 1000) : now.getTime())); action.clear(); }}>Use now</button></div><Output action={action} /><p className="mock-note">UTC output is explicit. Local output uses your browser timezone. UNIX seconds are rounded down when converting from a date.</p></>;
}
function Hash() {
  const [input, setInput] = useState(''), [algorithm, setAlgorithm] = useState('SHA-256'), action = useAction();
  return <><Field label="Hash algorithm"><select value={algorithm} onChange={event => { setAlgorithm(event.target.value); action.clear(); }}>{['SHA-256', 'SHA-384', 'SHA-512', 'SHA-1'].map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Text to hash"><textarea spellCheck="false" value={input} maxLength={1000000} onChange={event => { setInput(event.target.value); action.clear(); }} /></Field><div className="tool-run-actions"><button className="button-primary" disabled={action.pending} onClick={() => action.run(() => hashText(input, algorithm))}>Generate hash</button></div><Output action={action} /><p className="mock-note">Hashes exact UTF-8 text, including spaces and newlines. SHA-1 is available for compatibility; use SHA-256 or stronger for new work. Hashing is not encryption.</p></>;
}
function Jwt() {
  const [token, setToken] = useState(''), [payload, setPayload] = useState('{\n  "sub": "example-user",\n  "name": "Minh"\n}'), [algorithm, setAlgorithm] = useState('HS256'), [secret, setSecret] = useState(''), action = useAction();
  return <><Field label="JWT to decode"><textarea spellCheck="false" maxLength={100000} value={token} onChange={event => { setToken(event.target.value); action.clear(); }} placeholder="header.payload.signature" /></Field><div className="tool-run-actions"><button className="button-primary" onClick={() => action.run(() => JSON.stringify(decodeJwt(token), null, 2))}>Decode JWT</button></div><Field label="Payload JSON to encode"><textarea spellCheck="false" maxLength={50000} value={payload} onChange={event => { setPayload(event.target.value); action.clear(); }} /></Field><div className="developer-controls"><Field label="JWT signing"><select value={algorithm} onChange={event => { setAlgorithm(event.target.value); setSecret(''); action.clear(); }}><option value="HS256">HS256 · HMAC SHA-256</option><option value="none">Unsigned · alg none</option></select></Field>{algorithm === 'HS256' && <Field label="HS256 secret"><input type="password" autoComplete="off" value={secret} onChange={event => { setSecret(event.target.value); action.clear(); }} /></Field>}</div><div className="tool-run-actions"><button className="button-primary" disabled={action.pending} onClick={() => action.run(() => encodeJwt(payload, secret, algorithm))}>Encode JWT</button></div><Output action={action} /><p className="mock-note">Decoding does not verify the signature or authorize a user. HS256 signs with your local secret; unsigned tokens have an empty signature. Header and payload are readable, not encrypted.</p></>;
}
function Cron() {
  const [expression, setExpression] = useState('*/15 * * * *'), [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh'), [start, setStart] = useState(() => new Date().toISOString()), action = useAction();
  return <><Field label="Cron expression"><input spellCheck="false" value={expression} maxLength={200} onChange={event => { setExpression(event.target.value); action.clear(); }} /></Field><div className="cron-field-guide" aria-label="Cron field order">{['Minute', 'Hour', 'Day of month', 'Month', 'Day of week'].map(label => <span key={label}>{label}</span>)}</div><div className="developer-controls"><Field label="IANA timezone"><input value={timezone} onChange={event => { setTimezone(event.target.value); action.clear(); }} placeholder="Asia/Ho_Chi_Minh" /></Field><Field label="Start after (ISO date)"><input value={start} onChange={event => { setStart(event.target.value); action.clear(); }} /></Field></div><div className="tool-run-actions"><button className="button-primary" onClick={() => action.run(() => { const result = parseCron(expression, timezone, start); return `Timezone: ${result.timezone}\n\n` + result.runs.map((run, i) => `${i + 1}. ${run.zoned}\n   UTC: ${run.utc}`).join('\n\n'); })}>Parse cron</button></div><Output action={action} label="Next five runs" /><p className="mock-note">Five-field cron syntax; schedules are evaluated in the selected timezone, including DST. If both day-of-month and day-of-week are restricted, either may match. This previews runs; it does not schedule jobs.</p></>;
}
const components = { markdown: Markdown, credentials: PasswordUuid, lorem: Lorem, timestamp: Timestamp, hash: Hash, jwt: Jwt, cron: Cron };
export default function DeveloperTools({ tool }) {
  const Component = components[tool.id];
  return <ToolFrame tool={tool}>{Component ? <Component /> : <p>This tool is unavailable.</p>}</ToolFrame>;
}
