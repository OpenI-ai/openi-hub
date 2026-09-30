/**
 * s123 (30 Sep 2026) — "Ask OpenI" inside the brief (Dentsu prototype).
 *
 * The client asks in their own words ("who does shoppable video for quick
 * commerce?"). OpenI's ask_openi agent turns the question into short searches,
 * searches OpenI's startups by meaning and by words, and the analyst checks
 * each one against the question for this client. The answer IS the startups
 * the analyst kept, each with its reason — no free-text model answer. Nothing
 * fits: it says so, and the question can be added as a priority, so Scout and
 * the nightly crawl keep looking.
 *
 * Used on the client's brief and in Brief Preview (admin, for a client): `load`
 * and `ask` are the API calls; `shortlist` and `addPriority` only on the
 * client's own brief. Always rendered so the page tour can point at it.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessageSquare, Plus, Star } from 'lucide-react';

const G = '#C9A84C';
const NAVY = '#0B1E3F';
const EXAMPLES = ['Who does shoppable video for quick commerce?', 'Startups that cut the cost of producing ad creatives'];

export function answerSummary(a) {
  if (!a) return '';
  if (a.unchecked) return 'OpenI searched, but its analyst could not check the results just now, so none are shown. Please ask again in a few minutes.';
  const n = (a.answer || []).length;
  if (!n) return 'Nothing on OpenI fits this yet.';
  return `${n} startup${n === 1 ? '' : 's'} on OpenI fit${n === 1 ? 's' : ''} this, each checked by OpenI's analyst.`;
}

function Answer({ a, shortlist, addPriority, done, onDone }) {
  return (
    <div data-testid="ask-answer" style={{ marginTop: 10 }}>
      <p style={{ fontSize: 13, color: '#6B5A24', background: '#FBF6EA', borderRadius: 8, padding: '6px 10px', margin: 0 }}>
        <b style={{ fontWeight: 600 }}>“{a.question}”</b> — <span data-testid="ask-summary">{answerSummary(a)}</span>
        {(a.queries || []).length > 0 && <span style={{ display: 'block', fontSize: 12, color: '#8a7a4a' }}>Searched: {a.queries.join(' · ')}</span>}
      </p>
      {!a.unchecked && !(a.answer || []).length && addPriority && (
        <button type="button" data-testid="ask-add-priority" onClick={() => addPriority(a.question)}
          style={{ marginTop: 6, fontSize: 12.5, padding: '5px 10px', borderRadius: 8, border: `1px solid ${G}`, background: '#fff', color: NAVY, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Plus size={13} /> Add it as a priority, so Scout and the nightly crawl keep looking
        </button>
      )}
      {(a.answer || []).length > 0 && (
        <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 6 }}>
          {a.answer.map(s => (
            <li key={s.user_id} data-testid="ask-startup" style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '8px 10px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                <Link to={`/dashboard/startups/${s.user_id}?by=user_id`} style={{ fontWeight: 600, color: NAVY, fontSize: 14 }}>{s.name}</Link>
                <span style={{ fontSize: 12, color: '#888', marginLeft: 6 }}>
                  {[s.sector, s.country, s.relationship, s.match != null ? `${s.match}% match` : null].filter(Boolean).join(' · ')}
                </span>
                {s.tagline && <div style={{ fontSize: 13, color: '#444' }}>{s.tagline}</div>}
                {s.reason && <div style={{ fontSize: 12.5, color: '#6B5A24', marginTop: 2 }}>Why: {s.reason}</div>}
              </div>
              {shortlist && (
                <button type="button" data-testid="ask-shortlist" disabled={done.has(s.user_id)} onClick={async () => {
                  try { await shortlist(s.user_id); onDone(s.user_id); toast.success(`Shortlisted ${s.name}`); } catch (err) { toast.error(err.message || 'Could not shortlist'); }
                }} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 7, border: '1px solid #ddd', background: done.has(s.user_id) ? '#f4efe2' : '#fff',
                  cursor: done.has(s.user_id) ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Star size={12} /> {done.has(s.user_id) ? 'Shortlisted' : 'Shortlist'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AskPanel({ load, ask, shortlist = null, addPriority = null, client = null, id = 'tour-brief-ask' }) {
  const [data, setData] = useState(null);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(null);
  const [done, setDone] = useState(() => new Set());
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => { loadRef.current().then(setData).catch(() => setData({ asks: [] })); }, []);

  const submit = async (e) => {
    e?.preventDefault();
    const q = question.trim();
    if (q.length < 3 || busy) return;
    setBusy(true);
    try {
      const r = await ask(q);
      setCurrent(r);
      setQuestion('');
      setData(d => ({ ...(d || {}), asks: [r, ...((d?.asks) || []).filter(x => x.question.toLowerCase() !== r.question.toLowerCase())].slice(0, 10) }));
    } catch (err) {
      toast.error(err.message || 'OpenI could not answer');
    } finally {
      setBusy(false);
    }
  };

  const earlier = (data?.asks || []).filter(a => !current || a.question.toLowerCase() !== current.question.toLowerCase()).slice(0, 5);
  return (
    <section id={id} data-testid="brief-ask" style={{ marginTop: 16, border: '1px solid #eee', borderRadius: 12, background: '#fff', padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <MessageSquare size={15} color="#8A6A1C" />
        <strong style={{ fontSize: 14, fontWeight: 600 }}>Ask OpenI</strong>
        <span style={{ fontSize: 12, color: '#888' }}>
          Ask in {client ? 'the client\'s' : 'your own'} words. OpenI searches its startups and its analyst checks each one against {client ? 'this client\'s' : 'your'} business.
        </span>
      </div>
      <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <input data-testid="ask-input" value={question} onChange={e => setQuestion(e.target.value)} maxLength={300}
          placeholder={`e.g. ${EXAMPLES[0]}`} aria-label="Your question"
          style={{ flex: '1 1 260px', minWidth: 0, fontSize: 14, padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }} />
        <button type="submit" data-testid="ask-submit" disabled={busy || question.trim().length < 3}
          style={{ fontSize: 13, padding: '8px 14px', borderRadius: 8, border: `1px solid ${G}`, background: busy ? '#f4efe2' : G, color: NAVY, fontWeight: 600,
            cursor: busy || question.trim().length < 3 ? 'default' : 'pointer' }}>
          {busy ? 'Searching…' : 'Ask'}
        </button>
      </form>
      {busy && <p role="status" style={{ fontSize: 12.5, color: '#666', margin: '8px 0 0' }}>Turning your question into searches, searching OpenI's startups and checking each one. This takes up to a minute.</p>}
      {current && <Answer a={current} shortlist={shortlist} addPriority={addPriority} done={done} onDone={id2 => setDone(s => new Set(s).add(id2))} />}
      {earlier.length > 0 && (
        <details data-testid="ask-earlier" style={{ marginTop: 10 }}>
          <summary style={{ fontSize: 12.5, color: '#555', cursor: 'pointer' }}>Earlier questions ({earlier.length})</summary>
          {earlier.map(a => <Answer key={`${a.question}-${a.asked_at || ''}`} a={a} shortlist={shortlist} addPriority={addPriority} done={done} onDone={id2 => setDone(s => new Set(s).add(id2))} />)}
        </details>
      )}
    </section>
  );
}
