import { useVisitors } from './VisitorProvider';

export default function VisitorStats() {
  const stats = useVisitors();
  if (stats.status === 'disabled') return null;
  const available = stats.totalVisits !== undefined;
  return <div className={`visitor-stats${stats.status === 'ready' ? ' is-live' : ''}`} role="group" aria-label="Visitor statistics">
    <span className="visitor-stat" title="Browsers active within the last two minutes"><span className="visitor-live-dot" aria-hidden="true" /><strong>{available ? stats.activeVisitors.toLocaleString() : '—'}</strong> Active now</span>
    <span className="visitor-stat" title="Browser sessions; a new visit begins after 30 minutes of inactivity"><strong>{available ? stats.totalVisits.toLocaleString() : '—'}</strong> Total visits</span>
    {stats.status !== 'ready' && <span className="visitor-stats-note">{stats.status === 'loading' ? 'Connecting…' : stats.status === 'stale' ? 'Last known counts' : 'Counts unavailable'}</span>}
  </div>;
}
