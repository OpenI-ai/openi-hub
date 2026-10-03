/**
 * My Grants — a startup's grants from government bodies (s127, 3 Oct 2026). The other half of Disburse Grants: the
 * startup sees each milestone, what has been paid (date + the treasury's reference) and submits proof for its NEXT
 * milestone. OpenI records the payments; the body pays through its own treasury.
 */
import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { grantAPI } from '../../services/api';
import { inr } from './government/GrantsDisburse';

const G = '#D0A848';
const ON_GOLD = '#2A2A2E';
const MUTED = '#4b5563';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const input = { width: '100%', padding: '9px 11px', border: '1px solid #e5e7eb', borderRadius: 9, fontSize: 14, boxSizing: 'border-box', minWidth: 0 };
const btn = (primary = true) => ({ padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  background: primary ? G : '#fff', color: primary ? ON_GOLD : '#374151', border: primary ? 'none' : '1px solid #e5e7eb' });
const LABEL = { pending: 'Not started', submitted: 'Proof sent — waiting for approval', approved: 'Approved — payment on its way', paid: 'Paid' };

function ProofForm({ grant, tranche, onDone }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ evidence: '', evidence_url: '' });
  const [busy, setBusy] = useState(false);
  if (!open) return <button data-testid="mygrants-proof-open" style={btn()} onClick={() => setOpen(true)}>{tranche.status === 'submitted' ? 'Update proof' : 'Submit proof'}</button>;
  const save = async () => {
    setBusy(true);
    try { await grantAPI.submitProof(grant.id, tranche.id, f); toast.success('Proof sent. The funder has been emailed.'); setOpen(false); onDone(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div data-testid="mygrants-proof-form" style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 10, padding: 12, marginTop: 8 }}>
      <label style={{ fontSize: 12, color: MUTED, display: 'block' }}>What you achieved for this milestone
        <textarea aria-label="What you achieved" data-testid="mygrants-proof-text" style={{ ...input, minHeight: 70 }} value={f.evidence} onChange={e => setF({ ...f, evidence: e.target.value })} />
      </label>
      <label style={{ fontSize: 12, color: MUTED, display: 'block', marginTop: 8 }}>Link to proof (optional — a report, demo or photos)
        <input aria-label="Link to proof" style={input} value={f.evidence_url} onChange={e => setF({ ...f, evidence_url: e.target.value })} placeholder="https://" />
      </label>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <button data-testid="mygrants-proof-submit" style={btn()} disabled={busy} onClick={save}>{busy ? 'Sending…' : 'Send proof'}</button>
        <button style={btn(false)} onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

export default function MyGrants() {
  const [grants, setGrants] = useState(null);
  const load = useCallback(() => grantAPI.mine().then(r => setGrants(r.grants || [])).catch(e => { toast.error(e.message); setGrants([]); }), []);
  useEffect(() => { load(); }, [load]);
  return (
    <div id="tour-page-my-grants" data-testid="my-grants-page" style={{ padding: 'clamp(14px, 4vw, 28px)', maxWidth: 1000, background: '#f5f5f5', minHeight: '100%' }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>My Grants</h1>
      <p style={{ margin: '4px 0 16px', color: MUTED, fontSize: 13 }}>Grants awarded to you by government bodies on OpenI, milestone by milestone.</p>
      {grants === null && <div style={{ color: MUTED }}>Loading…</div>}
      {grants && !grants.length && (
        <div data-testid="mygrants-empty" style={{ ...card, padding: 18, color: MUTED, fontSize: 14, lineHeight: 1.5 }}>
          No grants yet. When a government body awards you a grant on OpenI it appears here, and you are emailed.
          Looking for funding now? See <a href="/dashboard/marketplace" style={{ color: '#7a5f17', fontWeight: 700 }}>Challenges &amp; Apply</a>.
        </div>
      )}
      {(grants || []).map(g => (
        <div key={g.id} data-testid="mygrants-grant" style={{ ...card, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{g.scheme_name}</div>
              <div style={{ fontSize: 13, color: MUTED }}>from {g.funder_name}{g.purpose ? ` · ${g.purpose}` : ''}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13 }}>
              <div><strong>{inr(g.disbursed)}</strong> of {inr(g.amount)} received</div>
              <div style={{ color: g.status === 'completed' ? '#15803d' : MUTED }}>{g.status === 'completed' ? 'Fully paid' : 'Active'}</div>
            </div>
          </div>
          {g.tranches.map(t => (
            <div key={t.id} data-testid="mygrants-tranche" style={{ borderTop: '1px solid #f3f4f6', padding: '10px 0', marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 14, minWidth: 0 }}><strong>{t.seq}. {inr(t.amount)}</strong> — {t.milestone}</div>
                <span style={{ fontSize: 12, color: t.status === 'paid' ? '#15803d' : MUTED, fontWeight: 600 }}>{LABEL[t.status] || t.status}</span>
              </div>
              {t.status === 'paid' && <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Paid {String(t.paid_at).slice(0, 10)} · ref {t.payment_ref}</div>}
              {t.evidence && t.status !== 'paid' && <div style={{ fontSize: 12, color: MUTED, marginTop: 4, overflowWrap: 'anywhere' }}>Your proof: {t.evidence}</div>}
              {g.next && g.next.id === t.id && ['pending', 'submitted'].includes(t.status) && (
                <div style={{ marginTop: 6 }}><ProofForm grant={g} tranche={t} onDone={load} /></div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
