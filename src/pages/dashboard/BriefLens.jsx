/**
 * s122 (29 Sep 2026) — the account brief LENS in Brief Preview (admins first).
 *
 * For each startup the brief recommends, the `account_brief_lens` agent says
 * what it does for the client — Grow revenue / Cut cost / Venture into adjacent
 * markets — and how to work with it — Partner with / Source from / Invest in
 * or acquire — plus one line on the concrete move. Rajeev (29 Sep): "startups
 * that can enhance your revenues and bring down the cost plus what can you do
 * with these startups"; CEOs "want to know where to venture out in adjacent
 * industries through startup acquisition"; "top notch UI/UX … message is clear".
 *
 * The message, in reading order: a STRATEGY MAP (outcome × action, each cell
 * clickable), then the startups grouped by outcome, each with "Your move".
 * A startup the agent could not place gets no tag (never forced into a bucket).
 */
import { useState } from 'react';
import { TrendingUp, Gauge, Compass, Loader2, Layers, ArrowRight, AlertTriangle, X } from 'lucide-react';

export const OUTCOME_STYLE = {
  grow: { color: '#1F7A4D', bg: '#EAF6EF', border: '#BFE3CD', Icon: TrendingUp, blurb: 'Adds to revenue in the current business: new products, channels or customers.' },
  cut: { color: '#1D5C8C', bg: '#EAF2F9', border: '#BFD7EA', Icon: Gauge, blurb: 'Lowers cost, saves time or reduces risk in how the business runs today.' },
  venture: { color: '#7A3E9D', bg: '#F4EDF9', border: '#DCC6EA', Icon: Compass, blurb: 'Opens an adjacent market: a startup to invest in or acquire to get there.' },
};
const ACTION_BLURB = { partner: 'pilot, integrate, co-sell', source: 'buy or license it', invest: 'take a stake or acquire' };
const NAVY = '#152838';
const btn = { fontSize: 13, padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e2e2', background: '#fff', color: '#333', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const labelOf = (list, key) => (list || []).find(x => x.key === key)?.label || key;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Before the lens has run: one clear question and one button. */
function LensInvite({ client, loading, onRun }) {
  return (
    <div data-testid="lens-invite" style={{ marginTop: 16, borderRadius: 14, padding: '16px 18px', background: 'linear-gradient(135deg, #152838 0%, #1F3A50 100%)', color: '#EEF2F5', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 380px', minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>What can these startups do for {client}?</div>
        <div style={{ fontSize: 13, color: '#C9D3DB', marginTop: 4, lineHeight: 1.5 }}>
          OpenI's analyst reads every startup against {client}'s business: does it <b style={{ color: '#9FE0BC' }}>grow revenue</b>, <b style={{ color: '#A9CDEB' }}>cut cost or improve efficiency</b> or open an <b style={{ color: '#D9B8EE' }}>adjacent market</b>, and should {client} partner with it, source from it or invest in it?
        </div>
      </div>
      <button type="button" data-testid="lens-run" onClick={onRun} disabled={loading}
        style={{ ...btn, background: '#D0A848', borderColor: '#D0A848', color: NAVY, fontWeight: 600, padding: '10px 16px', fontSize: 14 }}>
        {loading ? <Loader2 className="animate-spin" size={15} /> : <Layers size={15} />}
        {loading ? 'Reading each startup…' : 'Show the strategy map'}
      </button>
    </div>
  );
}

/** Outcome × action, with counts. A cell filters the startups below. */
function StrategyMap({ lens, client, filter, onPick }) {
  const cell = { padding: '10px 12px', borderTop: '1px solid #eee', textAlign: 'center' };
  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table data-testid="lens-map" style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>For {client}, this startup would…</th>
            {lens.actions.map(a => (
              <th key={a.key} style={{ padding: '8px 12px', fontWeight: 600, color: '#333' }}>
                {a.label}<div style={{ fontSize: 11, fontWeight: 400, color: '#999' }}>{ACTION_BLURB[a.key]}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lens.outcomes.map(o => {
            const st = OUTCOME_STYLE[o.key];
            return (
              <tr key={o.key}>
                <th scope="row" style={{ ...cell, textAlign: 'left', fontWeight: 600, color: st.color }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><st.Icon size={14} /> {o.label}</span>
                  <div style={{ fontSize: 11.5, fontWeight: 400, color: '#777', marginTop: 2, maxWidth: 260 }}>{st.blurb}</div>
                </th>
                {lens.actions.map(a => {
                  const n = lens.summary.grid[o.key][a.key] || 0;
                  const on = filter && filter.outcome === o.key && filter.action === a.key;
                  return (
                    <td key={a.key} style={cell}>
                      {n > 0 ? (
                        <button type="button" data-testid={`lens-cell-${o.key}-${a.key}`} aria-pressed={on ? 'true' : 'false'}
                          onClick={() => onPick(on ? null : { outcome: o.key, action: a.key })}
                          title={`Show the ${plural(n, 'startup')} to ${a.label.toLowerCase()} to ${o.label.toLowerCase()}`}
                          style={{ minWidth: 56, padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 18, fontWeight: 700,
                            border: `1.5px solid ${on ? st.color : st.border}`, background: on ? st.color : st.bg, color: on ? '#fff' : st.color }}>
                          {n}
                        </button>
                      ) : <span style={{ color: '#ccc', fontSize: 16 }} aria-label="none">·</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The strategy map panel, or the invitation to run it. */
export function LensBar({ lens, loading, onRun, view, setView, client, filter, setFilter }) {
  if (!lens) return <LensInvite client={client} loading={loading} onRun={onRun} />;
  const pick = (f) => { setFilter(f); if (f) setView('outcome'); };
  return (
    <div data-testid="lens-summary" style={{ marginTop: 16, border: '1px solid #e8e8e8', borderRadius: 14, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '14px 16px 6px', display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0, color: NAVY }}>Strategy map for {client}</h2>
        <span style={{ fontSize: 12.5, color: '#888' }}>{lens.tagged} of {plural(lens.total, 'startup')} placed · click a number to see those startups</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6 }}>
          {[['outcome', 'By outcome'], ['priority', 'By priority']].map(([id, text]) => (
            <button key={id} type="button" data-testid={`lens-view-${id}`} aria-pressed={view === id ? 'true' : 'false'} onClick={() => { setView(id); if (id === 'priority') setFilter(null); }}
              style={{ ...btn, padding: '4px 10px', ...(view === id ? { background: NAVY, color: '#fff', borderColor: NAVY } : {}) }}>{text}</button>
          ))}
        </span>
      </div>
      {/* The headline, in words: how many startups for each outcome. */}
      <div style={{ padding: '0 16px 10px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {lens.outcomes.map(o => {
          const st = OUTCOME_STYLE[o.key];
          return (
            <span key={o.key} style={{ background: st.bg, color: st.color, borderRadius: 999, padding: '3px 11px', fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <st.Icon size={13} /> {lens.summary.outcomes[o.key] || 0} {o.label}</span>
          );
        })}
      </div>
      <StrategyMap lens={lens} client={client} filter={filter} onPick={pick} />
      {lens.note && (
        <div style={{ margin: '0 16px 14px', padding: '8px 12px', borderRadius: 10, background: '#FBF6EA', color: '#7A5A10', fontSize: 12.5, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertTriangle size={14} /> {lens.note}
        </div>
      )}
      {!lens.note && <div style={{ height: 8 }} />}
    </div>
  );
}

/** s123: the map's counts, recomputed after a correction (same shape as the API's `summary`). */
export function summariseLens(tags, lens) {
  const outcomes = Object.fromEntries(lens.outcomes.map(o => [o.key, 0]));
  const grid = Object.fromEntries(lens.outcomes.map(o => [o.key, Object.fromEntries(lens.actions.map(a => [a.key, 0]))]));
  for (const t of Object.values(tags)) { if (grid[t.outcome]) { outcomes[t.outcome]++; grid[t.outcome][t.action]++; } }
  return { outcomes, grid };
}

/**
 * s123 (Rajeev: "yes" to one click on the strategy map) — pick the right outcome
 * and action for a startup; the map learns from it for this client and others.
 */
function CorrectTag({ tag, lens, onSave, onCancel }) {
  const [outcome, setOutcome] = useState(tag?.outcome || 'grow');
  const [action, setAction] = useState(tag?.action || 'partner');
  const [busy, setBusy] = useState(false);
  const sel = { fontSize: 12.5, padding: '4px 6px', borderRadius: 6, border: '1px solid #ddd', background: '#fff' };
  return (
    <div data-testid="lens-correct" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
      <select aria-label="Outcome" value={outcome} onChange={e => setOutcome(e.target.value)} style={sel}>
        {lens.outcomes.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
      <select aria-label="Action" value={action} onChange={e => setAction(e.target.value)} style={sel}>
        {lens.actions.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
      </select>
      <button type="button" disabled={busy} onClick={async () => { setBusy(true); try { await onSave(outcome, action); } finally { setBusy(false); } }}
        style={{ ...btn, padding: '3px 10px', fontSize: 12.5, background: NAVY, color: '#fff', borderColor: NAVY }}>{busy ? 'Saving…' : 'Apply'}</button>
      <button type="button" onClick={onCancel} style={{ ...btn, padding: '3px 10px', fontSize: 12.5 }}>Cancel</button>
    </div>
  );
}

/** Under a card: outcome and action, then the move in plain words. `onCorrect` (admin) adds "Change". */
export function LensTag({ tag, lens, onCorrect = null }) {
  const [editing, setEditing] = useState(false);
  if (!tag) return null;
  const st = OUTCOME_STYLE[tag.outcome];
  return (
    <div data-testid="lens-tag" data-outcome={tag.outcome} data-action={tag.action}
      style={{ border: `1px solid ${st.border}`, borderTop: `3px solid ${st.color}`, background: st.bg, borderRadius: '0 0 12px 12px', padding: '9px 12px 10px', fontSize: 12.5, marginTop: -6 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', color: st.color, fontWeight: 600 }}>
        <st.Icon size={13} /> {labelOf(lens.outcomes, tag.outcome)}
        <ArrowRight size={12} style={{ opacity: 0.6 }} /> {labelOf(lens.actions, tag.action)}
        {tag.corrected && <span data-testid="lens-corrected" title="Set by the OpenI team" style={{ fontSize: 11, fontWeight: 500, color: '#777' }}>· checked by OpenI</span>}
        {onCorrect && !editing && (
          <button type="button" data-testid="lens-change" onClick={() => setEditing(true)}
            style={{ marginLeft: 'auto', border: 0, background: 'transparent', color: '#555', fontSize: 12, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>Change</button>
        )}
      </div>
      {editing && <CorrectTag tag={tag} lens={lens} onCancel={() => setEditing(false)}
        onSave={async (o, a) => { await onCorrect(o, a); setEditing(false); }} />}
      {tag.move && (
        <div style={{ marginTop: 5, color: '#222', lineHeight: 1.45 }}>
          <span style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#777', fontWeight: 600, marginRight: 6 }}>Your move</span>
          {tag.move}
        </div>
      )}
    </div>
  );
}

/**
 * The brief regrouped: one block per outcome (with what it means), startups
 * sorted by action, each once (a startup in two priorities shows under the
 * first). `filter` narrows to one map cell. `renderCard` draws the card the
 * same way the priority view does.
 */
export function OutcomeView({ brief, lens, renderCard, filter, clearFilter }) {
  const seen = new Set();
  const cards = [];
  for (const s of brief.sections) {
    for (const it of s.items) {
      if (it.type !== 'startup' || seen.has(it.user_id)) continue;
      seen.add(it.user_id);
      cards.push({ it, s });
    }
  }
  const order = Object.fromEntries(lens.actions.map((a, i) => [a.key, i]));
  const tagOf = c => lens.lens[c.it.user_id];
  const unplaced = filter ? [] : cards.filter(c => !tagOf(c));
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(290px, 100%), 1fr))', gap: 14 };
  return (
    <div data-testid="lens-outcomes">
      {filter && (
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555' }}>
          Showing startups to <b>{labelOf(lens.actions, filter.action).toLowerCase()}</b> that <b>{labelOf(lens.outcomes, filter.outcome).toLowerCase()}</b>
          <button type="button" onClick={clearFilter} data-testid="lens-clear" style={{ ...btn, padding: '2px 8px', fontSize: 12 }}><X size={12} /> Show all</button>
        </div>
      )}
      {lens.outcomes.filter(o => !filter || filter.outcome === o.key).map(o => {
        const st = OUTCOME_STYLE[o.key];
        const list = cards.filter(c => tagOf(c)?.outcome === o.key && (!filter || tagOf(c).action === filter.action))
          .sort((a, b) => order[tagOf(a).action] - order[tagOf(b).action]);
        if (!list.length) return null;
        return (
          <section key={o.key} data-testid={`lens-group-${o.key}`} style={{ marginTop: 26 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', borderBottom: `2px solid ${st.border}`, paddingBottom: 8, marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: st.color, display: 'flex', alignItems: 'center', gap: 7 }}>
                <st.Icon size={17} /> {o.label}</h2>
              <span style={{ fontSize: 12.5, color: '#666' }}>{st.blurb}</span>
              <span style={{ fontSize: 12.5, color: '#999', marginLeft: 'auto' }}>{plural(list.length, 'startup')}</span>
            </div>
            <div style={grid}>{list.map(c => renderCard(c.it, c.s))}</div>
          </section>
        );
      })}
      {unplaced.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <div style={{ borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#777' }}>Not placed by the lens</h2>
            <span style={{ fontSize: 12.5, color: '#999' }}>Still a match for a priority, but the analyst could not say clearly how it would help.</span>
          </div>
          <div style={grid}>{unplaced.map(c => renderCard(c.it, c.s))}</div>
        </section>
      )}
    </div>
  );
}
