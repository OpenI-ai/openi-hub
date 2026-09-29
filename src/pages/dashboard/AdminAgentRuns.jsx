/**
 * s122 (29 Sep 2026) — admin "Agent Runs": the agent runtime's run log.
 *
 * Every graph run (src/agents/runtime.js in the backend) and each of its steps:
 * which agent or tool ran, the model, tokens, cost, time, and any error, with
 * the step's input and output. Rajeev: "our win will be on 2 factors:
 * automation of agents and accuracy of our recommendations" — this page is
 * where the automation side is seen, and where a wrong recommendation is
 * traced back to the step that produced it. Read-only.
 */
import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, ChevronRight } from 'lucide-react';
import { agentRunsAPI } from '../../services/api';

const G = '#D0A848';
const btn = { fontSize: 13, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e2e2', background: '#fff', color: '#333', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const STATUS = {
  ok: { label: 'OK', bg: '#E7F4EC', fg: '#2E7D4F' },
  running: { label: 'Running', bg: '#EEF2F8', fg: '#3B5B8C' },
  error: { label: 'Error', bg: '#FBEAEA', fg: '#A33' },
  budget_exceeded: { label: 'Over budget', bg: '#FFF3E0', fg: '#9A5B00' },
  step_limit: { label: 'Step limit', bg: '#FFF3E0', fg: '#9A5B00' },
};
const usd = (n) => `$${Number(n || 0).toFixed(Number(n || 0) < 0.01 ? 4 : 3)}`;
const dur = (ms) => (ms == null ? '—' : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);
const when = (t) => (t ? new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

function Badge({ status }) {
  const s = STATUS[status] || { label: status, bg: '#f3f3f3', fg: '#555' };
  return <span style={{ fontSize: 11.5, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: s.bg, color: s.fg }}>{s.label}</span>;
}

function Json({ value }) {
  if (value == null) return <span style={{ color: '#999' }}>—</span>;
  return <pre style={{ margin: 0, fontSize: 11.5, background: '#f8f8f8', border: '1px solid #eee', borderRadius: 8, padding: 8, maxHeight: 240, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(value, null, 2)}</pre>;
}

function RunDetail({ id }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [open, setOpen] = useState({});
  useEffect(() => {
    let live = true;
    setData(null); setErr(null);
    agentRunsAPI.get(id).then(d => { if (live) setData(d); }).catch(e => { if (live) setErr(e.message || 'Could not load that run'); });
    return () => { live = false; };
  }, [id]);
  if (err) return <p style={{ color: '#A33', fontSize: 13 }}>{err}</p>;
  if (!data) return <div style={{ display: 'flex', gap: 8, color: '#666', fontSize: 13 }}><Loader2 className="animate-spin" size={14} /> Loading run…</div>;
  const { run, steps } = data;
  return (
    <div data-testid="run-detail" style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}>
        <strong style={{ fontWeight: 600 }}>Run #{run.id}</strong> <Badge status={run.status} />
        <span style={{ color: '#666' }}>{run.graph} · {run.subject || 'no subject'} · {run.steps} steps · {usd(run.cost_usd)} · {run.tokens_in + run.tokens_out} tokens</span>
      </div>
      {run.error && <div style={{ fontSize: 13, color: '#A33' }}>{run.error}</div>}
      {steps.map(s => (
        <div key={s.seq} data-testid="run-step" style={{ border: '1px solid #eee', borderRadius: 10, background: '#fff' }}>
          <button type="button" onClick={() => setOpen(o => ({ ...o, [s.seq]: !o[s.seq] }))}
            style={{ all: 'unset', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', width: 'calc(100% - 24px)', fontSize: 13, flexWrap: 'wrap' }}>
            <ChevronRight size={14} style={{ transform: open[s.seq] ? 'rotate(90deg)' : 'none' }} />
            <span style={{ color: '#999' }}>{s.seq}.</span>
            <strong style={{ fontWeight: 600 }}>{s.node}</strong>
            <span style={{ fontSize: 11.5, color: s.kind === 'agent' ? '#8A6A1C' : '#666', border: `1px solid ${s.kind === 'agent' ? G : '#ddd'}`, borderRadius: 999, padding: '0 7px' }}>{s.kind}</span>
            <Badge status={s.status} />
            <span style={{ color: '#777' }}>{dur(s.ms)}{s.model ? ` · ${s.model} · ${s.tokens_in}+${s.tokens_out} tokens · ${usd(s.cost_usd)}` : ''}</span>
            {s.error && <span style={{ color: '#A33' }}>{s.error}</span>}
          </button>
          {open[s.seq] && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8, padding: '0 12px 12px' }}>
              <div><div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 4 }}>INPUT</div><Json value={s.input} /></div>
              <div><div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 4 }}>OUTPUT</div><Json value={s.output} /></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AdminAgentRuns() {
  const [runs, setRuns] = useState(null);
  const [status, setStatus] = useState('');
  const [picked, setPicked] = useState(null);
  const [tick, setTick] = useState(0);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let live = true;
    setErr(null);
    agentRunsAPI.list({ status: status || undefined, limit: 50 })
      .then(d => { if (live) setRuns(d.runs || []); })
      .catch(e => { if (live) { setRuns([]); setErr(e.message || 'Could not load runs'); } });
    return () => { live = false; };
  }, [status, tick]);

  const done = (runs || []).filter(r => r.status !== 'running');
  const ok = done.filter(r => r.status === 'ok').length;
  const cost = (runs || []).reduce((n, r) => n + Number(r.cost_usd || 0), 0);

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '8px 4px 40px' }} data-testid="agent-runs">
      <h1 style={{ fontSize: 24, fontWeight: 600, margin: '4px 0 6px' }}>Agent Runs</h1>
      <p style={{ fontSize: 14, color: '#555', margin: 0, maxWidth: '75ch' }}>
        Every run of OpenI's agents, step by step: which agent or tool ran, the model, tokens, cost, time and any error. Open a run to see what each step received and returned.
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '14px 0', fontSize: 13 }} data-testid="runs-summary">
        <span><strong style={{ fontWeight: 600 }}>{runs ? runs.length : '…'}</strong> runs shown</span>
        <span><strong style={{ fontWeight: 600 }}>{done.length ? `${Math.round((ok / done.length) * 100)}%` : '—'}</strong> finished OK</span>
        <span><strong style={{ fontWeight: 600 }}>{usd(cost)}</strong> model cost</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <select aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)} style={{ ...btn, padding: '6px 8px' }}>
          <option value="">All statuses</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button type="button" style={btn} onClick={() => setTick(t => t + 1)}><RefreshCw size={13} /> Refresh</button>
      </div>
      {err && <p style={{ color: '#A33', fontSize: 13 }}>{err}</p>}
      {runs == null ? <div style={{ display: 'flex', gap: 8, color: '#666' }}><Loader2 className="animate-spin" size={16} /> Loading…</div>
        : runs.length === 0 ? <p style={{ color: '#666', fontSize: 14 }}>No agent runs yet. Draft a prospect's pain points in Brief Preview to create one.</p>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: picked ? 'minmax(0,5fr) minmax(0,7fr)' : '1fr', gap: 16, alignItems: 'start' }}>
            <div style={{ border: '1px solid #eee', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
              {runs.map(r => (
                <button key={r.id} type="button" data-testid="run-row" onClick={() => setPicked(r.id)}
                  style={{ all: 'unset', cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr auto', gap: 4, padding: '10px 14px', borderBottom: '1px solid #f2f2f2', width: 'calc(100% - 28px)', background: picked === r.id ? '#FBF6EA' : undefined }}>
                  <span style={{ fontSize: 13.5 }}><strong style={{ fontWeight: 600 }}>{r.subject || r.graph}</strong> <span style={{ color: '#888' }}>· {r.graph}</span></span>
                  <Badge status={r.status} />
                  <span style={{ fontSize: 12, color: '#777' }}>{when(r.started_at)} · {r.steps} steps · {dur(r.ms)} · {usd(r.cost_usd)}{r.actor ? ` · ${r.actor}` : ''}</span>
                </button>
              ))}
            </div>
            {picked && <RunDetail id={picked} />}
          </div>
        )}
    </div>
  );
}
