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
 *
 * s123 — the Coach: under the lines, the changes the Coach made to this brief
 * (one setting per priority, tested on the client's own decisions and kept only
 * if "Not relevant" went down), each with an Undo while it is in use. `undo`
 * (changeId) and, in Brief Preview only, `coach` (run it now) are API calls.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Bot, Search, Sparkles } from 'lucide-react';

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

export const COACH_STATUS = {
  trial: { label: 'Testing', color: '#8A6A1C', bg: '#FBF6EA' },
  kept: { label: 'Kept', color: '#1F6B3A', bg: '#EAF6EE' },
  undone: { label: 'Put back', color: '#666', bg: '#F2F2F2' },
  user_undone: { label: 'Undone', color: '#666', bg: '#F2F2F2' },
};
export const COACH_SEARCHED = { label: 'Searched', color: '#1F4E8A', bg: '#EAF1FB' };

export function CoachChanges({ changes, onUndo, client = null, busy = null }) {
  if (!changes?.length) return null;
  return (
    <div data-testid="coach-changes" style={{ marginTop: 10, borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
      <div style={{ fontSize: 12.5, color: '#555', display: 'flex', alignItems: 'center', gap: 5 }}>
        <Sparkles size={13} color="#8A6A1C" /> <b style={{ fontWeight: 600 }}>Changes the Coach made</b>
        <span style={{ color: '#888' }}>Each one is tested on {client ? 'this client\'s' : 'your'} decisions and kept only if it helps.</span>
      </div>
      <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'grid', gap: 6 }}>
        {changes.map((c) => {
          // s125 (Phase 4c): a Scout search the Coach ran is an action, not a setting being tested.
          const st = c.kind === 'scout_search' ? COACH_SEARCHED : (COACH_STATUS[c.status] || COACH_STATUS.trial);
          return (
            <li key={c.id} data-testid="coach-change" style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: st.color, background: st.bg, borderRadius: 6, padding: '1px 7px', whiteSpace: 'nowrap' }}>{st.label}</span>
              <span style={{ flex: '1 1 320px', minWidth: 0, color: '#1a1a1a' }}>
                {c.text}
                {c.verdict && <span style={{ display: 'block', fontSize: 12.5, color: '#666' }}>{c.verdict}</span>}
              </span>
              {c.undoable && onUndo && (
                <button type="button" data-testid="coach-undo" onClick={() => onUndo(c)} disabled={busy === c.id}
                  style={{ fontSize: 12, padding: '3px 10px', borderRadius: 7, border: '1px solid #ccc', background: '#fff', cursor: busy === c.id ? 'default' : 'pointer' }}>
                  {busy === c.id ? 'Undoing…' : 'Undo'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function AgentsPanel({ load, scout, undo = null, coach = null, onFound, onChanged = onFound, client = null, id = 'tour-brief-agents' }) {
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

  const [undoing, setUndoing] = useState(null);
  const onUndo = undo ? async (c) => {
    setUndoing(c.id);
    try {
      await undo(c.id);
      toast.success(`Undone. "${c.priority}" shows as it did before.`);
      onChanged?.();
    } catch (err) {
      toast.error(err.message || 'Could not undo that change');
    } finally {
      setUndoing(null);
      refresh();
    }
  } : null;
  const [coaching, setCoaching] = useState(false);
  const runCoach = coach ? async () => {
    setCoaching(true);
    try {
      const r = await coach();
      toast.success(r.change ? 'The Coach is testing one change.' : r.verdicts?.length ? 'The Coach judged its change.' : `The Coach found nothing to change (${r.note || 'not enough decisions yet'}).`);
      if (r.change || r.verdicts?.length) onChanged?.();
    } catch (err) {
      toast.error(err.message || 'The Coach could not run');
    } finally {
      setCoaching(false);
      refresh();
    }
  } : null;

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
        {runCoach && (
          <button type="button" data-testid="run-coach" onClick={runCoach} disabled={coaching}
            title="Measure this client's decisions, judge the change on trial, and maybe try one new change (no model call)"
            style={{ fontSize: 12.5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${G}`, background: '#fff', color: NAVY, fontWeight: 600,
              cursor: coaching ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={13} /> {coaching ? 'Coach is checking…' : 'Run the Coach'}
          </button>
        )}
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
      <CoachChanges changes={data?.coach} onUndo={onUndo} client={client} busy={undoing} />
    </section>
  );
}
