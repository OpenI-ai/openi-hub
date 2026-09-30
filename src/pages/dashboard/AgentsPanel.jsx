/**
 * s123 (30 Sep 2026) — "Agents working for you" + "Run Scout now", from the
 * Dentsu prototype. Each line is something an agent REALLY did for this client
 * (Scout runs, the analyst's checks, last night's crawl, the Strategy map),
 * read from the run log by GET /brief/agents. Scout turns each priority into
 * short searches, searches OpenI's startups with them, and adds what the
 * analyst keeps to that priority's section as "Found by Scout".
 *
 * Used on the client's brief and in Brief Preview (admin, for a client):
 * `load` and `scout` are the two API calls for whichever it is.
 * Always rendered (empty state included) so the page tour can point at it.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Bot, Search } from 'lucide-react';

const G = '#C9A84C';
const NAVY = '#0B1E3F';

export function ago(at, now = Date.now()) {
  if (!at) return '';
  const m = Math.round((now - new Date(at).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

export function scoutResultText(r) {
  const labels = (r.priorities || []).filter(p => (p.kept || []).length).map(p => `"${p.label}"`);
  if (r.found > 0) return `Scout found ${r.found} new startup${r.found === 1 ? '' : 's'} for ${labels.slice(0, 3).join(', ')}. They are in those sections now, marked "Found by Scout".`;
  if (!(r.priorities || []).length) return 'Scout needs at least one priority to search for. Add one above.';
  const qs = (r.priorities || []).flatMap(p => p.queries || []);
  return `Scout searched ${qs.slice(0, 3).map(q => `"${q}"`).join(', ')}${qs.length > 3 ? ' and more' : ''}: nothing new that fits yet. The nightly crawl keeps looking.`;
}

export default function AgentsPanel({ load, scout, onFound, client = null, id = 'tour-brief-agents' }) {
  const [data, setData] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  // The caller may pass a new function each render; fetch on mount (and after a run) only.
  const loadRef = useRef(load);
  loadRef.current = load;
  const refresh = useCallback(async () => {
    try { setData(await loadRef.current()); } catch { setData({ items: [], scout: {} }); } // an extra: the brief works without it
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const r = await scout();
      setResult(scoutResultText(r));
      if (r.found > 0) onFound?.();
    } catch (err) {
      setResult(err.message || 'Scout could not run. Please try again.');
      if (err.status !== 429) toast.error(err.message || 'Scout could not run');
    } finally {
      setRunning(false);
      refresh();
    }
  };

  const items = data?.items || [];
  const waitUntil = data?.scout?.next_at ? new Date(data.scout.next_at) : null;
  const resting = waitUntil && waitUntil > new Date();
  return (
    <section id={id} data-testid="brief-agents" style={{ marginTop: 16, border: '1px solid #eee', borderRadius: 12, background: '#fff', padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Bot size={15} color="#8A6A1C" />
        <strong style={{ fontSize: 14, fontWeight: 600 }}>Agents working for {client || 'you'}</strong>
        <span style={{ fontSize: 12, color: '#888' }}>What OpenI's agents did for {client ? 'this brief' : 'your brief'}, most recent first.</span>
        <button type="button" data-testid="run-scout" onClick={run} disabled={running || resting}
          title={resting ? `Scout can run again at ${waitUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Search OpenI\'s startups for every priority now'}
          style={{ marginLeft: 'auto', fontSize: 12.5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${G}`, background: running || resting ? '#f4efe2' : G,
            color: NAVY, fontWeight: 600, cursor: running || resting ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Search size={13} /> {running ? 'Scout is searching…' : 'Run Scout now'}
        </button>
      </div>
      {running && <p role="status" style={{ fontSize: 12.5, color: '#666', margin: '8px 0 0' }}>Planning short searches for each priority, searching OpenI's startups and checking each one. This takes up to a minute.</p>}
      {result && <p role="status" data-testid="scout-result" style={{ fontSize: 13, color: '#6B5A24', background: '#FBF6EA', borderRadius: 8, padding: '6px 10px', margin: '8px 0 0' }}>{result}</p>}
      {data === null ? null : items.length === 0 ? (
        <p data-testid="agents-empty" style={{ fontSize: 13, color: '#666', margin: '8px 0 0' }}>
          No agent has worked on {client ? 'this brief' : 'your brief'} yet. Run Scout to search for startups now; the nightly crawl also searches the news for {client ? 'these' : 'your'} priorities.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 5 }}>
          {items.map((i, n) => (
            <li key={`${i.agent}-${i.run_id || n}`} data-testid="agent-line" style={{ fontSize: 13.5, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ flex: '1 1 320px', minWidth: 0, color: i.status === 'error' ? '#A33' : '#1a1a1a' }}><b style={{ fontWeight: 600 }}>{i.agent}</b> {i.text}</span>
              <span style={{ fontSize: 12, color: '#999' }}>{ago(i.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
