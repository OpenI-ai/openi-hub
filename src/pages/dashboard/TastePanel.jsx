/**
 * s122 (29 Sep 2026) — "What OpenI has learned from you": the SHOW step of the
 * personalisation loop (Rajeev approved capture → learn → show → use → measure).
 *
 * Each insight is a plain sentence with its evidence ("You often shortlist
 * early-stage startups (3 of 3 you acted on)"). The user keeps it or says
 * "Not me" — a rejected insight is never applied or suggested again. The
 * user's own priorities are never changed by any of this; learned taste only
 * nudges the order of startups inside a section.
 *
 * Always rendered (empty state included) so the page tour can point at it.
 */
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Check, X } from 'lucide-react';
import { briefAPI } from '../../services/api';

const btn = { fontSize: 12.5, padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e2e2', background: '#fff', color: '#333', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 };

export default function TastePanel({ onChanged }) {
  const [taste, setTaste] = useState(null);
  const [busy, setBusy] = useState(null);
  useEffect(() => {
    let live = true;
    briefAPI.taste().then(t => { if (live) setTaste(t); }).catch(() => { if (live) setTaste({ insights: [] }); });
    return () => { live = false; };
  }, []);
  const decide = async (key, decision) => {
    setBusy(key);
    try {
      setTaste(await briefAPI.decideTaste(key, decision));
      toast.success(decision === 'reject' ? 'Got it: OpenI will not use that.' : 'Kept. Your brief keeps using it.');
      onChanged?.();
    } catch (err) {
      toast.error(err.message || 'Could not save that');
    } finally {
      setBusy(null);
    }
  };
  const insights = taste?.insights || [];
  return (
    <section id="tour-brief-taste" data-testid="brief-taste" style={{ marginTop: 16, border: '1px solid #eee', borderRadius: 12, background: '#fff', padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Sparkles size={14} color="#8A6A1C" />
        <strong style={{ fontSize: 14, fontWeight: 600 }}>What OpenI has learned from you</strong>
        <span style={{ fontSize: 12, color: '#888' }}>From your shortlists, passes and the profiles you open. Your own priorities are never changed.</span>
      </div>
      {taste === null ? null : insights.length === 0 ? (
        <p data-testid="taste-empty" style={{ fontSize: 13, color: '#666', margin: '8px 0 0' }}>
          Nothing yet. As you shortlist startups and mark others "Not relevant", OpenI learns what you prefer and shows it here — you decide what it keeps.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 6 }}>
          {insights.map(i => (
            <li key={i.key} data-testid="taste-insight" data-status={i.status} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 13.5 }}>
              <span style={{ flex: '1 1 320px', minWidth: 0 }}>{i.text}</span>
              {i.status === 'keep' ? (
                <span style={{ fontSize: 12, color: '#2E7D4F', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Check size={12} /> Kept</span>
              ) : (
                <button type="button" disabled={busy === i.key} onClick={() => decide(i.key, 'keep')} style={btn}><Check size={12} /> Keep</button>
              )}
              <button type="button" disabled={busy === i.key} onClick={() => decide(i.key, 'reject')} style={btn} aria-label={`Not me: ${i.text}`}><X size={12} /> Not me</button>
            </li>
          ))}
        </ul>
      )}
      <p style={{ fontSize: 11.5, color: '#999', margin: '8px 0 0' }}>Only you and the OpenI team can see this. "Not me" removes an item for good.</p>
    </section>
  );
}
