/**
 * s124 (30 Sep 2026) — admin "Sector re-check". Rajeev: "yes, do the Financial
 * Services re-check" … "this can be client credibility issue".
 *
 * 3,256 startups are filed under "Financial Services". OpenI's analyst re-reads
 * each one and proposes a sector from OpenI's own list (keeping "Financial
 * Services" for real banks and incumbents), with a reason and a confidence, and
 * flags companies that are not startups. NOTHING changes until an admin approves
 * here; each approval is audited, and a profile edited meanwhile is left alone.
 *
 * s125 (1 Oct 2026) — Rajeev: "sector recheck is quite accurate … automate this
 * entire agent". The agent now approves its own HIGH-confidence proposals that
 * change a sector (after each run, and nightly with the new startups), audited the
 * same way; medium, low and "not a startup" without a sector change still wait
 * here. "Approve high confidence now" clears the backlog at once.
 *
 * s125 — Rajeev: "it's only working for Financial services. What about other startups
 * sectors?" -> a sector picker over all eight older broad sectors. "something that's
 * flagged as not a startup … it's appear as a startup to users" -> "Hide: not a startup"
 * takes it out of every client list (audited, Undo). "any startup where there is not
 * sufficient data to categorise it … hide till we've crawled enough data" -> "Hide until
 * more data": shown again automatically once the crawler fills its profile in.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, EyeOff, Loader2, Play, RefreshCw, Undo2, X } from 'lucide-react';
import { sectorRecheckAPI } from '../../services/api';

const G = '#D0A848';
const btn = { fontSize: 13, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e2e2', background: '#fff', color: '#333', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const TABS = [['pending', 'To review'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['kept', 'Kept as is'], ['stale', 'Changed meanwhile']];
const CONF = { high: { bg: '#E7F4EC', fg: '#2E7D4F' }, medium: { bg: '#FFF7E0', fg: '#8A6A1C' }, low: { bg: '#f3f3f3', fg: '#666' } };

/** s125 — what "Check all" really reads in one press (at most max_per_run). */
export function checkAllLabel(d) {
  const left = Number(d?.remaining ?? d?.still_filed ?? 0);
  const max = Number(d?.max_per_run || left);
  return left <= max ? `Check all ${left.toLocaleString('en-IN')}` : `Check the next ${max.toLocaleString('en-IN')}`;
}

/** s125 — the "keep going every night until done" line. */
export function nightlyText(d) {
  const left = Number(d?.remaining ?? 0);
  const max = Number(d?.max_per_run || 1);
  const n = d?.nightly || {};
  if (!left && n.done_at) return `Every startup in this sector has been read (finished ${new Date(n.done_at).toLocaleDateString('en-IN')}).`;
  const nights = Math.ceil(left / max);
  const base = `Keep going every night until done: ${left.toLocaleString('en-IN')} left, about ${nights} night${nights === 1 ? '' : 's'} at ${max.toLocaleString('en-IN')} a night (03:45 IST).`;
  if (!n.on) return base;
  return `${base} On${n.requested_by ? ` (switched on by ${n.requested_by})` : ''}${n.last_run_at ? `; last night read ${Number(n.last_checked || 0).toLocaleString('en-IN')}` : ''}.`;
}

/** The line under the title: how far the analyst has got. */
export function recheckStatusText(d) {
  if (!d) return '';
  const c = d.counts || {};
  const done = (c.pending || 0) + (c.kept || 0) + (c.approved || 0) + (c.rejected || 0) + (c.stale || 0);
  const run = d.run;
  if (run?.running) return `The analyst is reading startups… ${run.checked} checked so far in this run.`;
  if (run?.status === 'no_model') return 'The analyst is not available right now (no AI model); nothing was checked.';
  // s125 — a specific sector is read by sample first (Rajeev: "More sectors in the list").
  if (d.group === 'specific') {
    if (!done) return `${d.still_filed.toLocaleString('en-IN')} startups are filed under "${d.from}". Press "Check a sample" and the analyst reads ${d.sample_size} of them, so you see how many are mis-filed before reading them all.`;
    const mis = done - (c.kept || 0);
    return `${done.toLocaleString('en-IN')} checked · ${mis.toLocaleString('en-IN')} look mis-filed (${Math.round((mis / done) * 100)}%) · ${(c.pending || 0).toLocaleString('en-IN')} to review · ${d.still_filed.toLocaleString('en-IN')} still filed under it.`;
  }
  if (!done) return `${d.still_filed.toLocaleString('en-IN')} startups are filed under "${d.from}". Press "Start the re-check" and the analyst reads each one.`;
  return `${done.toLocaleString('en-IN')} checked · ${(c.pending || 0).toLocaleString('en-IN')} to review · ${(c.kept || 0).toLocaleString('en-IN')} kept as "${d.from}" · ${d.still_filed.toLocaleString('en-IN')} still filed under it.`;
}

/** s125: the line about the agent's own approvals (high confidence). */
export function autoText(d) {
  const a = d?.auto;
  if (!a) return '';
  if (!a.enabled) return 'Auto-approve is off on this server: every proposal waits for you.';
  if (a.running) return 'The agent is approving its high-confidence proposals now (about 0.7 s each)…';
  const n = v => Number(v || 0).toLocaleString('en-IN');
  return `Auto-approve is on for high confidence: ${n(a.approved_by_agent)} approved by the agent so far${a.waiting ? `, ${n(a.waiting)} waiting for its next pass` : ''}. Medium and low confidence wait for you.`;
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

/** s125: the badge on a hidden company. */
export function hiddenText(reason) {
  if (reason === 'not_a_startup') return 'Hidden from clients: not a startup';
  if (reason === 'insufficient_data') return 'Hidden from clients until its profile has enough data';
  return '';
}

/** s125: the toast after hiding. */
export function hideDoneText(reason, n) {
  const what = `${n} compan${n === 1 ? 'y' : 'ies'} hidden from every client list`;
  return reason === 'insufficient_data' ? `${what}; each comes back by itself once its profile has enough data.` : `${what}. "Undo" on the Rejected tab shows one again.`;
}

export default function AdminSectorRecheck() {
  const [from, setFrom] = useState('Financial Services');
  const [tab, setTab] = useState('pending');
  const [confidence, setConfidence] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [picked, setPicked] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState('');

  // fresh: re-read the list of sectors (opening the page, or choosing another sector); the 5-second polling does not.
  const load = useCallback((fresh) => sectorRecheckAPI.overview({ from, status: tab, confidence: confidence || undefined, limit: 100, fresh: fresh === true })
    .then((r) => { setData(r); setError(false); }).catch(() => setError(true)), [from, tab, confidence]);
  useEffect(() => { setPicked(new Set()); load(true); }, [load]);
  const working = !!(data?.run?.running || data?.auto?.running);
  useEffect(() => {
    if (!working) return undefined;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [working, load]);

  const start = async () => {
    setBusy(true);
    try { await sectorRecheckAPI.run(from); toast.success('The analyst started. This page updates as it goes.'); await load(); }
    catch (err) { toast.error(err.message || 'Could not start.'); }
    finally { setBusy(false); }
  };
  const setNightly = async (on) => {
    // Flip at once (the box must answer the click), and put it back if the save fails.
    const was = !!data?.nightly?.on;
    setData(d => ({ ...d, nightly: { ...(d?.nightly || {}), on } }));
    setBusy(true);
    try {
      await sectorRecheckAPI.nightly(from, on);
      toast.success(on ? 'The analyst will keep going every night until this sector is done.' : 'Nightly re-check of this sector switched off.');
      await load();
    } catch (err) {
      setData(d => ({ ...d, nightly: { ...(d?.nightly || {}), on: was } }));
      toast.error(err.message || 'Could not save that.');
    } finally { setBusy(false); }
  };
  // s125: after a sample, read every startup still filed under a specific sector.
  const startAll = async () => {
    setBusy(true);
    try { await sectorRecheckAPI.run(from, { all: true }); toast.success('The analyst is reading all of them. This page updates as it goes.'); await load(); }
    catch (err) { toast.error(err.message || 'Could not start.'); }
    finally { setBusy(false); }
  };
  const autoNow = async () => {
    setBusy(true);
    try {
      const r = await sectorRecheckAPI.autoApprove(from);
      toast.success(r.status === 'nothing' ? 'Nothing waiting: every high-confidence proposal is already approved.'
        : `The agent is approving ${Number(r.waiting || 0).toLocaleString('en-IN')} high-confidence proposals. This page updates as it goes.`);
      await load();
    } catch (err) { toast.error(err.message || 'Could not start.'); }
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
  const hide = async (reason) => {
    const ids = [...picked];
    if (!ids.length) return;
    setBusy(true);
    try {
      const r = await sectorRecheckAPI.hide(ids, reason);
      toast.success(hideDoneText(reason, (r.hidden || []).length));
      setPicked(new Set());
      await load();
    } catch (err) { toast.error(err.message || 'Could not hide them.'); }
    finally { setBusy(false); }
  };
  const unhide = async (id) => {
    setBusy(true);
    try { await sectorRecheckAPI.unhide([id]); toast.success('Shown to clients again.'); await load(); }
    catch (err) { toast.error(err.message || 'Could not show it again.'); }
    finally { setBusy(false); }
  };
  const items = data?.items || [];
  const allPicked = items.length > 0 && items.every(i => picked.has(i.id));
  const toggle = id => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '8px 4px 40px' }} data-testid="sector-recheck">
      <h1 id="tour-page-admin-sector-recheck" style={{ fontSize: 24, fontWeight: 600, margin: '4px 0 6px' }}>Sector re-check</h1>
      <p style={{ fontSize: 13.5, color: '#555', margin: '0 0 12px', maxWidth: 820 }}>
        Startups filed under the wrong sector look wrong to every client who opens them. OpenI's analyst re-reads each startup filed
        under one of OpenI's eight older broad sectors, or under one of its specific sectors (checked by a sample first), and proposes the right sector from OpenI's own list, with its reason. High-confidence proposals are approved by
        the agent itself (audited, and never over a profile someone edited); the rest wait for you here. A company that is not a startup, or
        has too little data to place, can be hidden from every client list.
      </p>

      <label style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8, margin: '0 0 10px' }}>Sector to re-check
        <select data-testid="recheck-sector" value={from} onChange={e => setFrom(e.target.value)} style={btn}>
          {/* s125 — the eight older broad sectors, then OpenI's specific sectors that have startups (largest first). */}
          {(() => {
            const list = data?.sectors?.length ? data.sectors : [{ name: from, group: 'legacy' }];
            const opt = s => <option key={s.name} value={s.name}>{s.name}{s.group === 'specific' && s.still_filed ? ` · ${Number(s.still_filed).toLocaleString('en-IN')}` : ''}{s.pending ? ` (${Number(s.pending).toLocaleString('en-IN')} to review)` : ''}</option>;
            const broad = list.filter(s => s.group !== 'specific');
            const specific = list.filter(s => s.group === 'specific');
            return specific.length ? (<>
              <optgroup label="Older broad sectors">{broad.map(opt)}</optgroup>
              <optgroup label="Specific sectors (startups filed)">{specific.map(opt)}</optgroup>
            </>) : broad.map(opt);
          })()}
        </select>
      </label>

      <div id="tour-sector-recheck-status" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '10px 14px' }}>
        <span data-testid="recheck-status" style={{ fontSize: 13.5, flex: '1 1 400px' }}>{error ? 'Could not load the re-check just now.' : recheckStatusText(data)}</span>
        <button type="button" data-testid="recheck-start" onClick={start} disabled={busy || !data || data.run?.running} style={{ ...btn, borderColor: G }}>
          {data?.run?.running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} {data?.group === 'specific' ? `Check a sample (${data.sample_size})` : 'Start the re-check'}</button>
        {/* s125 — Rajeev: "yes, make both changes". The button says what one press really reads (at most max_per_run). */}
        {data?.group === 'specific' && Object.values(data.counts || {}).some(Boolean) && (data.remaining ?? 0) > 0 && (
          <button type="button" data-testid="recheck-start-all" onClick={startAll} disabled={busy || data.run?.running} style={btn}>
            <Play size={14} /> {checkAllLabel(data)}</button>
        )}
        <button type="button" onClick={load} style={btn}><RefreshCw size={14} /> Refresh</button>
        {/* s125 — "Keep going every night until done": the nightly run reads the next batch of this sector each night. */}
        {data?.group === 'specific' && ((data.remaining ?? 0) > 0 || data.nightly?.done_at) && (
          <label data-testid="recheck-nightly-label" style={{ flex: '1 1 100%', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8, color: '#333' }}>
            <input type="checkbox" data-testid="recheck-nightly" checked={!!data.nightly?.on} disabled={busy || (data.remaining ?? 0) === 0}
              onChange={e => setNightly(e.target.checked)} />
            {nightlyText(data)}
          </label>
        )}
        {data?.auto && (
          <div id="tour-sector-recheck-auto" style={{ flex: '1 1 100%', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px dashed #eee', paddingTop: 8 }}>
            <span data-testid="recheck-auto" style={{ fontSize: 13, color: '#2E7D4F', flex: '1 1 400px' }}>{autoText(data)}</span>
            {data.auto.enabled && (
              <button type="button" data-testid="recheck-auto-now" onClick={autoNow} disabled={busy || data.auto.running || !data.auto.waiting}
                style={{ ...btn, borderColor: '#2E7D4F', color: '#2E7D4F' }}>
                {data.auto.running ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve high confidence now</button>
            )}
          </div>
        )}
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
            <button type="button" data-testid="recheck-hide-not-startup" disabled={busy || !picked.size} onClick={() => hide('not_a_startup')}
              title="Takes them out of every client list; Undo shows one again" style={{ ...btn, borderColor: '#A33', color: '#A33' }}><EyeOff size={14} /> Hide: not a startup</button>
            <button type="button" data-testid="recheck-hide-thin" disabled={busy || !picked.size} onClick={() => hide('insufficient_data')}
              title="Hidden until the crawler fills in its profile; then shown and re-checked by itself" style={btn}><EyeOff size={14} /> Hide until more data</button>
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
                  {i.hidden_reason && (
                    <div data-testid="recheck-hidden" style={{ fontSize: 11.5, color: '#555', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <EyeOff size={12} /> {hiddenText(i.hidden_reason)}
                      <button type="button" data-testid="recheck-unhide" disabled={busy} onClick={() => unhide(i.id)} style={{ ...btn, fontSize: 11.5, padding: '2px 8px' }}><Undo2 size={12} /> Undo</button>
                    </div>
                  )}
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
