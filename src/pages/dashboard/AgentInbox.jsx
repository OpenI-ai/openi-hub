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
 * it finishes.
 *
 * The page passes the actions it already has (shortlist, the Launch and Invite
 * sheets, add a priority), so the inbox does exactly what the brief does.
 */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bot, Clock } from 'lucide-react';
import { ago } from './AgentsPanel';

const G = '#C9A84C';
const NAVY = '#0B1E3F';
const btn = { border: '1px solid #ddd', background: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 12.5, cursor: 'pointer' };
const primary = { ...btn, background: NAVY, borderColor: NAVY, color: '#fff', fontWeight: 600 };

const ACT = { shortlist: 'Shortlist', invite: 'Review and invite', launch: 'Review the challenge', priority: 'Add priority' };
const TRIGGER = { weekly: 'weekly check', priorities: 'after you changed your priorities', website: 'after you changed your website', manual: 'you asked' };

export function agentStatusText(agent) {
  if (!agent) return '';
  if (agent.running) return 'Your agent is working now: reading your website and news, searching for startups and updating your Strategy map.';
  if (!agent.ran_at) return 'Your agent runs every Monday and whenever you change your priorities.';
  return `Last run ${ago(agent.ran_at)}${TRIGGER[agent.trigger] ? ` (${TRIGGER[agent.trigger]})` : ''}. It runs again every Monday and whenever you change your priorities.`;
}

export default function AgentInbox({ load, snooze, run, refreshKey = 0, onShortlist, onLaunch, onInvite, onAddPriority }) {
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

  const items = data?.items || [];
  const agent = data?.agent;
  return (
    <section id="tour-brief-inbox" data-testid="agent-inbox" style={{ marginTop: 16, background: '#fff', border: `1px solid ${G}`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Bot size={16} color={NAVY} />
        <strong style={{ fontSize: 15 }}>Your Innovation Agent: next moves</strong>
        <span style={{ fontSize: 11.5, color: '#6B5A24', background: '#FBF6EA', borderRadius: 999, padding: '2px 8px' }}
          title="The agent proposes; nothing happens without your click.">Suggest only</span>
        <button type="button" data-testid="agent-run" style={{ ...btn, marginLeft: 'auto' }} onClick={runNow}
          disabled={!agent || running || !!agent.next_manual_at}
          title={agent?.next_manual_at ? 'Your agent ran a few minutes ago.' : 'Research, priorities, Scout and your Strategy map, now'}>
          {running ? 'Working…' : 'Run my agent now'}</button>
      </div>
      <p data-testid="agent-status" style={{ fontSize: 12.5, color: '#666', margin: '6px 0 10px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <Clock size={12} /> {error ? 'Could not load your next moves just now.' : agentStatusText(agent)}
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
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" data-testid="inbox-act" style={primary} disabled={busy === item.id} onClick={() => act(item)}>
                {busy === item.id ? 'Working…' : ACT[item.kind] || 'Open'}</button>
              <button type="button" data-testid="inbox-snooze" style={btn} onClick={() => notNow(item)} title="Hide this for 30 days">Not now</button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
