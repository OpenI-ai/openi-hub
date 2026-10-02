/**
 * s124 (30 Sep 2026) — the CEO view on a company's Innovation Brief (Innovation
 * Agent Phase 3). Rajeev: CEOs want to know "where to venture into adjacent
 * industries through startup acquisition", and who is attacking their market.
 *
 *   Your competitors   up to 3, named by the company (or suggested by the agent,
 *                      marked so); editing them refreshes the view
 *   What they are doing with startups
 *                      each competitor's startup acquisitions, investments and
 *                      partnerships in the last 12 months, from the news, each
 *                      with its source; "On OpenI" opens the startup
 *   Where to venture next
 *                      adjacent industries with why, and startups on OpenI small
 *                      enough to acquire, each checked by the analyst for this
 *                      company; "Shortlist" puts one in the pilot pipeline
 *   Startup programmes s126: open calls and challenges run by the competitors, and other live
 *                      programmes close to the company's priorities (from the Programme Scout)
 *   Board pack         the quarterly PDF for the board
 * s126: deals stay for 12 months — one found on an earlier read is kept, marked "seen on an earlier read".
 * It only reads and suggests; nothing is sent to anyone.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Crown, Download, RefreshCw, X } from 'lucide-react';

const G = '#C9A84C';
const NAVY = '#0B1E3F';
const btn = { fontSize: 13, padding: '7px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' };
const KIND = { acquired: 'Acquired', invested: 'Invested in', partnered: 'Partnered with' };
const KIND_COLOR = { acquired: '#7A3E9D', invested: '#1F7A4D', partnered: '#1D5C8C' };

const day = (d) => { const t = Date.parse(d); return Number.isFinite(t) ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; };

/** The status line under the title. */
export function ceoStatusText(v) {
  if (!v) return '';
  if (v.running) return 'Reading the news on your competitors… this takes a minute.';
  if (!v.competitors?.length) return 'Name up to 3 competitors and OpenI follows their startup deals for you.';
  if (!v.ran_at) return 'Not read yet: press Refresh.';
  return `Last read ${day(v.ran_at)}${v.deals_by === 'headlines' ? ' (from the headlines)' : ''}.`;
}

/** s126 — the line under a programme: who runs it, who asks, deadline, how close. */
export function programmeLine(p) {
  const parts = [];
  if (p.competitor) parts.push(`${p.competitor}`);
  if (p.publisher && p.publisher !== p.competitor) parts.push(p.publisher);
  if (p.who_asks) parts.push(p.who_asks);
  if (p.on_openi) parts.push('Posted on OpenI');
  parts.push(p.deadline ? `Apply by ${day(p.deadline)}` : 'Open');
  if (p.match != null) parts.push(`${p.match}% match`);
  return parts.join(' · ');
}

export default function CeoPanel({ load, save, run, download, shortlist }) {
  const [v, setV] = useState(null);
  const [error, setError] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [picked, setPicked] = useState(() => new Set());

  const fetchIt = useCallback(() => load().then((r) => { setV(r); setError(false); }).catch(() => setError(true)), [load]);
  useEffect(() => { fetchIt(); }, [fetchIt]);
  useEffect(() => {
    if (!v?.running) return undefined;
    const t = setInterval(fetchIt, 5000);
    return () => clearInterval(t);
  }, [v?.running, fetchIt]);

  const names = (v?.competitors || []).map(c => c.name);
  const max = v?.max_competitors || 3;

  const saveList = async (list) => {
    setBusy(true);
    try {
      const r = await save(list);
      setDraft('');
      if (r?.refreshing) toast.success('Saved. Reading the news on your competitors now.');
      else toast.success('Saved.');
      await fetchIt();
    } catch (err) {
      toast.error(err.message || 'Could not save your competitors.');
    } finally {
      setBusy(false);
    }
  };
  const add = (e) => {
    e.preventDefault();
    const name = draft.trim();
    if (!name || names.length >= max) return;
    saveList([...names, name]);
  };
  const refresh = async () => {
    setBusy(true);
    try {
      await run();
      await fetchIt();
    } catch (err) {
      toast.error(err.message || 'Could not refresh just now.');
    } finally {
      setBusy(false);
    }
  };
  const getPack = async () => {
    setDownloading(true);
    try {
      const { blob, name } = await download();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      toast.error(err.message || 'Could not prepare the board pack.');
    } finally {
      setDownloading(false);
    }
  };
  const doShortlist = async (s) => {
    try {
      await shortlist(s.user_id);
      setPicked(p => new Set(p).add(s.user_id));
      toast.success(`${s.name} shortlisted: it is in your pilot pipeline.`);
    } catch (err) {
      toast.error(err.message || 'Could not shortlist just now.');
    }
  };

  const suggested = (v?.competitors || []).some(c => c.source === 'agent');
  return (
    <section id="tour-brief-ceo" data-testid="ceo-view" style={{ marginTop: 16, background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Crown size={16} color={NAVY} />
        <strong style={{ fontSize: 15 }}>CEO view: your competitors and where to venture next</strong>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button type="button" data-testid="ceo-refresh" onClick={refresh} disabled={busy || !v || v.running || !names.length || Boolean(v.next_manual_at)}
            title={v?.next_manual_at ? 'Refreshed a few minutes ago' : undefined} style={{ ...btn, display: 'inline-flex', alignItems: 'center', gap: 5, opacity: (busy || v?.running || v?.next_manual_at || !names.length) ? 0.6 : 1 }}>
            <RefreshCw size={13} /> Refresh</button>
          <button type="button" data-testid="ceo-board-pack" onClick={getPack} disabled={downloading}
            style={{ ...btn, display: 'inline-flex', alignItems: 'center', gap: 5, borderColor: G }}>
            <Download size={13} /> {downloading ? 'Preparing…' : 'Board pack (PDF)'}</button>
        </span>
      </div>
      <p data-testid="ceo-status" style={{ fontSize: 12.5, color: '#666', margin: '6px 0 0' }}>{ceoStatusText(v)}</p>
      {error && <p style={{ fontSize: 13, color: '#A33' }}>Could not load your CEO view just now.</p>}

      {v && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>Your competitors{suggested ? ' (suggested by your agent: change them if they are not right)' : ''}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {(v.competitors || []).map(c => (
              <span key={c.name} data-testid="ceo-competitor" style={{ fontSize: 13, background: '#f6f6f6', borderRadius: 999, padding: '4px 6px 4px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {c.name}{c.source === 'agent' && <span style={{ fontSize: 11, color: '#8A6A1C' }}> · suggested</span>}
                <button type="button" aria-label={`Remove ${c.name}`} disabled={busy} onClick={() => saveList(names.filter(n => n !== c.name))}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'inline-flex' }}><X size={12} /></button>
              </span>
            ))}
            {names.length < max && (
              <form onSubmit={add} style={{ display: 'inline-flex', gap: 6 }}>
                <input data-testid="ceo-add-input" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add a competitor" maxLength={80}
                  style={{ fontSize: 13, padding: '5px 9px', borderRadius: 8, border: '1px solid #ddd', width: 170 }} />
                <button type="submit" data-testid="ceo-add" disabled={busy || !draft.trim()} style={{ ...btn, padding: '5px 10px' }}>Add</button>
              </form>
            )}
          </div>

          {names.length > 0 && (
            <div data-testid="ceo-ecosystem" style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>What they are doing with startups (last 12 months, from the news)</div>
              {names.map((n) => {
                const deals = (v.ecosystem || []).filter(d => d.competitor === n);
                return (
                  <div key={n} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: NAVY }}>{n}</div>
                    {!deals.length && <div style={{ fontSize: 12.5, color: '#777' }}>{v.ran_at ? 'No startup deal in the news in the last 12 months.' : 'Not read yet.'}</div>}
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {deals.map(d => (
                        <li key={`${d.kind}|${d.startup}`} data-testid="ceo-deal" data-kind={d.kind} style={{ fontSize: 13, padding: '3px 0', borderLeft: `3px solid ${KIND_COLOR[d.kind] || G}`, paddingLeft: 8, margin: '4px 0' }}>
                          <span style={{ color: KIND_COLOR[d.kind], fontWeight: 600 }}>{KIND[d.kind] || d.kind}</span>{' '}
                          <b>{d.startup}</b>
                          {d.on_openi && <> · <Link to={`/dashboard/startups/${d.on_openi.user_id}?by=user_id`} style={{ color: '#8A6A1C', fontSize: 12.5 }}>On OpenI</Link></>}
                          <div style={{ fontSize: 12, color: '#777' }}>
                            {d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: '#777' }}>{d.headline}</a> : d.headline}
                            {d.date ? ` · ${day(d.date)}` : ''}
                            {d.earlier && <span data-testid="ceo-deal-earlier"> · seen on an earlier read</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {(v.programmes?.competitors?.length > 0 || v.programmes?.in_sector?.length > 0) && (
            <div data-testid="ceo-programmes" style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>Startup programmes: what your competitors are asking startups for, and what else is open in your area</div>
              {[['competitors', 'Run by your competitors'], ['in_sector', 'Other open programmes close to your priorities']].map(([k, label]) => (v.programmes[k] || []).length > 0 && (
                <div key={k} data-testid={`ceo-programmes-${k}`} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{label}</div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {v.programmes[k].map(p => (
                      <li key={p.id} data-testid="ceo-programme" style={{ fontSize: 13, padding: '3px 0 3px 8px', borderLeft: `3px solid ${G}`, margin: '4px 0', overflowWrap: 'anywhere' }}>
                        {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: NAVY }}>{p.title}</a> : <b>{p.title}</b>}
                        <div style={{ fontSize: 12, color: '#777' }}>{programmeLine(p)}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {(v.adjacent || []).length > 0 && (
            <div data-testid="ceo-adjacent" style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>Where to venture next: adjacent industries, and startups small enough to acquire</div>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                {v.adjacent.map(a => (
                  <div key={a.industry} data-testid="ceo-adjacent-item" style={{ border: '1px solid #eee', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontWeight: 700, color: '#7A3E9D', fontSize: 14 }}>{a.industry}</div>
                    {a.why && <div style={{ fontSize: 12.5, color: '#555', margin: '2px 0 6px' }}>{a.why}</div>}
                    {!(a.startups || []).length && <div style={{ fontSize: 12.5, color: '#777' }}>{a.unchecked ? 'Startups found here are still being checked.' : 'No startup on OpenI fits this yet.'}</div>}
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
                      {(a.startups || []).map(s => (
                        <li key={s.user_id} data-testid="ceo-target" style={{ fontSize: 13, borderTop: '1px solid #f2f2f2', paddingTop: 5 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Link to={`/dashboard/startups/${s.user_id}?by=user_id`} style={{ fontWeight: 600, color: NAVY }}>{s.name}</Link>
                            {s.size && <span style={{ fontSize: 11.5, color: '#777' }}>{s.size}</span>}
                            {shortlist && (picked.has(s.user_id)
                              ? <span style={{ marginLeft: 'auto', fontSize: 12, color: '#1F7A4D' }}>Shortlisted</span>
                              : <button type="button" data-testid="ceo-shortlist" onClick={() => doShortlist(s)} style={{ ...btn, marginLeft: 'auto', padding: '3px 8px', fontSize: 12 }}>Shortlist</button>)}
                          </div>
                          {(s.reason || s.tagline) && <div style={{ fontSize: 12, color: '#666' }}>{s.reason || s.tagline}</div>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
