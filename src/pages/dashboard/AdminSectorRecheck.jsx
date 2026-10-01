/**
 * s124 (30 Sep 2026) — admin "Sector re-check". Rajeev: "yes, do the Financial
 * Services re-check" … "this can be client credibility issue".
 *
 * 3,256 startups are filed under "Financial Services". OpenI's analyst re-reads
 * each one and proposes a sector from OpenI's own list (keeping "Financial
 * Services" for real banks and incumbents), with a reason and a confidence, and
 * flags companies that are not startups. NOTHING changes until an admin approves
 * here; each approval is audited, and a profile edited meanwhile is left alone.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, Loader2, Play, RefreshCw, X } from 'lucide-react';
import { sectorRecheckAPI } from '../../services/api';

const G = '#D0A848';
const btn = { fontSize: 13, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e2e2', background: '#fff', color: '#333', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const TABS = [['pending', 'To review'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['kept', 'Kept as is'], ['stale', 'Changed meanwhile']];
const CONF = { high: { bg: '#E7F4EC', fg: '#2E7D4F' }, medium: { bg: '#FFF7E0', fg: '#8A6A1C' }, low: { bg: '#f3f3f3', fg: '#666' } };

/** The line under the title: how far the analyst has got. */
export function recheckStatusText(d) {
  if (!d) return '';
  const c = d.counts || {};
  const done = (c.pending || 0) + (c.kept || 0) + (c.approved || 0) + (c.rejected || 0) + (c.stale || 0);
  const run = d.run;
  if (run?.running) return `The analyst is reading startups… ${run.checked} checked so far in this run.`;
  if (run?.status === 'no_model') return 'The analyst is not available right now (no AI model); nothing was checked.';
  if (!done) return `${d.still_filed.toLocaleString('en-IN')} startups are filed under "${d.from}". Press "Start the re-check" and the analyst reads each one.`;
  return `${done.toLocaleString('en-IN')} checked · ${(c.pending || 0).toLocaleString('en-IN')} to review · ${(c.kept || 0).toLocaleString('en-IN')} kept as "${d.from}" · ${d.still_filed.toLocaleString('en-IN')} still filed under it.`;
}

/**
 * s124 (1 Oct 2026) — Rajeev read "Financial Services → MarTech" as one sector.
 * Each side now says what it is: [grey, bold] labels for a row on this tab.
 */
export function sectorLabels(i, tab) {
  if (tab === 'approved') return [`Was: ${i.from_sector}`, `Now: ${i.proposed_sector}`];
  if (tab === 'kept') return [`Now: ${i.from_sector}`, 'Stays as it is'];
  if (tab === 'stale') return [`Was: ${i.from_sector}`, `Proposed: ${i.proposed_sector}`];
  return [`Now: ${i.from_sector}`, `Proposed: ${i.proposed_sector}`];
}

/** What the page says while a decision saves (~0.7 s a startup on production). */
export function busyText(decision, n) {
  const secs = Math.max(1, Math.ceil(n * 0.7));
  return `${decision === 'approve' ? 'Approving' : 'Rejecting'} ${n} startup${n === 1 ? '' : 's'}… about ${secs} second${secs === 1 ? '' : 's'}.`;
}

export default function AdminSectorRecheck() {
  const [tab, setTab] = useState('pending');
  const [confidence, setConfidence] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [picked, setPicked] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState('');

  const load = useCallback(() => sectorRecheckAPI.overview({ status: tab, confidence: confidence || undefined, limit: 100 })
    .then((r) => { setData(r); setError(false); }).catch(() => setError(true)), [tab, confidence]);
  useEffect(() => { setPicked(new Set()); load(); }, [load]);
  useEffect(() => {
    if (!data?.run?.running) return undefined;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [data?.run?.running, load]);

  const start = async () => {
    setBusy(true);
    try { await sectorRecheckAPI.run(); toast.success('The analyst started. This page updates as it goes.'); await load(); }
    catch (err) { toast.error(err.message || 'Could not start.'); }
    finally { setBusy(false); }
  };
  const decide = async (decision) => {
    const ids = [...picked];
    if (!ids.length) return;
    setBusy(true);
    setSaving(busyText(decision, ids.length));
    try {
      const r = await sectorRecheckAPI.decide(ids, decision);
      toast.success(decision === 'approve'
        ? `${r.approved} sector${r.approved === 1 ? '' : 's'} changed${r.stale ? `; ${r.stale} left alone (edited meanwhile)` : ''}.`
        : `${r.rejected} proposal${r.rejected === 1 ? '' : 's'} rejected; nothing changed.`);
      setPicked(new Set());
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not save.');
    } finally {
      setBusy(false);
      setSaving('');
    }
  };
  const items = data?.items || [];
  const allPicked = items.length > 0 && items.every(i => picked.has(i.id));
  const toggle = id => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '8px 4px 40px' }} data-testid="sector-recheck">
      <h1 id="tour-page-admin-sector-recheck" style={{ fontSize: 24, fontWeight: 600, margin: '4px 0 6px' }}>Sector re-check</h1>
      <p style={{ fontSize: 13.5, color: '#555', margin: '0 0 12px', maxWidth: 820 }}>
        Startups filed under the wrong sector look wrong to every client who opens them. OpenI's analyst re-reads each startup filed
        under "Financial Services" and proposes the right sector from OpenI's own list, with its reason. Nothing changes until you approve it here.
      </p>

      <div id="tour-sector-recheck-status" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '10px 14px' }}>
        <span data-testid="recheck-status" style={{ fontSize: 13.5, flex: '1 1 400px' }}>{error ? 'Could not load the re-check just now.' : recheckStatusText(data)}</span>
        <button type="button" data-testid="recheck-start" onClick={start} disabled={busy || !data || data.run?.running} style={{ ...btn, borderColor: G }}>
          {data?.run?.running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Start the re-check</button>
        <button type="button" onClick={load} style={btn}><RefreshCw size={14} /> Refresh</button>
      </div>

      {(data?.proposed_by_sector || []).length > 0 && (
        <div data-testid="recheck-by-sector" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0 0' }}>
          {data.proposed_by_sector.map(s => <span key={s.sector} style={{ fontSize: 12, background: '#f6f6f6', borderRadius: 999, padding: '3px 10px' }}>→ {s.sector}: <b>{s.n}</b></span>)}
        </div>
      )}

      <div id="tour-sector-recheck-review" style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {TABS.map(([k, label]) => (
            <button key={k} type="button" data-testid={`recheck-tab-${k}`} onClick={() => setTab(k)}
              style={{ ...btn, background: tab === k ? '#0B1E3F' : '#fff', color: tab === k ? '#fff' : '#333' }}>
              {label}{data?.counts?.[k] ? ` (${data.counts[k].toLocaleString('en-IN')})` : ''}</button>
          ))}
          <select value={confidence} onChange={e => setConfidence(e.target.value)} aria-label="Confidence" style={{ ...btn, marginLeft: 'auto' }}>
            <option value="">Any confidence</option><option value="high">High confidence</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
        </div>

        {tab === 'pending' && items.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0' }}>
            <label style={{ fontSize: 13, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" data-testid="recheck-pick-all" checked={allPicked} onChange={() => setPicked(allPicked ? new Set() : new Set(items.map(i => i.id)))} />
              Select all on this page</label>
            <span style={{ fontSize: 12.5, color: '#777' }}>{picked.size} selected</span>
            {saving && <span data-testid="recheck-saving" style={{ fontSize: 12.5, color: '#8A6A1C', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Loader2 size={13} className="animate-spin" /> {saving}</span>}
            <button type="button" data-testid="recheck-approve" disabled={busy || !picked.size} onClick={() => decide('approve')} style={{ ...btn, marginLeft: 'auto', borderColor: '#2E7D4F', color: '#2E7D4F' }}><Check size={14} /> Approve selected</button>
            <button type="button" data-testid="recheck-reject" disabled={busy || !picked.size} onClick={() => decide('reject')} style={btn}><X size={14} /> Reject selected</button>
          </div>
        )}

        {data && !items.length && <p data-testid="recheck-empty" style={{ fontSize: 13.5, color: '#666' }}>Nothing here.</p>}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 6 }}>
          <tbody>
            {items.map(i => (
              <tr key={i.id} data-testid="recheck-row" style={{ borderTop: '1px solid #f0f0f0', verticalAlign: 'top' }}>
                {tab === 'pending' && <td style={{ padding: '8px 6px', width: 28 }}>
                  <input type="checkbox" aria-label={`Select ${i.company_name}`} checked={picked.has(i.id)} onChange={() => toggle(i.id)} /></td>}
                <td style={{ padding: '8px 6px', width: '26%' }}>
                  <Link to={`/dashboard/startups/${i.user_id}?by=user_id`} style={{ fontWeight: 600, color: '#0B1E3F' }}>{i.company_name}</Link>
                  {i.not_startup && <div data-testid="recheck-not-startup" style={{ fontSize: 11.5, color: '#A33', fontWeight: 600 }}>Probably not a startup</div>}
                </td>
                <td data-testid="recheck-sectors" style={{ padding: '8px 6px', width: '26%' }}>
                  <div style={{ color: '#888' }}>{sectorLabels(i, tab)[0]}</div>
                  <div style={{ fontWeight: 700 }}>{sectorLabels(i, tab)[1]}</div></td>
                <td style={{ padding: '8px 6px' }}>
                  {i.confidence && <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 999, marginRight: 6, background: CONF[i.confidence]?.bg, color: CONF[i.confidence]?.fg }}>{i.confidence}</span>}
                  <span style={{ color: '#555' }}>{i.reason}</span>
                  {i.decided_by && <div style={{ fontSize: 11.5, color: '#999' }}>by {i.decided_by}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
