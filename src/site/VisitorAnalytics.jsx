import { useEffect, useState } from 'react';
import { useSession } from './AuthProvider';
import { requestApi } from './api';
import LoadingState from './LoadingState';

const day = 86400000;
const count = value => Number.isSafeInteger(value) && value >= 0;
const number = value => value.toLocaleString();
const breakdownKeys = ['referrers', 'devices', 'browsers', 'operatingSystems', 'landingPages'];
function recentRange(days) {
  const end = new Date();
  const endDate = end.toISOString().slice(0, 10);
  const startDate = new Date(Date.parse(`${endDate}T00:00:00Z`) - (days - 1) * day).toISOString().slice(0, 10);
  return { startDate, endDate };
}
function validRange({ startDate, endDate }) {
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/u.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value >= '0001-01-01' && value <= '9999-12-30';
  return validDate(startDate) && validDate(endDate) && startDate <= endDate && (Date.parse(endDate) - Date.parse(startDate)) / day < 90;
}
function validateAnalytics(data) {
  if (!data || !['activeVisitors', 'totalVisits', 'visitsInRange', 'uniqueVisitors'].every(key => count(data[key])) ||
      !Array.isArray(data.dailyVisits) || !data.dailyVisits.every(item => typeof item.date === 'string' && count(item.visits)) ||
      !breakdownKeys.every(key => Array.isArray(data[key]) && data[key].every(item => typeof item.label === 'string' && count(item.visits)))) throw new Error('The visitor service returned invalid analytics.');
  return data;
}

function DailyChart({ items }) {
  const maximum = Math.max(1, ...items.map(item => item.visits));
  const points = items.map((item, index) => ({ ...item, x: items.length === 1 ? 410 : 40 + index * 740 / Math.max(1, items.length - 1), y: 190 - item.visits / maximum * 150 }));
  const [selected, setSelected] = useState(null);
  return <section className="visitor-chart visitor-daily-chart"><div className="visitor-chart-heading"><h3>Visits over time</h3><span>{selected ? `${selected.date} · ${number(selected.visits)} visits` : 'Daily sessions · UTC'}</span></div>
    {!items.length ? <p className="mock-note">No daily data available.</p> : <>
      <svg viewBox="0 0 800 230" role="img" aria-label="Daily visit sessions, with exact values available below">
        <path d="M40 40H780 M40 115H780 M40 190H780" className="visitor-chart-grid" />
        <text x="4" y="44">{number(maximum)}</text><text x="16" y="194">0</text>
        <polyline points={points.map(point => `${point.x},${point.y}`).join(' ')} className="visitor-chart-line" />
        {points.map(point => <circle key={point.date} cx={point.x} cy={point.y} r="5" tabIndex={0} aria-label={`${point.date}: ${point.visits} visits`} onMouseEnter={() => setSelected(point)} onMouseLeave={() => setSelected(null)} onFocus={() => setSelected(point)} onBlur={() => setSelected(null)}><title>{point.date}: {point.visits} visits</title></circle>)}
        <text x="40" y="218">{items[0].date}</text>{items.length > 1 && <text x="780" y="218" textAnchor="end">{items.at(-1).date}</text>}
      </svg>
      <details className="visitor-daily-data"><summary>Daily visit counts</summary><div className="visitor-table-scroll"><table><thead><tr><th scope="col">Date (UTC)</th><th scope="col">Visits</th></tr></thead><tbody>{items.map(item => <tr key={item.date}><td>{item.date}</td><td>{number(item.visits)}</td></tr>)}</tbody></table></div></details>
    </>}
  </section>;
}
function Breakdown({ title, items }) {
  const [expanded, setExpanded] = useState(false);
  const maximum = Math.max(1, ...items.map(item => item.visits));
  return <section className="visitor-chart"><h3>{title}</h3>{!items.length ? <p className="mock-note">No sessions recorded.</p> : <>
    <ul className="visitor-breakdown">{(expanded ? items : items.slice(0, 8)).map(item => <li key={item.label}><div><span title={item.label}>{item.label}</span><strong>{number(item.visits)}</strong></div><span className="visitor-bar" aria-hidden="true"><span style={{ width: `${item.visits / maximum * 100}%` }} /></span></li>)}</ul>
    {items.length > 8 && <button className="copy-button" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : `Show all ${items.length}`}</button>}
  </>}</section>;
}
function VisitTable({ range }) {
  const { user, isAdmin } = useSession();
  const [cursors, setCursors] = useState([null]), [page, setPage] = useState(0), [limit, setLimit] = useState('25');
  const [state, setState] = useState({}), [retry, setRetry] = useState(0);
  const cursor = cursors[page], owner = `${user?.uid}:${cursor || ''}:${limit}:${retry}`;
  useEffect(() => {
    if (!isAdmin) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ ...range, limit });
    if (cursor) query.set('cursor', cursor);
    requestApi(`/visitors/visits?${query}`, { user, signal: controller.signal, cache: 'no-store' }).then(data => {
      if (!data || !Array.isArray(data.visits) || !data.visits.every(visit => typeof visit.id === 'string') ||
          !(data.nextCursor === null || typeof data.nextCursor === 'string') || data.startDate !== range.startDate || data.endDate !== range.endDate) throw new Error('The visitor service returned an invalid visit page.');
      if (!controller.signal.aborted) setState({ owner, data });
    }).catch(error => { if (!controller.signal.aborted) setState({ owner, error: error.message }); });
    return () => controller.abort();
  }, [user, isAdmin, range, cursor, limit, retry]);
  const current = state.owner === owner ? state : {}, ready = !!current.data;
  const timestamp = value => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString(undefined, { timeZone: 'UTC' }) : 'Unknown';
  };
  return <section className="visitor-sessions"><div className="visitor-chart-heading"><div><h3>Visit sessions</h3><p className="mock-note">Newest first · timestamps in UTC · device details are approximate.</p></div><label className="utility-field">Rows per page<select value={limit} onChange={event => { setLimit(event.target.value); setCursors([null]); setPage(0); }}>{['25', '50', '100'].map(value => <option key={value}>{value}</option>)}</select></label></div>
    {current.error ? <div className="empty-state"><p className="tool-error" role="alert">{current.error}</p><button onClick={() => setRetry(value => value + 1)}>Retry visit list</button></div> : !ready ? <LoadingState label="Gathering visit sessions" skeleton /> : !current.data.visits.length ? <p>No visit sessions in this range.</p> : <div className="visitor-table-scroll" tabIndex={0} role="region" aria-label="Visitor sessions table"><table><caption className="sr-only">Visitor sessions, newest first</caption><thead><tr>{['Time (UTC)', 'IP address', 'Referring site', 'Landing page', 'Device', 'Browser', 'OS', 'Browser ID'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{current.data.visits.map(visit => <tr key={visit.id}><td>{timestamp(visit.startedAt)}</td>{['ip', 'referrer', 'landingPage', 'device', 'browser', 'os', 'visitorId'].map(field => <td key={field}>{visit[field] || '—'}</td>)}</tr>)}</tbody></table></div>}
    <div className="visitor-pagination"><button className="copy-button" disabled={!ready || page === 0} onClick={() => setPage(value => value - 1)}>Previous page</button><span>Page {page + 1}</span><button className="copy-button" disabled={!ready || !current.data.nextCursor} onClick={() => { setCursors(previous => [...previous.slice(0, page + 1), current.data.nextCursor]); setPage(value => value + 1); }}>Next page</button></div>
  </section>;
}
function AnalyticsResults({ range }) {
  const { user, isAdmin } = useSession();
  const [state, setState] = useState({}), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!isAdmin) return;
    const controller = new AbortController(); setState({});
    requestApi(`/visitors/analytics?${new URLSearchParams(range)}`, { user, signal: controller.signal, cache: 'no-store' }).then(validateAnalytics).then(data => {
      if (data.startDate !== range.startDate || data.endDate !== range.endDate || data.timezone !== 'UTC') throw new Error('The visitor service returned analytics for a different date range.');
      if (!controller.signal.aborted) setState({ data });
    }).catch(error => { if (!controller.signal.aborted) setState({ error: error.message }); });
    return () => controller.abort();
  }, [user, isAdmin, range, retry]);
  return <>
    {state.error ? <div className="empty-state"><p className="tool-error" role="alert">{state.error}</p><button onClick={() => setRetry(value => value + 1)}>Retry charts</button></div> : !state.data ? <LoadingState label="Mapping your visitors" skeleton /> : <>
      <div className="visitor-metrics">{[['Active now', state.data.activeVisitors], ['Lifetime visits', state.data.totalVisits], ['Visits in range', state.data.visitsInRange], ['Unique browsers', state.data.uniqueVisitors]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{number(value)}</strong></div>)}</div>
      <DailyChart items={state.data.dailyVisits} />
      <div className="visitor-chart-grid-layout">{[['Referring sites', 'referrers'], ['Landing pages', 'landingPages'], ['Devices', 'devices'], ['Browsers', 'browsers'], ['Operating systems', 'operatingSystems']].map(([title, key]) => <Breakdown key={key} title={title} items={state.data[key]} />)}</div>
    </>}
    <VisitTable range={range} />
  </>;
}
export default function VisitorAnalytics() {
  const [range, setRange] = useState(() => recentRange(30));
  const [draft, setDraft] = useState(range), [error, setError] = useState(''), [reload, setReload] = useState(0);
  return <section className="visitor-analytics" aria-label="Visitor analytics"><div className="visitor-analytics-heading"><div><span className="eyebrow">TRAFFIC / VISIT SESSIONS</span><h2>Your visitors, at a glance.</h2><p>Understand where visits come from and how people reach your work.</p></div><button className="copy-button" onClick={() => { setError(''); setReload(value => value + 1); }}>Refresh analytics</button></div>
    <form className="visitor-date-controls" onSubmit={event => { event.preventDefault(); if (!validRange(draft)) { setError('Choose valid dates in order, covering 1–90 days.'); return; } setError(''); setRange({ ...draft }); setReload(value => value + 1); }}><label className="utility-field">Start date<input type="date" min="0001-01-01" max="9999-12-30" required value={draft.startDate} onChange={event => setDraft({ ...draft, startDate: event.target.value })} /></label><label className="utility-field">End date<input type="date" min="0001-01-01" max="9999-12-30" required value={draft.endDate} onChange={event => setDraft({ ...draft, endDate: event.target.value })} /></label><button className="button-primary">Apply dates</button><div className="visitor-range-presets">{[7, 30, 90].map(days => <button className="copy-button" type="button" key={days} onClick={() => { const next = recentRange(days); setRange(next); setDraft(next); setError(''); setReload(value => value + 1); }}>Last {days} days</button>)}</div></form>
    {error && <p className="tool-error" role="alert">{error}</p>}
    <p className="visitor-date-range">{range.startDate} → {range.endDate} · inclusive UTC dates</p>
    <AnalyticsResults key={`${range.startDate}:${range.endDate}:${reload}`} range={range} />
  </section>;
}
