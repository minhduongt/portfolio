import { useLanguage } from '../../i18n/LanguageProvider';
import { useEffect, useRef, useState } from 'react';
import MarkdownEditor from './MarkdownEditor';
import { LoadingIndicator } from '../LoadingState';
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
function Field({ label, children }) {
  const { t } = useLanguage(); return <label className="utility-field">{t(label)}{children}</label>; }
function Output({ action, label = 'Output' }) {
  const { t } = useLanguage();
  return <>{action.error && <p className="tool-error" role="alert">{t(action.error)}</p>}<Field label={label}><textarea className="developer-output" readOnly spellCheck="false" value={action.output || ''} placeholder={t("Your result will appear here…")} /></Field><div className="workspace-actions"><CopyButton value={action.output || ''} />{action.pending && <LoadingIndicator label={t("Working…")} />}</div></>;
}
function PasswordUuid() {
  const { t } = useLanguage();
  const [length, setLength] = useState('20'), [count, setCount] = useState('1');
  const [groups, setGroups] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const action = useAction();
  return <><div className="developer-controls"><Field label={t("Password length")}><input type="number" min="8" max="128" value={length} onChange={event => { setLength(event.target.value); action.clear(); }} /></Field><Field label={t("UUID count")}><input type="number" min="1" max="100" value={count} onChange={event => { setCount(event.target.value); action.clear(); }} /></Field></div><fieldset className="character-groups"><legend>{t("Password characters")}</legend>{Object.entries({ lower: 'Lowercase', upper: 'Uppercase', digits: 'Digits', symbols: 'Symbols' }).map(([key, label]) => <label key={key}><input type="checkbox" checked={groups[key]} onChange={event => { setGroups({ ...groups, [key]: event.target.checked }); action.clear(); }} />{t(label)}</label>)}</fieldset><div className="tool-run-actions"><button className="button-primary" onClick={() => action.run(() => generatePassword(length, groups))}>{t("Generate password")}</button><button className="button-secondary" onClick={() => action.run(() => generateUuids(count))}>{t("Generate UUIDs")}</button></div><Output action={action} /><p className="mock-note">{t("Uses browser cryptographic randomness. Passwords include every selected character group; UUIDs are version 4. Results are not stored.")}</p></>;
}
function Lorem() {
  const { t } = useLanguage();
  const [mode, setMode] = useState('paragraphs'), [count, setCount] = useState('3'), action = useAction();
  return <><div className="developer-controls"><Field label={t("Generate")}><select value={mode} onChange={event => { setMode(event.target.value); action.clear(); }}><option value="paragraphs">{t("Paragraphs")}</option><option value="words">{t("Words")}</option></select></Field><Field label={t("Count")}><input type="number" min="1" max={mode === 'words' ? 2000 : 50} value={count} onChange={event => { setCount(event.target.value); action.clear(); }} /></Field></div><div className="tool-run-actions"><button className="button-primary" onClick={() => action.run(() => generateLorem(mode, count))}>{t("Generate lorem ipsum")}</button></div><Output action={action} /></>;
}
function Timestamp() {
  const { t, locale } = useLanguage();
  const [timestamp, setTimestamp] = useState('0'), [unit, setUnit] = useState('seconds'), [date, setDate] = useState(() => new Date().toISOString()), action = useAction();
  return <><div className="developer-controls"><Field label={t("UNIX timestamp")}><input value={timestamp} inputMode="decimal" onChange={event => { setTimestamp(event.target.value); action.clear(); }} /></Field><Field label={t("Timestamp unit")}><select value={unit} onChange={event => { setUnit(event.target.value); action.clear(); }}><option value="seconds">{t("Seconds")}</option><option value="milliseconds">{t("Milliseconds")}</option></select></Field></div><div className="tool-run-actions"><button className="button-primary" onClick={() => action.run(() => describeDate(timestampDate(timestamp, unit), locale, t))}>{t("Timestamp to date")}</button></div><Field label={t("ISO date with timezone")}><input value={date} onChange={event => { setDate(event.target.value); action.clear(); }} placeholder="2026-10-02T12:00:00Z" /></Field><div className="tool-run-actions"><button className="button-primary" onClick={() => action.run(() => describeDate(parseIsoDate(date), locale, t))}>{t("Date to timestamp")}</button><button className="button-secondary" onClick={() => { const now = new Date(); setDate(now.toISOString()); setTimestamp(String(unit === 'seconds' ? Math.floor(now.getTime() / 1000) : now.getTime())); action.clear(); }}>{t("Use now")}</button></div><Output action={action} /><p className="mock-note">{t("UTC output is explicit. Local output uses your browser timezone. UNIX seconds are rounded down when converting from a date.")}</p></>;
}
function Hash() {
  const { t } = useLanguage();
  const [input, setInput] = useState(''), [algorithm, setAlgorithm] = useState('SHA-256'), action = useAction();
  return <><Field label={t("Hash algorithm")}><select value={algorithm} onChange={event => { setAlgorithm(event.target.value); action.clear(); }}>{['SHA-256', 'SHA-384', 'SHA-512', 'SHA-1'].map(item => <option key={item}>{item}</option>)}</select></Field><Field label={t("Text to hash")}><textarea spellCheck="false" value={input} maxLength={1000000} onChange={event => { setInput(event.target.value); action.clear(); }} /></Field><div className="tool-run-actions"><button className="button-primary" disabled={action.pending} onClick={() => action.run(() => hashText(input, algorithm))}>{t("Generate hash")}</button></div><Output action={action} /><p className="mock-note">{t("Hashes exact UTF-8 text, including spaces and newlines. SHA-1 is available for compatibility; use SHA-256 or stronger for new work. Hashing is not encryption.")}</p></>;
}
function Jwt() {
  const { t } = useLanguage();
  const [token, setToken] = useState(''), [payload, setPayload] = useState('{\n  "sub": "example-user",\n  "name": "Minh"\n}'), [algorithm, setAlgorithm] = useState('HS256'), [secret, setSecret] = useState(''), action = useAction();
  return <><Field label={t("JWT to decode")}><textarea spellCheck="false" maxLength={100000} value={token} onChange={event => { setToken(event.target.value); action.clear(); }} placeholder="header.payload.signature" /></Field><div className="tool-run-actions"><button className="button-primary" onClick={() => action.run(() => JSON.stringify(decodeJwt(token), null, 2))}>{t("Decode JWT")}</button></div><Field label={t("Payload JSON to encode")}><textarea spellCheck="false" maxLength={50000} value={payload} onChange={event => { setPayload(event.target.value); action.clear(); }} /></Field><div className="developer-controls"><Field label={t("JWT signing")}><select value={algorithm} onChange={event => { setAlgorithm(event.target.value); setSecret(''); action.clear(); }}><option value="HS256">{t("HS256 · HMAC SHA-256")}</option><option value="none">{t("Unsigned · alg none")}</option></select></Field>{algorithm === 'HS256' && <Field label={t("HS256 secret")}><input type="password" autoComplete="off" value={secret} onChange={event => { setSecret(event.target.value); action.clear(); }} /></Field>}</div><div className="tool-run-actions"><button className="button-primary" disabled={action.pending} onClick={() => action.run(() => encodeJwt(payload, secret, algorithm))}>{t("Encode JWT")}</button></div><Output action={action} /><p className="mock-note">{t("Decoding does not verify the signature or authorize a user. HS256 signs with your local secret; unsigned tokens have an empty signature. Header and payload are readable, not encrypted.")}</p></>;
}
function Cron() {
  const { t, locale } = useLanguage();
  const [expression, setExpression] = useState('*/15 * * * *'), [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh'), [start, setStart] = useState(() => new Date().toISOString()), action = useAction();
  return <><Field label={t("Cron expression")}><input spellCheck="false" value={expression} maxLength={200} onChange={event => { setExpression(event.target.value); action.clear(); }} /></Field><div className="cron-field-guide" aria-label={t("Cron field order")}>{['Minute', 'Hour', 'Day of month', 'Month', 'Day of week'].map(label => <span key={label}>{t(label)}</span>)}</div><div className="developer-controls"><Field label={t("IANA timezone")}><input value={timezone} onChange={event => { setTimezone(event.target.value); action.clear(); }} placeholder="Asia/Ho_Chi_Minh" /></Field><Field label={t("Start after (ISO date)")}><input value={start} onChange={event => { setStart(event.target.value); action.clear(); }} /></Field></div><div className="tool-run-actions"><button className="button-primary" onClick={() => action.run(() => { const result = parseCron(expression, timezone, start, locale); return `${t('Timezone')}: ${result.timezone}\n\n` + result.runs.map((run, i) => `${i + 1}. ${run.zoned}\n   UTC: ${run.utc}`).join('\n\n'); })}>{t("Parse cron")}</button></div><Output action={action} label={t("Next five runs")} /><p className="mock-note">{t("Five-field cron syntax; schedules are evaluated in the selected timezone, including DST. If both day-of-month and day-of-week are restricted, either may match. This previews runs; it does not schedule jobs.")}</p></>;
}
const components = { markdown: MarkdownEditor, credentials: PasswordUuid, lorem: Lorem, timestamp: Timestamp, hash: Hash, jwt: Jwt, cron: Cron };
export default function DeveloperTools({ tool }) {
  const { t } = useLanguage();
  const Component = components[tool.id];
  return <ToolFrame tool={tool}>{Component ? <Component /> : <p>{t("This tool is unavailable.")}</p>}</ToolFrame>;
}
