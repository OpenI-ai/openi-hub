/**
 * s123 (30 Sep 2026) — the Innovation Agent's inbox, at the top of a company's
 * brief (Phase 1 of the Innovation Agent; Rajeev: "deliver an Innovation agent
 * to our personas starting with Corporates").
 *
 * One ranked list of next moves the agent proposes, from GET /brief/inbox:
 * startups Scout found (shortlist), shortlisted startups to invite to an open
 * challenge, a priority to launch a challenge on, a focus area to add. Each says
 * why and what it costs. Autonomy is "Suggest only": nothing happens without the
 * client's click. "Not now" hides one for 30 days. "Run my agent now" starts a
 * full run (research, priorities, Scout, Strategy map); the list refreshes when
 * it finishes. "Weekly email" turns the Monday "Your next moves" email on or off
 * (Phase 1c; on by default).
 *
 * The page passes the actions it already has (shortlist, the Launch and Invite
 * sheets, add a priority), so the inbox does exactly what the brief does.
 *
 * Phase 4 (s125, 1 Oct 2026; Rajeev: "go ahead with Phase 4"):
 *   - AUTONOMY: "Suggest only" (default) or "Auto: free steps". On Auto the agent
 *     shortlists up to 3 startups Scout found and the analyst kept (each on the
 *     watchlist) and pre-drafts the top challenge after each run, and lists them
 *     under "Done for you" with Undo / Review. It never launches, invites, writes
 *     intros, books meetings, adds priorities or spends credits.
 *   - EVIDENCE: "Why?" under each move opens what it rests on (the analyst's
 *     reason, Scout's search, the startup's profile and website, links).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bot, Clock } from 'lucide-react';
import { ago } from './AgentsPanel';

const G = '#C9A84C';
const NAVY = '#0B1E3F';
const btn = { border: '1px solid #ddd', background: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 12.5, cursor: 'pointer' };
const primary = { ...btn, background: NAVY, borderColor: NAVY, color: '#fff', fontWeight: 600 };

const ACT = { shortlist: 'Shortlist', invite: 'Review and invite', launch: 'Review the challenge', priority: 'Add priority',
  intro: 'Write the intro', meeting: 'Plan the meeting', pilot: 'Start the pilot' };  // Phase 2: stalled pipeline steps
const TRIGGER = { weekly: 'weekly check', priorities: 'after you changed your priorities', website: 'after you changed your website', manual: 'you asked' };

export function agentStatusText(agent) {
  if (!agent) return '';
  if (agent.running) return 'Your agent is working now: reading your website and news, searching for startups and updating your Strategy map.';
  if (!agent.ran_at) return 'Your agent runs every Monday and whenever you change your priorities.';
  return `Last run ${ago(agent.ran_at)}${TRIGGER[agent.trigger] ? ` (${TRIGGER[agent.trigger]})` : ''}. It runs again every Monday and whenever you change your priorities.`;
}

const AUTO_EXPLAIN = 'On Auto, after each run your agent also does the free steps you can undo: it shortlists up to 3 startups it found and the analyst checked (each goes on your watchlist), and drafts a challenge for your top priority. It never launches a challenge, invites, writes intros, books meetings, adds priorities or spends credits: those always wait for your click.';

/** One piece of evidence: plain text, an OpenI page (Link) or an outside page (new tab). */
function EvidenceLine({ e }) {
  if (!e.url) return <li>{e.text}</li>;
  if (e.url.startsWith('/')) return <li><Link to={e.url} style={{ color: '#8A6A1C' }}>{e.text}</Link></li>;
  return <li><a href={e.url} target="_blank" rel="noopener noreferrer" style={{ color: '#8A6A1C' }}>{e.text} ↗</a></li>;
}

function Evidence({ items, testid = 'inbox-evidence' }) {
  const [open, setOpen] = useState(false);
  if (!items?.length) return null;
  return (
    <div style={{ marginTop: 3 }}>
      <button type="button" data-testid={`${testid}-toggle`} onClick={() => setOpen(o => !o)} aria-expanded={open ? 'true' : 'false'}
        style={{ border: 0, background: 'transparent', color: '#8A6A1C', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: 12 }}>
        {open ? 'Hide why' : 'Why?'}</button>
      {open && (
        <ul data-testid={testid} style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 12, color: '#555', display: 'grid', gap: 2 }}>
          {items.map((e, i) => <EvidenceLine key={i} e={e} />)}
        </ul>
      )}
    </div>
  );
}

/** Phase 4: what the agent did on its own (Auto), newest first, each with Undo or Review. */
function DoneForYou({ items, onUndo, onReview }) {
  if (!items?.length) return null;
  return (
    <div data-testid="agent-done" style={{ marginTop: 12, borderTop: '1px dashed #e5d9b6', paddingTop: 10 }}>
      <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>Done for you</div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
        {items.slice(0, 8).map((d, i) => (
          <li key={`${d.kind}-${d.startup_user_id || d.subject}-${i}`} data-testid="agent-done-item" data-kind={d.kind}
            style={{ fontSize: 12.5, color: '#444', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {d.kind === 'shortlist' ? (
              <>
                <span style={{ flex: '1 1 260px', textDecoration: d.undone ? 'line-through' : 'none' }}>
                  Shortlisted <b>{d.name}</b>{d.priority ? ` for "${d.priority}"` : ''}{d.watchlist ? `, added to ${d.watchlist}` : ''}
                </span>
                {d.undone ? <span style={{ color: '#888' }}>Undone</span>
                  : <button type="button" data-testid="agent-done-undo" style={btn} onClick={() => onUndo(d)}>Undo</button>}
              </>
            ) : (
              <>
                <span style={{ flex: '1 1 260px' }}>Drafted a challenge on <b>{d.label}</b>. Not published.</span>
                <button type="button" data-testid="agent-done-review" style={btn} onClick={() => onReview(d)}>Review</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AgentInbox({ load, snooze, run, saveSettings, refreshKey = 0, onShortlist, onLaunch, onInvite, onAddPriority, onEngage }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(null);

  const fetchInbox = useCallback(() => load()
    .then((r) => { setData(r); setError(false); return r; })
    .catch(() => { setError(true); return null; }), [load]);

  useEffect(() => { fetchInbox(); }, [fetchInbox, refreshKey]);

  // While the agent works, follow it; the list refreshes when it finishes.
  const running = !!data?.agent?.running;
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(fetchInbox, 5000);
    return () => clearInterval(t);
  }, [running, fetchInbox]);

  const act = async (item) => {
    if (item.kind === 'launch') return onLaunch(item.offer);
    if (item.kind === 'invite') return onInvite(item.offer);
    if (['intro', 'meeting', 'pilot'].includes(item.kind)) return onEngage(item.offer);
    setBusy(item.id);
    try {
      if (item.kind === 'shortlist') await onShortlist({ user_id: item.startup_user_id, name: item.name, shortlisted: false, priority_label: item.priority });
      if (item.kind === 'priority') await onAddPriority({ label: item.label });
      await fetchInbox();
    } finally {
      setBusy(null);
    }
    return undefined;
  };

  const notNow = async (item) => {
    setData(d => ({ ...d, items: d.items.filter(i => i.id !== item.id) }));
    try { await snooze(item.id); } catch { /* back on the next load */ }
    fetchInbox();
  };

  const runNow = async () => {
    try {
      await run();
      toast.success('Your agent is on it. Its next moves appear here when it finishes (a few minutes).');
      fetchInbox();
    } catch (err) {
      toast.error(err.message || 'Could not start your agent.');
    }
  };

  // Phase 4: autonomy. Switching ON explains first; switching back is immediate.
  const autonomy = data?.agent?.settings?.autonomy || data?.agent?.autonomy || 'suggest';
  const setAutonomy = async (next) => {
    if (next === autonomy) return;
    if (next === 'auto' && !window.confirm(`${AUTO_EXPLAIN}\n\nTurn on Auto?`)) return;
    try {
      const r = await saveSettings({ autonomy: next });
      setData(d => ({ ...d, agent: { ...d.agent, autonomy: r.settings.autonomy, settings: r.settings } }));
      toast.success(r.settings.autonomy === 'auto' ? 'Auto on: after its next run your agent does the free steps and lists them under "Done for you".' : 'Suggest only: your agent waits for your click.');
    } catch (err) {
      toast.error(err.message || 'Could not save.');
    }
  };
  const undo = async (d) => {
    try {
      await onShortlist({ user_id: d.startup_user_id, name: d.name, shortlisted: true, priority_label: d.priority });
      await fetchInbox();
    } catch (err) {
      toast.error(err.message || 'Could not undo that.');
    }
  };
  // The inbox's own launch offer carries the cost line the sheet shows; fall back to the essentials.
  const review = d => onLaunch((data?.items || []).find(i => i.kind === 'launch' && i.subject === d.subject)?.offer
    || { key: 'launch_challenge', subject: d.subject, label: d.label, cost: null, last: null });

  // Phase 1c: the weekly "Your next moves" email (on by default; the client turns it off here).
  const weekly = data?.agent?.settings?.weekly_email !== false;
  const toggleEmail = async () => {
    try {
      const r = await saveSettings({ weekly_email: !weekly });
      setData(d => ({ ...d, agent: { ...d.agent, settings: r.settings } }));
      toast.success(r.settings.weekly_email ? 'Weekly email on: your agent writes on Mondays when it has something for you.' : 'Weekly email off.');
    } catch (err) {
      toast.error(err.message || 'Could not save.');
    }
  };

  const items = data?.items || [];
  const agent = data?.agent;
  return (
    <section id="tour-brief-inbox" data-testid="agent-inbox" style={{ marginTop: 16, background: '#fff', border: `1px solid ${G}`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Bot size={16} color={NAVY} />
        <strong style={{ fontSize: 15 }}>Your Innovation Agent: next moves</strong>
        {saveSettings && agent ? (
          <span role="group" aria-label="What your agent may do on its own" data-testid="agent-autonomy" data-value={autonomy}
            style={{ display: 'inline-flex', border: `1px solid ${G}`, borderRadius: 999, overflow: 'hidden', fontSize: 11.5 }}>
            {[['suggest', 'Suggest only', 'The agent proposes; nothing happens without your click.'], ['auto', 'Auto: free steps', AUTO_EXPLAIN]].map(([v, label, title]) => (
              <button key={v} type="button" data-testid={`agent-autonomy-${v}`} aria-pressed={autonomy === v ? 'true' : 'false'} title={title}
                onClick={() => setAutonomy(v)}
                style={{ border: 0, padding: '2px 9px', cursor: 'pointer', background: autonomy === v ? '#FBF6EA' : '#fff',
                  color: autonomy === v ? '#6B5A24' : '#888', fontWeight: autonomy === v ? 700 : 500 }}>{label}</button>
            ))}
          </span>
        ) : (
          <span style={{ fontSize: 11.5, color: '#6B5A24', background: '#FBF6EA', borderRadius: 999, padding: '2px 8px' }}
            title="The agent proposes; nothing happens without your click.">Suggest only</span>
        )}
        <button type="button" data-testid="agent-run" style={{ ...btn, marginLeft: 'auto' }} onClick={runNow}
          disabled={!agent || running || !!agent.next_manual_at}
          title={agent?.next_manual_at ? 'Your agent ran a few minutes ago.' : 'Research, priorities, Scout and your Strategy map, now'}>
          {running ? 'Working…' : 'Run my agent now'}</button>
      </div>
      <p data-testid="agent-status" style={{ fontSize: 12.5, color: '#666', margin: '6px 0 10px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <Clock size={12} /> {error ? 'Could not load your next moves just now.' : agentStatusText(agent)}
        {saveSettings && agent && (
          <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            Weekly email: <strong data-testid="agent-email-state">{weekly ? 'On' : 'Off'}</strong>{' '}
            <button type="button" data-testid="agent-email-toggle" onClick={toggleEmail}
              style={{ border: 0, background: 'transparent', color: '#8A6A1C', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: 12.5 }}>
              {weekly ? 'Turn off' : 'Turn on'}</button>
          </span>
        )}
      </p>
      {data && !items.length && (
        <p data-testid="inbox-empty" style={{ fontSize: 13.5, color: '#555', margin: 0 }}>
          Nothing needs you right now. Your agent looks again every Monday, and whenever you change your priorities.
        </p>
      )}
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {items.map(item => (
          <li key={item.id} data-testid="inbox-item" data-kind={item.kind}
            style={{ border: '1px solid #eee', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px', minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
              <div style={{ fontSize: 12.5, color: '#444', marginTop: 2 }}>{item.why}</div>
              {item.cost && <div style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>{item.cost}</div>}
              <Evidence items={item.evidence} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" data-testid="inbox-act" style={primary} disabled={busy === item.id} onClick={() => act(item)}>
                {busy === item.id ? 'Working…' : (item.kind === 'launch' && item.drafted ? 'Review the draft' : ACT[item.kind] || 'Open')}</button>
              <button type="button" data-testid="inbox-snooze" style={btn} onClick={() => notNow(item)} title="Hide this for 30 days">Not now</button>
            </div>
          </li>
        ))}
      </ol>
      <DoneForYou items={agent?.done_for_you} onUndo={undo} onReview={review} />
    </section>
  );
}
