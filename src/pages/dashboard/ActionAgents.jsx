/**
 * s123 (30 Sep 2026) — action agents, Wave 2 (AGENTIC_PLATFORM_PLAN). An agent
 * PROPOSES a next step where the client is looking, the client edits and
 * CONFIRMS, and OpenI does it with a feature it already has. The cost is always
 * on the button.
 *
 * A4 "Launch a challenge on this priority": a chip on each of a corporate
 * client's own priority sections. Rajeev (30 Sep): "launch challenge should be
 * automatic to ensure entire requirement is atomically populated and user needs
 * to just press launch". OpenI's challenge drafter fills the WHOLE challenge
 * (problem, how working together looks, what we look for, timeline, deadline,
 * type, sectors / functions / technologies / use cases from OpenI's taxonomy,
 * questions for applicants, FAQs); the sheet shows it as startups will see it,
 * and the client presses "Launch challenge" (one monthly challenge, said on
 * screen). "Edit details" and "Save as draft instead" (free) are there too.
 * Once done, the chip links to it.
 *
 * A4b "Invite the startups you shortlisted": see InviteShortlistedChip below.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, Pencil, Rocket, Send, X } from 'lucide-react';

const G = '#C9A84C';
const NAVY = '#0B1E3F';
const field = { width: '100%', boxSizing: 'border-box', fontSize: 14, padding: '7px 9px', borderRadius: 8, border: '1px solid #ddd', fontFamily: 'inherit' };
const lab = { fontSize: 12, color: '#555', fontWeight: 600, display: 'block', margin: '10px 0 4px' };

export function LaunchChallengeChip({ offer, onOpen }) {
  if (offer.last?.status === 'done' && offer.last.result?.url) {
    return (
      <Link to={offer.last.result.url} data-testid="action-challenge-open"
        style={{ marginLeft: 'auto', fontSize: 12, color: '#1F6B3A', background: '#EAF6EE', borderRadius: 8, padding: '3px 9px', textDecoration: 'none' }}>
        {offer.last.result.launched ? 'Challenge launched · Open' : 'Challenge draft saved · Open'}
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

const editBtn = { fontSize: 13, padding: '8px 14px', borderRadius: 8, border: '1px solid #2B4C8C', background: '#fff', color: '#2B4C8C', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const TYPE_LABEL = { partner: 'Partner', source: 'Source', invest: 'Invest' };
const tagPill = { fontSize: 11.5, padding: '2px 8px', borderRadius: 20, background: '#F2F4F8', color: '#334' };
const lines = v => String(v || '').split('\n').map(x => x.trim()).filter(Boolean);
const csv = v => String(v || '').split(',').map(x => x.trim()).filter(Boolean);

/** The whole challenge as startups will see it. */
export function ChallengePreview({ d }) {
  const tags = [...(d.sectors || []), ...(d.functions || []), ...(d.technologies || []), ...(d.usecases || [])];
  const block = (title, body) => (body ? <div style={{ marginTop: 8 }}><div style={{ ...lab, margin: '0 0 2px' }}>{title}</div><div style={{ fontSize: 13.5, whiteSpace: 'pre-line' }}>{body}</div></div> : null);
  return (
    <div data-testid="launch-preview" style={{ border: '1px solid #eee', borderRadius: 10, padding: '10px 12px', marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <strong data-testid="launch-preview-title" style={{ fontSize: 15.5 }}>{d.title}</strong>
        <span style={{ ...tagPill, background: '#FBF6EA', color: '#8A6A1C' }}>{TYPE_LABEL[d.challenge_type] || 'Partner'}</span>
      </div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
        {[d.deadline ? `Applications close ${new Date(`${d.deadline}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}` : null, d.timeline].filter(Boolean).join(' · ')}
      </div>
      {block('The problem', d.problem_statement)}
      {block('How working with you could look', d.description)}
      {block('What you look for in a startup', d.requirements)}
      {tags.length > 0 && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>{tags.map(t => <span key={t} style={tagPill}>{t}</span>)}</div>}
      {(d.rfi_questions || []).length > 0 && (
        <div style={{ marginTop: 8 }}><div style={{ ...lab, margin: '0 0 2px' }}>Every applicant answers</div>
          <ol data-testid="launch-preview-questions" style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>{d.rfi_questions.map(q => <li key={q.id || q.question}>{q.question}</li>)}</ol></div>
      )}
      {(d.faqs || []).length > 0 && (
        <div style={{ marginTop: 8 }}><div style={{ ...lab, margin: '0 0 2px' }}>FAQs</div>
          {d.faqs.map(f => <div key={f.question} style={{ fontSize: 13, marginBottom: 3 }}><b style={{ fontWeight: 600 }}>{f.question}</b> {f.answer}</div>)}</div>
      )}
    </div>
  );
}

export function LaunchChallengeSheet({ offer, preview, execute, dismiss, onClose, onDone }) {
  const [state, setState] = useState({ loading: true });
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(null);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    let live = true;
    preview(offer.subject)
      .then((r) => { if (!live) return; setState({ id: r.id, drafted_by: r.drafted_by, cost: r.cost }); setDraft(r.draft); })
      .catch((err) => { if (live) setState({ error: err.message || 'The agent could not draft this.' }); });
    return () => { live = false; };
  }, [offer.subject, preview]);

  const set = k => e => setDraft(d => ({ ...d, [k]: e.target.value }));
  const setList = k => e => setDraft(d => ({ ...d, [k]: csv(e.target.value) }));
  const setFaq = (i, k) => e => setDraft(d => ({ ...d, faqs: d.faqs.map((f, j) => (j === i ? { ...f, [k]: e.target.value } : f)) }));
  const submit = async (launch) => {
    setSaving(launch ? 'launch' : 'draft');
    setErrors([]);
    try {
      const r = await execute(state.id, { ...draft, launch });
      toast.success(launch ? 'Challenge launched. Startups on OpenI can see it and apply now.' : 'Saved as a draft challenge. Open it to launch when you are ready.');
      onDone(r.result);
    } catch (err) {
      setErrors([err.message || 'Could not save the challenge']);
    } finally {
      setSaving(null);
    }
  };
  const notNow = async () => {
    if (state.id) await dismiss(state.id).catch(() => {});
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Launch a challenge" data-testid="launch-challenge-sheet"
      style={{ position: 'fixed', inset: 0, background: 'rgba(11,30,63,0.35)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 12px' }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 680, padding: '16px 18px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Rocket size={16} color="#8A6A1C" />
          <strong style={{ fontSize: 15 }}>Launch a challenge on “{offer.label}”</strong>
          <button type="button" aria-label="Close" onClick={onClose} style={{ marginLeft: 'auto', border: 0, background: 'none', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        {state.loading && <p role="status" style={{ fontSize: 13, color: '#666' }}>OpenI's challenge drafter is writing the whole challenge from this priority, your business and the startups you shortlisted: the problem, what you look for, sectors, questions for applicants, FAQs and a deadline…</p>}
        {state.error && <p role="alert" style={{ fontSize: 13, color: '#A33' }}>{state.error}</p>}
        {draft && (
          <>
            <p data-testid="launch-drafted-by" style={{ fontSize: 12.5, color: '#6B5A24', background: '#FBF6EA', borderRadius: 8, padding: '6px 10px', margin: '10px 0 0' }}>
              {state.drafted_by === 'agent'
                ? 'OpenI\'s challenge drafter filled in the whole challenge. Review it and press Launch, or edit anything first.'
                : 'A complete starting point from your priority\'s words (the drafter was not available). Review it, edit anything, then launch.'}
            </p>
            {/* Rajeev (1 Oct): "difficult to spot edit details" — a real button, above the challenge and beside Launch. */}
            <button type="button" data-testid="launch-edit-top" onClick={() => setEditing(e => !e)} style={{ ...editBtn, marginTop: 10 }}>
              {editing ? <><Eye size={14} /> Show it as startups will see it</> : <><Pencil size={14} /> Edit details</>}
            </button>
            {!editing && <ChallengePreview d={draft} />}
            {editing && (
              <div data-testid="launch-edit">
                <label style={lab} htmlFor="lc-title">Title</label>
                <input id="lc-title" data-testid="launch-title" style={field} value={draft.title} onChange={set('title')} maxLength={120} />
                <label style={lab} htmlFor="lc-problem">The problem</label>
                <textarea id="lc-problem" data-testid="launch-problem" style={{ ...field, minHeight: 100 }} value={draft.problem_statement} onChange={set('problem_statement')} maxLength={1500} />
                <label style={lab} htmlFor="lc-desc">How working with you could look</label>
                <textarea id="lc-desc" style={{ ...field, minHeight: 60 }} value={draft.description} onChange={set('description')} maxLength={3000} />
                <label style={lab} htmlFor="lc-req">What you look for in a startup</label>
                <textarea id="lc-req" style={{ ...field, minHeight: 60 }} value={draft.requirements} onChange={set('requirements')} maxLength={1500} />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}><label style={lab} htmlFor="lc-type">Challenge type</label>
                    <select id="lc-type" style={field} value={draft.challenge_type} onChange={set('challenge_type')}>
                      <option value="partner">Partner</option><option value="source">Source</option><option value="invest">Invest</option></select></div>
                  <div style={{ flex: '1 1 160px' }}><label style={lab} htmlFor="lc-deadline">Applications close</label>
                    <input id="lc-deadline" data-testid="launch-deadline" type="date" style={field} value={draft.deadline} onChange={set('deadline')} /></div>
                  <div style={{ flex: '2 1 220px' }}><label style={lab} htmlFor="lc-timeline">Timeline</label>
                    <input id="lc-timeline" style={field} value={draft.timeline} onChange={set('timeline')} maxLength={100} /></div>
                </div>
                {[['sectors', 'Sectors'], ['functions', 'Functions'], ['technologies', 'Technologies'], ['usecases', 'Use cases']].map(([k, name]) => (
                  <div key={k}><label style={lab} htmlFor={`lc-${k}`}>{name} (comma-separated; OpenI keeps only its own taxonomy terms)</label>
                    <input id={`lc-${k}`} style={field} defaultValue={(draft[k] || []).join(', ')} onBlur={setList(k)} /></div>
                ))}
                <label style={lab} htmlFor="lc-questions">Questions every applicant answers (one per line)</label>
                <textarea id="lc-questions" data-testid="launch-questions" style={{ ...field, minHeight: 80 }}
                  defaultValue={(draft.rfi_questions || []).map(q => q.question).join('\n')}
                  onBlur={e => setDraft(d => ({ ...d, rfi_questions: lines(e.target.value).map(q => ({ question: q })) }))} />
                <div style={lab}>FAQs</div>
                {(draft.faqs || []).map((f, i) => (
                  <div key={i} style={{ display: 'grid', gap: 4, marginBottom: 6 }}>
                    <input aria-label={`FAQ ${i + 1} question`} style={field} value={f.question} onChange={setFaq(i, 'question')} />
                    <textarea aria-label={`FAQ ${i + 1} answer`} style={{ ...field, minHeight: 44 }} value={f.answer} onChange={setFaq(i, 'answer')} />
                  </div>
                ))}
              </div>
            )}
            {errors.length > 0 && <p role="alert" data-testid="launch-errors" style={{ fontSize: 13, color: '#A33', margin: '8px 0 0' }}>{errors.join(' ')}</p>}
            <p data-testid="launch-cost" style={{ fontSize: 12.5, color: '#666', margin: '12px 0 0' }}>{state.cost}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button type="button" data-testid="launch-go" onClick={() => submit(true)} disabled={Boolean(saving)}
                style={{ fontSize: 13.5, padding: '9px 16px', borderRadius: 8, border: `1px solid ${G}`, background: saving ? '#f4efe2' : G, color: NAVY, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
                {saving === 'launch' ? 'Launching…' : 'Launch challenge'}
              </button>
              <button type="button" data-testid="launch-edit-toggle" onClick={() => setEditing(e => !e)} style={editBtn}>
                {editing ? <><Eye size={14} /> Show it as startups will see it</> : <><Pencil size={14} /> Edit details</>}
              </button>
              <button type="button" data-testid="launch-save" onClick={() => submit(false)} disabled={Boolean(saving)}
                style={{ fontSize: 13, padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: saving ? 'default' : 'pointer' }}>
                {saving === 'draft' ? 'Saving…' : 'Save as draft instead'}
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
            Every startup you shortlisted is already invited or has applied. Shortlist more startups on your Innovation Agent page, then come back.
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

/*
 * A5 "Evaluate this startup with AI": the result on a brief card. The platform's
 * scorer decides the recommendation (the model only suggests), so it is shown in
 * the platform's own words.
 */
export const EVAL_ACTION = {
  shortlist: 'Shortlist it',
  evaluate: 'Worth a closer look',
  reject: 'Pass',
  skip: 'Not enough information to judge',
};

export function EvaluationNote({ evaluation }) {
  if (!evaluation) return null;
  const flags = (evaluation.red_flags || []).slice(0, 2);
  return (
    <div data-testid="ai-evaluation" style={{ fontSize: 12.5, background: '#F6F8FC', border: '1px solid #E3E9F4', borderRadius: 8, padding: '6px 9px', color: '#1a1a1a' }}>
      <b style={{ fontWeight: 600 }}>AI evaluation: {evaluation.overall_score != null ? `${evaluation.overall_score}/5` : 'no score'}</b>
      {evaluation.recommended_action && <span> · {EVAL_ACTION[evaluation.recommended_action] || evaluation.recommended_action}</span>}
      {evaluation.explanation && <span style={{ display: 'block', color: '#444', marginTop: 2 }}>{evaluation.explanation}</span>}
      {flags.length > 0 && <span style={{ display: 'block', color: '#A33', marginTop: 2 }}>Watch out: {flags.join('; ')}</span>}
    </div>
  );
}
