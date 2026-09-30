/**
 * s123 (30 Sep 2026) — Innovation Agent Phase 2, "from finding to engaging".
 *
 * EngageSheet: one sheet for the per-startup actions, each preview-first:
 *   request_intro     A7: the agent's intro note (editable) -> sent as an OpenI
 *                     connection request (email + notification to the startup)
 *   schedule_meeting  A8: a 30-minute call (title, agenda, time, link; editable)
 *                     -> an OpenI meeting invite with a calendar file
 *   start_pilot       a collaboration to track the pilot with milestones
 * The cost is on the sheet; nothing happens without the client's click.
 *
 * PipelinePanel: every startup the company shortlisted, at its stage
 * (found -> intro -> meeting -> pilot -> decision), with its next step, and what
 * moved in the last 30 days. Derived live by the backend from what really
 * happened; "stalled" = 7 days at a stage.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, CalendarPlus, Send, X } from 'lucide-react';

const G = '#C9A84C';
const NAVY = '#0B1E3F';
const field = { width: '100%', boxSizing: 'border-box', fontSize: 14, padding: '7px 9px', borderRadius: 8, border: '1px solid #ddd', fontFamily: 'inherit' };
const lab = { fontSize: 12, color: '#555', fontWeight: 600, display: 'block', margin: '10px 0 4px' };
const btn = { fontSize: 13, padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' };

const KIND = {
  request_intro: { title: n => `Request an intro to ${n}`, icon: Send, send: 'Send the intro', sending: 'Sending…', done: n => `Intro sent to ${n}. They get your note by email and in OpenI.` },
  schedule_meeting: { title: n => `Schedule a meeting with ${n}`, icon: CalendarPlus, send: 'Send the invite', sending: 'Sending…', done: n => `Meeting invite sent to ${n}, with a calendar file.` },
  start_pilot: { title: n => `Start a pilot with ${n}`, icon: Briefcase, send: 'Start the pilot', sending: 'Starting…', done: n => `Pilot with ${n} started. Track it under Collaborations.` },
};

/** ISO -> the value a datetime-local input shows (the viewer's local time). */
export function toLocalInput(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function EngageSheet({ offer, preview, execute, dismiss, onClose, onDone }) {
  const kind = KIND[offer.key];
  const [state, setState] = useState({ loading: true });
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    preview(offer.key, offer.subject)
      .then((r) => { if (!live) return; setState({ id: r.id, cost: r.cost, drafted_by: r.drafted_by }); setDraft(r.draft); })
      .catch((err) => { if (live) setState({ error: err.message || 'The agent could not prepare this.' }); });
    return () => { live = false; };
  }, [offer.key, offer.subject, preview]);

  const set = k => e => setDraft(d => ({ ...d, [k]: e.target.value }));
  const send = async () => {
    setSaving(true);
    setError(null);
    try {
      const r = await execute(state.id, draft);
      toast.success(kind.done(draft.name));
      onDone(r.result);
    } catch (err) {
      setError(err.message || 'Could not do this just now.');
    } finally {
      setSaving(false);
    }
  };
  const notNow = async () => {
    if (state.id) await dismiss(state.id).catch(() => {});
    onClose();
  };
  const Icon = kind.icon;

  return (
    <div role="dialog" aria-modal="true" aria-label={kind.title(offer.label)} data-testid="engage-sheet" data-key={offer.key}
      style={{ position: 'fixed', inset: 0, background: 'rgba(11,30,63,0.35)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 12px' }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 600, padding: '16px 18px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={16} color="#8A6A1C" />
          <strong style={{ fontSize: 15 }}>{kind.title(offer.label)}</strong>
          <button type="button" aria-label="Close" onClick={onClose} style={{ marginLeft: 'auto', border: 0, background: 'none', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        {state.loading && <p role="status" style={{ fontSize: 13, color: '#666' }}>The agent is preparing it…</p>}
        {state.error && <p role="alert" style={{ fontSize: 13, color: '#A33' }}>{state.error}</p>}
        {draft && offer.key === 'request_intro' && (
          <>
            <p data-testid="engage-drafted-by" style={{ fontSize: 12.5, color: '#666', margin: '8px 0 0' }}>
              {state.drafted_by === 'agent' ? 'Written by the agent from your profile and why this startup fits. Edit it as you like.'
                : 'A plain note from your profile and why this startup fits (the writer is unavailable just now). Edit it as you like.'}</p>
            <label style={lab} htmlFor="eng-msg">Your note</label>
            <textarea id="eng-msg" data-testid="engage-message" style={{ ...field, minHeight: 150 }} value={draft.message || ''} onChange={set('message')} maxLength={1000} />
          </>
        )}
        {draft && offer.key === 'schedule_meeting' && (
          <>
            <label style={lab} htmlFor="eng-title">Title</label>
            <input id="eng-title" data-testid="engage-title" style={field} value={draft.title || ''} onChange={set('title')} maxLength={300} />
            <label style={lab} htmlFor="eng-desc">What it is about</label>
            <textarea id="eng-desc" style={{ ...field, minHeight: 60 }} value={draft.description || ''} onChange={set('description')} maxLength={2000} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 220px' }}>
                <label style={lab} htmlFor="eng-start">When (your local time)</label>
                <input id="eng-start" data-testid="engage-start" type="datetime-local" style={field} value={toLocalInput(draft.start_time)}
                  onChange={e => setDraft(d => ({ ...d, start_time: e.target.value ? new Date(e.target.value).toISOString() : '' }))} />
              </div>
              <div style={{ flex: '0 1 140px' }}>
                <label style={lab} htmlFor="eng-len">Length</label>
                <select id="eng-len" style={field} value={draft.duration_min} onChange={e => setDraft(d => ({ ...d, duration_min: Number(e.target.value) }))}>
                  {[15, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m} minutes</option>)}
                </select>
              </div>
            </div>
            <label style={lab} htmlFor="eng-link">Video link (optional)</label>
            <input id="eng-link" data-testid="engage-link" style={field} placeholder="https://" value={draft.meeting_link || ''} onChange={set('meeting_link')} />
          </>
        )}
        {draft && offer.key === 'start_pilot' && (
          <>
            <label style={lab} htmlFor="eng-ptitle">Pilot name</label>
            <input id="eng-ptitle" data-testid="engage-title" style={field} value={draft.title || ''} onChange={set('title')} maxLength={200} />
            <label style={lab} htmlFor="eng-notes">Notes</label>
            <textarea id="eng-notes" style={{ ...field, minHeight: 60 }} value={draft.notes || ''} onChange={set('notes')} maxLength={2000} />
          </>
        )}
        {error && <p role="alert" data-testid="engage-error" style={{ fontSize: 13, color: '#A33', margin: '8px 0 0' }}>{error}</p>}
        {draft && <p data-testid="engage-cost" style={{ fontSize: 12.5, color: '#666', margin: '12px 0 0' }}>{state.cost}</p>}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {draft && (
            <button type="button" data-testid="engage-send" onClick={send} disabled={saving}
              style={{ ...btn, border: `1px solid ${G}`, background: saving ? '#f4efe2' : G, color: NAVY, fontWeight: 600 }}>
              {saving ? kind.sending : kind.send}</button>
          )}
          <button type="button" data-testid="engage-not-now" onClick={notNow} style={btn}>{draft ? 'Not now' : 'Close'}</button>
        </div>
      </div>
    </div>
  );
}

const STAGE_LABEL = { found: 'Shortlisted', intro: 'Intro', meeting: 'Meeting', pilot: 'Pilot', decision: 'Decided' };
const STATUS_TEXT = {
  shortlisted: 'shortlisted', waiting: 'waiting for their answer', accepted: 'accepted your intro', declined: 'declined', blocked: 'unavailable',
  invited: 'invited', confirmed: 'confirmed', held: 'met', exploring: 'exploring', poc: 'proof of concept', pilot: 'in pilot',
  scaling: 'scaling', completed: 'completed', terminated: 'stopped',
};

export function PipelinePanel({ load, onAction, refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const fetchIt = useCallback(() => load().then((r) => { setData(r); setError(false); }).catch(() => setError(true)), [load]);
  useEffect(() => { fetchIt(); }, [fetchIt, refreshKey]);
  const items = data?.items || [];
  const l = data?.last30;
  return (
    <section data-testid="pilot-pipeline" style={{ marginTop: 16, background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Briefcase size={16} color={NAVY} />
        <strong style={{ fontSize: 15 }}>Your pilot pipeline</strong>
        {l && <span data-testid="pipeline-last30" style={{ fontSize: 12.5, color: '#555', marginLeft: 'auto' }}>
          Last 30 days: {l.intros} intro{l.intros === 1 ? '' : 's'} · {l.meetings} meeting{l.meetings === 1 ? '' : 's'} · {l.pilots} pilot{l.pilots === 1 ? '' : 's'}</span>}
      </div>
      {error && <p style={{ fontSize: 13, color: '#A33' }}>Could not load your pipeline just now.</p>}
      {data && (
        <div data-testid="pipeline-stages" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0' }}>
          {Object.entries(STAGE_LABEL).map(([k, v]) => (
            <span key={k} style={{ fontSize: 12, background: '#f6f6f6', borderRadius: 999, padding: '3px 10px' }}>{v}: <b>{data.stages[k] || 0}</b></span>
          ))}
        </div>
      )}
      {data && !items.length && (
        <p data-testid="pipeline-empty" style={{ fontSize: 13.5, color: '#555', margin: 0 }}>
          Shortlist startups in your brief and they appear here, with the next step for each: an intro, a meeting, a pilot.</p>
      )}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
        {items.map(i => (
          <li key={i.startup_user_id} data-testid="pipeline-item" data-stage={i.stage}
            style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #f2f2f2', paddingTop: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8A6A1C', minWidth: 78 }}>{STAGE_LABEL[i.stage]}</span>
            <span style={{ flex: '1 1 220px', fontSize: 13.5 }}>
              <b style={{ fontWeight: 600 }}>{i.name}</b> <span style={{ color: '#777' }}>· {STATUS_TEXT[i.status] || i.status}</span>
              {i.next?.stalled && <span data-testid="pipeline-stalled" style={{ display: 'block', fontSize: 12, color: '#6B5A24' }}>{i.next.why}</span>}
            </span>
            {i.next && <button type="button" data-testid="pipeline-next" onClick={() => onAction({ key: i.next.key, subject: i.next.subject, label: i.name })}
              style={{ ...btn, padding: '5px 10px', fontSize: 12.5, borderColor: G }}>{i.next.label}</button>}
            {i.stage === 'pilot' && <Link to="/dashboard/corporate/collabs" style={{ fontSize: 12.5, color: '#8A6A1C' }}>Open the pilot</Link>}
          </li>
        ))}
      </ul>
    </section>
  );
}
