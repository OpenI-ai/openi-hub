/**
 * s122 (29 Sep 2026) — admin "Agent Runs": the agent runtime's run log.
 *
 * Every graph run (src/agents/runtime.js in the backend) and each of its steps:
 * which agent or tool ran, the model, tokens, cost, time, and any error, with
 * the step's input and output. Rajeev: "our win will be on 2 factors:
 * automation of agents and accuracy of our recommendations" — this page is
 * where the automation side is seen, and where a wrong recommendation is
 * traced back to the step that produced it. Read-only.
 *
 * s126 (2 Oct 2026) — "Results per client" (AGENTIC_PLATFORM_PLAN "Measures, shown in Agent Runs, per client"; Rajeev:
 * "yes do 1 → 2 → 3"): time to the first useful startup, proposals accepted %, good fit, shortlist → intro → meeting →
 * pilot, the last 30 days against the design-partner target (3 intros + 1 meeting), and an estimate of minutes saved.
 */
import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, ChevronRight } from 'lucide-react';
import { agentRunsAPI, programmeScoutAPI } from '../../services/api';

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

const TYPE_LABEL = { government: 'Government', defence: 'Defence', corporate: 'Corporate', investor: 'Investor', incubator: 'Incubator' };

/**
 * s125 — Rajeev (1 Oct): "yes, add the Run now button". The Programme Scout agent reads startup requirements
 * (defence, government, corporate, investor programmes) every night at 00:20 IST; "Run now" starts tonight's
 * read straight away. Below it, every page it reads and what that page last returned.
 */
export function ProgrammeScoutPanel({ onStarted }) {
  const [sources, setSources] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const [show, setShow] = useState(false);
  const load = () => programmeScoutAPI.sources().then(d => setSources(d.sources || [])).catch(() => setSources([]));
  useEffect(() => { load(); }, []);
  const run = async () => {
    setBusy(true); setNote(null);
    try {
      const r = await programmeScoutAPI.run();
      setNote(r?.message || 'The Programme Scout is running.');
      onStarted?.();
    } catch (e) {
      setNote(e.message || 'Could not start the Programme Scout.');
    } finally {
      setBusy(false);
    }
  };
  const list = (sources || []).filter(s => s.role === 'source');
  const active = list.filter(s => s.status === 'active');
  const found = list.filter(s => s.origin === 'discovered' && s.status === 'active').length;
  const notOk = active.filter(s => s.last_status && s.last_status !== 'ok').length;
  return (
    <div id="tour-programme-scout" data-testid="programme-scout" style={{ border: '1px solid #eee', borderRadius: 12, background: '#fff', padding: 14, margin: '0 0 16px' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong style={{ fontWeight: 600, fontSize: 14.5, flex: '1 1 260px' }}>Programme Scout</strong>
        <button type="button" data-testid="programme-scout-run" onClick={run} disabled={busy} style={{ ...btn, background: '#C9A84C', borderColor: '#C9A84C', color: '#0B1E3F', fontWeight: 600 }}>
          {busy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Run now
        </button>
      </div>
      <p style={{ fontSize: 12.5, color: '#555', margin: '6px 0 0' }}>
        Finds startup requirements from defence, government, corporates and investors every night at 00:20 IST, and new programmes on listing sites by itself.
        {sources ? ` It reads ${active.length} page${active.length === 1 ? '' : 's'}${found ? ` (${found} found by itself)` : ''}${notOk ? `; ${notOk} did not answer last time` : ''}.` : ''}
      </p>
      {note && <p role="status" data-testid="programme-scout-note" style={{ fontSize: 12.5, background: '#F4F7FB', borderRadius: 8, padding: '6px 10px', margin: '8px 0 0' }}>{note}</p>}
      {list.length > 0 && (
        <button type="button" onClick={() => setShow(v => !v)} style={{ ...btn, marginTop: 8 }} data-testid="programme-scout-toggle">
          <ChevronRight size={13} style={{ transform: show ? 'rotate(90deg)' : undefined }} /> {show ? 'Hide' : 'Show'} the pages it reads
        </button>
      )}
      {show && (
        <table data-testid="programme-scout-sources" style={{ width: '100%', fontSize: 12, marginTop: 8, borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left', color: '#777' }}><th>Page</th><th>Who asks</th><th>How added</th><th>Last result</th><th>Startups, 30 days</th></tr></thead>
          <tbody>
            {list.map(s => (
              <tr key={s.key} style={{ borderTop: '1px solid #f2f2f2', color: s.status === 'active' ? '#1a1a1a' : '#999' }}>
                <td style={{ padding: '4px 6px 4px 0' }}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a></td>
                <td>{TYPE_LABEL[s.publisher_type] || s.publisher_type}</td>
                <td>{s.origin === 'discovered' ? 'Found by the agent' : 'Added by OpenI'}{s.status !== 'active' ? ` · ${s.status === 'dead' ? 'retired' : 'no official page'}` : ''}</td>
                <td>{s.last_status ? `${s.last_status === 'ok' ? `${s.last_found} open` : s.last_status}${s.last_run_at ? ` · ${when(s.last_run_at)}` : ''}` : 'not read yet'}</td>
                {/* s125 — what startups did with this page's requirements (the Scout learns from it). */}
                <td>{`${s.views_30d || 0} seen · ${s.clicks_30d || 0} opened`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/** s126 — "8 min", "3 h", "2 days"; null → "—". */
export function minutesText(m) {
  if (m == null) return '—';
  if (m < 60) return `${m} min`;
  if (m < 48 * 60) return `${Math.round(m / 60)} h`;
  return `${Math.round(m / 1440)} days`;
}

/** s126 — "1 meeting", "3 intros". */
export function plural(n, word) {
  const v = Number(n || 0);
  return `${v} ${word}${v === 1 ? '' : 's'}`;
}

/** s126 — the design-partner target for 30 days: 3 intros and 1 meeting. */
export function targetMet(l30) {
  return !!l30 && (l30.intros || 0) >= 3 && (l30.meetings || 0) >= 1;
}

const th = { textAlign: 'left', fontWeight: 600, fontSize: 12, color: '#666', padding: '6px 8px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' };
const td = { padding: '8px', borderBottom: '1px solid #f4f4f4', verticalAlign: 'top', fontSize: 13 };

export function ClientMeasuresPanel() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [demo, setDemo] = useState(true);
  useEffect(() => {
    let live = true;
    agentRunsAPI.measures().then(d => { if (live) setData(d); }).catch(e => { if (live) setErr(e.message || 'Could not load the client measures'); });
    return () => { live = false; };
  }, []);
  const rows = (data?.clients || []).filter(c => demo || !c.demo);
  const f = data?.formula;
  return (
    <div id="tour-agent-runs-clients" data-testid="client-measures" style={{ border: '1px solid #eee', borderRadius: 12, background: '#fff', padding: 14, margin: '0 0 16px' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: 15, fontWeight: 600 }}>Results per client</strong>
        <span style={{ fontSize: 12.5, color: '#666', flex: '1 1 320px' }}>What the Innovation Agent did for each client: how fast it found a startup they kept, how many of its suggestions they accepted, and how far startups moved.</span>
        <label style={{ fontSize: 12.5, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" data-testid="client-measures-demo" checked={demo} onChange={e => setDemo(e.target.checked)} /> Show demo accounts</label>
      </div>
      {err && <p style={{ color: '#A33', fontSize: 13 }}>{err}</p>}
      {!data && !err && <div style={{ display: 'flex', gap: 8, color: '#666', marginTop: 8 }}><Loader2 className="animate-spin" size={16} /> Loading…</div>}
      {data && !rows.length && <p data-testid="client-measures-empty" style={{ fontSize: 13, color: '#666', margin: '8px 0 0' }}>No client has used the Innovation Agent yet.</p>}
      {rows.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead><tr>
              <th style={th}>Client</th><th style={th} title="From when the agent started for them (the later of sign-up and their first brief) to the first startup they shortlisted. Target: under 10 min.">First useful startup</th>
              <th style={th} title="Of the actions the agent proposed that the client decided on, how many they accepted.">Suggestions accepted</th>
              <th style={th} title="Latest nightly accuracy: of the startups an admin labelled, how many are good fits.">Good fit</th>
              <th style={th}>Shortlisted → Intro → Meeting → Pilot</th>
              <th style={th} title="Design-partner target: 3 intros and 1 meeting in 30 days.">Last 30 days</th>
              <th style={th} title="Estimate">Time saved</th>
            </tr></thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} data-testid="client-measures-row">
                  <td style={td}><div style={{ fontWeight: 600 }}>{c.company}</div><div style={{ fontSize: 11.5, color: '#888' }}>{c.role}{c.demo ? ' · demo' : ''}</div></td>
                  <td style={{ ...td, color: c.first_useful_min != null && c.first_useful_min <= 10 ? '#2E7D4F' : undefined }}>{minutesText(c.first_useful_min)}</td>
                  <td style={td}>{c.proposals.accepted_pct == null ? '—' : `${c.proposals.accepted_pct}%`}
                    <div style={{ fontSize: 11.5, color: '#888' }}>{c.proposals.done} done · {c.proposals.dismissed} dismissed · {c.proposals.open} open</div></td>
                  <td style={td}>{c.good_fit?.pct == null ? '—' : `${c.good_fit.pct}%`}{c.good_fit ? <div style={{ fontSize: 11.5, color: '#888' }}>{c.good_fit.good} of {c.good_fit.labeled} labelled</div> : null}</td>
                  <td style={td} data-testid="client-measures-funnel">{c.funnel.shortlisted} → {c.funnel.intro} → {c.funnel.meeting} → {c.funnel.pilot}</td>
                  <td style={td} data-testid="client-measures-last30">{plural(c.funnel.last30?.intros, 'intro')} · {plural(c.funnel.last30?.meetings, 'meeting')}
                    {targetMet(c.funnel.last30) && <div style={{ fontSize: 11.5, color: '#2E7D4F', fontWeight: 600 }}>Target met</div>}</td>
                  <td style={td}>{minutesText(c.minutes_saved)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {f && <p data-testid="client-measures-formula" style={{ fontSize: 11.5, color: '#888', margin: '8px 0 0' }}>
        Time saved is an estimate: {f.minutes_per_find} min for each startup the agent found that the client kept, plus {Object.entries(f.minutes_per_action).map(([k, v]) => `${v} min per ${k.replace(/_/g, ' ')}`).join(', ')} the agent did.</p>}
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
      <h1 id="tour-page-admin-agent-runs" style={{ fontSize: 24, fontWeight: 600, margin: '4px 0 6px' }}>Agent Runs</h1>
      <p style={{ fontSize: 14, color: '#555', margin: 0, maxWidth: '75ch' }}>
        Every run of OpenI's agents, step by step: which agent or tool ran, the model, tokens, cost, time and any error. Open a run to see what each step received and returned.
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '14px 0', fontSize: 13 }} data-testid="runs-summary" id="tour-agent-runs-summary">
        <span><strong style={{ fontWeight: 600 }}>{runs ? runs.length : '…'}</strong> runs shown</span>
        <span><strong style={{ fontWeight: 600 }}>{done.length ? `${Math.round((ok / done.length) * 100)}%` : '—'}</strong> finished OK</span>
        <span><strong style={{ fontWeight: 600 }}>{usd(cost)}</strong> model cost</span>
      </div>
      <ClientMeasuresPanel />
      <ProgrammeScoutPanel onStarted={() => setTimeout(() => setTick(t => t + 1), 1500)} />
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
