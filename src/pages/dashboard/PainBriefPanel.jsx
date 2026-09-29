/**
 * s122 (29 Sep 2026) — Dentsu's "pain brief" for a prospect, in Brief Preview.
 *
 * "I do not start with generic 'AI disruption' talk. I start with observable
 * signals that map to board-level priorities." OpenI reads the prospect's
 * recent news and website, and an analyst drafts 3–5 pain points, each scored
 * on Dentsu's five vectors and linked to the signals it came from. The admin
 * ticks the ones they agree with and uses them as the brief's priorities.
 * Nothing is saved anywhere.
 */
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Radar, ExternalLink } from 'lucide-react';
import { briefPreviewAPI } from '../../services/api';

const G = '#D0A848';
const btn = { fontSize: 13, padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e2e2', background: '#fff', color: '#333', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const safeHref = (u) => (/^https?:\/\//i.test(String(u || '')) ? u : null);

function Severity({ n }) {
  return (
    <span aria-label={`Severity ${n} of 5`} title={`Severity ${n} of 5`} style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: 999, background: i <= n ? '#B4532A' : '#e6e0d4' }} />)}
    </span>
  );
}

export default function PainBriefPanel({ company, website, onUse }) {
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const [picked, setPicked] = useState({});

  const run = async () => {
    setBusy(true); setDraft(null);
    try {
      const d = await briefPreviewAPI.painBrief({ company: company.trim(), website: website?.trim() || undefined });
      setDraft(d);
      setPicked(Object.fromEntries((d.pains || []).map(p => [p.problem, true])));
    } catch (err) { toast.error(err.message || 'Could not draft pain points'); }
    finally { setBusy(false); }
  };
  const chosen = (draft?.pains || []).filter(p => picked[p.problem]);
  const news = (draft?.signals || []).filter(s => s.kind === 'news').length;
  const site = (draft?.signals || []).some(s => s.kind === 'website');

  return (
    <div data-testid="pain-brief" style={{ border: '1px solid #eee', borderRadius: 10, padding: 12, background: '#fff', display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" data-testid="pain-brief-run" style={{ ...btn, borderColor: G }} disabled={busy || company.trim().length < 2} onClick={run}>
          {busy ? <Loader2 className="animate-spin" size={14} /> : <Radar size={14} />} Draft pain points from public signals
        </button>
        <span style={{ fontSize: 12.5, color: '#777' }}>
          {busy ? 'Reading recent news and the website; this can take up to a minute…' : 'Reads the last 30 days of news and the website. Every point cites its sources.'}
        </span>
      </div>
      {draft && (
        <>
          <div style={{ fontSize: 12.5, color: '#666' }}>
            Based on {news} news item{news === 1 ? '' : 's'}{site ? ' and the website' : ''}.
            {draft.note && <span data-testid="pain-brief-note"> {draft.note}</span>}
          </div>
          {draft.pains.map(p => (
            <label key={p.problem} data-testid="pain-point" style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 8, borderTop: '1px solid #f2f2f2', paddingTop: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={Boolean(picked[p.problem])} onChange={e => setPicked(s => ({ ...s, [p.problem]: e.target.checked }))} style={{ marginTop: 3 }} />
              <span style={{ display: 'grid', gap: 3 }}>
                <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ fontWeight: 600, fontSize: 14 }}>{p.problem}</strong>
                  <Severity n={p.severity} />
                  {p.vector_label && <span style={{ fontSize: 11.5, color: '#8A6A1C', border: `1px solid ${G}`, borderRadius: 999, padding: '1px 8px', background: '#FBF6EA' }}>{p.vector_label}</span>}
                </span>
                {p.why && <span style={{ fontSize: 13, color: '#444' }}>{p.why}</span>}
                <span style={{ fontSize: 12, color: '#777', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  Sources:
                  {p.evidence.map(e => safeHref(e.url)
                    ? <a key={e.id} href={safeHref(e.url)} target="_blank" rel="noopener noreferrer" onClick={ev => ev.stopPropagation()}
                        style={{ color: '#555', display: 'inline-flex', alignItems: 'center', gap: 2 }}>{e.title.slice(0, 70)}{e.title.length > 70 ? '…' : ''} <ExternalLink size={10} /></a>
                    : <span key={e.id}>{e.title.slice(0, 70)}</span>)}
                </span>
                {p.startup_categories?.length > 0 && <span style={{ fontSize: 12, color: '#777' }}>Startups that could help: {p.startup_categories.join(' · ')}</span>}
              </span>
            </label>
          ))}
          {draft.pains.length > 0 && (
            <div>
              <button type="button" data-testid="pain-brief-use" style={{ ...btn, background: G, borderColor: G, color: '#152838', fontWeight: 600 }}
                disabled={!chosen.length} onClick={() => { onUse(chosen.map(p => p.problem)); toast.success(`Added ${chosen.length} pain point${chosen.length === 1 ? '' : 's'} as priorities.`); }}>
                Use {chosen.length} selected as priorities
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
