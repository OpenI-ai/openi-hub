/**
 * s123 (30 Sep 2026) — action agents, Wave 2 (AGENTIC_PLATFORM_PLAN). An agent
 * PROPOSES a next step where the client is looking, the client edits and
 * CONFIRMS, and OpenI does it with a feature it already has. The cost is always
 * on the button.
 *
 * A4 "Launch a challenge on this priority": a chip on each of a corporate
 * client's own priority sections. It opens a sheet where OpenI's challenge
 * drafter writes a title, problem statement, what we look for and sectors from
 * the priority, the client's business and what they shortlisted. The client
 * edits it and saves it as a DRAFT challenge (free); publishing it later in the
 * challenge editor uses one monthly challenge. Once saved, the chip links to it.
 *
 * A4b "Invite the startups you shortlisted": see InviteShortlistedChip below.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Rocket, Send, X } from 'lucide-react';

const G = '#C9A84C';
const NAVY = '#0B1E3F';
const field = { width: '100%', boxSizing: 'border-box', fontSize: 14, padding: '7px 9px', borderRadius: 8, border: '1px solid #ddd', fontFamily: 'inherit' };
const lab = { fontSize: 12, color: '#555', fontWeight: 600, display: 'block', margin: '10px 0 4px' };

export function LaunchChallengeChip({ offer, onOpen }) {
  if (offer.last?.status === 'done' && offer.last.result?.url) {
    return (
      <Link to={offer.last.result.url} data-testid="action-challenge-open"
        style={{ marginLeft: 'auto', fontSize: 12, color: '#1F6B3A', background: '#EAF6EE', borderRadius: 8, padding: '3px 9px', textDecoration: 'none' }}>
        Challenge draft saved · Open
      </Link>
    );
  }
  return (
    <button type="button" data-testid="action-launch-challenge" onClick={() => onOpen(offer)}
      title={offer.cost}
      style={{ marginLeft: 'auto', fontSize: 12, padding: '3px 10px', borderRadius: 8, border: `1px solid ${G}`, background: '#fff', color: NAVY,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Rocket size={12} /> Launch a challenge on this
    </button>
  );
}

export function LaunchChallengeSheet({ offer, preview, execute, dismiss, onClose, onDone }) {
  const [state, setState] = useState({ loading: true });
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    let live = true;
    preview(offer.subject)
      .then((r) => { if (!live) return; setState({ id: r.id, drafted_by: r.drafted_by, cost: r.cost }); setDraft({ ...r.draft, sectors: (r.draft.sectors || []).join(', ') }); })
      .catch((err) => { if (live) setState({ error: err.message || 'The agent could not draft this.' }); });
    return () => { live = false; };
  }, [offer.subject, preview]);

  const set = k => e => setDraft(d => ({ ...d, [k]: e.target.value }));
  const save = async () => {
    setSaving(true);
    setErrors([]);
    try {
      const r = await execute(state.id, { ...draft, sectors: String(draft.sectors || '').split(',').map(s => s.trim()).filter(Boolean) });
      toast.success('Saved as a draft challenge. Open it to review and publish.');
      onDone(r.result);
    } catch (err) {
      setErrors([err.message || 'Could not save the challenge']);
    } finally {
      setSaving(false);
    }
  };
  const notNow = async () => {
    if (state.id) await dismiss(state.id).catch(() => {});
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Launch a challenge" data-testid="launch-challenge-sheet"
      style={{ position: 'fixed', inset: 0, background: 'rgba(11,30,63,0.35)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 12px' }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 620, padding: '16px 18px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Rocket size={16} color="#8A6A1C" />
          <strong style={{ fontSize: 15 }}>Launch a challenge on “{offer.label}”</strong>
          <button type="button" aria-label="Close" onClick={onClose} style={{ marginLeft: 'auto', border: 0, background: 'none', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        {state.loading && <p role="status" style={{ fontSize: 13, color: '#666' }}>OpenI's challenge drafter is writing a draft from this priority, your business and the startups you shortlisted…</p>}
        {state.error && <p role="alert" style={{ fontSize: 13, color: '#A33' }}>{state.error}</p>}
        {draft && (
          <>
            <p data-testid="launch-drafted-by" style={{ fontSize: 12.5, color: '#6B5A24', background: '#FBF6EA', borderRadius: 8, padding: '6px 10px', margin: '10px 0 0' }}>
              {state.drafted_by === 'agent'
                ? 'Drafted by OpenI\'s challenge drafter. Edit anything before you save.'
                : 'A plain starting point from your priority\'s words (the drafter was not available). Edit it before you save.'}
            </p>
            <label style={lab} htmlFor="lc-title">Title</label>
            <input id="lc-title" data-testid="launch-title" style={field} value={draft.title} onChange={set('title')} maxLength={120} />
            <label style={lab} htmlFor="lc-problem">Problem statement</label>
            <textarea id="lc-problem" data-testid="launch-problem" style={{ ...field, minHeight: 110 }} value={draft.problem_statement} onChange={set('problem_statement')} maxLength={1500} />
            <label style={lab} htmlFor="lc-desc">How working with you could look</label>
            <textarea id="lc-desc" style={{ ...field, minHeight: 60 }} value={draft.description} onChange={set('description')} maxLength={3000} />
            <label style={lab} htmlFor="lc-req">What you look for in a startup</label>
            <textarea id="lc-req" style={{ ...field, minHeight: 70 }} value={draft.requirements} onChange={set('requirements')} maxLength={1500} />
            <label style={lab} htmlFor="lc-sectors">Sectors (comma-separated, up to 3)</label>
            <input id="lc-sectors" style={field} value={draft.sectors} onChange={set('sectors')} />
            {errors.length > 0 && <p role="alert" data-testid="launch-errors" style={{ fontSize: 13, color: '#A33', margin: '8px 0 0' }}>{errors.join(' ')}</p>}
            <p data-testid="launch-cost" style={{ fontSize: 12.5, color: '#666', margin: '12px 0 0' }}>{state.cost}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button type="button" data-testid="launch-save" onClick={save} disabled={saving}
                style={{ fontSize: 13, padding: '8px 14px', borderRadius: 8, border: `1px solid ${G}`, background: saving ? '#f4efe2' : G, color: NAVY, fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}>
                {saving ? 'Saving…' : 'Save as a draft challenge'}
              </button>
              <button type="button" data-testid="launch-not-now" onClick={notNow}
                style={{ fontSize: 13, padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Not now</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/*
 * A4b "Invite the startups you shortlisted": a chip on each of a corporate
 * client's OPEN challenge sections. The sheet lists the startups they
 * shortlisted in the brief that are not yet invited or applied (closest to the
 * challenge first), all ticked; the note is editable; "Send" uses OpenI's
 * existing challenge invites (email + notification, free).
 */
export function InviteShortlistedChip({ offer, onOpen }) {
  const done = offer.last?.status === 'done' ? offer.last.result : null;
  return (
    <button type="button" data-testid="action-invite-shortlisted" onClick={() => onOpen(offer)} title={offer.cost}
      style={{ marginLeft: 'auto', fontSize: 12, padding: '3px 10px', borderRadius: 8, border: `1px solid ${G}`, background: '#fff', color: NAVY,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Send size={12} /> {done ? `Invited ${done.invited} · Invite more` : 'Invite the startups you shortlisted'}
    </button>
  );
}

export function InviteShortlistedSheet({ offer, preview, execute, dismiss, onClose, onDone }) {
  const [state, setState] = useState({ loading: true });
  const [ticked, setTicked] = useState(() => new Set());
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    preview(offer.subject)
      .then((r) => {
        if (!live) return;
        setState({ id: r.id, cost: r.cost, candidates: r.draft.candidates || [], title: r.draft.title });
        setTicked(new Set((r.draft.candidates || []).map(c => c.user_id)));
        setMessage(r.draft.message || '');
      })
      .catch((err) => { if (live) setState({ error: err.message || 'Could not find the startups to invite.' }); });
    return () => { live = false; };
  }, [offer.subject, preview]);

  const toggle = id => setTicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const r = await execute(state.id, { user_ids: [...ticked], message });
      const { invited, already_invited: already } = r.result;
      toast.success(`Invited ${invited} startup${invited === 1 ? '' : 's'}${already ? ` (${already} already invited)` : ''}. Each gets an email and a notification.`);
      onDone(r.result);
    } catch (err) {
      setError(err.message || 'The invites could not be sent');
    } finally {
      setSending(false);
    }
  };
  const notNow = async () => {
    if (state.id) await dismiss(state.id).catch(() => {});
    onClose();
  };
  const list = state.candidates || [];

  return (
    <div role="dialog" aria-modal="true" aria-label="Invite the startups you shortlisted" data-testid="invite-shortlisted-sheet"
      style={{ position: 'fixed', inset: 0, background: 'rgba(11,30,63,0.35)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 12px' }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 620, padding: '16px 18px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Send size={16} color="#8A6A1C" />
          <strong style={{ fontSize: 15 }}>Invite to “{offer.label}”</strong>
          <button type="button" aria-label="Close" onClick={onClose} style={{ marginLeft: 'auto', border: 0, background: 'none', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        {state.loading && <p role="status" style={{ fontSize: 13, color: '#666' }}>Finding the startups you shortlisted that are not invited yet…</p>}
        {state.error && <p role="alert" style={{ fontSize: 13, color: '#A33' }}>{state.error}</p>}
        {!state.loading && !state.error && list.length === 0 && (
          <p data-testid="invite-empty" style={{ fontSize: 13, color: '#555' }}>
            Every startup you shortlisted is already invited or has applied. Shortlist more startups in your brief, then come back.
          </p>
        )}
        {list.length > 0 && (
          <>
            <p style={{ fontSize: 12.5, color: '#666', margin: '10px 0 6px' }}>The startups you shortlisted that are not invited or applied yet, closest to this challenge first. Untick any you do not want to invite.</p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
              {list.map(c => (
                <li key={c.user_id}>
                  <label data-testid="invite-candidate" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13.5, cursor: 'pointer' }}>
                    <input type="checkbox" checked={ticked.has(c.user_id)} onChange={() => toggle(c.user_id)} style={{ marginTop: 3 }} />
                    <span><b style={{ fontWeight: 600 }}>{c.name}</b>{c.match != null && <span style={{ color: '#888', fontSize: 12 }}> · {c.match}% match</span>}
                      {c.tagline && <span style={{ display: 'block', color: '#555', fontSize: 12.5 }}>{c.tagline}</span>}</span>
                  </label>
                </li>
              ))}
            </ul>
            <label style={lab} htmlFor="inv-msg">Your note to them</label>
            <textarea id="inv-msg" data-testid="invite-message" style={{ ...field, minHeight: 80 }} value={message} onChange={e => setMessage(e.target.value)} maxLength={1000} />
            {error && <p role="alert" data-testid="invite-error" style={{ fontSize: 13, color: '#A33', margin: '8px 0 0' }}>{error}</p>}
            <p data-testid="invite-cost" style={{ fontSize: 12.5, color: '#666', margin: '12px 0 0' }}>{state.cost}</p>
          </>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {list.length > 0 && (
            <button type="button" data-testid="invite-send" onClick={send} disabled={sending || ticked.size === 0}
              style={{ fontSize: 13, padding: '8px 14px', borderRadius: 8, border: `1px solid ${G}`, background: sending || !ticked.size ? '#f4efe2' : G, color: NAVY, fontWeight: 600,
                cursor: sending || !ticked.size ? 'default' : 'pointer' }}>
              {sending ? 'Sending…' : `Send ${ticked.size} invite${ticked.size === 1 ? '' : 's'}`}
            </button>
          )}
          <button type="button" data-testid="invite-not-now" onClick={notNow}
            style={{ fontSize: 13, padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>{list.length ? 'Not now' : 'Close'}</button>
        </div>
      </div>
    </div>
  );
}
