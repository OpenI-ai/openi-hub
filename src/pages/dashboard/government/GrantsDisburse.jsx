/**
 * Disburse Grants — a government body's grant schemes, awards and milestone payments (s127, 3 Oct 2026).
 * Rajeev: "pls finish this wire up, Govt needs it. it's important for them". His choices: OpenI RECORDS each payment
 * the body makes through its own treasury (PFMS / bank: date + reference) and never moves money; a grant is released
 * in milestone tranches; any startup with an OpenI account can be awarded one. Rules live in the backend
 * (grantService.js); this page only offers what the next step allows.
 */
import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { grantAPI } from '../../../services/api';

const G = '#D0A848';
const ON_GOLD = '#2A2A2E';
const MUTED = '#4b5563';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const input = { width: '100%', padding: '9px 11px', border: '1px solid #e5e7eb', borderRadius: 9, fontSize: 14, boxSizing: 'border-box', minWidth: 0 };
const btn = (primary = true) => ({ padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  background: primary ? G : '#fff', color: primary ? ON_GOLD : '#374151', border: primary ? 'none' : '1px solid #e5e7eb' });
export const inr = n => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const STATUS = {
  pending: ['Waiting for the milestone', '#f3f4f6', '#374151'],
  submitted: ['Proof submitted', '#eff6ff', '#1d4ed8'],
  approved: ['Approved — record the payment', '#fff8ec', '#7a5f17'],
  paid: ['Paid', '#f0fdf4', '#15803d'],
};
const Chip = ({ s }) => { const [label, bg, fg] = STATUS[s] || [s, '#f3f4f6', '#374151'];
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: bg, color: fg, whiteSpace: 'nowrap' }}>{label}</span>; };

/** Default split for a new grant: 40 / 30 / 30, in whole rupees, last tranche takes the remainder. */
export function defaultTranches(amount) {
  const a = Math.round(Number(amount) || 0);
  if (a <= 0) return [{ amount: '', milestone: 'On signing the grant agreement' }, { amount: '', milestone: 'Prototype / first milestone' }, { amount: '', milestone: 'Final milestone and report' }];
  const t1 = Math.round(a * 0.4); const t2 = Math.round(a * 0.3);
  return [{ amount: t1, milestone: 'On signing the grant agreement' }, { amount: t2, milestone: 'Prototype / first milestone' }, { amount: a - t1 - t2, milestone: 'Final milestone and report' }];
}

function Stat({ label, value }) {
  return (
    <div style={{ ...card, padding: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function NewScheme({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', total_budget: '', description: '' });
  const [busy, setBusy] = useState(false);
  if (!open) return <button data-testid="grants-new-scheme" style={btn()} onClick={() => setOpen(true)}>New grant scheme</button>;
  const save = async () => {
    setBusy(true);
    try { const s = await grantAPI.createScheme({ ...f, total_budget: Number(f.total_budget) }); toast.success('Scheme created'); setOpen(false); onCreated(s); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div data-testid="grants-scheme-form" style={{ ...card, padding: 18, marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>New grant scheme</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        <label style={{ fontSize: 12, color: MUTED }}>Scheme name<input aria-label="Scheme name" style={input} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="e.g. Seed Support Scheme 2026" /></label>
        <label style={{ fontSize: 12, color: MUTED }}>Total budget (₹)<input aria-label="Total budget" style={input} inputMode="decimal" value={f.total_budget} onChange={e => setF({ ...f, total_budget: e.target.value })} placeholder="5000000" /></label>
      </div>
      <label style={{ fontSize: 12, color: MUTED, display: 'block', marginTop: 10 }}>What it funds (optional)<textarea aria-label="What it funds" style={{ ...input, minHeight: 60 }} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></label>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button style={btn()} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Create scheme'}</button>
        <button style={btn(false)} onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

function AwardForm({ scheme, onAwarded }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);
  const [startup, setStartup] = useState(null);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tranches, setTranches] = useState(defaultTranches(0));
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open || q.trim().length < 2) { setFound([]); return undefined; }
    const t = setTimeout(() => grantAPI.searchStartups(q).then(r => setFound(r.startups || [])).catch(() => setFound([])), 300);
    return () => clearTimeout(t);
  }, [q, open]);
  if (!open) return <button data-testid="grants-award-open" style={btn()} onClick={() => setOpen(true)} disabled={scheme.status !== 'open'}>Award a grant</button>;
  const sum = tranches.reduce((a, t) => a + (Number(t.amount) || 0), 0);
  const left = scheme.total_budget - scheme.awarded;
  const save = async () => {
    setBusy(true);
    try {
      await grantAPI.award(scheme.id, { startup_user_id: startup.id, amount: Number(amount), purpose,
        tranches: tranches.map(t => ({ amount: Number(t.amount), milestone: t.milestone })) });
      toast.success(`Grant awarded to ${startup.name}. They have been emailed.`);
      setOpen(false); setStartup(null); setQ(''); setAmount(''); setPurpose(''); setTranches(defaultTranches(0));
      onAwarded();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div data-testid="grants-award-form" style={{ ...card, padding: 18, marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Award a grant</div>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>{inr(left)} left in this scheme.</div>
      {!startup ? (
        <div>
          <label style={{ fontSize: 12, color: MUTED }}>Startup<input aria-label="Search startups" data-testid="grants-startup-search" style={input} value={q} onChange={e => setQ(e.target.value)} placeholder="Type a startup's name" /></label>
          {found.length > 0 && (
            <div style={{ border: '1px solid #eee', borderRadius: 9, marginTop: 6, maxHeight: 220, overflowY: 'auto' }}>
              {found.map(s => (
                <button key={s.id} data-testid="grants-startup-option" onClick={() => setStartup(s)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', background: '#fff', border: 'none', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', fontSize: 14 }}>
                  <strong>{s.name}</strong>{s.sector ? <span style={{ color: MUTED }}> · {s.sector}</span> : null}{s.city ? <span style={{ color: MUTED }}> · {s.city}</span> : null}
                </button>
              ))}
            </div>
          )}
          {q.trim().length >= 2 && !found.length && <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>No startup with an OpenI account matches. A startup must have its own OpenI account to receive a grant.</div>}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <span data-testid="grants-startup-chosen" style={{ fontWeight: 700 }}>{startup.name}</span>
          <button style={btn(false)} onClick={() => setStartup(null)}>Change</button>
        </div>
      )}
      {startup && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 10 }}>
            <label style={{ fontSize: 12, color: MUTED }}>Grant amount (₹)<input aria-label="Grant amount" data-testid="grants-amount" style={input} inputMode="decimal" value={amount}
              onChange={e => { setAmount(e.target.value); setTranches(defaultTranches(e.target.value)); }} /></label>
            <label style={{ fontSize: 12, color: MUTED }}>Purpose (optional)<input aria-label="Purpose" style={input} value={purpose} onChange={e => setPurpose(e.target.value)} /></label>
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, margin: '14px 0 6px' }}>Milestones (released in this order)</div>
          {tranches.map((t, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 140px) minmax(0, 1fr) auto', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              <input aria-label={`Tranche ${i + 1} amount`} style={input} inputMode="decimal" value={t.amount} onChange={e => setTranches(tranches.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
              <input aria-label={`Tranche ${i + 1} milestone`} style={input} value={t.milestone} onChange={e => setTranches(tranches.map((x, j) => (j === i ? { ...x, milestone: e.target.value } : x)))} />
              <button aria-label={`Remove tranche ${i + 1}`} style={{ ...btn(false), padding: '8px 10px' }} disabled={tranches.length === 1} onClick={() => setTranches(tranches.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
            <button style={btn(false)} disabled={tranches.length >= 10} onClick={() => setTranches([...tranches, { amount: '', milestone: '' }])}>Add a milestone</button>
            <span data-testid="grants-tranche-sum" style={{ fontSize: 12, color: Math.round(sum) === Math.round(Number(amount) || 0) ? '#15803d' : '#b91c1c' }}>
              Milestones add up to {inr(sum)}{amount ? ` of ${inr(amount)}` : ''}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button data-testid="grants-award-submit" style={btn()} disabled={busy} onClick={save}>{busy ? 'Awarding…' : 'Award grant'}</button>
            <button style={btn(false)} onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

function PaymentForm({ grant, tranche, onDone }) {
  const [f, setF] = useState({ paid_at: new Date().toISOString().slice(0, 10), payment_ref: '' });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await grantAPI.recordPayment(grant.id, tranche.id, { ...f, paid_amount: tranche.amount }); toast.success('Payment recorded. The startup has been emailed.'); onDone(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div data-testid="grants-payment-form" style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 10, padding: 12, marginTop: 8 }}>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>Record the {inr(tranche.amount)} your treasury paid (PFMS / bank). OpenI does not send money.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
        <label style={{ fontSize: 12, color: MUTED }}>Payment date<input aria-label="Payment date" type="date" style={input} value={f.paid_at} onChange={e => setF({ ...f, paid_at: e.target.value })} /></label>
        <label style={{ fontSize: 12, color: MUTED }}>Payment reference (UTR / PFMS)<input aria-label="Payment reference" data-testid="grants-payment-ref" style={input} value={f.payment_ref} onChange={e => setF({ ...f, payment_ref: e.target.value })} /></label>
      </div>
      <button data-testid="grants-payment-submit" style={{ ...btn(), marginTop: 10 }} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Record payment'}</button>
    </div>
  );
}

function GrantRow({ grant, onChange }) {
  const [paying, setPaying] = useState(null);
  const approve = async (t) => {
    try { await grantAPI.approve(grant.id, t.id); toast.success(`Milestone ${t.seq} approved`); onChange(); } catch (e) { toast.error(e.message); }
  };
  return (
    <div data-testid="grants-grant" style={{ ...card, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{grant.startup_name}</div>
          {grant.purpose && <div style={{ fontSize: 13, color: MUTED }}>{grant.purpose}</div>}
        </div>
        <div style={{ textAlign: 'right', fontSize: 13 }}>
          <div><strong>{inr(grant.disbursed)}</strong> of {inr(grant.amount)} paid</div>
          <div style={{ color: grant.status === 'completed' ? '#15803d' : MUTED }}>{grant.status === 'completed' ? 'Fully disbursed' : 'Active'}</div>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        {grant.tranches.map((t, i) => {
          const prevPaid = i === 0 || grant.tranches[i - 1].status === 'paid';
          return (
            <div key={t.id} data-testid="grants-tranche" style={{ borderTop: '1px solid #f3f4f6', padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ minWidth: 0, fontSize: 14 }}><strong>{t.seq}. {inr(t.amount)}</strong> — {t.milestone}</div>
                <Chip s={t.status} />
              </div>
              {t.evidence && <div style={{ fontSize: 13, color: '#374151', marginTop: 6, background: '#f9fafb', padding: 8, borderRadius: 8, overflowWrap: 'anywhere' }}>
                Proof: {t.evidence}{t.evidence_url && <> · <a href={t.evidence_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8' }}>link</a></>}
              </div>}
              {t.status === 'paid' && <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Paid {String(t.paid_at).slice(0, 10)} · ref {t.payment_ref}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                {['pending', 'submitted'].includes(t.status) && prevPaid && <button data-testid="grants-approve" style={btn(t.status === 'submitted')} onClick={() => approve(t)}>Approve milestone {t.seq}</button>}
                {t.status === 'approved' && paying !== t.id && <button data-testid="grants-record-payment" style={btn()} onClick={() => setPaying(t.id)}>Record payment</button>}
              </div>
              {paying === t.id && <PaymentForm grant={grant} tranche={t} onDone={() => { setPaying(null); onChange(); }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SchemeView({ id, onBack }) {
  const [s, setS] = useState(null);
  const load = useCallback(() => grantAPI.scheme(id).then(setS).catch(e => toast.error(e.message)), [id]);
  useEffect(() => { load(); }, [load]);
  if (!s) return <div style={{ padding: 28, color: MUTED }}>Loading…</div>;
  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#7a5f17', fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 12 }}>← All schemes</button>
      <h2 data-testid="grants-scheme-title" style={{ margin: '0 0 4px', fontSize: 20 }}>{s.name}</h2>
      {s.description && <p style={{ margin: '0 0 12px', color: MUTED, fontSize: 14 }}>{s.description}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Budget" value={inr(s.total_budget)} />
        <Stat label="Awarded" value={inr(s.awarded)} />
        <Stat label="Disbursed" value={inr(s.disbursed)} />
      </div>
      <div style={{ marginBottom: 16 }}><AwardForm scheme={s} onAwarded={load} /></div>
      {s.grants.length ? s.grants.map(g => <GrantRow key={g.id} grant={g} onChange={load} />)
        : <div style={{ ...card, padding: 18, color: MUTED, fontSize: 14 }}>No grants yet. Award the first one above.</div>}
    </div>
  );
}

export default function GrantsDisburse() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const load = useCallback(() => grantAPI.schemes().then(setData).catch(e => { toast.error(e.message); setData({ schemes: [], totals: { sanctioned: 0, disbursed: 0 } }); }), []);
  useEffect(() => { load(); }, [load]);
  return (
    <div id="tour-page-grants" data-testid="grants-page" style={{ padding: 'clamp(14px, 4vw, 28px)', maxWidth: 1100, background: '#f5f5f5', minHeight: '100%' }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Disburse Grants</h1>
      <p style={{ margin: '4px 0 16px', color: MUTED, fontSize: 13 }}>Award grants to startups and release them milestone by milestone.</p>
      <div data-testid="grants-record-only" style={{ ...card, padding: '12px 16px', marginBottom: 16, background: '#f0f9ff', borderColor: '#bae6fd', color: '#0c4a6e', fontSize: 13, lineHeight: 1.5 }}>
        Your treasury pays each grant (PFMS or bank). OpenI keeps the record: what was awarded, each milestone, and each payment with its date and reference. The startup sees every step.
      </div>
      {open ? <SchemeView id={open} onBack={() => { setOpen(null); load(); }} /> : (
        <>
          <div id="tour-grants-totals" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
            <Stat label="Sanctioned" value={inr(data?.totals?.sanctioned)} />
            <Stat label="Disbursed" value={inr(data?.totals?.disbursed)} />
            <Stat label="Schemes" value={data?.schemes?.length ?? '…'} />
          </div>
          <div id="tour-grants-new" style={{ marginBottom: 16 }}><NewScheme onCreated={s => { load(); setOpen(s.id); }} /></div>
          {data && !data.schemes.length && <div style={{ ...card, padding: 18, color: MUTED, fontSize: 14 }}>No grant schemes yet. Create one, then award grants from it.</div>}
          {(data?.schemes || []).map(s => (
            <button key={s.id} data-testid="grants-scheme" onClick={() => setOpen(s.id)}
              style={{ ...card, display: 'block', width: '100%', textAlign: 'left', padding: 16, marginBottom: 10, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 15 }}>{s.name}</strong>
                <span style={{ fontSize: 12, color: s.status === 'open' ? '#15803d' : MUTED }}>{s.status === 'open' ? 'Open' : 'Closed'}</span>
              </div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{s.grants} grant{s.grants === 1 ? '' : 's'} · {inr(s.awarded)} awarded of {inr(s.total_budget)} · {inr(s.disbursed)} disbursed</div>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
